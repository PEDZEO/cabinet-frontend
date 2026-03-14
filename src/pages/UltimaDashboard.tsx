import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { balanceApi } from '@/api/balance';
import { infoApi } from '@/api/info';
import { subscriptionApi } from '@/api/subscription';
import { ticketsApi } from '@/api/tickets';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { useCurrency } from '@/hooks/useCurrency';
import { useHaptic } from '@/platform';
import { useAuthStore } from '@/store/auth';
import { warmUltimaStartup } from '@/features/ultima/warmup';

const ULTIMA_CONNECTION_STATE_KEY = 'ultima_connection_flow_v1';

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

export function UltimaDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const { currencySymbol } = useCurrency();
  const haptic = useHaptic();
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const user = useAuthStore((state) => state.user);
  const rippleIdRef = useRef(0);
  const warmedLanguagesRef = useRef<Set<string>>(new Set());
  const trialAutoActivationAttemptedRef = useRef(false);
  const [shieldRipples, setShieldRipples] = useState<ShieldRipple[]>([]);
  const [connectionStep, setConnectionStep] = useState<1 | 2 | 3>(1);

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

  const subscription = subscriptionResponse?.subscription ?? null;
  const hasAnySubscription = subscriptionResponse?.has_subscription === true;
  const isI18nReady =
    i18n.isInitialized &&
    (typeof i18n.hasLoadedNamespace !== 'function' || i18n.hasLoadedNamespace('translation'));
  const isSubscriptionReady =
    isSubscriptionFetched || Boolean(subscriptionResponse) || isSubscriptionError;
  const isActive = Boolean(subscription?.is_active && !subscription?.is_expired);
  const statusLabel = isActive ? t('subscription.active') : t('subscription.expired');
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
      const dayWord =
        i18n.language?.startsWith('ru') && daysLeft === 1
          ? 'день'
          : i18n.language?.startsWith('ru') && (daysLeft === 2 || daysLeft === 3 || daysLeft === 4)
            ? 'дня'
            : i18n.language?.startsWith('ru')
              ? 'дней'
              : 'days';
      return t('ultima.buySubscriptionDaysLeft', {
        defaultValue: `Продлить (${daysLeft ?? 0} ${dayWord})`,
      });
    }
    return t('lite.buySubscription', { defaultValue: 'Купить подписку' });
  }, [daysLeft, hasAnySubscription, i18n.language, isActive, t]);
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
    const key = `${ULTIMA_CONNECTION_STATE_KEY}:${user?.id ?? 'guest'}`;
    const readStep = () => {
      try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? Number(raw) : 1;
        setConnectionStep(parsed === 3 ? 3 : parsed === 2 ? 2 : 1);
      } catch {
        setConnectionStep(1);
      }
    };

    readStep();
    window.addEventListener('focus', readStep);
    document.addEventListener('visibilitychange', readStep);
    return () => {
      window.removeEventListener('focus', readStep);
      document.removeEventListener('visibilitychange', readStep);
    };
  }, [user?.id]);

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

      window.setTimeout(() => {
        setShieldRipples((previous) => previous.filter((ripple) => ripple.id !== id));
      }, 900);
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

  const hasSetupReminder = connectionStep === 2;

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
            </span>
            <ShieldIcon />
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
                onClick={() => navigate('/connection')}
                className="ultima-btn-pill ultima-btn-primary mt-2.5 flex w-full items-center justify-center px-4 py-2.5 text-[15px]"
              >
                {t('ultima.finishSetup', { defaultValue: 'Завершить установку' })}
              </button>
            </div>
          )}

          <div className="mb-3 mt-auto flex items-center justify-between text-white lg:mb-2 lg:mt-0">
            <div>
              <p className="text-[32px] font-semibold leading-none tracking-[-0.02em] sm:text-[36px] lg:text-[34px]">
                {expiryLabel}
              </p>
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

          <button
            type="button"
            onClick={() => navigate('/connection')}
            className="ultima-btn-pill ultima-btn-secondary mb-4 flex w-full items-center justify-between px-5 py-3 text-[16px]"
          >
            <span className="flex items-center gap-2">
              <SetupIcon />
              {t('lite.connectAndSetup', { defaultValue: 'Установка и настройка' })}
            </span>
            <span className="text-white/70">
              <PhoneIcon />
            </span>
          </button>

          <div className="ultima-nav-dock">
            <UltimaBottomNav active="home" onSupportClick={openSupport} />
          </div>
        </section>
      </div>
    </div>
  );
}
