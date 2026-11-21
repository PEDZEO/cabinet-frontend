import { useEffect, useId, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, LoaderCircle, WalletCards } from 'lucide-react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ANTARCTIC_METHOD,
  type AntarcticPaymentStatus,
  getAntarcticPaymentMethod,
  getAntarcticTopUpStatus,
  payWithAntarctic,
} from '@/antarctic/payment';
import PaymentMethodIcon from '@/components/PaymentMethodIcon';
import { useHaptic } from '@/platform';
import { useAuthStore } from '@/store/auth';
import { checkRateLimit, getRateLimitResetTime, RATE_LIMIT_KEYS } from '@/utils/rateLimit';
import {
  clearPendingTopUpFollowUp,
  readPendingTopUpFollowUp,
  writePendingTopUpFollowUp,
} from '@/utils/topUpFollowUp';
import '@/styles/antarctic-top-up.css';

const amountPath = '/balance/top-up/' + ANTARCTIC_METHOD;
const fallbackReturn = '/balance';

type WalletTopUp = {
  referenceId?: string;
  amountKopeks: number;
  returnTo: string;
};

function parseAmountKopeks(value: string): number {
  const match = /^(\d{1,8})(?:[.,](\d{1,2}))?$/.exec(value.trim());
  return match ? Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0')) : 0;
}

function resolveReturnTo(value: string | null): string {
  if (!value?.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallbackReturn;
  }
  try {
    const origin = 'https://cabinet.invalid';
    const url = new URL(value, origin);
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== origin || /^\/balance\/top-up(?:\/|$)/i.test(path)) {
      return fallbackReturn;
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return fallbackReturn;
  }
}

