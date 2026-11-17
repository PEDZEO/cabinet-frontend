import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { ActiveDiscount, PromoOffer } from '@/api/promo';
import type { UltimaNextActionKind } from '@/features/ultima/nextAction';
import type { Subscription } from '@/types';
import { UltimaMeteredTrafficPeriodNotice } from '../UltimaMeteredTrafficPeriodNotice';
import { UltimaDesktopWorkspace } from './UltimaDesktopWorkspace';

export type UltimaDashboardStatusTone = 'active' | 'trial' | 'warning' | 'expired';

type UltimaDesktopDashboardProps = {
  heroButton: ReactNode;
  referralCta?: ReactNode;
  devicesCta?: ReactNode;
  accountCta?: ReactNode;
  trafficWarning?: ReactNode;
  pendingPayment?: ReactNode;
  subscription: Subscription | null;
  connectedDevicesCount: number;
  isDevicesLoading: boolean;
  expiryLabel: string;
  statusLabel: string;
  statusTone: UltimaDashboardStatusTone;
  daysLeft: number | null;
  connectionStep: 1 | 2 | 3;
  isConnectionCompleted: boolean;
  primaryActionKind: UltimaNextActionKind;
  primaryCtaLabel: string;
  primaryCtaMeta: string;
  promoMessage: string | null;
  activeDiscount?: ActiveDiscount;
  firstPromoOffer: PromoOffer | null;
  showTrialSetupCard: boolean;
  trialGuide: ReactNode | null;
  showConnectionCtaHighlight: boolean;
  onPrimaryAction: () => void;
  onBuySubscription: () => void;
  onOpenConnection: () => void;
  onOpenTraffic: () => void;
  onOpenSupport: () => void;
  onActivateOffer: (() => void) | null;
  isActivatingOffer: boolean;
  bottomNav: ReactNode;
};

export function UltimaDesktopDashboardSkeleton({ bottomNav }: { bottomNav: ReactNode }) {
  return (
    <UltimaDesktopWorkspace bottomNav={bottomNav}>
      <div className="ultima-web-loading" role="status">
        Загружаем вашу подписку…
      </div>
    </UltimaDesktopWorkspace>
  );
}

