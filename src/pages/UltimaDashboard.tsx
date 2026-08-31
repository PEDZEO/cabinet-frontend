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
import { KeyRound, MonitorSmartphone, ShieldCheck, UsersRound, Wrench } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { authApi } from '@/api/auth';
import { balanceApi } from '@/api/balance';
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
import {
  UltimaHomeActionGrid,
  type UltimaHomeAction,
} from '@/components/ultima/home/UltimaHomeActionGrid';
import { UltimaHomePlanCard } from '@/components/ultima/home/UltimaHomePlanCard';
import { UltimaHomeTrafficCard } from '@/components/ultima/home/UltimaHomeTrafficCard';
import { UltimaReferralShareSheet } from '@/components/ultima/home/UltimaReferralShareSheet';
import { staggerContainer, staggerItem } from '@/components/motion/transitions';
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
  const { appName, logoLetter, hasCustomLogo, logoUrl, hasCachedBranding, isBrandingLoading } =
    useBranding();
  const haptic = useHaptic();
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const isDesktopViewport = useMediaQuery('(min-width: 1024px)');
  const reduceMotion = useReducedMotion();
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
  const [isReferralShareOpen, setIsReferralShareOpen] = useState(false);

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
  const {
    isLoaded: isHomeLogoLoaded,
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
  const {
    data: linkedIdentitiesData,
    isError: isLinkedIdentitiesError,
    isPending: isLinkedIdentitiesPending,
  } = useQuery({
    queryKey: ['linked-identities'],
    queryFn: authApi.getLinkedIdentities,
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

    let cancelled = false;
    const runWarmup = () => {
      if (cancelled) return;
      warmedLanguagesRef.current.add(language);
      void warmUltimaStartup(queryClient, { language });
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(runWarmup, { timeout: 1800 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = setTimeout(runWarmup, 600);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
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

  const openAccountLinking = useCallback(() => {
    haptic.impact('light');
    trackAnalyticsEvent('ultima_account_linking_entry_click', {
      source: 'dashboard',
    });
    void import('./AccountLinking');
    void queryClient.prefetchQuery({
      queryKey: ['linked-identities'],
      queryFn: authApi.getLinkedIdentities,
      staleTime: 60000,
    });
    navigate('/account-linking');
  }, [haptic, navigate, queryClient]);

  const openReferralShare = useCallback(() => {
    haptic.impact('light');
    trackAnalyticsEvent('ultima_referral_share_open', {
      source: 'dashboard',
    });
    setIsReferralShareOpen(true);
  }, [haptic]);

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
  const showBrandLogoOnHome = Boolean(hasCustomLogo && logoUrl);
  const isHomeLogoDecisionPending = !hasCachedBranding && isBrandingLoading;
  const shouldReserveHomeLogoSlot = showBrandLogoOnHome || isHomeLogoDecisionPending;

  const primaryActionKind: UltimaNextActionKind = hasAnySubscription ? 'renew' : 'buy';

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

  const handlePrimaryPurchase = useCallback(() => {
    trackAnalyticsEvent('ultima_main_cta_click', {
      action: primaryActionKind,
      connection_completed: isConnectionCompleted,
      days_left: daysLeft ?? null,
    });
    openSubscriptionPurchase();
  }, [daysLeft, isConnectionCompleted, openSubscriptionPurchase, primaryActionKind]);

  const renderHomeBrandMark = useCallback(() => {
    if (!shouldReserveHomeLogoSlot) {
      return <ShieldCheck className="h-[62%] w-[62%] text-white/95" strokeWidth={1.7} />;
    }

    return (
      <span
        className="relative z-10 flex h-[86%] max-h-[100px] w-[86%] max-w-[100px] items-center justify-center overflow-hidden rounded-full border bg-black/20 p-2.5 backdrop-blur"
        style={{
          borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 34%, transparent)',
          boxShadow:
            '0 0 20px color-mix(in srgb, var(--ultima-color-ring) 24%, transparent), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
      >
        {showBrandLogoOnHome ? (
          <img
            data-testid="ultima-home-brand-logo"
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
            'absolute inset-[3px] flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition-opacity duration-200',
            showBrandLogoOnHome && isHomeLogoLoaded ? 'opacity-0' : 'opacity-100',
          )}
        >
          <span className="text-2xl font-semibold text-white/70">{logoLetter}</span>
        </span>
      </span>
    );
  }, [
    handleHomeLogoError,
    handleHomeLogoLoad,
    isHomeLogoLoaded,
    logoLetter,
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
    'inline-flex h-9 items-center gap-1.5 rounded-full border border-amber-300/30 bg-black/30 px-3 text-xs font-medium text-amber-200 backdrop-blur';
  const shellClassName = cn(
    'ultima-shell ultima-shell-shared-nav-docked',
    isDesktopViewport && 'ultima-flat-frames ultima-shell-dashboard-desktop',
  );
  const bottomNav = <UltimaBottomNav active="home" onSupportClick={openSupport} />;
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
  const linkedIdentities = linkedIdentitiesData?.identities ?? [];
  const linkedIdentityCount = isLinkedIdentitiesError
    ? null
    : Math.max(linkedIdentities.length, user ? 1 : 0);
  const linkedProvidersLabel = linkedIdentities
    .map((identity) => {
      const provider = identity.provider.toLowerCase();
      if (provider === 'telegram') return 'Telegram';
      if (provider === 'yandex') return 'Yandex';
      if (provider === 'vk') return 'VK';
      if (provider === 'email') return 'Email';
      return identity.provider;
    })
    .slice(0, 3)
    .join(' · ');
  const referralCode = referralInfo?.referral_code?.trim() ?? '';
  const referralTelegramLink = referralInfo?.referral_link?.trim() ?? '';
  const referralWebLink = referralCode
    ? `${window.location.origin}/login?ref=${encodeURIComponent(referralCode)}`
    : '';
  const referralBonusDays = Math.max(0, referralTerms?.inviter_bonus_days ?? 0);
  const referralBonusLabel = referralBonusDays
    ? t('ultima.home.referralDaysBonus', {
        count: referralBonusDays,
        defaultValue: '+{{count}} дн.',
      })
    : referralCommissionPercent > 0
      ? `+${Math.round(referralCommissionPercent)}%`
      : t('ultima.referralInviteBadge', { defaultValue: 'Бонус' });
  const referralShareText = t('referral.shareMessage', {
    percent: referralCommissionPercent,
    botName: appName,
    defaultValue: `Попробуйте ${appName} по моей ссылке`,
  });
  const mobileHomeActions: UltimaHomeAction[] = [
    ...(hasAnySubscription
      ? [
          {
            id: 'devices' as const,
            title: t('lite.devicesTotal', { defaultValue: 'Устройства' }),
            value: isDashboardDevicesUnavailable
              ? '—'
              : `${connectedDevicesCount}/${dashboardDeviceLimit}`,
            hint: isDashboardDevicesUnavailable
              ? t('devices.homeCtaUnavailable', { defaultValue: 'Открыть управление' })
              : dashboardFreeDeviceSlots > 0
                ? t('ultima.home.freeDeviceSlots', {
                    count: dashboardFreeDeviceSlots,
                    defaultValue: 'Свободно: {{count}}',
                  })
                : t('devices.buySlot', { defaultValue: 'Добавить слот' }),
            icon: MonitorSmartphone,
            onClick: () =>
              openDevices(
                shouldConnectDeviceFromHome,
                shouldConnectDeviceFromHome ? 'home_action_connect' : 'home_action_slots',
              ),
            loading: isDashboardDevicesPending,
          },
          {
            id: 'setup' as const,
            title: t('ultima.home.setupAction', { defaultValue: 'Установка' }),
            value: isConnectionCompleted
              ? t('common.done', { defaultValue: 'Готово' })
              : t('ultima.desktop.stepShort', {
                  step: connectionStep,
                  defaultValue: `Шаг ${connectionStep}/3`,
                }),
            hint: isConnectionCompleted
              ? t('ultima.home.setupReadyHint', { defaultValue: 'Настроить ещё раз' })
              : t('ultima.home.connectionPending', { defaultValue: 'Продолжить настройку' }),
            icon: Wrench,
            onClick: () => openConnection(),
            tone: isConnectionCompleted ? ('default' as const) : ('attention' as const),
          },
        ]
      : []),
    {
      id: 'identities',
      title: t('profile.accountLinkingTitle', { defaultValue: 'Способы входа' }),
      value:
        linkedIdentityCount === null
          ? t('common.open', { defaultValue: 'Открыть' })
          : t('profile.ultima.loginMethodCount', {
              count: linkedIdentityCount,
              defaultValue: '{{count}} привязано',
            }),
      hint:
        linkedProvidersLabel ||
        (linkedIdentityCount !== null && linkedIdentityCount > 1
          ? t('profile.ultima.accessProtected', { defaultValue: 'Резервный вход настроен' })
          : t('profile.ultima.accessNeedsBackup', { defaultValue: 'Добавьте резервный вход' })),
      icon: KeyRound,
      onClick: openAccountLinking,
      tone:
        linkedIdentityCount !== null && linkedIdentityCount <= 1
          ? ('attention' as const)
          : ('default' as const),
      loading: isLinkedIdentitiesPending,
    },
    ...(showReferralEntry
      ? [
          {
            id: 'referral' as const,
            title: t('ultima.referralInviteTitle', { defaultValue: 'Пригласить друга' }),
            value: referralBonusLabel,
            hint: t('ultima.home.referralLinkChoice', {
              defaultValue: 'Telegram или веб-ссылка',
            }),
            icon: UsersRound,
            onClick: referralTelegramLink || referralWebLink ? openReferralShare : openReferral,
            tone: 'accent' as const,
          },
        ]
      : []),
  ];
  const subscriptionPlanName =
    subscription?.tariff_name ||
    (isActiveTrial
      ? t('subscription.trialStatus', { defaultValue: 'Пробный период' })
      : t('subscription.infoTitle', { defaultValue: 'Подписка' }));
  const trafficNumberFormatter = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 1,
  });
  const mobileDaysValue =
    daysLeft === null ? '—' : trafficNumberFormatter.format(Math.max(daysLeft, 0));
  const mobilePurchaseCtaLabel =
    hasAnySubscription && !isActiveTrial
      ? t('ultima.subscriptionInfo.renewShort', { defaultValue: 'Продлить' })
      : t('ultima.chooseTariff', { defaultValue: 'Выбрать тариф' });
  const mobileOverviewCard = (
    <UltimaHomePlanCard
      eyebrow={t('ultima.currentTariff', { defaultValue: 'Ваш тариф' })}
      planName={subscriptionPlanName}
      statusLabel={statusLabel}
      tone={statusToneKey}
      expiryLabel={expiryLabel}
      daysLabel={t('ultima.home.daysLabel', { defaultValue: 'Дней осталось' })}
      daysValue={mobileDaysValue}
      devicesLabel={t('lite.devicesTotal', { defaultValue: 'Устройства' })}
      devicesValue={
        isDashboardDevicesUnavailable ? '—' : `${connectedDevicesCount}/${dashboardDeviceLimit}`
      }
      devicesLoading={isDashboardDevicesPending}
      brandMark={renderShieldButton('h-[82px] w-[82px] shrink-0')}
      primaryLabel={mobilePurchaseCtaLabel}
      primaryMeta={purchaseFromLabel}
      secondaryLabel={
        hasAnySubscription ? t('subscription.details', { defaultValue: 'Детали' }) : null
      }
      onPrimaryAction={handlePrimaryPurchase}
      onSecondaryAction={hasAnySubscription ? openSubscriptionInfo : null}
    />
  );
  const mobileTrafficCard = hasAnySubscription ? (
    <UltimaHomeTrafficCard
      locale={i18n.language}
      limitGb={trafficWarningLimitGb}
      usedGb={trafficWarningUsedGb}
      remainingGb={trafficWarningRemainingGb}
      usedPercent={trafficWarningPercent}
      isMetered={subscription?.metered_traffic_enabled}
      isBlocked={subscription?.metered_access_blocked}
      isTrial={isActiveTrial}
      standardUnlimited={subscription?.standard_traffic_unlimited}
      serverLabel={subscription?.metered_server_label}
      onTopUp={openTrafficPurchase}
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
      onClick={referralTelegramLink || referralWebLink ? openReferralShare : openReferral}
      variant="desktop"
      title={referralInviteTitle}
      description={referralInviteDescription}
      badgeLabel={referralInviteBadgeLabel}
    />
  ) : null;
  const desktopAccountCta = (
    <button
      type="button"
      onClick={openAccountLinking}
      data-testid="ultima-home-desktop-identities"
      className="group w-full rounded-[20px] border px-4 py-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_22px_rgba(3,14,24,0.16)] backdrop-blur-md transition hover:bg-white/[0.04]"
      style={{
        borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-surface) 42%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 62%, transparent))',
      }}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-white/[0.08] bg-white/[0.04] text-white/[0.82]">
          <KeyRound className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold leading-tight text-white/[0.96]">
            {t('profile.accountLinkingTitle', { defaultValue: 'Способы входа' })}
          </span>
          <span className="mt-1 block truncate text-[11px] text-white/[0.52]">
            {isLinkedIdentitiesPending
              ? t('common.loading', { defaultValue: 'Загрузка...' })
              : linkedProvidersLabel ||
                t('profile.ultima.accessNeedsBackup', {
                  defaultValue: 'Добавьте резервный вход',
                })}
          </span>
        </span>
        <span className="shrink-0 rounded-full border border-white/[0.09] px-2.5 py-1 text-[11px] font-semibold text-white/[0.76]">
          {linkedIdentityCount ?? '—'}
        </span>
      </span>
    </button>
  );
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
      <div className="ultima-shell ultima-shell-shared-nav-docked">
        <div className="ultima-shell-inner ultima-shell-mobile-docked">
          <section className="flex min-h-0 flex-1 flex-col pt-[clamp(12px,2.4vh,22px)]">
            <div
              className="min-h-[240px] animate-pulse rounded-[20px] border p-4"
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
                <div className="h-[82px] w-[82px] shrink-0 rounded-full bg-white/[0.06]" />
              </div>
              <div className="mt-4 h-16 border-y border-white/[0.07]" />
              <div className="mt-3 h-11 rounded-full bg-white/[0.07]" />
            </div>
            <div className="mt-3 h-[260px] animate-pulse rounded-[20px] border border-white/[0.07] bg-white/[0.04]" />
          </section>
        </div>
      </div>
    );
  }

  if (isDesktopViewport) {
    return (
      <>
        <div className={shellClassName}>
          <div className="ultima-shell-aura" />
          <UltimaDesktopDashboard
            heroButton={renderShieldButton('h-[108px] w-[108px] lg:h-[124px] lg:w-[124px]')}
            referralCta={desktopActionCtaStack}
            devicesCta={renderDevicesHomeCta()}
            accountCta={desktopAccountCta}
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
            primaryCtaLabel={purchaseCtaLabel}
            primaryCtaMeta={purchaseFromLabel}
            promoMessage={promoMessage}
            activeDiscount={activeDiscount}
            firstPromoOffer={firstPromoOffer}
            showTrialSetupCard={desktopShowTrialSetupCard}
            trialGuide={desktopTrialGuide}
            showConnectionCtaHighlight={showConnectionCtaHighlight}
            onPrimaryAction={handlePrimaryPurchase}
            onBuySubscription={openSubscriptionPurchase}
            onOpenConnection={() => openConnection()}
            onOpenTraffic={openTrafficPurchase}
            onOpenSupport={openSupport}
            onActivateOffer={
              firstPromoOffer ? () => claimOfferMutation.mutate(firstPromoOffer.id) : null
            }
            isActivatingOffer={claimOfferMutation.isPending}
            bottomNav={bottomNav}
          />
        </div>
        <UltimaReferralShareSheet
          open={isReferralShareOpen}
          onOpenChange={setIsReferralShareOpen}
          telegramLink={referralTelegramLink}
          webLink={referralWebLink}
          shareText={referralShareText}
          bonusLabel={referralBonusLabel}
          onOpenReferralPage={openReferral}
        />
      </>
    );
  }

  return (
    <div className={shellClassName}>
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[680px] lg:justify-between">
        <motion.section
          data-testid="ultima-dashboard-scroll-region"
          variants={staggerContainer}
          initial={reduceMotion ? false : 'initial'}
          animate="animate"
          className="ultima-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-[clamp(14px,2.8vh,24px)] pr-1 pt-[clamp(8px,1.6vh,14px)] lg:flex-none lg:overflow-visible lg:pb-2 lg:pr-0 lg:pt-8"
        >
          {isAdmin ? (
            <motion.div variants={staggerItem} className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className={adminButtonClassName}
              >
                <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
                <span>{t('admin.nav.title', { defaultValue: 'Админ' })}</span>
              </button>
            </motion.div>
          ) : null}

          <motion.div variants={staggerItem}>{mobileOverviewCard}</motion.div>

          {promoMessage && !showPromoCard && (
            <motion.div
              variants={staggerItem}
              aria-live="polite"
              className="mx-auto max-w-full rounded-full border border-emerald-200/[0.22] bg-emerald-300/[0.12] px-3.5 py-2 text-center text-[12px] font-medium leading-snug text-emerald-50/95 shadow-[0_10px_22px_rgba(5,30,24,0.2)] backdrop-blur-md"
            >
              {promoMessage}
            </motion.div>
          )}

          {pendingTopUp?.paymentUrl ? (
            <motion.div variants={staggerItem}>
              <UltimaPendingPaymentCard source="dashboard_mobile" />
            </motion.div>
          ) : null}

          {mobileTrafficCard ? (
            <motion.div variants={staggerItem}>{mobileTrafficCard}</motion.div>
          ) : null}

          {mobileHomeActions.length > 0 ? (
            <motion.div variants={staggerItem}>
              <UltimaHomeActionGrid
                title={t('ultima.home.quickActions', { defaultValue: 'Быстрые действия' })}
                subtitle={t('ultima.home.quickActionsHint', {
                  defaultValue: 'Устройства, установка, входы и приглашения',
                })}
                actions={mobileHomeActions}
              />
            </motion.div>
          ) : null}

          {showPromoCard && (
            <motion.div
              variants={staggerItem}
              className="rounded-lg border p-3.5 backdrop-blur-md"
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
            </motion.div>
          )}

          {showTrialSetupCard && (
            <motion.div variants={staggerItem}>
              <UltimaTrialGuide
                variant="inline"
                expiryDateLabel={trialExpiryDateLabel}
                daysLeft={daysLeft}
                trafficLimitGb={subscription?.traffic_limit_gb ?? 0}
                deviceLimit={subscription?.device_limit ?? 0}
                onPrimaryAction={handleTrialGuideStart}
                onStatClick={openSubscriptionInfo}
              />
            </motion.div>
          )}
        </motion.section>
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

      <UltimaReferralShareSheet
        open={isReferralShareOpen}
        onOpenChange={setIsReferralShareOpen}
        telegramLink={referralTelegramLink}
        webLink={referralWebLink}
        shareText={referralShareText}
        bonusLabel={referralBonusLabel}
        onOpenReferralPage={openReferral}
      />
    </div>
  );
}
