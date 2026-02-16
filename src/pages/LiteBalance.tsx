import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '../store/auth';
import { balanceApi } from '../api/balance';
import { useCurrency } from '../hooks/useCurrency';
import { API } from '../config/constants';
import { useToast } from '../components/Toast';
import type { PaginatedResponse, Transaction } from '../types';

const ArrowRightIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export default function LiteBalance() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthStore();
  const { formatAmount, currencySymbol } = useCurrency();
  const { showToast } = useToast();
  const paymentHandledRef = useRef(false);

  const [promocode, setPromocode] = useState('');
  const [promocodeLoading, setPromocodeLoading] = useState(false);
  const [promocodeError, setPromocodeError] = useState<string | null>(null);
  const [promocodeSuccess, setPromocodeSuccess] = useState<string | null>(null);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const { data: balanceData, refetch: refetchBalance } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: API.BALANCE_STALE_TIME_MS,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (paymentHandledRef.current) return;

    const paymentStatus = searchParams.get('payment') || searchParams.get('status');
    const isSuccess =
      paymentStatus === 'success' ||
      paymentStatus === 'paid' ||
      paymentStatus === 'completed' ||
      searchParams.get('success') === 'true';

    if (isSuccess) {
      paymentHandledRef.current = true;

      refetchBalance();
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });

      showToast({
        type: 'success',
        title: t('balance.paymentSuccess.title'),
        message: t('balance.paymentSuccess.message'),
        duration: 6000,
      });

      navigate('/balance', { replace: true });
    }
  }, [searchParams, navigate, refetchBalance, refreshUser, queryClient, showToast, t]);

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: balanceApi.getPaymentMethods,
  });

  const { data: transactions } = useQuery<PaginatedResponse<Transaction>>({
    queryKey: ['transactions', 1, 'lite'],
    queryFn: () => balanceApi.getTransactions({ per_page: 5, page: 1 }),
  });

  const normalizeType = (type: string) => type?.toUpperCase?.() ?? type;

  const getTypeLabel = (type: string) => {
    switch (normalizeType(type)) {
      case 'DEPOSIT':
        return t('balance.deposit');
      case 'SUBSCRIPTION_PAYMENT':
        return t('balance.subscriptionPayment');
      case 'REFERRAL_REWARD':
        return t('balance.referralReward');
      case 'WITHDRAWAL':
        return t('balance.withdrawal');
      default:
        return type;
    }
  };

  const handlePromocodeActivate = async () => {
    if (!promocode.trim()) return;

    setPromocodeLoading(true);
    setPromocodeError(null);
    setPromocodeSuccess(null);

    try {
      const result = await balanceApi.activatePromocode(promocode.trim());
      if (result.success) {
        setPromocodeSuccess(result.bonus_description || t('balance.promocode.success'));
        setPromocode('');
        await refetchBalance();
        await refreshUser();
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        showToast({
          type: 'success',
          title: t('balance.promocode.title'),
          message: result.bonus_description || t('balance.promocode.success'),
          duration: 3500,
        });
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const errorDetail = axiosError.response?.data?.detail || 'server_error';
      const errorKey = errorDetail.toLowerCase().includes('not found')
        ? 'not_found'
        : errorDetail.toLowerCase().includes('expired')
          ? 'expired'
          : errorDetail.toLowerCase().includes('fully used')
            ? 'used'
            : errorDetail.toLowerCase().includes('already used')
              ? 'already_used_by_user'
              : 'server_error';
      setPromocodeError(t(`balance.promocode.errors.${errorKey}`));
    } finally {
      setPromocodeLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6">
      <div className="rounded-2xl border border-dark-600 bg-gradient-to-br from-accent-500/15 via-dark-800/85 to-dark-800/80 p-4 shadow-lg shadow-black/5">
        <div className="text-xs font-medium tracking-wide text-dark-400">{t('balance.currentBalance')}</div>
        <div className="mt-1 text-3xl font-bold text-dark-100">
          {formatAmount(balanceData?.balance_rubles || 0)}
          <span className="ml-2 text-lg text-dark-400">{currencySymbol}</span>
        </div>
      </div>

      {paymentMethods && paymentMethods.length > 0 && (
        <div className="rounded-2xl border border-dark-600 bg-dark-800/80 p-4">
          <h2 className="mb-3 text-sm font-semibold text-dark-100">{t('balance.topUpBalance')}</h2>
          <div className="space-y-2">
            {paymentMethods
              .filter((method) => method.is_available)
              .slice(0, 3)
              .map((method) => (
                <button
                  key={method.id}
                  onClick={() => navigate(`/balance/top-up/${method.id}`)}
                  className="group flex w-full items-center justify-between rounded-xl border border-dark-600 bg-dark-700/60 px-3 py-2.5 text-left transition-colors hover:border-dark-500 hover:bg-dark-700"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-dark-100">{method.name}</div>
                    <div className="text-xs text-dark-500">
                      {formatAmount(method.min_amount_kopeks / 100, 0)} -{' '}
                      {formatAmount(method.max_amount_kopeks / 100, 0)} {currencySymbol}
                    </div>
                  </div>
                  <div className="text-dark-400 transition-transform duration-200 group-hover:translate-x-0.5">
                    <ArrowRightIcon />
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-dark-600 bg-dark-800/80 p-4">
        <h2 className="mb-3 text-sm font-semibold text-dark-100">{t('balance.promocode.title')}</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={promocode}
            onChange={(e) => setPromocode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePromocodeActivate()}
            placeholder={t('balance.promocode.placeholder')}
            className="flex-1 rounded-xl border border-dark-600 bg-dark-700/60 px-3 py-2.5 text-sm text-dark-100 placeholder:text-dark-500 focus:border-accent-500 focus:outline-none"
            disabled={promocodeLoading}
          />
          <button
            onClick={handlePromocodeActivate}
            disabled={!promocode.trim() || promocodeLoading}
            className="rounded-xl bg-accent-500 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {promocodeLoading ? t('common.loading') : t('balance.promocode.activate')}
          </button>
        </div>
        {promocodeError && <div className="mt-2 text-xs text-error-400">{promocodeError}</div>}
        {promocodeSuccess && <div className="mt-2 text-xs text-success-400">{promocodeSuccess}</div>}
      </div>

      <div className="rounded-2xl border border-dark-600 bg-dark-800/80 p-4">
        <h2 className="mb-3 text-sm font-semibold text-dark-100">{t('balance.transactionHistory')}</h2>
        {transactions?.items?.length ? (
          <div className="space-y-2">
            {transactions.items.map((tx) => {
              const isPositive = tx.amount_rubles >= 0;
              const sign = isPositive ? '+' : '-';
              const amountClass = isPositive ? 'text-success-400' : 'text-error-400';
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl border border-dark-700/60 bg-dark-700/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs text-dark-300">{getTypeLabel(tx.type)}</div>
                    <div className="text-2xs text-dark-500">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${amountClass}`}>
                    {sign}
                    {formatAmount(Math.abs(tx.amount_rubles))} {currencySymbol}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-dark-400">{t('balance.noTransactions')}</div>
        )}
      </div>
    </div>
  );
}
