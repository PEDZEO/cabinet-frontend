import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  EyeOff,
  Gift,
  History,
  Plus,
  ReceiptText,
  RefreshCw,
  Repeat2,
  Users,
  WalletCards,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { balanceApi } from '@/api/balance';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import {
  UltimaDesktopPanel,
  UltimaDesktopSectionLayout,
} from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import { ultimaCardClassName, ultimaSurfaceStyle } from '@/features/ultima/surfaces';
import { useCurrency } from '@/hooks/useCurrency';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { PaginatedResponse, Transaction } from '@/types';
import { formatTransactionDescription } from '@/utils/transactionDescription';

type TransactionTone = 'positive' | 'negative' | 'neutral';

const getStoredHidden = () => {
  try {
    return localStorage.getItem('ultima_balance_hidden') === '1';
  } catch {
    return false;
  }
};

const normalizeType = (type: string) => type?.toUpperCase?.() ?? type;

const transactionIcon = (type: string) => {
  switch (normalizeType(type)) {
    case 'DEPOSIT':
      return <ArrowDownLeft className="h-4 w-4" />;
    case 'SUBSCRIPTION_PAYMENT':
      return <Repeat2 className="h-4 w-4" />;
    case 'GIFT_PAYMENT':
    case 'GIFT_PURCHASE':
      return <Gift className="h-4 w-4" />;
    case 'REFERRAL_REWARD':
      return <Users className="h-4 w-4" />;
    case 'WITHDRAWAL':
      return <ArrowUpRight className="h-4 w-4" />;
    default:
      return <ReceiptText className="h-4 w-4" />;
  }
};

