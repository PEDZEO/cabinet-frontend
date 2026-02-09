import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '@/api/subscription';
import { balanceApi } from '@/api/balance';
import { useCurrency } from '@/hooks/useCurrency';
import { useNavigate } from 'react-router';
import type { Tariff, TrafficPackage } from '@/types';

// Icons
const CheckIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const DeviceIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
    />
  </svg>
);

const TrafficIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
    />
  </svg>
);

const StarIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    />
  </svg>
);

const PhoneIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
    />
  </svg>
);

const DesktopIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
    />
  </svg>
);

type TabType = 'tariffs' | 'devices' | 'traffic';

export function LiteSubscription() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatAmount, currencySymbol } = useCurrency();

  const [activeTab, setActiveTab] = useState<TabType>('tariffs');
  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null);
  const [selectedPeriodDays, setSelectedPeriodDays] = useState<number>(30);
  const [deviceCount, setDeviceCount] = useState(1);
  const [selectedTraffic, setSelectedTraffic] = useState<TrafficPackage | null>(null);
  const [reduceCount, setReduceCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Format price helper
  const formatPrice = (kopeks: number) => `${formatAmount(kopeks / 100)} ${currencySymbol}`;

  // Queries
  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getSubscription,
  });

  const { data: purchaseOptions } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: subscriptionApi.getPurchaseOptions,
  });

  const { data: trafficPackages } = useQuery({
    queryKey: ['traffic-packages'],
    queryFn: subscriptionApi.getTrafficPackages,
  });

  const { data: devicePrice, isLoading: isDevicePriceLoading } = useQuery({
    queryKey: ['device-price', deviceCount],
    queryFn: () => subscriptionApi.getDevicePrice(deviceCount),
    enabled: activeTab === 'devices',
    placeholderData: (prev) => prev, // Keep previous data while loading new count
  });

  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
  });

  const { data: devicesData, isLoading: isDevicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: subscriptionApi.getDevices,
    enabled: activeTab === 'devices' && !!subscriptionData?.has_subscription,
  });

  const { data: reductionInfo } = useQuery({
    queryKey: ['device-reduction-info'],
    queryFn: subscriptionApi.getDeviceReductionInfo,
    enabled: activeTab === 'devices' && !!subscriptionData?.has_subscription,
  });

  // Clamp device count when max limit changes
  useEffect(() => {
    if (devicePrice?.can_add !== undefined && deviceCount > devicePrice.can_add) {
      setDeviceCount(Math.max(1, devicePrice.can_add));
    }
  }, [devicePrice?.can_add, deviceCount]);

  // Mutations
  // Helper to extract error message from API response
  // Backend can return: { detail: string } or { detail: { message, missing_amount, code, ... } }
  const getErrorMessage = (err: {
    response?: {
      status?: number;
      data?: {
        detail?:
          | string
          | {
              message?: string;
              missing_amount?: number;
              code?: string;
              required?: number;
              balance?: number;
            };
        message?: string;
        missing_amount?: number;
        code?: string;
        required?: number;
        balance?: number;
      };
    };
  }) => {
    const status = err.response?.status;
    const data = err.response?.data;
    const detail = data?.detail;

    // Handle 402 Payment Required - insufficient balance
    if (status === 402) {
      // Try to get missing amount from various places
      let missingAmount: number | undefined;

      if (detail && typeof detail === 'object') {
        missingAmount = detail.missing_amount;
        // Calculate from required - balance if missing_amount not provided
        if (
          missingAmount === undefined &&
          detail.required !== undefined &&
          detail.balance !== undefined
        ) {
          missingAmount = detail.required - detail.balance;
        }
      }

      if (missingAmount === undefined) {
        missingAmount = data?.missing_amount;
        if (
          missingAmount === undefined &&
          data?.required !== undefined &&
          data?.balance !== undefined
        ) {
          missingAmount = data.required - data.balance;
        }
      }

      if (missingAmount !== undefined && missingAmount > 0) {
        return t('lite.insufficientBalance', { amount: formatPrice(missingAmount) });
      }

      // Generic insufficient balance message
      return t('lite.insufficientBalanceGeneric');
    }

    // Handle detail as object
    if (detail && typeof detail === 'object') {
      if (detail.code === 'insufficient_balance' || detail.code === 'insufficient_funds') {
        const missingAmount = detail.missing_amount;
        if (missingAmount !== undefined) {
          return t('lite.insufficientBalance', { amount: formatPrice(missingAmount) });
        }
        return t('lite.insufficientBalanceGeneric');
      }
      if (detail.missing_amount !== undefined) {
        return t('lite.insufficientBalance', { amount: formatPrice(detail.missing_amount) });
      }
      if (detail.message) return detail.message;
    }

    // Handle detail as string
    if (typeof detail === 'string') return detail;

    // Fallback to root level fields
    if (data?.code === 'insufficient_balance' || data?.code === 'insufficient_funds') {
      if (data?.missing_amount !== undefined) {
        return t('lite.insufficientBalance', { amount: formatPrice(data.missing_amount) });
      }
      return t('lite.insufficientBalanceGeneric');
    }
    if (data?.missing_amount !== undefined) {
      return t('lite.insufficientBalance', { amount: formatPrice(data.missing_amount) });
    }
    if (typeof data?.message === 'string') return data.message;

    return t('common.error');
  };

  const purchaseTariffMutation = useMutation({
    mutationFn: (params: { tariffId: number; periodDays: number }) =>
      subscriptionApi.purchaseTariff(params.tariffId, params.periodDays),
    onSuccess: (data) => {
      setSuccess(data.message);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
    onError: (err: {
      response?: { data?: { detail?: string; message?: string; missing_amount?: number } };
    }) => {
      setError(getErrorMessage(err));
      setSuccess(null);
    },
  });

  const switchTariffMutation = useMutation({
    mutationFn: (tariffId: number) => subscriptionApi.switchTariff(tariffId),
    onSuccess: (data) => {
      // Use localized message with tariff names from response
      const devicesReset =
        data.devices_reset || data.message?.toLowerCase().includes('devices reset');
      const translationKey = devicesReset
        ? 'lite.tariffSwitchedWithDeviceReset'
        : 'lite.tariffSwitched';
      const localizedMessage = t(translationKey, {
        oldTariff: data.old_tariff_name,
        newTariff: data.new_tariff_name,
      });
      setSuccess(localizedMessage);
      setError(null);
      setSelectedTariff(null);
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
    },
    onError: (err: {
      response?: { data?: { detail?: string; message?: string; missing_amount?: number } };
    }) => {
      // Check for "already on tariff" error
      const detail = err.response?.data?.detail;
      if (
        typeof detail === 'string' &&
        (detail.toLowerCase().includes('already on') ||
          detail.toLowerCase().includes('уже на этом'))
      ) {
        setError(t('lite.alreadyOnTariff'));
      } else {
        setError(getErrorMessage(err));
      }
      setSuccess(null);
    },
  });

  const purchaseDevicesMutation = useMutation({
    mutationFn: (devices: number) => subscriptionApi.purchaseDevices(devices),
    onSuccess: (data) => {
      setSuccess(data.message);
      setError(null);
      setDeviceCount(1);
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['device-price'] });
    },
    onError: (err: {
      response?: {
        data?: {
          detail?: string | { message?: string; missing_amount?: number };
          message?: string;
          missing_amount?: number;
        };
      };
    }) => {
      setError(getErrorMessage(err));
      setSuccess(null);
    },
  });

  const purchaseTrafficMutation = useMutation({
    mutationFn: (gb: number) => subscriptionApi.purchaseTraffic(gb),
    onSuccess: (data) => {
      setSuccess(data.message);
      setError(null);
      setSelectedTraffic(null);
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
    onError: (err: {
      response?: {
        data?: {
          detail?: string | { message?: string; missing_amount?: number };
          message?: string;
          missing_amount?: number;
        };
      };
    }) => {
      setError(getErrorMessage(err));
      setSuccess(null);
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: (hwid: string) => subscriptionApi.deleteDevice(hwid),
    onSuccess: (data) => {
      setSuccess(data.message || t('lite.deviceDeleted'));
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (err: {
      response?: {
        data?: {
          detail?: string | { message?: string };
          message?: string;
        };
      };
    }) => {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : t('common.error'));
      setSuccess(null);
    },
  });

  const deleteAllDevicesMutation = useMutation({
    mutationFn: () => subscriptionApi.deleteAllDevices(),
    onSuccess: (data) => {
      setSuccess(data.message || t('lite.allDevicesDeleted'));
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (err: {
      response?: {
        data?: {
          detail?: string | { message?: string };
          message?: string;
        };
      };
    }) => {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : t('common.error'));
      setSuccess(null);
    },
  });

  const reduceDevicesMutation = useMutation({
    mutationFn: (newLimit: number) => subscriptionApi.reduceDevices(newLimit),
    onSuccess: (data) => {
      setSuccess(data.message || t('lite.devicesReduced'));
      setError(null);
      setReduceCount(1);
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['device-price'] });
      queryClient.invalidateQueries({ queryKey: ['device-reduction-info'] });
    },
    onError: (err: {
      response?: {
        data?: {
          detail?: string | { message?: string };
          message?: string;
        };
      };
    }) => {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : t('common.error'));
      setSuccess(null);
    },
  });

  const subscription = subscriptionData?.subscription;
  const hasSubscription = subscriptionData?.has_subscription;
  const balance = balanceData?.balance_kopeks ?? 0;
  const tariffs = purchaseOptions?.sales_mode === 'tariffs' ? purchaseOptions.tariffs : [];
  const currentTariffId =
    purchaseOptions?.sales_mode === 'tariffs' ? purchaseOptions.current_tariff_id : null;
  const currentTariff = currentTariffId ? tariffs.find((t) => t.id === currentTariffId) : null;
  // Use device limit from tariff settings, fallback to subscription value
  const deviceLimitFromTariff = currentTariff?.device_limit ?? subscription?.device_limit;

  const handleTariffAction = () => {
    if (!selectedTariff) return;

    // For trial subscriptions or no tariff - purchase new tariff
    // For active subscriptions with tariff - switch tariff
    const isTrial = subscription?.is_trial;
    const canSwitch = hasSubscription && currentTariffId !== null && !isTrial;

    if (canSwitch && currentTariffId !== selectedTariff.id) {
      // Switch tariff (only for non-trial with existing tariff)
      switchTariffMutation.mutate(selectedTariff.id);
    } else if (!hasSubscription || isTrial || currentTariffId === null) {
      // Purchase new subscription (for new users, trial users, or users without tariff)
      purchaseTariffMutation.mutate({
        tariffId: selectedTariff.id,
        periodDays: selectedPeriodDays,
      });
    }
  };

  const handleDevicePurchase = () => {
    if (deviceCount > 0) {
      purchaseDevicesMutation.mutate(deviceCount);
    }
  };

  const handleTrafficPurchase = () => {
    if (selectedTraffic) {
      purchaseTrafficMutation.mutate(selectedTraffic.gb);
    }
  };

  const isLoading =
    purchaseTariffMutation.isPending ||
    switchTariffMutation.isPending ||
    purchaseDevicesMutation.isPending ||
    purchaseTrafficMutation.isPending ||
    deleteDeviceMutation.isPending ||
    deleteAllDevicesMutation.isPending ||
    reduceDevicesMutation.isPending;

  // Helper to get device icon based on platform
  const getDeviceIcon = (platform: string) => {
    const lowerPlatform = platform.toLowerCase();
    if (
      lowerPlatform.includes('ios') ||
      lowerPlatform.includes('android') ||
      lowerPlatform.includes('phone') ||
      lowerPlatform.includes('mobile')
    ) {
      return <PhoneIcon />;
    }
    return <DesktopIcon />;
  };

  // Helper to format device name
  const formatDeviceName = (device: { platform: string; device_model: string }) => {
    if (device.device_model && device.device_model !== 'Unknown') {
      return device.device_model;
    }
    return device.platform || t('lite.unknownDevice');
  };

  return (
    <div
      className="mx-auto max-w-md px-4 py-6"
      style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}
    >
      {/* Balance display */}
      <div className="mb-6 flex items-center justify-between rounded-xl bg-dark-800/50 px-4 py-3">
        <span className="text-sm text-dark-400">{t('lite.balance')}</span>
        <span className="font-semibold text-dark-100">{formatPrice(balance)}</span>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="mb-4 rounded-xl bg-success-500/20 px-4 py-3 text-center text-sm text-success-400">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-error-500/20 px-4 py-3 text-center text-sm text-error-400">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {(['tariffs', 'devices', 'traffic'] as TabType[])
          .filter((tab) => {
            // Hide traffic tab if topup is disabled in tariff settings
            if (tab === 'traffic' && currentTariff && !currentTariff.traffic_topup_enabled) {
              return false;
            }
            return true;
          })
          .map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setError(null);
                setSuccess(null);
              }}
              disabled={tab !== 'tariffs' && !hasSubscription}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-accent-500 text-white'
                  : tab !== 'tariffs' && !hasSubscription
                    ? 'cursor-not-allowed bg-dark-800/30 text-dark-500'
                    : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50'
              }`}
            >
              {t(`lite.tab.${tab}`)}
            </button>
          ))}
      </div>

      {/* Tariffs Tab */}
      {activeTab === 'tariffs' && (
        <div className="space-y-4">
          {tariffs.map((tariff) => {
            const isSelected = selectedTariff?.id === tariff.id;
            const isCurrent = tariff.is_current;
            const period = selectedPeriodDays
              ? tariff.periods.find((p) => p.days === selectedPeriodDays) || tariff.periods[0]
              : tariff.periods[0];

            return (
              <button
                key={tariff.id}
                onClick={() => {
                  setSelectedTariff(tariff);
                  if (tariff.periods.length > 0 && !selectedPeriodDays) {
                    setSelectedPeriodDays(tariff.periods[0].days);
                  }
                }}
                className={`relative w-full rounded-2xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-accent-500 bg-accent-500/10'
                    : isCurrent && !subscription?.is_trial
                      ? 'border-success-500/50 bg-success-500/5'
                      : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                }`}
              >
                {isCurrent && !subscription?.is_trial && (
                  <span className="absolute -top-2 right-3 flex items-center gap-1 rounded-full bg-success-500 px-2 py-0.5 text-xs font-medium text-white">
                    <StarIcon />
                    {t('lite.currentTariff')}
                  </span>
                )}

                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-dark-100">{tariff.name}</h3>
                  {isSelected && (!isCurrent || subscription?.is_trial) && (
                    <span className="text-accent-400">
                      <CheckIcon />
                    </span>
                  )}
                </div>

                {/* Tariff description */}
                {tariff.description && (
                  <p className="mb-3 text-sm text-dark-400">{tariff.description}</p>
                )}

                <div className="mb-3 flex flex-wrap gap-2 text-sm text-dark-400">
                  <span>
                    {tariff.is_unlimited_traffic
                      ? t('lite.unlimited')
                      : `${tariff.traffic_limit_gb} GB`}
                  </span>
                  <span>•</span>
                  <span>
                    {tariff.device_limit} {t('lite.devices')}
                  </span>
                  <span>•</span>
                  <span>
                    {tariff.servers_count} {t('lite.servers')}
                  </span>
                </div>

                {/* Price display - different for daily vs period tariffs */}
                {tariff.is_daily || tariff.daily_price_kopeks ? (
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-accent-400">
                      {formatPrice(tariff.daily_price_kopeks ?? tariff.price_per_day_kopeks ?? 0)}
                    </span>
                    <span className="text-sm text-dark-500">/{t('lite.day')}</span>
                  </div>
                ) : period ? (
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-accent-400">{period.price_label}</span>
                    <span className="text-sm text-dark-500">
                      {period.price_per_month_label}/{t('lite.month')}
                    </span>
                  </div>
                ) : null}
              </button>
            );
          })}

          {/* Period selector for selected tariff */}
          {selectedTariff && !hasSubscription && selectedTariff.periods.length > 1 && (
            <div className="space-y-2">
              <p className="text-sm text-dark-400">{t('lite.selectPeriod')}</p>
              <div className="grid grid-cols-2 gap-2">
                {selectedTariff.periods.map((period) => (
                  <button
                    key={period.days}
                    onClick={() => setSelectedPeriodDays(period.days)}
                    className={`rounded-xl px-3 py-2 text-sm transition-all ${
                      selectedPeriodDays === period.days
                        ? 'bg-accent-500 text-white'
                        : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action button */}
          {selectedTariff && (
            <button
              onClick={handleTariffAction}
              disabled={isLoading || (selectedTariff.is_current && !subscription?.is_trial)}
              className={`w-full rounded-xl py-4 font-semibold transition-all active:scale-[0.98] ${
                selectedTariff.is_current && !subscription?.is_trial
                  ? 'cursor-not-allowed bg-dark-700 text-dark-400'
                  : 'bg-accent-500 text-white hover:bg-accent-600'
              }`}
            >
              {isLoading
                ? t('common.loading')
                : hasSubscription && !subscription?.is_trial && currentTariffId !== null
                  ? t('lite.changeTariff')
                  : t('lite.buyTariff')}
            </button>
          )}
        </div>
      )}

      {/* Devices Tab */}
      {activeTab === 'devices' && hasSubscription && (
        <div className="space-y-4">
          {/* Current devices info */}
          <div className="rounded-xl bg-dark-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/20 text-accent-400">
                <DeviceIcon />
              </div>
              <div>
                <p className="font-medium text-dark-100">
                  {deviceLimitFromTariff} {t('lite.devicesTotal')}
                </p>
                <p className="text-sm text-dark-400">{t('lite.devicesDescription')}</p>
              </div>
            </div>
          </div>

          {/* Connected devices list */}
          {isDevicesLoading && (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
            </div>
          )}

          {devicesData && devicesData.devices.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-dark-400">{t('lite.connectedDevices')}</p>
                {devicesData.devices.length > 1 && (
                  <button
                    onClick={() => deleteAllDevicesMutation.mutate()}
                    disabled={isLoading}
                    className="text-xs text-error-400 hover:text-error-300 disabled:opacity-50"
                  >
                    {t('lite.deleteAll')}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {devicesData.devices.map((device) => (
                  <div
                    key={device.hwid}
                    className="flex items-center justify-between rounded-xl bg-dark-800/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-dark-700 text-dark-400">
                        {getDeviceIcon(device.platform)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-dark-100">
                          {formatDeviceName(device)}
                        </p>
                        <p className="text-xs text-dark-500">{device.platform}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteDeviceMutation.mutate(device.hwid)}
                      disabled={isLoading}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-dark-400 transition-colors hover:bg-error-500/20 hover:text-error-400 disabled:opacity-50"
                      title={t('lite.deleteDevice')}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {devicesData && devicesData.devices.length === 0 && !isDevicesLoading && (
            <div className="rounded-xl bg-dark-800/30 px-4 py-3 text-center text-sm text-dark-400">
              {t('lite.noConnectedDevices')}
            </div>
          )}

          {/* Loading state for device price */}
          {isDevicePriceLoading && !devicePrice && (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
            </div>
          )}

          {/* Device count selector - not available for trial */}
          {devicePrice?.available && !subscription?.is_trial && (
            <>
              {/* Device limit info */}
              {typeof devicePrice.current_device_limit === 'number' &&
                typeof devicePrice.max_device_limit === 'number' && (
                  <div className="rounded-xl bg-dark-800/30 px-4 py-2 text-center text-sm text-dark-400">
                    {t('lite.deviceLimit', {
                      current: devicePrice.current_device_limit,
                      max: devicePrice.max_device_limit,
                    })}
                  </div>
                )}

              {/* Can add more devices */}
              {devicePrice.can_add && devicePrice.can_add > 0 ? (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-dark-400">{t('lite.addDevices')}</p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setDeviceCount(Math.max(1, deviceCount - 1))}
                        disabled={deviceCount <= 1}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark-800 text-dark-300 transition-colors hover:bg-dark-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        −
                      </button>
                      <span className="w-12 text-center text-xl font-bold text-dark-100">
                        {deviceCount}
                      </span>
                      <button
                        onClick={() => {
                          const maxCanAdd = devicePrice.can_add ?? 0;
                          if (deviceCount < maxCanAdd) {
                            setDeviceCount(deviceCount + 1);
                          }
                        }}
                        disabled={deviceCount >= (devicePrice.can_add ?? 0)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark-800 text-dark-300 transition-colors hover:bg-dark-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-center text-xs text-dark-500">
                      {t('lite.canAddDevices', { count: devicePrice.can_add })}
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-dark-800/50 px-4 py-3">
                    <span className="text-dark-400">{t('lite.total')}</span>
                    <span className="text-lg font-bold text-accent-400">
                      {formatPrice(devicePrice.total_price_kopeks || 0)}
                    </span>
                  </div>

                  <button
                    onClick={handleDevicePurchase}
                    disabled={isLoading || deviceCount < 1}
                    className="w-full rounded-xl bg-accent-500 py-4 font-semibold text-white transition-all hover:bg-accent-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? t('common.loading') : t('lite.buyDevices')}
                  </button>
                </>
              ) : (
                <div className="rounded-xl bg-dark-800/50 p-4 text-center text-dark-400">
                  {t('lite.maxDevicesReached')}
                </div>
              )}
            </>
          )}

          {devicePrice && !devicePrice.available && !subscription?.is_trial && (
            <div className="rounded-xl bg-dark-800/50 p-4 text-center text-dark-400">
              {devicePrice.reason || t('lite.devicesNotAvailable')}
            </div>
          )}

          {/* Reduce devices section - not available for trial */}
          {reductionInfo?.available && reductionInfo.can_reduce > 0 && !subscription?.is_trial && (
            <div className="mt-4 space-y-3 border-t border-dark-700 pt-4">
              <p className="text-sm text-dark-400">{t('lite.reduceDevices')}</p>

              <div className="rounded-xl bg-dark-800/30 px-4 py-2 text-center text-sm text-dark-400">
                {t('lite.connectedDevicesCount', { count: reductionInfo.connected_devices_count })}
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setReduceCount(Math.max(1, reduceCount - 1))}
                  disabled={reduceCount <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark-800 text-dark-300 transition-colors hover:bg-dark-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  −
                </button>
                <span className="w-12 text-center text-xl font-bold text-dark-100">
                  {reduceCount}
                </span>
                <button
                  onClick={() =>
                    setReduceCount(Math.min(reductionInfo.can_reduce, reduceCount + 1))
                  }
                  disabled={reduceCount >= reductionInfo.can_reduce}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark-800 text-dark-300 transition-colors hover:bg-dark-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  +
                </button>
              </div>
              <p className="text-center text-xs text-dark-500">
                {t('lite.canReduceDevices', { count: reductionInfo.can_reduce })}
              </p>

              <div className="flex items-center justify-between rounded-xl bg-dark-800/50 px-4 py-3">
                <span className="text-dark-400">{t('lite.newDeviceLimit')}</span>
                <span className="text-lg font-bold text-dark-100">
                  {reductionInfo.current_device_limit - reduceCount}
                </span>
              </div>

              <button
                onClick={() =>
                  reduceDevicesMutation.mutate(reductionInfo.current_device_limit - reduceCount)
                }
                disabled={isLoading || reduceCount < 1}
                className="w-full rounded-xl bg-warning-500 py-4 font-semibold text-white transition-all hover:bg-warning-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? t('common.loading') : t('lite.reduceDevicesButton')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Traffic Tab */}
      {activeTab === 'traffic' && hasSubscription && (
        <div className="space-y-4">
          {/* Current traffic info */}
          <div className="rounded-xl bg-dark-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/20 text-accent-400">
                <TrafficIcon />
              </div>
              <div>
                <p className="font-medium text-dark-100">
                  {subscription?.traffic_limit_gb === -1
                    ? t('lite.unlimited')
                    : `${subscription?.traffic_used_gb?.toFixed(1)} / ${subscription?.traffic_limit_gb} GB`}
                </p>
                <p className="text-sm text-dark-400">{t('lite.trafficDescription')}</p>
              </div>
            </div>
          </div>

          {/* Traffic packages */}
          {trafficPackages && trafficPackages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-dark-400">{t('lite.addTraffic')}</p>
              <div className="grid grid-cols-2 gap-2">
                {trafficPackages.map((pkg) => (
                  <button
                    key={pkg.gb}
                    onClick={() => setSelectedTraffic(pkg)}
                    className={`rounded-xl p-3 text-center transition-all ${
                      selectedTraffic?.gb === pkg.gb
                        ? 'bg-accent-500 text-white'
                        : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                    }`}
                  >
                    <div className="text-lg font-bold">
                      {pkg.is_unlimited ? '∞' : `${pkg.gb} GB`}
                    </div>
                    <div className="text-sm opacity-80">{formatPrice(pkg.price_kopeks)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedTraffic && (
            <button
              onClick={handleTrafficPurchase}
              disabled={isLoading}
              className="w-full rounded-xl bg-accent-500 py-4 font-semibold text-white transition-all hover:bg-accent-600 active:scale-[0.98]"
            >
              {isLoading ? t('common.loading') : t('lite.buyTraffic')}
            </button>
          )}

          {(!trafficPackages || trafficPackages.length === 0) && (
            <div className="rounded-xl bg-dark-800/50 p-4 text-center text-dark-400">
              {t('lite.trafficNotAvailable')}
            </div>
          )}
        </div>
      )}

      {/* Top up button */}
      <button
        onClick={() => navigate('/balance')}
        className="mt-6 w-full rounded-xl border border-dark-600 bg-dark-800/50 py-3 text-sm font-medium text-dark-300 transition-all hover:border-dark-500 hover:bg-dark-700/50 active:scale-[0.98]"
      >
        {t('lite.topUpBalance')}
      </button>
    </div>
  );
}
