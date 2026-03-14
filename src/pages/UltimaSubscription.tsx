import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { balanceApi } from '@/api/balance';
import { subscriptionApi } from '@/api/subscription';
import { useCurrency } from '@/hooks/useCurrency';
import { useCloseOnSuccessNotification } from '@/store/successNotification';
import { useHaptic, usePlatform } from '@/platform';
import type { PaymentMethod, Tariff, TariffPeriod } from '@/types';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';

const ULTIMA_PENDING_PURCHASE_KEY = 'ultima_pending_purchase_v1';

type PendingUltimaPurchase = {
  tariffId: number;
  periodDays: number;
  deviceLimit?: number;
  createdAt: number;
};

const readPendingUltimaPurchase = (): PendingUltimaPurchase | null => {
  try {
    const raw = localStorage.getItem(ULTIMA_PENDING_PURCHASE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingUltimaPurchase;
    if (!parsed.tariffId || !parsed.periodDays) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writePendingUltimaPurchase = (purchase: PendingUltimaPurchase): void => {
  localStorage.setItem(ULTIMA_PENDING_PURCHASE_KEY, JSON.stringify(purchase));
};

const clearPendingUltimaPurchase = (): void => {
  localStorage.removeItem(ULTIMA_PENDING_PURCHASE_KEY);
};

const resolveApiErrorMessage = (
  err: unknown,
  fallback: string,
): { message: string; missingAmountKopeks?: number } => {
  const error = err as {
    response?: {
      data?: {
        detail?:
          | string
          | {
              message?: string;
              code?: string;
              missing_amount?: number;
              required?: number;
              balance?: number;
            };
        message?: string;
        missing_amount?: number;
        required?: number;
        balance?: number;
      };
    };
    message?: string;
  };

  const data = error.response?.data;
  const detail = data?.detail;
  if (typeof detail === 'string') return { message: detail };
  if (detail && typeof detail === 'object') {
    const missingAmount =
      typeof detail.missing_amount === 'number'
        ? detail.missing_amount
        : typeof detail.required === 'number' && typeof detail.balance === 'number'
          ? Math.max(0, detail.required - detail.balance)
          : undefined;
    if (typeof detail.message === 'string' && detail.message.trim().length > 0) {
      return { message: detail.message, missingAmountKopeks: missingAmount };
    }
    if (typeof missingAmount === 'number' && missingAmount > 0) {
      return {
        message: `${fallback}: ${Math.ceil(missingAmount / 100)} ₽`,
        missingAmountKopeks: missingAmount,
      };
    }
  }

  if (typeof data?.message === 'string' && data.message.trim().length > 0) {
    return { message: data.message };
  }
  if (typeof error.message === 'string' && error.message.trim().length > 0) {
    return { message: error.message };
  }
  return { message: fallback };
};

export function UltimaSubscription() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { currencySymbol } = useCurrency();
  const haptic = useHaptic();
  const { openLink, openTelegramLink } = usePlatform();

  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [selectedPeriodDays, setSelectedPeriodDays] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [awaitingPaymentCompletion, setAwaitingPaymentCompletion] = useState(false);
  const [isFinalizingPending, setIsFinalizingPending] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number>(() =>
    typeof window === 'undefined' ? 900 : window.innerHeight,
  );
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window === 'undefined' ? 420 : window.innerWidth,
  );
  const didInitDevice = useRef(false);
  const lastHapticDeviceIndexRef = useRef<number | null>(null);
  const deviceTrackRef = useRef<HTMLDivElement | null>(null);
  const autoPurchaseAttemptRef = useRef<string | null>(null);
  const finalizeInProgressRef = useRef(false);

  const { data: purchaseOptions, isLoading } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: subscriptionApi.getPurchaseOptions,
    staleTime: 60000,
    refetchOnMount: true,
    placeholderData: (previousData) => previousData,
  });
  const { data: subscriptionResponse } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getSubscription,
    staleTime: 15000,
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
  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: 15000,
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
    const currentSubscriptionLimit = Math.max(
      1,
      subscriptionResponse?.subscription?.device_limit ?? 1,
    );

    const minBaseFromTariffs = Math.max(
      1,
      Math.min(...tariffs.map((tariff) => tariff.base_device_limit ?? tariff.device_limit ?? 1)),
    );
    const minBase = Math.max(
      currentSubscriptionLimit,
      devicePriceMeta?.current_device_limit ?? minBaseFromTariffs,
    );
    const maxLimit = Math.max(
      minBase,
      devicePriceMeta?.max_device_limit ?? minBase,
      ...tariffs.map(
        (tariff) => withMaxLimit(tariff).max_device_limit ?? tariff.device_limit ?? minBase,
      ),
    );
    const fullRange = Array.from({ length: maxLimit - minBase + 1 }, (_, i) => minBase + i);
    return fullRange.length ? fullRange : availableDeviceLimits;
  }, [
    tariffs,
    availableDeviceLimits,
    devicePriceMeta,
    subscriptionResponse?.subscription?.device_limit,
  ]);

  const closestDeviceIndex = useMemo(() => {
    if (!deviceLimits.length) return 0;
    const subscriptionLimit = subscriptionResponse?.subscription?.device_limit;
    if (typeof subscriptionLimit === 'number' && subscriptionLimit > 0) {
      const exactSubscriptionMatch = deviceLimits.findIndex((value) => value === subscriptionLimit);
      if (exactSubscriptionMatch >= 0) return exactSubscriptionMatch;
    }
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
  }, [tariffs, deviceLimits, subscriptionResponse?.subscription?.device_limit]);

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

  const applyDeviceIndex = useCallback(
    (nextIndex: number, options?: { withHaptic?: boolean }) => {
      const maxIndex = Math.max(0, deviceLimits.length - 1);
      const clamped = Math.min(Math.max(0, nextIndex), maxIndex);
      setSelectedDeviceIndex(clamped);
      const withHaptic = options?.withHaptic ?? true;
      if (withHaptic && lastHapticDeviceIndexRef.current !== clamped) {
        haptic.selection();
        lastHapticDeviceIndexRef.current = clamped;
      }
    },
    [deviceLimits.length, haptic],
  );

  const handleDeviceTrackClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!deviceTrackRef.current || deviceLimits.length <= 1) return;
    const rect = deviceTrackRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, x / rect.width));
    const index = Math.round(ratio * (deviceLimits.length - 1));
    applyDeviceIndex(index);
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
  const sliderProgressPercent =
    deviceLimits.length > 1 ? (selectedDeviceIndex / (deviceLimits.length - 1)) * 100 : 0;
  const sliderVisualPower = 0.28 + sliderProgressPercent / 130;
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
    onSuccess: async (result) => {
      clearPendingUltimaPurchase();
      setAwaitingPaymentCompletion(false);
      setError(null);
      queryClient.setQueryData(['subscription'], (prev: unknown) => {
        const previous = prev as { has_subscription?: boolean } | undefined;
        return {
          ...(previous ?? {}),
          has_subscription: true,
          subscription: result.subscription,
        };
      });
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

  const createPaymentMutation = useMutation({
    mutationFn: async (payload: {
      amountKopeks: number;
      paymentMethodId: string;
      paymentOptionId?: string;
    }) =>
      balanceApi.createTopUp(
        payload.amountKopeks,
        payload.paymentMethodId,
        payload.paymentOptionId,
      ),
    onSuccess: (payment) => {
      const redirectUrl = payment.payment_url;
      if (!redirectUrl) {
        clearPendingUltimaPurchase();
        setAwaitingPaymentCompletion(false);
        setError(t('balance.errors.noPaymentLink'));
        return;
      }
      setAwaitingPaymentCompletion(true);
      if (redirectUrl.includes('t.me/')) {
        openTelegramLink(redirectUrl);
      } else {
        openLink(redirectUrl);
      }
    },
    onError: (err: unknown) => {
      clearPendingUltimaPurchase();
      setAwaitingPaymentCompletion(false);
      setError(resolveApiErrorMessage(err, t('common.error')).message);
    },
  });

  const extractMissingAmountKopeks = (err: unknown): number | null => {
    const error = err as {
      response?: {
        data?: {
          detail?:
            | string
            | {
                missing_amount?: number;
                required?: number;
                balance?: number;
              };
          missing_amount?: number;
          required?: number;
          balance?: number;
        };
      };
    };
    const data = error.response?.data;
    const detail = data?.detail;

    if (detail && typeof detail === 'object') {
      if (typeof detail.missing_amount === 'number') return detail.missing_amount;
      if (typeof detail.required === 'number' && typeof detail.balance === 'number') {
        return Math.max(0, detail.required - detail.balance);
      }
    }

    if (typeof data?.missing_amount === 'number') return data.missing_amount;
    if (typeof data?.required === 'number' && typeof data?.balance === 'number') {
      return Math.max(0, data.required - data.balance);
    }

    return null;
  };

  const isInsufficientBalanceError = (err: unknown): boolean => {
    const error = err as {
      response?: {
        status?: number;
        data?: {
          detail?: string | { code?: string };
          code?: string;
        };
      };
    };
    if (error.response?.status === 402) return true;
    const detail = error.response?.data?.detail;
    if (detail && typeof detail === 'object') {
      return detail.code === 'insufficient_balance' || detail.code === 'insufficient_funds';
    }
    const code = error.response?.data?.code;
    return code === 'insufficient_balance' || code === 'insufficient_funds';
  };

  const finalizePendingPurchase = useCallback(
    async (source: 'mount' | 'focus' | 'success_event') => {
      const pending = readPendingUltimaPurchase();
      if (!pending) return;
      if (finalizeInProgressRef.current || purchaseMutation.isPending) return;

      finalizeInProgressRef.current = true;
      setIsFinalizingPending(true);
      try {
        const result = await subscriptionApi.purchaseTariff(
          pending.tariffId,
          pending.periodDays,
          undefined,
          pending.deviceLimit,
        );
        queryClient.setQueryData(['subscription'], (prev: unknown) => {
          const previous = prev as { has_subscription?: boolean } | undefined;
          return {
            ...(previous ?? {}),
            has_subscription: true,
            subscription: result.subscription,
          };
        });
        clearPendingUltimaPurchase();
        setAwaitingPaymentCompletion(false);
        setError(null);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['subscription'] }),
          queryClient.invalidateQueries({ queryKey: ['purchase-options'] }),
          queryClient.invalidateQueries({ queryKey: ['balance'] }),
        ]);
        navigate('/');
      } catch (rawErr) {
        const err = rawErr as {
          response?: { status?: number; data?: { detail?: unknown; message?: unknown } };
        };
        if (!isInsufficientBalanceError(err) && source === 'success_event') {
          const detail = err.response?.data?.detail;
          const message = err.response?.data?.message;
          const resolvedMessage =
            typeof detail === 'string' ? detail : typeof message === 'string' ? message : null;
          if (resolvedMessage) setError(resolvedMessage);
        }
      } finally {
        finalizeInProgressRef.current = false;
        setIsFinalizingPending(false);
      }
    },
    [navigate, purchaseMutation.isPending, queryClient],
  );

  useCloseOnSuccessNotification(() => {
    if (!awaitingPaymentCompletion) return;
    void finalizePendingPurchase('success_event');
  });

  useEffect(() => {
    const pending = readPendingUltimaPurchase();
    if (!pending) return;
    setAwaitingPaymentCompletion(true);
    void finalizePendingPurchase('mount');

    const onFocus = () => {
      void finalizePendingPurchase('focus');
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void finalizePendingPurchase('focus');
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [finalizePendingPurchase]);

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

  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportHeight();
    updateViewportWidth();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('resize', updateViewportWidth);
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('resize', updateViewportWidth);
    };
  }, []);

  if (isLoading) {
    return <div className="h-[100svh] min-h-[100dvh] w-full bg-transparent" />;
  }

  if (!selectedTariff || !selectedPeriod) {
    return (
      <div className="flex h-[100svh] min-h-[100dvh] items-center justify-center text-dark-200">
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
  const bestDealPeriodDays = (() => {
    if (displayPeriods.length < 2) return null;
    let bestDays: number | null = null;
    let bestPerDay = Number.POSITIVE_INFINITY;
    for (const period of displayPeriods) {
      const perDay = calculatePeriodPrice(period) / Math.max(1, period.days);
      if (perDay < bestPerDay) {
        bestPerDay = perDay;
        bestDays = period.days;
      }
    }
    return bestDays;
  })();
  const selectedPriceKopeks = calculatePeriodPrice(selectedPeriod);
  const currentBalanceKopeks = Math.max(0, balanceData?.balance_kopeks ?? 0);
  const payableAmountKopeks = Math.max(0, selectedPriceKopeks - currentBalanceKopeks);
  const isCompactHeight = viewportHeight < 780;
  const isUltraCompactHeight = viewportHeight < 700;
  const isNarrowWidth = viewportWidth < 390;

  const openTopUpForSubscription = async () => {
    setError(null);
    if (createPaymentMutation.isPending || purchaseMutation.isPending || isFinalizingPending)
      return;
    if (!selectedTariffIdForPurchase || !selectedPeriod) return;
    let insufficientBalanceError: {
      response?: {
        status?: number;
        data?: {
          detail?:
            | string
            | { missing_amount?: number; required?: number; balance?: number; message?: string };
          missing_amount?: number;
          required?: number;
          balance?: number;
          message?: string;
        };
      };
    } | null = null;

    try {
      await purchaseMutation.mutateAsync({
        tariffId: selectedTariffIdForPurchase,
        periodDays: selectedPeriod.days,
        deviceLimit: selectedDeviceLimit,
      });
      return;
    } catch (rawErr) {
      const err = rawErr as {
        response?: {
          status?: number;
          data?: { detail?: string | { message?: string }; message?: string };
        };
      };
      if (!isInsufficientBalanceError(err)) {
        const detail = err.response?.data?.detail;
        const message = err.response?.data?.message;
        const resolvedMessage =
          typeof detail === 'string' ? detail : typeof message === 'string' ? message : null;
        if (resolvedMessage) setError(resolvedMessage);
        return;
      }
      insufficientBalanceError = err;
    }

    const pendingPurchase: PendingUltimaPurchase = {
      tariffId: selectedTariffIdForPurchase,
      periodDays: selectedPeriod.days,
      deviceLimit: selectedDeviceLimit,
      createdAt: Date.now(),
    };
    writePendingUltimaPurchase(pendingPurchase);
    setAwaitingPaymentCompletion(true);

    let method = defaultPaymentMethod;
    try {
      if (!method) {
        const methods = await balanceApi.getPaymentMethods();
        const available = methods.filter((entry) => entry.is_available);
        method =
          available.find((entry) => entry.is_default_for_subscription) ?? available[0] ?? null;
        if (!method) {
          clearPendingUltimaPurchase();
          setAwaitingPaymentCompletion(false);
          setError(t('balance.errors.selectMethod'));
          return;
        }
        queryClient.setQueryData(['payment-methods'], methods);
      }
    } catch (err) {
      clearPendingUltimaPurchase();
      setAwaitingPaymentCompletion(false);
      setError(resolveApiErrorMessage(err, t('common.error')).message);
      return;
    }
    const missingAmount = insufficientBalanceError
      ? extractMissingAmountKopeks(insufficientBalanceError)
      : null;
    const topupAmountKopeksBase =
      typeof missingAmount === 'number' && missingAmount > 0
        ? Math.max(1, Math.ceil(missingAmount))
        : Math.max(1, payableAmountKopeks);
    const topupAmountKopeks = Math.min(
      Math.max(topupAmountKopeksBase, method.min_amount_kopeks ?? 1),
      method.max_amount_kopeks ?? Number.MAX_SAFE_INTEGER,
    );
    const selectedOptionId = method.options?.find((option) => option.id)?.id;
    createPaymentMutation.mutate({
      amountKopeks: topupAmountKopeks,
      paymentMethodId: method.id,
      paymentOptionId: selectedOptionId,
    });
  };

  const formatMonthWord = (months: number) => {
    const mod10 = months % 10;
    const mod100 = months % 100;
    if (mod10 === 1 && mod100 !== 11) return 'месяц';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'месяца';
    return 'месяцев';
  };

  const periodLabel = (period: TariffPeriod) => {
    if (period.days === 365) return '1 год';
    if (period.days > 0 && period.days % 30 === 0) {
      const months = period.days / 30;
      if (months >= 1 && months <= 12) {
        return `${months} ${formatMonthWord(months)}`;
      }
    }
    return `${period.days} дней`;
  };

  return (
    <div
      className={`relative h-[100svh] min-h-[100dvh] overflow-hidden bg-transparent ${
        isNarrowWidth ? 'px-3' : 'px-4'
      } pb-[calc(16px+env(safe-area-inset-bottom,0px))] ${isUltraCompactHeight ? 'pt-3' : 'pt-4'}`}
    >
      <div className="ultima-shell-inner">
        <header className={isUltraCompactHeight ? 'mb-2' : 'mb-3'}>
          <h1
            className={`font-semibold leading-[0.95] text-white ${
              isUltraCompactHeight
                ? 'text-[32px]'
                : isNarrowWidth
                  ? 'text-[clamp(30px,8vw,36px)]'
                  : 'text-[clamp(32px,8.4vw,40px)]'
            }`}
          >
            Покупка подписки
          </h1>
          <p
            className={`leading-tight text-white/75 ${
              isUltraCompactHeight
                ? 'mt-1 text-[12px]'
                : isNarrowWidth
                  ? 'mt-1 text-[13px]'
                  : 'mt-1.5 text-[clamp(13px,3.8vw,15px)]'
            }`}
          >
            Подключайте больше устройств и пользуйтесь сервисом вместе с друзьями и близкими
          </p>
        </header>

        <section
          className={`mx-auto w-full max-w-[336px] rounded-3xl border border-white/10 bg-white/5 backdrop-blur ${
            isUltraCompactHeight ? 'mb-2 p-2.5' : 'mb-3 p-2.5'
          }`}
        >
          <div className={`flex items-center gap-3 ${isUltraCompactHeight ? 'mb-2' : 'mb-3'}`}>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/90">
              {selectedDeviceLimit}
            </span>
            <div>
              <p
                className={`${
                  isUltraCompactHeight
                    ? 'text-[19px]'
                    : isNarrowWidth
                      ? 'text-[20px]'
                      : 'text-[22px]'
                } font-medium leading-none text-white`}
              >
                Устройство
              </p>
              <p
                className={`${isUltraCompactHeight ? 'mt-0.5 text-[13px]' : 'mt-1 text-[14px]'} text-white/70`}
              >
                Одновременно в подписке
              </p>
            </div>
          </div>

          <div
            className="rounded-2xl border p-2"
            style={{
              borderColor:
                'color-mix(in srgb, var(--ultima-color-surface-border) 22%, transparent)',
              background:
                'linear-gradient(180deg,color-mix(in srgb, var(--ultima-color-surface) 64%, transparent) 0%,color-mix(in srgb, var(--ultima-color-secondary) 58%, transparent) 100%)',
            }}
          >
            <div
              ref={deviceTrackRef}
              role="button"
              tabIndex={0}
              aria-label="devices-slider"
              onClick={handleDeviceTrackClick}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  applyDeviceIndex(selectedDeviceIndex - 1);
                }
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  applyDeviceIndex(selectedDeviceIndex + 1);
                }
              }}
              className="relative"
            >
              <div className="relative h-9 w-full">
                <div
                  className="absolute left-0 right-0 top-1/2 h-[8px] -translate-y-1/2 rounded-full border bg-white/10 shadow-[inset_0_1px_4px_rgba(0,0,0,0.25)]"
                  style={{
                    borderColor:
                      'color-mix(in srgb, var(--ultima-color-surface-border) 28%, transparent)',
                  }}
                />
                <div
                  className="absolute left-0 top-1/2 h-[8px] -translate-y-1/2 rounded-full"
                  style={{
                    width: `${sliderProgressPercent}%`,
                    background:
                      'linear-gradient(90deg,color-mix(in srgb, var(--ultima-color-nav-active) 92%, #ffffff) 0%,color-mix(in srgb, var(--ultima-color-primary) 94%, #000000) 100%)',
                    boxShadow: `0 0 ${12 + sliderProgressPercent * 0.13}px color-mix(in srgb, var(--ultima-color-primary) ${Math.min(72, Math.round(sliderVisualPower * 100))}%, transparent)`,
                  }}
                />
                <div
                  className="ultima-slider-glow pointer-events-none absolute left-0 top-1/2 h-[8px] -translate-y-1/2 rounded-full"
                  style={{
                    width: `${Math.max(18, sliderProgressPercent)}%`,
                    filter: `blur(${2 + sliderProgressPercent * 0.02}px)`,
                    opacity: Math.min(0.78, 0.26 + sliderProgressPercent / 170),
                    background:
                      'linear-gradient(90deg,color-mix(in srgb, var(--ultima-color-ring) 0%, transparent) 0%,color-mix(in srgb, var(--ultima-color-ring) 72%, transparent) 45%,color-mix(in srgb, var(--ultima-color-ring) 0%, transparent) 100%)',
                  }}
                />
                <span
                  className="absolute top-1/2 z-20 h-5 w-5 -translate-y-1/2 rounded-full border"
                  style={{
                    left: `calc(${sliderProgressPercent}% - 10px + ${
                      selectedDeviceIndex === 0
                        ? '4px'
                        : selectedDeviceIndex === deviceLimits.length - 1
                          ? '-4px'
                          : '0px'
                    })`,
                    transform: `translateY(-50%) scale(${1 + sliderProgressPercent / 500})`,
                    borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 82%, transparent)',
                    background:
                      'radial-gradient(circle at 30% 30%, color-mix(in srgb, #ffffff 76%, transparent), color-mix(in srgb, var(--ultima-color-primary) 88%, transparent) 45%, color-mix(in srgb, var(--ultima-color-secondary) 92%, #000000) 100%)',
                    boxShadow: `0 0 ${16 + sliderProgressPercent * 0.16}px color-mix(in srgb, var(--ultima-color-primary) ${Math.min(86, Math.round((0.44 + sliderProgressPercent / 220) * 100))}%, transparent)`,
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, deviceLimits.length - 1)}
                  step={1}
                  value={selectedDeviceIndex}
                  onChange={(event) => applyDeviceIndex(Number(event.target.value))}
                  className="absolute inset-0 z-10 h-9 w-full cursor-pointer opacity-0"
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
                        applyDeviceIndex(index);
                      }}
                      className="absolute top-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `calc(${left} + ${
                          index === 0 ? '4px' : index === deviceLimits.length - 1 ? '-4px' : '0px'
                        })`,
                      }}
                    >
                      <span
                        className={`block rounded-full transition ${active ? '' : 'bg-white/30'}`}
                        style={{
                          width: active ? 10 : 8,
                          height: active ? 10 : 8,
                          backgroundColor: active
                            ? 'color-mix(in srgb, var(--ultima-color-ring) 88%, #ffffff)'
                            : undefined,
                          boxShadow: active
                            ? `0 0 ${10 + sliderProgressPercent * 0.1}px color-mix(in srgb, var(--ultima-color-primary) ${Math.min(92, Math.round((0.54 + sliderProgressPercent / 170) * 100))}%, transparent)`
                            : 'none',
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section
          className={`ultima-scrollbar min-h-0 flex-1 overflow-y-auto ${
            isUltraCompactHeight ? 'pb-0' : 'pb-1'
          }`}
        >
          <div className={`grid auto-rows-fr grid-cols-2 ${isCompactHeight ? 'gap-2.5' : 'gap-3'}`}>
            {displayPeriods.map((period) => {
              const active = period.days === selectedPeriod.days;
              return (
                <button
                  key={period.days}
                  type="button"
                  onClick={() => {
                    haptic.impact('light');
                    setSelectedPeriodDays(period.days);
                  }}
                  className={`h-full rounded-3xl border text-left transition-colors ${
                    isUltraCompactHeight
                      ? 'min-h-[128px] p-2.5'
                      : isNarrowWidth
                        ? 'min-h-[136px] p-3'
                        : isCompactHeight
                          ? 'min-h-[144px] p-3'
                          : 'min-h-[152px] p-3.5'
                  } ${
                    active
                      ? 'border bg-black/20'
                      : 'border-white/12 bg-black/20 hover:border-white/25'
                  }`}
                  style={
                    active
                      ? {
                          borderColor:
                            'color-mix(in srgb, var(--ultima-color-surface-border) 70%, transparent)',
                          boxShadow:
                            'inset 0 1px 0 color-mix(in srgb, #ffffff 14%, transparent), 0 0 0 1px color-mix(in srgb, var(--ultima-color-primary) 28%, transparent)',
                          background:
                            'color-mix(in srgb, var(--ultima-color-surface) 74%, #000000)',
                        }
                      : undefined
                  }
                >
                  <div
                    className={`${isUltraCompactHeight ? 'mb-2' : 'mb-3'} flex items-center justify-between`}
                  >
                    <span
                      className={`font-medium text-white ${
                        isUltraCompactHeight
                          ? 'text-[15px]'
                          : isNarrowWidth
                            ? 'text-[17px]'
                            : 'text-[clamp(16px,4.4vw,19px)]'
                      }`}
                    >
                      {periodLabel(period)}
                    </span>
                    {period.days === bestDealPeriodDays ? (
                      <span
                        className="rounded-full border px-2 py-[1px] text-[11px] font-semibold"
                        style={{
                          borderColor:
                            'color-mix(in srgb, var(--ultima-color-surface-border) 52%, transparent)',
                          background:
                            'color-mix(in srgb, var(--ultima-color-primary) 26%, transparent)',
                          color: 'color-mix(in srgb, var(--ultima-color-ring) 84%, #ffffff)',
                        }}
                      >
                        Выгодно
                      </span>
                    ) : (
                      <span
                        className={active ? 'opacity-100' : 'opacity-0'}
                        style={{
                          color: 'color-mix(in srgb, var(--ultima-color-primary) 82%, #ffffff)',
                        }}
                      >
                        ★
                      </span>
                    )}
                  </div>
                  <p
                    className={`font-semibold leading-none text-white ${
                      isUltraCompactHeight
                        ? 'text-[26px]'
                        : isNarrowWidth
                          ? 'text-[28px]'
                          : 'text-[clamp(28px,8.6vw,32px)]'
                    }`}
                  >
                    {formatPrice(calculatePeriodPrice(period))}
                  </p>
                  <p className="mt-1 text-[12px] text-white/70">
                    {`${formatPrice(
                      Math.max(
                        1,
                        Math.round((calculatePeriodPrice(period) / Math.max(1, period.days)) * 30),
                      ),
                    )} / мес`}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <div className={isUltraCompactHeight ? 'pt-2' : 'pt-3'}>
          {error && <p className="mb-2.5 text-center text-[16px] text-red-300">{error}</p>}
          <button
            type="button"
            onClick={() => {
              void openTopUpForSubscription();
            }}
            disabled={
              purchaseMutation.isPending || createPaymentMutation.isPending || isFinalizingPending
            }
            className={`ultima-btn-pill ultima-btn-primary flex w-full items-center justify-between px-5 ${
              isUltraCompactHeight ? 'py-2.5 text-[15px]' : 'py-3 text-[16px]'
            } disabled:cursor-not-allowed disabled:opacity-75`}
          >
            <span>Оплатить подписку</span>
            <span className="flex items-center gap-2 text-white/95">
              {formatPrice(payableAmountKopeks)}
              {selectedPeriod.original_price_kopeks &&
              selectedPeriod.original_price_kopeks > selectedPeriod.price_kopeks ? (
                <span className="text-[13px] text-white/60 line-through">
                  {formatPrice(selectedPeriod.original_price_kopeks)}
                </span>
              ) : null}
            </span>
          </button>
          <div className="ultima-nav-dock">
            <UltimaBottomNav active="home" />
          </div>
        </div>
      </div>
    </div>
  );
}