export function UltimaDesktopDashboard({
  subscription,
  connectedDevicesCount,
  isDevicesLoading,
  expiryLabel,
  statusLabel,
  statusTone,
  daysLeft,
  isConnectionCompleted,
  primaryActionKind,
  primaryCtaLabel,
  primaryCtaMeta,
  trafficWarning,
  pendingPayment,
  promoMessage,
  activeDiscount,
  firstPromoOffer,
  showTrialSetupCard,
  trialGuide,
  onPrimaryAction,
  onBuySubscription,
  onOpenConnection,
  onOpenTraffic,
  onOpenSupport,
  onActivateOffer,
  isActivatingOffer,
  bottomNav,
}: UltimaDesktopDashboardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const format = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 });
  const limit = Math.max(0, subscription?.traffic_limit_gb ?? 0);
  const used = Math.max(0, subscription?.traffic_used_gb ?? 0);
  const remaining = Math.max(0, subscription?.metered_traffic_remaining_gb ?? limit - used);
  const percent = Math.max(0, Math.min(100, subscription?.traffic_used_percent ?? 0));
  const metered = subscription?.metered_traffic_enabled === true;
  const blocked = subscription?.metered_access_blocked === true;
  const planName =
    subscription?.tariff_name ||
    (subscription?.is_trial ? t('subscription.trialStatus') : t('subscription.infoTitle'));
  const discount = activeDiscount?.is_active
    ? activeDiscount.discount_percent
    : firstPromoOffer?.discount_percent;
  return (
    <UltimaDesktopWorkspace bottomNav={bottomNav}>
      <div className="ultima-web-home" data-testid="ultima-home-desktop">
        <header className="ultima-web-page-heading">
          <h1>{t('ultima.web.overview', { defaultValue: 'Обзор' })}</h1>
          <p>
            {t('ultima.web.overviewHint', {
              defaultValue: 'Ваша подписка, подключение и доступный трафик.',
            })}
          </p>
        </header>
        {pendingPayment ? <div className="ultima-web-pending-payment">{pendingPayment}</div> : null}
        <section className="ultima-web-subscription">
          <div className="ultima-web-subscription-heading">
            <div>
              <span className={`ultima-web-status is-${statusTone}`}>{statusLabel}</span>
              <h2>{planName}</h2>
              <p>{expiryLabel}</p>
            </div>
            <div className="ultima-web-actions">
              <button
                type="button"
                className="ultima-btn-pill ultima-btn-primary"
                onClick={onPrimaryAction}
              >
                {primaryCtaLabel}
                {primaryCtaMeta ? (
                  <span className="ultima-web-action-meta">{primaryCtaMeta}</span>
                ) : null}
              </button>
              <button
                type="button"
                className="ultima-btn-pill ultima-btn-secondary"
                onClick={primaryActionKind === 'setup' ? onBuySubscription : onOpenConnection}
              >
                {primaryActionKind === 'setup'
                  ? t('subscription.renew', { defaultValue: 'Продлить' })
                  : t('nav.connection', { defaultValue: 'Подключение' })}
              </button>
            </div>
          </div>
          <dl className="ultima-web-facts">
            <div>
              <dt>{t('ultima.web.timeLeft', { defaultValue: 'Осталось времени' })}</dt>
              <dd>
                {daysLeft === null
                  ? '—'
                  : t('ultima.desktop.daysLeftShort', {
                      count: Math.max(0, daysLeft),
                      defaultValue: '{{count}} дней',
                    })}
              </dd>
            </div>
            <div>
              <dt>{t('nav.subscription', { defaultValue: 'Подписка' })}</dt>
              <dd>
                <button
                  type="button"
                  className="ultima-web-text-link"
                  onClick={() => navigate('/ultima/subscription-info')}
                >
                  {t('ultima.web.manageSubscription', { defaultValue: 'Условия и управление' })}
                </button>
              </dd>
            </div>
            <div>
              <dt>{t('lite.devicesTotal', { defaultValue: 'Устройства' })}</dt>
              <dd>
                <span aria-busy={isDevicesLoading}>
                  {isDevicesLoading
                    ? '…'
                    : `${connectedDevicesCount} / ${subscription?.device_limit ?? 0}`}
                </span>
                <button
                  type="button"
                  className="ultima-web-text-link"
                  onClick={() => navigate('/ultima/devices')}
                >
                  {t('common.manage', { defaultValue: 'Управлять' })}
                </button>
              </dd>
            </div>
          </dl>
          {promoMessage ? (
            <p className="ultima-web-notice" role="status">
              {promoMessage}
            </p>
          ) : null}
          {showTrialSetupCard && trialGuide ? (
            <div className="ultima-web-onboarding">{trialGuide}</div>
          ) : null}
        </section>
        {subscription ? (
          <section className="ultima-web-traffic" data-testid="ultima-home-usage">
            <div className="ultima-web-section-heading">
              <h2>{t('ultima.home.trafficTitle', { defaultValue: 'Трафик' })}</h2>
              {metered && limit > 0 ? (
                <button type="button" className="ultima-web-text-link" onClick={onOpenTraffic}>
                  {t('ultima.home.buySpecialTraffic', {
                    defaultValue: 'Докупить трафик для спецсерверов',
                  })}
                </button>
              ) : null}
            </div>
            {metered && subscription.standard_traffic_unlimited !== false ? (
              <div className="ultima-web-traffic-row" data-testid="ultima-home-desktop-unlimited">
                <div>
                  <h3>{t('ultima.home.standardServers', { defaultValue: 'Обычные серверы' })}</h3>
                  <p>
                    {t('ultima.home.standardServersHint', {
                      defaultValue: 'Работают без ограничений и не расходуют пакет.',
                    })}
                  </p>
                </div>
                <strong>{t('subscription.unlimited', { defaultValue: 'Безлимит' })}</strong>
              </div>
            ) : null}
            <div className="ultima-web-traffic-row">
              <div>
                <h3>
                  {metered
                    ? subscription.metered_server_label ||
                      t('ultima.home.specialServers', { defaultValue: 'Спецсерверы' })
                    : t('subscription.traffic')}
                </h3>
                <p>
                  {limit > 0
                    ? t('ultima.home.trafficUsedValue', {
                        used: format.format(used),
                        limit: format.format(limit),
                        defaultValue: 'Использовано {{used}} из {{limit}} ГБ',
                      })
                    : t('subscription.unlimited')}
                </p>
              </div>
              <strong>
                {limit > 0
                  ? `${format.format(remaining)} ${t('common.units.gb')}`
                  : t('subscription.unlimited')}
                <small>
                  {limit > 0 ? t('ultima.web.remaining', { defaultValue: 'осталось' }) : ''}
                </small>
              </strong>
            </div>
            {limit > 0 ? (
              <div
                className="ultima-web-traffic-meter"
                role="progressbar"
                aria-label={t('subscription.traffic')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(percent)}
              >
                <span style={{ width: `${percent}%` }} />
              </div>
            ) : null}
            {metered && subscription.traffic_reset_mode === 'MONTH' ? (
              <UltimaMeteredTrafficPeriodNotice
                subscription={subscription}
                className="ultima-web-traffic-policy"
              />
            ) : metered && blocked ? (
              <p className="ultima-web-notice">
                {t('ultima.home.specialTrafficBlockedHint', {
                  defaultValue:
                    'Спецсерверы временно недоступны. Обычные серверы продолжают работать безлимитно.',
                })}
              </p>
            ) : null}
          </section>
        ) : null}
        {discount ? (
          <section className="ultima-web-inline-offer">
            <div>
              <h2>
                {t('promo.offers.discountActiveTitle', {
                  percent: discount,
                  defaultValue: 'Скидка {{percent}}%',
                })}
              </h2>
              <p>
                {t('promo.offers.activateDiscountHint', {
                  defaultValue: 'Активируйте предложение перед оплатой.',
                })}
              </p>
            </div>
            {onActivateOffer && firstPromoOffer ? (
              <button
                type="button"
                className="ultima-btn-pill ultima-btn-secondary"
                onClick={onActivateOffer}
                disabled={isActivatingOffer}
              >
                {t('promo.activate')}
              </button>
            ) : (
              <button type="button" className="ultima-web-text-link" onClick={onBuySubscription}>
                {t('promo.useNow')}
              </button>
            )}
          </section>
        ) : null}
        <section className="ultima-web-help-row">
          <div>
            <h2>
              {isConnectionCompleted
                ? t('ultima.web.needHelp', { defaultValue: 'Нужна помощь?' })
                : t('ultima.web.firstConnection', { defaultValue: 'Подключаетесь впервые?' })}
            </h2>
            <p>
              {isConnectionCompleted
                ? t('ultima.web.helpHint', {
                    defaultValue: 'Ответы на вопросы и ваши обращения — в разделе поддержки.',
                  })
                : t('ultima.web.firstConnectionHint', {
                    defaultValue: 'Выберите устройство и пройдите пошаговую настройку.',
                  })}
            </p>
          </div>
          {trafficWarning ? <div className="ultima-web-traffic-alert">{trafficWarning}</div> : null}
          <button
            type="button"
            className="ultima-web-text-link"
            onClick={isConnectionCompleted ? onOpenSupport : onOpenConnection}
          >
            {isConnectionCompleted
              ? t('nav.support')
              : t('ultima.web.openGuide', { defaultValue: 'Открыть инструкцию' })}
          </button>
        </section>
      </div>
    </UltimaDesktopWorkspace>
  );
}
