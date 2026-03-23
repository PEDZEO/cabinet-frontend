import { type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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

type UltimaDesktopSubscriptionProps = {
  title: string;
  subtitle: string;
  selectedDeviceLimit: number;
  deviceLimits: number[];
  periods: UltimaDesktopSubscriptionPeriod[];
  selectedPeriodLabel: string;
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

const sharedCardClassName =
  'rounded-[30px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_22px_48px_rgba(3,14,24,0.24)] backdrop-blur-xl';

const defaultCardStyle: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 22%, transparent)',
  background:
    'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-surface) 30%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 66%, transparent))',
};

const accentCardStyle: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 32%, transparent)',
  background:
    'linear-gradient(145deg, color-mix(in srgb, var(--ultima-color-aura) 22%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 72%, transparent))',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.08), 0 28px 56px color-mix(in srgb, var(--ultima-color-aura) 12%, transparent)',
};

export function UltimaDesktopSubscription({
  title,
  subtitle,
  selectedDeviceLimit,
  deviceLimits,
  periods,
  selectedPeriodLabel,
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
    <div className="ultima-shell-inner lg:max-w-[1200px]">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-4">
          <section
            className={cn(sharedCardClassName, 'relative overflow-hidden p-6 lg:p-7')}
            style={accentCardStyle}
          >
            <div className="absolute inset-y-0 right-[-10%] w-[36%] rounded-full bg-white/[0.05] blur-3xl" />
            <div className="relative flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-[56ch]">
                <div className="border-white/12 inline-flex h-14 min-w-14 items-center justify-center rounded-full border bg-white/[0.08] px-4 text-[22px] font-semibold text-white">
                  {selectedDeviceLimit}
                </div>
                <h1 className="mt-4 text-[clamp(38px,4.6vw,56px)] font-semibold leading-[0.94] tracking-[-0.045em] text-white">
                  {title}
                </h1>
                <p className="text-white/72 mt-3 text-[15px] leading-[1.6]">{subtitle}</p>
              </div>

              <div className="flex max-w-[420px] flex-wrap gap-2 lg:justify-end">
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
                          ? 'bg-emerald-300/16 border-emerald-200/45 text-emerald-50'
                          : 'border-white/12 text-white/72 bg-white/[0.04] hover:bg-white/[0.08]',
                      )}
                    >
                      {limit}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className={cn(sharedCardClassName, 'p-5')} style={defaultCardStyle}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {periods.map((period) => (
                <button
                  key={period.days}
                  type="button"
                  onClick={() => onSelectPeriod(period.days)}
                  className={cn(
                    'rounded-[26px] border p-4 text-left transition-colors',
                    period.isSelected
                      ? 'border-emerald-200/36 bg-emerald-300/[0.08]'
                      : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[18px] font-medium text-white">{period.label}</div>
                    {period.isBestDeal ? (
                      <span className="border-emerald-200/32 bg-emerald-300/16 rounded-full border px-2.5 py-1 text-[11px] font-semibold text-emerald-50">
                        {t('subscription.bestDeal', { defaultValue: 'Выгодно' })}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 text-[30px] font-semibold leading-none tracking-[-0.03em] text-white">
                    {period.priceLabel}
                  </div>
                  <div className="text-white/68 mt-2 text-sm">{period.monthlyLabel}</div>
                  {period.originalPriceLabel ? (
                    <div className="text-white/48 mt-2 text-sm line-through">
                      {period.originalPriceLabel}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <section className={cn(sharedCardClassName, 'p-5')} style={defaultCardStyle}>
            <div className="text-[30px] font-semibold leading-[0.98] tracking-[-0.04em] text-white">
              {payablePriceLabel}
            </div>
            <p className="text-white/68 mt-2 text-sm leading-[1.6]">
              {t('subscription.purchaseSummary', {
                defaultValue: 'Итоговая сумма к оплате после списания баланса.',
              })}
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/62">
                    {t('lite.devicesTotal', { defaultValue: 'Устройства' })}
                  </span>
                  <span className="font-medium text-white/90">{selectedDeviceLimit}</span>
                </div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/62">
                    {t('subscription.period', { defaultValue: 'Период' })}
                  </span>
                  <span className="font-medium text-white/90">{selectedPeriodLabel}</span>
                </div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/62">
                    {t('subscription.price', { defaultValue: 'Стоимость' })}
                  </span>
                  <span className="font-medium text-white/90">{totalPriceLabel}</span>
                </div>
                {originalPriceLabel ? (
                  <div className="text-white/48 mt-1 text-right text-xs line-through">
                    {originalPriceLabel}
                  </div>
                ) : null}
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/62">
                    {t('balance.title', { defaultValue: 'С баланса' })}
                  </span>
                  <span className="font-medium text-white/90">{balanceAppliedLabel}</span>
                </div>
              </div>
            </div>

            {(awaitingPaymentCompletion || isFinalizingPending) && (
              <div className="border-emerald-200/24 mt-4 rounded-[22px] border bg-emerald-300/10 px-4 py-3 text-sm leading-[1.55] text-emerald-50/90">
                {t('subscription.paymentPending', {
                  defaultValue:
                    'Ожидаем подтверждение оплаты. После возврата подписка обновится автоматически.',
                })}
              </div>
            )}

            {error && (
              <div className="border-rose-200/24 mt-4 rounded-[22px] border bg-rose-400/10 px-4 py-3 text-sm leading-[1.55] text-rose-100">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={onPay}
              disabled={isPayDisabled}
              className="ultima-btn-pill ultima-btn-primary mt-5 flex w-full items-center justify-between px-5 py-3 text-[15px] disabled:cursor-not-allowed disabled:opacity-75"
            >
              <span>{t('subscription.pay', { defaultValue: 'Оплатить подписку' })}</span>
              <span className="text-white/92">{payablePriceLabel}</span>
            </button>
          </section>

          <div className="ultima-nav-dock mt-0">{bottomNav}</div>
        </aside>
      </div>
    </div>
  );
}
