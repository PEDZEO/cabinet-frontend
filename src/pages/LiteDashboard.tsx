import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '@/api/subscription';
import { balanceApi } from '@/api/balance';
import { useAuthStore } from '@/store/auth';
import { LiteActionButton } from '@/components/lite/LiteActionButton';
import { LiteSubscriptionCard } from '@/components/lite/LiteSubscriptionCard';
import { LiteTrialCard } from '@/components/lite/LiteTrialCard';

// Icons
const ConnectIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const WalletIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const TariffIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

export function LiteDashboard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthStore();
  const [trialError, setTrialError] = useState<string | null>(null);

  // Queries
  const { data: subscriptionResponse, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getSubscription,
    refetchOnMount: 'always',
  });

  const { data: trialInfo } = useQuery({
    queryKey: ['trial-info'],
    queryFn: subscriptionApi.getTrialInfo,
    enabled: !subscriptionResponse?.has_subscription,
  });

  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
  });

  // Mutations
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

  const subscription = subscriptionResponse?.subscription ?? null;
  const hasNoSubscription = subscriptionResponse?.has_subscription === false && !subLoading;
  const showTrial = hasNoSubscription && trialInfo?.is_available;
  const balance = balanceData?.balance_kopeks ?? 0;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-md flex-col px-4 py-6">
      {/* Subscription status or Trial card */}
      <div className="mb-6">
        {subscription && <LiteSubscriptionCard subscription={subscription} />}

        {showTrial && trialInfo && (
          <LiteTrialCard
            trialInfo={trialInfo}
            balance={balance}
            onActivate={() => activateTrialMutation.mutate()}
            isLoading={activateTrialMutation.isPending}
            error={trialError}
          />
        )}

        {hasNoSubscription && !showTrial && (
          <div className="rounded-2xl border border-dark-600 bg-dark-800/80 p-4 text-center">
            <p className="text-dark-300">{t('lite.noSubscription')}</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-1 flex-col justify-center gap-4">
        <LiteActionButton
          to="/connection"
          label={t('lite.connect')}
          icon={<ConnectIcon />}
          variant="primary"
        />

        <LiteActionButton to="/balance" label={t('lite.topUp')} icon={<WalletIcon />} />

        <LiteActionButton to="/subscription" label={t('lite.tariffs')} icon={<TariffIcon />} />
      </div>
    </div>
  );
}
