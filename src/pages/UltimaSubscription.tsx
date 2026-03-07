import { type MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { balanceApi } from '@/api/balance';
import { subscriptionApi } from '@/api/subscription';
import { useCurrency } from '@/hooks/useCurrency';
import type { PaymentMethod, Tariff, TariffPeriod } from '@/types';

export function UltimaSubscription() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { currencySymbol } = useCurrency();

  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [selectedPeriodDays, setSelectedPeriodDays] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const didInitDevice = useRef(false);
  const deviceTrackRef = useRef<HTMLDivElement | null>(null);
  const autoPurchaseAttemptRef = useRef<string | null>(null);

  const { data: purchaseOptions, isLoading } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: subscriptionApi.getPurchaseOptions,
    staleTime: 60000,
    refetchOnMount: true,
    placeholderData: (previousData) => previousData,
  });
  const { data: devicePriceMeta } = useQuery({
    queryKey: ['device-price', 'ultima-max'],
    queryFn: () => subscriptionApi.getDevicePrice(1),
    retry: false,
  });
  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: balanceApi.getPaymentMethods,
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    // Warm dashboard route/data for seamless return transition.
    void import('./Dashboard');
    void queryClient.prefetchQuery({
      queryKey: ['subscription'],
      queryFn: subscriptionApi.getSubscription,
    });
    void queryClient.prefetchQuery({
      queryKey: ['purchase-options'],
      queryFn: subscriptionApi.getPurchaseOptions,
    });
  }, [queryClient]);

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

  const availableDeviceLimits = useMemo(() => {
    return [...periodsByDevice.keys()].sort((a, b) => a - b);
  }, [periodsByDevice]);

  const deviceLimits = useMemo(() => {
    if (!tariffs.length) return availableDeviceLimits.length ? availableDeviceLimits : [1];
    const withMaxLimit = (tariff: Tariff) => tariff as Tariff & { max_device_limit?: number };

    const minBaseFromTariffs = Math.max(
      1,
      Math.min(...tariffs.map((tariff) => tariff.base_device_limit ?? tariff.device_limit ?? 1)),
    );
    const minBase = Math.max(1, devicePriceMeta?.current_device_limit ?? minBaseFromTariffs);
    const maxLimit = Math.max(
      minBase,
      devicePriceMeta?.max_device_limit ?? minBase,
      ...tariffs.map(
        (tariff) => withMaxLimit(tariff).max_device_limit ?? tariff.device_limit ?? minBase,
      ),
    );
    const fullRange = Array.from({ length: maxLimit - minBase + 1 }, (_, i) => minBase + i);
    return fullRange.length ? fullRange : availableDeviceLimits;
  }, [tariffs, availableDeviceLimits, devicePriceMeta]);

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
    if (!availableDeviceLimits.length) return [] as DisplayPeriod[];
    const exact = periodsByDevice.get(selectedDeviceLimit) ?? [];
    const source =
      exact.length > 0
        ? exact
        : (periodsByDevice.get(
            [...availableDeviceLimits].sort(
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
  }, [periodsByDevice, availableDeviceLimits, selectedDeviceLimit]);

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
  const autoTariffId = Number(searchParams.get('autoTariffId'));
  const autoPeriodDays = Number(searchParams.get('autoPeriodDays'));
  const autoDeviceLimit = Number(searchParams.get('autoDeviceLimit'));
  const hasAutoPurchaseParams = Number.isFinite(autoTariffId) && Number.isFinite(autoPeriodDays);
  const autoPurchaseKey = hasAutoPurchaseParams
    ? `${autoTariffId}:${autoPeriodDays}:${Number.isFinite(autoDeviceLimit) ? autoDeviceLimit : 0}`
    : null;

  const defaultPaymentMethod = useMemo(() => {
    if (!paymentMethods?.length) return null;
    const available = paymentMethods.filter((method) => method.is_available);
    if (!available.length) return null;
    return (
      available.find((method: PaymentMethod) => method.is_default_for_subscription) ?? available[0]
    );
  }, [paymentMethods]);

  const purchaseMutation = useMutation({
    mutationFn: async (params?: { tariffId: number; periodDays: number; deviceLimit?: number }) => {
      const tariffId = params?.tariffId ?? selectedTariffIdForPurchase;
      const periodDays = params?.periodDays ?? selectedPeriod?.days;
      if (!tariffId || !periodDays) throw new Error('No tariff selected');
      return subscriptionApi.purchaseTariff(tariffId, periodDays, undefined, params?.deviceLimit);
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
    onError: (err: { response?: { data?: { detail?: unknown; message?: unknown } } }) => {
      const detail = err.response?.data?.detail;
      const message = err.response?.data?.message;
      const resolvedMessage =
        typeof detail === 'string' ? detail : typeof message === 'string' ? message : null;
      // Не показываем generic "Ошибка" в Ultima-потоке — только конкретный текст
      setError(resolvedMessage);
    },
  });

  useEffect(() => {
    if (!autoPurchaseKey) return;
    if (purchaseMutation.isPending) return;
    if (autoPurchaseAttemptRef.current === autoPurchaseKey) return;
    autoPurchaseAttemptRef.current = autoPurchaseKey;
    setError(null);
    purchaseMutation.mutate({
      tariffId: autoTariffId,
      periodDays: autoPeriodDays,
      deviceLimit: Number.isFinite(autoDeviceLimit) ? autoDeviceLimit : undefined,
    });
  }, [autoPurchaseKey, autoTariffId, autoPeriodDays, autoDeviceLimit, purchaseMutation]);

  if (isLoading) {
    return <div className="h-[100dvh] w-full bg-transparent" />;
  }

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

  const baseDeviceLimit = Math.max(
    1,
    selectedTariff.base_device_limit ?? selectedTariff.device_limit ?? 1,
  );
  const extraDevicePricePerMonth = Math.max(0, selectedTariff.device_price_kopeks ?? 0);
  const calculatePeriodPrice = (period: DisplayPeriod): number => {
    const months = Math.max(1, period.months);
    const selectedExtraDevices = Math.max(0, selectedDeviceLimit - baseDeviceLimit);
    const baseTariffPrice = period.base_tariff_price_kopeks ?? period.price_kopeks;
    return baseTariffPrice + selectedExtraDevices * extraDevicePricePerMonth * months;
  };
  const selectedPriceKopeks = calculatePeriodPrice(selectedPeriod);

  const openTopUpForSubscription = async () => {
    setError(null);
    let method = defaultPaymentMethod;
    if (!method) {
      const methods = await balanceApi.getPaymentMethods();
      const available = methods.filter((entry) => entry.is_available);
      method = available.find((entry) => entry.is_default_for_subscription) ?? available[0] ?? null;
      if (!method) {
        setError(t('balance.errors.selectMethod'));
        return;
      }
      queryClient.setQueryData(['payment-methods'], methods);
    }
    const returnTo = `/subscription?autoTariffId=${selectedTariffIdForPurchase}&autoPeriodDays=${selectedPeriod.days}&autoDeviceLimit=${selectedDeviceLimit}`;
    const params = new URLSearchParams({
      amount: String(selectedPriceKopeks / 100),
      returnTo,
      autostart: '1',
      autoopen: '1',
    });
    navigate(`/balance/top-up/${method.id}?${params.toString()}`);
  };

  const periodLabel = (period: TariffPeriod) => {
    if (period.days === 30) return '1 месяц';
    if (period.days === 90) return '3 месяца';
    if (period.days === 180) return '6 месяцев';
    if (period.days === 365) return '1 год';
    return `${period.days} дней`;
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-transparent px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-4">
      <div className="ultima-content-enter relative z-10 mx-auto flex h-full max-w-md flex-col">
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
              className="relative"
            >
              <div className="relative h-8 w-full">
                <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/20" />
                <div
                  className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-emerald-400/80 transition-all duration-200"
                  style={{
                    width:
                      deviceLimits.length > 1
                        ? `${(selectedDeviceIndex / (deviceLimits.length - 1)) * 100}%`
                        : '0%',
                  }}
                />
                <span
                  className="absolute top-1/2 z-20 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-emerald-300 bg-[#06261f] shadow-[0_0_10px_rgba(52,211,153,0.6)] transition-all duration-200"
                  style={{
                    left:
                      deviceLimits.length > 1
                        ? `calc(${(selectedDeviceIndex / (deviceLimits.length - 1)) * 100}% - 8px)`
                        : '0px',
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, deviceLimits.length - 1)}
                  step={1}
                  value={selectedDeviceIndex}
                  onChange={(event) => setSelectedDeviceIndex(Number(event.target.value))}
                  className="absolute inset-0 z-10 h-8 w-full cursor-pointer opacity-0"
                  aria-label="devices-slider-input"
                />
                {deviceLimits.map((limit, index) => {
                  const left =
                    deviceLimits.length > 1
                      ? `${(index / (deviceLimits.length - 1)) * 100}%`
                      : '0%';
                  const active = index === selectedDeviceIndex;
                  return (
                    <button
                      key={limit}
                      type="button"
                      aria-label={`devices-${limit}`}
                      onClick={(event) => {
                        event.preventDefault();
                        setSelectedDeviceIndex(index);
                      }}
                      className="absolute top-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
                      style={{ left }}
                    >
                      <span
                        className={`block h-2.5 w-2.5 rounded-full transition ${
                          active
                            ? 'bg-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                            : 'bg-white/40'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-white/55">
              <span>{deviceLimits[0]}</span>
              <span>{deviceLimits[deviceLimits.length - 1]}</span>
            </div>
          </div>
        </section>

        <section className="grid auto-rows-fr grid-cols-2 gap-3">
          {displayPeriods.map((period) => {
            const active = period.days === selectedPeriod.days;
            return (
              <button
                key={period.days}
                type="button"
                onClick={() => {
                  setSelectedPeriodDays(period.days);
                }}
                className={`h-full min-h-[176px] rounded-3xl border p-4 text-left transition-colors ${
                  active
                    ? 'border-emerald-400 bg-[#0a2522] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_0_1px_rgba(16,185,129,0.25)]'
                    : 'border-white/12 bg-black/20 hover:border-white/25'
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[19px] font-medium text-white">{periodLabel(period)}</span>
                  <span className={`text-emerald-300 ${active ? 'opacity-100' : 'opacity-0'}`}>
                    ★
                  </span>
                </div>
                <p className="text-[32px] font-semibold leading-none text-white">
                  {formatPrice(calculatePeriodPrice(period))}
                </p>
                <p
                  className={`mt-1 text-[13px] ${
                    period.original_price_kopeks &&
                    period.original_price_kopeks > period.price_kopeks
                      ? 'text-white/70'
                      : 'invisible'
                  }`}
                >
                  {period.price_per_month_kopeks > 0
                    ? `${formatPrice(period.price_per_month_kopeks)} / мес`
                    : '0'}
                </p>
              </button>
            );
          })}
        </section>

        <div className="mt-auto pt-4">
          {error && <p className="mb-3 text-center text-[18px] text-red-300">{error}</p>}
          <button
            type="button"
            onClick={() => {
              void openTopUpForSubscription();
            }}
            disabled={purchaseMutation.isPending}
            className="flex w-full items-center justify-between rounded-full border border-[#52ecc6]/40 bg-[#12cd97] px-6 py-4 text-[20px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(10,123,94,0.28)]"
          >
            <span>Оплатить подписку</span>
            <span className="flex items-center gap-2 text-white/95">
              {formatPrice(selectedPriceKopeks)}
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
