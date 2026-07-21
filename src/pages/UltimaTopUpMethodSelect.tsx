import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  History,
  LoaderCircle,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { balanceApi } from '@/api/balance';
import PaymentMethodIcon from '@/components/PaymentMethodIcon';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import {
  UltimaDesktopPanel,
  UltimaDesktopSectionLayout,
} from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import { useCurrency } from '@/hooks/useCurrency';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { PaymentMethod } from '@/types';

type PaymentMethodCardProps = {
  method: PaymentMethod;
  name: string;
  description: string;
  rangeLabel: string;
  unavailableLabel: string;
  onSelect: () => void;
};

function PaymentMethodCard({
  method,
  name,
  description,
  rangeLabel,
  unavailableLabel,
  onSelect,
}: PaymentMethodCardProps) {
  return (
    <button
      data-testid={`ultima-payment-method-${method.id}`}
      type="button"
      disabled={!method.is_available}
      onClick={onSelect}
      className="group grid min-h-[92px] w-full grid-cols-[48px_minmax(0,1fr)_36px] items-center gap-3 rounded-2xl border border-white/[0.09] bg-[rgba(7,29,31,0.72)] px-3.5 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:border-emerald-200/25 enabled:hover:bg-[rgba(13,50,47,0.78)] enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] ring-1 ring-inset ring-white/[0.08]">
        <PaymentMethodIcon method={method.id} className="h-9 w-9" />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold leading-tight text-white/95">
          {name}
        </span>
        <span className="mt-1 line-clamp-1 block text-[12px] leading-snug text-white/[0.52]">
          {description}
        </span>
        <span className="mt-2 flex min-w-0 items-center gap-1.5 text-[11px] text-white/[0.62]">
          {method.is_available ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-200" />
          ) : (
            <Clock3 className="h-3.5 w-3.5 shrink-0 text-amber-200" />
          )}
          <span className="truncate">{method.is_available ? rangeLabel : unavailableLabel}</span>
        </span>
      </span>

      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-white/[0.46] transition group-enabled:group-hover:bg-emerald-300/[0.12] group-enabled:group-hover:text-emerald-100">
        {method.is_available ? (
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        ) : (
          <Clock3 className="h-4 w-4" />
        )}
      </span>
    </button>
  );
}

