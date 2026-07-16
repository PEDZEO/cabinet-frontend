import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

type UltimaTrafficWarningCardProps = {
  usedGb: number;
  limitGb: number;
  remainingGb?: number | null;
  percent: number;
  isExhausted?: boolean;
  isMetered?: boolean;
  isTrial?: boolean;
  serverLabel?: string | null;
  variant?: 'mobile' | 'desktop';
  className?: string;
  onAction: () => void;
};

export function UltimaTrafficWarningCard({
  usedGb,
  limitGb,
  remainingGb,
  percent,
  isExhausted = false,
  isMetered = false,
  isTrial = false,
  serverLabel,
  variant = 'mobile',
  className,
  onAction,
}: UltimaTrafficWarningCardProps) {
  const { t, i18n } = useTranslation();
  const normalizedPercent = Math.max(0, Math.min(100, Math.round(percent)));
  const normalizedRemaining = Math.max(
    0,
    typeof remainingGb === 'number' ? remainingGb : limitGb - usedGb,
  );
  const numberFormatter = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 1,
  });
  const formattedRemaining = numberFormatter.format(normalizedRemaining);
  const formattedLimit = numberFormatter.format(Math.max(0, limitGb));
  const resolvedServerLabel =
    serverLabel ||
    t('ultima.meteredTraffic.defaultLabel', {
      defaultValue: 'Special servers',
    });

  const title = isTrial
    ? t('ultima.trafficWarning.trialTitle', { defaultValue: 'Trial traffic is running low' })
    : isExhausted
      ? t('ultima.trafficWarning.exhaustedTitle', { defaultValue: 'Traffic has run out' })
      : t('ultima.trafficWarning.title', { defaultValue: 'Traffic is running low' });

  const description = isMetered
    ? isExhausted
      ? t('ultima.trafficWarning.meteredExhaustedDescription', {
          server: resolvedServerLabel,
          defaultValue: `${resolvedServerLabel} are temporarily unavailable. Unlimited servers continue to work.`,
        })
      : t('ultima.trafficWarning.meteredDescription', {
          remaining: formattedRemaining,
          server: resolvedServerLabel,
          defaultValue: `${formattedRemaining} GB remain for ${resolvedServerLabel}. Other servers remain unlimited.`,
        })
    : t('ultima.trafficWarning.description', {
        remaining: formattedRemaining,
        limit: formattedLimit,
        defaultValue: `${formattedRemaining} GB of ${formattedLimit} GB remain.`,
      });

  return (
    <section
      role="status"
      aria-live="polite"
      data-testid="ultima-traffic-warning"
      className={cn(
        'overflow-hidden rounded-[18px] border border-amber-200/[0.24] bg-[linear-gradient(135deg,rgba(120,76,12,0.34),rgba(18,35,38,0.7))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(5,14,20,0.2)] backdrop-blur-md',
        variant === 'desktop' ? 'p-4 xl:p-5' : 'p-3.5',
        className,
      )}
    >
      <div className={cn('flex gap-3', variant === 'desktop' ? 'items-center' : 'flex-col')}>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-amber-100/[0.2] bg-amber-300/[0.12] text-amber-100">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="text-[15px] font-semibold leading-tight text-amber-50">{title}</h2>
              <span className="rounded-full border border-amber-100/[0.16] bg-amber-200/[0.1] px-2 py-0.5 text-[10px] font-semibold text-amber-50/90">
                {normalizedPercent}%
              </span>
            </div>
            <p className="mt-1 text-[12px] leading-snug text-white/[0.72]">{description}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.2]">
              <span
                className="block h-full rounded-full bg-amber-300 transition-[width] duration-300"
                style={{ width: `${normalizedPercent}%` }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onAction}
          data-testid="ultima-traffic-warning-action"
          className={cn(
            'ultima-btn-pill ultima-btn-primary flex min-h-10 shrink-0 items-center justify-center gap-2 px-4 text-[13px]',
            variant === 'mobile' && 'w-full',
          )}
        >
          <span>
            {isTrial
              ? t('ultima.trafficWarning.buySubscription', {
                  defaultValue: 'Buy subscription',
                })
              : t('ultima.trafficWarning.buyTraffic', { defaultValue: 'Buy traffic' })}
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
