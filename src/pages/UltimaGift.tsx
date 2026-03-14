import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { giftApi } from '@/api/gift';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { usePlatform } from '@/platform/hooks/usePlatform';

const PENDING_GIFT_TOKEN_KEY = 'ultima_pending_gift_token';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: giftConfig } = useQuery({
    queryKey: ['gift-config'],
    queryFn: giftApi.getConfig,
    staleTime: 15000,
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
  const currentBalanceKopeks = giftConfig?.balance_kopeks ?? 0;
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
    const tokenFromStorage = localStorage.getItem(PENDING_GIFT_TOKEN_KEY);
    const token = tokenFromUrl || tokenFromStorage;
    if (!token) return;
    setPendingGiftToken((prev) => prev ?? token);
    localStorage.setItem(PENDING_GIFT_TOKEN_KEY, token);
  }, [searchParams]);

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
      localStorage.removeItem(PENDING_GIFT_TOKEN_KEY);
      if (searchParams.get('giftToken')) {
        const next = new URLSearchParams(searchParams);
        next.delete('giftToken');
        setSearchParams(next, { replace: true });
      }
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['balance'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      ]);
    }
  }, [giftStatusQuery.data, pendingGiftToken, queryClient, searchParams, setSearchParams, t]);

  const createGiftMutation = useMutation({
    mutationFn: async () => {
      if (!giftTariffId || !giftPeriodDays) {
        throw new Error('Gift tariff is not selected');
      }
      if (requiresGatewayPayment && !giftPaymentMethod) {
        throw new Error('Payment method is not selected');
      }

      return giftApi.createPurchase({
        tariff_id: giftTariffId,
        period_days: giftPeriodDays,
        payment_mode: requiresGatewayPayment ? 'gateway' : 'balance',
        payment_method: requiresGatewayPayment ? (giftPaymentMethod ?? undefined) : undefined,
        payment_option: requiresGatewayPayment ? (giftPaymentOption ?? undefined) : undefined,
        topup_amount_kopeks: requiresGatewayPayment ? topupAmountKopeks : undefined,
      });
    },
    onSuccess: async (result) => {
      setError(null);
      if (result.payment_url) {
        setPendingGiftToken(result.purchase_token);
        localStorage.setItem(PENDING_GIFT_TOKEN_KEY, result.purchase_token);
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
    setGeneratedGiftCode(null);
    createGiftMutation.mutate();
  };

  return (
    <div className="ultima-shell ultima-flat-frames">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_70%_at_50%_45%,rgba(33,208,154,0.14),rgba(7,20,46,0.02)_62%,rgba(7,20,46,0)_100%)]" />
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
          {!giftConfig?.is_enabled ? (
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