export function UltimaBalanceHistory() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { formatAmount, currencySymbol } = useCurrency();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [page, setPage] = useState(1);
  const [hiddenBalance, setHiddenBalance] = useState(getStoredHidden);

  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });

  const {
    data: transactions,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery<PaginatedResponse<Transaction>>({
    queryKey: ['transactions', page, 'ultima'],
    queryFn: () => balanceApi.getTransactions({ per_page: 20, page }),
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });

  const transactionItems = useMemo(() => transactions?.items ?? [], [transactions]);
  const pageIncome = useMemo(
    () =>
      transactionItems
        .filter((transaction) => transaction.is_completed)
        .reduce((sum, transaction) => sum + Math.max(0, transaction.amount_rubles), 0),
    [transactionItems],
  );
  const pageExpenses = useMemo(
    () =>
      transactionItems
        .filter((transaction) => transaction.is_completed)
        .reduce((sum, transaction) => sum + Math.abs(Math.min(0, transaction.amount_rubles)), 0),
    [transactionItems],
  );
  const balanceRub = balanceData?.balance_rubles ?? 0;
  const balanceLabel = hiddenBalance ? '•••••' : `${formatAmount(balanceRub)} ${currencySymbol}`;
  const locale = i18n.language?.toLowerCase().startsWith('ru') ? 'ru-RU' : i18n.language || 'ru-RU';

  const toggleBalanceVisibility = () => {
    setHiddenBalance((previous) => {
      const next = !previous;
      try {
        localStorage.setItem('ultima_balance_hidden', next ? '1' : '0');
      } catch {
        // localStorage may be unavailable in an embedded browser.
      }
      return next;
    });
  };

  const getTypeLabel = (type: string) => {
    switch (normalizeType(type)) {
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
        return t('balance.operation', { defaultValue: type.replace(/[_-]+/g, ' ') });
    }
  };

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return null;
    const key = method.toLowerCase().replace(/-/g, '_');
    if (key === 'balance') return t('balance.title');
    return t(`balance.paymentMethods.${key}.name`, {
      defaultValue: method.replace(/[_-]+/g, ' '),
    });
  };

  const getTone = (amount: number): TransactionTone => {
    if (amount > 0) return 'positive';
    if (amount < 0) return 'negative';
    return 'neutral';
  };

  const amountToneClass: Record<TransactionTone, string> = {
    positive: 'text-[color:color-mix(in_srgb,var(--ultima-color-primary)_72%,white)]',
    negative: 'text-rose-200',
    neutral: 'text-white/[0.58]',
  };

  const iconToneClass: Record<TransactionTone, string> = {
    positive:
      'bg-[color:color-mix(in_srgb,var(--ultima-color-primary)_13%,transparent)] text-[color:color-mix(in_srgb,var(--ultima-color-primary)_72%,white)]',
    negative: 'bg-rose-400/[0.09] text-rose-200',
    neutral: 'bg-white/[0.05] text-white/[0.50]',
  };

  const historyList = (
    <section
      data-testid="ultima-transaction-history"
      className={ultimaCardClassName}
      style={ultimaSurfaceStyle}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold text-white">
            {t('profile.transactionsTitle', { defaultValue: 'История операций' })}
          </h2>
          <p className="mt-0.5 text-xs text-white/[0.42]">
            {transactions
              ? t('balance.operationsTotal', {
                  count: transactions.total,
                  defaultValue: `Всего: ${transactions.total}`,
                })
              : t('common.loading')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          aria-label={t('common.refresh', { defaultValue: 'Обновить' })}
          className="ultima-btn-pill ultima-btn-secondary flex h-10 w-10 items-center justify-center disabled:opacity-55"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading && transactionItems.length === 0 ? (
        <div data-testid="ultima-transactions-loading" className="divide-y divide-white/[0.07]">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="flex animate-pulse items-center gap-3 py-4">
              <div className="h-11 w-11 rounded-xl bg-white/[0.06]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-32 rounded bg-white/[0.07]" />
                <div className="h-3 w-44 max-w-full rounded bg-white/[0.04]" />
              </div>
              <div className="h-4 w-20 rounded bg-white/[0.06]" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex min-h-52 flex-col items-center justify-center px-4 text-center">
          <CircleAlert className="h-8 w-8 text-amber-200" />
          <p className="mt-3 text-sm font-medium text-white/[0.80]">
            {t('balance.historyLoadError', { defaultValue: 'Не удалось загрузить историю' })}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="ultima-btn-pill ultima-btn-secondary mt-4 px-4 py-2.5 text-sm"
          >
            {t('common.retry', { defaultValue: 'Повторить' })}
          </button>
        </div>
      ) : transactionItems.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center px-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-white/[0.35]">
            <ReceiptText className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-white/[0.70]">
            {t('balance.noTransactions')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/balance/top-up?returnTo=/balance')}
            className="ultima-btn-pill ultima-btn-primary mt-4 flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            {t('balance.topUpBalance')}
          </button>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.07]">
          {transactionItems.map((transaction) => {
            const tone = getTone(transaction.amount_rubles);
            const amountValue = Math.abs(transaction.amount_rubles);
            const amountSign = tone === 'positive' ? '+' : tone === 'negative' ? '−' : '';
            const description = formatTransactionDescription(
              transaction.description,
              transaction.type,
              t,
            );
            const method = formatPaymentMethod(transaction.payment_method);
            const date = new Date(transaction.created_at);
            const dateLabel = Number.isNaN(date.getTime())
              ? transaction.created_at
              : date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });

            return (
              <article
                key={transaction.id}
                data-testid="ultima-transaction-row"
                className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 py-3.5"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconToneClass[tone]}`}
                >
                  {transactionIcon(transaction.type)}
                </span>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-white/[0.92]">
                      {getTypeLabel(transaction.type)}
                    </h3>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${transaction.is_completed ? 'bg-[color:color-mix(in_srgb,var(--ultima-color-primary)_10%,transparent)] text-[color:color-mix(in_srgb,var(--ultima-color-primary)_68%,white)]' : 'bg-amber-400/[0.09] text-amber-100'}`}
                    >
                      {transaction.is_completed ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock3 className="h-3 w-3" />
                      )}
                      {transaction.is_completed
                        ? t('balance.completed', { defaultValue: 'Готово' })
                        : t('balance.pending', { defaultValue: 'Ожидает' })}
                    </span>
                  </div>
                  {description ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-white/[0.45]">{description}</p>
                  ) : null}
                  <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-white/[0.35]">
                    <span className="truncate">{dateLabel}</span>
                    {method ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{method}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="min-w-0 text-right">
                  <p
                    className={`whitespace-nowrap text-[15px] font-semibold ${amountToneClass[tone]}`}
                  >
                    {amountSign}
                    {formatAmount(amountValue)} {currencySymbol}
                  </p>
                  <p className="mt-1 text-[10px] text-white/[0.28]">#{transaction.id}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {transactions && transactions.pages > 1 ? (
        <nav
          data-testid="ultima-transactions-pagination"
          aria-label={t('balance.pagination', { defaultValue: 'Страницы истории' })}
          className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-white/[0.08] pt-3"
        >
          <button
            type="button"
            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            disabled={transactions.page <= 1 || isFetching}
            className="ultima-btn-pill ultima-btn-secondary flex min-h-10 items-center justify-center gap-1.5 px-3 text-xs disabled:opacity-35"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('common.back')}
          </button>
          <span className="min-w-[58px] text-center text-xs font-medium text-white/[0.55]">
            {transactions.page} / {transactions.pages}
          </span>
          <button
            type="button"
            onClick={() => setPage((previous) => Math.min(transactions.pages, previous + 1))}
            disabled={transactions.page >= transactions.pages || isFetching}
            className="ultima-btn-pill ultima-btn-secondary flex min-h-10 items-center justify-center gap-1.5 px-3 text-xs disabled:opacity-35"
          >
            {t('common.next')}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      ) : null}
    </section>
  );

  const balanceCard = (
    <section
      data-testid="ultima-balance-overview"
      className={ultimaCardClassName}
      style={ultimaSurfaceStyle}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
            {t('balance.currentBalance')}
          </p>
          <p className="mt-2 truncate text-[32px] font-semibold leading-none text-white">
            {balanceLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleBalanceVisibility}
          aria-label={
            hiddenBalance
              ? t('common.show', { defaultValue: 'Показать' })
              : t('common.hide', { defaultValue: 'Скрыть' })
          }
          className="ultima-btn-pill ultima-btn-secondary flex h-10 w-10 items-center justify-center"
        >
          {hiddenBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.08em] text-white/[0.32]">
            {t('balance.incomeOnPage', { defaultValue: 'Зачисления' })}
          </p>
          <p className="mt-1 text-sm font-semibold text-[color:color-mix(in_srgb,var(--ultima-color-primary)_72%,white)]">
            +{formatAmount(pageIncome)} {currencySymbol}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.08em] text-white/[0.32]">
            {t('balance.expensesOnPage', { defaultValue: 'Списания' })}
          </p>
          <p className="mt-1 text-sm font-semibold text-rose-200">
            −{formatAmount(pageExpenses)} {currencySymbol}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate('/balance/top-up?returnTo=/balance')}
        className="ultima-btn-pill ultima-btn-primary mt-3 flex min-h-11 w-full items-center justify-center gap-2 px-4 text-sm font-semibold"
      >
        <Plus className="h-4 w-4" />
        {t('balance.topUpBalance')}
      </button>
    </section>
  );

  const bottomNav = <UltimaBottomNav active="profile" />;

  if (isDesktop) {
    return (
      <div
        data-testid="ultima-balance-history-page"
        className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-profile-desktop"
      >
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={<History className="h-5 w-5" />}
          eyebrow={t('balance.title')}
          title={t('profile.transactionsTitle', { defaultValue: 'История операций' })}
          subtitle={t('profile.transactionsDescription', {
            defaultValue: 'Все пополнения, списания и бонусы по балансу.',
          })}
          metrics={[
            { label: t('balance.currentBalance'), value: balanceLabel },
            {
              label: t('balance.operations', { defaultValue: 'Операции' }),
              value: String(transactions?.total ?? 0),
            },
            {
              label: t('balance.pageTurnover', { defaultValue: 'Оборот на странице' }),
              value: `${formatAmount(pageIncome + pageExpenses)} ${currencySymbol}`,
            },
          ]}
          heroActions={
            <button
              type="button"
              onClick={() => navigate('/balance/top-up?returnTo=/balance')}
              className="ultima-btn-pill ultima-btn-primary flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              {t('balance.topUpBalance')}
            </button>
          }
          aside={
            <UltimaDesktopPanel
              title={t('balance.accountSummary', { defaultValue: 'Сводка' })}
              subtitle={t('balance.accountSummaryHint', {
                defaultValue: 'Текущие итоги открытой страницы.',
              })}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5 text-sm">
                  <span className="text-white/[0.48]">
                    {t('balance.incomeOnPage', { defaultValue: 'Зачисления' })}
                  </span>
                  <strong className="text-[color:color-mix(in_srgb,var(--ultima-color-primary)_72%,white)]">
                    +{formatAmount(pageIncome)} {currencySymbol}
                  </strong>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5 text-sm">
                  <span className="text-white/[0.48]">
                    {t('balance.expensesOnPage', { defaultValue: 'Списания' })}
                  </span>
                  <strong className="text-rose-200">
                    −{formatAmount(pageExpenses)} {currencySymbol}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={toggleBalanceVisibility}
                  className="ultima-btn-pill ultima-btn-secondary mt-2 flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm"
                >
                  {hiddenBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {hiddenBalance
                    ? t('common.show', { defaultValue: 'Показать баланс' })
                    : t('common.hide', { defaultValue: 'Скрыть баланс' })}
                </button>
              </div>
            </UltimaDesktopPanel>
          }
          bottomNav={bottomNav}
        >
          {historyList}
        </UltimaDesktopSectionLayout>
      </div>
    );
  }

  return (
    <div
      data-testid="ultima-balance-history-page"
      className="ultima-shell ultima-shell-wide ultima-flat-frames"
    >
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <header className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[color:color-mix(in_srgb,var(--ultima-color-primary)_70%,white)]">
              <WalletCards className="h-4 w-4" />
              {t('balance.title')}
            </div>
            <h1 className="text-[34px] font-semibold leading-[0.96] text-white">
              {t('profile.transactionsTitle', { defaultValue: 'История операций' })}
            </h1>
          </div>
        </header>

        <main className="ultima-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pb-3">
          {balanceCard}
          {historyList}
        </main>

        <div className="ultima-mobile-dock-footer">
          <div className="ultima-nav-dock">{bottomNav}</div>
        </div>
      </div>
    </div>
  );
}
