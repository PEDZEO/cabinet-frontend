import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, CalendarDays, Layers3, Smartphone, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { UltimaDeviceStepper } from '@/components/ultima/UltimaDeviceStepper';
import {
  UltimaSubscriptionPeriodGrid,
  type UltimaSubscriptionPeriodOption,
} from '@/components/ultima/UltimaSubscriptionConfigurator';
import {
  ultimaAccentSurfaceStyle,
  ultimaCardClassName,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';
import { cn } from '@/lib/utils';
import { UltimaDesktopRail, UltimaDesktopTopbar } from './UltimaDesktopWorkspace';

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
  extraDeviceChargeLabel?: string | null;
  deviceTrafficLabel?: string | null;
  legacyDeviceNotice?: string | null;
  onReduceDevices?: (() => void) | null;
  totalPriceLabel: string;
  balanceAppliedLabel: string;
  payablePriceLabel: string;
  hasBalanceApplied: boolean;
  requiresTopUp: boolean;
  isFree: boolean;
  actionLabel: string;
  actionPriceLabel: string;
  actionMetaLabel: string;
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

const defaultCardStyle: CSSProperties = ultimaSurfaceStyle;
const accentCardStyle: CSSProperties = ultimaAccentSurfaceStyle;

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
  extraDeviceChargeLabel,
  deviceTrafficLabel,
  legacyDeviceNotice,
  onReduceDevices,
  totalPriceLabel,
  balanceAppliedLabel,
  payablePriceLabel,
  hasBalanceApplied,
  requiresTopUp,
  isFree,
  actionLabel,
  actionPriceLabel,
  actionMetaLabel,
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
    <div className="ultima-shell-inner ultima-desktop-workspace">
      <UltimaDesktopRail bottomNav={bottomNav} />
      <div className="ultima-desktop-stage">
        <UltimaDesktopTopbar />
        <div className="ultima-desktop-stage-body has-context">
          <main className="ultima-desktop-main">
            <div className="space-y-4">
              {planSelector}

              <section
                className={cn(ultimaCardClassName, 'p-5 xl:p-6')}
                style={accentCardStyle}
                data-testid="ultima-desktop-subscription-configurator"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0 max-w-[60ch]">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase text-white/[0.46]">
                      <Layers3 className="h-4 w-4 text-emerald-200/[0.8]" />
                      {t('ultima.subscriptionBuilder.pageTitle')}
                    </div>
                    <div className="mt-3 flex min-w-0 items-center gap-3">
                      <h1 className="min-w-0 truncate text-[32px] font-semibold leading-none text-white xl:text-[36px]">
                        {title}
                      </h1>
                      {isCurrentTariff ? (
                        <span className="shrink-0 rounded-full border border-emerald-200/[0.25] bg-emerald-300/[0.1] px-2.5 py-1 text-[10px] font-semibold text-emerald-50">
                          {t('subscription.currentTariff')}
                        </span>
                      ) : null}
                    </div>
                    {subtitle ? (
                      <p className="mt-2 line-clamp-2 text-[13px] leading-[1.5] text-white/[0.62]">
                        {subtitle}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid min-w-[310px] grid-cols-2 divide-x divide-white/[0.1] rounded-[8px] border border-white/[0.1] bg-black/[0.14] px-4 py-3">
                    <div className="pr-4">
                      <div className="text-[10px] uppercase text-white/[0.38]">
                        {t('ultima.subscriptionBuilder.traffic')}
                      </div>
                      <div
                        className="mt-1 truncate text-[16px] font-semibold text-white"
                        title={trafficLabel}
                      >
                        {trafficLabel}
                      </div>
                    </div>
                    <div className="pl-4">
                      <div className="text-[10px] uppercase text-white/[0.38]">
                        {t('ultima.subscriptionBuilder.baseDevices')}
                      </div>
                      <div className="mt-1 text-[16px] font-semibold text-white">
                        {t('subscription.devices', { count: baseDeviceLimit })}
                      </div>
                    </div>
                  </div>
                </div>

                {isTariffSwitchFlow ? (
                  <div className="mt-5 flex items-center justify-between gap-5 border-t border-white/[0.1] pt-5">
                    <div className="flex min-w-0 items-center gap-3 text-[15px]">
                      <span className="truncate text-white/[0.58]">{switchFromLabel || '—'}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-emerald-200/[0.72]" />
                      <span className="truncate font-semibold text-white">{title}</span>
                    </div>
                    {switchHint ? (
                      <p className="max-w-[48ch] text-right text-[11px] leading-[1.45] text-white/[0.48]">
                        {switchHint}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-5 flex items-center justify-between gap-5 border-t border-white/[0.1] pt-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[14px] font-semibold text-white">
                        <Smartphone className="h-4 w-4 text-white/[0.5]" />
                        {t('ultima.subscriptionBuilder.deviceLimit')}
                      </div>
                      <p className="mt-1 text-[11px] text-white/[0.44]">
                        {t('ultima.subscriptionBuilder.deviceHint', { max: maxDeviceLimit })}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                        {extraDeviceChargeLabel ? (
                          <span className="text-amber-100/[0.8]">{extraDeviceChargeLabel}</span>
                        ) : null}
                        {deviceTrafficLabel ? (
                          <span className="text-emerald-100/[0.72]">{deviceTrafficLabel}</span>
                        ) : null}
                      </div>
                    </div>
                    <UltimaDeviceStepper
                      value={selectedDeviceLimit}
                      canDecrease={canDecreaseDevices}
                      canIncrease={canIncreaseDevices}
                      onDecrease={() => onSelectDevice(selectedDeviceLimit - 1)}
                      onIncrease={() => onSelectDevice(selectedDeviceLimit + 1)}
                      testIdPrefix="ultima-desktop"
                      variant="desktop"
                    />
                  </div>
                )}

                {legacyDeviceNotice ? (
                  <div className="mt-4 flex items-center justify-between gap-4 rounded-[8px] border border-amber-200/[0.16] bg-amber-300/[0.06] px-3 py-2 text-[11px] leading-[1.4] text-amber-50/[0.78]">
                    <span>{legacyDeviceNotice}</span>
                    {onReduceDevices ? (
                      <button
                        type="button"
                        onClick={onReduceDevices}
                        className="shrink-0 text-[11px] font-semibold text-amber-50 underline decoration-amber-200/[0.35] underline-offset-4"
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
                <section className={cn(ultimaCardClassName, 'p-5')} style={defaultCardStyle}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-emerald-200/[0.8]" />
                      <div>
                        <h2 className="text-[14px] font-semibold text-white">
                          {t('ultima.subscriptionBuilder.periodTitle')}
                        </h2>
                        <p className="mt-0.5 text-[10px] text-white/[0.42]">
                          {t('ultima.subscriptionBuilder.periodHint')}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-1 text-[10px] text-white/[0.64]">
                      {selectedPeriodLabel}
                    </span>
                  </div>
                  <UltimaSubscriptionPeriodGrid
                    periods={periods}
                    onSelectPeriod={onSelectPeriod}
                    testIdPrefix="ultima-desktop"
                  />
                </section>
              ) : null}

              {trafficTopUp}
            </div>
          </main>

          <aside className="ultima-desktop-context">
            <section className={cn(ultimaCardClassName, 'p-5')} style={defaultCardStyle}>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase text-white/[0.46]">
                <WalletCards className="h-4 w-4 text-emerald-200/[0.8]" />
                {t('ultima.subscriptionBuilder.orderTitle')}
              </div>
              <div className="mt-3 text-[30px] font-semibold leading-none text-white">
                {totalPriceLabel}
              </div>
              <div className="mt-1 text-[11px] text-white/[0.46]">{selectedPeriodLabel}</div>

              <div className="mt-5 divide-y divide-white/[0.08] border-y border-white/[0.08]">
                <div className="flex items-center justify-between gap-3 py-3 text-[12px]">
                  <span className="text-white/[0.52]">
                    {t('ultima.subscriptionBuilder.subscriptionCost')}
                  </span>
                  <span className="font-semibold text-white">{totalPriceLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-3 py-3 text-[12px]">
                  <span className="text-white/[0.52]">
                    {t('ultima.subscriptionBuilder.fromBalance')}
                  </span>
                  <span className="font-semibold text-white">
                    {hasBalanceApplied ? `−${balanceAppliedLabel}` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 py-3 text-[12px]">
                  <span className="text-white/[0.52]">
                    {t('ultima.subscriptionBuilder.toTopUp')}
                  </span>
                  <span className="font-semibold text-emerald-100">
                    {requiresTopUp ? payablePriceLabel : t('ultima.subscriptionBuilder.noTopUp')}
                  </span>
                </div>
              </div>

              {(awaitingPaymentCompletion || isFinalizingPending) && (
                <div className="mt-4 rounded-[8px] border border-emerald-200/[0.2] bg-emerald-300/[0.07] px-3 py-2 text-[11px] leading-[1.45] text-emerald-50/[0.82]">
                  {t('subscription.paymentPending')}
                </div>
              )}

              {error ? (
                <div className="mt-4 rounded-[8px] border border-rose-200/[0.2] bg-rose-400/[0.08] px-3 py-2 text-[11px] leading-[1.45] text-rose-100">
                  {error}
                </div>
              ) : null}

              {paymentRecoveryCard ? <div className="mt-4">{paymentRecoveryCard}</div> : null}

              <button
                type="button"
                onClick={onPay}
                disabled={isPayDisabled}
                data-testid="ultima-desktop-subscription-primary-action"
                className="ultima-btn-pill ultima-btn-primary mt-5 flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] disabled:cursor-not-allowed disabled:opacity-75"
              >
                <span className="min-w-0 flex-1 truncate font-semibold">{actionLabel}</span>
                <span className="shrink-0 text-right">
                  <span className="block font-semibold leading-none">
                    {isFree ? t('subscription.free') : actionPriceLabel}
                  </span>
                  {!isFree ? (
                    <span className="mt-1 block text-[8px] uppercase leading-none text-white/[0.62]">
                      {actionMetaLabel}
                    </span>
                  ) : null}
                </span>
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
