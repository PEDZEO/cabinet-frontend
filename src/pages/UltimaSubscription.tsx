import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { balanceApi } from '@/api/balance';
import { promoApi } from '@/api/promo';
import { subscriptionApi } from '@/api/subscription';
import { UltimaDesktopSubscription } from '@/components/ultima/desktop/UltimaDesktopSubscription';
import { UltimaTariffSelector } from '@/components/ultima/UltimaTariffSelector';
import { createApplyPromoDiscount } from '@/features/subscription/utils/pricing';
import {
  getSortedUltimaTariffs,
  getUltimaBaseDeviceLimit,
  getUltimaDeviceLimitsForTariff,
  getUltimaPeriodsForDeviceLimit,
} from '@/features/ultima/subscription';
import { useCurrency } from '@/hooks/useCurrency';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  showSuccessNotification,
  useCloseOnSuccessNotification,
} from '@/store/successNotification';
import { useHaptic, usePlatform } from '@/platform';
import type { PaymentMethod, TariffPeriod } from '@/types';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';

const ULTIMA_PENDING_PURCHASE_KEY = 'ultima_pending_purchase_v1';

type PendingUltimaPurchase = {
  tariffId: number;
  periodDays: number;
  deviceLimit?: number;
  createdAt: number;
};

type ValidationErrorDetail = {
  loc?: Array<string | number>;
  msg?: string;
  ctx?: {
    ge?: number;
    le?: number;
  };
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

const getTopUpAmountKopeks = (
  amountKopeks: number,
  method: PaymentMethod,
): { requestedAmountKopeks: number; bumpsToMinimum: boolean } => {
  const baseAmountKopeks = Math.max(1, Math.ceil(amountKopeks));
  const minimumAmountKopeks = Math.max(1, method.min_amount_kopeks ?? 1);
  const requestedAmountKopeks = Math.min(
    Math.max(baseAmountKopeks, minimumAmountKopeks),
    method.max_amount_kopeks ?? Number.MAX_SAFE_INTEGER,
  );

  return {
    requestedAmountKopeks,
    bumpsToMinimum: requestedAmountKopeks > baseAmountKopeks,
  };
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
  if (Array.isArray(detail) && detail.length > 0) {
    const firstDetail = detail[0] as ValidationErrorDetail;
    const affectsAmount = firstDetail.loc?.some((part) => part === 'amount_kopeks');

    if (affectsAmount && typeof firstDetail.ctx?.ge === 'number') {
      return {
        message: `Минимальная сумма пополнения: ${Math.ceil(firstDetail.ctx.ge / 100)} ₽`,
      };
    }

    if (affectsAmount && typeof firstDetail.ctx?.le === 'number') {
      return {
        message: `Максимальная сумма пополнения: ${Math.floor(firstDetail.ctx.le / 100)} ₽`,
      };
    }

    if (typeof firstDetail.msg === 'string' && firstDetail.msg.trim().length > 0) {
      return { message: firstDetail.msg };
    }
  }
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
  const isDesktopViewport = useMediaQuery('(min-width: 1024px)');

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
  const lastTariffIdRef = useRef<number | null>(null);
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
  const { data: activeDiscount } = useQuery({
    queryKey: ['active-discount'],
    queryFn: promoApi.getActiveDiscount,
    staleTime: 30000,
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

  const subscription = subscriptionResponse?.subscription ?? null;

  const tariffs = useMemo(() => {
    if (!purchaseOptions || purchaseOptions.sales_mode !== 'tariffs') return [];
    return getSortedUltimaTariffs(purchaseOptions.tariffs, subscription);
  }, [purchaseOptions, subscription]);

  const currentTariffId = useMemo(
    () => subscription?.tariff_id ?? tariffs.find((tariff) => tariff.is_current)?.id ?? null,
    [subscription, tariffs],
  );

  const [selectedTariffId, setSelectedTariffId] = useState<number | null>(null);
  const [isMobileTariffChooserOpen, setIsMobileTariffChooserOpen] = useState(true);

  useEffect(() => {
    if (!tariffs.length) {
      setSelectedTariffId(null);
      return;
    }

    setSelectedTariffId((previous) => {
      if (previous && tariffs.some((tariff) => tariff.id === previous)) {
        return previous;
      }
      return currentTariffId ?? tariffs[0].id;
    });
  }, [tariffs, currentTariffId]);

  useEffect(() => {
    if (isDesktopViewport || tariffs.length <= 1) {
      setIsMobileTariffChooserOpen(false);
      return;
    }
    setIsMobileTariffChooserOpen(true);
  }, [isDesktopViewport, tariffs.length]);

  const selectedTariff = useMemo(() => {
    if (!tariffs.length) return null;
    if (selectedTariffId) {
      return tariffs.find((tariff) => tariff.id === selectedTariffId) ?? tariffs[0];
    }
    return tariffs[0];
  }, [tariffs, selectedTariffId]);

  const deviceLimits = useMemo(() => {
    if (!selectedTariff) return [1];
    return getUltimaDeviceLimitsForTariff(selectedTariff, subscription);
  }, [selectedTariff, subscription]);

  const closestDeviceIndex = useMemo(() => {
    if (!selectedTariff || !deviceLimits.length) return 0;
    const preferredLimit = selectedTariff.is_current
      ? Math.max(1, subscription?.device_limit ?? getUltimaBaseDeviceLimit(selectedTariff))
      : getUltimaBaseDeviceLimit(selectedTariff);
    const exactIndex = deviceLimits.findIndex((value) => value === preferredLimit);
    if (exactIndex >= 0) return exactIndex;

    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    deviceLimits.forEach((value, index) => {
      const distance = Math.abs(value - preferredLimit);
      if (distance < bestDistance) {
        bestIndex = index;
        bestDistance = distance;
      }
    });
    return bestIndex;
  }, [selectedTariff, deviceLimits, subscription?.device_limit]);

  useEffect(() => {
    if (!deviceLimits.length) {
      setSelectedDeviceIndex(0);
      lastTariffIdRef.current = null;
      return;
    }

    if (selectedTariff?.id !== lastTariffIdRef.current) {
      lastTariffIdRef.current = selectedTariff?.id ?? null;
      setSelectedDeviceIndex(closestDeviceIndex);
      return;
    }

    setSelectedDeviceIndex((previous) =>
      Math.min(Math.max(0, previous), Math.max(0, deviceLimits.length - 1)),
    );
  }, [deviceLimits, closestDeviceIndex, selectedTariff?.id]);

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

  const displayPeriods = useMemo(() => {
    if (!selectedTariff) return [];
    return getUltimaPeriodsForDeviceLimit(selectedTariff, selectedDeviceLimit).sort(
      (left, right) => left.days - right.days,
    );
  }, [selectedTariff, selectedDeviceLimit]);

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

  const selectedTariffIdForPurchase = selectedTariff?.id ?? selectedPeriod?.tariffId ?? null;
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
      showSuccessNotification({
        type: 'subscription_purchased',
        tariffName: result.tariff_name,
        expiresAt: result.subscription.end_date,
      });
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
        showSuccessNotification({
          type: 'subscription_purchased',
          tariffName: result.tariff_name,
          expiresAt: result.subscription.end_date,
        });
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
    if (isDesktopViewport) {
      return (
        <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-subscription-desktop">
          <div className="ultima-shell-aura" />
          <div className="ultima-shell-inner lg:max-w-[1200px]">
            <div className="flex min-h-[calc(100dvh-48px)] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/35 border-t-transparent" />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames">
        <div className="ultima-shell-aura" />
        <div className="ultima-shell-inner lg:max-w-[960px]" />
      </div>
    );
  }

  if (!selectedTariff || !selectedPeriod) {
    if (isDesktopViewport) {
      return (
        <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-subscription-desktop">
          <div className="ultima-shell-aura" />
          <div className="ultima-shell-inner lg:max-w-[1200px]">
            <div className="flex min-h-[calc(100dvh-48px)] items-center justify-center text-dark-200">
              {t('subscription.noTariffsAvailable', { defaultValue: 'Тарифы недоступны' })}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames">
        <div className="ultima-shell-aura" />
        <div className="ultima-shell-inner items-center justify-center px-4 text-center text-dark-200 lg:max-w-[960px]">
          {t('subscription.noTariffsAvailable', { defaultValue: 'Тарифы недоступны' })}
        </div>
      </div>
    );
  }

  const formatPrice = (kopeks: number) => {
    const rubles = kopeks / 100;
    const value = Number.isInteger(rubles) ? String(rubles) : rubles.toFixed(2);
    return `${value} ${currencySymbol}`;
  };
  const applyPromoDiscount = createApplyPromoDiscount(activeDiscount);

  const baseDeviceLimit = Math.max(
    1,
    selectedTariff.base_device_limit ?? selectedTariff.device_limit ?? 1,
  );
  const extraDevicePricePerMonth = Math.max(0, selectedTariff.device_price_kopeks ?? 0);
  const calculateRawPeriodPrice = (period: TariffPeriod): number => {
    const months = Math.max(1, period.months);
    const selectedExtraDevices = Math.max(0, selectedDeviceLimit - baseDeviceLimit);
    const baseTariffPrice = period.base_tariff_price_kopeks ?? period.price_kopeks;
    return baseTariffPrice + selectedExtraDevices * extraDevicePricePerMonth * months;
  };
  const currentTariffBaseDeviceLimit = selectedTariff
    ? getUltimaBaseDeviceLimit(selectedTariff)
    : 1;
  const selectedExtraDevices = Math.max(0, selectedDeviceLimit - currentTariffBaseDeviceLimit);
  const extraDeviceChargeKopeks =
    selectedExtraDevices * extraDevicePricePerMonth * Math.max(1, selectedPeriod?.months ?? 1);
  const hasLegacyDeviceOverhang =
    !!subscription &&
    !!selectedTariff &&
    selectedTariff.id === subscription.tariff_id &&
    subscription.device_limit > currentTariffBaseDeviceLimit;
  const legacyDeviceNotice =
    hasLegacyDeviceOverhang && selectedExtraDevices > 0
      ? t(
          'ultima.legacyDeviceNotice',
          'В тариф теперь входит {{base}} устройства, а у вас активно {{current}}. {{extra}} устройство влияет на цену как дополнительное, пока вы не уменьшите лимит.',
          {
            base: currentTariffBaseDeviceLimit,
            current: subscription?.device_limit ?? selectedDeviceLimit,
            extra: selectedExtraDevices,
          },
        )
      : null;
  const baseDeviceLimitLabel = t(
    'ultima.baseDeviceLimitLabel',
    'База тарифа: {{count}} устройства',
    { count: currentTariffBaseDeviceLimit },
  );
  const extraDeviceChargeLabel =
    selectedExtraDevices > 0 && extraDeviceChargeKopeks > 0
      ? t('ultima.extraDeviceChargeLabel', 'Доп. устройства: {{count}} · +{{price}}', {
          count: selectedExtraDevices,
          price: formatPrice(extraDeviceChargeKopeks),
        })
      : null;

  const bestDealPeriodDays = (() => {
    if (displayPeriods.length < 2) return null;
    let bestDays: number | null = null;
    let bestPerDay = Number.POSITIVE_INFINITY;
    for (const period of displayPeriods) {
      const periodPrice = applyPromoDiscount(
        calculateRawPeriodPrice(period),
        period.original_price_kopeks ?? null,
      ).price;
      const perDay = periodPrice / Math.max(1, period.days);
      if (perDay < bestPerDay) {
        bestPerDay = perDay;
        bestDays = period.days;
      }
    }
    return bestDays;
  })();
  const selectedPricePreview = applyPromoDiscount(
    calculateRawPeriodPrice(selectedPeriod),
    selectedPeriod.original_price_kopeks ?? null,
  );
  const selectedPriceKopeks = selectedPricePreview.price;
  const currentBalanceKopeks = Math.max(0, balanceData?.balance_kopeks ?? 0);
  const balanceAppliedKopeks = Math.min(currentBalanceKopeks, selectedPriceKopeks);
  const payableAmountKopeks = Math.max(0, selectedPriceKopeks - currentBalanceKopeks);
  const topUpPreview =
    payableAmountKopeks > 0 && defaultPaymentMethod
      ? getTopUpAmountKopeks(payableAmountKopeks, defaultPaymentMethod)
      : null;
  const actionAmountKopeks =
    payableAmountKopeks > 0 ? (topUpPreview?.requestedAmountKopeks ?? payableAmountKopeks) : 0;
  const requiresMinTopUpBump =
    payableAmountKopeks > 0 && !!topUpPreview && topUpPreview.bumpsToMinimum;
  const isCompactHeight = viewportHeight < 780;
  const isUltraCompactHeight = viewportHeight < 700;
  const isNarrowWidth = viewportWidth < 390;
  const bottomNav = <UltimaBottomNav active="home" />;

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
    const { requestedAmountKopeks: topupAmountKopeks, bumpsToMinimum } = getTopUpAmountKopeks(
      topupAmountKopeksBase,
      method,
    );

    if (bumpsToMinimum) {
      const params = new URLSearchParams();
      params.set('amount', String(Math.ceil(topupAmountKopeks / 100)));
      params.set('returnTo', '/subscription');
      navigate(`/balance/top-up/${method.id}?${params.toString()}`);
      return;
    }

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

  const selectedTariffSubtitle =
    selectedTariff?.description?.trim() ||
    [
      selectedTariff?.traffic_limit_label,
      selectedTariff ? t('subscription.devices', { count: selectedTariff.device_limit }) : '',
    ]
      .filter(Boolean)
      .join(' · ');
  const showTariffSelector = tariffs.length > 1;
  const desktopTariffSelector =
    showTariffSelector && isDesktopViewport ? (
      <UltimaTariffSelector
        tariffs={tariffs}
        selectedTariffId={selectedTariff?.id ?? tariffs[0]?.id ?? 0}
        currentTariffId={currentTariffId}
        t={t}
        formatPrice={formatPrice}
        applyPromoDiscount={applyPromoDiscount}
        onSelectTariff={(tariffId) => {
          haptic.selection();
          setError(null);
          setSelectedTariffId(tariffId);
          setSelectedPeriodDays(null);
        }}
      />
    ) : null;
  const mobileTariffSelector = showTariffSelector ? (
    <UltimaTariffSelector
      tariffs={tariffs}
      selectedTariffId={selectedTariff?.id ?? tariffs[0]?.id ?? 0}
      currentTariffId={currentTariffId}
      t={t}
      formatPrice={formatPrice}
      applyPromoDiscount={applyPromoDiscount}
      onSelectTariff={(tariffId) => {
        haptic.selection();
        setError(null);
        setSelectedTariffId(tariffId);
        setSelectedPeriodDays(null);
        setIsMobileTariffChooserOpen(false);
      }}
    />
  ) : null;

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

  const desktopPeriods = displayPeriods.map((period) => {
    const preview = applyPromoDiscount(
      calculateRawPeriodPrice(period),
      period.original_price_kopeks ?? null,
    );
    const monthlyPrice = Math.max(1, Math.round((preview.price / Math.max(1, period.days)) * 30));

    return {
      days: period.days,
      label: periodLabel(period),
      priceLabel: formatPrice(preview.price),
      monthlyLabel: `${formatPrice(monthlyPrice)} / мес`,
      originalPriceLabel:
        preview.original && preview.original > preview.price ? formatPrice(preview.original) : null,
      isSelected: period.days === selectedPeriod.days,
      isBestDeal: period.days === bestDealPeriodDays,
    };
  });

  if (isDesktopViewport) {
    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-subscription-desktop">
        <div className="ultima-shell-aura" />
        <UltimaDesktopSubscription
          planSelector={desktopTariffSelector}
          title={
            selectedTariff?.name ??
            t('subscription.purchaseTitle', { defaultValue: 'Покупка подписки' })
          }
          subtitle={
            selectedTariffSubtitle ||
            t('subscription.purchaseSubtitle', {
              defaultValue:
                'Выберите количество устройств и подходящий период, а итоговая оплата пересчитается автоматически.',
            })
          }
          selectedDeviceLimit={selectedDeviceLimit}
          deviceLimits={deviceLimits}
          periods={desktopPeriods}
          selectedPeriodLabel={periodLabel(selectedPeriod)}
          baseDeviceLimitLabel={baseDeviceLimitLabel}
          extraDeviceChargeLabel={extraDeviceChargeLabel}
          legacyDeviceNotice={legacyDeviceNotice}
          onReduceDevices={legacyDeviceNotice ? () => navigate('/ultima/devices') : null}
          totalPriceLabel={formatPrice(selectedPriceKopeks)}
          balanceAppliedLabel={formatPrice(balanceAppliedKopeks)}
          payablePriceLabel={formatPrice(payableAmountKopeks)}
          originalPriceLabel={
            selectedPricePreview.original && selectedPricePreview.original > selectedPriceKopeks
              ? formatPrice(selectedPricePreview.original)
              : null
          }
          error={error}
          awaitingPaymentCompletion={awaitingPaymentCompletion}
          isFinalizingPending={isFinalizingPending}
          isPayDisabled={
            purchaseMutation.isPending || createPaymentMutation.isPending || isFinalizingPending
          }
          bottomNav={bottomNav}
          onSelectDevice={(index) => applyDeviceIndex(index)}
          onSelectPeriod={(days) => {
            haptic.impact('light');
            setSelectedPeriodDays(days);
          }}
          onPay={() => {
            void openTopUpForSubscription();
          }}
        />
      </div>
    );
  }

  if (showTariffSelector && isMobileTariffChooserOpen) {
    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames">
        <div className="ultima-shell-aura" />
        <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
          <section className="ultima-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            <header className="mb-3">
              <h1 className="break-words text-[clamp(32px,8.4vw,42px)] font-semibold leading-[0.95] text-white">
                {t('dashboard.expired.tariffs')}
              </h1>
              <p className="text-white/72 mt-1.5 text-[14px] leading-snug">
                {t('subscription.selectTariffDescription', {
                  defaultValue: 'Выберите тариф, затем настройте устройства и период оплаты.',
                })}
              </p>
            </header>
            {mobileTariffSelector}
          </section>

          <div className="ultima-mobile-dock-footer pt-3">
            <div className="ultima-nav-dock">{bottomNav}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ultima-shell ultima-shell-wide ultima-flat-frames">
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <header className={isUltraCompactHeight ? 'mb-2' : 'mb-3'}>
          <h1
            className={`break-words font-semibold leading-[0.95] text-white ${
              isUltraCompactHeight
                ? 'text-[32px]'
                : isNarrowWidth
                  ? 'text-[clamp(30px,8vw,36px)]'
                  : 'text-[clamp(32px,8.4vw,40px)]'
            }`}
          >
            {selectedTariff?.name ?? 'Покупка подписки'}
          </h1>
          <p
            className={`break-words leading-tight text-white/75 ${
              isUltraCompactHeight
                ? 'mt-1 text-[12px]'
                : isNarrowWidth
                  ? 'mt-1 text-[13px]'
                  : 'mt-1.5 text-[clamp(13px,3.8vw,15px)]'
            }`}
          >
            {selectedTariffSubtitle ||
              'Подключайте больше устройств и пользуйтесь сервисом вместе с друзьями и близкими'}
          </p>
          {showTariffSelector ? (
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setIsMobileTariffChooserOpen(true);
              }}
              className="border-white/12 text-white/78 mt-2 rounded-full border bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium"
            >
              {t('subscription.changeTariff', { defaultValue: 'Сменить тариф' })}
            </button>
          ) : null}
        </header>

        <section
          className={`w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur ${
            isUltraCompactHeight ? 'mb-2 p-2.5' : 'mb-3 p-2.5'
          }`}
        >
          <div className={`flex items-center gap-3 ${isUltraCompactHeight ? 'mb-2' : 'mb-3'}`}>
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border text-[18px] font-semibold text-white shadow-[0_0_18px_color-mix(in_srgb,var(--ultima-color-primary)_36%,transparent)]"
              style={{
                borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 52%, transparent)',
                background:
                  'radial-gradient(circle at 30% 30%, color-mix(in srgb, #ffffff 34%, transparent), color-mix(in srgb, var(--ultima-color-primary) 36%, transparent) 40%, color-mix(in srgb, var(--ultima-color-surface) 78%, #000000) 100%)',
              }}
            >
              {selectedDeviceLimit}
            </span>
            <div className="min-w-0">
              <p
                className={`${
                  isUltraCompactHeight
                    ? 'text-[19px]'
                    : isNarrowWidth
                      ? 'text-[20px]'
                      : 'text-[22px]'
                } font-medium leading-none text-white`}
              >
                {t('subscription.devices')}
              </p>
              <p
                className={`${isUltraCompactHeight ? 'mt-0.5 text-[13px]' : 'mt-1 text-[14px]'} text-white/70`}
              >
                {selectedTariff?.traffic_limit_label ?? 'Одновременно в подписке'}
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
          className={`ultima-scrollbar min-h-0 flex-1 overflow-y-auto lg:overflow-visible ${
            isUltraCompactHeight ? 'pb-0' : 'pb-1'
          }`}
        >
          <div
            className={`grid auto-rows-fr grid-cols-1 min-[360px]:grid-cols-2 ${isCompactHeight ? 'gap-2.5' : 'gap-3'}`}
          >
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
                      ? 'min-h-[124px] p-2.5'
                      : isNarrowWidth
                        ? 'min-h-[132px] p-3'
                        : isCompactHeight
                          ? 'min-h-[140px] p-3'
                          : 'min-h-[148px] p-3.5'
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
                    className={`${isUltraCompactHeight ? 'mb-2' : 'mb-3'} flex flex-wrap items-center justify-between gap-2`}
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
                    {formatPrice(
                      applyPromoDiscount(
                        calculateRawPeriodPrice(period),
                        period.original_price_kopeks ?? null,
                      ).price,
                    )}
                  </p>
                  <p className="mt-1 text-[12px] text-white/70">
                    {`${formatPrice(
                      Math.max(
                        1,
                        Math.round(
                          (applyPromoDiscount(
                            calculateRawPeriodPrice(period),
                            period.original_price_kopeks ?? null,
                          ).price /
                            Math.max(1, period.days)) *
                            30,
                        ),
                      ),
                    )} / мес`}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <div className={`ultima-mobile-dock-footer ${isUltraCompactHeight ? 'pt-2' : 'pt-3'}`}>
          {legacyDeviceNotice ? (
            <div className="border-amber-200/24 text-amber-50/92 mb-2 flex items-center gap-2 rounded-[16px] border bg-amber-300/10 px-3 py-2 text-[11px] leading-[1.3]">
              <p className="line-clamp-2 min-w-0 flex-1">{legacyDeviceNotice}</p>
              <button
                type="button"
                onClick={() => navigate('/ultima/devices')}
                className="ultima-btn-pill ultima-btn-secondary shrink-0 px-3 py-1.5 text-[12px]"
              >
                {t('subscription.manageDevices', { defaultValue: 'Устройства' })}
              </button>
            </div>
          ) : null}
          {!error && requiresMinTopUpBump && defaultPaymentMethod && (
            <p className="mb-2 text-center text-[13px] leading-relaxed text-white/70">
              {t(
                'ultima.minimumTopUpHint',
                'Не хватает {{missing}}. Минимальное пополнение этим способом — {{minimum}}. Остаток останется на балансе.',
                {
                  missing: formatPrice(payableAmountKopeks),
                  minimum: formatPrice(actionAmountKopeks),
                },
              )}
            </p>
          )}
          {error && <p className="mb-2.5 text-center text-[16px] text-red-300">{error}</p>}
          <button
            type="button"
            onClick={() => {
              void openTopUpForSubscription();
            }}
            disabled={
              purchaseMutation.isPending || createPaymentMutation.isPending || isFinalizingPending
            }
            className={`ultima-btn-pill ultima-btn-primary flex w-full items-center gap-3 px-4 text-left min-[360px]:px-5 ${
              isUltraCompactHeight ? 'py-2.5 text-[15px]' : 'py-3 text-[16px]'
            } disabled:cursor-not-allowed disabled:opacity-75`}
          >
            <span className="min-w-0 flex-1 break-words leading-tight">
              {payableAmountKopeks > 0
                ? t('ultima.topUpAndBuy', 'Пополнить и купить')
                : t('ultima.buySubscription', 'Оплатить подписку')}
            </span>
            <span className="flex shrink-0 flex-col items-end text-right leading-none text-white/95">
              <span>{formatPrice(actionAmountKopeks)}</span>
              {selectedPricePreview.original &&
              selectedPricePreview.original > selectedPriceKopeks ? (
                <span className="mt-1 text-[13px] text-white/60 line-through">
                  {formatPrice(selectedPricePreview.original)}
                </span>
              ) : null}
            </span>
          </button>
          <div className="ultima-nav-dock">{bottomNav}</div>
        </div>
      </div>
    </div>
  );
}
