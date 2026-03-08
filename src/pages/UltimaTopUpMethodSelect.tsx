import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useState, type ReactNode } from 'react';
import { balanceApi } from '@/api/balance';
import { useCurrency } from '@/hooks/useCurrency';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';

const CardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="3.5" y="6.5" width="17" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.5 10h17" stroke="currentColor" strokeWidth="1.8" />
    <path d="M7.5 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const CryptoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M9 9.8h4a1.8 1.8 0 0 1 0 3.6H9V9.8Zm0 3.6h4.4a1.8 1.8 0 0 1 0 3.6H9v-3.6Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path d="M11 8v8M13 8v8" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const StarsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="m12 2.8 2.6 5.3 5.8.84-4.2 4.1 1 5.8L12 16.2 6.8 18.8l1-5.8-4.2-4.1 5.8-.84L12 2.8Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path d="M9 5.5 15 12l-6 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const getMethodVisual = (
  methodId: string,
): {
  icon: ReactNode;
  iconBoxClassName: string;
} => {
  const id = methodId.toLowerCase();
  if (id.includes('stars')) {
    return {
      icon: <StarsIcon />,
      iconBoxClassName:
        'text-amber-200 border-amber-200/25 bg-gradient-to-br from-amber-400/30 to-orange-500/30',
    };
  }
  if (id.includes('crypto') || id.includes('usdt') || id.includes('ton')) {
    return {
      icon: <CryptoIcon />,
      iconBoxClassName:
        'text-cyan-200 border-cyan-200/25 bg-gradient-to-br from-cyan-400/25 to-emerald-500/25',
    };
  }
  return {
    icon: <CardIcon />,
    iconBoxClassName:
      'text-sky-200 border-sky-200/25 bg-gradient-to-br from-sky-400/25 to-indigo-500/25',
  };
};

