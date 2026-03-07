import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { balanceApi } from '@/api/balance';
import { useCurrency } from '@/hooks/useCurrency';
import { usePlatform } from '@/platform';
import type { PaymentMethod } from '@/types';
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
  const { methodId } = useParams<{ methodId: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { formatAmount, convertAmount, convertToRub, currencySymbol, targetCurrency } =
    useCurrency();
  const { openTelegramLink, openLink } = usePlatform();
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

  const initialAmountRub = searchParams.get('amount')
    ? Number(searchParams.get('amount'))
    : undefined;
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

  const topUpMutation = useMutation({
    mutationFn: async (amountKopeks: number) => {
      if (!method) throw new Error('method_not_found');
      return balanceApi.createTopUp(amountKopeks, method.id, selectedOption || undefined);
    },
    onSuccess: (result) => {
      setError(null);
      const url = result.payment_url;
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
    return <div className="h-[100dvh] w-full bg-transparent" />;
  }

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-transparent px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_70%_at_50%_45%,rgba(33,208,154,0.14),rgba(7,20,46,0.02)_62%,rgba(7,20,46,0)_100%)]" />
      <div className="relative z-10 mx-auto flex h-full min-h-0 max-w-md flex-col">
        <header className="mb-3">
          <h1 className="text-[36px] font-semibold leading-[0.9] tracking-[-0.01em] text-white">
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

        <section className="border-emerald-200/12 min-h-0 flex-1 overflow-y-auto rounded-3xl border bg-[rgba(12,45,42,0.18)] p-3 backdrop-blur-md">
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
            <div className="mb-3 grid grid-cols-2 gap-2">
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
          <div className="flex gap-2">
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
              className="rounded-2xl border border-[#52ecc6]/40 bg-[#12cd97] px-4 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] disabled:opacity-60"
            >
              {t('balance.topUp')}
            </button>
          </div>

          {quickRubles.length > 0 ? (
            <div className="mt-3 grid grid-cols-4 gap-2">
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
              <p className="text-[13px] font-medium text-emerald-100">
                {t('balance.paymentReady')}
              </p>
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

        <section className="mt-2 rounded-2xl border border-emerald-200/10 bg-emerald-950/20 px-3 py-2.5">
          <p className="text-white/58 text-[11px] leading-snug">
            {t('balance.ultimaBalanceNotice', {
              defaultValue:
                'После пополнения сумма попадает на баланс и затем списывается в оплату подписки.',
            })}
          </p>
        </section>

        <section className="pt-3">
          <UltimaBottomNav active="profile" />
        </section>
      </div>
    </div>
  );
}
