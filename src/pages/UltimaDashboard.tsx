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
import { promoApi } from '@/api/promo';
import { subscriptionApi } from '@/api/subscription';
import { ticketsApi } from '@/api/tickets';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { UltimaTrialGuide } from '@/components/ultima/UltimaTrialGuide';
import { useCurrency } from '@/hooks/useCurrency';
import { useBranding } from '@/hooks/useBranding';
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
import { warmUltimaStartup } from '@/features/ultima/warmup';

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16 text-white/95">
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

const loadedHomeLogoUrls = new Set<string>();
const shieldTapResetDelayMs = 1400;

export function UltimaDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const { currencySymbol } = useCurrency();
  const { hasCustomLogo, logoUrl } = useBranding();
  const haptic = useHaptic();
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const user = useAuthStore((state) => state.user);
  const rippleIdRef = useRef(0);
  const digitIdRef = useRef(0);
  const tapCountRef = useRef(0);
  const tapResetTimeoutRef = useRef<number | null>(null);
  const warmedLanguagesRef = useRef<Set<string>>(new Set());
  const trialAutoActivationAttemptedRef = useRef(false);
  const [shieldRipples, setShieldRipples] = useState<ShieldRipple[]>([]);
  const [shieldDigits, setShieldDigits] = useState<ShieldDigit[]>([]);
  const [connectionStep, setConnectionStep] = useState<1 | 2 | 3>(1);
  const [isConnectionCompleted, setIsConnectionCompleted] = useState(false);
  const [isReminderHidden, setIsReminderHidden] = useState(false);
  const [isTrialGuideVisible, setIsTrialGuideVisible] = useState(false);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

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
  const [isHomeLogoReady, setIsHomeLogoReady] = useState<boolean>(() =>
    Boolean(logoUrl && loadedHomeLogoUrls.has(logoUrl)),
  );

  const subscription = subscriptionResponse?.subscription ?? null;
  const hasAnySubscription = subscriptionResponse?.has_subscription === true;
  const isI18nReady =
    i18n.isInitialized &&
    (typeof i18n.hasLoadedNamespace !== 'function' || i18n.hasLoadedNamespace('translation'));
  const isSubscriptionReady =
    isSubscriptionFetched || Boolean(subscriptionResponse) || isSubscriptionError;
  const isActive = Boolean(subscription?.is_active && !subscription?.is_expired);
  const isActiveTrial = Boolean(subscription?.is_trial && isActive);
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
  const statusTone = !isActive
    ? {
        dot: 'bg-rose-300/95',
        halo: 'bg-rose-400/45',
        pill: 'border-rose-200/25 bg-rose-400/16 text-rose-100/95',
        pulse: 'from-rose-400/32 via-rose-300/22 to-transparent',
      }
    : isActiveTrial
      ? {
          dot: 'bg-emerald-200/95',
          halo: 'bg-emerald-300/45',
          pill: 'border-emerald-200/28 bg-emerald-300/16 text-emerald-50/95',
          pulse: 'from-emerald-300/34 via-emerald-200/24 to-transparent',
        }
      : (daysLeft ?? 99) <= 3
        ? {
            dot: 'bg-amber-200/95',
            halo: 'bg-amber-300/42',
            pill: 'border-amber-200/30 bg-amber-300/16 text-amber-50/95',
            pulse: 'from-amber-300/30 via-amber-200/20 to-transparent',
          }
        : {
            dot: 'bg-emerald-200/95',
            halo: 'bg-emerald-300/45',
            pill: 'border-emerald-200/28 bg-emerald-300/16 text-emerald-50/95',
            pulse: 'from-emerald-300/34 via-emerald-200/24 to-transparent',
          };
  const buyCtaLabel = useMemo(() => {
    if (!hasAnySubscription) {
      return t('ultima.buySubscriptionActivate', { defaultValue: 'Активировать подписку' });
    }
    if (!isActive) {
      return t('ultima.buySubscriptionRenew', { defaultValue: 'Продлить подписку' });
    }
    if ((daysLeft ?? 99) <= 3) {
      return t('subscription.renew', { defaultValue: 'Продлить' });
    }
    return t('lite.buySubscription', { defaultValue: 'Купить подписку' });
  }, [daysLeft, hasAnySubscription, isActive, t]);
  const buyFromLabel = useMemo(() => {
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

  useEffect(() => {
    // Warm subscription route chunk so dashboard -> purchase transition stays seamless.
    void import('./Subscription');
  }, []);

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
    if (isTrialGuideAcknowledged) {
      return;
    }

    writeUltimaConnectionStep(user?.id, 1);
    writeUltimaConnectionCompleted(user?.id, false);
    writeUltimaConnectionReminderHidden(user?.id, false);
    setConnectionStep(1);
    setIsConnectionCompleted(false);
    setIsReminderHidden(false);
  }, [isActiveTrial, isTrialGuideAcknowledged, trialSignature, user?.id]);

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
    };
  }, []);

  const handleShieldTap = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      haptic.impact('light');

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const id = rippleIdRef.current++;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 1.85;
      setShieldRipples((previous) => [...previous, { id, x, y, size }]);

      if (tapResetTimeoutRef.current !== null) {
        window.clearTimeout(tapResetTimeoutRef.current);
      }

      const nextTapNumber = ++tapCountRef.current;
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

      tapResetTimeoutRef.current = window.setTimeout(() => {
        tapCountRef.current = 0;
        tapResetTimeoutRef.current = null;
      }, shieldTapResetDelayMs);
    },
    [haptic],
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

  const openDevices = () => {
    haptic.impact('light');
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
    navigate('/ultima/devices');
  };

  const openSubscriptionInfo = () => {
    haptic.impact('light');
    void queryClient.prefetchQuery({
      queryKey: ['subscription'],
      queryFn: subscriptionApi.getSubscription,
      staleTime: 15000,
    });
    void import('./UltimaSubscriptionInfo');
    navigate('/ultima/subscription-info');
  };

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
  const showBrandLogoOnHome = Boolean(
    ultimaThemeConfig?.homeUseBrandLogo && hasCustomLogo && logoUrl,
  );

  useEffect(() => {
    if (!logoUrl) {
      setIsHomeLogoReady(false);
      return;
    }
    setIsHomeLogoReady(loadedHomeLogoUrls.has(logoUrl));
  }, [logoUrl]);

  if (!isI18nReady || !isSubscriptionReady || shouldHoldForAutoTrial) {
    return (
      <div className="ultima-shell pb-[calc(20px+env(safe-area-inset-bottom,0px))] pt-2">
        <div className="relative z-10 mx-auto flex h-[calc(100dvh-26px)] w-full flex-col px-4 sm:px-6">
          <section className="pt-[clamp(74px,16vh,160px)]">
            <div className="mx-auto mb-[clamp(24px,5vh,56px)] flex h-24 w-24 items-center justify-center rounded-full bg-black/15">
              <ShieldIcon />
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

  return (
    <div className="ultima-shell">
      {isAdmin && (
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="absolute right-4 top-2 z-30 inline-flex h-9 items-center gap-1.5 rounded-full border border-amber-300/30 bg-black/30 px-3 text-xs font-medium text-amber-200 backdrop-blur"
        >
          <AdminIcon />
          <span>{t('admin.nav.title', { defaultValue: 'Админ' })}</span>
        </button>
      )}

      <div className="ultima-shell-inner">
        <section className="flex min-h-0 flex-1 flex-col pb-[clamp(14px,2.8vh,24px)] pt-[clamp(86px,19vh,198px)] lg:pb-3 lg:pt-16">
          <button
            type="button"
            aria-label={t('nav.dashboard')}
            onPointerDown={handleShieldTap}
            className="relative mx-auto mb-[clamp(24px,5vh,56px)] flex h-24 w-24 items-center justify-center rounded-full bg-black/15 focus-visible:outline-none lg:mb-8"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <span aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
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
            {showBrandLogoOnHome ? (
              <span
                className="flex h-[86px] w-[86px] items-center justify-center rounded-full border bg-black/20 p-3 backdrop-blur"
                style={{
                  borderColor:
                    'color-mix(in srgb, var(--ultima-color-surface-border) 34%, transparent)',
                  boxShadow:
                    '0 0 20px color-mix(in srgb, var(--ultima-color-ring) 24%, transparent), inset 0 1px 0 rgba(255,255,255,0.12)',
                }}
              >
                <img
                  src={logoUrl ?? undefined}
                  alt="project-logo"
                  className={`h-full w-full rounded-full object-contain transition-opacity duration-150 ${isHomeLogoReady ? 'opacity-100' : 'opacity-0'}`}
                  loading="eager"
                  decoding="sync"
                  onLoad={() => {
                    if (!logoUrl) {
                      return;
                    }
                    loadedHomeLogoUrls.add(logoUrl);
                    setIsHomeLogoReady(true);
                  }}
                />
                {!isHomeLogoReady && (
                  <span className="absolute inset-0 grid place-items-center">
                    <ShieldIcon />
                  </span>
                )}
              </span>
            ) : (
              <ShieldIcon />
            )}
          </button>

          {hasSetupReminder && (
            <div className="border-emerald-200/24 mb-4 rounded-2xl border bg-[rgba(12,45,42,0.38)] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(3,14,24,0.28)] backdrop-blur-md">
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

          {showTrialSetupCard && (
            <UltimaTrialGuide
              variant="inline"
              expiryDateLabel={trialExpiryDateLabel}
              daysLeft={daysLeft}
              trafficLimitGb={subscription?.traffic_limit_gb ?? 0}
              deviceLimit={subscription?.device_limit ?? 0}
              onPrimaryAction={handleTrialGuideStart}
            />
          )}

          {hasCompactSetupReminder && (
            <button
              type="button"
              onClick={() => openConnection()}
              className="border-emerald-200/16 mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border bg-[rgba(12,45,42,0.28)] px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_24px_rgba(3,14,24,0.18)] backdrop-blur-md transition hover:bg-[rgba(16,58,54,0.34)]"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-semibold leading-tight text-white/95">
                  {t('ultima.setupCompactTitle', { defaultValue: 'VPN ещё не настроен' })}
                </p>
                <p className="text-white/68 mt-1 text-[12px] leading-snug">
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
              {promoMessage && <p className="mt-1.5 text-[12px] text-white/85">{promoMessage}</p>}
              <div className="mt-2.5 flex gap-2">
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

          {!showTrialSetupCard && (
            <>
              <div className="mb-3 mt-auto flex items-center justify-between text-white lg:mb-2 lg:mt-0">
                <div>
                  <button
                    type="button"
                    onClick={openSubscriptionInfo}
                    className="text-left text-[32px] font-semibold leading-none tracking-[-0.02em] text-white transition hover:text-white/90 sm:text-[36px] lg:text-[34px]"
                  >
                    {expiryLabel}
                  </button>
                  <button
                    type="button"
                    onClick={openDevices}
                    className="mt-2 text-left text-base text-emerald-300/90 transition hover:text-emerald-200"
                  >
                    {t('lite.devicesTotal', { defaultValue: 'Устройств' })}:{' '}
                    {subscription?.device_limit ?? 0}
                  </button>
                </div>
                <span
                  className={`relative inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${statusTone.pill}`}
                >
                  <span
                    className={`absolute left-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full blur-[4px] ${statusTone.halo}`}
                  />
                  <span className={`relative h-1.5 w-1.5 rounded-full ${statusTone.dot}`} />
                  {statusLabel}
                </span>
              </div>
              <div
                className={`mb-3 h-[2px] w-full rounded-full bg-gradient-to-r ${statusTone.pulse} lg:mb-2`}
              />
            </>
          )}
        </section>

        <section className="mt-auto pb-0 lg:mt-5 lg:pb-0">
          <button
            type="button"
            onClick={() => {
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
            }}
            className="ultima-btn-pill ultima-btn-primary mb-3 flex w-full items-center justify-between px-5 py-3 text-[16px]"
          >
            <span className="flex items-center gap-2">
              <GlobeIcon />
              {buyCtaLabel}
            </span>
            <span className="text-[16px] text-white/90">{buyFromLabel}</span>
          </button>

          <div className="relative mb-4">
            {showConnectionCtaHighlight && (
              <>
                <span className="ultima-cta-highlight pointer-events-none absolute inset-[-4px] rounded-[999px]" />
                <span className="ultima-cta-highlight ultima-cta-highlight-delay pointer-events-none absolute inset-[-10px] rounded-[999px]" />
              </>
            )}
            <button
              type="button"
              onClick={() => openConnection()}
              className="ultima-btn-pill ultima-btn-secondary relative flex w-full items-center justify-between px-5 py-3 text-[16px]"
            >
              <span className="flex items-center gap-2">
                <SetupIcon />
                {t('lite.connectAndSetup', { defaultValue: 'Установка и настройка' })}
              </span>
              <span className="text-white/70">
                <PhoneIcon />
              </span>
            </button>
          </div>

          <div className="ultima-nav-dock">
            <UltimaBottomNav active="home" onSupportClick={openSupport} />
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
