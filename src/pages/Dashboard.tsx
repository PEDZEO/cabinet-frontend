import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';
import { useBlockingStore } from '../store/blocking';
import { subscriptionApi } from '../api/subscription';
import { referralApi } from '../api/referral';
import { balanceApi } from '../api/balance';
import { wheelApi } from '../api/wheel';
import { authApi } from '../api/auth';
import Onboarding, { useOnboarding } from '../components/Onboarding';
import PromoOffersSection from '../components/PromoOffersSection';
import { useLiteMode } from '../hooks/useLiteMode';
import { LiteDashboard } from './LiteDashboard';
import SubscriptionCardExpired from '../components/dashboard/SubscriptionCardExpired';
import TrialOfferCard from '../components/dashboard/TrialOfferCard';
import StatsGrid from '../components/dashboard/StatsGrid';
import { API } from '../config/constants';

const ChevronRightIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
    />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992V4.356m-1.5 14.294A9 9 0 1 1 21 12"
    />
  </svg>
);

function getTrafficColor(percent: number): string {
  if (percent >= 90) return 'bg-error-500';
  if (percent >= 75) return 'bg-warning-500';
  if (percent >= 50) return 'bg-warning-400';
  return 'bg-success-500';
}

export default function Dashboard() {
  const { isLiteMode, isLiteModeReady } = useLiteMode();

  // Wait for lite mode to be determined (for new users)
  if (!isLiteModeReady) {
    return null;
  }

  // Render Lite Dashboard if lite mode is enabled
  if (isLiteMode) {
    return <LiteDashboard />;
  }

  return <FullDashboard />;
}

function FullDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const queryClient = useQueryClient();
  const { isCompleted: isOnboardingCompleted, complete: completeOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const blockingType = useBlockingStore((state) => state.blockingType);
  const [trialError, setTrialError] = useState<string | null>(null);

  // Refresh user data on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Fetch balance from API
  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: API.BALANCE_STALE_TIME_MS,
    refetchOnMount: 'always',
  });

  const { data: subscriptionResponse, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getSubscription,
    retry: false,
    staleTime: API.BALANCE_STALE_TIME_MS,
    refetchOnMount: 'always',
  });

  const subscription = subscriptionResponse?.subscription ?? null;

  const { data: trialInfo, isLoading: trialLoading } = useQuery({
    queryKey: ['trial-info'],
    queryFn: subscriptionApi.getTrialInfo,
    enabled: !subscription && !subLoading,
  });

  const { data: referralInfo, isLoading: refLoading } = useQuery({
    queryKey: ['referral-info'],
    queryFn: referralApi.getReferralInfo,
  });

  const { data: linkedIdentitiesData } = useQuery({
    queryKey: ['linked-identities'],
    queryFn: authApi.getLinkedIdentities,
    enabled: !!user,
  });

  const hasMergedAnotherAccount =
    user?.auth_type === 'merged' || (linkedIdentitiesData?.identities?.length ?? 0) > 1;

  // Fetch wheel config to show banner if enabled
  const { data: wheelConfig } = useQuery({
    queryKey: ['wheel-config'],
    queryFn: wheelApi.getConfig,
    staleTime: 60000,
    retry: false,
  });

  const activateTrialMutation = useMutation({
    mutationFn: subscriptionApi.activateTrial,
    onSuccess: () => {
      setTrialError(null);
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['trial-info'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      refreshUser();
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      setTrialError(error.response?.data?.detail || t('common.error'));
    },
  });

  // Traffic refresh state and mutation
  const [trafficRefreshCooldown, setTrafficRefreshCooldown] = useState(0);
  const [trafficData, setTrafficData] = useState<{
    traffic_used_gb: number;
    traffic_used_percent: number;
    is_unlimited: boolean;
  } | null>(null);

  const refreshTrafficMutation = useMutation({
    mutationFn: subscriptionApi.refreshTraffic,
    onSuccess: (data) => {
      setTrafficData({
        traffic_used_gb: data.traffic_used_gb,
        traffic_used_percent: data.traffic_used_percent,
        is_unlimited: data.is_unlimited,
      });
      localStorage.setItem('traffic_refresh_ts', Date.now().toString());
      if (data.rate_limited && data.retry_after_seconds) {
        setTrafficRefreshCooldown(data.retry_after_seconds);
      } else {
        setTrafficRefreshCooldown(30);
      }
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (error: {
      response?: { status?: number; headers?: { get?: (key: string) => string } };
    }) => {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers?.get?.('Retry-After');
        setTrafficRefreshCooldown(retryAfter ? parseInt(retryAfter, 10) : 30);
      }
    },
  });

  // Cooldown timer
  useEffect(() => {
    if (trafficRefreshCooldown <= 0) return;
    const timer = setInterval(() => {
      setTrafficRefreshCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [trafficRefreshCooldown]);

  // Auto-refresh traffic on mount (with 30s caching)
  const hasAutoRefreshed = useRef(false);

  useEffect(() => {
    if (!subscription) return;
    if (hasAutoRefreshed.current) return;
    hasAutoRefreshed.current = true;

    const lastRefresh = localStorage.getItem('traffic_refresh_ts');
    const now = Date.now();
    const cacheMs = API.TRAFFIC_CACHE_MS;

    if (lastRefresh && now - parseInt(lastRefresh, 10) < cacheMs) {
      const elapsed = now - parseInt(lastRefresh, 10);
      const remaining = Math.ceil((cacheMs - elapsed) / 1000);
      if (remaining > 0) {
        setTrafficRefreshCooldown(remaining);
      }
      return;
    }

    refreshTrafficMutation.mutate();
  }, [subscription, refreshTrafficMutation]);

  const hasNoSubscription = subscriptionResponse?.has_subscription === false && !subLoading;

  // Show onboarding for new users after data loads
  useEffect(() => {
    if (!isOnboardingCompleted && !subLoading && !refLoading && !blockingType) {
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isOnboardingCompleted, subLoading, refLoading, blockingType]);

  const onboardingSteps = useMemo(() => {
    type Placement = 'top' | 'bottom' | 'left' | 'right';
    const steps: Array<{
      target: string;
      title: string;
      description: string;
      placement: Placement;
    }> = [
      {
        target: 'welcome',
        title: t('onboarding.steps.welcome.title'),
        description: t('onboarding.steps.welcome.description'),
        placement: 'bottom',
      },
      {
        target: 'balance',
        title: t('onboarding.steps.balance.title'),
        description: t('onboarding.steps.balance.description'),
        placement: 'bottom',
      },
    ];

    if (subscription?.subscription_url) {
      steps.splice(1, 0, {
        target: 'connect-devices',
        title: t('onboarding.steps.connectDevices.title'),
        description: t('onboarding.steps.connectDevices.description'),
        placement: 'bottom',
      });
    }

    return steps;
  }, [t, subscription]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    completeOnboarding();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div data-onboarding="welcome">
        <h1 className="text-2xl font-bold text-dark-50 sm:text-3xl">
          {t('dashboard.welcome', { name: user?.first_name || user?.username || '' })}
        </h1>
        <p className="mt-1 text-dark-400">{t('dashboard.yourSubscription')}</p>
      </div>

      {!hasMergedAnotherAccount && (
        <div className="rounded-linear border border-accent-500/20 bg-accent-500/5 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-dark-300">{t('dashboard.accountLinking.title')}</p>
            <Link
              to="/account-linking"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent-400 transition-colors hover:text-accent-300"
            >
              {t('dashboard.accountLinking.cta')}
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
      )}

      {/* Subscription Status - Main Card */}
      {subLoading ? (
        <div className="bento-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="skeleton h-5 w-20" />
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
          <div className="skeleton mb-3 h-10 w-32" />
          <div className="skeleton mb-3 h-4 w-40" />
          <div className="skeleton h-3 w-full rounded-full" />
          <div className="mt-5">
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
        </div>
      ) : subscription?.is_expired ? (
        <SubscriptionCardExpired subscription={subscription} />
      ) : subscription ? (
        <div
          className={`bento-card ${subscription.is_trial ? 'border-warning-500/30 bg-gradient-to-br from-warning-500/5 to-transparent' : ''}`}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-dark-100">{t('subscription.status')}</h2>
              {subscription.tariff_name && (
                <div className="mt-1 text-sm text-accent-400">{subscription.tariff_name}</div>
              )}
            </div>
            <span
              className={
                subscription.is_trial
                  ? 'badge-warning'
                  : subscription.is_active
                    ? 'badge-success'
                    : 'badge-error'
              }
            >
              {subscription.is_trial
                ? t('subscription.trialStatus')
                : subscription.is_active
                  ? t('subscription.active')
                  : t('subscription.expired')}
            </span>
          </div>

          {/* Trial Info Banner */}
          {subscription.is_trial && subscription.is_active && (
            <div className="mb-6 rounded-xl border border-warning-500/30 bg-warning-500/10 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-warning-500/20 text-xl">
                  <SparklesIcon />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-warning-300">
                    {t('subscription.trialBanner.title')}
                  </div>
                  <div className="mt-1 text-sm text-dark-400">
                    {t('subscription.trialBanner.description', { days: subscription.days_left })}
                  </div>
                  <Link
                    to="/subscription"
                    state={{ scrollToExtend: true }}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-warning-400 transition-colors hover:text-warning-300"
                  >
                    {t('subscription.trialBanner.upgrade')}
                    <ArrowRightIcon />
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <div className="mb-1 text-sm text-dark-500">{t('subscription.expiresAt')}</div>
              <div className="font-medium text-dark-100">
                {new Date(subscription.end_date).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm text-dark-500">{t('subscription.traffic')}</span>
                <button
                  onClick={() => refreshTrafficMutation.mutate()}
                  disabled={refreshTrafficMutation.isPending || trafficRefreshCooldown > 0}
                  className="rounded-full p-1 text-dark-400 transition-colors hover:bg-dark-700/50 hover:text-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
                  title={
                    trafficRefreshCooldown > 0 ? `${trafficRefreshCooldown}s` : t('common.refresh')
                  }
                >
                  <RefreshIcon
                    className={`h-3.5 w-3.5 ${refreshTrafficMutation.isPending ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>
              <div className="font-medium text-dark-100">
                {(trafficData?.traffic_used_gb ?? subscription.traffic_used_gb).toFixed(1)} /{' '}
                {subscription.traffic_limit_gb || '∞'} GB
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/subscription', { state: { scrollToDevices: true } })}
              className="text-left"
              aria-label={t('subscription.myDevices')}
            >
              <div className="mb-1 text-sm text-dark-500">{t('subscription.devices')}</div>
              <div className="font-medium text-dark-100 transition-colors hover:text-accent-400">
                {subscription.device_limit}
              </div>
            </button>
            <div>
              <div className="mb-1 text-sm text-dark-500">{t('subscription.timeLeft')}</div>
              <div className="font-medium text-dark-100">
                {subscription.days_left > 0
                  ? t('subscription.days', { count: subscription.days_left })
                  : `${t('subscription.hours', { count: subscription.hours_left })} ${t('subscription.minutes', { count: subscription.minutes_left })}`}
              </div>
            </div>
          </div>

          {/* Traffic Progress */}
          {subscription.traffic_limit_gb > 0 && (
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-dark-400">{t('subscription.trafficUsed')}</span>
                <span className="text-dark-300">
                  {(trafficData?.traffic_used_percent ?? subscription.traffic_used_percent).toFixed(
                    1,
                  )}
                  %
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${getTrafficColor(trafficData?.traffic_used_percent ?? subscription.traffic_used_percent)}`}
                  style={{
                    width: `${Math.min(trafficData?.traffic_used_percent ?? subscription.traffic_used_percent, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div
            className={`mt-6 grid gap-3 ${subscription.subscription_url ? 'grid-cols-2' : 'grid-cols-1'}`}
          >
            <Link to="/subscription" className="btn-primary py-2.5 text-center text-sm">
              {t('dashboard.viewSubscription')}
            </Link>
            {subscription.subscription_url && (
              <button
                onClick={() => navigate('/connection')}
                className="btn-secondary py-2.5 text-sm"
                data-onboarding="connect-devices"
              >
                {t('subscription.getConfig')}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Trial Activation */}
      {hasNoSubscription && !trialLoading && trialInfo?.is_available && (
        <TrialOfferCard
          trialInfo={trialInfo}
          balanceKopeks={balanceData?.balance_kopeks || 0}
          balanceRubles={balanceData?.balance_rubles || 0}
          activateTrialMutation={activateTrialMutation}
          trialError={trialError}
        />
      )}

      {/* Promo Offers */}
      <PromoOffersSection />

      {/* Stats Grid */}
      <StatsGrid
        balanceRubles={balanceData?.balance_rubles || 0}
        subscription={subscription}
        referralCount={referralInfo?.total_referrals || 0}
        earningsRubles={referralInfo?.total_earnings_rubles || 0}
        refLoading={refLoading}
      />

      {/* Fortune Wheel Banner */}
      {wheelConfig?.is_enabled && (
        <Link to="/wheel" className="bento-card-hover group flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🎰</span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-dark-100">{t('wheel.banner.title')}</h3>
              <p className="text-sm text-dark-400">{t('wheel.banner.description')}</p>
            </div>
          </div>
          <div className="flex-shrink-0 text-dark-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent-400">
            <ChevronRightIcon />
          </div>
        </Link>
      )}

      {/* Onboarding Tutorial */}
      {showOnboarding && (
        <Onboarding
          steps={onboardingSteps}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )}
    </div>
  );
}
