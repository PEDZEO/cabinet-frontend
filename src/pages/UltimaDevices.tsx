import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { openLink as sdkOpenLink } from '@telegram-apps/sdk-react';
import {
  ExternalLink,
  Globe2,
  Link2,
  MoreHorizontal,
  QrCode,
  ShieldCheck,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import { balanceApi } from '@/api/balance';
import { subscriptionApi } from '@/api/subscription';
import { UltimaDeviceStepper } from '@/components/ultima/UltimaDeviceStepper';
import {
  UltimaDesktopPanel,
  UltimaDesktopSectionLayout,
} from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import { useCurrency } from '@/hooks/useCurrency';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTelegramSDK } from '@/hooks/useTelegramSDK';
import { copyToClipboard } from '@/utils/clipboard';
import { trackAnalyticsEvent } from '@/utils/analyticsEvents';
import { buildTelegramDeepLinkHandoff } from '@/utils/deepLinkHandoff';

const DeviceIcon = () => <Smartphone className="h-5 w-5" strokeWidth={1.8} />;

const formatDeviceFingerprint = (hwid: string) => {
  const value = hwid.trim();
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
};

type ApiErrorLike = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

type DeviceConnectionKind = 'happ' | 'incy' | 'other';

type DeviceConnectionOption = {
  kind: DeviceConnectionKind;
  label: string;
  meta: string;
  url: string;
  protected: boolean;
};

