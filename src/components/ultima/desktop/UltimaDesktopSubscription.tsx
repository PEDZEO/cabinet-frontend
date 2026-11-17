import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { UltimaDeviceStepper } from '@/components/ultima/UltimaDeviceStepper';
import {
  UltimaSubscriptionPeriodGrid,
  type UltimaSubscriptionPeriodOption,
} from '@/components/ultima/UltimaSubscriptionConfigurator';
import { UltimaDesktopRail, UltimaDesktopTopbar } from './UltimaDesktopWorkspace';
import '@/styles/ultima-desktop-checkout.css';

type UltimaDesktopSubscriptionProps = {
  planSelector?: ReactNode;
  trafficTopUp?: ReactNode;
  title: string;
  subtitle: string;
  isCurrentTariff: boolean;
  isTariffSwitchFlow: boolean;
  switchFromLabel?: string | null;
  switchHint?: string | null;
  trafficLabel: string;
  baseDeviceLimit: number;
  selectedDeviceLimit: number;
  minDeviceLimit: number;
  maxDeviceLimit: number;
  periods: UltimaSubscriptionPeriodOption[];
  selectedPeriodLabel: string;
  extraDeviceSummary?: string | null;
  extraDevicePriceLabel?: string | null;
  deviceTrafficLabel?: string | null;
  legacyDeviceNotice?: string | null;
  onReduceDevices?: (() => void) | null;
  totalPriceLabel: string;
  balanceAppliedLabel: string;
  payablePriceLabel: string;
  hasBalanceApplied: boolean;
  requiresTopUp: boolean;
  actionLabel: string;
  minimumTopUpHint?: string | null;
  error: string | null;
  paymentRecoveryCard?: ReactNode;
  awaitingPaymentCompletion: boolean;
  isFinalizingPending: boolean;
  isPayDisabled: boolean;
  bottomNav: ReactNode;
  onSelectDevice: (limit: number) => void;
  onSelectPeriod: (days: number) => void;
  onPay: () => void;
};

