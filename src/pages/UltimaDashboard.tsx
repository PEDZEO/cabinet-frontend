import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';
import { balanceApi } from '@/api/balance';
import { brandingApi, getCachedUltimaThemeConfig } from '@/api/branding';
import { infoApi } from '@/api/info';
import { notificationsApi } from '@/api/notifications';
import { promoApi } from '@/api/promo';
import { referralApi } from '@/api/referral';
import { subscriptionApi } from '@/api/subscription';
import { tapRewardsApi, type TapRewardResponse } from '@/api/tapRewards';
import { UltimaReferralCta } from '@/components/ultima/UltimaReferralCta';
import { UltimaPendingPaymentCard } from '@/components/ultima/UltimaPendingPaymentCard';
import {
  UltimaDesktopDashboard,
  UltimaDesktopDashboardSkeleton,
  type UltimaDashboardStatusTone,
} from '@/components/ultima/desktop/UltimaDesktopDashboard';
import { ticketsApi } from '@/api/tickets';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { UltimaTrialGuide } from '@/components/ultima/UltimaTrialGuide';
import { UltimaTrafficWarningCard } from '@/components/ultima/UltimaTrafficWarningCard';
import { useCurrency } from '@/hooks/useCurrency';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePendingTopUpFollowUpState } from '@/hooks/usePendingTopUpFollowUpState';
import { useBrandLogoImage } from '@/hooks/useBrandLogoImage';
import { useBranding } from '@/hooks/useBranding';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/platform';
import { useAuthStore } from '@/store/auth';
import {
  readUltimaConnectionCompleted,
  readUltimaConnectionReminderHidden,
  readUltimaConnectionStep,
  writeUltimaConnectionCompleted,
  writeUltimaConnectionReminderHidden,
  writeUltimaConnectionStep,
} from '@/features/ultima/connectionFlow';
import {
  hasUltimaTrialGuideBeenAcknowledged,
  writeUltimaTrialGuideAcknowledged,
} from '@/features/ultima/trialOnboardingFlow';
import {
  getUltimaNextAction,
  ULTIMA_RENEWAL_NOTICE_DAYS,
  type UltimaNextActionKind,
} from '@/features/ultima/nextAction';
import { warmUltimaStartup } from '@/features/ultima/warmup';
import { trackAnalyticsEvent } from '@/utils/analyticsEvents';

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-[72px] w-[72px] text-white/95">
    <path
      d="M12 3 5 5.7v5.54c0 4.4 2.99 8.5 7 9.76 4.01-1.26 7-5.36 7-9.76V5.7L12 3Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M9.3 12.4 11.2 14.3 15.1 10.4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M3 12h18M12 3c2.4 2.3 3.6 5.4 3.6 9S14.4 18.7 12 21M12 3c-2.4 2.3-3.6 5.4-3.6 9S9.6 18.7 12 21"
      stroke="currentColor"
      strokeWidth="1.4"
    />
  </svg>
);

const SetupIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M10 14 21 3M16 3h5v5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 10v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3h8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M11 18h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const DevicesHomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="3.5" y="5" width="11" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="16.5" y="8" width="4" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8.75 15.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const AdminIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path
      d="M12 3 4 6v5.5c0 4.2 2.8 8.1 8 9.5 5.2-1.4 8-5.3 8-9.5V6l-8-3Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path d="m9.5 12 1.8 1.8 3.2-3.2" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

type ShieldRipple = {
  id: number;
  x: number;
  y: number;
  size: number;
};

type ShieldDigit = {
  id: number;
  x: number;
  y: number;
  value: number;
  driftX: number;
  driftY: number;
  size: number;
  duration: number;
  opacity: number;
  startRotate: number;
  endRotate: number;
  scale: number;
};