export function UltimaDevices() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { formatAmount, currencySymbol } = useCurrency();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { isTelegramWebApp } = useTelegramSDK();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [targetLimit, setTargetLimit] = useState(0);
  const [isConnectionPanelOpen, setIsConnectionPanelOpen] = useState(false);
  const [isDevicesMenuOpen, setIsDevicesMenuOpen] = useState(false);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [selectedConnectionKind, setSelectedConnectionKind] =
    useState<DeviceConnectionKind>('happ');
  const autoConnectHandledRef = useRef(false);

  const { data: purchaseOptions } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: subscriptionApi.getPurchaseOptions,
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });
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

  const {
    data: appConfig,
    isLoading: appConfigLoading,
    isError: appConfigFailed,
  } = useQuery({
    queryKey: ['appConfig'],
    queryFn: subscriptionApi.getAppConfig,
    enabled: hasSubscription,
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

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

  const requestedAddCount = Math.max(1, targetLimit - currentLimit);
  const { data: devicePrice, isFetching: devicePriceFetching } = useQuery({
    queryKey: ['device-price', requestedAddCount],
    queryFn: () => subscriptionApi.getDevicePrice(requestedAddCount),
    enabled: hasSubscription && !isActiveTrial,
    staleTime: 10000,
    placeholderData: (previousData) => previousData,
  });

  const maxAdd = Math.max(1, devicePrice?.can_add ?? 10);
  const canAffordDevicePurchase =
    !devicePrice?.total_price_kopeks ||
    balanceData?.balance_kopeks === undefined ||
    devicePrice.total_price_kopeks <= balanceData.balance_kopeks;
  const currentTariff =
    purchaseOptions?.sales_mode === 'tariffs'
      ? (purchaseOptions.tariffs.find(
          (tariff) => tariff.id === subscriptionData?.subscription?.tariff_id || tariff.is_current,
        ) ?? null)
      : null;
  const baseDeviceLimit = Math.max(
    reductionInfo?.min_device_limit ?? 1,
    currentTariff?.base_device_limit ?? 1,
  );
  const legacyExtraDevices = Math.max(0, currentLimit - baseDeviceLimit);

  useEffect(() => {
    if (currentLimit > 0) setTargetLimit(currentLimit);
  }, [currentLimit]);

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

  const handlePurchaseDevices = async (devicesToAdd: number) => {
    if (isBusy) return;

    if (!devicePrice?.available) {
      setSuccess(null);
      setError(
        devicePrice?.reason ||
          t('lite.devicesNotAvailable', {
            defaultValue: 'Покупка устройств недоступна',
          }),
      );
      return;
    }

    if (
      devicePrice.total_price_kopeks &&
      balanceData?.balance_kopeks !== undefined &&
      devicePrice.total_price_kopeks > balanceData.balance_kopeks
    ) {
      await subscriptionApi.saveDevicesCart(devicesToAdd);
      navigate('/balance/top-up?returnTo=/ultima/devices');
      return;
    }

    purchaseMutation.mutate(devicesToAdd);
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
  const availableDeviceSlots = Math.max(0, currentLimit - connectedCount);
  const subscriptionLink = subscriptionData?.subscription?.subscription_url ?? '';
  const hideSubscriptionLink = Boolean(subscriptionData?.subscription?.hide_subscription_link);
  const canUseSubscriptionLink = subscriptionLink.length > 0;
  const connectionOptions = useMemo<DeviceConnectionOption[]>(() => {
    const options: DeviceConnectionOption[] = [];
    const happCryptoLink = appConfig?.subscriptionCryptoLink?.trim();
    const incyCryptoLink = appConfig?.subscriptionIncyCryptoLink?.trim();

    if (happCryptoLink) {
      options.push({
        kind: 'happ',
        label: 'Happ',
        meta: t('devices.connectionMethodHappMeta', {
          defaultValue: 'Защищенная ссылка · crypt5',
        }),
        url: happCryptoLink,
        protected: true,
      });
    }

    if (incyCryptoLink) {
      options.push({
        kind: 'incy',
        label: 'INCY',
        meta: t('devices.connectionMethodIncyMeta', {
          defaultValue: 'Защищенная ссылка · crypt1',
        }),
        url: incyCryptoLink,
        protected: true,
      });
    }

    if (subscriptionLink && (!hideSubscriptionLink || options.length === 0)) {
      options.push({
        kind: 'other',
        label: t('devices.connectionMethodOther', { defaultValue: 'Другие' }),
        meta: t('devices.connectionMethodOtherMeta', {
          defaultValue: 'Универсальная ссылка',
        }),
        url: subscriptionLink,
        protected: false,
      });
    }

    return options;
  }, [
    appConfig?.subscriptionCryptoLink,
    appConfig?.subscriptionIncyCryptoLink,
    hideSubscriptionLink,
    subscriptionLink,
    t,
  ]);
  const selectedConnectionOption =
    connectionOptions.find((option) => option.kind === selectedConnectionKind) ??
    connectionOptions[0] ??
    null;
  const selectedConnectionUrl = selectedConnectionOption?.url ?? '';
  const isConnectionConfigPending = appConfigLoading && !appConfig && !appConfigFailed;
  const canCopySelectedConnection =
    Boolean(selectedConnectionUrl) &&
    (selectedConnectionOption?.protected === true || !hideSubscriptionLink);
  const isBusy =
    purchaseMutation.isPending ||
    reduceMutation.isPending ||
    deleteMutation.isPending ||
    deleteAllMutation.isPending;

  const canReduce =
    !!reductionInfo?.available &&
    !(typeof reductionInfo.can_reduce === 'number' && reductionInfo.can_reduce <= 0);

  const minReduceLimit = reductionInfo?.min_device_limit ?? 1;
  const normalizedTargetLimit = targetLimit > 0 ? targetLimit : currentLimit;
  const minTargetLimit = canReduce ? Math.max(minReduceLimit, connectedCount) : currentLimit;
  const maxTargetLimit =
    isActiveTrial || !devicePrice?.available ? currentLimit : currentLimit + maxAdd;
  const targetDelta = normalizedTargetLimit - currentLimit;
  const targetTrafficDelta = targetDelta * Math.max(0, currentTariff?.device_traffic_gb ?? 0);
  const capacityPercent =
    currentLimit > 0 ? Math.min(100, Math.round((connectedCount / currentLimit) * 100)) : 0;
  const isPrimaryLoading =
    subscriptionLoading || (hasSubscription && devicesLoading && !devicesData);
  const isDevicePriceLoading = targetDelta > 0 && devicePriceFetching;
  const canApplyLimit =
    !isBusy &&
    targetDelta !== 0 &&
    (targetDelta > 0
      ? Boolean(devicePrice?.available) && !isDevicePriceLoading
      : canReduce && normalizedTargetLimit >= minTargetLimit);
  const visibleDevices = showAllDevices
    ? (devicesData?.devices ?? [])
    : (devicesData?.devices ?? []).slice(0, 5);
  const hiddenDevicesCount = Math.max(0, connectedCount - visibleDevices.length);

  const openConnectionPanel = useCallback(
    (source = 'manual') => {
      if (!canUseSubscriptionLink) {
        setSuccess(null);
        setError(
          t('devices.subscriptionLinkUnavailable', {
            defaultValue: 'Ссылка подписки пока недоступна. Попробуйте открыть подписку позже.',
          }),
        );
        return;
      }

      trackAnalyticsEvent('ultima_devices_connect_panel_open', {
        source,
        connected_devices: connectedCount,
        device_limit: currentLimit,
        free_slots: availableDeviceSlots,
        subscription_link_hidden: hideSubscriptionLink,
      });
      setError(null);
      setIsConnectionPanelOpen(true);
    },
    [
      availableDeviceSlots,
      canUseSubscriptionLink,
      connectedCount,
      currentLimit,
      hideSubscriptionLink,
      t,
    ],
  );

  useEffect(() => {
    if (autoConnectHandledRef.current || searchParams.get('connect') !== '1') {
      return;
    }
    if (subscriptionLoading) {
      return;
    }
    autoConnectHandledRef.current = true;
    openConnectionPanel('query_connect');
  }, [openConnectionPanel, searchParams, subscriptionLoading]);

  useEffect(() => {
    if (!isConnectionPanelOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsConnectionPanelOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isConnectionPanelOpen]);

  const copySelectedConnectionLink = async () => {
    if (!canCopySelectedConnection || !selectedConnectionOption) {
      setSuccess(null);
      setError(
        t('devices.subscriptionLinkHidden', {
          defaultValue: 'Ссылка скрыта настройками. Используйте QR-код подписки.',
        }),
      );
      return;
    }

    await copyToClipboard(selectedConnectionOption.url);
    trackAnalyticsEvent('ultima_device_subscription_link_copy', {
      connected_devices: connectedCount,
      device_limit: currentLimit,
      free_slots: availableDeviceSlots,
      client: selectedConnectionOption.kind,
      protected_link: selectedConnectionOption.protected,
    });
    setError(null);
    setSuccess(
      t('devices.selectedConnectionLinkCopied', {
        client: selectedConnectionOption.label,
        defaultValue: `Ссылка для ${selectedConnectionOption.label} скопирована`,
      }),
    );
  };

  const openSelectedConnectionLink = () => {
    if (!selectedConnectionOption) return;

    const targetUrl = selectedConnectionOption.url;
    const isHttpUrl = /^https?:\/\//i.test(targetUrl);
    const externalUrl =
      isTelegramWebApp && !isHttpUrl ? buildTelegramDeepLinkHandoff(targetUrl) : targetUrl;

    trackAnalyticsEvent('ultima_device_subscription_link_open', {
      connected_devices: connectedCount,
      device_limit: currentLimit,
      free_slots: availableDeviceSlots,
      client: selectedConnectionOption.kind,
      protected_link: selectedConnectionOption.protected,
    });

    if (isTelegramWebApp) {
      try {
        sdkOpenLink(externalUrl, { tryInstantView: false });
        return;
      } catch {
        window.location.href = externalUrl;
        return;
      }
    }

    window.location.href = targetUrl;
  };

  const handleDeviceCapacityCta = () => {
    const action =
      availableDeviceSlots > 0 ? 'connect' : isActiveTrial ? 'choose_tariff' : 'buy_slot';
    trackAnalyticsEvent('ultima_device_capacity_cta_click', {
      connected_devices: connectedCount,
      device_limit: currentLimit,
      free_slots: availableDeviceSlots,
      action,
    });
    if (availableDeviceSlots > 0) {
      openConnectionPanel('capacity_cta');
      return;
    }

    if (isActiveTrial) {
      navigate('/subscription/purchase');
      return;
    }

    if (!devicePrice?.available) {
      setSuccess(null);
      setError(
        devicePrice?.reason ||
          t('lite.devicesNotAvailable', { defaultValue: 'Покупка устройств недоступна' }),
      );
      return;
    }

    setTargetLimit(Math.min(maxTargetLimit, currentLimit + 1));
  };

  const handleApplyLimit = () => {
    if (!canApplyLimit) return;
    if (targetDelta > 0) {
      void handlePurchaseDevices(targetDelta);
      return;
    }
    reduceMutation.mutate(normalizedTargetLimit);
  };

  const bottomNav = <UltimaBottomNav active="profile" />;

  const devicesContent = (
    <div className="space-y-3">
      {isPrimaryLoading ? (
        <section
          data-testid="ultima-devices-loading"
          className="animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"
          aria-busy="true"
        >
          <div className="h-5 w-36 rounded bg-white/10" />
          <div className="mt-4 h-16 rounded-xl bg-white/[0.06]" />
          <div className="mt-3 h-11 rounded-xl bg-white/[0.06]" />
        </section>
      ) : !hasSubscription ? (
        <section className="rounded-3xl border border-emerald-200/[0.12] bg-[rgba(12,45,42,0.18)] p-4 backdrop-blur-md">
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
          <section
            id="ultima-device-slots"
            data-testid="ultima-device-capacity"
            className="rounded-2xl border border-emerald-200/[0.14] bg-[rgba(8,38,36,0.32)] p-4 backdrop-blur-md"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-300/[0.1] text-emerald-100">
                  <DeviceIcon />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-white">
                    {t('devices.capacityTitle', { defaultValue: 'Ваши устройства' })}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/[0.52]">
                    {legacyExtraDevices > 0
                      ? t('devices.extraSlotsIncluded', {
                          base: baseDeviceLimit,
                          extra: legacyExtraDevices,
                          defaultValue: 'В тарифе {{base}}, дополнительно {{extra}}',
                        })
                      : t('devices.baseSlotsIncluded', {
                          count: baseDeviceLimit,
                          defaultValue: 'В тарифе {{count}} устройства',
                        })}
                  </p>
                </div>
              </div>
              <span
                data-testid="ultima-device-free-slots"
                className="shrink-0 rounded-full border border-emerald-200/[0.16] bg-emerald-300/[0.08] px-2.5 py-1 text-[11px] font-medium text-emerald-50"
              >
                {availableDeviceSlots > 0
                  ? t('devices.freeSlotsShort', {
                      count: availableDeviceSlots,
                      defaultValue: '{{count}} свободно',
                    })
                  : t('devices.noFreeSlotsShort', { defaultValue: 'Нет мест' })}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 divide-x divide-white/[0.09] rounded-xl bg-black/[0.14] px-1 py-3 text-center">
              <div className="min-w-0 px-1.5">
                <div className="text-[18px] font-semibold tabular-nums text-white">
                  {connectedCount}
                </div>
                <div className="mt-0.5 truncate text-[10px] uppercase text-white/[0.44]">
                  {t('devices.connectedShort', { defaultValue: 'Подключено' })}
                </div>
              </div>
              <div className="min-w-0 px-1.5">
                <div className="text-[18px] font-semibold tabular-nums text-white">
                  {availableDeviceSlots}
                </div>
                <div className="mt-0.5 truncate text-[10px] uppercase text-white/[0.44]">
                  {t('devices.freeShort', { defaultValue: 'Свободно' })}
                </div>
              </div>
              <div className="min-w-0 px-1.5">
                <div className="text-[18px] font-semibold tabular-nums text-white">
                  {currentLimit}
                </div>
                <div className="mt-0.5 truncate text-[10px] uppercase text-white/[0.44]">
                  {t('devices.limitShort', { defaultValue: 'Лимит' })}
                </div>
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-emerald-300 transition-[width] duration-300"
                style={{ width: `${capacityPercent}%` }}
              />
            </div>

            <button
              type="button"
              data-testid="ultima-device-primary-action"
              onClick={handleDeviceCapacityCta}
              className="ultima-btn-pill ultima-btn-primary mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
              disabled={
                isBusy || (availableDeviceSlots <= 0 && !isActiveTrial && !devicePrice?.available)
              }
            >
              {availableDeviceSlots > 0 ? (
                <QrCode className="h-4 w-4" strokeWidth={2} />
              ) : (
                <DeviceIcon />
              )}
              {availableDeviceSlots > 0
                ? t('devices.connectDevice', { defaultValue: 'Подключить устройство' })
                : isActiveTrial
                  ? t('subscription.connection.goChooseTariff', { defaultValue: 'Выбрать тариф' })
                  : t('devices.addSlot', { defaultValue: 'Добавить слот' })}
            </button>

            {!isActiveTrial ? (
              <div className="mt-4 border-t border-white/[0.08] pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-white">
                      {t('devices.limitControlTitle', { defaultValue: 'Лимит подписки' })}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/[0.48]">
                      {t('devices.limitControlHint', {
                        min: minTargetLimit,
                        max: maxTargetLimit,
                        defaultValue: 'Выберите итог: от {{min}} до {{max}}',
                      })}
                    </p>
                  </div>
                  <UltimaDeviceStepper
                    value={normalizedTargetLimit}
                    canDecrease={!isBusy && normalizedTargetLimit > minTargetLimit}
                    canIncrease={!isBusy && normalizedTargetLimit < maxTargetLimit}
                    onDecrease={() =>
                      setTargetLimit((previous) =>
                        Math.max(minTargetLimit, (previous || currentLimit) - 1),
                      )
                    }
                    onIncrease={() =>
                      setTargetLimit((previous) =>
                        Math.min(maxTargetLimit, (previous || currentLimit) + 1),
                      )
                    }
                    testIdPrefix="ultima-devices-limit"
                  />
                </div>

                {targetDelta !== 0 ? (
                  <div
                    data-testid="ultima-device-limit-summary"
                    className="mt-3 border-t border-white/[0.07] pt-3"
                  >
                    <div className="flex items-start justify-between gap-3 text-[12px]">
                      <div>
                        <p className="font-medium text-white/[0.9]">
                          {t('devices.newLimit', {
                            count: normalizedTargetLimit,
                            defaultValue: 'Новый лимит: {{count}}',
                          })}
                        </p>
                        <p className="mt-1 text-white/[0.5]">
                          {targetDelta > 0
                            ? t('devices.slotsAdded', {
                                count: targetDelta,
                                defaultValue: 'Добавится мест: +{{count}}',
                              })
                            : t('devices.slotsRemoved', {
                                count: Math.abs(targetDelta),
                                defaultValue: 'Уменьшится на {{count}}',
                              })}
                          {targetTrafficDelta !== 0
                            ? ` · ${targetTrafficDelta > 0 ? '+' : ''}${targetTrafficDelta} ${t('common.units.gb')}`
                            : ''}
                        </p>
                      </div>
                      {targetDelta > 0 ? (
                        <div className="shrink-0 text-right">
                          <p className="font-semibold tabular-nums text-white">
                            {isDevicePriceLoading
                              ? '…'
                              : typeof devicePrice?.total_price_kopeks === 'number'
                                ? `${formatAmount(devicePrice.total_price_kopeks / 100)} ${currencySymbol}`
                                : '—'}
                          </p>
                          <p className="mt-1 text-[10px] text-white/[0.42]">
                            {t('devices.untilRenewal', { defaultValue: 'до продления' })}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    {targetDelta > 0 && !devicePrice?.available && !isDevicePriceLoading ? (
                      <p className="mt-2 text-[11px] text-amber-100/[0.8]">
                        {devicePrice?.reason ||
                          t('lite.devicesNotAvailable', {
                            defaultValue: 'Покупка устройств недоступна',
                          })}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      data-testid="ultima-device-limit-apply"
                      className="ultima-btn-pill ultima-btn-primary mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                      onClick={handleApplyLimit}
                      disabled={!canApplyLimit}
                    >
                      {targetDelta > 0
                        ? devicePrice?.total_price_kopeks && !canAffordDevicePurchase
                          ? t('ultima.topUpAndBuy', 'Пополнить и купить')
                          : t('devices.confirmAddSlots', {
                              count: targetDelta,
                              defaultValue: 'Добавить +{{count}}',
                            })
                        : t('devices.confirmReduceLimit', {
                            count: normalizedTargetLimit,
                            defaultValue: 'Уменьшить до {{count}}',
                          })}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 border-t border-white/[0.08] pt-3 text-[11px] text-white/[0.5]">
                {t('devices.trialLimitHint', {
                  defaultValue: 'На пробном периоде лимит устройств задаётся тарифом.',
                })}
              </p>
            )}
          </section>

          <section className="overflow-visible rounded-2xl border border-emerald-200/[0.12] bg-[rgba(8,38,36,0.24)] backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-white/90">
                  {t('lite.connectedDevices', { defaultValue: 'Подключенные устройства' })}
                </p>
                <p className="mt-0.5 text-[11px] text-white/[0.44]">
                  {t('devices.connectedCount', {
                    count: connectedCount,
                    defaultValue: 'Всего: {{count}}',
                  })}
                </p>
              </div>

              {connectedCount > 1 ? (
                <div className="relative">
                  <button
                    type="button"
                    data-testid="ultima-devices-menu"
                    onClick={() => setIsDevicesMenuOpen((value) => !value)}
                    disabled={isBusy}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-white/[0.62] transition-colors hover:bg-white/[0.06] disabled:opacity-40"
                    aria-label={t('devices.actions', { defaultValue: 'Действия' })}
                    aria-expanded={isDevicesMenuOpen}
                  >
                    <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
                  </button>
                  {isDevicesMenuOpen ? (
                    <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-white/[0.12] bg-[#081b1b] p-1.5 shadow-2xl">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDevicesMenuOpen(false);
                          deleteAllMutation.mutate();
                        }}
                        disabled={isBusy}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] text-rose-100 transition-colors hover:bg-rose-300/[0.08] disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                        {t('lite.deleteAll', { defaultValue: 'Удалить все' })}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {devicesData?.devices.length ? (
              <div className="border-t border-white/[0.07]">
                <div className="divide-y divide-white/[0.07]">
                  {visibleDevices.map((device) => (
                    <div
                      key={device.hwid}
                      data-testid="ultima-device-row"
                      className="flex min-h-[64px] items-center gap-3 px-4 py-2.5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/[0.68]">
                        <Smartphone className="h-4 w-4" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-white/[0.92]">
                          {device.device_model || device.platform}
                        </p>
                        <p
                          className="mt-0.5 truncate text-[11px] text-white/[0.46]"
                          title={device.hwid}
                        >
                          {device.platform} · {formatDeviceFingerprint(device.hwid)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(device.hwid)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/[0.52] transition-colors hover:bg-rose-300/[0.08] hover:text-rose-100 disabled:opacity-40"
                        disabled={isBusy}
                        aria-label={t('lite.deleteDevice', {
                          defaultValue: 'Удалить устройство',
                        })}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                    </div>
                  ))}
                </div>

                {hiddenDevicesCount > 0 || showAllDevices ? (
                  <button
                    type="button"
                    data-testid="ultima-devices-list-toggle"
                    onClick={() => setShowAllDevices((value) => !value)}
                    className="w-full border-t border-white/[0.07] px-4 py-2.5 text-[12px] font-medium text-emerald-100/[0.78]"
                  >
                    {showAllDevices
                      ? t('devices.showLess', { defaultValue: 'Свернуть список' })
                      : t('devices.showMore', {
                          count: hiddenDevicesCount,
                          defaultValue: 'Показать еще {{count}}',
                        })}
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="border-t border-white/[0.07] px-4 py-5 text-center text-sm text-white/[0.56]">
                {t('lite.noDevices', { defaultValue: 'Устройств пока нет' })}
              </p>
            )}
          </section>

          {isConnectionPanelOpen && canUseSubscriptionLink ? (
            <div
              className="fixed inset-0 z-[80] flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setIsConnectionPanelOpen(false);
              }}
            >
              <section
                id="ultima-connect-new-device"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ultima-connect-new-device-title"
                className="max-h-[calc(100dvh-24px)] w-full max-w-[460px] overflow-y-auto rounded-2xl border border-emerald-200/[0.18] bg-[#071f1f] p-4 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2
                      id="ultima-connect-new-device-title"
                      className="text-[17px] font-semibold text-white"
                    >
                      {t('devices.connectNewDeviceTitle', {
                        defaultValue: 'Подключить устройство',
                      })}
                    </h2>
                    <p className="mt-1 text-[12px] leading-relaxed text-white/[0.55]">
                      {t('devices.connectNewDeviceHint', {
                        defaultValue:
                          'Откройте ссылку на новом устройстве или отсканируйте QR-код.',
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsConnectionPanelOpen(false)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/[0.6] transition-colors hover:bg-white/[0.07]"
                    aria-label={t('common.close', { defaultValue: 'Закрыть' })}
                  >
                    <X className="h-5 w-5" strokeWidth={2} />
                  </button>
                </div>

                {isConnectionConfigPending ? (
                  <div
                    data-testid="ultima-device-connection-loading"
                    className="mt-4 animate-pulse"
                    aria-busy="true"
                  >
                    <div className="mx-auto h-[188px] w-[188px] rounded-xl bg-white/[0.08]" />
                    <div className="mt-3 h-11 rounded-xl bg-white/[0.055]" />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="h-10 rounded-xl bg-white/[0.055]" />
                      <div className="h-10 rounded-xl bg-white/[0.055]" />
                    </div>
                  </div>
                ) : selectedConnectionOption ? (
                  <>
                    {connectionOptions.length > 1 ? (
                      <div className="mt-4">
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/[0.42]">
                          {t('devices.connectionMethodTitle', {
                            defaultValue: 'Выберите приложение',
                          })}
                        </p>
                        <div
                          role="radiogroup"
                          aria-label={t('devices.connectionMethodTitle', {
                            defaultValue: 'Выберите приложение',
                          })}
                          className="mt-2 grid grid-cols-3 gap-1 rounded-xl border border-white/[0.07] bg-black/20 p-1"
                        >
                          {connectionOptions.map((option) => {
                            const isSelected = option.kind === selectedConnectionOption.kind;
                            return (
                              <button
                                key={option.kind}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                data-testid={`ultima-device-link-${option.kind}`}
                                onClick={() => setSelectedConnectionKind(option.kind)}
                                className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors ${
                                  isSelected
                                    ? 'bg-emerald-300 text-emerald-950 shadow-[0_6px_18px_rgba(52,211,153,0.16)]'
                                    : 'text-white/[0.58] hover:bg-white/[0.055] hover:text-white'
                                }`}
                              >
                                {option.protected ? (
                                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                                ) : (
                                  <Globe2 className="h-3.5 w-3.5" strokeWidth={2} />
                                )}
                                <span className="truncate">{option.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <div className="mx-auto mt-4 w-fit rounded-xl bg-white p-3">
                      <QRCodeSVG
                        key={selectedConnectionOption.kind}
                        data-testid="ultima-device-qr"
                        data-connection-kind={selectedConnectionOption.kind}
                        value={selectedConnectionUrl}
                        size={164}
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    <div
                      data-testid="ultima-device-link-meta"
                      className="mt-3 flex items-center justify-center gap-2 text-center text-[11px] text-emerald-100/[0.72]"
                    >
                      {selectedConnectionOption.protected ? (
                        <ShieldCheck className="h-4 w-4 text-emerald-300" strokeWidth={2} />
                      ) : (
                        <Globe2 className="h-4 w-4 text-white/[0.52]" strokeWidth={2} />
                      )}
                      <span>{selectedConnectionOption.meta}</span>
                    </div>

                    {selectedConnectionOption.kind === 'other' ? (
                      hideSubscriptionLink ? (
                        <p className="mt-3 text-center text-[11px] leading-relaxed text-white/[0.48]">
                          {t('devices.subscriptionLinkHiddenText', {
                            defaultValue: 'Ссылка скрыта настройками. Используйте QR-код.',
                          })}
                        </p>
                      ) : (
                        <p
                          data-testid="ultima-device-raw-link"
                          className="mt-3 truncate rounded-xl bg-white/[0.045] px-3 py-2.5 font-mono text-[10px] text-white/[0.58]"
                        >
                          {selectedConnectionUrl}
                        </p>
                      )
                    ) : null}

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => void copySelectedConnectionLink()}
                        disabled={!canCopySelectedConnection}
                        className="ultima-btn-pill ultima-btn-primary flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <Link2 className="h-4 w-4" strokeWidth={2} />
                        {t('devices.copySubscriptionLink', { defaultValue: 'Копировать' })}
                      </button>
                      <button
                        type="button"
                        onClick={openSelectedConnectionLink}
                        className="ultima-btn-pill ultima-btn-secondary flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-center text-[12px] font-semibold"
                      >
                        <ExternalLink className="h-4 w-4" strokeWidth={2} />
                        {t('common.open', { defaultValue: 'Открыть' })}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 rounded-xl border border-rose-200/[0.14] bg-rose-300/[0.06] px-3 py-3 text-center text-[12px] text-rose-100">
                    {t('devices.subscriptionLinkUnavailable', {
                      defaultValue: 'Ссылка подписки пока недоступна. Попробуйте позже.',
                    })}
                  </p>
                )}
              </section>
            </div>
          ) : null}

          {error || success ? (
            <div
              role={error ? 'alert' : 'status'}
              className={`fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-1/2 z-[90] flex w-[calc(100%-24px)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border px-3 py-2.5 text-[12px] shadow-2xl backdrop-blur-xl lg:bottom-6 ${
                error
                  ? 'border-rose-300/25 bg-rose-950/90 text-rose-50'
                  : 'border-emerald-200/20 bg-emerald-950/90 text-emerald-50'
              }`}
            >
              <span className="min-w-0 flex-1">{error || success}</span>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                }}
                className="text-current/70 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-white/[0.08]"
                aria-label={t('common.close', { defaultValue: 'Закрыть' })}
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          ) : null}
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
            defaultValue: 'Удаляйте старые подключения и меняйте лимит устройств вашей подписки.',
          })}
          metrics={[
            {
              label: t('lite.connectedDevices', { defaultValue: 'Подключено' }),
              value: `${connectedCount} / ${currentLimit || 0}`,
              hint: t('devices.desktopConnectedHint', {
                defaultValue: 'Занято слотов в текущей подписке.',
              }),
            },
            {
              label: t('devices.freeShort', { defaultValue: 'Свободно' }),
              value: String(availableDeviceSlots),
              hint: t('devices.desktopFreeHint', {
                defaultValue: 'Можно подключить без изменения лимита.',
              }),
            },
            {
              label: t('devices.tariffBase', { defaultValue: 'База тарифа' }),
              value: String(baseDeviceLimit),
              hint:
                legacyExtraDevices > 0
                  ? t('devices.desktopExtraHint', {
                      count: legacyExtraDevices,
                      defaultValue: 'Дополнительных слотов: {{count}}.',
                    })
                  : t('devices.desktopBaseHint', {
                      defaultValue: 'Дополнительных слотов нет.',
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
                {t('subscription.desktopOpenInfo', { defaultValue: 'Открыть подписку' })}
              </button>
            ) : undefined
          }
          aside={
            <UltimaDesktopPanel
              title={t('devices.desktopControlTitle', { defaultValue: 'Управление лимитом' })}
              subtitle={t('devices.desktopControlHint', {
                defaultValue:
                  'Выберите итоговое количество в основном блоке. Покупка и уменьшение определяются автоматически.',
              })}
            >
              <div className="divide-y divide-white/[0.08] rounded-xl bg-white/[0.035] px-4">
                <div className="flex items-center justify-between gap-3 py-3">
                  <span className="text-xs text-white/[0.5]">
                    {t('devices.currentLimit', { defaultValue: 'Текущий лимит' })}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-white">
                    {currentLimit}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <span className="text-xs text-white/[0.5]">
                    {t('devices.availableRange', { defaultValue: 'Доступный диапазон' })}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-white">
                    {minTargetLimit}-{maxTargetLimit}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <span className="text-xs text-white/[0.5]">
                    {t('devices.oneSlotPrice', { defaultValue: 'Добавить 1 слот' })}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-white">
                    {devicePrice?.available && typeof devicePrice.total_price_kopeks === 'number'
                      ? `${formatAmount(devicePrice.total_price_kopeks / 100)} ${currencySymbol}`
                      : '—'}
                  </span>
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
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <header className="mb-2.5">
          <h1 className="text-[clamp(30px,8vw,38px)] font-semibold leading-none text-white">
            Устройства
          </h1>
          <p className="mt-1 text-[13px] leading-snug text-white/[0.56]">
            {t('lite.devicesDescription', {
              defaultValue: 'Подключение, удаление и лимит в одном месте.',
            })}
          </p>
        </header>

        <div className="ultima-scrollbar min-h-0 flex-1 overflow-y-auto pr-1 lg:overflow-visible lg:pr-0">
          {devicesContent}
        </div>

        <div className="ultima-mobile-dock-footer">
          <div className="ultima-nav-dock">{bottomNav}</div>
        </div>
      </div>
    </div>
  );
}
