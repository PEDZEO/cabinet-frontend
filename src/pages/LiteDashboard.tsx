import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { subscriptionApi } from '@/api/subscription';
import { referralApi } from '@/api/referral';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import { useHapticFeedback } from '@/platform/hooks/useHaptic';
import { LiteSubscriptionCard } from '@/components/lite/LiteSubscriptionCard';
import { LiteDashboardSkeleton } from '@/components/lite/LiteDashboardSkeleton';
import { PullToRefresh } from '@/components/lite/PullToRefresh';
import Onboarding from '@/components/Onboarding';
import PromoOffersSection from '@/components/PromoOffersSection';
import {
  getLiteOnboardingFlowState,
  markLiteOnboardingStep,
  resetLiteOnboardingFlowState,
} from '@/features/lite/onboardingFlow';

const GiftIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
    />
  </svg>
);

const CopyIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
    />
  </svg>
);

const CopyCheckIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const ShareIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8l5-5m0 0l5 5m-5-5v12" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
  </svg>
);

// Lite mode onboarding hook with separate storage key
const LITE_ONBOARDING_KEY = 'lite_onboarding_completed';
const LITE_TRIAL_SETUP_HINT_DISMISSED_KEY = 'lite_trial_setup_hint_dismissed';
const TRIAL_ACTIVATE_CLICK_COOLDOWN_MS = 1500;
const CARD_LAYOUT_SPRING = { type: 'spring', stiffness: 320, damping: 30, mass: 0.9 } as const;

function useLiteOnboarding(userId?: number | null) {
  const storageKey = userId ? `${LITE_ONBOARDING_KEY}_${userId}` : LITE_ONBOARDING_KEY;
  const [isCompleted, setIsCompleted] = useState(() => {
    return localStorage.getItem(storageKey) === 'true';
  });

  useEffect(() => {
    setIsCompleted(localStorage.getItem(storageKey) === 'true');
  }, [storageKey]);

  const complete = useCallback(() => {
    localStorage.setItem(storageKey, 'true');
    setIsCompleted(true);
  }, [storageKey]);

  return { isCompleted, complete };
}

