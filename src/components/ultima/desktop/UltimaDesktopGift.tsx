import { type ReactNode, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  UltimaDesktopPanel,
  UltimaDesktopSectionLayout,
} from '@/components/ultima/desktop/UltimaDesktopSectionLayout';

type UltimaDesktopGiftMetric = {
  label: string;
  value: string;
  hint?: string;
};

type UltimaDesktopGiftSummaryRow = {
  label: string;
  value: string;
};

type UltimaDesktopGiftTariffOption = {
  id: number;
  name: string;
  description: string;
  deviceLimit: number;
  isSelected: boolean;
};

type UltimaDesktopGiftPeriodOption = {
  days: number;
  label: string;
  priceLabel: string;
  badge?: string | null;
  isSelected: boolean;
};

type UltimaDesktopGiftPaymentMethodOption = {
  id: string;
  name: string;
  description?: string | null;
  isSelected: boolean;
};

type UltimaDesktopGiftPaymentSubOption = {
  id: string;
  name: string;
  isSelected: boolean;
};

type UltimaDesktopGiftSentPeriodOption = {
  days: number;
  label: string;
};

type UltimaDesktopGiftSentItem = {
  token: string;
  title: string;
  subtitle: string;
  detail: string;
  statusLabel: string;
  statusClassName: string;
  periodOptions: UltimaDesktopGiftSentPeriodOption[];
  selectedPeriodDays: number;
  isRenewing: boolean;
  onPeriodChange: (days: number) => void;
  onRenew: () => void;
  onCopyCode: () => void;
};

type UltimaDesktopGiftReceivedItem = {
  token: string;
  title: string;
  subtitle: string;
  detail: string;
  statusLabel: string;
  statusClassName: string;
};

type UltimaDesktopGiftPendingExtend = {
  tokenLabel: string;
  description: string;
  canConfirm: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

type UltimaDesktopGiftProps = {
  title: string;
  subtitle: string;
  metrics: UltimaDesktopGiftMetric[];
  purchaseIntro: string;
  purchaseAnchorRef: RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  disabledMessage: string | null;
  purchaseHint: string;
  gatewayHint: string | null;
  tariffs: UltimaDesktopGiftTariffOption[];
  periods: UltimaDesktopGiftPeriodOption[];
  paymentMethods: UltimaDesktopGiftPaymentMethodOption[];
  paymentSubOptions: UltimaDesktopGiftPaymentSubOption[];
  requiresGatewayPayment: boolean;
  summaryRows: UltimaDesktopGiftSummaryRow[];
  primaryActionLabel: string;
  isPrimaryActionDisabled: boolean;
  pendingPurchaseMessage: string | null;
  generatedGiftCode: string | null;
  error: string | null;
  success: string | null;
  sentItems: UltimaDesktopGiftSentItem[];
  receivedItems: UltimaDesktopGiftReceivedItem[];
  pendingExtend: UltimaDesktopGiftPendingExtend | null;
  bottomNav: ReactNode;
  onScrollToPurchase: () => void;
  onSelectTariff: (id: number) => void;
  onSelectPeriod: (days: number) => void;
  onSelectPaymentMethod: (id: string) => void;
  onSelectPaymentSubOption: (id: string) => void;
  onCreate: () => void;
  onCopyGeneratedCode: () => void;
};

const GiftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white/90" aria-hidden>
    <path
      d="M4.75 9.25h14.5v9a1.5 1.5 0 0 1-1.5 1.5h-11a1.5 1.5 0 0 1-1.5-1.5v-9Zm7.25 0v10.5m-5-10.5V7.8c0-.856.694-1.55 1.55-1.55H10m2 3V6.25h1.45c.856 0 1.55.694 1.55 1.55v1.45M12 6.25c-1.05 0-2.75-.625-2.75-2.15C9.25 2.9 10.1 2.25 11.1 2.25c1.45 0 2.15 1.55 2.15 4m-1.25 0c1.05 0 2.75-.625 2.75-2.15 0-1.2-.85-1.85-1.85-1.85-1.45 0-2.15 1.55-2.15 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function MessageBlock({
  tone,
  children,
}: {
  tone: 'info' | 'success' | 'error' | 'warning';
  children: ReactNode;
}) {
  const toneClassName =
    tone === 'success'
      ? 'border-emerald-200/24 bg-emerald-300/10 text-emerald-50/90'
      : tone === 'error'
        ? 'border-rose-200/24 bg-rose-400/10 text-rose-100'
        : tone === 'warning'
          ? 'border-amber-200/24 bg-amber-400/10 text-amber-100'
          : 'border-sky-200/24 bg-sky-400/10 text-sky-100';

  return (
    <div className={cn('rounded-[22px] border px-4 py-3 text-sm leading-[1.6]', toneClassName)}>
      {children}
    </div>
  );
}

