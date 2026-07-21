import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Copy,
  ExternalLink,
  History,
  LoaderCircle,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { balanceApi } from '@/api/balance';
import PaymentMethodIcon from '@/components/PaymentMethodIcon';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import {
  UltimaDesktopPanel,
  UltimaDesktopSectionLayout,
} from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import {
  ultimaCardClassName,
  ultimaPaneClassName,
  ultimaPaneSurfaceStyle,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';
import { useCurrency } from '@/hooks/useCurrency';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useHaptic, usePlatform } from '@/platform';
import { useCloseOnSuccessNotification } from '@/store/successNotification';
import { useAuthStore } from '@/store/auth';
import type { PaymentMethod } from '@/types';
import { copyToClipboard } from '@/utils/clipboard';
import { checkRateLimit, getRateLimitResetTime, RATE_LIMIT_KEYS } from '@/utils/rateLimit';
import { writePendingTopUpFollowUp } from '@/utils/topUpFollowUp';

type CreatedPayment =
  | { kind: 'external'; url: string }
  | { kind: 'stars'; status: Awaited<ReturnType<ReturnType<typeof usePlatform>['openInvoice']>> };

const normalizeAmount = (value: string) => Number(value.replace(',', '.'));

export function UltimaTopUpAmount() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { methodId } = useParams<{ methodId: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { formatAmount, convertAmount, convertToRub, currencySymbol, targetCurrency } =
    useCurrency();
  const { openInvoice, openTelegramLink, openLink } = usePlatform();
  const haptic = useHaptic();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autoStartedRef = useRef(false);
  const submitRef = useRef<() => void>(() => undefined);

  const {
    data: methodsData,
    isLoading: methodsLoading,
    isError: methodsError,
    refetch: refetchMethods,
  } = useQuery({
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
  const autoStartPayment = searchParams.get('autostart') === '1';
  const autoOpenPayment = searchParams.get('autoopen') !== '0';
  const [amount, setAmount] = useState(() => {
    if (!initialAmountRub || Number.isNaN(initialAmountRub) || initialAmountRub <= 0) return '';
    if (targetCurrency === 'RUB' || targetCurrency === 'IRR') {
      return String(Math.ceil(convertAmount(initialAmountRub)));
    }
    return convertAmount(initialAmountRub).toFixed(2);
  });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const options = method?.options ?? [];
    if (options.length === 0) {
      setSelectedOption(null);
      return;
    }
    setSelectedOption((current) =>
      current && options.some((option) => option.id === current) ? current : options[0].id,
    );
  }, [method]);

  const minRub = (method?.min_amount_kopeks ?? 0) / 100;
  const maxRub = (method?.max_amount_kopeks ?? 0) / 100;
  const amountInSelectedCurrency = normalizeAmount(amount);
  const amountRub = Number.isFinite(amountInSelectedCurrency)
    ? convertToRub(amountInSelectedCurrency)
    : 0;
  const isAmountEntered = amountRub > 0;
  const isAmountInRange = isAmountEntered && amountRub >= minRub && amountRub <= maxRub;
  const balanceRub = balanceData?.balance_rubles ?? 0;
  const balanceAfterRub = balanceRub + Math.max(0, amountRub);
  const isStarsMethod = method?.id.toLowerCase().replace(/-/g, '_').includes('stars') ?? false;
  const hasSelectedOption = !method?.options?.length || Boolean(selectedOption);

  const methodName = useMemo(() => {
    if (!method) return '';
    const key = method.id.toLowerCase().replace(/-/g, '_');
    return t(`balance.paymentMethods.${key}.name`, { defaultValue: method.name });
  }, [method, t]);

  const methodDescription = useMemo(() => {
    if (!method) return '';
    const key = method.id.toLowerCase().replace(/-/g, '_');
    return t(`balance.paymentMethods.${key}.description`, {
      defaultValue:
        method.description ||
        t('balance.paymentOnlineDescription', { defaultValue: 'Онлайн-оплата' }),
    });
  }, [method, t]);

  const quickRubles = useMemo(() => {
    if (!method) return [];
    const values = [100, 300, 500, 1000].filter((value) => value >= minRub && value <= maxRub);
    if (values.length > 0) return values;
    return Array.from(new Set([minRub, maxRub]))
      .filter((value) => value > 0)
      .slice(0, 4);
  }, [maxRub, method, minRub]);

  const quickValue = useCallback(
    (valueRub: number) =>
      targetCurrency === 'RUB' || targetCurrency === 'IRR'
        ? String(Math.round(convertAmount(valueRub)))
        : convertAmount(valueRub).toFixed(2),
    [convertAmount, targetCurrency],
  );

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
    void queryClient.invalidateQueries({ queryKey: ['balance'] });
    void queryClient.invalidateQueries({ queryKey: ['transactions'] });
    navigate(returnTo || '/subscription', { replace: true });
  }, [navigate, queryClient, returnTo]);

  useCloseOnSuccessNotification(handleSuccess);

  const paymentMutation = useMutation<CreatedPayment, unknown, number>({
    mutationFn: async (amountKopeks) => {
      if (!method) throw new Error('method_not_found');

      if (isStarsMethod) {
        const invoice = await balanceApi.createStarsInvoice(amountKopeks);
        if (!invoice.invoice_url) throw new Error('payment_url_missing');
        const status = await openInvoice(invoice.invoice_url);
        return { kind: 'stars', status };
      }

      const result = await balanceApi.createTopUp(
        amountKopeks,
        method.id,
        selectedOption || undefined,
      );
      if (!result.payment_url) throw new Error('payment_url_missing');
      return { kind: 'external', url: result.payment_url };
    },
    onSuccess: (result, amountKopeks) => {
      setError(null);

      if (result.kind === 'stars') {
        if (result.status === 'paid') {
          haptic.notification('success');
          handleSuccess();
        } else if (result.status === 'failed') {
          haptic.notification('error');
          setError(t('wheel.starsPaymentFailed'));
        }
        return;
      }

      writePendingTopUpFollowUp(userId, {
        amountKopeks,
        balanceBeforeKopeks: Math.max(0, balanceData?.balance_kopeks ?? 0),
        paymentUrl: result.url,
        paymentMethodId: method?.id,
        paymentMethodName: methodName,
        returnTo: returnTo || '/subscription',
      });
      setPaymentUrl(result.url);
      if (autoOpenPayment) openPayment(result.url);
    },
    onError: (requestError: unknown) => {
      haptic.notification('error');
      const detail =
        (requestError as { response?: { data?: { detail?: string; message?: string } } })?.response
          ?.data?.detail ??
        (requestError as { response?: { data?: { detail?: string; message?: string } } })?.response
          ?.data?.message;
      setError(
        detail ||
          (requestError instanceof Error && requestError.message === 'payment_url_missing'
            ? t('balance.errors.noPaymentLink')
            : t('common.error')),
      );
    },
  });

  const handleCreatePayment = useCallback(() => {
    setError(null);
    setPaymentUrl(null);
    inputRef.current?.blur();

    if (!checkRateLimit(RATE_LIMIT_KEYS.PAYMENT, 3, 30000)) {
      setError(
        t('balance.errors.rateLimit', { seconds: getRateLimitResetTime(RATE_LIMIT_KEYS.PAYMENT) }),
      );
      return;
    }
    if (method?.options?.length && !selectedOption) {
      setError(t('balance.errors.selectMethod'));
      return;
    }
    if (!isAmountEntered) {
      setError(t('balance.errors.enterAmount'));
      return;
    }
    if (!isAmountInRange) {
      setError(t('balance.errors.amountRange', { min: minRub, max: maxRub }));
      return;
    }

    paymentMutation.mutate(Math.round(amountRub * 100));
  }, [
    amountRub,
    isAmountEntered,
    isAmountInRange,
    method?.options,
    minRub,
    maxRub,
    paymentMutation,
    selectedOption,
    t,
  ]);
  submitRef.current = handleCreatePayment;

  useEffect(() => {
    if (!autoStartPayment || autoStartedRef.current || !method || paymentMutation.isPending) return;
    if (!isAmountEntered || !hasSelectedOption) return;
    autoStartedRef.current = true;
    submitRef.current();
  }, [autoStartPayment, hasSelectedOption, isAmountEntered, method, paymentMutation.isPending]);

  const handleQuickAmount = (valueRub: number) => {
    setAmount(quickValue(valueRub));
    setError(null);
    inputRef.current?.focus();
  };

  const handleCopyUrl = async () => {
    if (!paymentUrl) return;
    await copyToClipboard(paymentUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const backToMethods = () => {
    const params = new URLSearchParams();
    if (initialAmountRub) params.set('amount', String(initialAmountRub));
    if (returnTo) params.set('returnTo', returnTo);
    const query = params.toString();
    navigate(`/balance/top-up${query ? `?${query}` : ''}`);
  };

  const bottomNav = <UltimaBottomNav active="profile" />;

  if (
    (methodsLoading && methods.length === 0) ||
    (!method && !methodsError && methods.length === 0)
  ) {
    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames">
        <div className="ultima-shell-aura" />
        <div className="ultima-shell-inner flex items-center justify-center">
          <LoaderCircle className="h-7 w-7 animate-spin text-[color:var(--ultima-color-primary)]" />
        </div>
      </div>
    );
  }

  if (!method || methodsError) {
    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames">
        <div className="ultima-shell-aura" />
        <div className="ultima-shell-inner flex items-center justify-center px-4">
          <section
            className={`${ultimaCardClassName} w-full max-w-md text-center`}
            style={ultimaSurfaceStyle}
          >
            <CircleAlert className="mx-auto h-8 w-8 text-amber-200" />
            <h1 className="mt-3 text-xl font-semibold text-white">
              {t('balance.paymentUnavailable', { defaultValue: 'Способ оплаты недоступен' })}
            </h1>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={backToMethods}
                className="ultima-btn-pill ultima-btn-secondary flex-1 px-4 py-3 text-sm"
              >
                {t('common.back')}
              </button>
              <button
                type="button"
                onClick={() => void refetchMethods()}
                className="ultima-btn-pill ultima-btn-primary flex-1 px-4 py-3 text-sm"
              >
                {t('common.retry', { defaultValue: 'Повторить' })}
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const amountLabel = isAmountEntered
    ? `${formatAmount(amountRub, amountRub % 1 === 0 ? 0 : 2)} ${currencySymbol}`
    : `0 ${currencySymbol}`;
  const rangeLabel = `${formatAmount(minRub, 0)} - ${formatAmount(maxRub, 0)} ${currencySymbol}`;
  const buttonLabel = paymentMutation.isPending
    ? t('balance.paymentCreating', { defaultValue: 'Создаём платёж' })
    : isAmountEntered
      ? t('balance.paymentContinueWithAmount', {
          amount: amountLabel,
          defaultValue: `Перейти к оплате · ${amountLabel}`,
        })
      : t('balance.paymentContinue', { defaultValue: 'Перейти к оплате' });

  const paymentComposer = (
    <section
      data-testid="ultima-payment-amount-card"
      className={ultimaCardClassName}
      style={ultimaSurfaceStyle}
    >
      <div
        data-testid="ultima-payment-selected-method"
        className="flex items-center gap-3 border-b border-white/[0.08] pb-4"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] ring-1 ring-inset ring-white/[0.08]">
          <PaymentMethodIcon method={method.id} className="h-9 w-9" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/[0.40]">
            {t('balance.paymentSelectedMethod', { defaultValue: 'Способ оплаты' })}
          </p>
          <p className="mt-0.5 truncate text-[15px] font-semibold text-white">{methodName}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-white/[0.45]">{methodDescription}</p>
        </div>
        <button
          type="button"
          onClick={backToMethods}
          className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-white/[0.65] transition hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('common.change', { defaultValue: 'Изменить' })}
        </button>
      </div>

      {method.options && method.options.length > 0 ? (
        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-medium text-white/[0.55]">
            {t('balance.topUp.paymentOptionTitle', { defaultValue: 'Вариант оплаты' })}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {method.options.map((option) => {
              const selected = selectedOption === option.id;
              return (
                <button
                  key={option.id}
                  data-testid={`ultima-payment-option-${option.id}`}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSelectedOption(option.id)}
                  className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${selected ? 'border-[color:color-mix(in_srgb,var(--ultima-color-primary)_52%,transparent)] bg-[color:color-mix(in_srgb,var(--ultima-color-primary)_13%,transparent)] text-white' : 'border-white/[0.08] bg-white/[0.035] text-white/[0.68] hover:border-white/[0.16]'}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{option.name}</span>
                    {option.description ? (
                      <span className="mt-0.5 line-clamp-1 block text-[11px] text-white/[0.42]">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-[color:var(--ultima-color-primary)] bg-[color:var(--ultima-color-primary)] text-[color:var(--ultima-color-primary-text)]' : 'border-white/[0.20] text-transparent'}`}
                  >
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="mt-5">
        <div className="flex items-end justify-between gap-3">
          <label htmlFor="ultima-payment-amount" className="text-xs font-medium text-white/[0.55]">
            {t('balance.enterAmount')}
          </label>
          <span className="text-[11px] text-white/[0.38]">{rangeLabel}</span>
        </div>
        <div className="mt-2 flex min-h-[72px] items-center rounded-2xl border border-white/[0.1] bg-black/[0.15] px-4 focus-within:border-[color:color-mix(in_srgb,var(--ultima-color-primary)_58%,transparent)] focus-within:ring-2 focus-within:ring-[color:color-mix(in_srgb,var(--ultima-color-primary)_12%,transparent)]">
          <input
            id="ultima-payment-amount"
            data-testid="ultima-payment-amount-input"
            ref={inputRef}
            type="text"
            inputMode="decimal"
            enterKeyHint="done"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value.replace(/[^0-9.,]/g, ''));
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleCreatePayment();
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-[32px] font-semibold leading-none text-white outline-none placeholder:text-white/[0.18]"
            placeholder="0"
            autoComplete="off"
          />
          <span className="ml-3 text-xl font-medium text-white/[0.45]">{currencySymbol}</span>
        </div>
      </div>

      {quickRubles.length > 0 ? (
        <div
          className="mt-2.5 grid grid-cols-4 gap-2"
          aria-label={t('balance.quickAmounts', { defaultValue: 'Быстрые суммы' })}
        >
          {quickRubles.map((value) => {
            const selected = amount === quickValue(value);
            return (
              <button
                key={value}
                data-testid={`ultima-payment-quick-${value}`}
                type="button"
                onClick={() => handleQuickAmount(value)}
                className={`min-h-10 rounded-xl border px-1.5 text-xs font-medium transition ${selected ? 'border-[color:color-mix(in_srgb,var(--ultima-color-primary)_48%,transparent)] bg-[color:color-mix(in_srgb,var(--ultima-color-primary)_12%,transparent)] text-white' : 'border-white/[0.08] bg-white/[0.03] text-white/[0.58] hover:border-white/[0.16] hover:text-white/[0.80]'}`}
              >
                {formatAmount(value, 0)}
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        data-testid="ultima-payment-summary"
        className={`${ultimaPaneClassName} mt-4 grid grid-cols-3 divide-x divide-white/[0.08] p-0`}
        style={ultimaPaneSurfaceStyle}
      >
        <div className="min-w-0 px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.08em] text-white/[0.35]">
            {t('balance.amount', { defaultValue: 'Сумма' })}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{amountLabel}</p>
        </div>
        <div className="min-w-0 px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.08em] text-white/[0.35]">
            {t('balance.currentBalance')}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-white/[0.75]">
            {formatAmount(balanceRub)} {currencySymbol}
          </p>
        </div>
        <div className="min-w-0 px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.08em] text-white/[0.35]">
            {t('balance.afterTopUp', { defaultValue: 'Будет' })}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-[color:color-mix(in_srgb,var(--ultima-color-primary)_74%,white)]">
            {formatAmount(balanceAfterRub)} {currencySymbol}
          </p>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2.5 rounded-xl border border-rose-300/[0.20] bg-rose-500/[0.09] px-3 py-2.5 text-sm text-rose-100"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {paymentUrl ? (
        <div
          data-testid="ultima-payment-ready"
          className="mt-3 rounded-2xl border border-[color:color-mix(in_srgb,var(--ultima-color-primary)_34%,transparent)] bg-[color:color-mix(in_srgb,var(--ultima-color-primary)_9%,transparent)] p-3.5"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--ultima-color-primary)_15%,transparent)] text-[color:color-mix(in_srgb,var(--ultima-color-primary)_72%,white)]">
              <ReceiptText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{t('balance.paymentReady')}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/[0.48]">
                {t('balance.paymentReadyHint', {
                  defaultValue: 'Платёжная ссылка создана и готова к открытию.',
                })}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <button
              type="button"
              onClick={() => openPayment(paymentUrl)}
              className="ultima-btn-pill ultima-btn-primary flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold"
            >
              <ExternalLink className="h-4 w-4" />
              {t('balance.openPaymentPage')}
            </button>
            <button
              type="button"
              onClick={() => void handleCopyUrl()}
              aria-label={t('common.copy')}
              className="ultima-btn-pill ultima-btn-secondary flex h-11 w-12 items-center justify-center"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ) : null}

      <button
        data-testid="ultima-payment-submit"
        type="button"
        onClick={handleCreatePayment}
        disabled={
          paymentMutation.isPending ||
          !isAmountEntered ||
          !hasSelectedOption ||
          !method.is_available
        }
        className="ultima-btn-pill ultima-btn-primary mt-4 flex min-h-[52px] w-full items-center justify-between gap-3 px-5 text-[15px] font-semibold"
      >
        <span className="flex min-w-0 items-center gap-2">
          {paymentMutation.isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <LockKeyhole className="h-4 w-4" />
          )}
          <span className="truncate">{buttonLabel}</span>
        </span>
        {!paymentMutation.isPending ? <ExternalLink className="h-4 w-4" /> : null}
      </button>
    </section>
  );

  if (isDesktop) {
    return (
      <div
        data-testid="ultima-payment-amount-page"
        className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-profile-desktop"
      >
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={<WalletCards className="h-5 w-5" />}
          eyebrow={t('balance.topUpBalance')}
          title={t('balance.paymentAmountTitle', { defaultValue: 'Сумма пополнения' })}
          subtitle={t('balance.paymentAmountSubtitle', {
            defaultValue: 'Проверьте способ оплаты, укажите сумму и перейдите к платежу.',
          })}
          metrics={[
            {
              label: t('balance.currentBalance'),
              value: `${formatAmount(balanceRub)} ${currencySymbol}`,
            },
            {
              label: t('balance.paymentSelectedMethod', { defaultValue: 'Способ' }),
              value: methodName,
              hint: methodDescription,
            },
            { label: t('balance.amount', { defaultValue: 'Диапазон' }), value: rangeLabel },
          ]}
          heroActions={
            <button
              type="button"
              onClick={backToMethods}
              className="ultima-btn-pill ultima-btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('balance.selectPaymentMethod')}
            </button>
          }
          aside={
            <UltimaDesktopPanel
              title={t('balance.paymentSummary', { defaultValue: 'Итого' })}
              subtitle={t('balance.paymentSummaryHint', {
                defaultValue: 'Платёж будет создан для указанной суммы.',
              })}
            >
              <div className="space-y-3">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-white/[0.38]">
                    {t('balance.toPay', { defaultValue: 'К оплате' })}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">{amountLabel}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/[0.48]">
                    <ShieldCheck className="h-4 w-4 text-[color:var(--ultima-color-primary)]" />
                    {methodName}
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
          {paymentComposer}
        </UltimaDesktopSectionLayout>
      </div>
    );
  }

  return (
    <div
      data-testid="ultima-payment-amount-page"
      className="ultima-shell ultima-shell-wide ultima-flat-frames"
    >
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <header className="mb-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[color:color-mix(in_srgb,var(--ultima-color-primary)_70%,white)]">
            <WalletCards className="h-4 w-4" />
            {t('balance.topUpBalance')}
          </div>
          <h1 className="text-[34px] font-semibold leading-[0.96] text-white">
            {t('balance.paymentAmountTitle', { defaultValue: 'Сумма пополнения' })}
          </h1>
          <p className="mt-1.5 text-[13px] text-white/[0.52]">
            {methodName} · {rangeLabel}
          </p>
        </header>

        <main className="ultima-scrollbar min-h-0 flex-1 overflow-y-auto pb-3">
          {paymentComposer}
          <div className="mt-3 flex items-start gap-2.5 px-1 text-[11px] leading-relaxed text-white/[0.42]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[color:color-mix(in_srgb,var(--ultima-color-primary)_70%,white)]" />
            <span>
              {t('balance.paymentBalanceDestinationHint', {
                defaultValue: 'Средства появятся на балансе после подтверждения платежа.',
              })}
            </span>
          </div>
        </main>

        <div className="ultima-mobile-dock-footer">
          <div className="ultima-nav-dock">{bottomNav}</div>
        </div>
      </div>
    </div>
  );
}
