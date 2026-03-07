import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { subscriptionApi } from '@/api/subscription';
import { useCurrency } from '@/hooks/useCurrency';
import type { Tariff, TariffPeriod } from '@/types';

const Dot = ({ active = false }: { active?: boolean }) => (
  <span
    className={
      active
        ? 'h-5 w-5 rounded-full border-2 border-emerald-400'
        : 'h-2 w-2 rounded-full bg-white/35'
    }
  />
);

export function UltimaSubscription() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatAmount, currencySymbol } = useCurrency();

  const [selectedTariffId, setSelectedTariffId] = useState<number | null>(null);
  const [selectedPeriodDays, setSelectedPeriodDays] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: purchaseOptions, isLoading } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: subscriptionApi.getPurchaseOptions,
    refetchOnMount: 'always',
  });

  const tariffs = useMemo(() => {
    if (!purchaseOptions || purchaseOptions.sales_mode !== 'tariffs') return [] as Tariff[];
    return purchaseOptions.tariffs.filter((t) => t.is_available);
  }, [purchaseOptions]);

  useEffect(() => {
    if (!tariffs.length) return;

    const nextTariffId = selectedTariffId ?? tariffs.find((t) => t.is_current)?.id ?? tariffs[0].id;
    const tariff = tariffs.find((t) => t.id === nextTariffId) ?? tariffs[0];

    setSelectedTariffId(tariff.id);
    if (!selectedPeriodDays) {
      const preferred = tariff.periods.find((p) => p.months === 6) ?? tariff.periods[0];
      setSelectedPeriodDays(preferred?.days ?? null);
    }
  }, [tariffs, selectedTariffId, selectedPeriodDays]);

  const selectedTariff = tariffs.find((t) => t.id === selectedTariffId) ?? null;
  const periods = selectedTariff?.periods ?? [];
  const selectedPeriod = periods.find((p) => p.days === selectedPeriodDays) ?? null;

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTariff || !selectedPeriod) throw new Error('No tariff selected');
      return subscriptionApi.purchaseTariff(selectedTariff.id, selectedPeriod.days);
    },
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['subscription'] }),
        queryClient.invalidateQueries({ queryKey: ['purchase-options'] }),
        queryClient.invalidateQueries({ queryKey: ['balance'] }),
      ]);
      navigate('/');
    },
    onError: (err: { response?: { data?: { detail?: string; message?: string } } }) => {
      setError(err.response?.data?.detail || err.response?.data?.message || t('common.error'));
    },
  });

  if (isLoading) {
    return <div className="h-[100dvh] w-full bg-[#08201f]" />;
  }

  if (!selectedTariff || !selectedPeriod) {
    return (
      <div className="flex h-[100dvh] items-center justify-center text-dark-200">
        {t('subscription.noTariffsAvailable', { defaultValue: 'Тарифы недоступны' })}
      </div>
    );
  }

  const formatPrice = (kopeks: number) => `${formatAmount(kopeks / 100)} ${currencySymbol}`;
  const getPeriodLabel = (period: TariffPeriod) => {
    if (period.months === 1) return t('lite.oneMonth', { defaultValue: '1 месяц' });
    if (period.months > 0)
      return t('lite.monthsLabel', {
        count: period.months,
        defaultValue: `${period.months} месяца`,
      });
    return `${period.days} ${t('common.days', { defaultValue: 'дней' })}`;
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_78%_50%,rgba(19,176,132,0.35),rgba(5,20,22,0.98)_58%)] px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-4">
      <div className="mx-auto flex h-full max-w-md flex-col">
        <header className="mb-3">
          <h1 className="text-[56px] font-semibold leading-[0.94] text-white">
            {t('lite.buySubscription', { defaultValue: 'Покупка подписки' })}
          </h1>
          <p className="mt-2 text-[28px] leading-tight text-white/75">
            {t('lite.subscriptionHint', {
              defaultValue:
                'Подключайте больше устройств и пользуйтесь сервисом вместе с друзьями и близкими',
            })}
          </p>
        </header>

        <section className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="mb-3 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/90">
              1
            </span>
            <div>
              <p className="text-[34px] font-medium text-white">
                {t('subscription.devicesLabel', { defaultValue: 'Устройство' })}
              </p>
              <p className="text-[24px] text-white/70">
                {t('lite.oneDeviceInPlan', { defaultValue: 'Одновременно в подписке' })}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-black/15 p-3">
            <div className="mb-2 h-1 w-full rounded-full bg-white/20" />
            <div className="flex items-center justify-between px-2">
              <Dot active />
              <Dot />
              <Dot />
              <Dot />
              <Dot />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          {periods.map((period) => {
            const active = period.days === selectedPeriod.days;
            return (
              <button
                key={period.days}
                type="button"
                onClick={() => setSelectedPeriodDays(period.days)}
                className={`rounded-3xl border p-4 text-left transition ${
                  active
                    ? 'border-emerald-400 bg-[#0a2522] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                    : 'border-white/12 bg-black/20'
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[30px] font-medium text-white">
                    {getPeriodLabel(period)}
                  </span>
                  {active && <span className="text-emerald-300">★</span>}
                </div>
                <p className="text-[52px] font-semibold leading-none text-white">
                  {formatPrice(period.price_kopeks)}
                </p>
                <p className="mt-1 text-[24px] text-white/70">
                  {period.price_per_month_kopeks > 0
                    ? `${formatPrice(period.price_per_month_kopeks)} ${t('subscription.perMonth', { defaultValue: 'в месяц' })}`
                    : ''}
                </p>
              </button>
            );
          })}
        </section>

        <div className="mt-auto pt-4">
          {error && <p className="mb-3 text-center text-[24px] text-red-300">{error}</p>}
          <button
            type="button"
            onClick={() => purchaseMutation.mutate()}
            disabled={purchaseMutation.isPending}
            className="flex w-full items-center justify-between rounded-full border border-[#52ecc6]/40 bg-[#12cd97] px-6 py-4 text-[30px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(10,123,94,0.28)]"
          >
            <span>{t('lite.paySubscription', { defaultValue: 'Оплатить подписку' })}</span>
            <span className="flex items-center gap-2 text-white/95">
              {formatPrice(selectedPeriod.price_kopeks)}
              {selectedPeriod.original_price_kopeks ? (
                <span className="text-[24px] text-white/55 line-through">
                  {formatPrice(selectedPeriod.original_price_kopeks)}
                </span>
              ) : null}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