function HistoryColumn({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4">
        <div className="text-[16px] font-medium text-white">{title}</div>
        <div className="text-white/58 mt-1 text-sm leading-[1.55]">{subtitle}</div>
      </div>
      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">{children}</div>
    </div>
  );
}

export function UltimaDesktopGift({
  title,
  subtitle,
  metrics,
  purchaseIntro,
  purchaseAnchorRef,
  isLoading,
  disabledMessage,
  purchaseHint,
  gatewayHint,
  tariffs,
  periods,
  paymentMethods,
  paymentSubOptions,
  requiresGatewayPayment,
  summaryRows,
  primaryActionLabel,
  isPrimaryActionDisabled,
  pendingPurchaseMessage,
  generatedGiftCode,
  error,
  success,
  sentItems,
  receivedItems,
  pendingExtend,
  bottomNav,
  onScrollToPurchase,
  onSelectTariff,
  onSelectPeriod,
  onSelectPaymentMethod,
  onSelectPaymentSubOption,
  onCreate,
  onCopyGeneratedCode,
}: UltimaDesktopGiftProps) {
  const { t } = useTranslation();

  const aside = (
    <>
      <UltimaDesktopPanel
        title={t('gift.desktopSummaryTitle', { defaultValue: 'Сводка подарка' })}
        subtitle={t('gift.desktopSummarySubtitle', {
          defaultValue: 'Здесь собран итог по выбранному тарифу и способу оплаты.',
        })}
      >
        <div className="space-y-3">
          {summaryRows.map((row) => (
            <div
              key={`${row.label}-${row.value}`}
              className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-white/62">{row.label}</span>
                <span className="text-white/92 text-right font-medium">{row.value}</span>
              </div>
            </div>
          ))}
        </div>

        {pendingPurchaseMessage ? (
          <div className="mt-4">
            <MessageBlock tone="info">{pendingPurchaseMessage}</MessageBlock>
          </div>
        ) : null}
        {error ? (
          <div className="mt-4">
            <MessageBlock tone="error">{error}</MessageBlock>
          </div>
        ) : null}
        {success ? (
          <div className="mt-4">
            <MessageBlock tone="success">{success}</MessageBlock>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onCreate}
          disabled={isPrimaryActionDisabled}
          className="ultima-btn-pill ultima-btn-primary mt-5 flex min-h-[50px] w-full items-center justify-between px-5 text-[15px] disabled:cursor-not-allowed disabled:opacity-75"
        >
          <span>{primaryActionLabel}</span>
          <span className="text-white/85">→</span>
        </button>
      </UltimaDesktopPanel>

      {generatedGiftCode ? (
        <UltimaDesktopPanel
          title={t('balance.promocode.generatedGiftCode', {
            defaultValue: 'Подарочный код',
          })}
          subtitle={t('gift.desktopCodeSubtitle', {
            defaultValue: 'Код можно сразу отправить получателю или сохранить.',
          })}
        >
          <div className="border-emerald-200/14 bg-emerald-950/22 rounded-[24px] border px-4 py-4">
            <div className="break-all font-mono text-[16px] font-medium tracking-[0.02em] text-emerald-100">
              {generatedGiftCode}
            </div>
            <button
              type="button"
              onClick={onCopyGeneratedCode}
              className="ultima-btn-pill ultima-btn-secondary mt-4 w-full px-4 py-3 text-sm"
            >
              {t('common.copy', { defaultValue: 'Копировать' })}
            </button>
          </div>
        </UltimaDesktopPanel>
      ) : null}

      {pendingExtend ? (
        <UltimaDesktopPanel
          title={t('gift.desktopPendingExtendTitle', {
            defaultValue: 'Ожидаем подтверждение продления',
          })}
        >
          <MessageBlock tone="warning">{pendingExtend.description}</MessageBlock>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={pendingExtend.onConfirm}
              disabled={!pendingExtend.canConfirm || pendingExtend.isPending}
              className="ultima-btn-pill ultima-btn-primary flex-1 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-75"
            >
              {pendingExtend.isPending
                ? t('gift.desktopConfirming', { defaultValue: 'Подтверждаем...' })
                : t('gift.desktopConfirmExtend', { defaultValue: 'Подтвердить' })}
            </button>
            <button
              type="button"
              onClick={pendingExtend.onCancel}
              disabled={pendingExtend.isPending}
              className="ultima-btn-pill ultima-btn-secondary px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-75"
            >
              {t('common.cancel', { defaultValue: 'Отмена' })}
            </button>
          </div>
          <div className="text-white/46 mt-3 text-xs">{pendingExtend.tokenLabel}</div>
        </UltimaDesktopPanel>
      ) : null}
    </>
  );

  return (
    <UltimaDesktopSectionLayout
      icon={<GiftIcon />}
      title={title}
      subtitle={subtitle}
      eyebrow={t('nav.gift', { defaultValue: 'Подарок' })}
      metrics={metrics}
      heroActions={
        !disabledMessage && !isLoading ? (
          <button
            type="button"
            onClick={onScrollToPurchase}
            className="ultima-btn-pill ultima-btn-secondary px-5 py-3 text-sm"
          >
            {t('gift.desktopHeroAction', { defaultValue: 'Перейти к созданию' })}
          </button>
        ) : null
      }
      aside={aside}
      bottomNav={bottomNav}
    >
      <UltimaDesktopPanel
        title={t('gift.desktopBuilderTitle', { defaultValue: 'Новый подарок' })}
        subtitle={purchaseIntro}
      >
        <div ref={purchaseAnchorRef} />

        {isLoading ? (
          <MessageBlock tone="info">
            {t('common.loading', { defaultValue: 'Загрузка...' })}
          </MessageBlock>
        ) : disabledMessage ? (
          <MessageBlock tone="warning">{disabledMessage}</MessageBlock>
        ) : (
          <div className="space-y-6">
            <MessageBlock tone="info">{purchaseHint}</MessageBlock>

            <div>
              <div className="text-white/42 mb-3 text-[12px] uppercase tracking-[0.22em]">
                {t('subscription.tariff', { defaultValue: 'Тариф' })}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {tariffs.map((tariff) => (
                  <button
                    key={tariff.id}
                    type="button"
                    onClick={() => onSelectTariff(tariff.id)}
                    className={cn(
                      'rounded-[24px] border p-4 text-left transition-colors',
                      tariff.isSelected
                        ? 'border-emerald-200/36 bg-emerald-300/[0.08]'
                        : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[18px] font-medium text-white">{tariff.name}</div>
                        <div className="text-white/62 mt-2 text-sm leading-[1.6]">
                          {tariff.description}
                        </div>
                      </div>
                      <div className="text-white/72 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs">
                        {tariff.deviceLimit}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-white/42 mb-3 text-[12px] uppercase tracking-[0.22em]">
                {t('subscription.period', { defaultValue: 'Период' })}
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {periods.map((period) => (
                  <button
                    key={period.days}
                    type="button"
                    onClick={() => onSelectPeriod(period.days)}
                    className={cn(
                      'rounded-[24px] border p-4 text-left transition-colors',
                      period.isSelected
                        ? 'border-emerald-200/36 bg-emerald-300/[0.08]'
                        : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-[17px] font-medium text-white">{period.label}</div>
                      {period.badge ? (
                        <span className="border-emerald-200/26 bg-emerald-300/14 rounded-full border px-2.5 py-1 text-[11px] font-medium text-emerald-50">
                          {period.badge}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 text-[28px] font-semibold leading-none tracking-[-0.03em] text-white">
                      {period.priceLabel}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {requiresGatewayPayment ? (
              <div className="space-y-4">
                {gatewayHint ? <MessageBlock tone="warning">{gatewayHint}</MessageBlock> : null}

                <div>
                  <div className="text-white/42 mb-3 text-[12px] uppercase tracking-[0.22em]">
                    {t('balance.topUp.paymentMethodTitle', { defaultValue: 'Способ оплаты' })}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => onSelectPaymentMethod(method.id)}
                        className={cn(
                          'rounded-[24px] border p-4 text-left transition-colors',
                          method.isSelected
                            ? 'border-emerald-200/36 bg-emerald-300/[0.08]'
                            : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]',
                        )}
                      >
                        <div className="text-[16px] font-medium text-white">{method.name}</div>
                        {method.description ? (
                          <div className="mt-2 text-sm leading-[1.55] text-white/60">
                            {method.description}
                          </div>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentSubOptions.length > 0 ? (
                  <div>
                    <div className="text-white/42 mb-3 text-[12px] uppercase tracking-[0.22em]">
                      {t('balance.topUp.paymentOptionTitle', { defaultValue: 'Вариант оплаты' })}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {paymentSubOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => onSelectPaymentSubOption(option.id)}
                          className={cn(
                            'rounded-full border px-4 py-2 text-sm transition-colors',
                            option.isSelected
                              ? 'border-emerald-200/36 bg-emerald-300/[0.08] text-emerald-50'
                              : 'text-white/72 border-white/10 bg-white/[0.04] hover:bg-white/[0.08]',
                          )}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </UltimaDesktopPanel>

      <UltimaDesktopPanel
        title={t('gift.desktopHistoryTitle', { defaultValue: 'История подарков' })}
        subtitle={t('gift.desktopHistorySubtitle', {
          defaultValue: 'Отправленные коды можно копировать и продлевать прямо из этой страницы.',
        })}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <HistoryColumn
            title={t('gift.desktopSentHistoryTitle', { defaultValue: 'Отправленные' })}
            subtitle={t('gift.desktopSentHistorySubtitle', {
              defaultValue: 'Коды, которые вы уже создали и можете продлить.',
            })}
          >
            {sentItems.length === 0 ? (
              <div className="border-white/12 text-white/46 rounded-[20px] border border-dashed px-4 py-5 text-sm">
                {t('gift.desktopEmptySent', { defaultValue: 'Отправленных подарков пока нет.' })}
              </div>
            ) : (
              sentItems.map((gift) => (
                <article
                  key={gift.token}
                  className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[16px] font-medium text-white">{gift.title}</div>
                      <div className="text-white/56 mt-1 text-sm leading-[1.55]">
                        {gift.subtitle}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-medium',
                        gift.statusClassName,
                      )}
                    >
                      {gift.statusLabel}
                    </span>
                  </div>

                  <div className="border-white/8 mt-4 rounded-[18px] border bg-black/10 px-4 py-3">
                    <div className="text-white/36 text-xs uppercase tracking-[0.18em]">Code</div>
                    <button
                      type="button"
                      onClick={gift.onCopyCode}
                      className="mt-2 text-left font-mono text-[14px] text-emerald-100 transition hover:text-emerald-50"
                    >
                      GIFT-{gift.token}
                    </button>
                  </div>

                  <div className="text-white/58 mt-3 text-sm leading-[1.6]">{gift.detail}</div>

                  <div className="mt-4 flex items-center gap-3">
                    <select
                      value={gift.selectedPeriodDays}
                      onChange={(event) => gift.onPeriodChange(Number(event.target.value))}
                      className="border-white/12 h-11 min-w-0 flex-1 rounded-[16px] border bg-white/[0.06] px-3 text-sm text-white"
                    >
                      {gift.periodOptions.map((option) => (
                        <option key={`${gift.token}-${option.days}`} value={option.days}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={gift.onRenew}
                      disabled={gift.isRenewing}
                      className="ultima-btn-pill ultima-btn-primary px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-75"
                    >
                      {gift.isRenewing
                        ? t('gift.desktopRenewing', { defaultValue: 'Продлеваем...' })
                        : t('gift.desktopRenewAction', {
                            defaultValue: 'Продлить',
                          })}
                    </button>
                  </div>
                </article>
              ))
            )}
          </HistoryColumn>

          <HistoryColumn
            title={t('gift.desktopReceivedHistoryTitle', { defaultValue: 'Полученные' })}
            subtitle={t('gift.desktopReceivedHistorySubtitle', {
              defaultValue: 'Все подарки, которые уже пришли на ваш аккаунт.',
            })}
          >
            {receivedItems.length === 0 ? (
              <div className="border-white/12 text-white/46 rounded-[20px] border border-dashed px-4 py-5 text-sm">
                {t('gift.desktopEmptyReceived', {
                  defaultValue: 'Полученных подарков пока нет.',
                })}
              </div>
            ) : (
              receivedItems.map((gift) => (
                <article
                  key={gift.token}
                  className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[16px] font-medium text-white">{gift.title}</div>
                      <div className="text-white/56 mt-1 text-sm leading-[1.55]">
                        {gift.subtitle}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-medium',
                        gift.statusClassName,
                      )}
                    >
                      {gift.statusLabel}
                    </span>
                  </div>
                  <div className="text-white/58 mt-4 text-sm leading-[1.6]">{gift.detail}</div>
                </article>
              ))
            )}
          </HistoryColumn>
        </div>
      </UltimaDesktopPanel>
    </UltimaDesktopSectionLayout>
  );
}
