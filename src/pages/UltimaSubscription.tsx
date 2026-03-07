import { type MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
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
  const deviceTrackRef = useRef<HTMLDivElement | null>(null);

  const { data: purchaseOptions, isLoading } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: subscriptionApi.getPurchaseOptions,
    refetchOnMount: 'always',
  });

  const tariffs = useMemo(() => {
    if (!purchaseOptions || purchaseOptions.sales_mode !== 'tariffs') return [] as Tariff[];
    return purchaseOptions.tariffs.filter((tariff) => tariff.is_available);
  }, [purchaseOptions]);

  type DisplayPeriod = TariffPeriod & { tariffId: number; deviceLimit: number };

  const periodsByDevice = useMemo(() => {
    const map = new Map<number, DisplayPeriod[]>();
    tariffs.forEach((tariff) => {
      const baseDeviceLimit = Math.max(1, tariff.base_device_limit ?? tariff.device_limit ?? 1);
      const tariffExtraFallback = Math.max(
        0,
        (tariff.device_limit ?? baseDeviceLimit) - baseDeviceLimit,
      );
      tariff.periods
        .filter((period) => period.days > 0)
        .forEach((period) => {
          const extraDevices = Math.max(
            0,
            period.extra_devices_count ?? tariff.extra_devices_count ?? tariffExtraFallback,
          );
          const deviceLimit = baseDeviceLimit + extraDevices;
          const list = map.get(deviceLimit) ?? [];
          list.push({ ...period, tariffId: tariff.id, deviceLimit });
          map.set(deviceLimit, list);
        });
    });
    return map;
  }, [tariffs]);

  const deviceLimits = useMemo(() => {
    return [...periodsByDevice.keys()].sort((a, b) => a - b);
  }, [periodsByDevice]);

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

  const handleDeviceTrackClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!deviceTrackRef.current || deviceLimits.length <= 1) return;
    const rect = deviceTrackRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, x / rect.width));
    const index = Math.round(ratio * (deviceLimits.length - 1));
    setSelectedDeviceIndex(index);
  };

  const allPeriodsForDevice = useMemo(() => {
    if (!deviceLimits.length) return [] as DisplayPeriod[];
    const exact = periodsByDevice.get(selectedDeviceLimit) ?? [];
    const source =
      exact.length > 0
        ? exact
        : (periodsByDevice.get(
            [...deviceLimits].sort(
              (a, b) => Math.abs(a - selectedDeviceLimit) - Math.abs(b - selectedDeviceLimit),
            )[0] ?? selectedDeviceLimit,
          ) ?? []);

    const bestByDays = new Map<number, DisplayPeriod>();
    source.forEach((period) => {
      const existing = bestByDays.get(period.days);
      if (!existing || period.price_kopeks < existing.price_kopeks) {
        bestByDays.set(period.days, period);
      }
    });
    return [...bestByDays.values()].sort(
      (a, b) => a.months - b.months || a.days - b.days || a.price_kopeks - b.price_kopeks,
    );
  }, [periodsByDevice, deviceLimits, selectedDeviceLimit]);

  const selectedTariff = useMemo(() => {
    if (!tariffs.length) return null;
    return tariffs.find((tariff) => tariff.is_current) ?? tariffs[0];
  }, [tariffs]);

  const displayPeriods = useMemo(() => {
    if (!allPeriodsForDevice.length) return [] as DisplayPeriod[];
    const bestByDays = new Map<number, DisplayPeriod>();
    allPeriodsForDevice.forEach((period) => {
      const existing = bestByDays.get(period.days);
      if (!existing || period.price_kopeks < existing.price_kopeks) {
        bestByDays.set(period.days, period);
      }
    });
    return [...bestByDays.values()].sort((a, b) => a.days - b.days);
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
            <div
              ref={deviceTrackRef}
              role="button"
              tabIndex={0}
              aria-label="devices-slider"
              onClick={handleDeviceTrackClick}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  setSelectedDeviceIndex((prev) => Math.max(0, prev - 1));
                }
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  setSelectedDeviceIndex((prev) => Math.min(deviceLimits.length - 1, prev + 1));
                }
              }}
              className="relative mb-3 h-2 w-full cursor-pointer rounded-full bg-white/20"
            >
              <div
                className="h-full rounded-full bg-emerald-400/80"
                style={{
                  width:
                    deviceLimits.length > 1
                      ? `${(selectedDeviceIndex / (deviceLimits.length - 1)) * 100}%`
                      : '0%',
                }}
              />
              <span
                className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-emerald-300 bg-[#06261f] shadow-[0_0_10px_rgba(52,211,153,0.6)]"
                style={{
                  left:
                    deviceLimits.length > 1
                      ? `calc(${(selectedDeviceIndex / (deviceLimits.length - 1)) * 100}% - 8px)`
                      : '0px',
                }}
              />
            </div>
            <div className="flex items-center justify-between px-1">
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
