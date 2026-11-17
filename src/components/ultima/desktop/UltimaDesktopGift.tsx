import { type ReactNode, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
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

function MessageBlock({
  tone,
  children,
}: {
  tone: 'info' | 'success' | 'error' | 'warning';
  children: ReactNode;
}) {
  return (
    <div className={`ultima-offers-notice is-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
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
    <section className="ultima-offers-history-column">
      <header>
        <h3>{title}</h3>
        <p className="ultima-offers-muted">{subtitle}</p>
      </header>
      <div>{children}</div>
    </section>
  );
}

export function UltimaDesktopGift({
  title,
  subtitle,
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
      <UltimaDesktopPanel title={t('gift.desktopSummaryTitle', { defaultValue: 'Сводка подарка' })}>
        <dl className="ultima-offers-details">
          {summaryRows.map((row) => (
            <div key={`${row.label}-${row.value}`}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        {pendingPurchaseMessage ? (
          <MessageBlock tone="info">{pendingPurchaseMessage}</MessageBlock>
        ) : null}
        {error ? <MessageBlock tone="error">{error}</MessageBlock> : null}
        {success ? <MessageBlock tone="success">{success}</MessageBlock> : null}
        <button
          type="button"
          onClick={onCreate}
          disabled={isPrimaryActionDisabled}
          className="ultima-btn-pill ultima-btn-primary ultima-offers-submit"
        >
          {primaryActionLabel}
        </button>
      </UltimaDesktopPanel>
      {generatedGiftCode ? (
        <UltimaDesktopPanel
          title={t('balance.promocode.generatedGiftCode', { defaultValue: 'Подарочный код' })}
          subtitle={t('gift.desktopCodeSubtitle', {
            defaultValue: 'Код можно сразу отправить получателю или сохранить.',
          })}
        >
          <p className="ultima-offers-generated-code">{generatedGiftCode}</p>
          <button
            type="button"
            onClick={onCopyGeneratedCode}
            className="ultima-btn-pill ultima-btn-secondary ultima-offers-submit"
          >
            {t('common.copy', { defaultValue: 'Копировать' })}
          </button>
        </UltimaDesktopPanel>
      ) : null}
      {pendingExtend ? (
        <UltimaDesktopPanel
          title={t('gift.desktopPendingExtendTitle', {
            defaultValue: 'Ожидаем подтверждение продления',
          })}
        >
          <MessageBlock tone="warning">{pendingExtend.description}</MessageBlock>
          <div className="ultima-offers-button-row">
            <button
              type="button"
              onClick={pendingExtend.onConfirm}
              disabled={!pendingExtend.canConfirm || pendingExtend.isPending}
              className="ultima-btn-pill ultima-btn-primary"
            >
              {pendingExtend.isPending
                ? t('gift.desktopConfirming', { defaultValue: 'Подтверждаем...' })
                : t('gift.desktopConfirmExtend', { defaultValue: 'Подтвердить' })}
            </button>
            <button
              type="button"
              onClick={pendingExtend.onCancel}
              disabled={pendingExtend.isPending}
              className="ultima-btn-pill ultima-btn-secondary"
            >
              {t('common.cancel', { defaultValue: 'Отмена' })}
            </button>
          </div>
          <p className="ultima-offers-hint">{pendingExtend.tokenLabel}</p>
        </UltimaDesktopPanel>
      ) : null}
    </>
  );
  return (
    <UltimaDesktopSectionLayout
      icon={null}
      title={title}
      subtitle={subtitle}
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
          <>
            <p className="ultima-offers-hint">{purchaseHint}</p>
            <section className="ultima-offers-fieldset">
              <h3>{t('gift.tariff', { defaultValue: 'Тариф' })}</h3>
              <div className="ultima-offers-choice-list">
                {tariffs.map((tariff) => (
                  <button
                    key={tariff.id}
                    type="button"
                    onClick={() => onSelectTariff(tariff.id)}
                    aria-pressed={tariff.isSelected}
                    className={`ultima-offers-choice ${tariff.isSelected ? 'is-selected' : ''}`}
                  >
                    <span className="ultima-offers-choice-copy">
                      <strong>{tariff.name}</strong>
                      <span>{tariff.description}</span>
                    </span>
                    <span className="ultima-offers-choice-mark" aria-hidden="true">
                      {tariff.isSelected ? '✓' : ''}
                    </span>
                  </button>
                ))}
              </div>
            </section>
            <section className="ultima-offers-fieldset">
              <h3>{t('subscription.period', { defaultValue: 'Период' })}</h3>
              <div className="ultima-offers-choice-list">
                {periods.map((period) => (
                  <button
                    key={period.days}
                    type="button"
                    onClick={() => onSelectPeriod(period.days)}
                    aria-pressed={period.isSelected}
                    className={`ultima-offers-choice ultima-offers-period ${period.isSelected ? 'is-selected' : ''}`}
                  >
                    <span>
                      {period.label}
                      {period.badge ? (
                        <small className="ultima-offers-discount">{period.badge}</small>
                      ) : null}
                    </span>
                    <strong>{period.priceLabel}</strong>
                    <span className="ultima-offers-choice-mark" aria-hidden="true">
                      {period.isSelected ? '✓' : ''}
                    </span>
                  </button>
                ))}
              </div>
            </section>
            {requiresGatewayPayment ? (
              <section className="ultima-offers-fieldset">
                <h3>{t('balance.topUp.paymentMethodTitle', { defaultValue: 'Способ оплаты' })}</h3>
                {gatewayHint ? <p className="ultima-offers-hint">{gatewayHint}</p> : null}
                <div className="ultima-offers-choice-list">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => onSelectPaymentMethod(method.id)}
                      aria-pressed={method.isSelected}
                      className={`ultima-offers-choice ${method.isSelected ? 'is-selected' : ''}`}
                    >
                      <span className="ultima-offers-choice-copy">
                        <strong>{method.name}</strong>
                        {method.description ? <span>{method.description}</span> : null}
                      </span>
                      <span className="ultima-offers-choice-mark" aria-hidden="true">
                        {method.isSelected ? '✓' : ''}
                      </span>
                    </button>
                  ))}
                </div>
                {paymentSubOptions.length ? (
                  <div className="ultima-offers-button-row">
                    {paymentSubOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onSelectPaymentSubOption(option.id)}
                        aria-pressed={option.isSelected}
                        className={`ultima-offers-option ${option.isSelected ? 'is-selected' : ''}`}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}
          </>
        )}
      </UltimaDesktopPanel>
      <UltimaDesktopPanel
        title={t('gift.desktopHistoryTitle', { defaultValue: 'История подарков' })}
        subtitle={t('gift.desktopHistorySubtitle', {
          defaultValue: 'Отправленные коды можно копировать и продлевать прямо из этой страницы.',
        })}
      >
        <div className="ultima-offers-history">
          <HistoryColumn
            title={t('gift.desktopSentHistoryTitle', { defaultValue: 'Отправленные' })}
            subtitle={t('gift.desktopSentHistorySubtitle', {
              defaultValue: 'Коды, которые вы уже создали и можете продлить.',
            })}
          >
            {!sentItems.length ? (
              <p className="ultima-offers-empty">
                {t('gift.desktopEmptySent', { defaultValue: 'Отправленных подарков пока нет.' })}
              </p>
            ) : (
              sentItems.map((gift) => (
                <article key={gift.token} className="ultima-offers-history-row">
                  <header>
                    <div>
                      <h4>{gift.title}</h4>
                      <p className="ultima-offers-muted">{gift.subtitle}</p>
                    </div>
                    <span className={`ultima-offers-status ${gift.statusClassName}`}>
                      {gift.statusLabel}
                    </span>
                  </header>
                  <button
                    type="button"
                    onClick={gift.onCopyCode}
                    className="ultima-offers-copy-code"
                  >
                    GIFT-{gift.token}
                  </button>
                  <p className="ultima-offers-muted">{gift.detail}</p>
                  <div className="ultima-offers-button-row">
                    <select
                      value={gift.selectedPeriodDays}
                      onChange={(event) => gift.onPeriodChange(Number(event.target.value))}
                      aria-label={t('subscription.period', { defaultValue: 'Период' })}
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
                      className="ultima-btn-pill ultima-btn-secondary"
                    >
                      {gift.isRenewing
                        ? t('gift.desktopRenewing', { defaultValue: 'Продлеваем...' })
                        : t('gift.desktopRenewAction', { defaultValue: 'Продлить' })}
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
            {!receivedItems.length ? (
              <p className="ultima-offers-empty">
                {t('gift.desktopEmptyReceived', { defaultValue: 'Полученных подарков пока нет.' })}
              </p>
            ) : (
              receivedItems.map((gift) => (
                <article key={gift.token} className="ultima-offers-history-row">
                  <header>
                    <div>
                      <h4>{gift.title}</h4>
                      <p className="ultima-offers-muted">{gift.subtitle}</p>
                    </div>
                    <span className={`ultima-offers-status ${gift.statusClassName}`}>
                      {gift.statusLabel}
                    </span>
                  </header>
                  <p className="ultima-offers-muted">{gift.detail}</p>
                </article>
              ))
            )}
          </HistoryColumn>
        </div>
      </UltimaDesktopPanel>
    </UltimaDesktopSectionLayout>
  );
}
