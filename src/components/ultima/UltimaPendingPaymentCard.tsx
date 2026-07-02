import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/hooks/useCurrency';
import { usePendingTopUpFollowUpState } from '@/hooks/usePendingTopUpFollowUpState';
import { cn } from '@/lib/utils';
import { usePlatform } from '@/platform';
import { trackAnalyticsEvent } from '@/utils/analyticsEvents';

type UltimaPendingPaymentCardProps = {
  className?: string;
  source: string;
  compact?: boolean;
};

const PaymentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <rect x="3.5" y="5.5" width="17" height="13" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 10h16M8 15h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

export function UltimaPendingPaymentCard({
  className,
  source,
  compact = false,
}: UltimaPendingPaymentCardProps) {
  const { t } = useTranslation();
  const { formatAmount, currencySymbol } = useCurrency();
  const { openLink, openTelegramLink } = usePlatform();
  const { pendingTopUp, dismissPendingTopUp } = usePendingTopUpFollowUpState();

  if (!pendingTopUp?.paymentUrl) {
    return null;
  }

  const amountLabel = `${formatAmount(pendingTopUp.amountKopeks / 100)} ${currencySymbol}`;
  const openPayment = () => {
    const paymentUrl = pendingTopUp.paymentUrl;
    if (!paymentUrl) {
      return;
    }

    trackAnalyticsEvent('ultima_payment_recovery_click', {
      source,
      amount_kopeks: pendingTopUp.amountKopeks,
      payment_method_id: pendingTopUp.paymentMethodId ?? null,
    });

    if (paymentUrl.includes('t.me/')) {
      openTelegramLink(paymentUrl);
      return;
    }

    openLink(paymentUrl);
  };

  const dismiss = () => {
    trackAnalyticsEvent('ultima_payment_recovery_dismiss', {
      source,
      amount_kopeks: pendingTopUp.amountKopeks,
    });
    dismissPendingTopUp();
  };

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[20px] border border-amber-200/[0.22] bg-amber-300/[0.1] p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(3,14,24,0.2)] backdrop-blur-md',
        compact ? 'px-3 py-2.5' : 'px-3.5 py-3',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] border border-amber-200/[0.26] bg-amber-300/[0.16] text-amber-50">
          <PaymentIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight text-white/[0.96]">
            {t('balance.pendingReminderTitle', { defaultValue: 'Оплата не завершена' })}
          </p>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-white/[0.64]">
            {pendingTopUp.paymentMethodName
              ? t('balance.pendingReminderInlineMessageWithMethod', {
                  amount: amountLabel,
                  method: pendingTopUp.paymentMethodName,
                  defaultValue: '{{amount}} через {{method}}',
                })
              : t('balance.pendingReminderInlineMessage', {
                  amount: amountLabel,
                  defaultValue: '{{amount}} ожидает оплаты',
                })}
          </p>
        </div>
        <button
          type="button"
          onClick={openPayment}
          className="ultima-btn-pill ultima-btn-primary shrink-0 px-3 py-2 text-[12px] font-semibold"
        >
          {t('balance.pendingReminderContinue', { defaultValue: 'Продолжить' })}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/[0.62] transition hover:text-white"
          aria-label={t('common.close', { defaultValue: 'Закрыть' })}
        >
          <CloseIcon />
        </button>
      </div>
    </section>
  );
}
