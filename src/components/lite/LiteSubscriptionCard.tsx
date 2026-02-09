import { useTranslation } from 'react-i18next';
import type { Subscription } from '@/types';

interface LiteSubscriptionCardProps {
  subscription: Subscription;
}

export function LiteSubscriptionCard({ subscription }: LiteSubscriptionCardProps) {
  const { t } = useTranslation();

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

  return (
    <div className="rounded-2xl border border-dark-600 bg-dark-800/80 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          {subscription.tariff_name && (
            <span className="text-sm text-dark-300">{subscription.tariff_name}</span>
          )}
        </div>
        <div className="text-right">
          {getTimeLeft() && (
            <div className="text-sm font-medium text-dark-100">{getTimeLeft()}</div>
          )}
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
