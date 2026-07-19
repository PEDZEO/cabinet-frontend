import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { balanceApi } from '@/api/balance';
import { promoApi } from '@/api/promo';
import { subscriptionApi } from '@/api/subscription';
import { UltimaDesktopSubscription } from '@/components/ultima/desktop/UltimaDesktopSubscription';
import {
  UltimaSubscriptionConfigurator,
  type UltimaSubscriptionPeriodOption,
} from '@/components/ultima/UltimaSubscriptionConfigurator';
import { UltimaTariffSelector } from '@/components/ultima/UltimaTariffSelector';
import { UltimaTrafficTopUpSection } from '@/components/ultima/UltimaTrafficTopUpSection';
import { UltimaPendingPaymentCard } from '@/components/ultima/UltimaPendingPaymentCard';
import { getDeviceTrafficBreakdown } from '@/features/subscription/utils/deviceTraffic';
import { createApplyPromoDiscount } from '@/features/subscription/utils/pricing';
import {
  getSortedUltimaTariffs,
  getUltimaBaseDeviceLimit,
  getUltimaPeriodsForDeviceLimit,
  getUltimaTariffMaxDeviceLimit,
  isUltimaTariffUnlimited,
} from '@/features/ultima/subscription';
import { useCurrency } from '@/hooks/useCurrency';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePendingTopUpFollowUpState } from '@/hooks/usePendingTopUpFollowUpState';
import {
  showSuccessNotification,
  useCloseOnSuccessNotification,
} from '@/store/successNotification';
import { useHaptic, usePlatform } from '@/platform';
import { useAuthStore } from '@/store/auth';
import type { PaymentMethod, Subscription, TariffPeriod } from '@/types';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { clearPendingTopUpFollowUp, writePendingTopUpFollowUp } from '@/utils/topUpFollowUp';
import { trackAnalyticsConversion, trackAnalyticsEvent } from '@/utils/analyticsEvents';

const ULTIMA_PENDING_PURCHASE_KEY = 'ultima_pending_purchase_v1';

