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
import {
  CalendarDays,
  ChevronRight,
  Globe2,
  Gauge,
  MonitorSmartphone,
  ShieldCheck,
  Smartphone,
  Wrench,
} from 'lucide-react';
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

const MAX_VISIBLE_SHIELD_RIPPLES = 10;
const MAX_VISIBLE_SHIELD_DIGITS = 16;

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
  const { data: dashboardDevicesData, isError: isDashboardDevicesError } = useQuery({
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
  const statusLabel = !hasAnySubscription
    ? t('ultima.noSubscription', { defaultValue: 'Нет подписки' })
    : isActiveTrial
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
      setShieldRipples((previous) => [
        ...previous.slice(-(MAX_VISIBLE_SHIELD_RIPPLES - 1)),
        { id, x, y, size },
      ]);

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
      setShieldDigits((previous) => [...previous.slice(-(MAX_VISIBLE_SHIELD_DIGITS - 1)), digit]);

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

      void import('./Connection');
      void queryClient.prefetchQuery({
        queryKey: ['appConfig'],
        queryFn: () => subscriptionApi.getAppConfig(),
        staleTime: 15000,
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

  const hasSetupReminder = connectionStep === 2 && !isReminderHidden && !isConnectionCompleted;
  const showTrialSetupCard =
    isActiveTrial &&
    connectionStep === 1 &&
    !isConnectionCompleted &&
    !isTrialGuideVisible &&
    isTrialGuideAcknowledged;
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
  const isDashboardDevicesPending =
    hasAnySubscription && dashboardDevicesData === undefined && !isDashboardDevicesError;
  const isDashboardDevicesUnavailable =
    hasAnySubscription && dashboardDevicesData === undefined && isDashboardDevicesError;
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
      return <ShieldCheck className="h-[72px] w-[72px] text-white/95" strokeWidth={1.7} />;
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
        data-testid="ultima-shield-tap-target"
        aria-label={t('nav.dashboard')}
        onPointerDown={handleShieldTap}
        className={cn(
          'relative isolate mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-black/[0.15] focus-visible:outline-none',
          className,
        )}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <span
          aria-hidden
          data-ultima-transient-visual
          className="pointer-events-none absolute inset-0 z-0 overflow-visible"
        >
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
        <span
          aria-hidden
          data-ultima-transient-visual
          className="pointer-events-none absolute inset-0 z-30 overflow-visible"
        >
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
  const PrimaryCtaIcon = primaryActionKind === 'setup' ? Wrench : Globe2;
  const shouldConnectDeviceFromHome =
    isDashboardDevicesUnavailable || connectedDevicesCount <= 0 || dashboardFreeDeviceSlots > 0;
  const devicesHomeCtaTitle = isDashboardDevicesUnavailable
    ? t('devices.title', { defaultValue: 'Устройства' })
    : connectedDevicesCount <= 0
      ? t('devices.connectFirstDevice', { defaultValue: 'Подключить первое устройство' })
      : dashboardFreeDeviceSlots > 0
        ? t('devices.connectNewDeviceTitle', { defaultValue: 'Подключить новое устройство' })
        : t('devices.buySlot', { defaultValue: 'Купить слот' });
  const devicesHomeCtaSubtitle = isDashboardDevicesUnavailable
    ? t('devices.homeCtaUnavailable', { defaultValue: 'Не удалось обновить данные' })
    : connectedDevicesCount <= 0
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
  const devicesHomeCtaAction = isDashboardDevicesUnavailable
    ? t('common.open', { defaultValue: 'Открыть' })
    : shouldConnectDeviceFromHome
      ? t('devices.subscriptionQrShort', { defaultValue: 'QR' })
      : t('devices.buySlotShort', { defaultValue: 'Слот' });
  const renderDevicesHomeCta = (variant: 'standalone' | 'inline' = 'standalone') =>
    hasAnySubscription ? (
      <button
        type="button"
        onClick={() =>
          openDevices(
            shouldConnectDeviceFromHome,
            shouldConnectDeviceFromHome ? 'home_device_connect_card' : 'home_device_slots_card',
          )
        }
        disabled={isDashboardDevicesPending}
        aria-busy={isDashboardDevicesPending}
        className={cn(
          'group relative w-full overflow-hidden text-left transition hover:bg-white/[0.04] disabled:cursor-wait',
          variant === 'inline'
            ? 'min-h-[64px] border-b border-white/[0.07] px-1 py-3 last:border-b-0'
            : 'rounded-[20px] border px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_22px_rgba(3,14,24,0.16)] backdrop-blur-md',
        )}
        style={
          variant === 'inline'
            ? undefined
            : {
                borderColor:
                  'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
                background:
                  'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-surface) 42%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 62%, transparent))',
              }
        }
      >
        <span className="relative flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[18px] border text-white/[0.88]"
            style={{
              borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 18%, transparent)',
              background: 'color-mix(in srgb, var(--ultima-color-surface) 42%, transparent)',
            }}
          >
            <MonitorSmartphone className="h-5 w-5" strokeWidth={1.8} />
          </span>
          {isDashboardDevicesPending ? (
            <>
              <span
                data-testid="ultima-device-cta-loading"
                className="min-w-0 flex-1"
                aria-label={t('common.loading', { defaultValue: 'Загрузка...' })}
              >
                <span className="block h-3.5 w-36 max-w-full animate-pulse rounded-full bg-white/[0.12]" />
                <span className="mt-2 block h-2.5 w-48 max-w-[82%] animate-pulse rounded-full bg-white/[0.07]" />
              </span>
              <span className="h-7 w-11 shrink-0 animate-pulse rounded-full border border-white/[0.08] bg-white/[0.05]" />
            </>
          ) : (
            <>
              <span className="min-w-0 flex-1">
                <span
                  data-testid="ultima-device-home-cta-title"
                  className="block text-[14px] font-semibold leading-tight text-white/[0.96]"
                >
                  {devicesHomeCtaTitle}
                </span>
                <span className="mt-0.5 block truncate text-[11px] leading-tight text-white/[0.62]">
                  {devicesHomeCtaSubtitle}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/[0.86]">
                {devicesHomeCtaAction}
              </span>
            </>
          )}
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
  const subscriptionTrafficRemainingGb = Math.max(
    0,
    subscriptionTrafficLimitGb - subscriptionTrafficUsedGb,
  );
  const mobileTrafficValue = !hasAnySubscription
    ? '—'
    : subscriptionTrafficLimitGb > 0
      ? `${trafficNumberFormatter.format(subscriptionTrafficRemainingGb)} ${t('common.units.gb', {
          defaultValue: 'ГБ',
        })}`
      : t('subscription.unlimited', { defaultValue: 'Безлимит' });
  const mobileDaysValue =
    daysLeft === null ? '—' : trafficNumberFormatter.format(Math.max(daysLeft, 0));
  const mobileOverviewCard = (
    <section
      data-testid="ultima-home-overview"
      className="mb-4 rounded-[24px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_18px_38px_rgba(3,14,24,0.22)] backdrop-blur-xl"
      style={{
        borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 32%, transparent)',
        background:
          'linear-gradient(145deg, color-mix(in srgb, var(--ultima-color-surface) 78%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 68%, transparent))',
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-semibold uppercase text-white/[0.42]">
              {t('ultima.currentTariff', { defaultValue: 'Ваш тариф' })}
            </span>
            <span
              className={`relative inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase ${statusTone.pill}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusTone.dot}`} />
              {statusLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              trackAnalyticsEvent('ultima_home_plan_open', {
                source: 'overview',
                days_left: daysLeft ?? null,
              });
              if (hasAnySubscription) {
                openSubscriptionInfo();
              } else {
                openSubscriptionPurchase();
              }
            }}
            className="mt-2 block max-w-full text-left"
          >
            <span className="block break-words text-[25px] font-semibold leading-[1.02] text-white/[0.97]">
              {subscriptionPlanName}
            </span>
            <span className="mt-1.5 block text-[12px] leading-snug text-white/[0.58]">
              {expiryLabel}
            </span>
          </button>
        </div>
        {renderShieldButton('h-[104px] w-[104px] shrink-0')}
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-white/[0.08] border-y border-white/[0.08] py-3">
        <div data-testid="ultima-home-traffic" className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5 text-white/[0.4]">
            <Gauge className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span className="truncate text-[8px] font-semibold uppercase">
              {t('ultima.trafficRemaining', { defaultValue: 'Осталось' })}
            </span>
          </div>
          <p className="mt-1.5 truncate text-[12px] font-semibold text-white/[0.92]">
            {mobileTrafficValue}
          </p>
        </div>
        <div
          data-testid="ultima-plan-device-count"
          aria-busy={isDashboardDevicesPending}
          className="min-w-0 px-2"
        >
          <div className="flex items-center gap-1.5 text-white/[0.4]">
            <MonitorSmartphone className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span className="truncate text-[8px] font-semibold uppercase">
              {t('lite.devicesTotal', { defaultValue: 'Устройства' })}
            </span>
          </div>
          {isDashboardDevicesPending ? (
            <span
              data-testid="ultima-plan-device-count-loading"
              className="mt-2 block h-3 w-8 animate-pulse rounded-full bg-white/[0.1]"
            />
          ) : (
            <p className="mt-1.5 truncate text-[12px] font-semibold text-white/[0.92]">
              {isDashboardDevicesUnavailable
                ? '—'
                : `${connectedDevicesCount}/${dashboardDeviceLimit}`}
            </p>
          )}
        </div>
        <div data-testid="ultima-home-days" className="min-w-0 pl-2">
          <div className="flex items-center gap-1.5 text-white/[0.4]">
            <CalendarDays className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span className="truncate text-[8px] font-semibold uppercase">
              {t('ultima.home.daysLabel', { defaultValue: 'Дней осталось' })}
            </span>
          </div>
          <p className="mt-1.5 truncate text-[12px] font-semibold text-white/[0.92]">
            {mobileDaysValue}
          </p>
        </div>
      </div>

      {subscriptionTrafficLimitGb > 0 ? (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-3 text-[10px] text-white/[0.48]">
            <span>{subscriptionTrafficUsageLabel}</span>
            <span>{Math.round(subscriptionTrafficPercent)}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.18]">
            <span
              className="block h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${subscriptionTrafficPercent}%`,
                background: subscription?.metered_access_blocked
                  ? 'rgb(251 191 36 / 0.9)'
                  : 'var(--ultima-color-primary)',
              }}
            />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={hasAnySubscription ? openSubscriptionInfo : openSubscriptionPurchase}
        className="mt-3 flex min-h-[38px] w-full items-center justify-between gap-3 border-t border-white/[0.07] pt-3 text-left text-[12px] font-medium text-white/[0.72]"
      >
        <span>
          {hasAnySubscription
            ? t('subscription.details', { defaultValue: 'Детали подписки' })
            : t('ultima.chooseTariff', { defaultValue: 'Выбрать тариф' })}
        </span>
        <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
      </button>
    </section>
  );
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
    desktopPendingPaymentCta || (!shouldShowTrafficWarning && desktopReferralCta) ? (
      <>
        {desktopPendingPaymentCta}
        {!shouldShowTrafficWarning ? desktopReferralCta : null}
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
      <div className="ultima-shell ultima-shell-shared-nav-docked">
        <div className="ultima-shell-inner ultima-shell-mobile-docked">
          <section className="flex min-h-0 flex-1 flex-col pt-[clamp(12px,2.4vh,22px)]">
            <div
              className="mb-4 min-h-[250px] animate-pulse rounded-[24px] border p-4"
              style={{
                borderColor:
                  'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
                background: 'color-mix(in srgb, var(--ultima-color-surface) 64%, transparent)',
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="h-3 w-24 rounded-full bg-white/[0.08]" />
                  <div className="mt-4 h-7 w-40 max-w-full rounded-full bg-white/[0.1]" />
                  <div className="mt-3 h-3 w-28 rounded-full bg-white/[0.06]" />
                </div>
                <div className="h-[104px] w-[104px] shrink-0 rounded-full bg-white/[0.06]" />
              </div>
              <div className="mt-4 h-14 border-y border-white/[0.07]" />
              <div className="mt-4 h-2 rounded-full bg-white/[0.07]" />
              <div className="mt-4 h-5 rounded-full bg-white/[0.06]" />
            </div>
            <div className="h-[176px] animate-pulse rounded-[24px] border border-white/[0.07] bg-white/[0.04]" />
          </section>
          <section className="ultima-mobile-dock-footer space-y-3">
            <div className="h-12 animate-pulse rounded-full bg-white/[0.08]" />
            <div className="h-12 animate-pulse rounded-full bg-white/[0.06]" />
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
          devicesCta={shouldShowTrafficWarning ? null : renderDevicesHomeCta()}
          trafficWarning={desktopTrafficWarning}
          subscription={subscription}
          connectedDevicesCount={connectedDevicesCount}
          isDevicesLoading={isDashboardDevicesPending}
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
          showConnectionCtaHighlight={showConnectionCtaHighlight}
          onPrimaryAction={handlePrimaryAction}
          onBuySubscription={openSubscriptionPurchase}
          onOpenConnection={() => openConnection()}
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
          <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
          <span>{t('admin.nav.title', { defaultValue: 'Админ' })}</span>
        </button>
      )}

      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[680px] lg:justify-between">
        <section
          data-testid="ultima-dashboard-scroll-region"
          className="ultima-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pb-[clamp(14px,2.8vh,24px)] pr-1 pt-[clamp(12px,2.4vh,22px)] lg:flex-none lg:overflow-visible lg:pb-2 lg:pr-0 lg:pt-8"
        >
          {mobileOverviewCard}

          {promoMessage && !showPromoCard && (
            <div
              aria-live="polite"
              className="mx-auto mb-4 max-w-full rounded-full border border-emerald-200/[0.22] bg-emerald-300/[0.12] px-3.5 py-2 text-center text-[12px] font-medium leading-snug text-emerald-50/95 shadow-[0_10px_22px_rgba(5,30,24,0.2)] backdrop-blur-md"
            >
              {promoMessage}
            </div>
          )}

          {pendingTopUp?.paymentUrl ? (
            <UltimaPendingPaymentCard source="dashboard_mobile" className="mb-4" />
          ) : null}

          {mobileTrafficWarning}

          {!shouldShowTrafficWarning ? (
            showReferralEntry || hasAnySubscription ? (
              <section
                data-testid="ultima-home-quick-actions"
                className="mb-4 rounded-[24px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_30px_rgba(3,14,24,0.18)] backdrop-blur-xl"
                style={{
                  borderColor:
                    'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
                  background: 'color-mix(in srgb, var(--ultima-color-surface) 72%, transparent)',
                }}
              >
                <div className="mb-1">
                  <h2 className="text-[14px] font-semibold text-white/[0.94]">
                    {t('ultima.home.quickActions', { defaultValue: 'Быстрые действия' })}
                  </h2>
                  <p className="mt-1 text-[11px] leading-snug text-white/[0.44]">
                    {t('ultima.home.quickActionsHint', {
                      defaultValue: 'Приглашения и подключение устройств',
                    })}
                  </p>
                </div>
                <div className="mt-2">
                  {showReferralEntry ? (
                    <UltimaReferralCta
                      commissionPercent={referralCommissionPercent}
                      onClick={openReferral}
                      variant="inline"
                      title={referralInviteTitle}
                      description={referralInviteDescription}
                      badgeLabel={referralInviteBadgeLabel}
                    />
                  ) : null}
                  {renderDevicesHomeCta('inline')}
                </div>
              </section>
            ) : null
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
            <div>
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
                  <Wrench className="h-5 w-5" strokeWidth={1.8} />
                  <span className="min-w-0 break-words leading-tight">
                    {t('lite.connectAndSetup', { defaultValue: 'Установка и настройка' })}
                  </span>
                </span>
                <span className="shrink-0 text-white/70">
                  <Smartphone className="h-5 w-5" strokeWidth={1.8} />
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
