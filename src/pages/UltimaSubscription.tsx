import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { subscriptionApi } from '@/api/subscription';
import { useCurrency } from '@/hooks/useCurrency';
import type { Tariff, TariffPeriod } from '@/types';

const Dot = ({ active = false }: { active?: boolean }) => (
  <span
    className={
      active
        ? 'h-5 w-5 rounded-full border-2 border-emerald-400'
        : 'h-2 w-2 rounded-full bg-white/35'
    }
  />
);

export function UltimaSubscription() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currencySymbol } = useCurrency();

  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [selectedPeriodDays, setSelectedPeriodDays] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const didInitDevice = useRef(false);

  const { data: purchaseOptions, isLoading } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: subscriptionApi.getPurchaseOptions,
    refetchOnMount: 'always',
  });

  const tariffs = useMemo(() => {
    if (!purchaseOptions || purchaseOptions.sales_mode !== 'tariffs') return [] as Tariff[];
    return purchaseOptions.tariffs.filter((tariff) => tariff.is_available);
  }, [purchaseOptions]);

  const tariffsByDevice = useMemo(() => {
    const map = new Map<number, Tariff[]>();
    tariffs.forEach((tariff) => {
      const limit = Math.max(1, tariff.device_limit);
      const list = map.get(limit) ?? [];
      list.push(tariff);
      map.set(limit, list);
    });
    return map;
  }, [tariffs]);

  const deviceLimits = useMemo(() => {
    return [...tariffsByDevice.keys()].sort((a, b) => a - b);
  }, [tariffsByDevice]);

  const closestDeviceIndex = useMemo(() => {
    if (!deviceLimits.length) return 0;
    const current = tariffs.find((tariff) => tariff.is_current) ?? tariffs[0];
    if (!current) return 0;
    const currentLimit = Math.max(1, current.device_limit);
    const exact = deviceLimits.findIndex((value) => value === currentLimit);
    if (exact >= 0) return exact;
    let best = 0;
    let bestDistance = Infinity;
    deviceLimits.forEach((limit, index) => {
      const distance = Math.abs(limit - currentLimit);
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    });
    return best;
  }, [tariffs, deviceLimits]);

  useEffect(() => {
    if (!deviceLimits.length) {
      setSelectedDeviceIndex(0);
      return;
    }
    if (!didInitDevice.current) {
      didInitDevice.current = true;
      setSelectedDeviceIndex(closestDeviceIndex);
      return;
    }
    setSelectedDeviceIndex((prev) => Math.min(Math.max(0, prev), deviceLimits.length - 1));
  }, [deviceLimits, closestDeviceIndex]);

  const selectedDeviceLimit =
    deviceLimits[Math.min(selectedDeviceIndex, Math.max(0, deviceLimits.length - 1))] ?? 1;

  const selectedTariffs = useMemo(() => {
    if (!tariffs.length) return null;
    const exact = tariffsByDevice.get(selectedDeviceLimit);
    if (exact?.length) return exact;
    const nearestLimit =
      [...deviceLimits].sort(
        (a, b) => Math.abs(a - selectedDeviceLimit) - Math.abs(b - selectedDeviceLimit),
      )[0] ?? selectedDeviceLimit;
    return tariffsByDevice.get(nearestLimit) ?? null;
  }, [tariffs, tariffsByDevice, deviceLimits, selectedDeviceLimit]);

  const selectedTariff = useMemo(() => {
    if (!selectedTariffs?.length) return null;
    return selectedTariffs.find((tariff) => tariff.is_current) ?? selectedTariffs[0];
  }, [selectedTariffs]);

  type DisplayPeriod = TariffPeriod & { tariffId: number };

  const allPeriodsForDevice = useMemo(() => {
    if (!selectedTariffs?.length) return [] as DisplayPeriod[];
    const bestByDays = new Map<number, DisplayPeriod>();
    selectedTariffs.forEach((tariff) => {
      tariff.periods
        .filter((period) => period.days > 0)
        .forEach((period) => {
          const candidate: DisplayPeriod = { ...period, tariffId: tariff.id };
          const existing = bestByDays.get(period.days);
          if (!existing || candidate.price_kopeks < existing.price_kopeks) {
            bestByDays.set(period.days, candidate);
          }
        });
    });
    return [...bestByDays.values()].sort(
      (a, b) => a.months - b.months || a.days - b.days || a.price_kopeks - b.price_kopeks,
    );
  }, [selectedTariffs]);

  const displayPeriods = useMemo(() => {
    if (!allPeriodsForDevice.length) return [] as DisplayPeriod[];
    const all = allPeriodsForDevice;

    const pick = (months: number): DisplayPeriod | null => {
      const exact = all.find((period) => period.months === months);
      if (exact) return exact;
      const targetDays = months * 30;
      return (
        [...all].sort((a, b) => Math.abs(a.days - targetDays) - Math.abs(b.days - targetDays))[0] ??
        null
      );
    };

    const usedDays = new Set<number>();
    const picked: DisplayPeriod[] = [];

    [1, 3, 6, 12].forEach((months) => {
      const period = pick(months);
      if (!period || usedDays.has(period.days)) return;
      usedDays.add(period.days);
      picked.push(period);
    });

    if (picked.length) return picked;
    return [...all].sort((a, b) => a.days - b.days).slice(0, 4);
  }, [allPeriodsForDevice]);

  const selectedPeriod = useMemo(() => {
    if (!displayPeriods.length) return null;
    if (selectedPeriodDays) {
      return (
        displayPeriods.find((period) => period.days === selectedPeriodDays) ?? displayPeriods[0]
      );
    }
    return displayPeriods.find((period) => period.months === 6) ?? displayPeriods[0];
  }, [displayPeriods, selectedPeriodDays]);

  useEffect(() => {
    if (!displayPeriods.length) {
      setSelectedPeriodDays(null);
      return;
    }
    if (selectedPeriodDays && displayPeriods.some((period) => period.days === selectedPeriodDays)) {
      return;
    }
    setSelectedPeriodDays(
      displayPeriods.find((period) => period.months === 6)?.days ?? displayPeriods[0].days,
    );
  }, [displayPeriods, selectedPeriodDays]);

  const selectedTariffIdForPurchase = selectedPeriod?.tariffId ?? selectedTariff?.id ?? null;

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTariffIdForPurchase || !selectedPeriod) throw new Error('No tariff selected');
      return subscriptionApi.purchaseTariff(selectedTariffIdForPurchase, selectedPeriod.days);
    },
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['subscription'] }),
        queryClient.invalidateQueries({ queryKey: ['purchase-options'] }),
        queryClient.invalidateQueries({ queryKey: ['balance'] }),
      ]);
      navigate('/');
    },
    onError: (err: { response?: { data?: { detail?: string; message?: string } } }) => {
      setError(err.response?.data?.detail || err.response?.data?.message || t('common.error'));
    },
  });

  if (isLoading) return <div className="h-[100dvh] w-full bg-[#08201f]" />;

  if (!selectedTariff || !selectedPeriod) {
    return (
      <div className="flex h-[100dvh] items-center justify-center text-dark-200">
        {t('subscription.noTariffsAvailable', { defaultValue: 'Тарифы недоступны' })}
      </div>
    );
  }

  const formatPrice = (kopeks: number) => {
    const rubles = kopeks / 100;
    const value = Number.isInteger(rubles) ? String(rubles) : rubles.toFixed(2);
    return `${value} ${currencySymbol}`;
  };

  const periodLabel = (period: TariffPeriod) => {
    if (period.months === 1) return '1 месяц';
    if (period.months === 3) return '3 месяца';
    if (period.months === 6) return '6 месяцев';
    if (period.months === 12) return '1 год';
    if (period.months > 0) return `${period.months} мес`;
    return `${period.days} дней`;
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_78%_50%,rgba(19,176,132,0.35),rgba(5,20,22,0.98)_58%)] px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-4">
      <div className="mx-auto flex h-full max-w-md flex-col">
        <header className="mb-3">
          <h1 className="text-[42px] font-semibold leading-[0.95] text-white">Покупка подписки</h1>
          <p className="mt-2 text-[16px] leading-tight text-white/75">
            Подключайте больше устройств и пользуйтесь сервисом вместе с друзьями и близкими
          </p>
        </header>

        <section className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="mb-3 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/90">
              {selectedDeviceLimit}
            </span>
            <div>
              <p className="text-[22px] font-medium leading-none text-white">Устройство</p>
              <p className="mt-1 text-[14px] text-white/70">Одновременно в подписке</p>
            </div>
          </div>

          <div className="rounded-2xl bg-black/15 p-3">
            <div className="mb-2 h-1 w-full rounded-full bg-white/20" />
            <div className="flex items-center justify-between px-2">
              {deviceLimits.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`devices-${index + 1}`}
                  onClick={() => setSelectedDeviceIndex(index)}
                  className="inline-flex"
                >
                  <Dot active={index === selectedDeviceIndex} />
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, deviceLimits.length - 1)}
              step={1}
              value={selectedDeviceIndex}
              onChange={(event) => setSelectedDeviceIndex(Number(event.target.value))}
              className="mt-3 h-1 w-full cursor-pointer appearance-none rounded-full bg-transparent accent-emerald-400"
              aria-label="devices-slider"
            />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          {displayPeriods.map((period) => {
            const active = period.days === selectedPeriod.days;
            return (
              <button
                key={period.days}
                type="button"
                onClick={() => {
                  setSelectedPeriodDays(period.days);
                }}
                className={`rounded-3xl border p-4 text-left transition ${
                  active
                    ? 'border-emerald-400 bg-[#0a2522] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                    : 'border-white/12 bg-black/20'
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[22px] font-medium text-white">{periodLabel(period)}</span>
                  {active && <span className="text-emerald-300">★</span>}
                </div>
                <p className="text-[42px] font-semibold leading-none text-white">
                  {formatPrice(period.price_kopeks)}
                </p>
                {period.original_price_kopeks &&
                period.original_price_kopeks > period.price_kopeks ? (
                  <p className="mt-1 text-[14px] text-white/70">
                    {period.price_per_month_kopeks > 0
                      ? `${formatPrice(period.price_per_month_kopeks)} / мес`
                      : ''}
                  </p>
                ) : null}
              </button>
            );
          })}
        </section>

        <div className="mt-auto pt-4">
          {error && <p className="mb-3 text-center text-[18px] text-red-300">{error}</p>}
          <button
            type="button"
            onClick={() => purchaseMutation.mutate()}
            disabled={purchaseMutation.isPending}
            className="flex w-full items-center justify-between rounded-full border border-[#52ecc6]/40 bg-[#12cd97] px-6 py-4 text-[20px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(10,123,94,0.28)]"
          >
            <span>Оплатить подписку</span>
            <span className="flex items-center gap-2 text-white/95">
              {formatPrice(selectedPeriod.price_kopeks)}
              {selectedPeriod.original_price_kopeks &&
              selectedPeriod.original_price_kopeks > selectedPeriod.price_kopeks ? (
                <span className="text-[15px] text-white/55 line-through">
                  {formatPrice(selectedPeriod.original_price_kopeks)}
                </span>
              ) : null}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