function WalletAmount() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [params] = useSearchParams();
  const userId = useAuthStore((value) => value.user?.id ?? null);
  const refreshUser = useAuthStore((value) => value.refreshUser);
  const queryClient = useQueryClient();
  const haptic = useHaptic();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const mountedRef = useRef(true);
  const returnTo = resolveReturnTo(params.get('returnTo'));
  const amountFromLink = params.get('amount') ?? '';

  const [error, setError] = useState('');
  const [pending, setPending] = useState<WalletTopUp | null>(() => {
    const previous = readPendingTopUpFollowUp(userId);
    if (previous?.paymentMethodId !== ANTARCTIC_METHOD || !previous.paymentReferenceId) return null;
    return {
      referenceId: previous.paymentReferenceId,
      amountKopeks: previous.amountKopeks,
      returnTo: resolveReturnTo(previous.returnTo ?? null),
    };
  });
  const [amount, setAmount] = useState(() => {
    if (pending) return String(pending.amountKopeks / 100);
    return parseAmountKopeks(amountFromLink) > 0 ? amountFromLink.trim() : '';
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const method = getAntarcticPaymentMethod();
  const min = method?.min_amount_kopeks;
  const max = method?.max_amount_kopeks;
  const amountKopeks = parseAmountKopeks(amount);
  const isValidAmount = min != null && max != null && amountKopeks >= min && amountKopeks <= max;
  const format = (kopeks: number) =>
    new Intl.NumberFormat(i18n.resolvedLanguage ?? 'ru', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: kopeks % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(kopeks / 100);

  const goBack = () => navigate(returnTo, { replace: true, state });

  const settle = (status: AntarcticPaymentStatus, topUp: WalletTopUp) => {
    if (status === 'pending') {
      if (topUp.referenceId) {
        writePendingTopUpFollowUp(userId, {
          amountKopeks: topUp.amountKopeks,
          paymentMethodId: ANTARCTIC_METHOD,
          paymentMethodName: 'Antarctic Wallet',
          paymentReferenceId: topUp.referenceId,
          returnTo: topUp.returnTo,
        });
      }
      if (mountedRef.current) setPending(topUp);
      return;
    }

    if (
      topUp.referenceId &&
      readPendingTopUpFollowUp(userId)?.paymentReferenceId === topUp.referenceId
    ) {
      clearPendingTopUpFollowUp(userId);
    }
    if (mountedRef.current) setPending(null);

    if (status === 'credited') {
      for (const key of ['balance', 'purchase-options', 'transactions']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      void refreshUser();
      if (mountedRef.current) {
        haptic.notification('success');
        navigate(topUp.returnTo, { replace: true, state });
      }
    } else if (mountedRef.current) {
      setError(t('balance.antarcticTopUp.status.' + status));
    }
  };

  const payment = useMutation({
    mutationFn: async (topUp: WalletTopUp) => {
      let referenceId: string | undefined;
      const status = await payWithAntarctic(topUp.amountKopeks, (id) => {
        referenceId = id;
      });
      return { status, referenceId };
    },
    onSuccess: ({ status, referenceId }, topUp) => settle(status, { ...topUp, referenceId }),
    onError: () => setError(t('common.error')),
    onSettled: () => {
      submittingRef.current = false;
    },
  });
  const verify = useMutation({
    mutationFn: (id: string) => getAntarcticTopUpStatus(id),
    onSuccess: (status) => {
      if (!pending) return;
      setError('');
      settle(status, pending);
    },
    onError: () => setError(t('common.error')),
  });

  const submitPayment = () => {
    if (!method || !isValidAmount || pending || submittingRef.current || payment.isPending) return;
    if (!checkRateLimit(RATE_LIMIT_KEYS.PAYMENT, 3, 30_000)) {
      setError(
        t('balance.errors.rateLimit', { seconds: getRateLimitResetTime(RATE_LIMIT_KEYS.PAYMENT) }),
      );
      return;
    }
    inputRef.current?.blur();
    submittingRef.current = true;
    setError('');
    payment.mutate({ amountKopeks, returnTo });
  };

  const suggestions = [10000, 18000, 30000].filter(
    (value) => min != null && max != null && value >= min && value <= max,
  );
  const busy = payment.isPending || verify.isPending;
  const range = min != null && max != null ? format(min) + ' – ' + format(max) : null;

  return (
    <div
      data-testid="ultima-payment-amount-page"
      className="ultima-shell ultima-shell-wide ultima-shell-shared-nav-docked antarctic-topup"
    >
      <div className="ultima-shell-inner ultima-shell-mobile-docked antarctic-topup-inner">
        <main className="ultima-scrollbar antarctic-topup-screen">
          <button
            type="button"
            className="antarctic-topup-back"
            data-testid="antarctic-payment-back"
            onClick={goBack}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {t('common.back')}
          </button>
          <header className="antarctic-topup-heading">
            <span>
              <WalletCards size={14} aria-hidden="true" />
              Antarctic Wallet
            </span>
            <h1>{t('balance.topUpBalance')}</h1>
            <p>{t('balance.antarcticTopUp.description')}</p>
          </header>

          <section className="antarctic-topup-controls" data-testid="ultima-payment-amount-card">
            <div className="antarctic-topup-amount">
              <label htmlFor={inputId}>{t('balance.amount')}</label>
              <div className="antarctic-topup-money">
                <input
                  ref={inputRef}
                  id={inputId}
                  data-testid="ultima-payment-amount-input"
                  inputMode="decimal"
                  enterKeyHint="done"
                  type="text"
                  value={amount}
                  placeholder="0"
                  maxLength={11}
                  autoComplete="off"
                  disabled={busy || Boolean(pending)}
                  aria-describedby={range ? inputId + '-range' : undefined}
                  onChange={(event) => {
                    setAmount(event.target.value.replace(/[^\d.,]/g, ''));
                    setError('');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      submitPayment();
                    }
                  }}
                />
                <span aria-hidden="true">₽</span>
              </div>
              {range && (
                <p className="antarctic-topup-range" id={inputId + '-range'}>
                  {range}
                </p>
              )}
              {suggestions.length > 0 && (
                <div className="antarctic-topup-presets">
                  {suggestions.map((value) => (
                    <button
                      key={value}
                      type="button"
                      data-testid={'ultima-payment-quick-' + value / 100}
                      aria-pressed={amountKopeks === value}
                      disabled={busy || Boolean(pending)}
                      onClick={() => {
                        setAmount(String(value / 100));
                        setError('');
                      }}
                    >
                      {format(value)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="antarctic-topup-provider" data-testid="ultima-payment-selected-method">
              <PaymentMethodIcon method={ANTARCTIC_METHOD} className="h-8 w-8" />
              <div>
                <strong>Antarctic Wallet</strong>
                <p>{t('balance.antarcticTopUp.provider')}</p>
              </div>
              <Check size={17} aria-hidden="true" />
            </div>

            {!method && (
              <p
                className="antarctic-topup-notice"
                role="status"
                data-testid="antarctic-payment-unavailable"
              >
                {t('balance.antarcticTopUp.unavailable')}
              </p>
            )}
            {pending && (
              <p className="antarctic-topup-notice" role="status">
                {t('balance.antarcticTopUp.status.pending')}
              </p>
            )}
            {error && (
              <p className="antarctic-topup-notice" role="alert">
                {error}
              </p>
            )}

            {pending ? (
              pending.referenceId && (
                <button
                  type="button"
                  className="antarctic-topup-submit"
                  disabled={verify.isPending || !method}
                  onClick={() => {
                    if (pending.referenceId) verify.mutate(pending.referenceId);
                  }}
                >
                  {verify.isPending && (
                    <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
                  )}
                  {t('balance.antarcticTopUp.checkStatus')}
                </button>
              )
            ) : (
              <button
                type="button"
                data-testid="ultima-payment-submit"
                className="antarctic-topup-submit"
                disabled={!isValidAmount || busy}
                onClick={submitPayment}
              >
                <span>
                  {payment.isPending && (
                    <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
                  )}
                  {t('balance.antarcticTopUp.confirm')}
                </span>
                {amountKopeks > 0 && <strong>{format(amountKopeks)}</strong>}
              </button>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default function AntarcticTopUpAmount() {
  const { pathname, search, hash, state } = useLocation();
  const params = new URLSearchParams(search);
  if (pathname !== amountPath || params.has('autostart')) {
    // Direct links from old checkouts may carry autostart; always wait for explicit confirmation.
    params.delete('autostart');
    return (
      <Navigate
        replace
        to={{ pathname: amountPath, search: params.toString(), hash }}
        state={state}
      />
    );
  }
  return <WalletAmount key={search} />;
}
