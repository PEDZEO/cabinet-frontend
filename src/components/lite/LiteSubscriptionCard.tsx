import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHapticFeedback } from '@/platform/hooks/useHaptic';
import type { Subscription } from '@/types';

interface LiteSubscriptionCardProps {
  subscription: Subscription;
  deviceLimit?: number; // Override device limit from tariff settings
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

export function LiteSubscriptionCard({ subscription, deviceLimit }: LiteSubscriptionCardProps) {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();
  const [copied, setCopied] = useState(false);
  const isUnlimitedTraffic = subscription.traffic_limit_gb <= 0;

  const copySubscriptionLink = () => {
    if (subscription.subscription_url && !subscription.hide_subscription_link) {
      navigator.clipboard.writeText(subscription.subscription_url);
      setCopied(true);
      haptic.success();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusMeta = () => {
    if (subscription.is_trial) {
      return {
        label: t('lite.subscriptionTrial'),
        classes: 'bg-warning-500/15 border-warning-500/30 text-warning-400',
      };
    }
    if (subscription.is_expired) {
      return {
        label: t('lite.subscriptionExpired'),
        classes: 'bg-error-500/15 border-error-500/30 text-error-400',
      };
    }
    if (subscription.is_active) {
      return {
        label: t('lite.subscriptionActive'),
        classes: 'bg-success-500/15 border-success-500/30 text-success-400',
      };
    }
    return {
      label: t('common.error'),
      classes: 'bg-dark-700/40 border-dark-600 text-dark-400',
    };
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

  const trafficDisplay = isUnlimitedTraffic
    ? `${subscription.traffic_used_gb.toFixed(1)} / ∞ GB`
    : `${subscription.traffic_used_gb.toFixed(1)} / ${subscription.traffic_limit_gb} GB`;

  // VPN status indicator - active means connected/online
  const isOnline = subscription.is_active && !subscription.is_expired;
  const showCopyButton = subscription.subscription_url && !subscription.hide_subscription_link;
  const statusMeta = getStatusMeta();
  const usedPercent = Math.min(subscription.traffic_used_percent, 100);
  const progressBarClass =
    usedPercent >= 90 ? 'bg-error-500' : usedPercent >= 70 ? 'bg-warning-500' : 'bg-accent-500';

  return (
    <div className="rounded-2xl border border-dark-600/90 bg-gradient-to-br from-dark-800/95 via-dark-850/90 to-dark-900/95 p-4 shadow-lg shadow-black/15">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-dark-300">
            <div className="relative flex items-center">
              <div
                className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-success-400' : 'bg-dark-500'}`}
              />
              {isOnline && (
                <div className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-success-400 opacity-75" />
              )}
            </div>
            <span className="font-medium uppercase tracking-[0.06em]">{t('nav.subscription')}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.classes}`}
            >
              {statusMeta.label}
            </span>
            {subscription.tariff_name && (
              <span className="max-w-full truncate rounded-full border border-accent-500/25 bg-accent-500/10 px-2.5 py-1 text-xs font-medium text-accent-300">
                {subscription.tariff_name}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 max-[360px]:flex-col max-[360px]:items-end">
          {showCopyButton && (
            <button
              onClick={copySubscriptionLink}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70 ${
                copied
                  ? 'bg-success-500/20 text-success-400'
                  : 'bg-dark-700 text-dark-400 hover:bg-dark-600 hover:text-dark-200'
              }`}
              title={t('lite.copyLink')}
              aria-label={t('lite.copyLink')}
            >
              {copied ? <CopyCheckIcon /> : <CopyIcon />}
            </button>
          )}
          {getTimeLeft() && (
            <div className="max-w-[120px] rounded-lg border border-dark-500/90 bg-dark-700/70 px-2.5 py-1 text-xs font-semibold text-dark-50">
              {getTimeLeft()}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
        <div className="rounded-xl border border-dark-700/60 bg-dark-800/40 px-3 py-2">
          <div className="text-2xs uppercase tracking-[0.04em] text-dark-400">
            {t('lite.tab.traffic')}
          </div>
          <div className="mt-1 break-words text-xs font-semibold tabular-nums text-dark-100">
            {trafficDisplay}
          </div>
        </div>
        <div className="rounded-xl border border-dark-700/60 bg-dark-800/40 px-3 py-2">
          <div className="text-2xs uppercase tracking-[0.04em] text-dark-400">
            {t('lite.devices')}
          </div>
          <div className="mt-1 text-xs font-semibold tabular-nums text-dark-100">
            {deviceLimit ?? subscription.device_limit}
          </div>
        </div>
      </div>

      {!isUnlimitedTraffic && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-2xs text-dark-400">
            <span>{t('lite.trafficUsage')}</span>
            <span className="font-semibold tabular-nums text-dark-200">
              {usedPercent.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-dark-700/80">
            <div
              className={`h-full rounded-full transition-all ${progressBarClass}`}
              style={{ width: `${usedPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