export function UltimaDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const { currencySymbol } = useCurrency();
  const { hasCustomLogo, logoUrl, hasCachedBranding, isBrandingLoading } = useBranding();
  const haptic = useHaptic();
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const isDesktopViewport = useMediaQuery('(min-width: 1024px)');
  const { pendingTopUp } = usePendingTopUpFollowUpState();
  const rippleIdRef = useRef(0);
  const digitIdRef = useRef(0);
  const tapCountRef = useRef(0);
  const tapResetTimeoutRef = useRef<number | null>(null);
  const tapRewardPendingRef = useRef(0);
  const tapRewardFlushTimeoutRef = useRef<number | null>(null);
  const dashboardMessageTimeoutRef = useRef<number | null>(null);
  const warmedLanguagesRef = useRef<Set<string>>(new Set());
  const trialAutoActivationAttemptedRef = useRef(false);
  const dashboardViewTrackedRef = useRef(false);
  const [shieldRipples, setShieldRipples] = useState<ShieldRipple[]>([]);
  const [shieldDigits, setShieldDigits] = useState<ShieldDigit[]>([]);
  const [connectionStep, setConnectionStep] = useState<1 | 2 | 3>(1);
  const [isConnectionCompleted, setIsConnectionCompleted] = useState(false);
  const [isReminderHidden, setIsReminderHidden] = useState(false);
  const [isTrialGuideVisible, setIsTrialGuideVisible] = useState(false);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const hasCachedThemeConfig = useMemo(() => getCachedUltimaThemeConfig() !== null, []);

  const {
    data: subscriptionResponse,
    isFetched: isSubscriptionFetched,
    isError: isSubscriptionError,
  } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getSubscription,
    staleTime: 15000,
    refetchOnMount: true,
    placeholderData: (previousData) => previousData,
  });
  const { data: purchaseOptions } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: subscriptionApi.getPurchaseOptions,
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });
  const { data: notificationSettings } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: notificationsApi.getSettings,
    staleTime: 60000,
    retry: false,
    placeholderData: (previousData) => previousData,
  });
  const { data: tapRewardProgress } = useQuery({
    queryKey: ['tap-rewards', 'progress'],
    queryFn: tapRewardsApi.getProgress,
    staleTime: 30000,
    retry: false,
    placeholderData: (previousData) => previousData,
  });
  const tapRewardPauseMs = useMemo(() => {
    const seconds = tapRewardProgress?.streak_timeout_seconds ?? 1;
    return seconds > 0 ? Math.max(250, seconds * 1000) : 0;
  }, [tapRewardProgress?.streak_timeout_seconds]);
  const { data: promoOffers } = useQuery({
    queryKey: ['promo-offers'],
    queryFn: promoApi.getOffers,
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });
  const { data: activeDiscount } = useQuery({
    queryKey: ['active-discount'],
    queryFn: promoApi.getActiveDiscount,
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });
  const { data: ultimaThemeConfig } = useQuery({
    queryKey: ['ultima-theme-config'],
    queryFn: brandingApi.getUltimaThemeConfig,
    initialData: getCachedUltimaThemeConfig() ?? undefined,
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });
  const {
    isLoaded: isHomeLogoLoaded,
    hasError: hasHomeLogoLoadError,
    handleLoad: handleHomeLogoLoad,
    handleError: handleHomeLogoError,
  } = useBrandLogoImage(logoUrl);
  const { data: referralInfo } = useQuery({
    queryKey: ['referral-info'],
    queryFn: referralApi.getReferralInfo,
    staleTime: 60000,
    retry: false,
    placeholderData: (previousData) => previousData,
  });
  const { data: referralTerms } = useQuery({
    queryKey: ['referral-terms'],
    queryFn: referralApi.getReferralTerms,
    staleTime: 60000,
    retry: false,
    placeholderData: (previousData) => previousData,
  });
  const subscription = subscriptionResponse?.subscription ?? null;
  const hasAnySubscription = subscriptionResponse?.has_subscription === true;
  const { data: dashboardDevicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: subscriptionApi.getDevices,
    enabled: hasAnySubscription,
    staleTime: 10000,
    placeholderData: (previousData) => previousData,
  });
  const isI18nReady =
    i18n.isInitialized &&
    (typeof i18n.hasLoadedNamespace !== 'function' || i18n.hasLoadedNamespace('translation'));
  const isSubscriptionReady =
    isSubscriptionFetched || Boolean(subscriptionResponse) || isSubscriptionError;
  const isActive = Boolean(subscription?.is_active && !subscription?.is_expired);
  const isActiveTrial = Boolean(subscription?.is_trial && isActive);
  const trafficWarningThreshold = Math.max(
    25,
    Math.min(95, notificationSettings?.traffic_warning_percent ?? 80),
  );
  const trafficWarningLimitGb = Math.max(0, subscription?.traffic_limit_gb ?? 0);
  const trafficWarningUsedGb = Math.max(0, subscription?.traffic_used_gb ?? 0);
  const trafficWarningPercent = Math.max(0, Math.min(100, subscription?.traffic_used_percent ?? 0));
  const trafficWarningRemainingGb = Math.max(
    0,
    subscription?.metered_traffic_remaining_gb ?? trafficWarningLimitGb - trafficWarningUsedGb,
  );
  const isTrafficExhausted = Boolean(
    subscription?.metered_access_blocked ||
    trafficWarningPercent >= 100 ||
    trafficWarningRemainingGb <= 0,
  );
  const shouldShowTrafficWarning = Boolean(
    isActive &&
    trafficWarningLimitGb > 0 &&
    notificationSettings?.traffic_warning_enabled !== false &&
    trafficWarningPercent >= trafficWarningThreshold,
  );
  const statusLabel = isActiveTrial
    ? t('subscription.trialStatus')
    : isActive
      ? t('subscription.active')
      : t('subscription.expired');
  const daysLeft = useMemo(() => {
    if (!subscription?.end_date) return null;
    const end = new Date(subscription.end_date).getTime();
    if (Number.isNaN(end)) return null;
    const diff = end - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [subscription?.end_date]);
  const statusToneKey: UltimaDashboardStatusTone = !isActive
    ? 'expired'
    : isActiveTrial
      ? 'trial'
      : (daysLeft ?? 99) <= ULTIMA_RENEWAL_NOTICE_DAYS
        ? 'warning'
        : 'active';
  const statusTone =
    statusToneKey === 'expired'
      ? {
          dot: 'bg-rose-300/95',
          halo: 'bg-rose-400/[0.45]',
          pill: 'border-rose-200/25 bg-rose-400/[0.16] text-rose-100/95',
          pulse: 'from-rose-400/[0.32] via-rose-300/[0.22] to-transparent',
        }
      : statusToneKey === 'trial'
        ? {
            dot: 'bg-emerald-200/95',
            halo: 'bg-emerald-300/[0.45]',
            pill: 'border-emerald-200/[0.28] bg-emerald-300/[0.16] text-emerald-50/95',
            pulse: 'from-emerald-300/[0.34] via-emerald-200/[0.24] to-transparent',
          }
        : statusToneKey === 'warning'
          ? {
              dot: 'bg-amber-200/95',
              halo: 'bg-amber-300/[0.42]',
              pill: 'border-amber-200/30 bg-amber-300/[0.16] text-amber-50/95',
              pulse: 'from-amber-300/30 via-amber-200/20 to-transparent',
            }
          : {
              dot: 'bg-emerald-200/95',
              halo: 'bg-emerald-300/[0.45]',
              pill: 'border-emerald-200/[0.28] bg-emerald-300/[0.16] text-emerald-50/95',
              pulse: 'from-emerald-300/[0.34] via-emerald-200/[0.24] to-transparent',
            };
  const purchaseCtaLabel = useMemo(() => {
    if (isActiveTrial) {
      return t('ultima.buySubscriptionTrial', { defaultValue: 'Купить подписку' });
    }
    if (!hasAnySubscription) {
      return t('ultima.chooseTariff', { defaultValue: 'Выбрать тариф' });
    }
    if (!isActive) {
      return t('ultima.buySubscriptionRenew', { defaultValue: 'Продлить подписку' });
    }
    if ((daysLeft ?? 99) <= ULTIMA_RENEWAL_NOTICE_DAYS) {
      return t('subscription.renew', { defaultValue: 'Продлить' });
    }
    return t('subscription.extend', { defaultValue: 'Продлить подписку' });
  }, [daysLeft, hasAnySubscription, isActive, isActiveTrial, t]);
  const purchaseFromLabel = useMemo(() => {
    if (!purchaseOptions || purchaseOptions.sales_mode !== 'tariffs')
      return `от 199 ${currencySymbol}`;
    const periods = purchaseOptions.tariffs
      .filter((tariff) => tariff.is_available)
      .flatMap((tariff) => tariff.periods);
    if (!periods.length) return `от 199 ${currencySymbol}`;

    const discountedPerMonth = periods
      .filter(
        (period) =>
          (period.original_price_kopeks ?? 0) > period.price_kopeks &&
          period.price_per_month_kopeks > 0,
      )
      .map((period) => period.price_per_month_kopeks);

    if (discountedPerMonth.length) {
      const minPerMonth = Math.min(...discountedPerMonth);
      return `от ${Math.round(minPerMonth / 100)} ${currencySymbol}`;
    }

    const minTariff = Math.min(...periods.map((period) => period.price_kopeks));
    return `от ${Math.round(minTariff / 100)} ${currencySymbol}`;
  }, [purchaseOptions, currencySymbol]);

  const expiryLabel = (() => {
    if (!subscription?.end_date) return t('subscription.notActive');
    const date = new Date(subscription.end_date);
    if (Number.isNaN(date.getTime())) return t('subscription.notActive');
    const formatted = date.toLocaleDateString(i18n.language || 'ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if ((i18n.language || '').toLowerCase().startsWith('ru')) {
      return `до ${formatted.replace(' г.', '')}`;
    }
    return formatted;
  })();
  const trialExpiryDateLabel = (() => {
    if (!subscription?.end_date) return t('subscription.notActive');
    const date = new Date(subscription.end_date);
    if (Number.isNaN(date.getTime())) return t('subscription.notActive');
    const formatted = date.toLocaleDateString(i18n.language || 'ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if ((i18n.language || '').toLowerCase().startsWith('ru')) {
      return formatted.replace(' г.', '');
    }
    return formatted;
  })();
  const trialSignature = useMemo(() => {
    if (!subscription?.is_trial || !subscription.end_date) {
      return null;
    }
    return `${subscription.id}:${subscription.end_date}`;
  }, [subscription?.end_date, subscription?.id, subscription?.is_trial]);
  const isTrialGuideAcknowledged = hasUltimaTrialGuideBeenAcknowledged(user?.id, trialSignature);

  const { data: trialInfo } = useQuery({
    queryKey: ['trial-info'],
    queryFn: subscriptionApi.getTrialInfo,
    enabled: isSubscriptionReady && !hasAnySubscription,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });

  const activateTrialMutation = useMutation({
    mutationFn: subscriptionApi.activateTrial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['trial-info'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
    },
  });
  const claimOfferMutation = useMutation({
    mutationFn: (offerId: number) => promoApi.claimOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-offers'] });
      queryClient.invalidateQueries({ queryKey: ['active-discount'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      setPromoMessage(t('promo.offers.activated', { defaultValue: 'Предложение активировано' }));
      window.setTimeout(() => setPromoMessage(null), 3500);
    },
    onError: () => {
      setPromoMessage(
        t('promo.offers.activationFailed', { defaultValue: 'Не удалось активировать предложение' }),
      );
      window.setTimeout(() => setPromoMessage(null), 3500);
    },
  });

  const showDashboardMessage = useCallback((message: string) => {
    setPromoMessage(message);
    if (dashboardMessageTimeoutRef.current !== null) {
      window.clearTimeout(dashboardMessageTimeoutRef.current);
    }
    dashboardMessageTimeoutRef.current = window.setTimeout(() => {
      setPromoMessage(null);
      dashboardMessageTimeoutRef.current = null;
    }, 3500);
  }, []);

  const getTapRewardMessage = useCallback(
    (result: TapRewardResponse) => {
      if (result.message) return result.message;

      if (result.reward_type === 'balance') {
        const amount = Math.round((result.reward_value ?? 0) / 100);
        return t('ultima.tapRewardBalance', {
          defaultValue: `Подарок за тапы: +${amount} ${currencySymbol}`,
          amount,
          currency: currencySymbol,
        });
      }

      const days = result.reward_value ?? 0;
      return t('ultima.tapRewardDays', {
        defaultValue: `Подарок за тапы: +${days} дн. к подписке`,
        days,
      });
    },
    [currencySymbol, t],
  );

  const flushTapRewards = useCallback(async () => {
    const pendingCount = tapRewardPendingRef.current;
    if (pendingCount <= 0) {
      return;
    }

    tapRewardPendingRef.current = 0;
    let remaining = pendingCount;
    let latestResponse: TapRewardResponse | null = null;
    let rewardResponse: TapRewardResponse | null = null;

    try {
      while (remaining > 0) {
        const response = await tapRewardsApi.recordTap();
        remaining -= 1;
        latestResponse = response;

        if (response.reward_granted) {
          rewardResponse = response;
        }

        if (!response.enabled) {
          break;
        }
      }
    } catch {
      if (remaining > 0) {
        tapRewardPendingRef.current += remaining;
        if (tapRewardFlushTimeoutRef.current === null) {
          tapRewardFlushTimeoutRef.current = window.setTimeout(() => {
            tapRewardFlushTimeoutRef.current = null;
            void flushTapRewards();
          }, 1200);
        }
      }
      return;
    }

    if (latestResponse) {
      queryClient.setQueryData(['tap-rewards', 'progress'], latestResponse);
    }

    if (!rewardResponse) {
      return;
    }

    showDashboardMessage(getTapRewardMessage(rewardResponse));
    queryClient.invalidateQueries({ queryKey: ['balance'] });
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
    queryClient.invalidateQueries({ queryKey: ['tap-rewards', 'progress'] });
    void refreshUser();
  }, [getTapRewardMessage, queryClient, refreshUser, showDashboardMessage]);

  const scheduleTapRewardFlush = useCallback(() => {
    tapRewardPendingRef.current += 1;
    if (tapRewardFlushTimeoutRef.current !== null) {
      return;
    }

    tapRewardFlushTimeoutRef.current = window.setTimeout(() => {
      tapRewardFlushTimeoutRef.current = null;
      void flushTapRewards();
    }, 450);
  }, [flushTapRewards]);

  const scheduleTapCounterReset = useCallback(() => {
    if (tapResetTimeoutRef.current !== null) {
      window.clearTimeout(tapResetTimeoutRef.current);
      tapResetTimeoutRef.current = null;
    }

    if (tapRewardPauseMs <= 0) {
      return;
    }

    tapResetTimeoutRef.current = window.setTimeout(() => {
      tapCountRef.current = 0;
      tapResetTimeoutRef.current = null;
    }, tapRewardPauseMs);
  }, [tapRewardPauseMs]);

  useEffect(() => {
    // Warm subscription route chunk so dashboard -> purchase transition stays seamless.
    void import('./Subscription');
  }, []);

  useEffect(() => {
    if (!tapRewardProgress?.enabled) {
      tapCountRef.current = 0;
      return;
    }

    if (tapRewardPendingRef.current > 0) {
      return;
    }

    tapCountRef.current = Math.max(0, tapRewardProgress.progress_taps ?? 0);
  }, [tapRewardProgress?.enabled, tapRewardProgress?.progress_taps]);

  useEffect(() => {
    if (!isSubscriptionReady || hasAnySubscription) {
      return;
    }
    if (!trialInfo?.is_available) {
      return;
    }
    if (activateTrialMutation.isPending) {
      return;
    }
    if (trialAutoActivationAttemptedRef.current) {
      return;
    }
    trialAutoActivationAttemptedRef.current = true;
    activateTrialMutation.mutate();
  }, [activateTrialMutation, hasAnySubscription, isSubscriptionReady, trialInfo?.is_available]);

  const shouldHoldForAutoTrial =
    isSubscriptionReady &&
    !hasAnySubscription &&
    ((trialInfo?.is_available ?? true) ||
      activateTrialMutation.isPending ||
      !trialAutoActivationAttemptedRef.current);

  useEffect(() => {
    const language = i18n.language || 'ru';
    if (warmedLanguagesRef.current.has(language)) {
      return;
    }
    warmedLanguagesRef.current.add(language);
    void warmUltimaStartup(queryClient, { language });
  }, [i18n.language, queryClient]);

  useEffect(() => {
    const readStep = () => {
      setConnectionStep(readUltimaConnectionStep(user?.id));
      setIsConnectionCompleted(readUltimaConnectionCompleted(user?.id));
      setIsReminderHidden(readUltimaConnectionReminderHidden(user?.id));
    };

    readStep();
    window.addEventListener('focus', readStep);
    document.addEventListener('visibilitychange', readStep);
    return () => {
      window.removeEventListener('focus', readStep);
      document.removeEventListener('visibilitychange', readStep);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!trialSignature || !isActiveTrial) {
      setIsTrialGuideVisible(false);
      return;
    }

    if (isConnectionCompleted && !isTrialGuideAcknowledged) {
      writeUltimaTrialGuideAcknowledged(user?.id, trialSignature);
      setIsTrialGuideVisible(false);
    }
  }, [isActiveTrial, isConnectionCompleted, isTrialGuideAcknowledged, trialSignature, user?.id]);

  useEffect(() => {
    if (!trialSignature || !isActiveTrial || isConnectionCompleted || connectionStep !== 1) {
      setIsTrialGuideVisible(false);
      return;
    }
    if (isTrialGuideAcknowledged) {
      setIsTrialGuideVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsTrialGuideVisible(true);
    }, 420);

    return () => window.clearTimeout(timer);
  }, [
    connectionStep,
    isActiveTrial,
    isConnectionCompleted,
    isTrialGuideAcknowledged,
    trialSignature,
    user?.id,
  ]);

  useEffect(() => {
    return () => {
      if (tapResetTimeoutRef.current !== null) {
        window.clearTimeout(tapResetTimeoutRef.current);
      }
      if (tapRewardFlushTimeoutRef.current !== null) {
        window.clearTimeout(tapRewardFlushTimeoutRef.current);
      }
      if (dashboardMessageTimeoutRef.current !== null) {
        window.clearTimeout(dashboardMessageTimeoutRef.current);
      }
    };
  }, []);

  const handleShieldTap = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      haptic.impact('light');
      scheduleTapRewardFlush();
      const nextTapNumber = ++tapCountRef.current;
      scheduleTapCounterReset();

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const id = rippleIdRef.current++;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 1.85;
      setShieldRipples((previous) => [...previous, { id, x, y, size }]);

      const side = nextTapNumber % 2 === 0 ? 1 : -1;
      const digitId = digitIdRef.current++;
      const digit = {
        id: digitId,
        x,
        y: y - 2,
        value: nextTapNumber,
        driftX: side * (10 + Math.random() * 10),
        driftY: -(28 + Math.random() * 18),
        size: 16 + Math.min(String(nextTapNumber).length, 3) * 1.5,
        duration: 820 + Math.random() * 180,
        opacity: 0.84 + Math.random() * 0.12,
        startRotate: side * (3 + Math.random() * 5),
        endRotate: side * (8 + Math.random() * 8),
        scale: 1.04 + Math.random() * 0.1,
      } satisfies ShieldDigit;
      setShieldDigits((previous) => [...previous, digit]);

      window.setTimeout(() => {
        setShieldRipples((previous) => previous.filter((ripple) => ripple.id !== id));
      }, 900);

      window.setTimeout(() => {
        setShieldDigits((previous) => previous.filter((item) => item.id !== digitId));
      }, 1280);
    },
    [haptic, scheduleTapCounterReset, scheduleTapRewardFlush],
  );

  const openSupport = () => {
    void import('./Support');
    void queryClient.prefetchQuery({
      queryKey: ['support-config'],
      queryFn: infoApi.getSupportConfig,
    });
    void queryClient.prefetchQuery({
      queryKey: ['tickets'],
      queryFn: () => ticketsApi.getTickets({ per_page: 20 }),
    });
    navigate('/support');
  };

  const openReferral = useCallback(() => {
    haptic.impact('light');
    trackAnalyticsEvent('ultima_referral_entry_click', {
      source: 'dashboard',
    });
    void import('./Referral');
    void queryClient.prefetchQuery({
      queryKey: ['referral-info'],
      queryFn: referralApi.getReferralInfo,
      staleTime: 15000,
    });
    void queryClient.prefetchQuery({
      queryKey: ['referral-terms'],
      queryFn: referralApi.getReferralTerms,
      staleTime: 15000,
    });
    void queryClient.prefetchQuery({
      queryKey: ['referral-list'],
      queryFn: () => referralApi.getReferralList({ per_page: 20 }),
      staleTime: 15000,
    });
    void queryClient.prefetchQuery({
      queryKey: ['referral-earnings'],
      queryFn: () => referralApi.getReferralEarnings({ per_page: 20 }),
      staleTime: 15000,
    });
    navigate('/referral');
  }, [haptic, navigate, queryClient]);

  const openConnection = useCallback(
    (resetToFirstStep = false) => {
      haptic.impact('light');

      if (resetToFirstStep) {
        writeUltimaConnectionCompleted(user?.id, false);
        writeUltimaConnectionStep(user?.id, 1);
        writeUltimaConnectionReminderHidden(user?.id, false);
        setConnectionStep(1);
        setIsConnectionCompleted(false);
        setIsReminderHidden(false);
      }

      void import('./UltimaConnection');
      void queryClient.prefetchQuery({
        queryKey: ['appConfig'],
        queryFn: () => subscriptionApi.getAppConfig(),
        staleTime: 0,
      });
      navigate('/connection');
    },
    [haptic, navigate, queryClient, user?.id],
  );

  const acknowledgeTrialGuide = useCallback(() => {
    if (!trialSignature) {
      return;
    }
    writeUltimaTrialGuideAcknowledged(user?.id, trialSignature);
  }, [trialSignature, user?.id]);

  const handleTrialGuideStart = useCallback(() => {
    acknowledgeTrialGuide();
    setIsTrialGuideVisible(false);
    openConnection(true);
  }, [acknowledgeTrialGuide, openConnection]);

  const handleTrialGuideDismiss = useCallback(() => {
    acknowledgeTrialGuide();
    setIsTrialGuideVisible(false);
  }, [acknowledgeTrialGuide]);

  const openDevices = useCallback(
    (connect = false, source = 'dashboard') => {
      haptic.impact('light');
      trackAnalyticsEvent('ultima_devices_open', {
        source,
        connect,
      });
      void queryClient.prefetchQuery({
        queryKey: ['subscription'],
        queryFn: subscriptionApi.getSubscription,
        staleTime: 15000,
      });
      void queryClient.prefetchQuery({
        queryKey: ['devices'],
        queryFn: subscriptionApi.getDevices,
        staleTime: 10000,
      });
      void queryClient.prefetchQuery({
        queryKey: ['device-reduction-info'],
        queryFn: subscriptionApi.getDeviceReductionInfo,
        staleTime: 10000,
      });
      void import('./UltimaDevices');
      navigate(connect ? '/ultima/devices?connect=1' : '/ultima/devices');
    },
    [haptic, navigate, queryClient],
  );

  const openSubscriptionInfo = useCallback(() => {
    haptic.impact('light');
    void queryClient.prefetchQuery({
      queryKey: ['subscription'],
      queryFn: subscriptionApi.getSubscription,
      staleTime: 15000,
    });
    void import('./UltimaSubscriptionInfo');
    navigate('/ultima/subscription-info');
  }, [haptic, navigate, queryClient]);

  const openSubscriptionPurchase = useCallback(() => {
    haptic.impact('light');
    void queryClient.prefetchQuery({
      queryKey: ['purchase-options'],
      queryFn: subscriptionApi.getPurchaseOptions,
    });
    void queryClient.prefetchQuery({
      queryKey: ['payment-methods'],
      queryFn: balanceApi.getPaymentMethods,
    });
    void queryClient.prefetchQuery({
      queryKey: ['device-price', 'ultima-max'],
      queryFn: () => subscriptionApi.getDevicePrice(1),
    });
    void import('./Subscription');
    navigate('/subscription');
  }, [haptic, navigate, queryClient]);

  const openTrafficPurchase = useCallback(() => {
    trackAnalyticsEvent('ultima_traffic_warning_click', {
      source: 'dashboard',
      percent: Math.round(trafficWarningPercent),
      remaining_gb: trafficWarningRemainingGb,
      is_trial: isActiveTrial,
    });

    if (isActiveTrial) {
      openSubscriptionPurchase();
      return;
    }

    haptic.impact('light');
    void queryClient.prefetchQuery({
      queryKey: ['traffic-packages', 'ultima-purchase', subscription?.tariff_id],
      queryFn: subscriptionApi.getTrafficPackages,
      staleTime: 60000,
    });
    void import('./Subscription');
    navigate('/subscription?trafficTopUp=1');
  }, [
    haptic,
    isActiveTrial,
    navigate,
    openSubscriptionPurchase,
    queryClient,
    subscription?.tariff_id,
    trafficWarningPercent,
    trafficWarningRemainingGb,
  ]);

  const canPermanentlyHideReminder = Boolean(
    subscription?.is_active && !subscription?.is_expired && !subscription?.is_trial,
  );
  const hasSetupReminder = connectionStep === 2 && !isReminderHidden && !isConnectionCompleted;
  const showTrialSetupCard =
    isActiveTrial &&
    connectionStep === 1 &&
    !isConnectionCompleted &&
    !isTrialGuideVisible &&
    isTrialGuideAcknowledged;
  const hasCompactSetupReminder =
    connectionStep !== 3 &&
    isReminderHidden &&
    canPermanentlyHideReminder &&
    !isConnectionCompleted;
  const showConnectionCtaHighlight =
    isTrialGuideVisible || (showTrialSetupCard && !hasSetupReminder);
  const firstPromoOffer = useMemo(
    () => (promoOffers ?? []).find((offer) => offer.is_active && !offer.is_claimed) ?? null,
    [promoOffers],
  );
  const showPromoCard =
    (activeDiscount?.is_active === true && (activeDiscount.discount_percent ?? 0) > 0) ||
    Boolean(firstPromoOffer);
  const showReferralEntry = Boolean(referralTerms?.is_enabled || referralInfo?.referral_link);
  const referralCommissionPercent =
    referralInfo?.commission_percent ?? referralTerms?.commission_percent ?? 0;
  const referralInviteTitle = t('ultima.referralInviteTitle', {
    defaultValue: 'Позови друга',
  });
  const referralInviteDescription =
    (referralTerms?.inviter_bonus_days ?? 0) > 0
      ? t('ultima.referralInviteDescriptionWithDays', {
          count: referralTerms?.inviter_bonus_days ?? 0,
          defaultValue: '+{{count}} d. subscription for an invitation.',
        })
      : t('ultima.referralInviteDescription', {
          defaultValue: 'Бонус к балансу за приглашение друга.',
        });
  const referralInviteBadgeLabel = t('ultima.referralInviteBadge', {
    defaultValue: 'Бонус',
  });
  const connectedDevicesCount = dashboardDevicesData?.devices?.length ?? 0;
  const dashboardDeviceLimit = Math.max(0, subscription?.device_limit ?? 0);
  const dashboardFreeDeviceSlots = Math.max(0, dashboardDeviceLimit - connectedDevicesCount);
  const showBrandLogoOnHome = Boolean(
    ultimaThemeConfig?.homeUseBrandLogo && hasCustomLogo && logoUrl && !hasHomeLogoLoadError,
  );
  const isHomeLogoDecisionPending =
    (!hasCachedThemeConfig && !ultimaThemeConfig) || (!hasCachedBranding && isBrandingLoading);
  const shouldReserveHomeLogoSlot =
    !hasHomeLogoLoadError &&
    (Boolean(ultimaThemeConfig?.homeUseBrandLogo) || isHomeLogoDecisionPending);

  const suggestedPrimaryActionKind = getUltimaNextAction({
    hasAnySubscription,
    isActive,
    isExpired: Boolean(subscription?.is_expired),
    daysLeft,
    isConnectionCompleted,
    connectedDevicesCount,
    deviceLimit: dashboardDeviceLimit,
  });
  const primaryActionKind: UltimaNextActionKind =
    suggestedPrimaryActionKind === 'device' ? 'buy' : suggestedPrimaryActionKind;

  useEffect(() => {
    if (!isSubscriptionReady || dashboardViewTrackedRef.current) {
      return;
    }
    dashboardViewTrackedRef.current = true;
    trackAnalyticsEvent('ultima_dashboard_view', {
      has_subscription: hasAnySubscription,
      is_active: isActive,
      is_trial: isActiveTrial,
      days_left: daysLeft ?? null,
      connection_completed: isConnectionCompleted,
      primary_action: primaryActionKind,
    });
  }, [
    daysLeft,
    hasAnySubscription,
    isActive,
    isActiveTrial,
    isConnectionCompleted,
    isSubscriptionReady,
    primaryActionKind,
  ]);

  const primaryCtaLabel = useMemo(() => {
    const labels: Record<UltimaNextActionKind, string> = {
      buy: purchaseCtaLabel,
      renew: purchaseCtaLabel,
      setup: t('ultima.finishSetup', { defaultValue: 'Завершить установку' }),
      device: t('devices.connectFirstDevice', { defaultValue: 'Подключить устройство' }),
      subscription: t('subscription.desktopOpenInfo', { defaultValue: 'Открыть подписку' }),
    };
    return labels[primaryActionKind];
  }, [primaryActionKind, purchaseCtaLabel, t]);

  const primaryCtaMeta = useMemo(() => {
    if (primaryActionKind === 'setup') {
      return t('ultima.desktop.stepShort', {
        step: isConnectionCompleted ? 3 : connectionStep,
        defaultValue: `Шаг ${isConnectionCompleted ? 3 : connectionStep}/3`,
      });
    }
    if (primaryActionKind === 'subscription') {
      return statusLabel;
    }
    return purchaseFromLabel;
  }, [connectionStep, isConnectionCompleted, primaryActionKind, purchaseFromLabel, statusLabel, t]);

  const handlePrimaryAction = useCallback(() => {
    trackAnalyticsEvent('ultima_main_cta_click', {
      action: primaryActionKind,
      connection_completed: isConnectionCompleted,
      days_left: daysLeft ?? null,
    });

    if (primaryActionKind === 'setup') {
      openConnection();
      return;
    }

    if (primaryActionKind === 'subscription') {
      openSubscriptionInfo();
      return;
    }

    openSubscriptionPurchase();
  }, [
    daysLeft,
    isConnectionCompleted,
    openConnection,
    openSubscriptionInfo,
    openSubscriptionPurchase,
    primaryActionKind,
  ]);

  const renderHomeBrandMark = useCallback(() => {
    if (!shouldReserveHomeLogoSlot) {
      return <ShieldIcon />;
    }

    return (
      <span
        className="relative z-10 flex h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-full border bg-black/20 p-3 backdrop-blur"
        style={{
          borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 34%, transparent)',
          boxShadow:
            '0 0 20px color-mix(in srgb, var(--ultima-color-ring) 24%, transparent), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
      >
        {showBrandLogoOnHome ? (
          <img
            src={logoUrl ?? undefined}
            alt="project-logo"
            className={cn(
              'absolute inset-0 h-full w-full rounded-full object-contain p-3 transition-opacity duration-200',
              isHomeLogoLoaded ? 'opacity-100' : 'opacity-0',
            )}
            loading="eager"
            decoding="sync"
            onLoad={handleHomeLogoLoad}
            onError={handleHomeLogoError}
          />
        ) : null}
        <span
          aria-hidden
          className={cn(
            'absolute inset-[3px] rounded-full border border-white/10 bg-white/[0.06] transition-opacity duration-200',
            showBrandLogoOnHome && isHomeLogoLoaded ? 'opacity-0' : 'animate-pulse opacity-100',
          )}
        />
      </span>
    );
  }, [
    handleHomeLogoError,
    handleHomeLogoLoad,
    isHomeLogoLoaded,
    logoUrl,
    shouldReserveHomeLogoSlot,
    showBrandLogoOnHome,
  ]);

  const renderShieldButton = useCallback(
    (className?: string) => (
      <button
        type="button"
        aria-label={t('nav.dashboard')}
        onPointerDown={handleShieldTap}
        className={cn(
          'relative isolate mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-black/[0.15] focus-visible:outline-none',
          className,
        )}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-visible">
          {shieldRipples.map((ripple) => (
            <span
              key={ripple.id}
              className="ultima-tap-ring absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size,
              }}
            />
          ))}
        </span>
        {renderHomeBrandMark()}
        <span aria-hidden className="pointer-events-none absolute inset-0 z-30 overflow-visible">
          {shieldDigits.map((digit) => {
            const style = {
              left: digit.x,
              top: digit.y,
              fontSize: `${digit.size}px`,
              ['--ultima-digit-drift-x']: `${digit.driftX}px`,
              ['--ultima-digit-drift-y']: `${digit.driftY}px`,
              ['--ultima-digit-duration']: `${digit.duration}ms`,
              ['--ultima-digit-opacity']: `${digit.opacity}`,
              ['--ultima-digit-rotate-start']: `${digit.startRotate}deg`,
              ['--ultima-digit-rotate-end']: `${digit.endRotate}deg`,
              ['--ultima-digit-scale']: `${digit.scale}`,
            } as CSSProperties;

            return (
              <span
                key={digit.id}
                className="ultima-float-number absolute -translate-x-1/2 -translate-y-1/2"
                style={style}
              >
                {digit.value}
              </span>
            );
          })}
        </span>
      </button>
    ),
    [handleShieldTap, renderHomeBrandMark, shieldDigits, shieldRipples, t],
  );

  const adminButtonClassName =
    'absolute right-4 top-2 z-30 inline-flex h-9 items-center gap-1.5 rounded-full border border-amber-300/30 bg-black/30 px-3 text-xs font-medium text-amber-200 backdrop-blur';
  const shellClassName = cn(
    'ultima-shell ultima-shell-shared-nav-docked',
    isDesktopViewport && 'ultima-flat-frames ultima-shell-dashboard-desktop',
  );
  const bottomNav = <UltimaBottomNav active="home" onSupportClick={openSupport} />;
  const PrimaryCtaIcon = primaryActionKind === 'setup' ? SetupIcon : GlobeIcon;
  const shouldConnectDeviceFromHome = connectedDevicesCount <= 0 || dashboardFreeDeviceSlots > 0;
  const devicesHomeCtaTitle =
    connectedDevicesCount <= 0
      ? t('devices.connectFirstDevice', { defaultValue: 'Подключить первое устройство' })
      : dashboardFreeDeviceSlots > 0
        ? t('devices.connectNewDeviceTitle', { defaultValue: 'Подключить новое устройство' })
        : t('devices.buySlot', { defaultValue: 'Купить слот' });
  const devicesHomeCtaSubtitle =
    connectedDevicesCount <= 0
      ? t('devices.homeCtaSubscriptionReady', {
          defaultValue: 'QR-код и ссылка подписки уже готовы',
        })
      : dashboardFreeDeviceSlots > 0
        ? t('devices.homeCtaFreeSlots', {
            count: dashboardFreeDeviceSlots,
            total: dashboardDeviceLimit,
            defaultValue: 'Свободно {{count}} из {{total}} слотов',
          })
        : t('devices.homeCtaNoSlots', {
            count: connectedDevicesCount,
            total: dashboardDeviceLimit,
            defaultValue: 'Подключено {{count}} из {{total}}',
          });
  const devicesHomeCtaAction = shouldConnectDeviceFromHome
    ? t('devices.subscriptionQrShort', { defaultValue: 'QR' })
    : t('devices.buySlotShort', { defaultValue: 'Слот' });
  const devicesHomeCta = hasAnySubscription ? (
    <button
      type="button"
      onClick={() =>
        openDevices(
          shouldConnectDeviceFromHome,
          shouldConnectDeviceFromHome ? 'home_device_connect_card' : 'home_device_slots_card',
        )
      }
      className="group relative w-full overflow-hidden rounded-[20px] border px-3.5 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_22px_rgba(3,14,24,0.16)] backdrop-blur-md transition hover:bg-white/[0.04]"
      style={{
        borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-surface) 42%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 62%, transparent))',
      }}
    >
      <span className="relative flex min-w-0 items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[18px] border text-white/[0.88]"
          style={{
            borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 18%, transparent)',
            background: 'color-mix(in srgb, var(--ultima-color-surface) 42%, transparent)',
          }}
        >
          <DevicesHomeIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold leading-tight text-white/[0.96]">
            {devicesHomeCtaTitle}
          </span>
          <span className="mt-0.5 block truncate text-[11px] leading-tight text-white/[0.62]">
            {devicesHomeCtaSubtitle}
          </span>
        </span>
        <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/[0.86]">
          {devicesHomeCtaAction}
        </span>
      </span>
    </button>
  ) : null;
  const subscriptionPlanName =
    subscription?.tariff_name ||
    (isActiveTrial
      ? t('subscription.trialStatus', { defaultValue: 'Пробный период' })
      : t('subscription.infoTitle', { defaultValue: 'Подписка' }));
  const subscriptionTrafficLimitGb = Math.max(0, subscription?.traffic_limit_gb ?? 0);
  const subscriptionTrafficUsedGb = Math.max(0, subscription?.traffic_used_gb ?? 0);
  const subscriptionTrafficPercent = Math.max(
    0,
    Math.min(100, subscription?.traffic_used_percent ?? 0),
  );
  const trafficNumberFormatter = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 1,
  });
  const subscriptionTrafficUsageLabel =
    subscriptionTrafficLimitGb > 0
      ? `${trafficNumberFormatter.format(subscriptionTrafficUsedGb)} / ${trafficNumberFormatter.format(
          subscriptionTrafficLimitGb,
        )} ${t('common.units.gb', { defaultValue: 'ГБ' })}`
      : t('subscription.unlimited', { defaultValue: 'Безлимит' });
  const subscriptionPlanCard = hasAnySubscription ? (
    <div
      className="mb-2 rounded-[17px] border px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_18px_rgba(3,14,24,0.16)] backdrop-blur-md"
      style={{
        borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 26%, transparent)',
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-surface) 32%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 40%, transparent))',
      }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            trackAnalyticsEvent('ultima_home_plan_open', {
              source: 'tariff_strip',
              days_left: daysLeft ?? null,
            });
            openSubscriptionInfo();
          }}
          className="min-w-0 flex-1 text-left"
        >
          <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-white/[0.42]">
            {t('ultima.currentTariff', { defaultValue: 'Ваш тариф' })}
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-2">
            <span className="truncate text-[14px] font-semibold leading-tight text-white/[0.96]">
              {subscriptionPlanName}
            </span>
            <span className="shrink-0 rounded-full border border-white/[0.08] bg-black/[0.08] px-2 py-0.5 text-[11px] font-medium text-white/[0.68]">
              {connectedDevicesCount}/{dashboardDeviceLimit}
            </span>
          </span>
          <span className="mt-1.5 flex min-w-0 items-center gap-2">
            {subscriptionTrafficLimitGb > 0 && (
              <span
                className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-white/[0.1] min-[360px]:w-16"
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${subscriptionTrafficPercent}%`,
                    background: subscription?.metered_access_blocked
                      ? 'rgb(251 191 36 / 0.9)'
                      : 'var(--ultima-color-primary)',
                  }}
                />
              </span>
            )}
            <span
              className={cn(
                'shrink-0 text-[11px] font-medium leading-none',
                subscription?.metered_access_blocked ? 'text-amber-200/[0.92]' : 'text-white/[0.7]',
              )}
            >
              {subscriptionTrafficUsageLabel}
            </span>
            {subscription?.metered_traffic_enabled && (
              <span className="hidden min-w-0 truncate text-[10px] leading-none text-white/[0.42] min-[390px]:inline">
                {t('ultima.meteredTraffic.defaultLabel', { defaultValue: 'Спецсерверы' })}
              </span>
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            trackAnalyticsEvent('ultima_home_renew_click', {
              source: 'tariff_strip',
              days_left: daysLeft ?? null,
            });
            openSubscriptionPurchase();
          }}
          className="ultima-btn-pill ultima-btn-primary min-h-8 shrink-0 px-3.5 text-[13px]"
        >
          {t('subscription.renew', { defaultValue: 'Продлить' })}
        </button>
      </div>
    </div>
  ) : null;
  const mobileTrafficWarning = shouldShowTrafficWarning ? (
    <UltimaTrafficWarningCard
      usedGb={trafficWarningUsedGb}
      limitGb={trafficWarningLimitGb}
      remainingGb={trafficWarningRemainingGb}
      percent={trafficWarningPercent}
      isExhausted={isTrafficExhausted}
      isMetered={subscription?.metered_traffic_enabled}
      isTrial={isActiveTrial}
      serverLabel={subscription?.metered_server_label}
      onAction={openTrafficPurchase}
      className="mb-4"
    />
  ) : null;
  const desktopTrafficWarning = shouldShowTrafficWarning ? (
    <UltimaTrafficWarningCard
      usedGb={trafficWarningUsedGb}
      limitGb={trafficWarningLimitGb}
      remainingGb={trafficWarningRemainingGb}
      percent={trafficWarningPercent}
      isExhausted={isTrafficExhausted}
      isMetered={subscription?.metered_traffic_enabled}
      isTrial={isActiveTrial}
      serverLabel={subscription?.metered_server_label}
      variant="desktop"
      onAction={openTrafficPurchase}
    />
  ) : null;
  const desktopPendingPaymentCta = pendingTopUp?.paymentUrl ? (
    <UltimaPendingPaymentCard source="dashboard_desktop" compact />
  ) : null;
  const desktopReferralCta = showReferralEntry ? (
    <UltimaReferralCta
      commissionPercent={referralCommissionPercent}
      onClick={openReferral}
      variant="desktop"
      title={referralInviteTitle}
      description={referralInviteDescription}
      badgeLabel={referralInviteBadgeLabel}
    />
  ) : null;
  const desktopActionCtaStack =
    desktopPendingPaymentCta || desktopReferralCta ? (
      <>
        {desktopPendingPaymentCta}
        {desktopReferralCta}
      </>
    ) : null;
  const desktopShowTrialSetupCard = isActiveTrial && connectionStep === 1 && !isConnectionCompleted;
  const desktopTrialGuide = desktopShowTrialSetupCard ? (
    <UltimaTrialGuide
      variant="inline"
      expiryDateLabel={trialExpiryDateLabel}
      daysLeft={daysLeft}
      trafficLimitGb={subscription?.traffic_limit_gb ?? 0}
      deviceLimit={subscription?.device_limit ?? 0}
      onPrimaryAction={handleTrialGuideStart}
      onStatClick={openSubscriptionInfo}
    />
  ) : null;

  if (!isI18nReady || !isSubscriptionReady || shouldHoldForAutoTrial) {
    if (isDesktopViewport) {
      return (
        <div className={shellClassName}>
          <div className="ultima-shell-aura" />
          <UltimaDesktopDashboardSkeleton bottomNav={bottomNav} />
        </div>
      );
    }

    return (
      <div className="ultima-shell pb-[calc(20px+env(safe-area-inset-bottom,0px))] pt-2">
        <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-26px)] w-full flex-col px-4 sm:px-6">
          <section className="pt-[clamp(52px,12vh,112px)]">
            <div className="mx-auto mb-[clamp(24px,5vh,56px)] flex h-24 w-24 items-center justify-center rounded-full bg-black/[0.15]">
              {renderHomeBrandMark()}
            </div>
            <div className="mb-5 h-16 animate-pulse rounded-2xl bg-white/10" />
          </section>
          <section className="mt-auto space-y-3 pb-1">
            <div className="h-14 animate-pulse rounded-full bg-white/10" />
            <div className="h-14 animate-pulse rounded-full bg-white/10" />
            <div className="h-[58px] animate-pulse rounded-full bg-white/10" />
          </section>
        </div>
      </div>
    );
  }

  if (isDesktopViewport) {
    return (
      <div className={shellClassName}>
        <div className="ultima-shell-aura" />
        <UltimaDesktopDashboard
          heroButton={renderShieldButton('h-[108px] w-[108px] lg:h-[124px] lg:w-[124px]')}
          referralCta={desktopActionCtaStack}
          devicesCta={devicesHomeCta}
          trafficWarning={desktopTrafficWarning}
          subscription={subscription}
          expiryLabel={expiryLabel}
          statusLabel={statusLabel}
          statusTone={statusToneKey}
          daysLeft={daysLeft}
          connectionStep={connectionStep}
          isConnectionCompleted={isConnectionCompleted}
          primaryActionKind={primaryActionKind}
          primaryCtaLabel={primaryCtaLabel}
          primaryCtaMeta={primaryCtaMeta}
          promoMessage={promoMessage}
          activeDiscount={activeDiscount}
          firstPromoOffer={firstPromoOffer}
          showTrialSetupCard={desktopShowTrialSetupCard}
          trialGuide={desktopTrialGuide}
          hasSetupReminder={hasSetupReminder}
          hasCompactSetupReminder={hasCompactSetupReminder}
          showConnectionCtaHighlight={showConnectionCtaHighlight}
          onPrimaryAction={handlePrimaryAction}
          onBuySubscription={openSubscriptionPurchase}
          onOpenConnection={() => openConnection()}
          onOpenDevices={() => openDevices(false, 'desktop_dashboard')}
          onOpenSubscriptionInfo={openSubscriptionInfo}
          onOpenSupport={openSupport}
          onActivateOffer={
            firstPromoOffer ? () => claimOfferMutation.mutate(firstPromoOffer.id) : null
          }
          isActivatingOffer={claimOfferMutation.isPending}
          bottomNav={bottomNav}
        />
      </div>
    );
  }

  return (
    <div className={shellClassName}>
      {isAdmin && (
        <button type="button" onClick={() => navigate('/admin')} className={adminButtonClassName}>
          <AdminIcon />
          <span>{t('admin.nav.title', { defaultValue: 'Админ' })}</span>
        </button>
      )}

      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[680px] lg:justify-between">
        <section className="ultima-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pb-[clamp(14px,2.8vh,24px)] pr-1 pt-[clamp(46px,10vh,104px)] lg:flex-none lg:overflow-visible lg:pb-2 lg:pr-0 lg:pt-8">
          {renderShieldButton('mb-[clamp(12px,3.4vh,40px)] lg:mb-5')}

          {promoMessage && !showPromoCard && (
            <div
              aria-live="polite"
              className="mx-auto mb-4 max-w-full rounded-full border border-emerald-200/[0.22] bg-emerald-300/[0.12] px-3.5 py-2 text-center text-[12px] font-medium leading-snug text-emerald-50/95 shadow-[0_10px_22px_rgba(5,30,24,0.2)] backdrop-blur-md"
            >
              {promoMessage}
            </div>
          )}

          {hasSetupReminder && (
            <div className="mb-4 rounded-2xl border border-emerald-200/[0.24] bg-[rgba(12,45,42,0.38)] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(3,14,24,0.28)] backdrop-blur-md">
              <p className="text-[16px] font-semibold leading-tight text-white/95">
                {t('ultima.setupNotFinishedTitle', { defaultValue: 'Установка не завершена' })}
              </p>
              <p className="mt-1 text-[13px] leading-snug text-white/75">
                {t('ultima.setupNotFinishedDesc', {
                  defaultValue: 'Вернитесь к настройке и завершите подключение VPN.',
                })}
              </p>
              <button
                type="button"
                onClick={() => openConnection()}
                className="ultima-btn-pill ultima-btn-primary mt-2.5 flex w-full items-center justify-center px-4 py-2.5 text-[15px]"
              >
                {t('ultima.finishSetup', { defaultValue: 'Завершить установку' })}
              </button>
            </div>
          )}

          {hasCompactSetupReminder && (
            <button
              type="button"
              onClick={() => openConnection()}
              className="mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-emerald-200/[0.16] bg-[rgba(12,45,42,0.28)] px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_24px_rgba(3,14,24,0.18)] backdrop-blur-md transition hover:bg-[rgba(16,58,54,0.34)]"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-semibold leading-tight text-white/95">
                  {t('ultima.setupCompactTitle', { defaultValue: 'VPN ещё не настроен' })}
                </p>
                <p className="mt-1 text-[12px] leading-snug text-white/[0.68]">
                  {t('ultima.setupCompactDesc', {
                    defaultValue: 'Откройте установку и завершите подключение, когда будет удобно.',
                  })}
                </p>
              </div>
              <span className="shrink-0 text-[12px] font-medium text-emerald-200/90">
                {t('ultima.finishSetup', { defaultValue: 'Завершить установку' })}
              </span>
            </button>
          )}

          {pendingTopUp?.paymentUrl ? (
            <UltimaPendingPaymentCard source="dashboard_mobile" className="mb-4" />
          ) : null}

          {mobileTrafficWarning}

          {!shouldShowTrafficWarning ? (
            <>
              {showReferralEntry && (
                <div className="mb-4">
                  <UltimaReferralCta
                    commissionPercent={referralCommissionPercent}
                    onClick={openReferral}
                    title={referralInviteTitle}
                    description={referralInviteDescription}
                    badgeLabel={referralInviteBadgeLabel}
                  />
                </div>
              )}

              {devicesHomeCta ? <div className="mb-4">{devicesHomeCta}</div> : null}
            </>
          ) : null}

          {showPromoCard && (
            <div
              className="mb-4 rounded-2xl border p-3.5 backdrop-blur-md"
              style={{
                borderColor:
                  'color-mix(in srgb, var(--ultima-color-surface-border) 30%, transparent)',
                background: 'color-mix(in srgb, var(--ultima-color-surface) 38%, transparent)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 24px rgba(3,14,24,0.22)',
              }}
            >
              <p
                className="text-[15px] font-semibold leading-tight"
                style={{
                  color: 'color-mix(in srgb, var(--ultima-color-secondary-text) 94%, #fff)',
                }}
              >
                {activeDiscount?.is_active && (activeDiscount.discount_percent ?? 0) > 0
                  ? t('promo.offers.discountActiveTitle', {
                      percent: activeDiscount.discount_percent,
                    })
                  : t('promo.offers.specialOffer', { defaultValue: 'Спецпредложение' })}
              </p>
              <p className="mt-1 text-[13px] leading-snug text-white/70">
                {activeDiscount?.is_active && (activeDiscount.discount_percent ?? 0) > 0
                  ? t('promo.useNow', {
                      defaultValue: 'Скидка уже активна. Можно использовать сейчас.',
                    })
                  : t('promo.offers.activateDiscountHint', {
                      defaultValue: 'Активируйте предложение, чтобы получить выгоду.',
                    })}
              </p>
              {promoMessage && (
                <p className="mt-1.5 text-[12px] text-white/[0.85]">{promoMessage}</p>
              )}
              <div className="mt-2.5 flex flex-col gap-2 min-[360px]:flex-row">
                {firstPromoOffer && (
                  <button
                    type="button"
                    onClick={() => claimOfferMutation.mutate(firstPromoOffer.id)}
                    disabled={claimOfferMutation.isPending}
                    className="ultima-btn-pill ultima-btn-secondary flex-1 px-4 py-2.5 text-[14px] disabled:opacity-60"
                  >
                    {t('promo.activate', { defaultValue: 'Активировать' })}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/subscription')}
                  className="ultima-btn-pill ultima-btn-primary flex-1 px-4 py-2.5 text-[14px]"
                >
                  {t('promo.useNow', { defaultValue: 'Использовать' })}
                </button>
              </div>
            </div>
          )}

          {showTrialSetupCard && (
            <div className="mt-auto">
              <UltimaTrialGuide
                variant="inline"
                expiryDateLabel={trialExpiryDateLabel}
                daysLeft={daysLeft}
                trafficLimitGb={subscription?.traffic_limit_gb ?? 0}
                deviceLimit={subscription?.device_limit ?? 0}
                onPrimaryAction={handleTrialGuideStart}
                onStatClick={openSubscriptionInfo}
              />
            </div>
          )}

          {!showTrialSetupCard && (
            <div className="mt-auto">
              {subscriptionPlanCard}
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2.5 text-white lg:mb-3 lg:mt-4 lg:flex-col lg:justify-center lg:gap-3 lg:text-center">
                <div className="min-w-0 flex-1 lg:flex lg:flex-col lg:items-center">
                  <button
                    type="button"
                    onClick={openSubscriptionInfo}
                    className="max-w-full break-words text-left text-[clamp(24px,7.2vw,30px)] font-semibold leading-[1.02] text-white transition hover:text-white/90 lg:text-center lg:text-[38px]"
                  >
                    {expiryLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => openDevices(false, 'dashboard_devices_count')}
                    className="mt-1 text-left text-[13px] leading-snug text-emerald-300/90 transition hover:text-emerald-200 lg:text-center"
                  >
                    {t('lite.devicesTotal', { defaultValue: 'Устройств' })}:{' '}
                    {subscription?.device_limit ?? 0}
                  </button>
                </div>
                <span
                  className={`relative inline-flex max-w-full shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${statusTone.pill}`}
                >
                  <span
                    className={`absolute left-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full blur-[4px] ${statusTone.halo}`}
                  />
                  <span className={`relative h-1.5 w-1.5 rounded-full ${statusTone.dot}`} />
                  {statusLabel}
                </span>
              </div>
              <div
                className={`mb-2 h-[2px] w-full rounded-full bg-gradient-to-r ${statusTone.pulse} lg:mb-2`}
              />
            </div>
          )}
        </section>

        <section className="ultima-mobile-dock-footer lg:mt-0">
          <button
            type="button"
            onClick={handlePrimaryAction}
            data-testid="ultima-primary-cta"
            className="ultima-btn-pill ultima-btn-primary mb-3 flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] min-[360px]:px-5 min-[360px]:text-[16px]"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              <PrimaryCtaIcon />
              <span className="min-w-0 break-words leading-tight">{primaryCtaLabel}</span>
            </span>
            <span className="shrink-0 whitespace-nowrap text-[15px] text-white/90 min-[360px]:text-[16px]">
              {primaryCtaMeta}
            </span>
          </button>

          <div className="relative mb-3">
            {showConnectionCtaHighlight && (
              <>
                <span className="ultima-cta-highlight pointer-events-none absolute inset-[-2px] rounded-[999px]" />
                <span className="ultima-cta-highlight ultima-cta-highlight-delay pointer-events-none absolute inset-[-5px] rounded-[999px]" />
              </>
            )}
            {primaryActionKind !== 'setup' ? (
              <button
                type="button"
                onClick={() => openConnection()}
                className="ultima-btn-pill ultima-btn-secondary relative flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] min-[360px]:px-5 min-[360px]:text-[16px]"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2.5">
                  <SetupIcon />
                  <span className="min-w-0 break-words leading-tight">
                    {t('lite.connectAndSetup', { defaultValue: 'Установка и настройка' })}
                  </span>
                </span>
                <span className="shrink-0 text-white/70">
                  <PhoneIcon />
                </span>
              </button>
            ) : null}
          </div>
        </section>
      </div>

      {isTrialGuideVisible && (
        <UltimaTrialGuide
          variant="overlay"
          expiryDateLabel={trialExpiryDateLabel}
          daysLeft={daysLeft}
          trafficLimitGb={subscription?.traffic_limit_gb ?? 0}
          deviceLimit={subscription?.device_limit ?? 0}
          onPrimaryAction={handleTrialGuideStart}
          onDismiss={handleTrialGuideDismiss}
        />
      )}
    </div>
  );
}
