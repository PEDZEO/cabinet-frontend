import { type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ultimaAccentSurfaceStyle,
  ultimaCardClassName,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';
import { cn } from '@/lib/utils';

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
  awaitingPaymentCompletion,
  isFinalizingPending,
  isPayDisabled,
  bottomNav,
  onSelectDevice,
  onSelectPeriod,
  onPay,
}: UltimaDesktopSubscriptionProps) {
  const { t } = useTranslation();

  return (
    <div className="ultima-shell-inner lg:max-w-[1180px]">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-4">
          {planSelector}

          <section
            className={cn(ultimaCardClassName, 'relative overflow-hidden p-4 lg:p-5')}
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

              <div className="flex max-w-[380px] flex-wrap gap-2 lg:justify-end">
                {deviceLimits.map((limit, index) => {
                  const active = limit === selectedDeviceLimit;
                  return (
                    <button
                      key={limit}
                      type="button"
                      onClick={() => onSelectDevice(index)}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'border-emerald-200/[0.45] bg-emerald-300/[0.16] text-emerald-50'
                          : 'border-white/[0.12] bg-white/[0.04] text-white/[0.72] hover:bg-white/[0.08]',
                      )}
                    >
                      {limit}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className={cn(ultimaCardClassName, 'p-5 xl:p-6')} style={defaultCardStyle}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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

        <aside className="ultima-desktop-aside space-y-4 lg:sticky lg:top-4">
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

          <div className="ultima-nav-dock mt-0">{bottomNav}</div>
        </aside>
      </div>
    </div>
  );
}