export function UltimaDesktopSubscription({
  planSelector,
  trafficTopUp,
  title,
  subtitle,
  isCurrentTariff,
  isTariffSwitchFlow,
  switchFromLabel,
  switchHint,
  trafficLabel,
  baseDeviceLimit,
  selectedDeviceLimit,
  minDeviceLimit,
  maxDeviceLimit,
  periods,
  selectedPeriodLabel,
  extraDeviceSummary,
  extraDevicePriceLabel,
  deviceTrafficLabel,
  legacyDeviceNotice,
  onReduceDevices,
  totalPriceLabel,
  balanceAppliedLabel,
  payablePriceLabel,
  hasBalanceApplied,
  requiresTopUp,
  actionLabel,
  minimumTopUpHint,
  error,
  paymentRecoveryCard,
  awaitingPaymentCompletion,
  isFinalizingPending,
  isPayDisabled,
  bottomNav,
  onSelectDevice,
  onSelectPeriod,
  onPay,
}: UltimaDesktopSubscriptionProps) {
  const { t } = useTranslation();
  const canDecreaseDevices = selectedDeviceLimit > minDeviceLimit;
  const canIncreaseDevices = selectedDeviceLimit < maxDeviceLimit;

  return (
    <div className="ultima-shell-inner ultima-desktop-workspace ultima-web-order">
      <UltimaDesktopRail bottomNav={bottomNav} />
      <div className="ultima-desktop-stage">
        <UltimaDesktopTopbar />
        <div className="ultima-desktop-stage-body">
          <main className="ultima-desktop-main ultima-web-order-layout">
            <header className="ultima-web-order-heading">
              <h1>{t('ultima.subscriptionBuilder.pageTitle')}</h1>
            </header>

            <div className="ultima-web-order-config">
              {planSelector ? <div className="ultima-web-order-plans">{planSelector}</div> : null}

              <section
                className="ultima-web-order-section"
                data-testid="ultima-desktop-subscription-configurator"
                aria-labelledby="ultima-web-order-plan-title"
              >
                <header className="ultima-web-order-plan-heading">
                  <div>
                    <h2 id="ultima-web-order-plan-title">{title}</h2>
                    {subtitle ? <p>{subtitle}</p> : null}
                  </div>
                  {isCurrentTariff ? (
                    <span className="ultima-web-order-current">
                      {t('subscription.currentTariff')}
                    </span>
                  ) : null}
                </header>
                <dl className="ultima-web-order-facts">
                  <div>
                    <dt>{t('ultima.subscriptionBuilder.traffic')}</dt>
                    <dd>{trafficLabel}</dd>
                  </div>
                  <div>
                    <dt>{t('ultima.subscriptionBuilder.baseDevices')}</dt>
                    <dd>{t('subscription.devices', { count: baseDeviceLimit })}</dd>
                  </div>
                </dl>

                {isTariffSwitchFlow ? (
                  <div className="ultima-web-order-switch">
                    <p>
                      {switchFromLabel || '—'} <span aria-hidden="true">→</span>{' '}
                      <strong>{title}</strong>
                    </p>
                    {switchHint ? <p>{switchHint}</p> : null}
                  </div>
                ) : (
                  <div className="ultima-web-order-device-config">
                    <div className="ultima-web-order-device-row">
                      <div>
                        <h3>{t('ultima.subscriptionBuilder.deviceLimit')}</h3>
                        <p>{t('ultima.subscriptionBuilder.deviceHint', { max: maxDeviceLimit })}</p>
                      </div>
                      <UltimaDeviceStepper
                        value={selectedDeviceLimit}
                        canDecrease={canDecreaseDevices}
                        canIncrease={canIncreaseDevices}
                        onDecrease={() => onSelectDevice(selectedDeviceLimit - 1)}
                        onIncrease={() => onSelectDevice(selectedDeviceLimit + 1)}
                        testIdPrefix="ultima-desktop"
                        variant="desktop"
                        className="ultima-web-order-stepper"
                      />
                    </div>
                    {extraDeviceSummary ? (
                      <div className="ultima-web-order-device-extra">
                        <div>
                          <strong>{extraDeviceSummary}</strong>
                          {deviceTrafficLabel ? <p>{deviceTrafficLabel}</p> : null}
                        </div>
                        {extraDevicePriceLabel ? <strong>{extraDevicePriceLabel}</strong> : null}
                      </div>
                    ) : deviceTrafficLabel ? (
                      <p className="ultima-web-order-device-hint">{deviceTrafficLabel}</p>
                    ) : null}
                  </div>
                )}

                {legacyDeviceNotice ? (
                  <div className="ultima-web-order-device-notice" role="note">
                    <p>{legacyDeviceNotice}</p>
                    {onReduceDevices ? (
                      <button
                        type="button"
                        onClick={onReduceDevices}
                        className="ultima-web-order-text-action"
                      >
                        {t('subscription.manageDevices', {
                          defaultValue: 'Управление устройствами',
                        })}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </section>

              {!isTariffSwitchFlow ? (
                <section
                  className="ultima-web-order-section"
                  aria-labelledby="ultima-web-order-period-title"
                >
                  <h2 id="ultima-web-order-period-title">
                    {t('ultima.subscriptionBuilder.periodTitle')}
                  </h2>
                  <UltimaSubscriptionPeriodGrid
                    periods={periods}
                    onSelectPeriod={onSelectPeriod}
                    testIdPrefix="ultima-desktop"
                  />
                </section>
              ) : null}
            </div>

            <aside
              className="ultima-web-order-summary"
              aria-labelledby="ultima-web-order-summary-title"
            >
              <h2 id="ultima-web-order-summary-title">
                {t('ultima.subscriptionBuilder.orderTitle')}
              </h2>
              <p className="ultima-web-order-summary-plan">
                {title} <span aria-hidden="true">·</span> {selectedPeriodLabel}
              </p>

              <dl className="ultima-web-order-totals">
                <div className="ultima-web-order-total">
                  <dt>{t('ultima.subscriptionBuilder.subscriptionCost')}</dt>
                  <dd>{totalPriceLabel}</dd>
                </div>
                <div>
                  <dt>{t('ultima.subscriptionBuilder.fromBalance')}</dt>
                  <dd>{hasBalanceApplied ? `−${balanceAppliedLabel}` : '—'}</dd>
                </div>
                <div className="ultima-web-order-payable" data-top-up={requiresTopUp}>
                  <dt>{t('ultima.subscriptionBuilder.toTopUp')}</dt>
                  <dd>
                    {requiresTopUp ? payablePriceLabel : t('ultima.subscriptionBuilder.noTopUp')}
                  </dd>
                </div>
              </dl>

              {minimumTopUpHint ? (
                <p className="ultima-web-order-notice">{minimumTopUpHint}</p>
              ) : null}

              {awaitingPaymentCompletion || isFinalizingPending ? (
                <p className="ultima-web-order-notice" role="status">
                  {t('subscription.paymentPending')}
                </p>
              ) : null}

              {error ? (
                <p className="ultima-web-order-error" role="alert">
                  {error}
                </p>
              ) : null}

              {paymentRecoveryCard ? (
                <div className="ultima-web-order-recovery">{paymentRecoveryCard}</div>
              ) : null}

              <button
                type="button"
                onClick={onPay}
                disabled={isPayDisabled}
                data-testid="ultima-desktop-subscription-primary-action"
                className="ultima-btn-pill ultima-btn-primary ultima-web-order-submit"
              >
                {actionLabel}
              </button>
            </aside>

            {trafficTopUp ? <div className="ultima-web-order-extras">{trafficTopUp}</div> : null}
          </main>
        </div>
      </div>
    </div>
  );
}
