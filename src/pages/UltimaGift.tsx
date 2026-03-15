import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { balanceApi } from '@/api/balance';
import { type GiftPurchaseRequest, giftApi, type SentGift } from '@/api/gift';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { usePlatform } from '@/platform/hooks/usePlatform';

const PENDING_GIFT_TOKEN_KEY = 'ultima_pending_gift_token';
const PENDING_GIFT_TOKEN_TS_KEY = 'ultima_pending_gift_token_ts';
const PENDING_GIFT_TOKEN_TTL_MS = 15 * 60 * 1000;
const PENDING_GIFT_EXTEND_KEY = 'ultima_pending_gift_extend_v1';

type PendingGiftExtend = {
  token: string;
  periodDays: number;
  requiredAmountKopeks: number;
  createdAt: number;
};

export function UltimaGift() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { openLink, openTelegramLink } = usePlatform();
  const [searchParams, setSearchParams] = useSearchParams();

  const [giftTariffId, setGiftTariffId] = useState<number | null>(null);
  const [giftPeriodDays, setGiftPeriodDays] = useState<number | null>(null);
  const [giftPaymentMethod, setGiftPaymentMethod] = useState<string | null>(null);
  const [giftPaymentOption, setGiftPaymentOption] = useState<string | null>(null);
  const [pendingGiftToken, setPendingGiftToken] = useState<string | null>(null);
  const [generatedGiftCode, setGeneratedGiftCode] = useState<string | null>(null);
  const [extendingToken, setExtendingToken] = useState<string | null>(null);
  const [pendingGiftExtend, setPendingGiftExtend] = useState<PendingGiftExtend | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [giftExtendPeriods, setGiftExtendPeriods] = useState<Record<string, number>>({});
  const formAnchorRef = useRef<HTMLDivElement | null>(null);

  const { data: giftConfig } = useQuery({
    queryKey: ['gift-config'],
    queryFn: giftApi.getConfig,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: 5000,
    refetchInterval: pendingGiftExtend ? 2500 : false,
  });
  const isGiftConfigLoaded = giftConfig !== undefined;
  const { data: sentGifts = [] } = useQuery({
    queryKey: ['gift-sent'],
    queryFn: giftApi.getSentGifts,
    staleTime: 15000,
    enabled: !!giftConfig?.is_enabled,
  });
  const { data: receivedGifts = [] } = useQuery({
    queryKey: ['gift-received'],
    queryFn: giftApi.getReceivedGifts,
    staleTime: 15000,
    enabled: !!giftConfig?.is_enabled,
  });
  const giftTariffOptions = useMemo(() => giftConfig?.tariffs ?? [], [giftConfig?.tariffs]);
  const gatewayMethods = useMemo(
    () => giftConfig?.payment_methods ?? [],
    [giftConfig?.payment_methods],
  );

  const selectedGiftTariff = useMemo(
    () => giftTariffOptions.find((tariff) => tariff.id === giftTariffId) ?? null,
    [giftTariffId, giftTariffOptions],
  );
  const giftPeriods = useMemo(
    () => selectedGiftTariff?.periods ?? [],
    [selectedGiftTariff?.periods],
  );
  const selectedGiftPeriod = useMemo(
    () => giftPeriods.find((period) => period.days === giftPeriodDays) ?? null,
    [giftPeriodDays, giftPeriods],
  );
  const selectedGatewayMethod = useMemo(
    () => gatewayMethods.find((method) => method.method_id === giftPaymentMethod) ?? null,
    [giftPaymentMethod, gatewayMethods],
  );
  const tariffPeriodsById = useMemo(() => {
    return new Map(giftTariffOptions.map((tariff) => [tariff.id, tariff.periods] as const));
  }, [giftTariffOptions]);
  const currentBalanceKopeks = balanceData?.balance_kopeks ?? giftConfig?.balance_kopeks ?? 0;
  const selectedGiftPriceKopeks = selectedGiftPeriod?.price_kopeks ?? 0;
  const missingAmountKopeks = Math.max(0, selectedGiftPriceKopeks - currentBalanceKopeks);
  const selectedMethodMinAmountKopeks = selectedGatewayMethod?.min_amount_kopeks ?? 0;
  const topupAmountKopeks =
    missingAmountKopeks > 0 ? Math.max(missingAmountKopeks, selectedMethodMinAmountKopeks) : 0;
  const requiresGatewayPayment = missingAmountKopeks > 0;

  useEffect(() => {
    if (!giftTariffOptions.length) return;
    setGiftTariffId((prev) => prev ?? giftTariffOptions[0].id);
  }, [giftTariffOptions]);

  useEffect(() => {
    if (!selectedGiftTariff) return;
    const periods = selectedGiftTariff.periods;
    if (!periods.length) return;
    setGiftPeriodDays((prev) => {
      if (prev != null && periods.some((item) => item.days === prev)) {
        return prev;
      }
      return periods[0].days;
    });
  }, [selectedGiftTariff]);

  useEffect(() => {
    if (!gatewayMethods.length) return;
    setGiftPaymentMethod((prev) => prev ?? gatewayMethods[0].method_id);
  }, [gatewayMethods]);

  useEffect(() => {
    const options = selectedGatewayMethod?.sub_options ?? [];
    if (!options.length) {
      setGiftPaymentOption(null);
      return;
    }
    setGiftPaymentOption((prev) => {
      if (prev != null && options.some((item) => item.id === prev)) {
        return prev;
      }
      return options[0].id;
    });
  }, [selectedGatewayMethod]);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('giftToken');
    const tokenFromStorage = sessionStorage.getItem(PENDING_GIFT_TOKEN_KEY);
    const tokenTsRaw = sessionStorage.getItem(PENDING_GIFT_TOKEN_TS_KEY);
    const tokenTs = tokenTsRaw ? Number(tokenTsRaw) : 0;
    const isStorageTokenFresh =
      Number.isFinite(tokenTs) && tokenTs > 0 && Date.now() - tokenTs < PENDING_GIFT_TOKEN_TTL_MS;
    const token = tokenFromUrl || (isStorageTokenFresh ? tokenFromStorage : null);

    if (!tokenFromUrl && tokenFromStorage && !isStorageTokenFresh) {
      sessionStorage.removeItem(PENDING_GIFT_TOKEN_KEY);
      sessionStorage.removeItem(PENDING_GIFT_TOKEN_TS_KEY);
    }

    if (!token) return;
    setPendingGiftToken((prev) => prev ?? token);
    sessionStorage.setItem(PENDING_GIFT_TOKEN_KEY, token);
    sessionStorage.setItem(PENDING_GIFT_TOKEN_TS_KEY, String(Date.now()));
  }, [searchParams]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PENDING_GIFT_EXTEND_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PendingGiftExtend;
      if (!parsed?.token || !Number.isFinite(parsed?.requiredAmountKopeks)) return;
      if (!Number.isFinite(parsed?.periodDays) || (parsed?.periodDays ?? 0) <= 0) return;
      if (!Number.isFinite(parsed?.createdAt) || Date.now() - parsed.createdAt > 15 * 60 * 1000) {
        localStorage.removeItem(PENDING_GIFT_EXTEND_KEY);
        return;
      }
      setPendingGiftExtend(parsed);
    } catch {
      // ignore malformed persisted state
    }
  }, []);

  useEffect(() => {
    if (!pendingGiftExtend) {
      localStorage.removeItem(PENDING_GIFT_EXTEND_KEY);
      return;
    }
    localStorage.setItem(PENDING_GIFT_EXTEND_KEY, JSON.stringify(pendingGiftExtend));
  }, [pendingGiftExtend]);

  useEffect(() => {
    if (!sentGifts.length) return;
    setGiftExtendPeriods((prev) => {
      const next = { ...prev };
      let hasChanges = false;
      sentGifts.forEach((gift) => {
        if (next[gift.token] == null) {
          next[gift.token] = gift.period_days;
          hasChanges = true;
        }
      });
      return hasChanges ? next : prev;
    });
  }, [sentGifts]);

  const giftStatusQuery = useQuery({
    queryKey: ['gift-status-inline', pendingGiftToken],
    queryFn: () => giftApi.getPurchaseStatus(pendingGiftToken!),
    enabled: !!pendingGiftToken,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return 2500;
      if (status === 'paid' || status === 'delivered' || status === 'pending_activation')
        return false;
      if (status === 'failed' || status === 'expired') return false;
      return 2500;
    },
  });

  const copyGiftCode = async (token: string) => {
    const code = `GIFT-${token}`;
    try {
      await navigator.clipboard.writeText(code);
      setSuccess(
        t('balance.promocode.giftCodeCopied', {
          defaultValue: `Промокод скопирован: ${code}`,
        }),
      );
      setError(null);
    } catch {
      setError(
        t('errors.copyFailed', {
          defaultValue: 'Не удалось скопировать промокод',
        }),
      );
    }
  };

  useEffect(() => {
    const statusData = giftStatusQuery.data;
    if (!statusData || !pendingGiftToken) return;

    if (statusData.status === 'paid' && statusData.is_code_only && statusData.purchase_token) {
      setGeneratedGiftCode(`GIFT-${statusData.purchase_token}`);
      setSuccess(
        t('balance.promocode.giftCodeCreated', {
          defaultValue: 'Подарочный промокод создан. Отправьте его получателю.',
        }),
      );
      setError(null);
      setPendingGiftToken(null);
      sessionStorage.removeItem(PENDING_GIFT_TOKEN_KEY);
      sessionStorage.removeItem(PENDING_GIFT_TOKEN_TS_KEY);
      if (searchParams.get('giftToken')) {
        const next = new URLSearchParams(searchParams);
        next.delete('giftToken');
        setSearchParams(next, { replace: true });
      }
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['balance'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['gift-sent'] }),
        queryClient.invalidateQueries({ queryKey: ['gift-received'] }),
        queryClient.invalidateQueries({ queryKey: ['subscription'] }),
      ]);
      return;
    }

    if (statusData.status === 'failed' || statusData.status === 'expired') {
      setPendingGiftToken(null);
      sessionStorage.removeItem(PENDING_GIFT_TOKEN_KEY);
      sessionStorage.removeItem(PENDING_GIFT_TOKEN_TS_KEY);
    }
  }, [giftStatusQuery.data, pendingGiftToken, queryClient, searchParams, setSearchParams, t]);

  const createGiftMutation = useMutation({
    mutationFn: async (request: GiftPurchaseRequest) => giftApi.createPurchase(request),
    onSuccess: async (result) => {
      setError(null);
      if (result.payment_url) {
        setPendingGiftToken(result.purchase_token);
        sessionStorage.setItem(PENDING_GIFT_TOKEN_KEY, result.purchase_token);
        sessionStorage.setItem(PENDING_GIFT_TOKEN_TS_KEY, String(Date.now()));
        setSuccess(
          t('balance.promocode.giftPaymentCreated', {
            defaultValue: 'Ссылка на оплату открыта. После оплаты код появится автоматически.',
          }),
        );
        if (result.payment_url.includes('t.me/')) {
          openTelegramLink(result.payment_url);
        } else {
          openLink(result.payment_url);
        }
      } else {
        setGeneratedGiftCode(`GIFT-${result.purchase_token}`);
        setSuccess(
          t('balance.promocode.giftCodeCreated', {
            defaultValue: 'Подарочный промокод создан. Отправьте его получателю.',
          }),
        );
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['balance'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['gift-sent'] }),
      ]);
    },
    onError: (rawError: unknown) => {
      const axiosError = rawError as { response?: { data?: { detail?: string } } };
      const detail = axiosError.response?.data?.detail;
      setSuccess(null);
      setError(
        detail ||
          t('gift.createError', {
            defaultValue: 'Не удалось создать подарочный код',
          }),
      );
    },
  });

  const onCreateGift = () => {
    if (createGiftMutation.isPending) return;
    if (!giftTariffId || !giftPeriodDays) {
      setError('Тариф и период не выбраны');
      setSuccess(null);
      return;
    }
    if (requiresGatewayPayment && !giftPaymentMethod) {
      setError('Выберите платежный метод');
      setSuccess(null);
      return;
    }

    setGeneratedGiftCode(null);
    createGiftMutation.mutate({
      tariff_id: giftTariffId,
      period_days: giftPeriodDays,
      payment_mode: requiresGatewayPayment ? 'gateway' : 'balance',
      payment_method: requiresGatewayPayment ? (giftPaymentMethod ?? undefined) : undefined,
      payment_option: requiresGatewayPayment ? (giftPaymentOption ?? undefined) : undefined,
      topup_amount_kopeks: requiresGatewayPayment ? topupAmountKopeks : undefined,
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered':
        return { text: 'Активирован', cls: 'bg-emerald-500/20 text-emerald-200' };
      case 'pending_activation':
      case 'paid':
        return { text: 'Ожидает активации', cls: 'bg-sky-500/20 text-sky-100' };
      case 'pending':
        return { text: 'Ожидает оплаты', cls: 'bg-amber-500/20 text-amber-200' };
      case 'failed':
      case 'expired':
        return { text: 'Неактивен', cls: 'bg-rose-500/20 text-rose-200' };
      default:
        return { text: status, cls: 'bg-white/10 text-white/70' };
    }
  };

  const extendGiftMutation = useMutation({
    mutationFn: async (payload: {
      giftToken: string;
      periodDays: number;
      source: 'manual' | 'auto';
    }) => giftApi.extendSentGift(payload.giftToken, payload.periodDays),
    onMutate: ({ giftToken }) => {
      setExtendingToken(giftToken);
      setError(null);
      setSuccess(null);
    },
    onSuccess: async (result) => {
      setExtendingToken(null);
      setPendingGiftExtend((prev) => (prev?.token === result.token ? null : prev));
      setSuccess(
        `Подарок продлен: +${result.added_days} дн. • Списано ${result.charged_amount_label}${
          result.recipient_username ? ` • Получатель: ${result.recipient_username}` : ''
        }`,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['balance'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['gift-sent'] }),
        queryClient.invalidateQueries({ queryKey: ['gift-received'] }),
      ]);
    },
    onError: async (rawError: unknown, payload) => {
      setExtendingToken(null);
      const axiosError = rawError as {
        response?: {
          data?: {
            detail?:
              | string
              | {
                  message?: string;
                  code?: string;
                  missing_amount?: number;
                  required_amount?: number;
                  balance?: number;
                };
          };
        };
      };
      const detail = axiosError.response?.data?.detail;
      const detailObj = typeof detail === 'object' && detail ? detail : null;
      const missingAmount =
        typeof detailObj?.missing_amount === 'number' ? Math.max(0, detailObj.missing_amount) : 0;
      const requiredAmount =
        typeof detailObj?.required_amount === 'number'
          ? Math.max(1, detailObj.required_amount)
          : Math.max(1, currentBalanceKopeks + missingAmount);

      if (payload.source === 'manual' && missingAmount > 0) {
        const selectedMethodId = giftPaymentMethod ?? gatewayMethods[0]?.method_id ?? null;
        const selectedMethod =
          gatewayMethods.find((method) => method.method_id === selectedMethodId) ?? null;
        if (!selectedMethod || !selectedMethodId) {
          setError('Недостаточно средств и нет доступной платежки для автодоплаты');
          return;
        }

        const selectedOption =
          selectedMethod.sub_options?.find((option) => option.id === giftPaymentOption)?.id ??
          selectedMethod.sub_options?.[0]?.id ??
          undefined;
        const topupAmount = Math.max(missingAmount, selectedMethod.min_amount_kopeks ?? 1);

        try {
          const payment = await balanceApi.createTopUp(
            topupAmount,
            selectedMethodId,
            selectedOption,
          );
          setPendingGiftExtend({
            token: payload.giftToken,
            periodDays: payload.periodDays,
            requiredAmountKopeks: requiredAmount,
            createdAt: Date.now(),
          });
          setSuccess(
            'Создана оплата на недостающую сумму. После оплаты подарок продлится автоматически.',
          );
          setError(null);
          if (payment.payment_url.includes('t.me/')) {
            openTelegramLink(payment.payment_url);
          } else {
            openLink(payment.payment_url);
          }
          return;
        } catch {
          setError('Не удалось создать платежку на недостающую сумму');
          return;
        }
      }

      if (pendingGiftExtend?.token === payload.giftToken) {
        setError('Ожидаем оплату: после пополнения нажмите кнопку подтверждения продления.');
        return;
      }
      setError(
        (typeof detail === 'string' ? detail : detailObj?.message) || 'Не удалось продлить подарок',
      );
    },
  });

  const onRenewFromHistory = (gift: SentGift) => {
    if (extendGiftMutation.isPending) return;
    const periodDays = giftExtendPeriods[gift.token] ?? gift.period_days;
    extendGiftMutation.mutate({ giftToken: gift.token, periodDays, source: 'manual' });
  };

  return (
    <div className="ultima-shell ultima-flat-frames">
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner">
        <header className="mb-3">
          <h1 className="text-[clamp(34px,9.5vw,44px)] font-semibold leading-[0.9] tracking-[-0.01em] text-white">
            {t('nav.gift', { defaultValue: 'Подарок' })}
          </h1>
          <p className="text-white/62 mt-1.5 text-[14px] leading-tight">
            {t('balance.promocode.createGiftDescription', {
              defaultValue:
                'Код генерируется автоматически. Получатель просто вводит его на странице промокода и активирует подарок.',
            })}
          </p>
        </header>

        <section className="border-emerald-200/12 min-h-0 flex-1 overflow-y-auto rounded-3xl border bg-[rgba(12,45,42,0.18)] p-3 backdrop-blur-md">
          <div ref={formAnchorRef} />
          {!isGiftConfigLoaded ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <p className="text-[12px] leading-snug text-white/70">{t('common.loading')}</p>
            </div>
          ) : giftConfig?.is_enabled === false ? (
            <div className="rounded-xl border border-amber-300/20 bg-amber-500/10 px-3 py-2.5">
              <p className="text-[12px] leading-snug text-amber-100">
                {t('gift.disabled', {
                  defaultValue: 'Подарки отключены администратором.',
                })}
              </p>
            </div>
          ) : (
            <>
              <p className="text-white/56 text-[11px] leading-snug">
                {t('balance.promocode.giftAutoBalanceTopupDescription', {
                  defaultValue:
                    'Если на балансе хватает средств — подарок оплачивается сразу. Если не хватает — к оплате уйдет только недостающая сумма.',
                })}
              </p>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <select
                  value={giftTariffId ?? ''}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setGiftTariffId(Number.isFinite(next) ? next : null);
                  }}
                  className="border-emerald-200/12 h-10 min-w-0 rounded-xl border bg-emerald-950/35 px-2.5 text-[13px] text-white"
                >
                  {giftTariffOptions.map((tariff) => (
                    <option key={tariff.id} value={tariff.id}>
                      {tariff.name}
                    </option>
                  ))}
                </select>

                <select
                  value={giftPeriodDays ?? ''}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setGiftPeriodDays(Number.isFinite(next) ? next : null);
                  }}
                  className="border-emerald-200/12 h-10 min-w-0 rounded-xl border bg-emerald-950/35 px-2.5 text-[13px] text-white"
                >
                  {giftPeriods.map((period) => (
                    <option key={period.days} value={period.days}>
                      {period.days} {t('gift.days', { defaultValue: 'дн.' })}
                    </option>
                  ))}
                </select>
              </div>

              {requiresGatewayPayment ? (
                <div className="mt-2 space-y-2">
                  <div className="rounded-xl border border-sky-300/20 bg-sky-500/10 px-2.5 py-2">
                    <p className="text-[11px] leading-snug text-sky-100">
                      {t('balance.promocode.giftNeedTopupHint', {
                        defaultValue:
                          'Для покупки подарка не хватает средств на балансе. Оплатите недостающую сумму через выбранную платежку.',
                      })}
                    </p>
                  </div>
                  <select
                    value={giftPaymentMethod ?? ''}
                    onChange={(event) => setGiftPaymentMethod(event.target.value || null)}
                    className="border-emerald-200/12 h-10 w-full rounded-xl border bg-emerald-950/35 px-2.5 text-[13px] text-white"
                  >
                    {gatewayMethods.map((method) => (
                      <option key={method.method_id} value={method.method_id}>
                        {method.display_name}
                      </option>
                    ))}
                  </select>

                  {(selectedGatewayMethod?.sub_options?.length ?? 0) > 0 ? (
                    <select
                      value={giftPaymentOption ?? ''}
                      onChange={(event) => setGiftPaymentOption(event.target.value || null)}
                      className="border-emerald-200/12 h-10 w-full rounded-xl border bg-emerald-950/35 px-2.5 text-[13px] text-white"
                    >
                      {selectedGatewayMethod?.sub_options?.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              ) : null}

              <div className="border-emerald-200/12 mt-2 flex items-center justify-between rounded-xl border bg-emerald-950/35 px-2.5 py-2">
                <span className="text-[11px] text-white/65">
                  {t('balance.promocode.giftPrice', { defaultValue: 'Цена подарка' })}
                </span>
                <span className="text-[13px] font-medium text-white">
                  {selectedGiftPeriod?.price_label ?? '—'}
                </span>
              </div>

              <div className="border-emerald-200/12 mt-2 flex items-center justify-between rounded-xl border bg-emerald-950/35 px-2.5 py-2">
                <span className="text-[11px] text-white/65">
                  {t('balance.promocode.balanceAvailable', { defaultValue: 'Баланс' })}
                </span>
                <span className="text-[13px] font-medium text-white">
                  {(currentBalanceKopeks / 100).toFixed(2)} ₽
                </span>
              </div>

              {requiresGatewayPayment ? (
                <div className="mt-2 flex items-center justify-between rounded-xl border border-sky-300/20 bg-sky-500/10 px-2.5 py-2">
                  <span className="text-[11px] text-sky-100/85">
                    {t('balance.promocode.needToPay', { defaultValue: 'К оплате (недостающее)' })}
                  </span>
                  <span className="text-[13px] font-semibold text-sky-100">
                    {(topupAmountKopeks / 100).toFixed(2)} ₽
                  </span>
                </div>
              ) : null}

              <button
                type="button"
                onClick={onCreateGift}
                disabled={
                  createGiftMutation.isPending ||
                  giftTariffId == null ||
                  giftPeriodDays == null ||
                  (requiresGatewayPayment && !giftPaymentMethod)
                }
                className="mt-2 h-10 w-full rounded-xl border border-emerald-200/25 bg-emerald-400/85 px-3 text-[13px] font-medium text-slate-900 transition hover:bg-emerald-300/90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {createGiftMutation.isPending
                  ? t('common.loading')
                  : requiresGatewayPayment
                    ? t('balance.promocode.createGiftAndPayButton', {
                        defaultValue: 'Оплатить и создать код',
                      })
                    : t('balance.promocode.createGiftButton', {
                        defaultValue: 'Сгенерировать подарочный код',
                      })}
              </button>

              {generatedGiftCode ? (
                <div className="mt-2 rounded-xl border border-emerald-200/15 bg-emerald-950/35 px-2.5 py-2">
                  <p className="text-white/56 text-[11px]">
                    {t('balance.promocode.generatedGiftCode', { defaultValue: 'Подарочный код' })}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="min-w-0 flex-1 break-all font-mono text-[13px] text-emerald-100">
                      {generatedGiftCode}
                    </p>
                    <button
                      type="button"
                      onClick={() => void navigator.clipboard.writeText(generatedGiftCode)}
                      className="h-8 shrink-0 rounded-lg border border-emerald-200/20 bg-emerald-900/35 px-2 text-[12px] text-white/85"
                    >
                      {t('common.copy', { defaultValue: 'Копировать' })}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {giftConfig?.is_enabled ? (
            <div className="mt-3 rounded-2xl border border-emerald-200/10 bg-emerald-950/20 p-3">
              <button
                type="button"
                onClick={() => setHistoryExpanded((prev) => !prev)}
                className="flex w-full items-center justify-between text-left"
              >
                <p className="text-[13px] font-medium text-white/90">История подарков</p>
                <span className="text-[11px] text-white/60">
                  {historyExpanded ? 'Свернуть' : 'Развернуть'}
                </span>
              </button>

              {historyExpanded ? (
                <div className="mt-2 space-y-2">
                  <div className="space-y-2">
                    <p className="text-[12px] text-white/70">Отправленные</p>
                    {sentGifts.length === 0 ? (
                      <p className="text-[11px] text-white/45">Подарков пока нет</p>
                    ) : (
                      sentGifts.slice(0, 20).map((gift) => {
                        const status = getStatusLabel(gift.status);
                        return (
                          <div
                            key={`sent-${gift.token}`}
                            className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2"
                          >
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <p className="truncate text-[12px] text-white/90">
                                {gift.tariff_name ?? 'Тариф'} • {gift.period_days} дн.
                              </p>
                              <span className={`rounded px-2 py-0.5 text-[10px] ${status.cls}`}>
                                {status.text}
                              </span>
                            </div>
                            <p className="text-[11px] text-white/55">
                              Код:{' '}
                              <button
                                type="button"
                                onClick={() => void copyGiftCode(gift.token)}
                                className="inline text-left font-medium text-emerald-200 underline decoration-dotted underline-offset-2 transition hover:text-emerald-100"
                              >
                                GIFT-{gift.token}
                              </button>
                              {gift.activated_by_username ? ` • ${gift.activated_by_username}` : ''}{' '}
                              •{' +'}
                              {gift.period_days} дн.
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <select
                                value={giftExtendPeriods[gift.token] ?? gift.period_days}
                                onChange={(event) => {
                                  const next = Number(event.target.value);
                                  if (!Number.isFinite(next)) return;
                                  setGiftExtendPeriods((prev) => ({ ...prev, [gift.token]: next }));
                                }}
                                className="h-8 min-w-0 rounded-lg border border-white/15 bg-white/10 px-2 text-[11px] text-white"
                              >
                                {(gift.tariff_id != null
                                  ? tariffPeriodsById.get(gift.tariff_id)
                                  : undefined
                                )?.map((period) => (
                                  <option key={`${gift.token}-${period.days}`} value={period.days}>
                                    {period.days} {t('gift.days', { defaultValue: 'дн.' })}
                                  </option>
                                )) ?? (
                                  <option value={gift.period_days}>
                                    {gift.period_days} {t('gift.days', { defaultValue: 'дн.' })}
                                  </option>
                                )}
                              </select>
                              <button
                                type="button"
                                onClick={() => onRenewFromHistory(gift)}
                                disabled={
                                  extendGiftMutation.isPending && extendingToken === gift.token
                                }
                                className="rounded-lg border border-emerald-200/25 bg-emerald-400/85 px-2 py-1 text-[11px] font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-55"
                              >
                                {extendGiftMutation.isPending && extendingToken === gift.token
                                  ? 'Продлеваем...'
                                  : 'Продлить подарок'}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[12px] text-white/70">Полученные</p>
                    {receivedGifts.length === 0 ? (
                      <p className="text-[11px] text-white/45">Полученных подарков нет</p>
                    ) : (
                      receivedGifts.slice(0, 20).map((gift) => {
                        const status = getStatusLabel(gift.status);
                        return (
                          <div
                            key={`recv-${gift.token}`}
                            className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2"
                          >
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <p className="truncate text-[12px] text-white/90">
                                {gift.tariff_name ?? 'Тариф'} • {gift.period_days} дн.
                              </p>
                              <span className={`rounded px-2 py-0.5 text-[10px] ${status.cls}`}>
                                {status.text}
                              </span>
                            </div>
                            <p className="text-[11px] text-white/55">
                              От: {gift.sender_display ?? '—'} • Добавлено: +{gift.period_days} дн.
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {pendingGiftExtend ? (
            <div className="mt-2 rounded-xl border border-amber-200/20 bg-amber-500/10 px-2.5 py-2 text-[11px] text-amber-100">
              Ожидается продление кода GIFT-{pendingGiftExtend.token}. После пополнения подтвердите
              продление вручную.
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    extendGiftMutation.mutate({
                      giftToken: pendingGiftExtend.token,
                      periodDays: pendingGiftExtend.periodDays,
                      source: 'manual',
                    })
                  }
                  disabled={
                    extendGiftMutation.isPending ||
                    (balanceData?.balance_kopeks ?? 0) < pendingGiftExtend.requiredAmountKopeks
                  }
                  className="rounded-lg border border-emerald-200/25 bg-emerald-400/85 px-2 py-1 text-[11px] font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Подтвердить продление
                </button>
                <button
                  type="button"
                  onClick={() => setPendingGiftExtend(null)}
                  disabled={extendGiftMutation.isPending}
                  className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[11px] text-white/90 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Отменить
                </button>
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-2 text-[12px] text-rose-200">{error}</p> : null}
          {success ? <p className="mt-2 text-[12px] text-emerald-200">{success}</p> : null}
        </section>

        <div className="ultima-nav-dock">
          <UltimaBottomNav active="profile" />
        </div>
      </div>
    </div>
  );
}
