import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { type ReactNode } from 'react';
import { balanceApi } from '@/api/balance';
import {
  UltimaDesktopPanel,
  UltimaDesktopSectionLayout,
} from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import { useCurrency } from '@/hooks/useCurrency';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';

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
  const { formatAmount, currencySymbol } = useCurrency();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

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

  const bottomNav = <UltimaBottomNav active="profile" />;

  const methodsContent = (
    <>
      <section className="border-emerald-200/12 min-h-0 flex-1 overflow-y-auto rounded-3xl border bg-[rgba(12,45,42,0.18)] p-3 backdrop-blur-md lg:overflow-visible lg:p-4">
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
                      <p className="line-clamp-2 break-words text-[15px] font-medium leading-tight text-white/95">
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

      <section className="rounded-2xl border border-emerald-200/10 bg-emerald-950/20 px-3 py-2.5">
        <p className="text-white/58 text-[11px] leading-snug">
          {t('balance.ultimaBalanceNotice', {
            defaultValue:
              'Деньги зачисляются на баланс, а затем автоматически учитываются в оплате подписки.',
          })}
        </p>
      </section>

      <section className="rounded-2xl border border-emerald-200/10 bg-emerald-950/20 p-3">
        <p className="text-white/72 mb-2 text-[12px]">
          {t('profile.transactionsTitle', { defaultValue: 'История операций' })}
        </p>
        <button
          type="button"
          onClick={() => navigate('/balance')}
          className="border-emerald-200/12 w-full rounded-xl border bg-emerald-900/35 px-3 py-2 text-left text-[13px] text-white/85 transition hover:bg-emerald-900/50"
        >
          {t('profile.transactionsDescription', {
            defaultValue: 'Открыть страницу истории операций',
          })}
        </button>
      </section>
    </>
  );

  if (isDesktop) {
    const availableCount = paymentMethods?.filter((method) => method.is_available).length ?? 0;

    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-profile-desktop">
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={<CardIcon />}
          eyebrow={t('balance.selectPaymentMethod', { defaultValue: 'Способ оплаты' })}
          title={t('balance.selectPaymentMethod', { defaultValue: 'Способ оплаты' })}
          subtitle={t('balance.ultimaBalanceNotice', {
            defaultValue:
              'Выберите удобный способ пополнения. Деньги сначала поступят на баланс, а потом спишутся в оплату подписки.',
          })}
          metrics={[
            {
              label: t('common.available', { defaultValue: 'Доступно' }),
              value: String(availableCount),
              hint: t('payment.desktopAvailableHint', {
                defaultValue: 'Количество платежных методов, доступных прямо сейчас.',
              }),
            },
            {
              label: t('balance.amount', { defaultValue: 'Сумма' }),
              value:
                paymentMethods && paymentMethods.length > 0
                  ? `${formatAmount(paymentMethods[0].min_amount_kopeks / 100, 0)} - ${formatAmount(paymentMethods[0].max_amount_kopeks / 100, 0)} ${currencySymbol}`
                  : '—',
              hint: t('payment.desktopRangeHint', {
                defaultValue: 'Фактический диапазон зависит от выбранного метода.',
              }),
            },
          ]}
          aside={
            <UltimaDesktopPanel
              title={t('payment.desktopAsideTitle', { defaultValue: 'Что дальше' })}
              subtitle={t('payment.desktopAsideHint', {
                defaultValue:
                  'После пополнения сумма останется на балансе и будет списываться в нужный момент автоматически.',
              })}
            >
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => navigate('/balance')}
                  className="ultima-btn-pill ultima-btn-secondary w-full px-4 py-2.5 text-sm"
                >
                  {t('profile.transactionsTitle', { defaultValue: 'История операций' })}
                </button>
                <div className="text-white/72 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-[1.6]">
                  {t('balance.ultimaBalanceNotice', {
                    defaultValue:
                      'Деньги зачисляются на баланс, а затем автоматически учитываются в оплате подписки.',
                  })}
                </div>
              </div>
            </UltimaDesktopPanel>
          }
          bottomNav={bottomNav}
        >
          {methodsContent}
        </UltimaDesktopSectionLayout>
      </div>
    );
  }

  return (
    <div className="ultima-shell ultima-shell-wide ultima-flat-frames">
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner lg:max-w-[960px]">
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

        {methodsContent}

        <div className="ultima-nav-dock">{bottomNav}</div>
      </div>
    </div>
  );
}
