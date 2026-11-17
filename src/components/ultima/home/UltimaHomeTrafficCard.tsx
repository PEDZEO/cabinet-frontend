import { ArrowUpRight, Globe2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Subscription } from '@/types';
import { UltimaMeteredTrafficPeriodNotice } from '../UltimaMeteredTrafficPeriodNotice';

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
  subscription?: Subscription | null;
  onTopUp: () => void;
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
  subscription,
  onTopUp,
}: UltimaHomeTrafficCardProps) {
  const { t } = useTranslation();
  const formatter = new Intl.NumberFormat(locale || 'ru', { maximumFractionDigits: 1 });
  const hasLimit = limitGb > 0;
  const used = Math.max(0, usedGb);
  const remaining = Math.max(0, remainingGb ?? limitGb - used);
  const resolvedServerLabel =
    serverLabel || t('ultima.meteredTraffic.defaultLabel', { defaultValue: 'Спецсерверы' });
  const trafficLabel = isMetered
    ? resolvedServerLabel
    : t('subscription.traffic', { defaultValue: 'Трафик' });
  const remainingLabel = hasLimit
    ? t('ultima.home.trafficRemainingValue', { value: formatter.format(remaining) })
    : t('subscription.unlimited', { defaultValue: 'Безлимит' });
  const topUpLabel = isTrial
    ? t('ultima.chooseTariff', { defaultValue: 'Выбрать тариф' })
    : t('ultima.trafficWarning.buyTraffic', { defaultValue: 'Докупить трафик' });

  return (
    <section className="ultima-mobile-traffic" data-testid="ultima-home-traffic-card">
      <header className="ultima-mobile-traffic-heading">
        <h2>{t('ultima.home.trafficTitle', { defaultValue: 'Трафик' })}</h2>
        {hasLimit ? (
          <button
            type="button"
            onClick={onTopUp}
            data-testid="ultima-home-traffic-topup"
            className="ultima-mobile-traffic-action"
          >
            {topUpLabel}
            <ArrowUpRight size={17} strokeWidth={1.8} aria-hidden="true" />
          </button>
        ) : null}
      </header>

      <div
        className="ultima-mobile-traffic-meter"
        data-testid="ultima-home-traffic"
        data-tone={isBlocked ? 'blocked' : usedPercent >= 80 ? 'low' : undefined}
      >
        <div className="ultima-mobile-traffic-reading">
          {isMetered ? <p>{trafficLabel}</p> : null}
          <strong>{remainingLabel}</strong>
        </div>
        {hasLimit ? (
          <>
            <div
              className="ultima-mobile-traffic-track"
              role="progressbar"
              aria-label={trafficLabel}
              aria-valuemin={0}
              aria-valuemax={limitGb}
              aria-valuenow={Math.min(remaining, limitGb)}
              aria-valuetext={remainingLabel}
            >
              <span style={{ width: `${Math.min(1, remaining / limitGb) * 100}%` }} />
            </div>
            <p className="ultima-mobile-traffic-used">
              {t('ultima.home.trafficUsedValue', {
                used: formatter.format(used),
                limit: formatter.format(limitGb),
              })}
            </p>
          </>
        ) : null}

        {isMetered && subscription?.traffic_reset_mode === 'MONTH' ? (
          <UltimaMeteredTrafficPeriodNotice subscription={subscription} variant="compact" />
        ) : isMetered ? (
          <p className="ultima-mobile-traffic-used">
            {isBlocked
              ? t('ultima.home.specialTrafficBlockedHint')
              : t('ultima.home.specialServersHint', { server: resolvedServerLabel })}
          </p>
        ) : null}
      </div>

      {isMetered && standardUnlimited ? (
        <div className="ultima-mobile-traffic-standard" data-testid="ultima-home-unlimited-traffic">
          <Globe2 size={17} strokeWidth={1.7} aria-hidden="true" />
          <span>{t('ultima.home.standardServers', { defaultValue: 'Обычные серверы' })}</span>
          <strong>{t('subscription.unlimited', { defaultValue: 'Безлимит' })}</strong>
        </div>
      ) : null}
    </section>
  );
}
