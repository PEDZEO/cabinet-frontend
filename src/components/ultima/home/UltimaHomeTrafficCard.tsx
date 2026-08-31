import { ArrowRight, Gauge, Globe2, Infinity as InfinityIcon, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

type UltimaHomeTrafficCardProps = {
  locale: string;
  limitGb: number;
  usedGb: number;
  remainingGb?: number | null;
  usedPercent: number;
  isMetered?: boolean;
  isBlocked?: boolean;
  isTrial?: boolean;
  standardUnlimited?: boolean;
  serverLabel?: string | null;
  onTopUp: () => void;
  className?: string;
};

export function UltimaHomeTrafficCard({
  locale,
  limitGb,
  usedGb,
  remainingGb,
  usedPercent,
  isMetered = false,
  isBlocked = false,
  isTrial = false,
  standardUnlimited = true,
  serverLabel,
  onTopUp,
  className,
}: UltimaHomeTrafficCardProps) {
  const { t } = useTranslation();
  const formatter = new Intl.NumberFormat(locale || 'ru', { maximumFractionDigits: 1 });
  const normalizedLimit = Math.max(0, limitGb);
  const normalizedUsed = Math.max(0, usedGb);
  const normalizedRemaining = Math.max(
    0,
    typeof remainingGb === 'number' ? remainingGb : normalizedLimit - normalizedUsed,
  );
  const normalizedPercent = Math.max(0, Math.min(100, usedPercent));
  const hasLimit = normalizedLimit > 0;
  const resolvedServerLabel =
    serverLabel || t('ultima.meteredTraffic.defaultLabel', { defaultValue: 'Спецсерверы' });
  const showStandardUnlimited = isMetered && standardUnlimited !== false;
  const progressTone = isBlocked
    ? 'bg-rose-300'
    : normalizedPercent >= 80
      ? 'bg-amber-300'
      : 'bg-[var(--ultima-color-primary)]';

  return (
    <section
      data-testid="ultima-home-traffic-card"
      className={cn(
        'overflow-hidden rounded-[20px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_30px_rgba(3,14,24,0.18)] backdrop-blur-xl',
        className,
      )}
      style={{
        borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
        background: 'color-mix(in srgb, var(--ultima-color-surface) 72%, transparent)',
      }}
    >
      <header className="flex items-start gap-3 px-4 pb-3 pt-4">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-white/[0.9]"
          style={{
            borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 22%, transparent)',
            background: 'color-mix(in srgb, var(--ultima-color-primary) 11%, transparent)',
          }}
        >
          <Gauge className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold text-white/[0.96]">
            {t('ultima.home.trafficTitle', { defaultValue: 'Трафик' })}
          </h2>
          <p className="mt-1 text-[12px] leading-snug text-white/[0.52]">
            {isMetered
              ? t('ultima.home.trafficSplitHint', {
                  defaultValue: 'Лимит действует только на спецсерверах.',
                })
              : t('ultima.home.trafficMeta', {
                  defaultValue: 'Использование за текущий период',
                })}
          </p>
        </div>
      </header>

      {showStandardUnlimited ? (
        <div
          data-testid="ultima-home-unlimited-traffic"
          className="flex min-w-0 items-start gap-3 border-t border-white/[0.07] px-4 py-3.5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.045] text-white/[0.78]">
            <Globe2 className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-semibold text-white/[0.92]">
                {t('ultima.home.standardServers', { defaultValue: 'Обычные серверы' })}
              </p>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-emerald-100/[0.94]">
                <InfinityIcon className="h-4 w-4" strokeWidth={2} />
                {t('subscription.unlimited', { defaultValue: 'Безлимит' })}
              </span>
            </div>
            <p className="mt-1 text-[12px] leading-snug text-white/[0.5]">
              {t('ultima.home.standardServersHint', {
                defaultValue: 'Работают без ограничений и не расходуют пакет.',
              })}
            </p>
          </div>
        </div>
      ) : null}

      <div data-testid="ultima-home-traffic" className="border-t border-white/[0.07] px-4 py-3.5">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              isBlocked ? 'bg-rose-300/[0.12] text-rose-100' : 'bg-white/[0.045] text-white/[0.78]',
            )}
          >
            <Server className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-white/[0.92]">
                  {isMetered
                    ? resolvedServerLabel
                    : t('subscription.traffic', { defaultValue: 'Трафик' })}
                </p>
                <p
                  className={cn(
                    'mt-1 text-[20px] font-semibold leading-none',
                    isBlocked ? 'text-rose-100' : 'text-white/[0.98]',
                  )}
                >
                  {hasLimit
                    ? t('ultima.home.trafficRemainingValue', {
                        value: formatter.format(normalizedRemaining),
                        defaultValue: '{{value}} ГБ осталось',
                      })
                    : t('subscription.unlimited', { defaultValue: 'Безлимит' })}
                </p>
              </div>
              {hasLimit ? (
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold',
                    isBlocked
                      ? 'border-rose-200/[0.2] bg-rose-300/[0.12] text-rose-100'
                      : normalizedPercent >= 80
                        ? 'border-amber-200/[0.2] bg-amber-300/[0.12] text-amber-100'
                        : 'border-white/[0.08] bg-white/[0.035] text-white/[0.64]',
                  )}
                >
                  {Math.round(normalizedPercent)}%
                </span>
              ) : null}
            </div>

            {hasLimit ? (
              <>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[0.2]">
                  <span
                    className={cn(
                      'block h-full w-full origin-left rounded-full transition-transform duration-300',
                      progressTone,
                    )}
                    style={{ transform: `scaleX(${normalizedPercent / 100})` }}
                  />
                </div>
                <p className="mt-2 text-[11px] leading-snug text-white/[0.5]">
                  {t('ultima.home.trafficUsedValue', {
                    used: formatter.format(normalizedUsed),
                    limit: formatter.format(normalizedLimit),
                    defaultValue: 'Использовано {{used}} из {{limit}} ГБ',
                  })}
                </p>
              </>
            ) : null}

            {isMetered ? (
              <p
                className={cn(
                  'mt-2 text-[12px] leading-snug',
                  isBlocked ? 'text-rose-100/[0.82]' : 'text-white/[0.64]',
                )}
              >
                {isBlocked
                  ? t('ultima.home.specialTrafficBlockedHint', {
                      defaultValue:
                        'Спецсерверы временно недоступны. Обычные серверы продолжают работать безлимитно.',
                    })
                  : t('ultima.home.specialServersHint', {
                      server: resolvedServerLabel,
                      defaultValue:
                        'Пакет расходуется только при подключении к серверам с меткой «{{server}}».',
                    })}
              </p>
            ) : null}
          </div>
        </div>

        {hasLimit ? (
          <button
            type="button"
            onClick={onTopUp}
            data-testid="ultima-home-traffic-topup"
            className="ultima-btn-pill ultima-btn-secondary mt-3 flex min-h-10 w-full items-center justify-between gap-3 px-4 text-left text-[12px]"
          >
            <span>
              {isTrial
                ? t('ultima.chooseTariff', { defaultValue: 'Выбрать тариф' })
                : isMetered
                  ? t('ultima.home.buySpecialTraffic', {
                      defaultValue: 'Докупить трафик для спецсерверов',
                    })
                  : t('ultima.trafficWarning.buyTraffic', { defaultValue: 'Докупить трафик' })}
            </span>
            <ArrowRight className="h-4 w-4" strokeWidth={1.9} />
          </button>
        ) : null}
      </div>
    </section>
  );
}
