import type { ReactNode } from 'react';
import { Check, Clock3, RefreshCw, SlidersHorizontal, Smartphone, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { UltimaDeviceStepper } from '@/components/ultima/UltimaDeviceStepper';
import {
  ultimaCardClassName,
  ultimaPaneClassName,
  ultimaPaneSurfaceStyle,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';
import { cn } from '@/lib/utils';

export type UltimaSubscriptionPeriodOption = {
  days: number;
  label: string;
  priceLabel: string;
  monthlyLabel: string;
  originalPriceLabel: string | null;
  isSelected: boolean;
  isBestDeal: boolean;
};

type UltimaSubscriptionConfiguratorProps = {
  title: string;
  subtitle: string;
  isCurrentTariff: boolean;
  canChangeTariff: boolean;
  isTariffSwitchFlow: boolean;
  switchFromLabel?: string | null;
  switchHint?: string | null;
  trafficLabel: string;
  baseDeviceLimit: number;
  selectedDeviceLimit: number;
  minDeviceLimit: number;
  maxDeviceLimit: number;
  extraDeviceSummary?: string | null;
  extraDevicePriceLabel?: string | null;
  deviceTrafficLabel?: string | null;
  periods: UltimaSubscriptionPeriodOption[];
  selectedPeriodLabel: string;
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
  minimumTopUpHint?: ReactNode;
  paymentRecoveryCard?: ReactNode;
  trafficTopUp?: ReactNode;
  bottomNav: ReactNode;
  isPayDisabled: boolean;
  onChangeTariff: () => void;
  onSelectDevice: (limit: number) => void;
  onSelectPeriod: (days: number) => void;
  onPay: () => void;
};

export function UltimaSubscriptionPeriodGrid({
  periods,
  onSelectPeriod,
  testIdPrefix,
}: {
  periods: UltimaSubscriptionPeriodOption[];
  onSelectPeriod: (days: number) => void;
  testIdPrefix: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      role="radiogroup"
      aria-label={t('subscription.selectPeriod')}
      data-testid={`${testIdPrefix}-period-selector`}
      className="grid grid-cols-2 gap-2 xl:grid-cols-3"
    >
      {periods.map((period) => (
        <button
          key={period.days}
          type="button"
          role="radio"
          aria-checked={period.isSelected}
          data-testid={`${testIdPrefix}-period-${period.days}`}
          onClick={() => onSelectPeriod(period.days)}
          className={cn(
            'relative min-h-[72px] rounded-[12px] border px-3 py-2.5 text-left transition-colors lg:rounded-[8px]',
            period.isSelected
              ? 'border-emerald-200/[0.34] bg-emerald-300/[0.1]'
              : 'border-white/[0.1] bg-white/[0.035] hover:bg-white/[0.07]',
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="min-w-0 truncate text-[14px] font-semibold text-white">
              {period.label}
            </span>
            {period.isSelected ? (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-emerald-950">
                <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
              </span>
            ) : period.isBestDeal ? (
              <span className="shrink-0 rounded-full border border-emerald-200/[0.24] bg-emerald-300/[0.1] px-1.5 py-0.5 text-[9px] font-semibold text-emerald-50">
                {t('subscription.bestDeal')}
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div>
              <div className="text-[18px] font-semibold leading-none text-white">
                {period.priceLabel}
              </div>
              <div className="mt-1 text-[10px] leading-none text-white/[0.5]">
                {period.monthlyLabel}
              </div>
            </div>
            {period.originalPriceLabel ? (
              <span className="text-[10px] text-white/[0.38] line-through">
                {period.originalPriceLabel}
              </span>
            ) : null}
          </div>
        </button>
      ))}
    </div>
  );
}

export function UltimaSubscriptionConfigurator({
  title,
  subtitle,
  isCurrentTariff,
  canChangeTariff,
  isTariffSwitchFlow,
  switchFromLabel,
  switchHint,
  trafficLabel,
  baseDeviceLimit,
  selectedDeviceLimit,
  minDeviceLimit,
  maxDeviceLimit,
  extraDeviceSummary,
  extraDevicePriceLabel,
  deviceTrafficLabel,
  periods,
  selectedPeriodLabel,
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
  minimumTopUpHint,
  paymentRecoveryCard,
  trafficTopUp,
  bottomNav,
  isPayDisabled,
  onChangeTariff,
  onSelectDevice,
  onSelectPeriod,
  onPay,
}: UltimaSubscriptionConfiguratorProps) {
  const { t } = useTranslation();
  const canDecreaseDevices = selectedDeviceLimit > minDeviceLimit;
  const canIncreaseDevices = selectedDeviceLimit < maxDeviceLimit;

  return (
    <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
      <main
        className="ultima-scrollbar min-h-0 flex-1 overflow-y-auto pr-1 pt-2"
        data-testid="ultima-subscription-configurator"
      >
        <header className="mb-3">
          <div className="mb-1 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase text-white/[0.48]">
              {t('ultima.subscriptionBuilder.pageTitle')}
            </p>
            {canChangeTariff ? (
              <button
                type="button"
                onClick={onChangeTariff}
                data-testid="ultima-subscription-change-tariff"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.055] px-3 text-[11px] font-medium text-white/[0.78] transition-colors active:bg-white/[0.1]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t('ultima.subscriptionBuilder.changePlan')}
              </button>
            ) : null}
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="min-w-0 truncate text-[30px] font-semibold leading-none text-white">
              {title}
            </h1>
            {isCurrentTariff ? (
              <span className="shrink-0 rounded-full border border-emerald-200/[0.24] bg-emerald-300/[0.1] px-2 py-0.5 text-[9px] font-semibold text-emerald-50">
                {t('subscription.currentTariff')}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-1 line-clamp-2 text-[12px] leading-[1.4] text-white/[0.62]">
              {subtitle}
            </p>
          ) : null}
        </header>

        <section
          className={cn(ultimaCardClassName, 'mb-2.5 p-3')}
          style={ultimaSurfaceStyle}
          data-testid="ultima-subscription-parameters"
        >
          <div className="flex items-center gap-2 text-[12px] font-semibold text-white/[0.82]">
            <SlidersHorizontal className="h-4 w-4 text-emerald-200/[0.84]" />
            {t('ultima.subscriptionBuilder.parameters')}
          </div>

          <div className="mt-3 grid grid-cols-2 divide-x divide-white/[0.1] border-y border-white/[0.08] py-2.5">
            <div className="pr-3">
              <div className="text-[10px] uppercase text-white/[0.4]">
                {t('ultima.subscriptionBuilder.traffic')}
              </div>
              <div
                className="mt-1 truncate text-[15px] font-semibold text-white"
                title={trafficLabel}
              >
                {trafficLabel}
              </div>
            </div>
            <div className="pl-3">
              <div className="text-[10px] uppercase text-white/[0.4]">
                {t('ultima.subscriptionBuilder.baseDevices')}
              </div>
              <div className="mt-1 text-[15px] font-semibold text-white">
                {t('subscription.devices', { count: baseDeviceLimit })}
              </div>
            </div>
          </div>

          {isTariffSwitchFlow ? (
            <div className="mt-3 rounded-[12px] border border-emerald-200/[0.16] bg-emerald-300/[0.07] px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 text-[12px] text-white/[0.58]">
                  <span className="truncate">{switchFromLabel || '—'}</span>
                  <span className="mx-1.5 text-white/[0.3]">→</span>
                  <span className="font-semibold text-white">{title}</span>
                </div>
                <span className="shrink-0 text-[12px] font-semibold text-emerald-50">
                  {totalPriceLabel}
                </span>
              </div>
              {switchHint ? (
                <p className="mt-1 text-[10px] leading-[1.4] text-white/[0.5]">{switchHint}</p>
              ) : null}
            </div>
          ) : (
            <>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
                    <Smartphone className="h-4 w-4 text-white/[0.56]" />
                    {t('ultima.subscriptionBuilder.deviceLimit')}
                  </div>
                  <p className="mt-1 text-[10px] text-white/[0.44]">
                    {t('ultima.subscriptionBuilder.deviceHint', { max: maxDeviceLimit })}
                  </p>
                </div>
                <UltimaDeviceStepper
                  value={selectedDeviceLimit}
                  canDecrease={canDecreaseDevices}
                  canIncrease={canIncreaseDevices}
                  onDecrease={() => onSelectDevice(selectedDeviceLimit - 1)}
                  onIncrease={() => onSelectDevice(selectedDeviceLimit + 1)}
                  testIdPrefix="ultima-mobile"
                />
              </div>

              {extraDeviceSummary ? (
                <div
                  data-testid="ultima-mobile-extra-device-summary"
                  className="mt-2.5 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-medium text-amber-50/[0.88]">
                      {extraDeviceSummary}
                    </p>
                    {deviceTrafficLabel ? (
                      <p className="mt-0.5 truncate text-[9px] text-emerald-100/[0.7]">
                        {deviceTrafficLabel}
                      </p>
                    ) : null}
                  </div>
                  {extraDevicePriceLabel ? (
                    <span className="shrink-0 text-[12px] font-semibold text-amber-50/[0.9]">
                      {extraDevicePriceLabel}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </section>

        {!isTariffSwitchFlow ? (
          <section className={cn(ultimaCardClassName, 'mb-2.5 p-3')} style={ultimaSurfaceStyle}>
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-emerald-200/[0.84]" />
                <div>
                  <h2 className="text-[12px] font-semibold text-white/[0.82]">
                    {t('ultima.subscriptionBuilder.periodTitle')}
                  </h2>
                  <p className="mt-0.5 text-[9px] text-white/[0.4]">
                    {t('ultima.subscriptionBuilder.periodHint')}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-white/[0.1] bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/[0.66]">
                {selectedPeriodLabel}
              </span>
            </div>
            <UltimaSubscriptionPeriodGrid
              periods={periods}
              onSelectPeriod={onSelectPeriod}
              testIdPrefix="ultima-mobile"
            />
          </section>
        ) : null}

        {trafficTopUp ? <div className="mb-2.5">{trafficTopUp}</div> : null}
      </main>

      <footer className="ultima-mobile-dock-footer pt-2.5">
        {paymentRecoveryCard ? <div className="mb-2">{paymentRecoveryCard}</div> : null}
        {minimumTopUpHint ? (
          <div className="mb-2 text-center text-[11px] leading-[1.4] text-white/[0.58]">
            {minimumTopUpHint}
          </div>
        ) : null}
        {error ? (
          <div className="mb-2 rounded-[8px] border border-rose-200/[0.2] bg-rose-400/[0.08] px-3 py-2 text-center text-[11px] text-rose-100">
            {error}
          </div>
        ) : null}

        <div
          className={cn(ultimaPaneClassName, 'mb-2 px-3 py-2')}
          style={ultimaPaneSurfaceStyle}
          data-testid="ultima-subscription-price-summary"
        >
          <div className="grid grid-cols-3 divide-x divide-white/[0.08]">
            <div className="pr-2">
              <div className="text-[8px] uppercase text-white/[0.38]">
                {t('ultima.subscriptionBuilder.subscriptionCost')}
              </div>
              <div className="mt-0.5 truncate text-[12px] font-semibold text-white">
                {totalPriceLabel}
              </div>
            </div>
            <div className="px-2">
              <div className="text-[8px] uppercase text-white/[0.38]">
                {t('ultima.subscriptionBuilder.fromBalance')}
              </div>
              <div className="mt-0.5 truncate text-[12px] font-semibold text-white">
                {hasBalanceApplied ? `−${balanceAppliedLabel}` : '—'}
              </div>
            </div>
            <div className="pl-2">
              <div className="text-[8px] uppercase text-white/[0.38]">
                {t('ultima.subscriptionBuilder.toTopUp')}
              </div>
              <div className="mt-0.5 truncate text-[12px] font-semibold text-emerald-100">
                {requiresTopUp ? payablePriceLabel : t('ultima.subscriptionBuilder.noTopUp')}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onPay}
          disabled={isPayDisabled}
          data-testid="ultima-subscription-primary-action"
          className="ultima-btn-pill ultima-btn-primary flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] disabled:cursor-not-allowed disabled:opacity-75"
        >
          <WalletCards className="h-4.5 w-4.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate font-semibold">{actionLabel}</span>
          <span className="shrink-0 text-right">
            <span
              data-testid="ultima-subscription-action-price"
              className="block text-[14px] font-semibold leading-none"
            >
              {isFree ? t('subscription.free') : actionPriceLabel}
            </span>
            {!isFree ? (
              <span className="mt-1 block text-[8px] uppercase leading-none text-white/[0.64]">
                {actionMetaLabel}
              </span>
            ) : null}
          </span>
        </button>
        <div className="ultima-nav-dock">{bottomNav}</div>
      </footer>
    </div>
  );
}