type PendingUltimaPurchase = {
  mode?: 'purchase' | 'switch';
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
  const { pendingTopUp } = usePendingTopUpFollowUpState();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { currencySymbol } = useCurrency();
  const haptic = useHaptic();
  const { openLink, openTelegramLink } = usePlatform();
  const isDesktopViewport = useMediaQuery('(min-width: 1024px)');

  const [selectedDeviceLimitState, setSelectedDeviceLimit] = useState(1);
  const [selectedPeriodDays, setSelectedPeriodDays] = useState<number | null>(null);
  const [selectedTrafficPackage, setSelectedTrafficPackage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [awaitingPaymentCompletion, setAwaitingPaymentCompletion] = useState(false);
  const [isFinalizingPending, setIsFinalizingPending] = useState(false);
  const lastTariffIdRef = useRef<number | null>(null);
  const lastHapticDeviceLimitRef = useRef<number | null>(null);
  const autoPurchaseAttemptRef = useRef<string | null>(null);
  const finalizeInProgressRef = useRef(false);
  const checkoutViewTrackedRef = useRef(false);

  const { data: purchaseOptions, isLoading } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: subscriptionApi.getPurchaseOptions,
    staleTime: 60000,
    refetchOnMount: true,
    placeholderData: (previousData) => previousData,
  });
  const { data: subscriptionResponse, isLoading: isSubscriptionLoading } = useQuery({
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

  const subscription = subscriptionResponse?.subscription ?? null;
  const isCheckoutLoading = isLoading || isSubscriptionLoading;

  const tariffs = useMemo(() => {
    if (!purchaseOptions || purchaseOptions.sales_mode !== 'tariffs') return [];
    return getSortedUltimaTariffs(purchaseOptions.tariffs, subscription);
  }, [purchaseOptions, subscription]);

  const currentTariffId = useMemo(
    () => subscription?.tariff_id ?? tariffs.find((tariff) => tariff.is_current)?.id ?? null,
    [subscription, tariffs],
  );

  const [selectedTariffId, setSelectedTariffId] = useState<number | null>(null);
  const [isMobileTariffChooserOpen, setIsMobileTariffChooserOpen] = useState(false);
  const [hasChosenMobileTariff, setHasChosenMobileTariff] = useState(false);

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
    }
  }, [isDesktopViewport, tariffs.length]);

  const selectedTariff = useMemo(() => {
    if (!tariffs.length) return null;
    if (selectedTariffId) {
      return tariffs.find((tariff) => tariff.id === selectedTariffId) ?? tariffs[0];
    }
    return tariffs[0];
  }, [tariffs, selectedTariffId]);
  const selectedTariffIsCurrent =
    !!selectedTariff && (selectedTariff.id === currentTariffId || selectedTariff.is_current);
  const isTariffSwitchFlow = Boolean(
    subscription?.is_active &&
    !subscription?.is_expired &&
    currentTariffId &&
    selectedTariff &&
    !selectedTariffIsCurrent,
  );
  const selectedTariffHasTopUp =
    !!selectedTariff &&
    selectedTariffIsCurrent &&
    !isUltimaTariffUnlimited(selectedTariff) &&
    selectedTariff.traffic_topup_enabled !== false &&
    subscription?.is_active === true;
  const shouldOpenTrafficTopUp = searchParams.get('trafficTopUp') === '1';

  const { data: trafficPackages } = useQuery({
    queryKey: ['traffic-packages', 'ultima-purchase', selectedTariff?.id],
    queryFn: subscriptionApi.getTrafficPackages,
    enabled: selectedTariffHasTopUp,
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const { data: tariffSwitchPreview, isFetching: isTariffSwitchPreviewFetching } = useQuery({
    queryKey: ['tariff-switch-preview', selectedTariff?.id],
    queryFn: () => subscriptionApi.previewTariffSwitch(selectedTariff!.id),
    enabled: isTariffSwitchFlow && !!selectedTariff,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });

  const minDeviceLimit = selectedTariff ? getUltimaBaseDeviceLimit(selectedTariff) : 1;
  const maxDeviceLimit = selectedTariff
    ? getUltimaTariffMaxDeviceLimit(
        selectedTariff,
        subscription?.device_limit ?? 1,
        selectedTariffIsCurrent,
      )
    : 1;
  const preferredDeviceLimit = selectedTariffIsCurrent
    ? Math.max(minDeviceLimit, subscription?.device_limit ?? minDeviceLimit)
    : minDeviceLimit;
  const selectedDeviceLimit =
    selectedTariff && selectedTariff.id !== lastTariffIdRef.current
      ? Math.min(Math.max(minDeviceLimit, preferredDeviceLimit), maxDeviceLimit)
      : Math.min(Math.max(minDeviceLimit, selectedDeviceLimitState), maxDeviceLimit);

  useEffect(() => {
    if (isSubscriptionLoading) return;

    if (!selectedTariff) {
      setSelectedDeviceLimit(1);
      lastTariffIdRef.current = null;
      return;
    }

    if (selectedTariff.id !== lastTariffIdRef.current) {
      lastTariffIdRef.current = selectedTariff.id;
      setSelectedDeviceLimit(
        Math.min(Math.max(minDeviceLimit, preferredDeviceLimit), maxDeviceLimit),
      );
      return;
    }

    setSelectedDeviceLimit((previous) =>
      Math.min(Math.max(minDeviceLimit, previous), maxDeviceLimit),
    );
  }, [isSubscriptionLoading, maxDeviceLimit, minDeviceLimit, preferredDeviceLimit, selectedTariff]);

  const applyDeviceLimit = useCallback(
    (nextLimit: number, options?: { withHaptic?: boolean }) => {
      const clamped = Math.min(Math.max(minDeviceLimit, nextLimit), maxDeviceLimit);
      setSelectedDeviceLimit(clamped);
      const withHaptic = options?.withHaptic ?? true;
      if (withHaptic && lastHapticDeviceLimitRef.current !== clamped) {
        haptic.selection();
        lastHapticDeviceLimitRef.current = clamped;
        trackAnalyticsEvent('ultima_device_select', {
          device_limit: clamped,
        });
      }
    },
    [haptic, maxDeviceLimit, minDeviceLimit],
  );

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
      trackAnalyticsConversion('ultima_purchase_success', {
        tariff_name: result.tariff_name,
        subscription_id: result.subscription.id,
        purchase_source: 'balance',
      });
      clearPendingUltimaPurchase();
      clearPendingTopUpFollowUp(userId);
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

  const switchTariffMutation = useMutation({
    mutationFn: (tariffId: number) => subscriptionApi.switchTariff(tariffId),
    onSuccess: async (result) => {
      trackAnalyticsConversion('ultima_tariff_switch_success', {
        tariff_name: result.new_tariff_name,
        subscription_id: result.subscription.id,
        purchase_source: 'balance',
      });
      clearPendingUltimaPurchase();
      clearPendingTopUpFollowUp(userId);
      setAwaitingPaymentCompletion(false);
      setError(null);
      showSuccessNotification({
        type: 'subscription_purchased',
        tariffName: result.new_tariff_name,
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
    onSuccess: (payment, payload) => {
      const redirectUrl = payment.payment_url;
      if (!redirectUrl) {
        clearPendingUltimaPurchase();
        setAwaitingPaymentCompletion(false);
        setError(t('balance.errors.noPaymentLink'));
        return;
      }
      const paymentMethod = paymentMethods?.find((method) => method.id === payload.paymentMethodId);
      const paymentMethodName = paymentMethod
        ? t(`balance.paymentMethods.${paymentMethod.id.toLowerCase().replace(/-/g, '_')}.name`, {
            defaultValue: paymentMethod.name,
          })
        : undefined;
      writePendingTopUpFollowUp(userId, {
        amountKopeks: payload.amountKopeks,
        balanceBeforeKopeks: Math.max(0, balanceData?.balance_kopeks ?? 0),
        paymentUrl: redirectUrl,
        paymentMethodId: payload.paymentMethodId,
        paymentMethodName,
        returnTo: '/subscription',
      });
      trackAnalyticsEvent('ultima_payment_link_created', {
        amount_kopeks: payload.amountKopeks,
        payment_method_id: payload.paymentMethodId,
      });
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

  const purchaseTrafficMutation = useMutation({
    mutationFn: (gb: number) => subscriptionApi.purchaseTraffic(gb),
    onSuccess: async (result) => {
      trackAnalyticsConversion('ultima_traffic_purchase_success', {
        gb: result.gb_added,
        amount_paid_kopeks: result.amount_paid_kopeks,
      });
      setSelectedTrafficPackage(null);
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['subscription'] }),
        queryClient.invalidateQueries({ queryKey: ['balance'] }),
        queryClient.invalidateQueries({ queryKey: ['traffic-packages'] }),
        queryClient.invalidateQueries({ queryKey: ['purchase-options'] }),
      ]);
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
      if (
        finalizeInProgressRef.current ||
        purchaseMutation.isPending ||
        switchTariffMutation.isPending
      )
        return;

      finalizeInProgressRef.current = true;
      setIsFinalizingPending(true);
      try {
        const isPendingSwitch = pending.mode === 'switch';
        let finalizedSubscription: Subscription;
        let tariffName: string;
        if (isPendingSwitch) {
          const result = await subscriptionApi.switchTariff(pending.tariffId);
          finalizedSubscription = result.subscription;
          tariffName = result.new_tariff_name;
        } else {
          const result = await subscriptionApi.purchaseTariff(
            pending.tariffId,
            pending.periodDays,
            undefined,
            pending.deviceLimit,
          );
          finalizedSubscription = result.subscription;
          tariffName = result.tariff_name;
        }
        trackAnalyticsConversion('ultima_purchase_success', {
          tariff_name: tariffName,
          subscription_id: finalizedSubscription.id,
          purchase_source: 'pending_topup',
          finalize_source: source,
          action: isPendingSwitch ? 'tariff_switch' : 'purchase',
        });
        queryClient.setQueryData(['subscription'], (prev: unknown) => {
          const previous = prev as { has_subscription?: boolean } | undefined;
          return {
            ...(previous ?? {}),
            has_subscription: true,
            subscription: finalizedSubscription,
          };
        });
        clearPendingUltimaPurchase();
        setAwaitingPaymentCompletion(false);
        setError(null);
        showSuccessNotification({
          type: 'subscription_purchased',
          tariffName,
          expiresAt: finalizedSubscription.end_date,
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
    [navigate, purchaseMutation.isPending, queryClient, switchTariffMutation.isPending],
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
    if (isCheckoutLoading || checkoutViewTrackedRef.current || !selectedTariff || !selectedPeriod) {
      return;
    }
    checkoutViewTrackedRef.current = true;
    trackAnalyticsEvent('ultima_checkout_view', {
      tariff_id: selectedTariff.id,
      period_days: selectedPeriod.days,
      device_limit: selectedDeviceLimit,
    });
  }, [isCheckoutLoading, selectedDeviceLimit, selectedPeriod, selectedTariff]);

  if (isCheckoutLoading) {
    if (isDesktopViewport) {
      return (
        <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-subscription-desktop">
          <div className="ultima-shell-aura" />
          <div className="ultima-shell-inner lg:max-w-[1200px]">
            <div className="flex min-h-[calc(100dvh-48px)] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/[0.35] border-t-transparent" />
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
  const deviceTrafficBreakdown = getDeviceTrafficBreakdown(selectedTariff, selectedDeviceLimit);
  const trafficUnit = t('common.units.gb', { defaultValue: 'ГБ' });
  const selectedTrafficLabel = isUltimaTariffUnlimited(selectedTariff)
    ? selectedTariff.traffic_limit_label ||
      t('subscription.unlimited', { defaultValue: 'Безлимит' })
    : `${deviceTrafficBreakdown.totalTrafficGb} ${trafficUnit}`;
  const deviceTrafficLabel =
    deviceTrafficBreakdown.trafficPerExtraDeviceGb > 0
      ? deviceTrafficBreakdown.bonusTrafficGb > 0
        ? t('ultima.deviceTrafficBonusSummary', {
            count: deviceTrafficBreakdown.extraDevices,
            bonus: deviceTrafficBreakdown.bonusTrafficGb,
            total: deviceTrafficBreakdown.totalTrafficGb,
          })
        : t('ultima.deviceTrafficPerDevice', {
            traffic: deviceTrafficBreakdown.trafficPerExtraDeviceGb,
          })
      : null;
  const deviceTrafficBadgeLabel =
    deviceTrafficBreakdown.trafficPerExtraDeviceGb > 0
      ? deviceTrafficBreakdown.bonusTrafficGb > 0
        ? t('ultima.deviceTrafficBadge', {
            bonus: deviceTrafficBreakdown.bonusTrafficGb,
            total: deviceTrafficBreakdown.totalTrafficGb,
          })
        : t('ultima.deviceTrafficPerDeviceShort', {
            traffic: deviceTrafficBreakdown.trafficPerExtraDeviceGb,
          })
      : null;
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
  const selectedPriceKopeks = isTariffSwitchFlow
    ? Math.max(0, tariffSwitchPreview?.upgrade_cost_kopeks ?? 0)
    : selectedPricePreview.price;
  const isTariffSwitchPreviewPending =
    isTariffSwitchFlow && !tariffSwitchPreview && isTariffSwitchPreviewFetching;
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

  const canTopUpSelectedTariffTraffic =
    selectedTariffHasTopUp && (trafficPackages?.length ?? 0) > 0;
  const trafficPurchaseErrorMessage =
    purchaseTrafficMutation.error instanceof Error ? purchaseTrafficMutation.error.message : null;
  const bottomNav = <UltimaBottomNav active="home" />;

  const openTopUpForTraffic = async (gb: number) => {
    await subscriptionApi.saveTrafficCart(gb);
    navigate('/balance/top-up?returnTo=/subscription');
  };

  const trafficTopUpSection =
    canTopUpSelectedTariffTraffic && subscription ? (
      <UltimaTrafficTopUpSection
        t={t}
        formatPrice={formatPrice}
        trafficLimitGb={subscription.traffic_limit_gb}
        trafficUsedGb={subscription.traffic_used_gb}
        trafficPurchases={subscription.traffic_purchases}
        trafficPackages={trafficPackages}
        selectedTrafficPackage={selectedTrafficPackage}
        setSelectedTrafficPackage={setSelectedTrafficPackage}
        purchaseBalanceKopeks={currentBalanceKopeks}
        isPending={purchaseTrafficMutation.isPending}
        error={trafficPurchaseErrorMessage}
        initiallyExpanded={shouldOpenTrafficTopUp}
        onPurchaseTraffic={(gb) => purchaseTrafficMutation.mutate(gb)}
        onTopUpBalance={(gb) => {
          void openTopUpForTraffic(gb);
        }}
      />
    ) : null;

  const openTopUpForSubscription = async () => {
    setError(null);
    if (
      createPaymentMutation.isPending ||
      purchaseMutation.isPending ||
      switchTariffMutation.isPending ||
      isFinalizingPending ||
      isTariffSwitchPreviewPending
    )
      return;
    if (!selectedTariffIdForPurchase || !selectedPeriod) return;
    const shouldSwitchTariff = isTariffSwitchFlow && !!selectedTariff?.id;
    trackAnalyticsEvent('ultima_payment_submit', {
      tariff_id: selectedTariffIdForPurchase,
      period_days: selectedPeriod.days,
      device_limit: selectedDeviceLimit,
      price_kopeks: selectedPriceKopeks,
      payable_kopeks: payableAmountKopeks,
      balance_applied_kopeks: balanceAppliedKopeks,
      action: shouldSwitchTariff ? 'tariff_switch' : 'purchase',
    });
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
      if (shouldSwitchTariff) {
        await switchTariffMutation.mutateAsync(selectedTariff.id);
      } else {
        await purchaseMutation.mutateAsync({
          tariffId: selectedTariffIdForPurchase,
          periodDays: selectedPeriod.days,
          deviceLimit: selectedDeviceLimit,
        });
      }
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
      mode: shouldSwitchTariff ? 'switch' : 'purchase',
      tariffId: selectedTariffIdForPurchase,
      periodDays: selectedPeriod.days,
      deviceLimit: shouldSwitchTariff ? undefined : selectedDeviceLimit,
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
      trackAnalyticsEvent('ultima_min_topup_redirect', {
        amount_kopeks: topupAmountKopeks,
        payment_method_id: method.id,
      });
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

  const selectedTariffSubtitle =
    selectedTariff?.description?.trim() ||
    [
      selectedTariff?.traffic_limit_label,
      selectedTariff ? t('subscription.devices', { count: selectedTariff.device_limit }) : '',
    ]
      .filter(Boolean)
      .join(' · ');
  const showTariffSelector = tariffs.length > 1;
  const shouldShowMobileTariffChooser =
    showTariffSelector &&
    !isDesktopViewport &&
    (isMobileTariffChooserOpen || (currentTariffId === null && !hasChosenMobileTariff));
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
          trackAnalyticsEvent('ultima_tariff_select', {
            tariff_id: tariffId,
            source: 'desktop',
          });
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
      showHeading={false}
      onSelectTariff={(tariffId) => {
        haptic.selection();
        setError(null);
        setSelectedTariffId(tariffId);
        setSelectedPeriodDays(null);
        setHasChosenMobileTariff(true);
        setIsMobileTariffChooserOpen(false);
        trackAnalyticsEvent('ultima_tariff_select', {
          tariff_id: tariffId,
          source: 'mobile',
        });
      }}
    />
  ) : null;

  const periodLabel = (period: TariffPeriod) => {
    if (period.days === 365) {
      return t('ultima.periodYear', { defaultValue: '1 год' });
    }
    if (period.days > 0 && period.days % 30 === 0) {
      const months = period.days / 30;
      if (months >= 1 && months <= 12) {
        return t('ultima.periodMonths', {
          count: months,
          defaultValue: `${months} мес.`,
        });
      }
    }
    return t('ultima.periodDays', {
      count: period.days,
      defaultValue: `${period.days} дн.`,
    });
  };

  const switchRemainingDays = tariffSwitchPreview?.remaining_days ?? subscription?.days_left ?? 0;
  const checkoutPeriodValue = isTariffSwitchFlow
    ? t('subscription.switchTariff.remainingDays', {
        count: switchRemainingDays,
        defaultValue: '{{count}} дн. осталось',
      })
    : periodLabel(selectedPeriod);
  const periodOptions: UltimaSubscriptionPeriodOption[] = displayPeriods.map((period) => {
    const preview = applyPromoDiscount(
      calculateRawPeriodPrice(period),
      period.original_price_kopeks ?? null,
    );
    const monthlyPrice = Math.max(0, Math.round((preview.price / Math.max(1, period.days)) * 30));

    return {
      days: period.days,
      label: periodLabel(period),
      priceLabel: formatPrice(preview.price),
      monthlyLabel: `${formatPrice(monthlyPrice)} / ${t('ultima.monthShort', { defaultValue: 'мес' })}`,
      originalPriceLabel:
        preview.original && preview.original > preview.price ? formatPrice(preview.original) : null,
      isSelected: period.days === selectedPeriod.days,
      isBestDeal: period.days === bestDealPeriodDays,
    };
  });
  const isRenewalFlow = Boolean(
    selectedTariffIsCurrent &&
    subscription?.is_active &&
    !subscription.is_expired &&
    !subscription.is_trial,
  );
  const primaryActionLabel = isTariffSwitchFlow
    ? payableAmountKopeks > 0
      ? t('subscription.switchTariff.topUpAndSwitch', { defaultValue: 'Пополнить и сменить' })
      : t('subscription.switchTariff.action', { defaultValue: 'Сменить тариф' })
    : payableAmountKopeks > 0
      ? t('ultima.topUpAndBuy', { defaultValue: 'Пополнить и купить' })
      : isRenewalFlow
        ? t('ultima.subscriptionBuilder.renewFor', { period: checkoutPeriodValue })
        : t('ultima.subscriptionBuilder.buyFor', { period: checkoutPeriodValue });
  const primaryActionPriceLabel = formatPrice(
    payableAmountKopeks > 0 ? actionAmountKopeks : selectedPriceKopeks,
  );
  const primaryActionMetaLabel =
    payableAmountKopeks > 0
      ? t('ultima.subscriptionBuilder.toTopUp')
      : t('ultima.subscriptionBuilder.fromBalance');
  const switchHint = isTariffSwitchFlow
    ? t('subscription.switchTariff.keepPeriodHint', {
        count: switchRemainingDays,
        defaultValue:
          'Срок подписки сохранится: {{count}} дн. Если нужна доплата, спишем только разницу.',
      })
    : null;

  if (isDesktopViewport) {
    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-subscription-desktop">
        <div className="ultima-shell-aura" />
        <UltimaDesktopSubscription
          planSelector={desktopTariffSelector}
          trafficTopUp={trafficTopUpSection}
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
          isCurrentTariff={selectedTariffIsCurrent}
          isTariffSwitchFlow={isTariffSwitchFlow}
          switchFromLabel={tariffSwitchPreview?.current_tariff_name ?? subscription?.tariff_name}
          switchHint={switchHint}
          trafficLabel={selectedTrafficLabel}
          baseDeviceLimit={currentTariffBaseDeviceLimit}
          selectedDeviceLimit={selectedDeviceLimit}
          minDeviceLimit={minDeviceLimit}
          maxDeviceLimit={maxDeviceLimit}
          periods={periodOptions}
          selectedPeriodLabel={checkoutPeriodValue}
          extraDeviceChargeLabel={extraDeviceChargeLabel}
          deviceTrafficLabel={deviceTrafficLabel}
          legacyDeviceNotice={legacyDeviceNotice}
          onReduceDevices={legacyDeviceNotice ? () => navigate('/ultima/devices') : null}
          totalPriceLabel={formatPrice(selectedPriceKopeks)}
          balanceAppliedLabel={formatPrice(balanceAppliedKopeks)}
          payablePriceLabel={formatPrice(payableAmountKopeks)}
          hasBalanceApplied={balanceAppliedKopeks > 0}
          requiresTopUp={payableAmountKopeks > 0}
          isFree={selectedPriceKopeks === 0}
          actionLabel={primaryActionLabel}
          actionPriceLabel={primaryActionPriceLabel}
          actionMetaLabel={primaryActionMetaLabel}
          error={error}
          paymentRecoveryCard={
            pendingTopUp?.paymentUrl ? (
              <UltimaPendingPaymentCard source="subscription_desktop" compact />
            ) : null
          }
          awaitingPaymentCompletion={awaitingPaymentCompletion}
          isFinalizingPending={isFinalizingPending}
          isPayDisabled={
            purchaseMutation.isPending ||
            switchTariffMutation.isPending ||
            createPaymentMutation.isPending ||
            isFinalizingPending ||
            isTariffSwitchPreviewPending
          }
          bottomNav={bottomNav}
          onSelectDevice={(limit) => applyDeviceLimit(limit)}
          onSelectPeriod={(days) => {
            haptic.impact('light');
            setSelectedPeriodDays(days);
            trackAnalyticsEvent('ultima_period_select', {
              tariff_id: selectedTariffIdForPurchase,
              period_days: days,
              device_limit: selectedDeviceLimit,
              source: 'desktop',
            });
          }}
          onPay={() => {
            void openTopUpForSubscription();
          }}
        />
      </div>
    );
  }

  if (shouldShowMobileTariffChooser) {
    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames">
        <div className="ultima-shell-aura" />
        <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
          <section className="ultima-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            <header className="mb-3">
              <div className="mb-1 flex h-8 items-center">
                {currentTariffId !== null ? (
                  <button
                    type="button"
                    onClick={() => setIsMobileTariffChooserOpen(false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.05] text-white/[0.76]"
                    aria-label={t('common.back')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <h1 className="text-[30px] font-semibold leading-none text-white">
                {t('ultima.subscriptionBuilder.choosePlan')}
              </h1>
              <p className="mt-1.5 text-[12px] leading-[1.45] text-white/[0.62]">
                {t('ultima.subscriptionBuilder.choosePlanHint')}
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
      <UltimaSubscriptionConfigurator
        title={selectedTariff.name}
        subtitle={selectedTariffSubtitle}
        isCurrentTariff={selectedTariffIsCurrent}
        canChangeTariff={showTariffSelector}
        isTariffSwitchFlow={isTariffSwitchFlow}
        switchFromLabel={tariffSwitchPreview?.current_tariff_name ?? subscription?.tariff_name}
        switchHint={switchHint}
        trafficLabel={selectedTrafficLabel}
        baseDeviceLimit={currentTariffBaseDeviceLimit}
        selectedDeviceLimit={selectedDeviceLimit}
        minDeviceLimit={minDeviceLimit}
        maxDeviceLimit={maxDeviceLimit}
        extraDeviceSummary={
          selectedExtraDevices > 0
            ? t('ultima.extraDevicesCompact', {
                count: selectedExtraDevices,
                base: currentTariffBaseDeviceLimit,
              })
            : null
        }
        extraDevicePriceLabel={
          selectedExtraDevices > 0
            ? extraDeviceChargeKopeks > 0
              ? `+${formatPrice(extraDeviceChargeKopeks)}`
              : t('ultima.noExtraDeviceCharge')
            : null
        }
        deviceTrafficLabel={deviceTrafficBadgeLabel}
        periods={periodOptions}
        selectedPeriodLabel={checkoutPeriodValue}
        totalPriceLabel={formatPrice(selectedPriceKopeks)}
        balanceAppliedLabel={formatPrice(balanceAppliedKopeks)}
        payablePriceLabel={formatPrice(payableAmountKopeks)}
        hasBalanceApplied={balanceAppliedKopeks > 0}
        requiresTopUp={payableAmountKopeks > 0}
        isFree={selectedPriceKopeks === 0}
        actionLabel={primaryActionLabel}
        actionPriceLabel={primaryActionPriceLabel}
        actionMetaLabel={primaryActionMetaLabel}
        error={error}
        minimumTopUpHint={
          !error && requiresMinTopUpBump && defaultPaymentMethod
            ? t('ultima.minimumTopUpHint', {
                missing: formatPrice(payableAmountKopeks),
                minimum: formatPrice(actionAmountKopeks),
              })
            : null
        }
        paymentRecoveryCard={
          pendingTopUp?.paymentUrl ? (
            <UltimaPendingPaymentCard source="subscription_mobile" compact />
          ) : null
        }
        trafficTopUp={trafficTopUpSection}
        bottomNav={bottomNav}
        isPayDisabled={
          purchaseMutation.isPending ||
          switchTariffMutation.isPending ||
          createPaymentMutation.isPending ||
          isFinalizingPending ||
          isTariffSwitchPreviewPending
        }
        onChangeTariff={() => {
          haptic.selection();
          setIsMobileTariffChooserOpen(true);
        }}
        onSelectDevice={(limit) => applyDeviceLimit(limit)}
        onSelectPeriod={(days) => {
          haptic.impact('light');
          setSelectedPeriodDays(days);
          trackAnalyticsEvent('ultima_period_select', {
            tariff_id: selectedTariffIdForPurchase,
            period_days: days,
            device_limit: selectedDeviceLimit,
            source: 'mobile',
          });
        }}
        onPay={() => {
          void openTopUpForSubscription();
        }}
      />
    </div>
  );
}