function PaymentMethodsSkeleton() {
  return (
    <div className="grid gap-2.5 lg:grid-cols-2" aria-label="Загрузка способов оплаты">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="grid min-h-[92px] animate-pulse grid-cols-[48px_minmax(0,1fr)_36px] items-center gap-3 rounded-2xl bg-white/[0.035] px-3.5 py-3"
        >
          <div className="h-12 w-12 rounded-xl bg-white/[0.07]" />
          <div className="space-y-2">
            <div className="h-3.5 w-28 rounded bg-white/[0.08]" />
            <div className="h-3 w-40 max-w-full rounded bg-white/[0.05]" />
            <div className="h-3 w-20 rounded bg-white/[0.05]" />
          </div>
          <LoaderCircle className="h-4 w-4 animate-spin text-white/20" />
        </div>
      ))}
    </div>
  );
}

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

  const amountParam = searchParams.get('amount');
  const requestedAmountRub = amountParam ? Number(amountParam) : null;
  const hasRequestedAmount =
    requestedAmountRub !== null && Number.isFinite(requestedAmountRub) && requestedAmountRub > 0;
  const returnTo = searchParams.get('returnTo');
  const availableMethods = paymentMethods?.filter((method) => method.is_available) ?? [];
  const availableCount = availableMethods.length;
  const overallMinimum =
    availableMethods.length > 0
      ? Math.min(...availableMethods.map((method) => method.min_amount_kopeks / 100))
      : null;
  const overallMaximum =
    availableMethods.length > 0
      ? Math.max(...availableMethods.map((method) => method.max_amount_kopeks / 100))
      : null;
  const requestedAmountLabel = hasRequestedAmount
    ? `${formatAmount(requestedAmountRub, requestedAmountRub % 1 === 0 ? 0 : 2)} ${currencySymbol}`
    : null;
  const overallRangeLabel =
    overallMinimum !== null && overallMaximum !== null
      ? `${formatAmount(overallMinimum, 0)} - ${formatAmount(overallMaximum, 0)} ${currencySymbol}`
      : '—';

  const handleMethodClick = (methodId: string) => {
    const params = new URLSearchParams();
    if (amountParam) params.set('amount', amountParam);
    if (returnTo) params.set('returnTo', returnTo);
    const query = params.toString();
    navigate(`/balance/top-up/${methodId}${query ? `?${query}` : ''}`);
  };

  const getMethodName = (method: PaymentMethod) => {
    const key = method.id.toLowerCase().replace(/-/g, '_');
    return t(`balance.paymentMethods.${key}.name`, { defaultValue: method.name });
  };

  const getMethodDescription = (method: PaymentMethod) => {
    const key = method.id.toLowerCase().replace(/-/g, '_');
    return t(`balance.paymentMethods.${key}.description`, {
      defaultValue:
        method.description ||
        t('balance.paymentOnlineDescription', { defaultValue: 'Онлайн-оплата' }),
    });
  };

  const renderMethods = () => {
    if (isLoading) return <PaymentMethodsSkeleton />;
    if (!paymentMethods || paymentMethods.length === 0) {
      return (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl bg-white/[0.035] px-5 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06] text-white/40">
            <CreditCard className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-white/80">{t('balance.noPaymentMethods')}</p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-white/45">
            {t('balance.paymentUnavailableHint', {
              defaultValue: 'Попробуйте обновить страницу немного позже.',
            })}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-2.5 lg:grid-cols-2">
        {paymentMethods.map((method) => (
          <PaymentMethodCard
            key={method.id}
            method={method}
            name={getMethodName(method)}
            description={getMethodDescription(method)}
            rangeLabel={t('balance.paymentRange', {
              min: formatAmount(method.min_amount_kopeks / 100, 0),
              max: formatAmount(method.max_amount_kopeks / 100, 0),
              currency: currencySymbol,
              defaultValue: `От ${formatAmount(method.min_amount_kopeks / 100, 0)} до ${formatAmount(method.max_amount_kopeks / 100, 0)} ${currencySymbol}`,
            })}
            unavailableLabel={t('balance.paymentUnavailable', {
              defaultValue: 'Временно недоступно',
            })}
            onSelect={() => handleMethodClick(method.id)}
          />
        ))}
      </div>
    );
  };

  const title = t('balance.selectPaymentMethod');
  const subtitle = hasRequestedAmount
    ? t('balance.paymentChoiceExactSubtitle', {
        defaultValue: 'Выберите способ — нужная сумма уже подставлена.',
      })
    : t('balance.paymentChoiceSubtitle', {
        defaultValue: 'Выберите удобный способ. Сумму укажете на следующем шаге.',
      });
  const bottomNav = <UltimaBottomNav active="profile" />;

  if (isDesktop) {
    return (
      <div
        data-testid="ultima-payment-method-page"
        className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-profile-desktop"
      >
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={<WalletCards className="h-5 w-5" />}
          eyebrow={t('balance.topUpBalance')}
          title={title}
          subtitle={subtitle}
          metrics={[
            {
              label: hasRequestedAmount
                ? t('balance.paymentRequestedAmount', { defaultValue: 'К пополнению' })
                : t('balance.paymentRangeLabel', { defaultValue: 'Диапазон сумм' }),
              value: requestedAmountLabel ?? overallRangeLabel,
              hint: hasRequestedAmount
                ? t('balance.paymentRequestedAmountHint', {
                    defaultValue: 'Сумма перенесена из оформления покупки.',
                  })
                : t('balance.paymentRangeHint', {
                    defaultValue: 'Точные ограничения указаны у каждого способа.',
                  }),
            },
            {
              label: t('common.available', { defaultValue: 'Доступно' }),
              value: String(availableCount),
              hint: t('balance.paymentAvailableHint', {
                defaultValue: 'Платёжных способов работают сейчас.',
              }),
            },
          ]}
          aside={
            <UltimaDesktopPanel
              title={t('balance.paymentProtected', { defaultValue: 'Защищённая оплата' })}
              subtitle={t('balance.paymentProtectedHint', {
                defaultValue: 'Платёж откроется на странице выбранного сервиса.',
              })}
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3 border-b border-white/[0.08] pb-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-300/[0.1] text-emerald-100">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white/90">
                      {t('balance.paymentBalanceDestination', {
                        defaultValue: 'Зачисление на баланс',
                      })}
                    </p>
                    <p className="text-white/48 mt-1 text-xs leading-relaxed">
                      {t('balance.paymentBalanceDestinationHint', {
                        defaultValue: 'Средства появятся на балансе после подтверждения платежа.',
                      })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/balance')}
                  className="ultima-btn-pill ultima-btn-secondary flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm"
                >
                  <History className="h-4 w-4" />
                  {t('profile.transactionsTitle', { defaultValue: 'История операций' })}
                </button>
              </div>
            </UltimaDesktopPanel>
          }
          bottomNav={bottomNav}
        >
          <section aria-labelledby="payment-methods-title">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h2 id="payment-methods-title" className="text-lg font-semibold text-white">
                  {t('balance.paymentAvailableMethods', { defaultValue: 'Доступные способы' })}
                </h2>
                <p className="text-white/48 mt-1 text-sm">
                  {t('balance.paymentAvailableCount', {
                    count: availableCount,
                    defaultValue: `Доступно: ${availableCount}`,
                  })}
                </p>
              </div>
            </div>
            {renderMethods()}
          </section>
        </UltimaDesktopSectionLayout>
      </div>
    );
  }

  return (
    <div
      data-testid="ultima-payment-method-page"
      className="ultima-shell ultima-shell-wide ultima-flat-frames"
    >
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <header className="mb-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-100/70">
            <WalletCards className="h-4 w-4" />
            {t('balance.topUpBalance')}
          </div>
          <h1 className="text-[36px] font-semibold leading-[0.98] text-white">{title}</h1>
          <p className="mt-2 max-w-[34rem] text-[14px] leading-snug text-white/[0.58]">
            {subtitle}
          </p>
        </header>

        <main className="ultima-scrollbar min-h-0 flex-1 overflow-y-auto pb-3">
          {hasRequestedAmount ? (
            <section
              data-testid="ultima-payment-requested-amount"
              className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-emerald-300/[0.09] px-4 py-3 ring-1 ring-inset ring-emerald-200/[0.12]"
            >
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.1em] text-emerald-100/55">
                  {t('balance.paymentRequestedAmount', { defaultValue: 'К пополнению' })}
                </p>
                <p className="mt-0.5 truncate text-xl font-semibold text-white">
                  {requestedAmountLabel}
                </p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-300/[0.12] text-emerald-100">
                <CreditCard className="h-5 w-5" />
              </span>
            </section>
          ) : null}

          <section aria-labelledby="payment-methods-title-mobile">
            <div className="mb-2.5 flex items-center justify-between gap-3 px-0.5">
              <h2
                id="payment-methods-title-mobile"
                className="text-[15px] font-semibold text-white/90"
              >
                {t('balance.paymentAvailableMethods', { defaultValue: 'Доступные способы' })}
              </h2>
              {!isLoading ? (
                <span className="text-[11px] text-white/55">
                  {t('balance.paymentAvailableCount', {
                    count: availableCount,
                    defaultValue: `Доступно: ${availableCount}`,
                  })}
                </span>
              ) : null}
            </div>
            {renderMethods()}
          </section>

          <footer className="mt-4 border-t border-white/[0.08] pt-3">
            <div className="flex items-start gap-2.5 px-1">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-100/75" />
              <p className="text-[11px] leading-relaxed text-white/45">
                {t('balance.paymentBalanceDestinationHint', {
                  defaultValue: 'Средства появятся на балансе после подтверждения платежа.',
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/balance')}
              className="mt-2 flex min-h-11 w-full items-center justify-between rounded-xl px-1 text-left text-sm text-white/70 transition hover:text-white"
            >
              <span className="flex items-center gap-2.5">
                <History className="h-4 w-4 text-white/45" />
                <span>
                  <span className="block font-medium">
                    {t('profile.transactionsTitle', { defaultValue: 'История операций' })}
                  </span>
                  <span className="text-white/38 mt-0.5 block text-[11px]">
                    {t('balance.paymentHistoryHint', {
                      defaultValue: 'Все пополнения и списания',
                    })}
                  </span>
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-white/35" />
            </button>
          </footer>
        </main>

        <div className="ultima-mobile-dock-footer">
          <div className="ultima-nav-dock">{bottomNav}</div>
        </div>
      </div>
    </div>
  );
}
