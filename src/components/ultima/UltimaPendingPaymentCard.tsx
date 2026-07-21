import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Clock3, CreditCard, X } from 'lucide-react';
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
      data-testid="ultima-pending-payment-card"
      aria-live="polite"
      className={cn(
        'relative shrink-0 overflow-hidden rounded-[20px] border border-amber-200/[0.22] bg-amber-300/[0.1] text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(3,14,24,0.2)] backdrop-blur-md',
        compact ? 'p-3' : 'p-3.5',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-amber-100/[0.55] to-transparent" />

      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-amber-200/[0.26] bg-amber-300/[0.16] text-amber-50">
          <CreditCard className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-tight text-white/[0.96]">
            {t('balance.pendingReminderTitle', { defaultValue: 'Оплата не завершена' })}
          </p>
          {!compact ? (
            <p className="mt-1 text-[11px] leading-[1.4] text-white/[0.58]">
              {t('balance.pendingReminderMessage', {
                defaultValue: 'Нажмите, чтобы снова открыть страницу оплаты.',
              })}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/[0.62] transition hover:bg-white/[0.08] hover:text-white"
          aria-label={t('common.close', { defaultValue: 'Закрыть' })}
        >
          <X className="h-4 w-4" strokeWidth={1.9} />
        </button>
      </div>

      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] font-medium">
        <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-amber-100/[0.16] bg-black/[0.12] px-2.5 text-amber-50/[0.92]">
          <Clock3 className="h-3.5 w-3.5" strokeWidth={1.8} />
          {amountLabel}
        </span>
        {pendingTopUp.paymentMethodName ? (
          <span className="min-h-7 max-w-full truncate rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5 text-white/[0.62]">
            {pendingTopUp.paymentMethodName}
          </span>
        ) : null}
      </div>

      <button
        data-testid="ultima-pending-payment-open"
        type="button"
        onClick={openPayment}
        className="ultima-btn-pill ultima-btn-primary mt-3 flex min-h-11 w-full items-center justify-between gap-3 px-4 text-[12px] font-semibold"
      >
        <span className="truncate">
          {t('balance.openPaymentPage', { defaultValue: 'Открыть страницу оплаты' })}
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0" strokeWidth={1.9} />
      </button>
    </section>
  );
}
