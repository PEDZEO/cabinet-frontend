import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHapticFeedback } from '@/platform/hooks/useHaptic';
import type { Subscription } from '@/types';

interface LiteSubscriptionCardProps {
  subscription: Subscription;
}

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

export function LiteSubscriptionCard({ subscription }: LiteSubscriptionCardProps) {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();
  const [copied, setCopied] = useState(false);

  const copySubscriptionLink = () => {
    if (subscription.subscription_url && !subscription.hide_subscription_link) {
      navigator.clipboard.writeText(subscription.subscription_url);
      setCopied(true);
      haptic.success();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = () => {
    if (subscription.is_trial) {
      return (
        <span className="rounded-full bg-warning-500/20 px-3 py-1 text-sm font-medium text-warning-400">
          {t('lite.subscriptionTrial')}
        </span>
      );
    }
    if (subscription.is_expired) {
      return (
        <span className="rounded-full bg-error-500/20 px-3 py-1 text-sm font-medium text-error-400">
          {t('lite.subscriptionExpired')}
        </span>
      );
    }
    if (subscription.is_active) {
      return (
        <span className="rounded-full bg-success-500/20 px-3 py-1 text-sm font-medium text-success-400">
          {t('lite.subscriptionActive')}
        </span>
      );
    }
    return null;
  };

  const getTimeLeft = () => {
    if (subscription.days_left > 0) {
      return t('lite.daysLeft', { count: subscription.days_left });
    }
    if (subscription.hours_left > 0) {
      return t('lite.hoursLeft', { count: subscription.hours_left });
    }
    return null;
  };

  const trafficDisplay =
    subscription.traffic_limit_gb === -1
      ? t('lite.unlimited')
      : `${subscription.traffic_used_gb.toFixed(1)} / ${subscription.traffic_limit_gb} GB`;

  // VPN status indicator - active means connected/online
  const isOnline = subscription.is_active && !subscription.is_expired;
  const showCopyButton = subscription.subscription_url && !subscription.hide_subscription_link;

  return (
    <div className="rounded-2xl border border-dark-600 bg-dark-800/80 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* VPN Status indicator */}
          <div className="relative flex items-center">
            <div
              className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-success-400' : 'bg-dark-500'}`}
            />
            {isOnline && (
              <div className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-success-400 opacity-75" />
            )}
          </div>
          {getStatusBadge()}
          {subscription.tariff_name && (
            <span className="text-sm text-dark-300">{subscription.tariff_name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Quick copy button */}
          {showCopyButton && (
            <button
              onClick={copySubscriptionLink}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                copied
                  ? 'bg-success-500/20 text-success-400'
                  : 'bg-dark-700 text-dark-400 hover:bg-dark-600 hover:text-dark-200'
              }`}
              title={t('lite.copyLink')}
            >
              {copied ? <CopyCheckIcon /> : <CopyIcon />}
            </button>
          )}
          <div className="text-right">
            {getTimeLeft() && (
              <div className="text-sm font-medium text-dark-100">{getTimeLeft()}</div>
            )}
          </div>
        </div>
      </div>

      {/* Traffic progress */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs text-dark-400">
          <span>{trafficDisplay}</span>
          <span>
            {subscription.device_limit}{' '}
            {t('lite.trialDevices', { count: subscription.device_limit }).split(' ').pop()}
          </span>
        </div>
        {subscription.traffic_limit_gb !== -1 && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-dark-600">
            <div
              className="h-full rounded-full bg-accent-500 transition-all"
              style={{ width: `${Math.min(subscription.traffic_used_percent, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
