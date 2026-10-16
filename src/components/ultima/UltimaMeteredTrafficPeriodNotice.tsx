import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import type { Subscription } from '@/types';

type UltimaMeteredTrafficPeriodNoticeProps = {
  subscription?: Subscription | null;
  variant?: 'period' | 'topUp';
  className?: string;
};

const DEFAULT_TIMEZONE = 'Europe/Moscow';

export function UltimaMeteredTrafficPeriodNotice({
  subscription,
  variant = 'period',
  className,
}: UltimaMeteredTrafficPeriodNoticeProps) {
  const { t, i18n } = useTranslation();
  if (
    !subscription?.metered_traffic_enabled ||
    subscription.traffic_reset_mode !== 'MONTH' ||
    subscription.traffic_limit_gb <= 0
  ) {
    return null;
  }

  const language = i18n.resolvedLanguage || i18n.language || 'ru';
  const resetDate = subscription.metered_traffic_reset_at
    ? new Date(subscription.metered_traffic_reset_at)
    : null;
  let timeZone = subscription.metered_traffic_reset_timezone || DEFAULT_TIMEZONE;
  let dateFormatter: Intl.DateTimeFormat;
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  };
  try {
    dateFormatter = new Intl.DateTimeFormat(language, { ...dateOptions, timeZone });
  } catch {
    timeZone = DEFAULT_TIMEZONE;
    dateFormatter = new Intl.DateTimeFormat(language, { ...dateOptions, timeZone });
  }
  const dateLabel =
    resetDate && Number.isFinite(resetDate.getTime())
      ? `${dateFormatter.format(resetDate)} (${timeZone === DEFAULT_TIMEZONE ? t('ultima.meteredPeriod.moscowTime') : timeZone})`
      : null;
  const baseLimit = subscription.metered_traffic_base_limit_gb;
  const baseLimitLabel =
    typeof baseLimit === 'number' && Number.isFinite(baseLimit) && baseLimit > 0
      ? t('ultima.meteredPeriod.baseQuota', {
          value: new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(baseLimit),
        })
      : null;

  const nextReset = dateLabel ? (
    <>
      {t('ultima.meteredPeriod.nextReset')}{' '}
      <time dateTime={resetDate!.toISOString()} data-timezone={timeZone}>
        {dateLabel}
      </time>
    </>
  ) : (
    t('ultima.meteredPeriod.dateUnavailable')
  );

  if (variant === 'topUp') {
    return (
      <div
        data-testid="ultima-metered-topup-policy"
        className={cn('min-w-0 space-y-1 text-[13px] leading-relaxed text-white/[0.72]', className)}
      >
        <p>{t('ultima.meteredPeriod.topUpPolicy', { days: 30 })}</p>
        <p>{nextReset}</p>
      </div>
    );
  }

  return (
    <div
      data-testid="ultima-metered-period-notice"
      className={cn('min-w-0 space-y-1.5 text-[13px] leading-relaxed text-white/[0.72]', className)}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-white/[0.78]">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="font-medium">{t('ultima.meteredPeriod.title')}</span>
        {baseLimitLabel ? <span>{baseLimitLabel}</span> : null}
      </div>
      <p className="text-[14px] font-medium text-white/[0.92]">{nextReset}</p>
      <p>{t('ultima.meteredPeriod.anniversary')}</p>
      <p className={subscription.metered_access_blocked ? 'text-amber-100/[0.85]' : undefined}>
        {t(
          subscription.metered_access_blocked
            ? 'ultima.meteredPeriod.blockedPolicy'
            : 'ultima.meteredPeriod.accessPolicy',
        )}
      </p>
    </div>
  );
}