export function UltimaTopUpMethodSelect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { formatAmount, currencySymbol } = useCurrency();
  const [promocode, setPromocode] = useState('');
  const [promocodeLoading, setPromocodeLoading] = useState(false);
  const [promocodeError, setPromocodeError] = useState<string | null>(null);
  const [promocodeSuccess, setPromocodeSuccess] = useState<string | null>(null);

  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: balanceApi.getPaymentMethods,
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const handleMethodClick = (methodId: string) => {
    const params = new URLSearchParams();
    const amount = searchParams.get('amount');
    const returnTo = searchParams.get('returnTo');
    if (amount) params.set('amount', amount);
    if (returnTo) params.set('returnTo', returnTo);
    const qs = params.toString();
    navigate(`/balance/top-up/${methodId}${qs ? `?${qs}` : ''}`);
  };

  const handlePromocodeActivate = async () => {
    const code = promocode.trim();
    if (!code || promocodeLoading) return;

    setPromocodeLoading(true);
    setPromocodeError(null);
    setPromocodeSuccess(null);

    try {
      const result = await balanceApi.activatePromocode(code);
      if (result.success) {
        setPromocodeSuccess(result.bonus_description || t('balance.promocode.success'));
        setPromocode('');
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['balance'] }),
          queryClient.invalidateQueries({ queryKey: ['transactions'] }),
          queryClient.invalidateQueries({ queryKey: ['subscription'] }),
        ]);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const errorDetail = axiosError.response?.data?.detail || 'server_error';
      const normalized = errorDetail.toLowerCase();
      const errorKey = normalized.includes('not found')
        ? 'not_found'
        : normalized.includes('expired')
          ? 'expired'
          : normalized.includes('fully used')
            ? 'used'
            : normalized.includes('already used')
              ? 'already_used_by_user'
              : 'server_error';
      setPromocodeError(t(`balance.promocode.errors.${errorKey}`));
    } finally {
      setPromocodeLoading(false);
    }
  };

  return (
    <div className="ultima-shell ultima-flat-frames">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_70%_at_50%_45%,rgba(33,208,154,0.14),rgba(7,20,46,0.02)_62%,rgba(7,20,46,0)_100%)]" />
      <div className="ultima-shell-inner">
        <header className="mb-3">
          <h1 className="text-[clamp(34px,9.5vw,44px)] font-semibold leading-[0.9] tracking-[-0.01em] text-white">
            {t('balance.selectPaymentMethod', { defaultValue: 'Способ оплаты' })}
          </h1>
          <p className="text-white/62 mt-1.5 text-[14px] leading-tight">
            {t('balance.ultimaBalanceNotice', {
              defaultValue:
                'При пополнении средства зачисляются на баланс и затем учитываются в стоимости подписки.',
            })}
          </p>
        </header>

        <section className="border-emerald-200/12 min-h-0 flex-1 overflow-y-auto rounded-3xl border bg-[rgba(12,45,42,0.18)] p-3 backdrop-blur-md">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/40 border-t-transparent" />
            </div>
          ) : !paymentMethods || paymentMethods.length === 0 ? (
            <div className="text-white/62 py-8 text-center text-sm">
              {t('balance.noPaymentMethods')}
            </div>
          ) : (
            <div className="space-y-2">
              {paymentMethods.map((method) => {
                const methodKey = method.id.toLowerCase().replace(/-/g, '_');
                const visual = getMethodVisual(method.id);
                const translatedName = t(`balance.paymentMethods.${methodKey}.name`, {
                  defaultValue: '',
                });
                const translatedDesc = t(`balance.paymentMethods.${methodKey}.description`, {
                  defaultValue: '',
                });

                return (
                  <button
                    key={method.id}
                    type="button"
                    disabled={!method.is_available}
                    onClick={() => handleMethodClick(method.id)}
                    className="group flex w-full items-start gap-3 rounded-2xl border border-emerald-200/10 bg-emerald-950/30 px-3 py-3 text-left transition enabled:hover:border-emerald-200/25 enabled:hover:bg-emerald-900/25 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${visual.iconBoxClassName}`}
                    >
                      {visual.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[15px] font-medium leading-tight text-white/95">
                          {translatedName || method.name}
                        </p>
                        <span className="mt-0.5 shrink-0 text-white/55 transition group-hover:translate-x-0.5 group-hover:text-white/80">
                          <ArrowIcon />
                        </span>
                      </div>
                      {(translatedDesc || method.description) && (
                        <p className="text-white/58 mt-1 line-clamp-2 text-[12px]">
                          {translatedDesc || method.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="rounded-full border border-emerald-200/15 bg-emerald-900/45 px-2 py-0.5 text-[10px] text-white/60">
                          {t('balance.amount', { defaultValue: 'Сумма' })}
                        </span>
                        <span className="text-[11px] text-white/55">
                          {formatAmount(method.min_amount_kopeks / 100, 0)} -{' '}
                          {formatAmount(method.max_amount_kopeks / 100, 0)} {currencySymbol}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-2 rounded-2xl border border-emerald-200/10 bg-emerald-950/20 px-3 py-2.5">
          <p className="text-white/68 mb-2 text-[12px]">{t('balance.promocode.title')}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={promocode}
              onChange={(e) => setPromocode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handlePromocodeActivate();
                }
              }}
              placeholder={t('balance.promocode.placeholder')}
              disabled={promocodeLoading}
              className="border-emerald-200/12 h-10 min-w-0 flex-1 rounded-xl border bg-emerald-950/35 px-3 text-[13px] text-white placeholder:text-white/35 focus:border-emerald-200/30 focus:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void handlePromocodeActivate()}
              disabled={promocodeLoading || !promocode.trim()}
              className="h-10 shrink-0 rounded-xl border border-sky-200/30 bg-sky-500/85 px-3 text-[12px] font-medium text-white transition hover:bg-sky-400/90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {promocodeLoading ? t('common.loading') : t('balance.promocode.activate')}
            </button>
          </div>
          {promocodeError ? (
            <p className="mt-2 text-[12px] text-rose-200">{promocodeError}</p>
          ) : null}
          {promocodeSuccess ? (
            <p className="mt-2 text-[12px] text-emerald-200">{promocodeSuccess}</p>
          ) : null}
        </section>

        <section className="mt-2 rounded-2xl border border-emerald-200/10 bg-emerald-950/20 px-3 py-2.5">
          <p className="text-white/58 text-[11px] leading-snug">
            {t('balance.ultimaBalanceNotice', {
              defaultValue:
                'Деньги зачисляются на баланс, а затем автоматически учитываются в оплате подписки.',
            })}
          </p>
        </section>

        <div className="ultima-nav-dock">
          <UltimaBottomNav active="profile" />
        </div>
      </div>
    </div>
  );
}
