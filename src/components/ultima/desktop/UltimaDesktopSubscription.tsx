import { type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus } from 'lucide-react';
import {
  ultimaAccentSurfaceStyle,
  ultimaCardClassName,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';
import { cn } from '@/lib/utils';
import { UltimaDesktopRail, UltimaDesktopTopbar } from './UltimaDesktopWorkspace';

type UltimaDesktopSubscriptionPeriod = {
  days: number;
  label: string;
  priceLabel: string;
  monthlyLabel: string;
  originalPriceLabel: string | null;
  isSelected: boolean;
  isBestDeal: boolean;
};

type UltimaDesktopIncludedItem = {
  label: string;
  value: string;
};

type UltimaDesktopSubscriptionProps = {
  planSelector?: ReactNode;
  title: string;
  subtitle: string;
  selectedDeviceLimit: number;
  deviceLimits: number[];
  periods: UltimaDesktopSubscriptionPeriod[];
  selectedPeriodLabel: string;
  includedItems: UltimaDesktopIncludedItem[];
  baseDeviceLimitLabel?: string | null;
  extraDeviceChargeLabel?: string | null;
  legacyDeviceNotice?: string | null;
  onReduceDevices?: (() => void) | null;
  totalPriceLabel: string;
  balanceAppliedLabel: string;
  payablePriceLabel: string;
  originalPriceLabel: string | null;
  error: string | null;
  paymentRecoveryCard?: ReactNode;
  awaitingPaymentCompletion: boolean;
  isFinalizingPending: boolean;
  isPayDisabled: boolean;
  bottomNav: ReactNode;
  onSelectDevice: (index: number) => void;
  onSelectPeriod: (days: number) => void;
  onPay: () => void;
};

const defaultCardStyle: CSSProperties = ultimaSurfaceStyle;
const accentCardStyle: CSSProperties = ultimaAccentSurfaceStyle;

export function UltimaDesktopSubscription({
  planSelector,
  title,
  subtitle,
  selectedDeviceLimit,
  deviceLimits,
  periods,
  selectedPeriodLabel,
  includedItems,
  baseDeviceLimitLabel,
  extraDeviceChargeLabel,
  legacyDeviceNotice,
  onReduceDevices,
  totalPriceLabel,
  balanceAppliedLabel,
  payablePriceLabel,
  originalPriceLabel,
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
  const selectedDeviceIndex = deviceLimits.indexOf(selectedDeviceLimit);
  const canDecreaseDevices = selectedDeviceIndex > 0;
  const canIncreaseDevices =
    selectedDeviceIndex >= 0 && selectedDeviceIndex < deviceLimits.length - 1;

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
                className={cn(
                  ultimaCardClassName,
                  'ultima-desktop-subscription-config relative overflow-hidden p-4 lg:p-5',
                )}
                style={accentCardStyle}
              >
                <div className="absolute inset-y-0 right-[-10%] w-[36%] rounded-full bg-white/[0.05] blur-3xl" />
                <div className="relative flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-[56ch]">
                    <div className="inline-flex h-10 min-w-10 items-center justify-center rounded-[16px] border border-white/[0.12] bg-white/[0.08] px-3 text-[18px] font-semibold text-white">
                      {selectedDeviceLimit}
                    </div>
                    <h1 className="mt-3 max-w-[22ch] text-[clamp(30px,3.2vw,42px)] font-semibold leading-[0.98] tracking-[-0.03em] text-white">
                      {title}
                    </h1>
                    <p className="mt-2 text-[14px] leading-[1.5] text-white/[0.72]">{subtitle}</p>
                  </div>

                  <div className="w-full max-w-[300px] rounded-[8px] border border-white/[0.12] bg-black/[0.16] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase text-white/[0.48]">
                          {t('lite.devicesTotal', { defaultValue: 'Устройства' })}
                        </div>
                        <div className="mt-1 text-xs text-white/[0.58]">
                          {deviceLimits[0]}–{deviceLimits[deviceLimits.length - 1]}
                        </div>
                      </div>
                      <div className="grid grid-cols-[40px_minmax(88px,1fr)_40px] overflow-hidden rounded-[8px] border border-white/[0.12] bg-black/20">
                        <button
                          type="button"
                          data-testid="ultima-desktop-devices-minus"
                          onClick={() => onSelectDevice(selectedDeviceIndex - 1)}
                          disabled={!canDecreaseDevices}
                          aria-label={t('common.decrease', { defaultValue: 'Уменьшить' })}
                          className="flex h-10 items-center justify-center border-r border-white/[0.1] text-white/[0.74] transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Minus className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <select
                          data-testid="ultima-desktop-device-select"
                          value={selectedDeviceLimit}
                          onChange={(event) => {
                            const nextIndex = deviceLimits.indexOf(Number(event.target.value));
                            if (nextIndex >= 0) onSelectDevice(nextIndex);
                          }}
                          aria-label={t('lite.devicesTotal', { defaultValue: 'Устройства' })}
                          className="h-10 min-w-0 appearance-none bg-transparent px-3 text-center text-sm font-semibold text-white outline-none"
                        >
                          {deviceLimits.map((limit) => (
                            <option key={limit} value={limit} className="bg-[#10171c] text-white">
                              {limit}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          data-testid="ultima-desktop-devices-plus"
                          onClick={() => onSelectDevice(selectedDeviceIndex + 1)}
                          disabled={!canIncreaseDevices}
                          aria-label={t('common.increase', { defaultValue: 'Увеличить' })}
                          className="flex h-10 items-center justify-center border-l border-white/[0.1] text-white/[0.74] transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Plus className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className={cn(ultimaCardClassName, 'p-5 xl:p-6')} style={defaultCardStyle}>
                <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {periods.map((period) => (
                    <button
                      key={period.days}
                      type="button"
                      onClick={() => onSelectPeriod(period.days)}
                      className={cn(
                        'rounded-[18px] border p-3.5 text-left transition-colors',
                        period.isSelected
                          ? 'border-emerald-200/[0.36] bg-emerald-300/[0.08]'
                          : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[18px] font-medium text-white">{period.label}</div>
                        {period.isBestDeal ? (
                          <span className="rounded-full border border-emerald-200/[0.32] bg-emerald-300/[0.16] px-2.5 py-1 text-[11px] font-semibold text-emerald-50">
                            {t('subscription.bestDeal', { defaultValue: 'Выгодно' })}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 text-[26px] font-semibold leading-none tracking-[-0.03em] text-white">
                        {period.priceLabel}
                      </div>
                      <div className="mt-2 text-sm text-white/[0.68]">{period.monthlyLabel}</div>
                      {period.originalPriceLabel ? (
                        <div className="mt-2 text-sm text-white/[0.48] line-through">
                          {period.originalPriceLabel}
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </main>

          <aside className="ultima-desktop-context">
            <section className={cn(ultimaCardClassName, 'p-5')} style={defaultCardStyle}>
              <div className="text-[28px] font-semibold leading-[1] tracking-[-0.035em] text-white">
                {payablePriceLabel}
              </div>
              <p className="mt-2 text-sm leading-[1.6] text-white/[0.68]">
                {t('subscription.purchaseSummary', {
                  defaultValue: 'Итоговая сумма к оплате после списания баланса.',
                })}
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-white">
                      {t('ultima.checkoutIncludedTitle', { defaultValue: 'Что входит' })}
                    </span>
                    <span className="text-xs text-white/[0.54]">
                      {t('ultima.checkoutIncludedSubtitle', {
                        defaultValue: 'Применится сразу после оплаты',
                      })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {includedItems.map((item) => (
                      <div key={item.label} className="rounded-[16px] bg-black/15 px-3 py-2">
                        <div className="text-[11px] uppercase tracking-[0.12em] text-white/[0.46]">
                          {item.label}
                        </div>
                        <div className="mt-1 line-clamp-2 break-words text-sm font-medium leading-snug text-white/90">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/[0.62]">
                      {t('lite.devicesTotal', { defaultValue: 'Устройства' })}
                    </span>
                    <span className="font-medium text-white/90">{selectedDeviceLimit}</span>
                  </div>
                  {baseDeviceLimitLabel ? (
                    <div className="mt-1 text-xs leading-[1.5] text-white/[0.56]">
                      {baseDeviceLimitLabel}
                    </div>
                  ) : null}
                  {extraDeviceChargeLabel ? (
                    <div className="mt-1 text-xs leading-[1.5] text-amber-100/[0.86]">
                      {extraDeviceChargeLabel}
                    </div>
                  ) : null}
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/[0.62]">
                      {t('subscription.period', { defaultValue: 'Период' })}
                    </span>
                    <span className="font-medium text-white/90">{selectedPeriodLabel}</span>
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/[0.62]">
                      {t('subscription.price', { defaultValue: 'Стоимость' })}
                    </span>
                    <span className="font-medium text-white/90">{totalPriceLabel}</span>
                  </div>
                  {originalPriceLabel ? (
                    <div className="mt-1 text-right text-xs text-white/[0.48] line-through">
                      {originalPriceLabel}
                    </div>
                  ) : null}
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/[0.62]">
                      {t('balance.title', { defaultValue: 'С баланса' })}
                    </span>
                    <span className="font-medium text-white/90">{balanceAppliedLabel}</span>
                  </div>
                </div>
              </div>

              {(awaitingPaymentCompletion || isFinalizingPending) && (
                <div className="mt-4 rounded-[22px] border border-emerald-200/[0.24] bg-emerald-300/10 px-4 py-3 text-sm leading-[1.55] text-emerald-50/90">
                  {t('subscription.paymentPending', {
                    defaultValue:
                      'Ожидаем подтверждение оплаты. После возврата подписка обновится автоматически.',
                  })}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-[22px] border border-rose-200/[0.24] bg-rose-400/10 px-4 py-3 text-sm leading-[1.55] text-rose-100">
                  {error}
                </div>
              )}

              {legacyDeviceNotice ? (
                <div className="mt-4 rounded-[18px] border border-amber-200/[0.24] bg-amber-300/10 px-3 py-2.5 text-[13px] leading-[1.45] text-amber-50/[0.92]">
                  <p>{legacyDeviceNotice}</p>
                  {onReduceDevices ? (
                    <button
                      type="button"
                      onClick={onReduceDevices}
                      className="ultima-btn-pill ultima-btn-secondary mt-2 w-full px-3 py-2 text-[13px]"
                    >
                      {t('subscription.manageDevices', { defaultValue: 'Управление устройствами' })}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {paymentRecoveryCard ? <div className="mt-4">{paymentRecoveryCard}</div> : null}

              <button
                type="button"
                onClick={onPay}
                disabled={isPayDisabled}
                className="ultima-btn-pill ultima-btn-primary mt-5 flex w-full items-center justify-between px-5 py-3 text-[15px] disabled:cursor-not-allowed disabled:opacity-75"
              >
                <span>{t('subscription.pay', { defaultValue: 'Оплатить подписку' })}</span>
                <span className="text-white/[0.92]">{payablePriceLabel}</span>
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
