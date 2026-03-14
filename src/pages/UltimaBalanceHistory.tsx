import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { balanceApi } from '@/api/balance';
import { useCurrency } from '@/hooks/useCurrency';
import type { PaginatedResponse, Transaction } from '@/types';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { formatTransactionDescription } from '@/utils/transactionDescription';

const EyeIcon = ({ hidden }: { hidden: boolean }) =>
  hidden ? (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="m3 3 18 18M10.7 10.7A2 2 0 0 0 13.3 13.3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9.9 5.2A11.8 11.8 0 0 1 12 5c4.6 0 8.2 2.8 10 7-1 2.1-2.5 3.8-4.4 4.9M6.5 8.2A12 12 0 0 0 2 12c1.8 4.2 5.4 7 10 7 1 0 2-.1 2.9-.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M2 12c1.8-4.2 5.4-7 10-7s8.2 2.8 10 7c-1.8 4.2-5.4 7-10 7S3.8 16.2 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );

const WalletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-white/30">
    <rect x="3.5" y="6" width="17" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.5 10h17" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="16.5" cy="14" r="1.2" fill="currentColor" />
  </svg>
);

const getStoredHidden = () => {
  try {
    return localStorage.getItem('ultima_balance_hidden') === '1';
  } catch {
    return false;
  }
};

export function UltimaBalanceHistory() {
  const { t } = useTranslation();
  const { formatAmount, currencySymbol } = useCurrency();
  const [page, setPage] = useState(1);
  const [hiddenBalance, setHiddenBalance] = useState(getStoredHidden);

  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });

  const { data: transactions, isLoading: txLoading } = useQuery<PaginatedResponse<Transaction>>({
    queryKey: ['transactions', page, 'ultima'],
    queryFn: () => balanceApi.getTransactions({ per_page: 20, page }),
    placeholderData: (previousData) => previousData,
  });

  const toggleBalanceVisibility = () => {
    setHiddenBalance((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ultima_balance_hidden', next ? '1' : '0');
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const getTypeLabel = (type: string) => {
    const normalized = type?.toUpperCase?.() ?? type;
    switch (normalized) {
      case 'DEPOSIT':
        return t('balance.deposit');
      case 'SUBSCRIPTION_PAYMENT':
        return t('balance.subscriptionPayment');
      case 'GIFT_PAYMENT':
      case 'GIFT_PURCHASE':
        return t('balance.giftPayment', { defaultValue: 'Покупка подарка' });
      case 'REFERRAL_REWARD':
        return t('balance.referralReward');
      case 'WITHDRAWAL':
        return t('balance.withdrawal');
      default:
        return type;
    }
  };

  const transactionItems = useMemo(() => transactions?.items ?? [], [transactions]);

  return (
    <div className="ultima-shell ultima-flat-frames">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_70%_at_50%_45%,rgba(33,208,154,0.14),rgba(7,20,46,0.02)_62%,rgba(7,20,46,0)_100%)]" />
      <div className="ultima-shell-inner">
        <header className="mb-3">
          <h1 className="text-[clamp(34px,9vw,42px)] font-semibold leading-[0.9] tracking-[-0.01em] text-white">
            {t('profile.transactionsTitle', { defaultValue: 'История операций' })}
          </h1>
          <p className="text-white/62 mt-1.5 text-[13px]">
            {t('profile.transactionsDescription', { defaultValue: 'Список ваших транзакций' })}
          </p>
        </header>

        <section className="border-emerald-200/12 mb-3 rounded-2xl border bg-[rgba(12,45,42,0.2)] p-3 backdrop-blur-md">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[12px] text-white/55">{t('balance.currentBalance')}</p>
            <button
              type="button"
              onClick={toggleBalanceVisibility}
              className="border-emerald-200/12 flex items-center gap-1 rounded-lg border bg-emerald-900/30 px-2 py-1 text-[11px] text-white/75"
            >
              <EyeIcon hidden={hiddenBalance} />
              {hiddenBalance
                ? t('common.show', { defaultValue: 'Показать' })
                : t('common.hide', { defaultValue: 'Скрыть' })}
            </button>
          </div>
          <p className="text-[30px] font-semibold leading-none text-white">
            {hiddenBalance ? '•••••' : formatAmount(balanceData?.balance_rubles || 0)}
            <span className="ml-2 text-[18px] text-white/55">{currencySymbol}</span>
          </p>
        </section>

        <section className="border-emerald-200/12 min-h-0 flex-1 overflow-hidden rounded-3xl border bg-[rgba(12,45,42,0.18)] p-3 backdrop-blur-md">
          <div className="ultima-scrollbar h-full overflow-y-auto pr-1">
            {txLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/40 border-t-transparent" />
              </div>
            ) : transactionItems.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mb-3 flex justify-center">
                  <WalletIcon />
                </div>
                <p className="text-white/58 text-sm">{t('balance.noTransactions')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactionItems.map((tx) => {
                  const isPositive = tx.amount_rubles >= 0;
                  const sign = isPositive ? '+' : '-';
                  const amountValue = Math.abs(tx.amount_rubles);
                  const localizedDescription = formatTransactionDescription(
                    tx.description,
                    tx.type,
                    t,
                  );
                  return (
                    <div
                      key={tx.id}
                      className="rounded-2xl border border-emerald-200/10 bg-emerald-950/30 px-3 py-2.5"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="rounded-full border border-emerald-200/15 bg-emerald-900/35 px-2 py-0.5 text-[10px] text-white/70">
                          {getTypeLabel(tx.type)}
                        </span>
                        <span className="text-[11px] text-white/45">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {localizedDescription ? (
                        <p className="text-white/58 mb-1 text-[12px]">{localizedDescription}</p>
                      ) : null}
                      <p
                        className={`text-[15px] font-medium ${isPositive ? 'text-emerald-200' : 'text-rose-200'}`}
                      >
                        {sign}
                        {formatAmount(amountValue)} {currencySymbol}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {transactions && transactions.pages > 1 ? (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  className="border-emerald-200/12 rounded-xl border bg-emerald-900/30 px-3 py-2 text-[12px] text-white/80 disabled:opacity-40"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={transactions.page <= 1}
                >
                  {t('common.back')}
                </button>
                <p className="flex-1 text-center text-[12px] text-white/60">
                  {t('balance.page', { current: transactions.page, total: transactions.pages })}
                </p>
                <button
                  type="button"
                  className="border-emerald-200/12 rounded-xl border bg-emerald-900/30 px-3 py-2 text-[12px] text-white/80 disabled:opacity-40"
                  onClick={() =>
                    setPage((prev) =>
                      transactions.pages ? Math.min(transactions.pages, prev + 1) : prev + 1,
                    )
                  }
                  disabled={transactions.page >= transactions.pages}
                >
                  {t('common.next')}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <div className="ultima-nav-dock">
          <UltimaBottomNav active="profile" />
        </div>
      </div>
    </div>
  );
}
