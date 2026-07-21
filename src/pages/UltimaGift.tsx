import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Clock3,
  Copy,
  Gift as GiftIcon,
  History,
  LoaderCircle,
  PackageCheck,
  Send,
  Sparkles,
  WalletCards,
} from 'lucide-react';
import { balanceApi } from '@/api/balance';
import { type GiftPurchaseRequest, giftApi, type SentGift } from '@/api/gift';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { UltimaDesktopGift } from '@/components/ultima/desktop/UltimaDesktopGift';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePlatform } from '@/platform/hooks/usePlatform';
import { copyToClipboard } from '@/utils/clipboard';

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
  const isDesktop = useMediaQuery('(min-width: 1024px)');
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
  const [historyTab, setHistoryTab] = useState<'sent' | 'received'>('sent');
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
  const currencySymbol = giftConfig?.currency_symbol ?? '₽';

  const formatCurrency = useCallback(
    (amountKopeks: number) => `${(amountKopeks / 100).toFixed(2)} ${currencySymbol}`,
    [currencySymbol],
  );

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

  const copyGiftCodeValue = useCallback(
    async (code: string) => {
      try {
        await copyToClipboard(code);
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
    },
    [t],
  );

  const copyGiftCode = useCallback(
    async (token: string) => copyGiftCodeValue(`GIFT-${token}`),
    [copyGiftCodeValue],
  );

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
        return { text: 'Активирован', cls: 'bg-emerald-500/[0.20] text-emerald-200' };
      case 'pending_activation':
      case 'paid':
        return { text: 'Ожидает активации', cls: 'bg-sky-500/[0.20] text-sky-100' };
      case 'pending':
        return { text: 'Ожидает оплаты', cls: 'bg-amber-500/[0.20] text-amber-200' };
      case 'failed':
      case 'expired':
        return { text: 'Неактивен', cls: 'bg-rose-500/[0.20] text-rose-200' };
      default:
        return { text: status, cls: 'bg-white/[0.10] text-white/[0.70]' };
    }
  };

  const extendGiftMutation = useMutation({
    mutationFn: async (payload: { giftToken: string; periodDays: number; source: 'manual' }) =>
      giftApi.extendSentGift(payload.giftToken, payload.periodDays),
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

      if (missingAmount > 0) {
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

  const onRenewFromHistory = useCallback(
    (gift: SentGift) => {
      if (extendGiftMutation.isPending) return;
      const periodDays = giftExtendPeriods[gift.token] ?? gift.period_days;
      extendGiftMutation.mutate({ giftToken: gift.token, periodDays, source: 'manual' });
    },
    [extendGiftMutation, giftExtendPeriods],
  );

  const scrollToGiftBuilder = () => {
    formAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const desktopMetrics = useMemo(() => {
    const historyTotal = sentGifts.length + receivedGifts.length;

    return [
      {
        label: t('balance.title', { defaultValue: 'Баланс' }),
        value: formatCurrency(currentBalanceKopeks),
        hint: t('gift.desktopBalanceHint', {
          defaultValue: 'Доступно для мгновенного списания.',
        }),
      },
      {
        label: t('nav.gift', { defaultValue: 'Подарок' }),
        value: selectedGiftPeriod?.price_label ?? '—',
        hint: selectedGiftTariff
          ? `${selectedGiftTariff.name} • ${selectedGiftPeriod?.days ?? '—'} ${t('gift.days', {
              defaultValue: 'дн.',
            })}`
          : t('gift.desktopChooseHint', {
              defaultValue: 'Выберите тариф и период для генерации кода.',
            }),
      },
      {
        label: requiresGatewayPayment
          ? t('balance.promocode.needToPay', { defaultValue: 'К оплате' })
          : t('gift.desktopHistoryMetric', { defaultValue: 'История' }),
        value: requiresGatewayPayment ? formatCurrency(topupAmountKopeks) : String(historyTotal),
        hint: requiresGatewayPayment
          ? (selectedGatewayMethod?.display_name ??
            t('gift.desktopGatewayHint', {
              defaultValue: 'Недостающая сумма уйдет через выбранную платежку.',
            }))
          : `${sentGifts.length} ${t('gift.desktopSentShort', {
              defaultValue: 'отправлено',
            })} • ${receivedGifts.length} ${t('gift.desktopReceivedShort', {
              defaultValue: 'получено',
            })}`,
      },
    ];
  }, [
    currentBalanceKopeks,
    formatCurrency,
    receivedGifts.length,
    requiresGatewayPayment,
    selectedGatewayMethod?.display_name,
    selectedGiftPeriod?.days,
    selectedGiftPeriod?.price_label,
    selectedGiftTariff,
    sentGifts.length,
    t,
    topupAmountKopeks,
  ]);

  const desktopTariffs = useMemo(
    () =>
      giftTariffOptions.map((tariff) => ({
        id: tariff.id,
        name: tariff.name,
        description:
          tariff.description ??
          `${tariff.device_limit} ${t('lite.devicesTotal', {
            defaultValue: 'устройств',
          })} • ${tariff.traffic_limit_gb} GB`,
        deviceLimit: tariff.device_limit,
        isSelected: tariff.id === giftTariffId,
      })),
    [giftTariffId, giftTariffOptions, t],
  );

  const desktopPeriods = useMemo(
    () =>
      giftPeriods.map((period) => ({
        days: period.days,
        label: `${period.days} ${t('gift.days', { defaultValue: 'дн.' })}`,
        priceLabel: period.price_label,
        badge: period.discount_percent
          ? `-${period.discount_percent}%`
          : period.original_price_kopeks
            ? t('gift.desktopBestChoice', { defaultValue: 'Выгодно' })
            : null,
        isSelected: period.days === giftPeriodDays,
      })),
    [giftPeriodDays, giftPeriods, t],
  );

  const desktopPaymentMethods = useMemo(
    () =>
      gatewayMethods.map((method) => ({
        id: method.method_id,
        name: method.display_name,
        description:
          method.description ??
          (method.min_amount_kopeks
            ? t('gift.desktopMinTopup', {
                amount: formatCurrency(method.min_amount_kopeks),
                defaultValue: 'Минимальное пополнение: {{amount}}',
              })
            : null),
        isSelected: method.method_id === giftPaymentMethod,
      })),
    [formatCurrency, gatewayMethods, giftPaymentMethod, t],
  );

  const desktopPaymentSubOptions = useMemo(
    () =>
      (selectedGatewayMethod?.sub_options ?? []).map((option) => ({
        id: option.id,
        name: option.name,
        isSelected: option.id === giftPaymentOption,
      })),
    [giftPaymentOption, selectedGatewayMethod?.sub_options],
  );

  const desktopSummaryRows = useMemo(() => {
    const rows = [
      {
        label: t('gift.tariff', { defaultValue: 'Тариф' }),
        value: selectedGiftTariff?.name ?? '—',
      },
      {
        label: t('gift.period', { defaultValue: 'Период' }),
        value:
          selectedGiftPeriod != null
            ? `${selectedGiftPeriod.days} ${t('gift.days', { defaultValue: 'дн.' })}`
            : '—',
      },
      {
        label: t('balance.title', { defaultValue: 'Баланс' }),
        value: formatCurrency(currentBalanceKopeks),
      },
      {
        label: t('gift.total', { defaultValue: 'Стоимость' }),
        value: selectedGiftPeriod?.price_label ?? '—',
      },
    ];

    if (requiresGatewayPayment) {
      rows.push({
        label: t('balance.promocode.needToPay', { defaultValue: 'К оплате' }),
        value: formatCurrency(topupAmountKopeks),
      });
      rows.push({
        label: t('balance.topUp.paymentMethodTitle', { defaultValue: 'Платежка' }),
        value: selectedGatewayMethod?.display_name ?? '—',
      });
    } else {
      rows.push({
        label: t('gift.desktopPaymentSource', { defaultValue: 'Источник' }),
        value: t('balance.title', { defaultValue: 'Баланс' }),
      });
    }

    return rows;
  }, [
    currentBalanceKopeks,
    formatCurrency,
    requiresGatewayPayment,
    selectedGatewayMethod?.display_name,
    selectedGiftPeriod,
    selectedGiftTariff?.name,
    t,
    topupAmountKopeks,
  ]);

  const pendingPurchaseMessage = useMemo(() => {
    if (!pendingGiftToken) return null;

    switch (giftStatusQuery.data?.status) {
      case 'pending':
        return t('gift.desktopPendingPayment', {
          defaultValue: 'Ожидаем оплату. После подтверждения код появится автоматически.',
        });
      case 'paid':
      case 'pending_activation':
        return t('gift.desktopPaidPending', {
          defaultValue: 'Оплата подтверждена. Обновляем код и историю подарков.',
        });
      case 'failed':
      case 'expired':
        return t('gift.desktopExpiredPayment', {
          defaultValue: 'Ссылка на оплату истекла. Создайте подарок заново.',
        });
      default:
        return t('gift.desktopCheckingPayment', {
          defaultValue: 'Проверяем статус оплаты подарка.',
        });
    }
  }, [giftStatusQuery.data?.status, pendingGiftToken, t]);

  const desktopSentItems = useMemo(
    () =>
      sentGifts.map((gift) => {
        const status = getStatusLabel(gift.status);
        const periodOptions = (gift.tariff_id != null
          ? tariffPeriodsById.get(gift.tariff_id)
          : undefined
        )?.map((period) => ({
          days: period.days,
          label: `${period.days} ${t('gift.days', { defaultValue: 'дн.' })}`,
        })) ?? [
          {
            days: gift.period_days,
            label: `${gift.period_days} ${t('gift.days', { defaultValue: 'дн.' })}`,
          },
        ];

        return {
          token: gift.token,
          title: `${gift.tariff_name ?? t('gift.tariff', { defaultValue: 'Тариф' })} • ${gift.period_days} ${t('gift.days', { defaultValue: 'дн.' })}`,
          subtitle: gift.created_at
            ? t('gift.desktopCreatedAt', {
                date: new Date(gift.created_at).toLocaleDateString(),
                defaultValue: 'Создан {{date}}',
              })
            : t('gift.desktopCreatedRecently', { defaultValue: 'Создан недавно' }),
          detail: gift.activated_by_username
            ? t('gift.desktopActivatedBy', {
                name: gift.activated_by_username,
                defaultValue: 'Активировал {{name}}',
              })
            : gift.gift_recipient_value
              ? `${t('gift.desktopRecipient', { defaultValue: 'Получатель' })}: ${gift.gift_recipient_value}`
              : t('gift.desktopReadyToShare', {
                  defaultValue: 'Код готов к передаче получателю.',
                }),
          statusLabel: status.text,
          statusClassName: status.cls,
          periodOptions,
          selectedPeriodDays: giftExtendPeriods[gift.token] ?? gift.period_days,
          isRenewing: extendGiftMutation.isPending && extendingToken === gift.token,
          onPeriodChange: (days: number) =>
            setGiftExtendPeriods((prev) => ({ ...prev, [gift.token]: days })),
          onRenew: () => onRenewFromHistory(gift),
          onCopyCode: () => void copyGiftCode(gift.token),
        };
      }),
    [
      copyGiftCode,
      extendGiftMutation.isPending,
      extendingToken,
      giftExtendPeriods,
      onRenewFromHistory,
      sentGifts,
      t,
      tariffPeriodsById,
    ],
  );

  const desktopReceivedItems = useMemo(
    () =>
      receivedGifts.map((gift) => {
        const status = getStatusLabel(gift.status);
        const messageText = gift.gift_message?.trim();
        return {
          token: gift.token,
          title: `${gift.tariff_name ?? t('gift.tariff', { defaultValue: 'Тариф' })} • ${gift.period_days} ${t('gift.days', { defaultValue: 'дн.' })}`,
          subtitle: gift.created_at
            ? t('gift.desktopReceivedAt', {
                date: new Date(gift.created_at).toLocaleDateString(),
                defaultValue: 'Получен {{date}}',
              })
            : t('gift.desktopReceivedRecently', { defaultValue: 'Получен недавно' }),
          detail: messageText
            ? `${t('gift.desktopMessage', { defaultValue: 'Сообщение' })}: ${messageText}`
            : t('gift.desktopFrom', {
                name: gift.sender_display ?? '—',
                defaultValue: 'От {{name}}',
              }),
          statusLabel: status.text,
          statusClassName: status.cls,
        };
      }),
    [receivedGifts, t],
  );

  const desktopPendingExtend = useMemo(() => {
    if (!pendingGiftExtend) return null;

    return {
      tokenLabel: `GIFT-${pendingGiftExtend.token}`,
      description: t('gift.desktopPendingExtendDescription', {
        token: `GIFT-${pendingGiftExtend.token}`,
        defaultValue: 'Подарок {{token}} ожидает подтверждения продления.',
      }),
      canConfirm: (balanceData?.balance_kopeks ?? 0) >= pendingGiftExtend.requiredAmountKopeks,
      isPending: extendGiftMutation.isPending,
      onConfirm: () =>
        extendGiftMutation.mutate({
          giftToken: pendingGiftExtend.token,
          periodDays: pendingGiftExtend.periodDays,
          source: 'manual',
        }),
      onCancel: () => setPendingGiftExtend(null),
    };
  }, [balanceData?.balance_kopeks, extendGiftMutation, pendingGiftExtend, t]);

  const copyGeneratedGiftCode = async () => {
    if (!generatedGiftCode) return;
    await copyGiftCodeValue(generatedGiftCode);
  };

  if (isDesktop) {
    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-gift-desktop">
        <div className="ultima-shell-aura" />
        <UltimaDesktopGift
          title={t('nav.gift', { defaultValue: 'Подарок' })}
          subtitle={t('balance.promocode.createGiftDescription', {
            defaultValue:
              'Создайте подарочный код, отправьте его человеку и следите за активацией в истории.',
          })}
          metrics={desktopMetrics}
          purchaseIntro={t('gift.desktopBuilderSubtitle', {
            defaultValue:
              'Выберите тариф, период и при необходимости платежку. Код будет создан автоматически после оплаты.',
          })}
          purchaseAnchorRef={formAnchorRef}
          isLoading={!isGiftConfigLoaded}
          disabledMessage={
            isGiftConfigLoaded && giftConfig?.is_enabled === false
              ? t('gift.disabled', {
                  defaultValue: 'Подарки отключены администратором.',
                })
              : null
          }
          purchaseHint={t('balance.promocode.giftAutoBalanceTopupDescription', {
            defaultValue:
              'Если на балансе хватает средств, подарок оплачивается сразу. Если не хватает, к оплате уходит только недостающая сумма.',
          })}
          gatewayHint={
            requiresGatewayPayment
              ? t('balance.promocode.giftNeedTopupHint', {
                  defaultValue:
                    'Для покупки подарка не хватает средств на балансе. Оплатите только недостающую сумму через выбранную платежку.',
                })
              : null
          }
          tariffs={desktopTariffs}
          periods={desktopPeriods}
          paymentMethods={desktopPaymentMethods}
          paymentSubOptions={desktopPaymentSubOptions}
          requiresGatewayPayment={requiresGatewayPayment}
          summaryRows={desktopSummaryRows}
          primaryActionLabel={
            createGiftMutation.isPending
              ? t('common.loading', { defaultValue: 'Загрузка...' })
              : requiresGatewayPayment
                ? t('balance.promocode.createGiftAndPayButton', {
                    defaultValue: 'Оплатить и создать код',
                  })
                : t('balance.promocode.createGiftButton', {
                    defaultValue: 'Сгенерировать подарочный код',
                  })
          }
          isPrimaryActionDisabled={
            createGiftMutation.isPending ||
            giftTariffId == null ||
            giftPeriodDays == null ||
            (requiresGatewayPayment && !giftPaymentMethod)
          }
          pendingPurchaseMessage={pendingPurchaseMessage}
          generatedGiftCode={generatedGiftCode}
          error={error}
          success={success}
          sentItems={desktopSentItems}
          receivedItems={desktopReceivedItems}
          pendingExtend={desktopPendingExtend}
          bottomNav={<UltimaBottomNav active="profile" />}
          onScrollToPurchase={scrollToGiftBuilder}
          onSelectTariff={setGiftTariffId}
          onSelectPeriod={setGiftPeriodDays}
          onSelectPaymentMethod={setGiftPaymentMethod}
          onSelectPaymentSubOption={setGiftPaymentOption}
          onCreate={onCreateGift}
          onCopyGeneratedCode={() => void copyGeneratedGiftCode()}
        />
      </div>
    );
  }

  const isGiftActionDisabled =
    createGiftMutation.isPending ||
    giftTariffId == null ||
    giftPeriodDays == null ||
    (requiresGatewayPayment && !giftPaymentMethod);

  return (
    <div
      className="ultima-shell ultima-shell-wide ultima-flat-frames"
      data-testid="ultima-gift-page"
    >
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <header className="mb-4 flex items-start gap-3 px-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/[0.16] bg-emerald-300/[0.09] text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <GiftIcon className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[30px] font-semibold leading-none text-white">
                {t('gift.title', { defaultValue: 'Подарить подписку' })}
              </h1>
              <span className="rounded-full border border-emerald-200/[0.16] bg-emerald-300/[0.08] px-2.5 py-1 text-[10px] font-medium uppercase text-emerald-100/[0.80]">
                {t('gift.giftLabel', { defaultValue: 'Подарок' })}
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-[1.45] text-white/[0.58]">
              {t('balance.promocode.createGiftDescription', {
                defaultValue:
                  'Выберите подписку, получите код и отправьте его получателю любым удобным способом.',
              })}
            </p>
          </div>
        </header>

        <main
          className="ultima-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pb-2"
          data-testid="ultima-gift-scroll"
        >
          <section
            ref={formAnchorRef}
            className="rounded-[28px] border border-emerald-200/[0.14] bg-[rgba(9,35,34,0.58)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
            data-testid="ultima-gift-builder"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase text-emerald-100/[0.55]">
                  {t('gift.desktopBuilderTitle', { defaultValue: 'Новый подарок' })}
                </p>
                <h2 className="mt-1 text-[21px] font-semibold leading-tight text-white">
                  {selectedGiftTariff?.name ?? t('common.loading', { defaultValue: 'Загрузка...' })}
                </h2>
              </div>
              <div className="flex items-center gap-1.5" aria-label="3 шага">
                {[1, 2, 3].map((step) => (
                  <span
                    key={step}
                    className={`h-1.5 rounded-full transition-all ${
                      step === 1 ||
                      (step === 2 && giftPeriodDays) ||
                      (step === 3 && giftPaymentMethod)
                        ? 'w-6 bg-emerald-300'
                        : 'w-2.5 bg-white/[0.15]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {!isGiftConfigLoaded ? (
              <div className="flex min-h-36 items-center justify-center text-white/[0.60]">
                <LoaderCircle className="h-6 w-6 animate-spin" />
              </div>
            ) : giftConfig?.is_enabled === false ? (
              <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200/[0.20] bg-amber-400/[0.08] p-3 text-amber-100">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-[13px] leading-relaxed">
                  {t('gift.disabled', { defaultValue: 'Подарки отключены администратором.' })}
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <div>
                  <div className="mb-2.5 flex items-center gap-2 text-[11px] font-medium uppercase text-white/[0.45]">
                    <Sparkles className="h-4 w-4 text-emerald-200/[0.70]" />
                    {t('gift.tariff', { defaultValue: 'Тариф' })}
                  </div>
                  <div className="grid gap-2">
                    {giftTariffOptions.map((tariff) => {
                      const selected = tariff.id === giftTariffId;
                      return (
                        <button
                          key={tariff.id}
                          type="button"
                          onClick={() => setGiftTariffId(tariff.id)}
                          aria-pressed={selected}
                          data-testid={`ultima-gift-tariff-${tariff.id}`}
                          className={`flex min-h-[70px] items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${
                            selected
                              ? 'border-emerald-200/[0.35] bg-emerald-300/[0.1]'
                              : 'border-white/[0.09] bg-white/[0.035]'
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                              selected
                                ? 'border-emerald-200/[0.30] bg-emerald-300/[0.15] text-emerald-100'
                                : 'border-white/[0.10] bg-white/[0.04] text-white/[0.45]'
                            }`}
                          >
                            {selected ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <GiftIcon className="h-4 w-4" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[15px] font-medium text-white">
                              {tariff.name}
                            </span>
                            <span className="mt-1 line-clamp-2 block text-[11px] leading-snug text-white/[0.50]">
                              {tariff.description ??
                                `${tariff.device_limit} ${t('lite.devicesTotal', { defaultValue: 'устр.' })} · ${tariff.traffic_limit_gb} ГБ`}
                            </span>
                          </span>
                          <span className="shrink-0 rounded-full border border-white/[0.10] px-2.5 py-1 text-[10px] text-white/[0.55]">
                            {tariff.device_limit}{' '}
                            {t('lite.devicesTotal', { defaultValue: 'устр.' })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-2.5 flex items-center gap-2 text-[11px] font-medium uppercase text-white/[0.45]">
                    <Clock3 className="h-4 w-4 text-emerald-200/[0.70]" />
                    {t('subscription.period', { defaultValue: 'Срок подписки' })}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {giftPeriods.map((period) => {
                      const selected = period.days === giftPeriodDays;
                      return (
                        <button
                          key={period.days}
                          type="button"
                          onClick={() => setGiftPeriodDays(period.days)}
                          aria-pressed={selected}
                          data-testid={`ultima-gift-period-${period.days}`}
                          className={`relative min-h-[88px] rounded-2xl border p-3 text-left transition ${
                            selected
                              ? 'border-emerald-200/[0.35] bg-emerald-300/[0.1]'
                              : 'border-white/[0.09] bg-white/[0.035]'
                          }`}
                        >
                          {period.discount_percent ? (
                            <span className="absolute right-2.5 top-2.5 rounded-full bg-emerald-300/[0.15] px-2 py-0.5 text-[9px] font-medium text-emerald-100">
                              -{period.discount_percent}%
                            </span>
                          ) : null}
                          <span className="block text-[14px] font-medium text-white">
                            {period.days} {t('gift.days', { defaultValue: 'дн.' })}
                          </span>
                          <span className="mt-3 block text-[20px] font-semibold leading-none text-white">
                            {period.price_label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {requiresGatewayPayment ? (
                  <div>
                    <div className="mb-2.5 flex items-center gap-2 text-[11px] font-medium uppercase text-white/[0.45]">
                      <WalletCards className="h-4 w-4 text-amber-200/[0.80]" />
                      {t('balance.topUp.paymentMethodTitle', { defaultValue: 'Способ оплаты' })}
                    </div>
                    <div className="mb-2.5 rounded-2xl border border-amber-200/[0.18] bg-amber-300/[0.07] px-3 py-2.5 text-[11px] leading-relaxed text-amber-50/[0.80]">
                      {t('balance.promocode.giftNeedTopupHint', {
                        defaultValue:
                          'Баланс будет использован первым. Через платежную страницу нужно внести только недостающую сумму.',
                      })}
                    </div>
                    <div className="grid gap-2">
                      {gatewayMethods.map((method) => {
                        const selected = method.method_id === giftPaymentMethod;
                        return (
                          <button
                            key={method.method_id}
                            type="button"
                            onClick={() => setGiftPaymentMethod(method.method_id)}
                            aria-pressed={selected}
                            className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 text-left ${
                              selected
                                ? 'border-emerald-200/[0.35] bg-emerald-300/[0.1]'
                                : 'border-white/[0.09] bg-white/[0.035]'
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="block text-[14px] font-medium text-white">
                                {method.display_name}
                              </span>
                              {method.description ? (
                                <span className="mt-0.5 block truncate text-[10px] text-white/[0.45]">
                                  {method.description}
                                </span>
                              ) : null}
                            </span>
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                                selected
                                  ? 'border-emerald-200/[0.40] bg-emerald-300/[0.20] text-emerald-100'
                                  : 'border-white/[0.15] text-transparent'
                              }`}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {(selectedGatewayMethod?.sub_options?.length ?? 0) > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedGatewayMethod?.sub_options?.map((option) => {
                          const selected = option.id === giftPaymentOption;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setGiftPaymentOption(option.id)}
                              aria-pressed={selected}
                              className={`rounded-full border px-3 py-2 text-[11px] ${
                                selected
                                  ? 'border-emerald-200/[0.35] bg-emerald-300/[0.12] text-emerald-50'
                                  : 'border-white/[0.10] bg-white/[0.035] text-white/[0.55]'
                              }`}
                            >
                              {option.name}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid grid-cols-3 divide-x divide-white/[0.08] rounded-2xl border border-white/[0.09] bg-black/[0.10] px-2 py-3">
                  <div className="min-w-0 px-2">
                    <span className="block text-[9px] uppercase text-white/[0.35]">
                      {t('balance.promocode.balanceAvailable', { defaultValue: 'Баланс' })}
                    </span>
                    <span className="mt-1 block truncate text-[13px] font-medium text-white">
                      {formatCurrency(currentBalanceKopeks)}
                    </span>
                  </div>
                  <div className="min-w-0 px-2">
                    <span className="block text-[9px] uppercase text-white/[0.35]">
                      {t('balance.promocode.giftPrice', { defaultValue: 'Стоимость' })}
                    </span>
                    <span className="mt-1 block truncate text-[13px] font-medium text-white">
                      {selectedGiftPeriod?.price_label ?? '—'}
                    </span>
                  </div>
                  <div className="min-w-0 px-2">
                    <span className="block text-[9px] uppercase text-white/[0.35]">
                      {t('balance.promocode.needToPay', { defaultValue: 'К оплате' })}
                    </span>
                    <span
                      className={`mt-1 block truncate text-[13px] font-medium ${requiresGatewayPayment ? 'text-amber-100' : 'text-emerald-100'}`}
                    >
                      {requiresGatewayPayment
                        ? formatCurrency(topupAmountKopeks)
                        : t('gift.fromBalance', { defaultValue: 'С баланса' })}
                    </span>
                  </div>
                </div>

                {pendingPurchaseMessage ? (
                  <div className="flex gap-2.5 rounded-2xl border border-sky-200/[0.16] bg-sky-300/[0.07] p-3 text-[12px] leading-relaxed text-sky-50/[0.85]">
                    <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                    {pendingPurchaseMessage}
                  </div>
                ) : null}

                {error ? (
                  <div
                    className="flex gap-2.5 rounded-2xl border border-rose-200/[0.18] bg-rose-300/[0.08] p-3 text-[12px] leading-relaxed text-rose-100"
                    role="alert"
                  >
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                ) : null}
                {success ? (
                  <div
                    className="flex gap-2.5 rounded-2xl border border-emerald-200/[0.18] bg-emerald-300/[0.08] p-3 text-[12px] leading-relaxed text-emerald-100"
                    role="status"
                  >
                    <PackageCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    {success}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={onCreateGift}
                  disabled={isGiftActionDisabled}
                  data-testid="ultima-gift-create"
                  className="ultima-btn-pill ultima-btn-primary flex min-h-[52px] w-full items-center justify-between gap-3 px-5 text-[15px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    {createGiftMutation.isPending ? (
                      <LoaderCircle className="h-5 w-5 shrink-0 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5 shrink-0" />
                    )}
                    <span className="truncate">
                      {createGiftMutation.isPending
                        ? t('common.loading', { defaultValue: 'Создаем...' })
                        : requiresGatewayPayment
                          ? t('balance.promocode.createGiftAndPayButton', {
                              defaultValue: 'Оплатить и создать код',
                            })
                          : t('balance.promocode.createGiftButton', {
                              defaultValue: 'Создать подарочный код',
                            })}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] text-white/[0.80]">
                    {requiresGatewayPayment
                      ? formatCurrency(topupAmountKopeks)
                      : selectedGiftPeriod?.price_label}
                  </span>
                </button>

                {generatedGiftCode ? (
                  <div
                    className="rounded-[24px] border border-emerald-200/[0.24] bg-emerald-300/[0.09] p-4"
                    data-testid="ultima-gift-generated-code"
                  >
                    <div className="flex items-center gap-2 text-[12px] font-medium text-emerald-100">
                      <PackageCheck className="h-5 w-5" />
                      {t('balance.promocode.generatedGiftCode', {
                        defaultValue: 'Подарочный код готов',
                      })}
                    </div>
                    <p className="mt-3 break-all rounded-2xl border border-white/[0.10] bg-black/[0.15] px-3 py-3 font-mono text-[14px] text-white">
                      {generatedGiftCode}
                    </p>
                    <button
                      type="button"
                      onClick={() => void copyGiftCodeValue(generatedGiftCode)}
                      className="ultima-btn-pill ultima-btn-secondary mt-3 flex min-h-11 w-full items-center justify-center gap-2 px-4 text-[13px]"
                    >
                      <Copy className="h-4 w-4" />
                      {t('common.copy', { defaultValue: 'Копировать код' })}
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </section>

          {pendingGiftExtend ? (
            <section className="rounded-[24px] border border-amber-200/[0.2] bg-amber-300/[0.08] p-4 text-amber-50">
              <div className="flex gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-[14px] font-medium">Ожидается продление подарка</h3>
                  <p className="mt-1 break-all text-[11px] leading-relaxed text-amber-50/[0.65]">
                    GIFT-{pendingGiftExtend.token}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
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
                  className="ultima-btn-pill ultima-btn-primary min-h-11 px-3 text-[12px] disabled:opacity-50"
                >
                  Подтвердить
                </button>
                <button
                  type="button"
                  onClick={() => setPendingGiftExtend(null)}
                  disabled={extendGiftMutation.isPending}
                  className="ultima-btn-pill ultima-btn-secondary min-h-11 px-3 text-[12px] disabled:opacity-50"
                >
                  {t('common.cancel', { defaultValue: 'Отменить' })}
                </button>
              </div>
            </section>
          ) : null}

          {giftConfig?.is_enabled ? (
            <section
              className="rounded-[28px] border border-emerald-200/[0.12] bg-[rgba(9,35,34,0.5)] p-4 backdrop-blur-xl"
              data-testid="ultima-gift-history"
            >
              <button
                type="button"
                onClick={() => setHistoryExpanded((prev) => !prev)}
                aria-expanded={historyExpanded}
                className="flex w-full items-center gap-3 text-left"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.04] text-white/[0.65]">
                  <History className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-medium text-white">История подарков</span>
                  <span className="mt-0.5 block text-[11px] text-white/[0.45]">
                    {sentGifts.length} отправлено · {receivedGifts.length} получено
                  </span>
                </span>
                {historyExpanded ? (
                  <ChevronUp className="h-5 w-5 shrink-0 text-white/[0.55]" />
                ) : (
                  <ChevronDown className="h-5 w-5 shrink-0 text-white/[0.55]" />
                )}
              </button>

              {historyExpanded ? (
                <div className="mt-4">
                  <div className="grid grid-cols-2 rounded-2xl border border-white/[0.08] bg-black/[0.10] p-1">
                    <button
                      type="button"
                      onClick={() => setHistoryTab('sent')}
                      aria-pressed={historyTab === 'sent'}
                      className={`min-h-10 rounded-xl text-[12px] font-medium ${
                        historyTab === 'sent' ? 'bg-white/[0.09] text-white' : 'text-white/[0.45]'
                      }`}
                    >
                      Отправленные · {sentGifts.length}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryTab('received')}
                      aria-pressed={historyTab === 'received'}
                      className={`min-h-10 rounded-xl text-[12px] font-medium ${
                        historyTab === 'received'
                          ? 'bg-white/[0.09] text-white'
                          : 'text-white/[0.45]'
                      }`}
                    >
                      Полученные · {receivedGifts.length}
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {historyTab === 'sent' ? (
                      sentGifts.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-white/[0.10] p-4 text-center text-[12px] text-white/[0.40]">
                          Отправленных подарков пока нет
                        </p>
                      ) : (
                        sentGifts.slice(0, 20).map((gift) => {
                          const status = getStatusLabel(gift.status);
                          return (
                            <article
                              key={`sent-${gift.token}`}
                              className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-[13px] font-medium text-white">
                                    {gift.tariff_name ?? 'Тариф'} · {gift.period_days} дн.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => void copyGiftCode(gift.token)}
                                    className="mt-1 flex max-w-full items-center gap-1.5 text-left text-[10px] text-emerald-100/[0.70]"
                                  >
                                    <Copy className="h-3 w-3 shrink-0" />
                                    <span className="truncate font-mono">GIFT-{gift.token}</span>
                                  </button>
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-1 text-[9px] ${status.cls}`}
                                >
                                  {status.text}
                                </span>
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <select
                                  value={giftExtendPeriods[gift.token] ?? gift.period_days}
                                  onChange={(event) => {
                                    const next = Number(event.target.value);
                                    if (!Number.isFinite(next)) return;
                                    setGiftExtendPeriods((prev) => ({
                                      ...prev,
                                      [gift.token]: next,
                                    }));
                                  }}
                                  aria-label={`Период продления GIFT-${gift.token}`}
                                  className="h-10 min-w-0 flex-1 rounded-xl border border-white/[0.12] bg-white/[0.05] px-2.5 text-[11px] text-white"
                                >
                                  {(gift.tariff_id != null
                                    ? tariffPeriodsById.get(gift.tariff_id)
                                    : undefined
                                  )?.map((period) => (
                                    <option
                                      key={`${gift.token}-${period.days}`}
                                      value={period.days}
                                    >
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
                                  className="ultima-btn-pill ultima-btn-secondary min-h-10 shrink-0 px-3 text-[11px] disabled:opacity-50"
                                >
                                  {extendGiftMutation.isPending && extendingToken === gift.token
                                    ? 'Продлеваем...'
                                    : 'Продлить'}
                                </button>
                              </div>
                            </article>
                          );
                        })
                      )
                    ) : receivedGifts.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-white/[0.10] p-4 text-center text-[12px] text-white/[0.40]">
                        Полученных подарков пока нет
                      </p>
                    ) : (
                      receivedGifts.slice(0, 20).map((gift) => {
                        const status = getStatusLabel(gift.status);
                        return (
                          <article
                            key={`recv-${gift.token}`}
                            className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-white">
                                  {gift.tariff_name ?? 'Тариф'} · {gift.period_days} дн.
                                </p>
                                <p className="mt-1 truncate text-[10px] text-white/[0.45]">
                                  От: {gift.sender_display ?? 'Не указан'}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-2 py-1 text-[9px] ${status.cls}`}
                              >
                                {status.text}
                              </span>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </main>

        <div className="ultima-mobile-dock-footer">
          <div className="ultima-nav-dock">
            <UltimaBottomNav active="profile" />
          </div>
        </div>
      </div>
    </div>
  );
}
