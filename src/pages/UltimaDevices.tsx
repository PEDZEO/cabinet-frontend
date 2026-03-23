import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { subscriptionApi } from '@/api/subscription';
import {
  UltimaDesktopPanel,
  UltimaDesktopSectionLayout,
} from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import { useCurrency } from '@/hooks/useCurrency';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const DeviceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="6.5" y="3.5" width="11" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M10 17.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path
      d="M5 7.5h14M9 7.5V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path d="M8 7.5v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-10" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

type ApiErrorLike = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

export function UltimaDevices() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatAmount, currencySymbol } = useCurrency();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [addCount, setAddCount] = useState(1);
  const [reduceLimit, setReduceLimit] = useState(1);

  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getSubscription,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });

  const hasSubscription = Boolean(subscriptionData?.has_subscription);
  const isActiveTrial = Boolean(
    subscriptionData?.subscription?.is_trial &&
    subscriptionData?.subscription?.is_active &&
    !subscriptionData?.subscription?.is_expired,
  );
  const currentLimit = subscriptionData?.subscription?.device_limit ?? 0;

  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: subscriptionApi.getDevices,
    enabled: hasSubscription,
    staleTime: 10000,
    placeholderData: (previousData) => previousData,
  });

  const { data: reductionInfo } = useQuery({
    queryKey: ['device-reduction-info'],
    queryFn: subscriptionApi.getDeviceReductionInfo,
    enabled: hasSubscription,
    staleTime: 10000,
    placeholderData: (previousData) => previousData,
  });

  const { data: devicePrice } = useQuery({
    queryKey: ['device-price', addCount],
    queryFn: () => subscriptionApi.getDevicePrice(addCount),
    enabled: hasSubscription && addCount > 0 && !isActiveTrial,
    staleTime: 10000,
    placeholderData: (previousData) => previousData,
  });

  const maxAdd = Math.max(1, devicePrice?.can_add ?? 10);

  useEffect(() => {
    if (reductionInfo?.current_device_limit) {
      setReduceLimit((prev) =>
        Math.min(
          reductionInfo.current_device_limit,
          Math.max(reductionInfo.min_device_limit || 1, prev || reductionInfo.current_device_limit),
        ),
      );
    } else if (currentLimit > 0) {
      setReduceLimit(currentLimit);
    }
  }, [currentLimit, reductionInfo?.current_device_limit, reductionInfo?.min_device_limit]);

  useEffect(() => {
    if (!success) return;
    const id = window.setTimeout(() => setSuccess(null), 2400);
    return () => window.clearTimeout(id);
  }, [success]);

  const getErrorMessage = (err: unknown) => {
    const detail = (err as ApiErrorLike)?.response?.data?.detail;
    if (detail && detail.trim().length > 0) return detail;
    return t('common.error', { defaultValue: 'Ошибка' });
  };

  const getReductionReasonText = (reason?: string) => {
    const normalized = reason?.toLowerCase() ?? '';
    if (!normalized) return 'Сейчас уменьшить количество устройств нельзя.';
    if (normalized.includes('trial')) return 'Для пробного периода уменьшение недоступно.';
    if (normalized.includes('minimum device limit')) {
      return 'Нельзя уменьшить ниже минимального лимита вашего тарифа.';
    }
    if (normalized.includes('must be less than current')) {
      return 'Новый лимит должен быть меньше текущего.';
    }
    return reason ?? 'Сейчас уменьшить количество устройств нельзя.';
  };

  const invalidateDevicesData = async () => {
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: ['subscription'] }),
      queryClient.invalidateQueries({ queryKey: ['devices'] }),
      queryClient.invalidateQueries({ queryKey: ['device-price'] }),
      queryClient.invalidateQueries({ queryKey: ['device-reduction-info'] }),
    ]);
  };

  const purchaseMutation = useMutation({
    mutationFn: (devices: number) => subscriptionApi.purchaseDevices(devices),
    onSuccess: async (response) => {
      setError(null);
      setSuccess(
        response.message ||
          t('lite.devicesPurchaseSuccess', { defaultValue: 'Устройства добавлены' }),
      );
      await invalidateDevicesData();
    },
    onError: (err: unknown) => {
      setSuccess(null);
      setError(getErrorMessage(err));
    },
  });

  const reduceMutation = useMutation({
    mutationFn: (newLimit: number) => subscriptionApi.reduceDevices(newLimit),
    onSuccess: async (response) => {
      setError(null);
      setSuccess(
        response.message || t('lite.devicesReduced', { defaultValue: 'Лимит устройств уменьшен' }),
      );
      await invalidateDevicesData();
    },
    onError: (err: unknown) => {
      setSuccess(null);
      setError(getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (hwid: string) => subscriptionApi.deleteDevice(hwid),
    onSuccess: async (response) => {
      setError(null);
      setSuccess(
        response.message || t('lite.deviceDeleted', { defaultValue: 'Устройство удалено' }),
      );
      await invalidateDevicesData();
    },
    onError: (err: unknown) => {
      setSuccess(null);
      setError(getErrorMessage(err));
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => subscriptionApi.deleteAllDevices(),
    onSuccess: async (response) => {
      setError(null);
      setSuccess(
        response.message || t('lite.allDevicesDeleted', { defaultValue: 'Все устройства удалены' }),
      );
      await invalidateDevicesData();
    },
    onError: (err: unknown) => {
      setSuccess(null);
      setError(getErrorMessage(err));
    },
  });

  const connectedCount = devicesData?.devices?.length ?? 0;
  const isBusy =
    purchaseMutation.isPending ||
    reduceMutation.isPending ||
    deleteMutation.isPending ||
    deleteAllMutation.isPending;

  const canReduce = useMemo(() => {
    if (!reductionInfo?.available) return false;
    if (typeof reductionInfo.can_reduce === 'number' && reductionInfo.can_reduce <= 0) return false;
    return true;
  }, [reductionInfo]);

  const minReduceLimit = reductionInfo?.min_device_limit ?? 1;
  const maxReduceLimit = reductionInfo?.current_device_limit ?? currentLimit ?? 1;

  const bottomNav = <UltimaBottomNav active="profile" />;

  const devicesContent = (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-rose-300/30 bg-rose-950/30 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200/20 bg-emerald-900/35 px-3 py-2 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      {!subscriptionLoading && !hasSubscription ? (
        <section className="border-emerald-200/12 rounded-3xl border bg-[rgba(12,45,42,0.18)] p-4 backdrop-blur-md">
          <p className="text-sm text-white/80">
            {t('subscription.connection.needSubscription', {
              defaultValue: 'Для управления устройствами нужна активная подписка.',
            })}
          </p>
          <button
            type="button"
            className="ultima-btn-pill ultima-btn-primary mt-3 w-full rounded-xl px-4 py-3 text-sm font-semibold"
            onClick={() => navigate('/subscription/purchase')}
          >
            {t('subscription.connection.goChooseTariff', { defaultValue: 'Выбрать тариф' })}
          </button>
        </section>
      ) : (
        <>
          <section className="border-emerald-200/12 rounded-3xl border bg-[rgba(12,45,42,0.18)] p-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900/45 text-white/85">
                <DeviceIcon />
              </div>
              <div>
                <p className="text-[14px] text-white/95">
                  {t('lite.devicesTotal', { defaultValue: 'Лимит устройств' })}: {currentLimit}
                </p>
                <p className="text-white/58 text-[12px]">
                  {t('lite.connectedDevices', { defaultValue: 'Подключено' })}: {connectedCount}
                </p>
              </div>
            </div>
          </section>

          <section className="border-emerald-200/12 rounded-3xl border bg-[rgba(12,45,42,0.18)] p-3 backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[14px] text-white/90">
                {t('lite.connectedDevices', { defaultValue: 'Подключенные устройства' })}
              </p>
              {connectedCount > 1 ? (
                <button
                  type="button"
                  onClick={() => deleteAllMutation.mutate()}
                  disabled={isBusy}
                  className="ultima-btn-pill ultima-btn-secondary rounded-lg px-2.5 py-1 text-[11px] disabled:opacity-45"
                >
                  {t('lite.deleteAll', { defaultValue: 'Удалить все' })}
                </button>
              ) : null}
            </div>

            {devicesLoading ? (
              <div className="flex h-20 items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-300/40 border-t-transparent" />
              </div>
            ) : devicesData?.devices.length ? (
              <div className="space-y-2">
                {devicesData.devices.map((device) => (
                  <div
                    key={device.hwid}
                    className="bg-emerald-950/28 flex items-center justify-between rounded-2xl border border-emerald-200/10 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-white/92 truncate text-[13px]">
                        {device.device_model || device.platform}
                      </p>
                      <p className="text-white/52 truncate text-[11px]">
                        {device.platform} • {device.hwid}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(device.hwid)}
                      className="ultima-btn-pill ultima-btn-secondary rounded-lg p-2 disabled:opacity-45"
                      disabled={isBusy}
                      aria-label={t('lite.deleteDevice', {
                        defaultValue: 'Удалить устройство',
                      })}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/56 text-sm">
                {t('lite.noDevices', { defaultValue: 'Устройств пока нет' })}
              </p>
            )}
          </section>

          {!isActiveTrial ? (
            <section className="border-emerald-200/12 rounded-3xl border bg-[rgba(12,45,42,0.18)] p-3 backdrop-blur-md">
              <p className="mb-2 text-[14px] text-white/90">
                {t('lite.addDevices', { defaultValue: 'Добавить устройства' })}
              </p>
              <div className="mb-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAddCount((prev) => Math.max(1, prev - 1))}
                  className="ultima-btn-pill ultima-btn-secondary h-8 w-8 rounded-lg"
                  disabled={isBusy}
                >
                  -
                </button>
                <div className="min-w-[68px] rounded-lg border border-emerald-200/15 bg-emerald-950/30 px-3 py-1.5 text-center text-sm text-white">
                  {addCount}
                </div>
                <button
                  type="button"
                  onClick={() => setAddCount((prev) => Math.min(maxAdd, prev + 1))}
                  className="ultima-btn-pill ultima-btn-secondary h-8 w-8 rounded-lg"
                  disabled={isBusy}
                >
                  +
                </button>
                <span className="text-[12px] text-white/55">
                  {t('lite.max', { defaultValue: 'макс.' })}: {maxAdd}
                </span>
              </div>
              <p className="text-white/58 text-[12px]">
                {devicePrice?.available && devicePrice.total_price_kopeks
                  ? `${t('balance.amount', { defaultValue: 'Сумма' })}: ${formatAmount(devicePrice.total_price_kopeks / 100)} ${currencySymbol}`
                  : devicePrice?.reason ||
                    t('lite.devicesNotAvailable', {
                      defaultValue: 'Покупка устройств недоступна',
                    })}
              </p>
              <button
                type="button"
                className="ultima-btn-pill ultima-btn-primary mt-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => purchaseMutation.mutate(addCount)}
                disabled={isBusy || !devicePrice?.available}
              >
                {t('lite.buyDevices', { defaultValue: 'Купить устройства' })}
              </button>
            </section>
          ) : null}

          <section className="border-emerald-200/12 rounded-3xl border bg-[rgba(12,45,42,0.18)] p-3 backdrop-blur-md">
            <p className="mb-2 text-[14px] text-white/90">Уменьшить количество устройств</p>
            {canReduce ? (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReduceLimit((prev) => Math.max(minReduceLimit, prev - 1))}
                    className="ultima-btn-pill ultima-btn-secondary h-8 w-8 rounded-lg"
                    disabled={isBusy}
                  >
                    -
                  </button>
                  <div className="min-w-[68px] rounded-lg border border-emerald-200/15 bg-emerald-950/30 px-3 py-1.5 text-center text-sm text-white">
                    {reduceLimit}
                  </div>
                  <button
                    type="button"
                    onClick={() => setReduceLimit((prev) => Math.min(maxReduceLimit, prev + 1))}
                    className="ultima-btn-pill ultima-btn-secondary h-8 w-8 rounded-lg"
                    disabled={isBusy}
                  >
                    +
                  </button>
                  <span className="text-[12px] text-white/55">
                    {minReduceLimit}-{maxReduceLimit}
                  </span>
                </div>
                <button
                  type="button"
                  className="ultima-btn-pill ultima-btn-secondary w-full rounded-xl px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => reduceMutation.mutate(reduceLimit)}
                  disabled={isBusy || reduceLimit >= currentLimit || reduceLimit < minReduceLimit}
                >
                  Применить
                </button>
              </>
            ) : (
              <p className="text-[12px] text-white/55">
                {getReductionReasonText(reductionInfo?.reason)}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-profile-desktop">
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={<DeviceIcon />}
          eyebrow={t('lite.connectedDevices', { defaultValue: 'Устройства' })}
          title="Устройства"
          subtitle={t('lite.devicesDescription', {
            defaultValue: 'Удаление подключений и управление лимитом устройств подписки.',
          })}
          metrics={[
            {
              label: t('lite.devicesTotal', { defaultValue: 'Лимит' }),
              value: String(currentLimit || 0),
              hint: t('lite.connectedDevices', { defaultValue: 'Подключено' }),
            },
            {
              label: t('lite.connectedDevices', { defaultValue: 'Подключено' }),
              value: String(connectedCount),
              hint: t('devices.desktopConnectedHint', {
                defaultValue: 'Активные устройства, привязанные к подписке.',
              }),
            },
            {
              label: t('balance.amount', { defaultValue: 'Добавление' }),
              value:
                devicePrice?.available && devicePrice.total_price_kopeks
                  ? `${formatAmount(devicePrice.total_price_kopeks / 100)} ${currencySymbol}`
                  : '—',
              hint: isActiveTrial
                ? t('devices.desktopTrialHint', {
                    defaultValue: 'На пробном тарифе покупка дополнительных устройств отключена.',
                  })
                : t('devices.desktopPriceHint', {
                    defaultValue: 'Текущая цена за выбранное количество устройств.',
                  }),
            },
          ]}
          heroActions={
            hasSubscription ? (
              <button
                type="button"
                onClick={() => navigate('/subscription/info')}
                className="ultima-btn-pill ultima-btn-secondary px-5 py-3 text-sm"
              >
                {t('subscription.infoTitle', { defaultValue: 'Инфо о подписке' })}
              </button>
            ) : undefined
          }
          aside={
            <UltimaDesktopPanel
              title={t('devices.desktopControlTitle', { defaultValue: 'Управление лимитом' })}
              subtitle={t('devices.desktopControlHint', {
                defaultValue:
                  'Покупайте новые слоты или уменьшайте лимит, если устройств стало меньше.',
              })}
            >
              <div className="space-y-3">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="text-white/42 text-[11px] uppercase tracking-[0.2em]">
                    {t('lite.max', { defaultValue: 'Максимум' })}
                  </div>
                  <div className="mt-2 text-sm font-medium text-white/90">{maxAdd}</div>
                  <div className="mt-1 text-xs leading-[1.5] text-white/60">
                    {t('devices.desktopMaxHint', {
                      defaultValue:
                        'Максимум дополнительных устройств, доступных к покупке сейчас.',
                    })}
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="text-white/42 text-[11px] uppercase tracking-[0.2em]">
                    {t('devices.desktopReduceTitle', { defaultValue: 'Диапазон уменьшения' })}
                  </div>
                  <div className="mt-2 text-sm font-medium text-white/90">
                    {minReduceLimit}-{maxReduceLimit}
                  </div>
                  <div className="mt-1 text-xs leading-[1.5] text-white/60">
                    {canReduce
                      ? t('devices.desktopReduceHint', {
                          defaultValue: 'Новый лимит применяется сразу после подтверждения.',
                        })
                      : getReductionReasonText(reductionInfo?.reason)}
                  </div>
                </div>
              </div>
            </UltimaDesktopPanel>
          }
          bottomNav={bottomNav}
        >
          {devicesContent}
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
            Устройства
          </h1>
          <p className="text-white/62 mt-1.5 text-[14px] leading-tight">
            {t('lite.devicesDescription', {
              defaultValue: 'Удаление подключений и управление лимитом устройств подписки.',
            })}
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1 lg:overflow-visible lg:pr-0">
          {devicesContent}
        </div>

        <div className="ultima-nav-dock">{bottomNav}</div>
      </div>
    </div>
  );
}
