import { ArrowUpRight, Zap } from 'lucide-react';
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
  onDetails: () => void;
  onTopUp?: () => void;
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
  onDetails,
  onTopUp,
}: UltimaHomeTrafficCardProps) {
  const { t } = useTranslation();
  const formatter = new Intl.NumberFormat(locale || 'ru', { maximumFractionDigits: 1 });
  const hasLimit = limitGb > 0;
  const used = Math.max(0, usedGb);
  const remaining = hasLimit ? Math.min(limitGb, Math.max(0, remainingGb ?? limitGb - used)) : 0;
  const resolvedServerLabel =
    serverLabel || t('ultima.meteredTraffic.defaultLabel', { defaultValue: 'Спецсерверы' });
  const trafficLabel = isMetered
    ? resolvedServerLabel
    : t('subscription.traffic', { defaultValue: 'Трафик' });
  const remainingLabel = hasLimit
    ? t('ultima.home.trafficRemainingOfLimit', {
        defaultValue: 'Осталось {{remaining}} из {{limit}} ГБ',
        remaining: formatter.format(remaining),
        limit: formatter.format(limitGb),
      })
    : t('subscription.unlimited', { defaultValue: 'Безлимит' });
  const topUpLabel = isTrial
    ? t('ultima.chooseTariff', { defaultValue: 'Выбрать тариф' })
    : t('ultima.trafficWarning.buyTraffic', { defaultValue: 'Докупить трафик' });

  return (
    <section className="ultima-mobile-traffic" data-testid="ultima-home-traffic-card">
      <div
        className="ultima-mobile-traffic-meter"
        data-testid="ultima-home-traffic"
        data-tone={isBlocked ? 'blocked' : usedPercent >= 80 ? 'low' : undefined}
      >
        <div className="ultima-mobile-traffic-reading">
          <div>
            <h2 className="ultima-mobile-traffic-kicker">
              <Zap size={14} strokeWidth={1.8} aria-hidden="true" />
              {trafficLabel}
            </h2>
            <strong>
              {hasLimit ? (
                <>
                  {formatter.format(remaining)} <small>{t('ultima.home.auroraGb')}</small>
                </>
              ) : (
                remainingLabel
              )}
            </strong>
          </div>
          <button
            type="button"
            onClick={onDetails}
            data-testid="ultima-home-plan-details"
            className="ultima-mobile-traffic-action"
          >
            {t('ultima.home.auroraDetails', { defaultValue: 'Детали' })}
            <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        {hasLimit ? (
          <>
            <div
              className="ultima-mobile-traffic-track"
              role="progressbar"
              aria-label={trafficLabel}
              aria-valuemin={0}
              aria-valuemax={limitGb}
              aria-valuenow={remaining}
              aria-valuetext={remainingLabel}
            >
              <span style={{ width: (remaining / limitGb) * 100 + '%' }} />
            </div>
            <div className="ultima-mobile-traffic-caption">
              <p data-testid="ultima-home-traffic-remaining" className="ultima-mobile-traffic-used">
                {remainingLabel}
              </p>
              {onTopUp ? (
                <button
                  type="button"
                  onClick={onTopUp}
                  data-testid="ultima-home-traffic-topup"
                  className="ultima-mobile-traffic-action"
                >
                  {topUpLabel}
                  <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </>
        ) : null}

        {isMetered && subscription?.traffic_reset_mode === 'MONTH' ? (
          <UltimaMeteredTrafficPeriodNotice subscription={subscription} variant="compact" />
        ) : isBlocked && isMetered ? (
          <p className="ultima-mobile-traffic-used">
            {standardUnlimited
              ? t('ultima.home.specialTrafficBlockedHint')
              : t('ultima.home.specialTrafficUnavailable', {
                  defaultValue: 'Спецсерверы временно недоступны.',
                })}
          </p>
        ) : null}
      </div>
    </section>
  );
}
