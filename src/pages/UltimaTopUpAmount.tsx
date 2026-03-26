import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { balanceApi } from '@/api/balance';
import {
  UltimaDesktopPanel,
  UltimaDesktopSectionLayout,
} from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import { useCurrency } from '@/hooks/useCurrency';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePendingTopUpFollowUp } from '@/hooks/usePendingTopUpFollowUp';
import { usePlatform } from '@/platform';
import { useCloseOnSuccessNotification } from '@/store/successNotification';
import { useAuthStore } from '@/store/auth';
import type { PaymentMethod } from '@/types';
import { writePendingTopUpFollowUp } from '@/utils/topUpFollowUp';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';

const OpenIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
    />
  </svg>
);

const CopyIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
  </svg>
);

const MethodIcon = ({ methodId }: { methodId: string }) => {
  const id = methodId.toLowerCase();
  if (id.includes('stars')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="m12 2.8 2.6 5.3 5.8.84-4.2 4.1 1 5.8L12 16.2 6.8 18.8l1-5.8-4.2-4.1 5.8-.84L12 2.8Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (id.includes('crypto') || id.includes('usdt') || id.includes('ton')) {
    return (
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
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <rect
        x="3.5"
        y="6.5"
        width="17"
        height="11"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M3.5 10h17" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.5 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
};

export function UltimaTopUpAmount() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { methodId } = useParams<{ methodId: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { formatAmount, convertAmount, convertToRub, currencySymbol, targetCurrency } =
    useCurrency();
  const { openTelegramLink, openLink } = usePlatform();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { data: methodsData } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: balanceApi.getPaymentMethods,
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const methods =
    methodsData ?? queryClient.getQueryData<PaymentMethod[]>(['payment-methods']) ?? [];
  const method = methods.find((item) => item.id === methodId);
  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });

  const initialAmountRub = searchParams.get('amount')
    ? Number(searchParams.get('amount'))
    : undefined;
  const returnTo = searchParams.get('returnTo');
  const [amount, setAmount] = useState(() => {
    if (!initialAmountRub || Number.isNaN(initialAmountRub) || initialAmountRub <= 0) return '';
    if (targetCurrency === 'RUB' || targetCurrency === 'IRR')
      return String(Math.ceil(convertAmount(initialAmountRub)));
    return convertAmount(initialAmountRub).toFixed(2);
  });
  const [selectedOption, setSelectedOption] = useState<string | null>(
    method?.options?.[0]?.id ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const minRub = (method?.min_amount_kopeks ?? 0) / 100;
  const maxRub = (method?.max_amount_kopeks ?? 0) / 100;
  const quickRubles = [100, 300, 500, 1000].filter((value) => value >= minRub && value <= maxRub);

  const openPayment = useCallback(
    (url: string) => {
      if (url.includes('t.me/')) {
        openTelegramLink(url);
      } else {
        openLink(url);
      }
    },
    [openLink, openTelegramLink],
  );

  const handleSuccess = useCallback(() => {
    navigate(returnTo || '/subscription', { replace: true });
  }, [navigate, returnTo]);

  useCloseOnSuccessNotification(handleSuccess);
  usePendingTopUpFollowUp();

  const topUpMutation = useMutation({
    mutationFn: async (amountKopeks: number) => {
      if (!method) throw new Error('method_not_found');
      return balanceApi.createTopUp(amountKopeks, method.id, selectedOption || undefined);
    },
    onSuccess: (result, amountKopeks) => {
      setError(null);
      const url = result.payment_url;
      writePendingTopUpFollowUp(userId, {
        amountKopeks,
        balanceBeforeKopeks: Math.max(0, balanceData?.balance_kopeks ?? 0),
      });
      setPaymentUrl(url);
      openPayment(url);
    },
    onError: (err: unknown) => {
      const detail =
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.detail ??
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.message;
      setError(detail || t('common.error'));
    },
  });

  const handleCreatePayment = () => {
    setError(null);
    setPaymentUrl(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError(t('balance.errors.enterAmount'));
      return;
    }
    const rubles = convertToRub(value);
    if (rubles < minRub || rubles > maxRub) {
      setError(t('balance.errors.amountRange', { min: minRub, max: maxRub }));
      return;
    }
    topUpMutation.mutate(Math.round(rubles * 100));
  };

  const handleQuick = (valueRub: number) => {
    const converted =
      targetCurrency === 'RUB' || targetCurrency === 'IRR'
        ? String(Math.round(convertAmount(valueRub)))
        : convertAmount(valueRub).toFixed(2);
    setAmount(converted);
    inputRef.current?.focus();
  };

  const handleCopyUrl = async () => {
    if (!paymentUrl) return;
    await navigator.clipboard.writeText(paymentUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const methodName = useMemo(() => {
    if (!method) return '';
    const key = method.id.toLowerCase().replace(/-/g, '_');
    return t(`balance.paymentMethods.${key}.name`, { defaultValue: method.name });
  }, [method, t]);

  if (!method) {
    return <div className="min-h-[100dvh] min-h-[100svh] w-full bg-transparent" />;
  }

  const bottomNav = <UltimaBottomNav active="profile" />;

  const amountContent = (
    <>
      <section className="border-emerald-200/12 min-h-0 flex-1 overflow-y-auto rounded-3xl border bg-[rgba(12,45,42,0.18)] p-3 backdrop-blur-md lg:overflow-visible lg:p-4">
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-emerald-200/10 bg-emerald-950/30 px-3 py-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200/15 bg-emerald-900/45 text-emerald-100">
            <MethodIcon methodId={method.id} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium text-white/95">{methodName}</p>
            <p className="text-[11px] text-white/55">
              {formatAmount(minRub, 0)} - {formatAmount(maxRub, 0)} {currencySymbol}
            </p>
          </div>
        </div>

        {method.options && method.options.length > 0 ? (
          <div className="mb-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            {method.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedOption(option.id)}
                className={`rounded-xl border px-3 py-2 text-left text-sm ${
                  selectedOption === option.id
                    ? 'bg-emerald-500/12 border-emerald-300/45 text-white'
                    : 'border-emerald-200/10 bg-emerald-950/30 text-white/75'
                }`}
              >
                {option.name}
              </button>
            ))}
          </div>
        ) : null}

        <div className="text-white/62 mb-2 text-[12px]">{t('balance.enterAmount')}</div>
        <div className="flex flex-col gap-2 min-[360px]:flex-row">
          <div className="border-emerald-200/12 relative flex-1 rounded-2xl border bg-emerald-950/35">
            <input
              ref={inputRef}
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="h-12 w-full bg-transparent px-3 pr-10 text-lg font-semibold text-white outline-none"
              placeholder="0"
              inputMode="decimal"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
              {currencySymbol}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCreatePayment}
            disabled={topUpMutation.isPending}
            className="rounded-2xl border border-[#52ecc6]/40 bg-[#12cd97] px-4 py-3 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] disabled:opacity-60 min-[360px]:py-0"
          >
            {t('balance.topUp')}
          </button>
        </div>

        {quickRubles.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-2 min-[360px]:grid-cols-4">
            {quickRubles.map((value) => (
              <button
                key={value}
                type="button"
                className={`rounded-xl border px-2 py-2 text-[13px] transition ${
                  amount ===
                  (targetCurrency === 'RUB' || targetCurrency === 'IRR'
                    ? String(Math.round(convertAmount(value)))
                    : convertAmount(value).toFixed(2))
                    ? 'bg-emerald-500/12 border-emerald-300/45 text-white'
                    : 'border-emerald-200/10 bg-emerald-950/30 text-white/85 hover:border-emerald-200/25'
                }`}
                onClick={() => handleQuick(value)}
              >
                {formatAmount(value, 0)}
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="bg-red-500/12 mt-3 rounded-xl border border-red-400/30 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {paymentUrl ? (
          <div className="mt-3 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-3">
            <p className="text-[13px] font-medium text-emerald-100">{t('balance.paymentReady')}</p>
            <button
              type="button"
              onClick={() => openPayment(paymentUrl)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#52ecc6]/40 bg-[#12cd97] px-3 py-2.5 text-sm font-medium text-white"
            >
              <OpenIcon />
              {t('balance.openPaymentPage')}
            </button>
            <div className="mt-2 flex items-center gap-2">
              <div className="min-w-0 flex-1 rounded-lg border border-emerald-200/10 bg-emerald-950/30 px-2.5 py-2">
                <p className="truncate text-[11px] text-white/55">{paymentUrl}</p>
              </div>
              <button
                type="button"
                onClick={() => void handleCopyUrl()}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200/15 bg-emerald-900/40 text-white/80"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-emerald-200/10 bg-emerald-950/20 px-3 py-2.5">
        <p className="text-white/58 text-[11px] leading-snug">
          {t('balance.ultimaBalanceNotice', {
            defaultValue:
              'После пополнения сумма попадает на баланс и затем списывается в оплату подписки.',
          })}
        </p>
      </section>
    </>
  );

  if (isDesktop) {
    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-profile-desktop">
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={<MethodIcon methodId={method.id} />}
          eyebrow={methodName}
          title={methodName}
          subtitle={t('balance.ultimaBalanceNotice', {
            defaultValue:
              'Укажите сумму, получите ссылку и сразу откройте оплату в выбранном методе.',
          })}
          metrics={[
            {
              label: t('balance.amount', { defaultValue: 'Диапазон' }),
              value: `${formatAmount(minRub, 0)} - ${formatAmount(maxRub, 0)} ${currencySymbol}`,
              hint: t('payment.desktopRangeHint', {
                defaultValue: 'Минимальная и максимальная сумма зависят от платежного метода.',
              }),
            },
            {
              label: t('balance.enterAmount', { defaultValue: 'Сумма' }),
              value: amount || '0',
              hint: t('payment.desktopAmountHint', {
                defaultValue: 'Введите сумму вручную или используйте быстрые варианты ниже.',
              }),
            },
            {
              label: t('common.status', { defaultValue: 'Статус' }),
              value: topUpMutation.isPending
                ? t('common.loading', { defaultValue: 'Загрузка...' })
                : paymentUrl
                  ? t('payment.desktopReady', { defaultValue: 'Ссылка готова' })
                  : t('payment.desktopDraft', { defaultValue: 'Черновик' }),
              hint:
                error ||
                t('payment.desktopStatusHint', {
                  defaultValue: 'После создания ссылки откроется окно платежа.',
                }),
            },
          ]}
          aside={
            <UltimaDesktopPanel
              title={t('payment.desktopAsideTitle', { defaultValue: 'Оплата' })}
              subtitle={t('payment.desktopAsideHint', {
                defaultValue:
                  'Ссылка на оплату создается под выбранную сумму и открывается сразу после генерации.',
              })}
            >
              <div className="space-y-3">
                {quickRubles.length > 0 ? (
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div className="text-white/42 text-[11px] uppercase tracking-[0.2em]">
                      {t('balance.quickAmounts', { defaultValue: 'Быстрые суммы' })}
                    </div>
                    <div className="mt-2 text-sm font-medium text-white/90">
                      {quickRubles.map((value) => formatAmount(value, 0)).join(' • ')}
                    </div>
                  </div>
                ) : null}
                <div className="text-white/72 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-[1.6]">
                  {t('balance.ultimaBalanceNotice', {
                    defaultValue:
                      'После пополнения сумма попадает на баланс и затем списывается в оплату подписки.',
                  })}
                </div>
              </div>
            </UltimaDesktopPanel>
          }
          bottomNav={bottomNav}
        >
          {amountContent}
        </UltimaDesktopSectionLayout>
      </div>
    );
  }

  return (
    <div className="ultima-shell ultima-shell-wide ultima-flat-frames">
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner lg:max-w-[960px]">
        <header className="mb-3">
          <h1 className="text-[clamp(32px,8.5vw,36px)] font-semibold leading-[0.9] tracking-[-0.01em] text-white [overflow-wrap:anywhere]">
            {methodName}
          </h1>
          <p className="text-white/62 mt-1.5 text-[13px] leading-tight">
            {t('balance.ultimaBalanceNotice', {
              defaultValue:
                'Средства поступят на баланс и автоматически учтутся в стоимости подписки.',
            })}
          </p>
          <p className="mt-1 text-[11px] text-white/45">
            {formatAmount(minRub, 0)} - {formatAmount(maxRub, 0)} {currencySymbol}
          </p>
        </header>

        {amountContent}

        <div className="ultima-nav-dock">{bottomNav}</div>
      </div>
    </div>
  );
}