export function LiteDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuthStore();
  const haptic = useHapticFeedback();
  const userId = user?.id ?? null;
  const [trialError, setTrialError] = useState<string | null>(null);
  const [isTrialActivationLocked, setIsTrialActivationLocked] = useState(false);
  const trialActivationCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [onboardingFlow, setOnboardingFlow] = useState(() => getLiteOnboardingFlowState(user?.id));
  const [isTrialSetupHintDismissed, setIsTrialSetupHintDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { isCompleted: isOnboardingCompleted, complete: completeOnboarding } = useLiteOnboarding(
    user?.id,
  );

  useEffect(() => {
    setOnboardingFlow(getLiteOnboardingFlowState(userId));
  }, [userId]);

  useEffect(() => {
    const storageKey = userId
      ? `${LITE_TRIAL_SETUP_HINT_DISMISSED_KEY}_${userId}`
      : LITE_TRIAL_SETUP_HINT_DISMISSED_KEY;
    setIsTrialSetupHintDismissed(localStorage.getItem(storageKey) === 'true');
  }, [userId]);

  const dismissTrialSetupHint = useCallback(() => {
    const storageKey = userId
      ? `${LITE_TRIAL_SETUP_HINT_DISMISSED_KEY}_${userId}`
      : LITE_TRIAL_SETUP_HINT_DISMISSED_KEY;
    localStorage.setItem(storageKey, 'true');
    setIsTrialSetupHintDismissed(true);
  }, [userId]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['subscription'] }),
      queryClient.invalidateQueries({ queryKey: ['trial-info'] }),
      queryClient.invalidateQueries({ queryKey: ['balance'] }),
      queryClient.invalidateQueries({ queryKey: ['referral-info'] }),
    ]);
  }, [queryClient]);

  // Queries
  const { data: subscriptionResponse, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getSubscription,
    refetchOnMount: 'always',
  });

  const { data: trialInfo, isLoading: isTrialInfoLoading } = useQuery({
    queryKey: ['trial-info'],
    queryFn: subscriptionApi.getTrialInfo,
    enabled:
      !!subscriptionResponse &&
      !(
        !!subscriptionResponse.subscription?.is_active &&
        !subscriptionResponse.subscription?.is_expired
      ),
  });

  const { data: referralInfo } = useQuery({
    queryKey: ['referral-info'],
    queryFn: referralApi.getReferralInfo,
  });

  const { data: purchaseOptions } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: subscriptionApi.getPurchaseOptions,
  });

  const { data: linkedIdentitiesData } = useQuery({
    queryKey: ['linked-identities'],
    queryFn: authApi.getLinkedIdentities,
    enabled: !!user,
  });

  const hasMergedAnotherAccount =
    user?.auth_type === 'merged' || (linkedIdentitiesData?.identities?.length ?? 0) > 1;

  // Referral link and handlers
  const referralLink = referralInfo?.referral_code
    ? `${window.location.origin}/login?ref=${referralInfo.referral_code}`
    : '';
  const referralLinkPreview =
    referralLink.length > 44
      ? `${referralLink.slice(0, 30)}...${referralLink.slice(-10)}`
      : referralLink;

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      haptic.success();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferralLink = () => {
    if (!referralLink) return;
    const shareText = t('lite.referral.shareText', {
      percent: referralInfo?.commission_percent || 0,
    });

    if (navigator.share) {
      navigator
        .share({
          title: t('lite.referral.title'),
          text: shareText,
          url: referralLink,
        })
        .catch(() => {});
      return;
    }

    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
      referralLink,
    )}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  // Mutations
  const activateTrialMutation = useMutation({
    mutationFn: subscriptionApi.activateTrial,
    onSuccess: () => {
      setTrialError(null);
      resetLiteOnboardingFlowState(user?.id);
      setOnboardingFlow(markLiteOnboardingStep('trial_activated', user?.id));
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['trial-info'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['appConfig'] });
      refreshUser();
      navigate('/connection?guide=trial&step=2');
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const detail = error.response?.data?.detail?.toLowerCase() ?? '';

      if (
        detail.includes('insufficient') ||
        detail.includes('balance') ||
        detail.includes('fund')
      ) {
        setTrialError(t('lite.trialErrors.insufficientBalance'));
        return;
      }

      if (detail.includes('already') || detail.includes('used') || detail.includes('activated')) {
        setTrialError(t('lite.trialErrors.alreadyUsed'));
        return;
      }

      if (
        detail.includes('unavailable') ||
        detail.includes('forbidden') ||
        detail.includes('disabled')
      ) {
        setTrialError(t('lite.trialErrors.unavailable'));
        return;
      }

      setTrialError(t('lite.trialErrors.generic'));
    },
  });

  const handleActivateTrial = () => {
    if (activateTrialMutation.isPending || isTrialActivationLocked) {
      return;
    }

    setIsTrialActivationLocked(true);
    trialActivationCooldownRef.current = setTimeout(() => {
      setIsTrialActivationLocked(false);
      trialActivationCooldownRef.current = null;
    }, TRIAL_ACTIVATE_CLICK_COOLDOWN_MS);

    activateTrialMutation.mutate();
  };

  useEffect(() => {
    return () => {
      if (trialActivationCooldownRef.current) {
        clearTimeout(trialActivationCooldownRef.current);
      }
    };
  }, []);

  const subscription = subscriptionResponse?.subscription ?? null;
  const hasNoSubscription = subscriptionResponse?.has_subscription === false && !subLoading;
  const hasActiveSubscription =
    !!subscription && subscription.is_active && !subscription.is_expired;
  const canOfferTrial = !hasActiveSubscription && !!trialInfo?.is_available;
  const isTrialInfoPending = !hasActiveSubscription && isTrialInfoLoading;
  const showTrial = hasNoSubscription && canOfferTrial;
  const shouldShowTrialConnectHint = !hasActiveSubscription && !isTrialInfoPending && canOfferTrial;
  const trialFlowStep1Done = onboardingFlow.trial_activated;
  const trialFlowStep2Done = onboardingFlow.connection_opened;
  const trialFlowStep3Done = onboardingFlow.subscription_added;
  const showTrialFlow =
    (shouldShowTrialConnectHint || onboardingFlow.trial_activated) &&
    !(trialFlowStep3Done && hasActiveSubscription);
  const showIncompleteTrialSetupHint =
    trialFlowStep1Done && !trialFlowStep3Done && !isTrialSetupHintDismissed;

  // Get device limit from tariff settings
  const tariffs = purchaseOptions?.sales_mode === 'tariffs' ? purchaseOptions.tariffs : [];
  const currentTariffId =
    purchaseOptions?.sales_mode === 'tariffs' ? purchaseOptions.current_tariff_id : null;
  const resolvedCurrentTariffId = currentTariffId ?? subscription?.tariff_id ?? null;
  const currentTariff =
    resolvedCurrentTariffId !== null
      ? tariffs.find((t) => t.id === resolvedCurrentTariffId) || null
      : null;
  const deviceLimitFromTariff = currentTariff?.device_limit;

  // Onboarding
  useEffect(() => {
    if (!isOnboardingCompleted && !subLoading) {
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isOnboardingCompleted, subLoading]);

  const onboardingSteps = useMemo(() => {
    type Placement = 'top' | 'bottom' | 'left' | 'right';
    const steps: Array<{
      target: string;
      title: string;
      description: string;
      placement: Placement;
    }> = [
      {
        target: 'lite-subscription',
        title: t('onboarding.lite.subscription.title'),
        description: t('onboarding.lite.subscription.description'),
        placement: 'bottom',
      },
      {
        target: 'lite-connect',
        title: t('onboarding.lite.connect.title'),
        description: t('onboarding.lite.connect.description'),
        placement: 'bottom',
      },
      {
        target: 'lite-topup',
        title: t('onboarding.lite.topup.title'),
        description: t('onboarding.lite.topup.description'),
        placement: 'bottom',
      },
      {
        target: 'lite-tariffs',
        title: t('onboarding.lite.tariffs.title'),
        description: t('onboarding.lite.tariffs.description'),
        placement: 'top',
      },
    ];
    return steps;
  }, [t]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    completeOnboarding();
  };

  // Show skeleton while loading initial data
  if (subLoading && !subscriptionResponse) {
    return <LiteDashboardSkeleton />;
  }

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh} className="min-h-[calc(100vh-120px)]">
        <div className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-6xl flex-col px-3 py-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] min-[360px]:px-4 min-[360px]:py-6 lg:px-6 lg:pb-10 xl:px-8 2xl:py-8">
          <div className="flex flex-1 flex-col gap-5 min-[360px]:gap-6">
            <section className="space-y-5 min-[360px]:space-y-6">
              {/* Subscription status or Trial card */}
              <motion.div
                layout
                transition={{ layout: CARD_LAYOUT_SPRING }}
                className="space-y-4 min-[360px]:space-y-5"
                data-onboarding="lite-subscription"
              >
                {subscription && (
                  <motion.div
                    key="subscription-card"
                    layout
                    transition={{ layout: CARD_LAYOUT_SPRING }}
                    data-testid="lite-subscription-active-card"
                  >
                    <LiteSubscriptionCard
                      subscription={subscription}
                      deviceLimit={deviceLimitFromTariff}
                    />
                  </motion.div>
                )}

                {isTrialInfoPending && (
                  <motion.div
                    key="trial-loading-card"
                    layout
                    transition={{ layout: CARD_LAYOUT_SPRING }}
                    data-testid="lite-trial-loading-card"
                    className="rounded-2xl border border-dark-600 bg-dark-800/80 p-3 text-center min-[360px]:p-4"
                  >
                    <p className="text-dark-300">{t('lite.connectAvailabilityLoading')}</p>
                  </motion.div>
                )}

                {hasNoSubscription && !isTrialInfoPending && !showTrial && (
                  <motion.div
                    key="no-subscription-card"
                    layout
                    transition={{ layout: CARD_LAYOUT_SPRING }}
                    data-testid="lite-no-subscription-card"
                    className="rounded-2xl border border-dark-600 bg-dark-800/80 p-3 text-center min-[360px]:p-4"
                  >
                    <p className="text-dark-300">{t('lite.noSubscription')}</p>
                  </motion.div>
                )}

                <AnimatePresence mode="sync" initial={false}>
                  {showTrialFlow &&
                    (showIncompleteTrialSetupHint ? (
                      <motion.div
                        key="incomplete-setup-hint"
                        layout
                        transition={{ layout: CARD_LAYOUT_SPRING }}
                        data-testid="lite-incomplete-setup-hint"
                        className="rounded-2xl border border-warning-500/35 bg-warning-500/10 p-3 min-[360px]:p-4"
                      >
                        <p className="text-base font-semibold text-warning-300">
                          {t('lite.incompleteSetup.title', 'Вы не завершили настройку')}
                        </p>
                        <p className="mt-1 text-xs text-dark-200">
                          {t(
                            'lite.incompleteSetup.description',
                            'Чтобы VPN заработал, необходимо добавить подписку в приложение Happ.',
                          )}
                        </p>
                        <div className="mt-3 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => navigate('/connection?guide=trial&step=2')}
                            className="w-full rounded-xl border border-accent-400/60 bg-accent-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70"
                          >
                            {t('lite.incompleteSetup.continue', 'Продолжить настройку')}
                          </button>
                          <button
                            type="button"
                            onClick={dismissTrialSetupHint}
                            className="w-full rounded-xl border border-dark-600 bg-dark-800/70 py-2.5 text-sm font-medium text-dark-100 transition-colors hover:border-dark-500 hover:bg-dark-700"
                          >
                            {t('lite.incompleteSetup.hide', 'Больше не показывать')}
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="trial-hint-card"
                        layout
                        transition={{ layout: CARD_LAYOUT_SPRING }}
                        data-testid="lite-trial-hint-card"
                        className="rounded-2xl border border-warning-500/35 bg-warning-500/10 p-3 min-[360px]:p-4"
                      >
                        <p className="text-sm font-semibold text-warning-300">
                          {t('lite.connectHintTrialTitle')}
                        </p>
                        <p className="mt-1 text-xs text-dark-300">
                          {t('lite.connectHintTrialDescription')}
                        </p>
                        <p className="mt-2 text-2xs font-semibold uppercase tracking-[0.05em] text-dark-400">
                          {t('lite.connectHintProgress', {
                            current: trialFlowStep3Done
                              ? 3
                              : trialFlowStep2Done
                                ? 2
                                : trialFlowStep1Done
                                  ? 1
                                  : 0,
                            total: 3,
                          })}
                        </p>
                        <ol className="mt-2 space-y-1.5 text-xs text-dark-200">
                          <li className="flex items-start gap-2">
                            <span
                              className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold ${trialFlowStep1Done ? 'bg-success-500/20 text-success-300' : 'bg-dark-700 text-dark-300'}`}
                            >
                              {trialFlowStep1Done ? '✓' : '1'}
                            </span>
                            <span>{t('lite.connectHintTrialStep1')}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span
                              className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold ${trialFlowStep2Done ? 'bg-success-500/20 text-success-300' : 'bg-dark-700 text-dark-300'}`}
                            >
                              {trialFlowStep2Done ? '✓' : '2'}
                            </span>
                            <span>{t('lite.connectHintTrialStep2')}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span
                              className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold ${trialFlowStep3Done ? 'bg-success-500/20 text-success-300' : 'bg-dark-700 text-dark-300'}`}
                            >
                              {trialFlowStep3Done ? '✓' : '3'}
                            </span>
                            <span>{t('lite.connectHintTrialStep3')}</span>
                          </li>
                        </ol>
                        {!trialFlowStep1Done && (
                          <button
                            type="button"
                            data-testid="lite-activate-trial"
                            onClick={handleActivateTrial}
                            disabled={activateTrialMutation.isPending || isTrialActivationLocked}
                            className="mt-3 w-full rounded-xl border border-white/45 bg-accent-500 py-2.5 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.3)] ring-1 ring-white/35 transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:animate-pulse"
                          >
                            {activateTrialMutation.isPending
                              ? t('common.loading')
                              : t('lite.activateTrial')}
                          </button>
                        )}
                        {trialError && <p className="mt-2 text-xs text-error-300">{trialError}</p>}
                      </motion.div>
                    ))}
                </AnimatePresence>
              </motion.div>

              {!hasMergedAnotherAccount && (
                <motion.div
                  layout
                  transition={{ layout: CARD_LAYOUT_SPRING }}
                  className="rounded-xl border border-accent-500/20 bg-accent-500/5 px-3 py-2"
                >
                  <div className="flex flex-col gap-1.5 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between min-[360px]:gap-3">
                    <p className="text-xs text-dark-300">{t('lite.accountLinking.title')}</p>
                    <Link
                      to="/profile"
                      className="self-start text-xs font-medium text-accent-400 transition-colors hover:text-accent-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70 min-[360px]:self-auto"
                    >
                      {t('lite.accountLinking.cta')}
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* Promo Offers */}
              <motion.div layout transition={{ layout: CARD_LAYOUT_SPRING }}>
                <PromoOffersSection useNowPath="/subscription/purchase" />
              </motion.div>

              {/* Referral card */}
              {referralLink && (
                <motion.div
                  layout
                  transition={{ layout: CARD_LAYOUT_SPRING }}
                  className="from-accent-500/12 via-accent-500/6 rounded-2xl border border-accent-500/25 bg-gradient-to-br to-transparent p-3 min-[360px]:p-4"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/20 text-accent-400">
                      <GiftIcon />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-dark-50">
                        {t('lite.referral.title')}
                      </h3>
                      <p className="text-xs text-dark-300">
                        {t('lite.referral.description', {
                          percent: referralInfo?.commission_percent || 0,
                        })}
                      </p>
                    </div>
                    <span className="rounded-full border border-accent-400/40 bg-accent-500/15 px-2 py-1 text-2xs font-semibold tabular-nums text-accent-300">
                      {referralInfo?.commission_percent || 0}%
                    </span>
                  </div>

                  <div className="mb-3 overflow-hidden rounded-lg border border-dark-700/70 bg-dark-900/60 px-3 py-2">
                    <p className="truncate text-xs font-medium text-dark-200" title={referralLink}>
                      {referralLinkPreview}
                    </p>
                  </div>

                  <div className="flex gap-2 max-[360px]:flex-col">
                    <button
                      onClick={copyReferralLink}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70 ${
                        copied
                          ? 'border-success-500/40 bg-success-500/20 text-success-300'
                          : 'border-dark-600 bg-dark-800 text-dark-200 hover:border-dark-500 hover:bg-dark-700'
                      }`}
                      aria-label={copied ? t('lite.referral.copied') : t('lite.referral.copy')}
                    >
                      {copied ? <CopyCheckIcon /> : <CopyIcon />}
                      {copied ? t('lite.referral.copied') : t('lite.referral.copy')}
                    </button>
                    <button
                      onClick={shareReferralLink}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-accent-400/60 bg-accent-500 py-2 text-xs font-semibold text-white transition-all hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70"
                      aria-label={t('lite.referral.share')}
                    >
                      <ShareIcon />
                      {t('lite.referral.share')}
                    </button>
                  </div>
                </motion.div>
              )}
            </section>
          </div>
        </div>
      </PullToRefresh>

      {/* Onboarding */}
      {showOnboarding && (
        <Onboarding
          steps={onboardingSteps}
          translationPrefix="onboarding.lite"
          skipMissingTargets
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )}
    </>
  );
}
