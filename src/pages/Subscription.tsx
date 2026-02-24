import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { AxiosError } from 'axios';
import { subscriptionApi } from '../api/subscription';
import { promoApi } from '../api/promo';
import type {
  PurchaseSelection,
  PeriodOption,
  Tariff,
  TariffPeriod,
  ClassicPurchaseOptions,
} from '../types';
import InsufficientBalancePrompt from '../components/InsufficientBalancePrompt';
import { useCurrency } from '../hooks/useCurrency';
import { useCloseOnSuccessNotification } from '../store/successNotification';
import {
  buildPurchaseSteps,
  BuyDevicesSection,
  BuyTrafficSection,
  CheckIcon,
  CopyIcon,
  DeviceListSection,
  getAvailableServersForPeriod,
  createApplyPromoDiscount,
  createPriceFormatter,
  getErrorMessage,
  getFlagEmoji,
  getInsufficientBalanceError,
  getStepLabel,
  getTrafficColor,
  ReduceDevicesSection,
  ServerManagementSection,
  TariffCardsGrid,
  TariffPurchaseForm,
  TariffSwitchPreview,
  useDeviceManagementMutations,
  useSubscriptionAuxQueries,
  useSubscriptionModals,
  useTariffMutations,
  useTrafficAndCountriesMutations,
  type PurchaseStep,
} from '@/features/subscription';

// Import lite mode hook and component
import { useLiteMode } from '../hooks/useLiteMode';
import { LiteSubscription } from './LiteSubscription';

export default function Subscription() {
  const { isLiteMode, isLiteModeReady } = useLiteMode();

  // Wait for lite mode to be determined (for new users)
  if (!isLiteModeReady) {
    return null;
  }

  // Render Lite Subscription if lite mode is enabled
  if (isLiteMode) {
    return <LiteSubscription />;
  }

  return <FullSubscription />;
}

function FullSubscription() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { formatAmount, currencySymbol } = useCurrency();
  const [copied, setCopied] = useState(false);

  // Purchase state (classic mode)
  const [currentStep, setCurrentStep] = useState<PurchaseStep>('period');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption | null>(null);
  const [selectedTraffic, setSelectedTraffic] = useState<number | null>(null);
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<number>(1);
  const {
    showPurchaseForm,
    setShowPurchaseForm,
    showTariffPurchase,
    setShowTariffPurchase,
    showDeviceTopup,
    setShowDeviceTopup,
    showDeviceReduction,
    setShowDeviceReduction,
    showTrafficTopup,
    setShowTrafficTopup,
    showServerManagement,
    setShowServerManagement,
    closeAllModals,
  } = useSubscriptionModals();

  // Tariffs mode state
  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null);
  const [selectedTariffPeriod, setSelectedTariffPeriod] = useState<TariffPeriod | null>(null);
  // Custom days/traffic state
  const [customDays, setCustomDays] = useState<number>(30);
  const [customTrafficGb, setCustomTrafficGb] = useState<number>(50);
  const [useCustomDays, setUseCustomDays] = useState(false);
  const [useCustomTraffic, setUseCustomTraffic] = useState(false);
  // Device/traffic topup state
  const [devicesToAdd, setDevicesToAdd] = useState(1);
  const [targetDeviceLimit, setTargetDeviceLimit] = useState<number>(1);
  const [selectedTrafficPackage, setSelectedTrafficPackage] = useState<number | null>(null);
  const [selectedServersToUpdate, setSelectedServersToUpdate] = useState<string[]>([]);

  // Traffic refresh state
  const [trafficRefreshCooldown, setTrafficRefreshCooldown] = useState(0);
  const devicesSectionRef = useRef<HTMLDivElement | null>(null);
  const [trafficData, setTrafficData] = useState<{
    traffic_used_gb: number;
    traffic_used_percent: number;
    is_unlimited: boolean;
  } | null>(null);

  const { data: subscriptionResponse, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getSubscription,
    retry: false,
    staleTime: 0, // Always refetch to get latest data
    refetchOnMount: 'always',
  });

  // Extract subscription from response (null if no subscription)
  const subscription = subscriptionResponse?.subscription ?? null;

  const { data: purchaseOptions, isLoading: optionsLoading } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: subscriptionApi.getPurchaseOptions,
  });

  // Fetch active promo discount
  const { data: activeDiscount } = useQuery({
    queryKey: ['active-discount'],
    queryFn: promoApi.getActiveDiscount,
    staleTime: 30000,
  });

  const formatPrice = useMemo(
    () => createPriceFormatter(formatAmount, currencySymbol),
    [formatAmount, currencySymbol],
  );
  const applyPromoDiscount = useMemo(
    () => createApplyPromoDiscount(activeDiscount),
    [activeDiscount],
  );

  // Check if in tariffs mode (moved up to be available for useEffect)
  const isTariffsMode = purchaseOptions?.sales_mode === 'tariffs';
  const classicOptions = !isTariffsMode ? (purchaseOptions as ClassicPurchaseOptions) : null;
  const tariffs =
    isTariffsMode && purchaseOptions && 'tariffs' in purchaseOptions ? purchaseOptions.tariffs : [];

  const selectedPeriodAvailableServers = useMemo(
    () => getAvailableServersForPeriod(selectedPeriod, Boolean(subscription?.is_trial)),
    [selectedPeriod, subscription?.is_trial],
  );

  // Determine which steps are needed
  const steps = useMemo<PurchaseStep[]>(() => {
    return buildPurchaseSteps(selectedPeriod, selectedPeriodAvailableServers.length);
  }, [selectedPeriod, selectedPeriodAvailableServers.length]);

  const currentStepIndex = steps.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Initialize selection from options (classic mode only)
  useEffect(() => {
    if (classicOptions && !selectedPeriod) {
      const defaultPeriod =
        classicOptions.periods.find((p) => p.id === classicOptions.selection.period_id) ||
        classicOptions.periods[0];
      setSelectedPeriod(defaultPeriod);
      setSelectedTraffic(classicOptions.selection.traffic_value);
      const availableServers = getAvailableServersForPeriod(
        defaultPeriod,
        Boolean(subscription?.is_trial),
      );
      const availableServerUuids = new Set(availableServers.map((s) => s.uuid));
      // If only 1 server available, auto-select it (step will be skipped)
      if (availableServers.length === 1) {
        setSelectedServers([availableServers[0].uuid]);
      } else {
        setSelectedServers(
          classicOptions.selection.servers.filter((uuid) => availableServerUuids.has(uuid)),
        );
      }
      setSelectedDevices(classicOptions.selection.devices);
    }
  }, [classicOptions, selectedPeriod, subscription?.is_trial]);

  // Build selection object
  const currentSelection: PurchaseSelection = useMemo(
    () => ({
      period_id: selectedPeriod?.id,
      period_days: selectedPeriod?.period_days,
      traffic_value: selectedTraffic ?? undefined,
      servers: selectedServers,
      devices: selectedDevices,
    }),
    [selectedPeriod, selectedTraffic, selectedServers, selectedDevices],
  );

  // Preview query
  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ['purchase-preview', currentSelection],
    queryFn: () => subscriptionApi.previewPurchase(currentSelection),
    enabled: !!selectedPeriod && showPurchaseForm && currentStep === 'confirm',
  });

  const purchaseMutation = useMutation({
    mutationFn: () => subscriptionApi.submitPurchase(currentSelection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
      setShowPurchaseForm(false);
      setCurrentStep('period');
    },
  });

  const autopayMutation = useMutation({
    mutationFn: (enabled: boolean) => subscriptionApi.updateAutopay(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });

  // Devices query
  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: subscriptionApi.getDevices,
    enabled: !!subscription,
  });

  // Delete device mutation
  const deleteDeviceMutation = useMutation({
    mutationFn: (hwid: string) => subscriptionApi.deleteDevice(hwid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  // Delete all devices mutation
  const deleteAllDevicesMutation = useMutation({
    mutationFn: () => subscriptionApi.deleteAllDevices(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  // Pause subscription mutation
  const pauseMutation = useMutation({
    mutationFn: () => subscriptionApi.togglePause(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });

  // Refs for auto-scroll
  const switchModalRef = useRef<HTMLDivElement>(null);
  const tariffPurchaseRef = useRef<HTMLDivElement>(null);
  const tariffsCardRef = useRef<HTMLDivElement>(null);

  // Tariff switch preview
  const [switchTariffId, setSwitchTariffId] = useState<number | null>(null);

  // Auto-close all modals/forms when success notification appears (e.g., subscription purchased via WebSocket)
  const handleCloseAllModals = useCallback(() => {
    closeAllModals();
    setSwitchTariffId(null);
    setSelectedTariff(null);
    setSelectedTariffPeriod(null);
  }, [closeAllModals, setSelectedTariff, setSelectedTariffPeriod, setSwitchTariffId]);
  useCloseOnSuccessNotification(handleCloseAllModals);

  const { data: switchPreview, isLoading: switchPreviewLoading } = useQuery({
    queryKey: ['tariff-switch-preview', switchTariffId],
    queryFn: () => subscriptionApi.previewTariffSwitch(switchTariffId!),
    enabled: !!switchTariffId,
  });

  const { switchTariffMutation, tariffPurchaseMutation } = useTariffMutations({
    queryClient,
    tariffs,
    switchTariffId,
    selectedTariff,
    selectedTariffPeriod,
    useCustomDays,
    useCustomTraffic,
    customDays,
    customTrafficGb,
    setSwitchTariffId,
    setSelectedTariff,
    setSelectedTariffPeriod,
    setShowTariffPurchase,
    setUseCustomDays,
    setUseCustomTraffic,
  });

  const { devicePriceData, deviceReductionInfo, countriesData, countriesLoading } =
    useSubscriptionAuxQueries({
      devicesToAdd,
      showDeviceTopup,
      showDeviceReduction,
      showServerManagement,
      subscription,
      setTargetDeviceLimit,
      setSelectedServersToUpdate,
    });

  const { devicePurchaseMutation, deviceReductionMutation } = useDeviceManagementMutations({
    queryClient,
    devicesToAdd,
    targetDeviceLimit,
    setShowDeviceTopup,
    setDevicesToAdd,
    setShowDeviceReduction,
  });

  // Traffic packages query
  const { data: trafficPackages } = useQuery({
    queryKey: ['traffic-packages'],
    queryFn: subscriptionApi.getTrafficPackages,
    enabled: showTrafficTopup && !!subscription,
  });

  const { trafficPurchaseMutation, updateCountriesMutation, refreshTrafficMutation } =
    useTrafficAndCountriesMutations({
      queryClient,
      setShowTrafficTopup,
      setSelectedTrafficPackage,
      setShowServerManagement,
      setTrafficData,
      setTrafficRefreshCooldown,
    });

  // Track if we've already triggered auto-refresh this session
  const hasAutoRefreshed = useRef(false);

  // Cooldown timer for traffic refresh
  useEffect(() => {
    if (trafficRefreshCooldown <= 0) return;
    const timer = setInterval(() => {
      setTrafficRefreshCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [trafficRefreshCooldown]);

  // Auto-refresh traffic on mount (with 30s caching)
  useEffect(() => {
    if (!subscription) return;
    if (hasAutoRefreshed.current) return;
    hasAutoRefreshed.current = true;

    const lastRefresh = localStorage.getItem('traffic_refresh_ts');
    const now = Date.now();
    const cacheMs = 30 * 1000;

    if (lastRefresh && now - parseInt(lastRefresh, 10) < cacheMs) {
      const elapsed = now - parseInt(lastRefresh, 10);
      const remaining = Math.ceil((cacheMs - elapsed) / 1000);
      if (remaining > 0) {
        setTrafficRefreshCooldown(remaining);
      }
      return;
    }

    refreshTrafficMutation.mutate();
  }, [subscription, refreshTrafficMutation]);

  // Auto-scroll to switch tariff modal when it appears
  useEffect(() => {
    if (switchTariffId && switchModalRef.current) {
      const timer = setTimeout(() => {
        switchModalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [switchTariffId]);

  // Auto-scroll to tariff purchase form when it appears
  useEffect(() => {
    if (showTariffPurchase && tariffPurchaseRef.current) {
      const timer = setTimeout(() => {
        tariffPurchaseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showTariffPurchase]);

  // Auto-scroll to tariffs section when coming from Dashboard "Продлить" button
  useEffect(() => {
    const state = location.state as { scrollToExtend?: boolean } | null;
    // Wait for tariffs to load before scrolling
    if (state?.scrollToExtend && tariffsCardRef.current && tariffs.length > 0) {
      const timer = setTimeout(() => {
        tariffsCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      // Clear the state to prevent re-scrolling on subsequent renders
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state, tariffs.length]);

  // Auto-scroll to devices section when coming from Dashboard devices metric
  useEffect(() => {
    const state = location.state as { scrollToExtend?: boolean; scrollToDevices?: boolean } | null;
    if (state?.scrollToDevices && devicesSectionRef.current) {
      const timer = setTimeout(() => {
        devicesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const copyUrl = () => {
    if (subscription?.subscription_url) {
      navigator.clipboard.writeText(subscription.subscription_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleServer = (uuid: string) => {
    if (selectedServers.includes(uuid)) {
      if (selectedServers.length > 1) {
        setSelectedServers(selectedServers.filter((s) => s !== uuid));
      }
    } else {
      setSelectedServers([...selectedServers, uuid]);
    }
  };

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const goToPrevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const resetPurchase = () => {
    setShowPurchaseForm(false);
    setCurrentStep('period');
  };

  const isSubscriptionExpired =
    isTariffsMode &&
    !!purchaseOptions &&
    'subscription_is_expired' in purchaseOptions &&
    purchaseOptions.subscription_is_expired === true;

  const handleSelectTariff = useCallback(
    (tariff: Tariff) => {
      setSelectedTariff(tariff);
      setSelectedTariffPeriod(tariff.periods[0] || null);
      setShowTariffPurchase(true);
    },
    [setSelectedTariff, setSelectedTariffPeriod, setShowTariffPurchase],
  );

  const handleCloseTariffPurchase = useCallback(() => {
    setShowTariffPurchase(false);
    setSelectedTariff(null);
    setSelectedTariffPeriod(null);
  }, [setSelectedTariff, setSelectedTariffPeriod, setShowTariffPurchase]);

  const switchTariffErrorMessage = useMemo(() => {
    if (!switchTariffMutation.isError) return null;
    const detail =
      switchTariffMutation.error instanceof AxiosError
        ? switchTariffMutation.error.response?.data?.detail
        : null;
    if (typeof detail === 'object' && detail?.error_code === 'subscription_expired') {
      return null;
    }
    return getErrorMessage(switchTariffMutation.error);
  }, [switchTariffMutation.error, switchTariffMutation.isError]);

  const tariffPurchaseInsufficientBalance = useMemo(() => {
    if (!tariffPurchaseMutation.isError) return null;
    return getInsufficientBalanceError(tariffPurchaseMutation.error)?.missingAmount ?? null;
  }, [tariffPurchaseMutation.error, tariffPurchaseMutation.isError]);

  const tariffPurchaseErrorMessage = useMemo(() => {
    if (!tariffPurchaseMutation.isError || tariffPurchaseInsufficientBalance !== null) return null;
    return getErrorMessage(tariffPurchaseMutation.error);
  }, [
    tariffPurchaseInsufficientBalance,
    tariffPurchaseMutation.error,
    tariffPurchaseMutation.isError,
  ]);

  if (isLoading || optionsLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark-50 sm:text-3xl">{t('subscription.title')}</h1>

      {/* Current Subscription */}
      {subscription ? (
        <div
          className={`bento-card ${subscription.is_trial ? 'border-warning-500/30 bg-gradient-to-br from-warning-500/5 to-transparent' : ''}`}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-dark-100">
                {t('subscription.currentPlan')}
              </h2>
              {subscription.tariff_name && (
                <div className="mt-1 text-sm text-accent-400">{subscription.tariff_name}</div>
              )}
            </div>
            <span
              className={
                subscription.is_active
                  ? subscription.is_trial
                    ? 'badge-warning'
                    : 'badge-success'
                  : 'badge-error'
              }
            >
              {subscription.is_trial
                ? t('subscription.trialStatus')
                : subscription.is_active
                  ? t('subscription.active')
                  : t('subscription.expired')}
            </span>
          </div>

          {/* Trial Period Info Banner */}
          {subscription.is_trial && subscription.is_active && (
            <div className="mb-6 rounded-xl border border-warning-500/30 bg-warning-500/10 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-warning-500/20 text-lg">
                  <svg
                    className="h-5 w-5 text-warning-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-warning-300">
                    {t('subscription.trialInfo.title')}
                  </div>
                  <div className="mt-1 text-sm text-dark-400">
                    {t('subscription.trialInfo.description')}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-warning-400">
                        {subscription.days_left > 0
                          ? t('subscription.days', { count: subscription.days_left })
                          : `${subscription.hours_left}${t('subscription.hours')} ${subscription.minutes_left}${t('subscription.minutes')}`}
                      </span>
                      <span className="text-dark-500">{t('subscription.trialInfo.remaining')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-warning-400">
                        {subscription.traffic_limit_gb || '∞'} GB
                      </span>
                      <span className="text-dark-500">{t('subscription.traffic')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-warning-400">{subscription.device_limit}</span>
                      <span className="text-dark-500">{t('subscription.devices')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Connection Data - Top Priority */}
          {subscription.subscription_url && (
            <div className="mb-6 rounded-xl border border-accent-500/30 bg-accent-500/10 p-4">
              <div className="mb-3 font-medium text-dark-100">
                {t('subscription.connectionInfo')}
              </div>

              {/* Get Config Button */}
              <button
                onClick={() => navigate('/connection')}
                className="btn-primary mb-3 flex w-full items-center justify-center gap-2 py-3"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                {t('subscription.getConfig')}
              </button>

              {/* Subscription URL - hidden when hide_subscription_link is true */}
              {!subscription.hide_subscription_link && (
                <div className="flex gap-2">
                  <code className="scrollbar-hide flex-1 overflow-x-auto break-all rounded-lg border border-dark-700/50 bg-dark-900/50 px-3 py-2 text-xs text-dark-300">
                    {subscription.subscription_url}
                  </code>
                  <button
                    onClick={copyUrl}
                    className={`btn-secondary px-3 ${copied ? 'border-success-500/30 text-success-400' : ''}`}
                    title={t('subscription.copyLink')}
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mb-6 grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <div className="mb-1 text-sm text-dark-500">{t('subscription.daysLeft')}</div>
              <div className="text-xl font-semibold text-dark-100">
                {subscription.days_left > 0 ? (
                  t('subscription.days', { count: subscription.days_left })
                ) : subscription.hours_left > 0 ? (
                  `${t('subscription.hours', { count: subscription.hours_left })} ${t('subscription.minutes', { count: subscription.minutes_left })}`
                ) : subscription.minutes_left > 0 ? (
                  t('subscription.minutes', { count: subscription.minutes_left })
                ) : (
                  <span className="text-error-400">{t('subscription.expired')}</span>
                )}
              </div>
            </div>
            <div>
              <div className="mb-1 text-sm text-dark-500">{t('subscription.expiresAt')}</div>
              <div className="text-xl font-semibold text-dark-100">
                {new Date(subscription.end_date).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm text-dark-500">{t('subscription.traffic')}</span>
                <button
                  onClick={() => refreshTrafficMutation.mutate()}
                  disabled={refreshTrafficMutation.isPending || trafficRefreshCooldown > 0}
                  className="rounded-full p-1 text-dark-400 transition-colors hover:bg-dark-700/50 hover:text-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
                  title={
                    trafficRefreshCooldown > 0 ? `${trafficRefreshCooldown}s` : t('common.refresh')
                  }
                >
                  <svg
                    className={`h-3.5 w-3.5 ${refreshTrafficMutation.isPending ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
              <div className="text-xl font-semibold text-dark-100">
                {(trafficData?.traffic_used_gb ?? subscription.traffic_used_gb).toFixed(1)} /{' '}
                {subscription.traffic_limit_gb || '∞'} GB
              </div>
              {subscription.traffic_reset_mode &&
                subscription.traffic_reset_mode !== 'NO_RESET' && (
                  <div className="mt-0.5 text-xs text-dark-500">
                    {t(`subscription.trafficReset.${subscription.traffic_reset_mode}`)}
                  </div>
                )}
            </div>
            <div>
              <div className="mb-1 text-sm text-dark-500">{t('subscription.devices')}</div>
              <div className="text-xl font-semibold text-dark-100">{subscription.device_limit}</div>
            </div>
          </div>

          {/* Locations */}
          {subscription.servers && subscription.servers.length > 0 && (
            <div className="mb-6">
              <div className="mb-2 text-sm text-dark-500">{t('subscription.locationsLabel')}</div>
              <div className="flex flex-wrap gap-2">
                {subscription.servers.map((server) => (
                  <span
                    key={server.uuid}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dark-700/50 bg-dark-800/50 px-3 py-1.5 text-sm text-dark-200"
                  >
                    {server.country_code && (
                      <span className="text-base">{getFlagEmoji(server.country_code)}</span>
                    )}
                    {server.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Traffic Usage */}
          {subscription.traffic_limit_gb > 0 && (
            <div className="mb-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-dark-400">{t('subscription.trafficUsed')}</span>
                <span className="text-dark-300">
                  {(trafficData?.traffic_used_percent ?? subscription.traffic_used_percent).toFixed(
                    1,
                  )}
                  %
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${getTrafficColor(trafficData?.traffic_used_percent ?? subscription.traffic_used_percent)}`}
                  style={{
                    width: `${Math.min(trafficData?.traffic_used_percent ?? subscription.traffic_used_percent, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Purchased Traffic Packages */}
          {subscription.traffic_purchases && subscription.traffic_purchases.length > 0 && (
            <div className="mb-6">
              <div className="mb-3 text-sm text-dark-500">{t('subscription.purchasedTraffic')}</div>
              <div className="space-y-3">
                {subscription.traffic_purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg
                          className="h-5 w-5 text-accent-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span className="text-base font-semibold text-dark-100">
                          {purchase.traffic_gb} {t('common.units.gb')}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-sm text-dark-400">
                          {purchase.days_remaining === 0 ? (
                            <span className="text-orange-500">{t('subscription.expired')}</span>
                          ) : (
                            <span>
                              {t('subscription.days', { count: purchase.days_remaining })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-dark-500">
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>
                            {t('subscription.trafficResetAt')}:{' '}
                            {new Date(purchase.expires_at).toLocaleDateString(undefined, {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-dark-700">
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-accent-500 to-accent-600 transition-all duration-300"
                        style={{ width: `${purchase.progress_percent}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-dark-500">
                      <span>{new Date(purchase.created_at).toLocaleDateString()}</span>
                      <span>{new Date(purchase.expires_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Autopay Toggle - hide for daily tariffs */}
          {!subscription.is_trial && !subscription.is_daily && (
            <div className="flex items-center justify-between border-t border-dark-800/50 py-4">
              <div>
                <div className="font-medium text-dark-100">{t('subscription.autoRenewal')}</div>
                <div className="text-sm text-dark-500">
                  {t('subscription.daysBeforeExpiry', { count: subscription.autopay_days_before })}
                </div>
              </div>
              <button
                onClick={() => autopayMutation.mutate(!subscription.autopay_enabled)}
                disabled={autopayMutation.isPending}
                className={`relative h-6 w-12 rounded-full transition-colors ${
                  subscription.autopay_enabled ? 'bg-accent-500' : 'bg-dark-700'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    subscription.autopay_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-dark-800">
            <svg
              className="h-8 w-8 text-dark-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
          </div>
          <div className="mb-4 text-dark-400">{t('subscription.noSubscription')}</div>
        </div>
      )}

      {/* Daily Subscription Pause */}
      {subscription && subscription.is_daily && !subscription.is_trial && (
        <div className="bento-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-dark-100">
                {t('subscription.pause.title')}
              </h2>
              <div className="mt-1 text-sm text-dark-400">
                {subscription.is_daily_paused
                  ? t('subscription.pause.paused')
                  : t('subscription.pause.active')}
              </div>
            </div>
            <button
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
              className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                subscription.is_daily_paused
                  ? 'bg-success-500/20 text-success-400 hover:bg-success-500/30'
                  : 'bg-warning-500/20 text-warning-400 hover:bg-warning-500/30'
              }`}
            >
              {pauseMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="border-current/30 h-4 w-4 animate-spin rounded-full border-2 border-t-current" />
                </span>
              ) : subscription.is_daily_paused ? (
                t('subscription.pause.resumeBtn')
              ) : (
                t('subscription.pause.pauseBtn')
              )}
            </button>
          </div>

          {/* Pause mutation error */}
          {pauseMutation.isError &&
            (() => {
              const balanceError = getInsufficientBalanceError(pauseMutation.error);
              if (balanceError) {
                const missingAmount = balanceError.required - balanceError.balance;
                return (
                  <div className="mt-4">
                    <InsufficientBalancePrompt
                      missingAmountKopeks={missingAmount}
                      message={t('subscription.pause.insufficientBalance')}
                      compact
                    />
                  </div>
                );
              }
              return (
                <div className="mt-4 rounded-lg bg-error-500/10 px-4 py-3 text-center text-sm text-error-400">
                  {getErrorMessage(pauseMutation.error)}
                </div>
              );
            })()}

          {/* Paused info or Next charge progress bar */}
          {subscription.is_daily_paused ? (
            <div className="mt-4 border-t border-dark-800/50 pt-4">
              <div className="rounded-xl border border-warning-500/30 bg-warning-500/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-xl text-warning-400">⏸️</div>
                  <div>
                    <div className="font-medium text-warning-300">
                      {t('subscription.pause.pausedInfo')}
                    </div>
                    <div className="mt-1 text-sm text-dark-400">
                      {t('subscription.pause.pausedDescription')}{' '}
                      {new Date(subscription.end_date).toLocaleDateString()} (
                      {t('subscription.pause.days', { count: subscription.days_left })})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            subscription.next_daily_charge_at &&
            (() => {
              const now = new Date();
              // Backend returns UTC datetime, ensure it's parsed as UTC
              const nextChargeStr = subscription.next_daily_charge_at.endsWith('Z')
                ? subscription.next_daily_charge_at
                : subscription.next_daily_charge_at + 'Z';
              const nextCharge = new Date(nextChargeStr);
              const totalMs = 24 * 60 * 60 * 1000; // 24 hours in ms
              const remainingMs = Math.max(0, nextCharge.getTime() - now.getTime());
              const elapsedMs = totalMs - remainingMs;
              const progress = Math.min(100, (elapsedMs / totalMs) * 100);

              const hours = Math.floor(remainingMs / (1000 * 60 * 60));
              const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

              return (
                <div className="mt-4 border-t border-dark-800/50 pt-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-dark-400">{t('subscription.pause.nextCharge')}</span>
                    <span className="font-medium text-dark-200">
                      {hours > 0
                        ? `${hours}${t('subscription.pause.hours')} ${minutes}${t('subscription.pause.minutes')}`
                        : `${minutes}${t('subscription.pause.minutes')}`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-dark-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {subscription.daily_price_kopeks && (
                    <div className="mt-2 text-center text-xs text-dark-500">
                      {t('subscription.pause.willBeCharged')}:{' '}
                      {formatPrice(subscription.daily_price_kopeks)}
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Additional Options (Buy Devices) */}
      {subscription && subscription.is_active && !subscription.is_trial && (
        <div className="bento-card">
          <h2 className="mb-4 text-lg font-semibold text-dark-100">
            {t('subscription.additionalOptions.title')}
          </h2>

          <BuyDevicesSection
            t={t}
            formatPrice={formatPrice}
            showDeviceTopup={showDeviceTopup}
            setShowDeviceTopup={setShowDeviceTopup}
            devicesToAdd={devicesToAdd}
            setDevicesToAdd={setDevicesToAdd}
            currentDeviceLimit={subscription.device_limit}
            devicePriceData={devicePriceData}
            purchaseBalanceKopeks={purchaseOptions?.balance_kopeks}
            isDevicePurchasePending={devicePurchaseMutation.isPending}
            devicePurchaseErrorMessage={
              devicePurchaseMutation.isError ? getErrorMessage(devicePurchaseMutation.error) : null
            }
            onPurchaseDevices={() => devicePurchaseMutation.mutate()}
            onBeforeTopUp={(devices) => subscriptionApi.saveDevicesCart(devices)}
          />

          <ReduceDevicesSection
            t={t}
            showDeviceReduction={showDeviceReduction}
            setShowDeviceReduction={setShowDeviceReduction}
            deviceReductionInfo={deviceReductionInfo}
            targetDeviceLimit={targetDeviceLimit}
            setTargetDeviceLimit={setTargetDeviceLimit}
            isReducing={deviceReductionMutation.isPending}
            reduceErrorMessage={
              deviceReductionMutation.isError
                ? getErrorMessage(deviceReductionMutation.error)
                : null
            }
            onReduce={() => deviceReductionMutation.mutate()}
          />

          {/* Buy Traffic */}
          {subscription.traffic_limit_gb > 0 && (
            <BuyTrafficSection
              t={t}
              formatPrice={formatPrice}
              showTrafficTopup={showTrafficTopup}
              setShowTrafficTopup={setShowTrafficTopup}
              selectedTrafficPackage={selectedTrafficPackage}
              setSelectedTrafficPackage={setSelectedTrafficPackage}
              trafficLimitGb={subscription.traffic_limit_gb}
              trafficUsedGb={subscription.traffic_used_gb}
              trafficPackages={trafficPackages}
              purchaseBalanceKopeks={purchaseOptions?.balance_kopeks}
              isTrafficPurchasePending={trafficPurchaseMutation.isPending}
              trafficPurchaseErrorMessage={
                trafficPurchaseMutation.isError
                  ? getErrorMessage(trafficPurchaseMutation.error)
                  : null
              }
              onPurchaseTraffic={(gb) => trafficPurchaseMutation.mutate(gb)}
              onBeforeTopUp={(gb) => subscriptionApi.saveTrafficCart(gb)}
            />
          )}

          {/* Server Management - only in classic mode */}
          {!isTariffsMode && (
            <ServerManagementSection
              t={t}
              formatPrice={formatPrice}
              showServerManagement={showServerManagement}
              setShowServerManagement={setShowServerManagement}
              selectedServersToUpdate={selectedServersToUpdate}
              setSelectedServersToUpdate={setSelectedServersToUpdate}
              serversCount={subscription.servers?.length || 0}
              countriesLoading={countriesLoading}
              countriesData={countriesData}
              purchaseBalanceKopeks={purchaseOptions?.balance_kopeks}
              isUpdatePending={updateCountriesMutation.isPending}
              updateErrorMessage={
                updateCountriesMutation.isError
                  ? getErrorMessage(updateCountriesMutation.error)
                  : null
              }
              onApplyChanges={(selected) => updateCountriesMutation.mutate(selected)}
            />
          )}
        </div>
      )}

      {/* My Devices Section */}
      {subscription && (
        <div ref={devicesSectionRef}>
          <DeviceListSection
            t={t}
            devicesData={devicesData}
            devicesLoading={devicesLoading}
            isDeleteDevicePending={deleteDeviceMutation.isPending}
            isDeleteAllDevicesPending={deleteAllDevicesMutation.isPending}
            onDeleteAllDevices={() => {
              if (confirm(t('subscription.confirmDeleteAllDevices'))) {
                deleteAllDevicesMutation.mutate();
              }
            }}
            onDeleteDevice={(hwid) => {
              if (confirm(t('subscription.confirmDeleteDevice'))) {
                deleteDeviceMutation.mutate(hwid);
              }
            }}
          />
        </div>
      )}

      {/* Tariffs Section - Combined Purchase/Extend/Switch like MiniApp */}
      {isTariffsMode && tariffs.length > 0 && (
        <div ref={tariffsCardRef} className="bento-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-dark-100">
              {subscription?.is_daily && !subscription?.is_trial
                ? t('subscription.switchTariff.title')
                : subscription && !subscription.is_trial
                  ? t('subscription.extend')
                  : t('subscription.getSubscription')}
            </h2>
          </div>

          {/* Trial upgrade prompt */}
          {subscription?.is_trial && (
            <div className="mb-6 rounded-xl border border-warning-500/30 bg-gradient-to-r from-warning-500/10 to-accent-500/10 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-warning-500/20">
                  <svg
                    className="h-5 w-5 text-warning-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-warning-300">
                    {t('subscription.trialUpgrade.title')}
                  </div>
                  <div className="mt-1 text-sm text-dark-400">
                    {t('subscription.trialUpgrade.description')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expired subscription notice - prompt to purchase new tariff */}
          {isTariffsMode &&
            purchaseOptions &&
            'subscription_is_expired' in purchaseOptions &&
            purchaseOptions.subscription_is_expired && (
              <div className="mb-6 rounded-xl border border-error-500/30 bg-gradient-to-r from-error-500/10 to-warning-500/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-error-500/20">
                    <svg
                      className="h-5 w-5 text-error-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-error-300">
                      {t('subscription.expiredBanner.title')}
                    </div>
                    <div className="mt-1 text-sm text-dark-400">
                      {t('subscription.expiredBanner.selectTariff')}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Legacy subscription notice - if user has subscription without tariff */}
          {subscription && !subscription.is_trial && !subscription.tariff_id && (
            <div className="mb-6 rounded-xl border border-accent-500/30 bg-accent-500/10 p-4">
              <div className="mb-2 font-medium text-accent-400">
                {t('subscription.legacy.selectTariffTitle')}
              </div>
              <div className="text-sm text-dark-300">
                {t('subscription.legacy.selectTariffDescription')}
              </div>
              <div className="mt-2 text-xs text-dark-500">
                {t('subscription.legacy.currentSubContinues')}
              </div>
            </div>
          )}

          {switchTariffId && (
            <TariffSwitchPreview
              t={t}
              formatPrice={formatPrice}
              tariffs={tariffs}
              switchTariffId={switchTariffId}
              switchModalRef={switchModalRef}
              switchPreviewLoading={switchPreviewLoading}
              switchPreview={switchPreview}
              isSwitchPending={switchTariffMutation.isPending}
              switchErrorMessage={switchTariffErrorMessage}
              onClose={() => setSwitchTariffId(null)}
              onSwitch={(tariffId) => switchTariffMutation.mutate(tariffId)}
            />
          )}

          {!showTariffPurchase ? (
            <TariffCardsGrid
              t={t}
              formatPrice={formatPrice}
              tariffs={tariffs}
              subscription={subscription}
              isSubscriptionExpired={isSubscriptionExpired}
              applyPromoDiscount={applyPromoDiscount}
              onSelectTariff={handleSelectTariff}
              onSwitchTariff={setSwitchTariffId}
            />
          ) : (
            selectedTariff && (
              <TariffPurchaseForm
                t={t}
                formatPrice={formatPrice}
                tariffPurchaseRef={tariffPurchaseRef}
                selectedTariff={selectedTariff}
                selectedTariffPeriod={selectedTariffPeriod}
                setSelectedTariffPeriod={setSelectedTariffPeriod}
                useCustomDays={useCustomDays}
                setUseCustomDays={setUseCustomDays}
                customDays={customDays}
                setCustomDays={setCustomDays}
                useCustomTraffic={useCustomTraffic}
                setUseCustomTraffic={setUseCustomTraffic}
                customTrafficGb={customTrafficGb}
                setCustomTrafficGb={setCustomTrafficGb}
                applyPromoDiscount={applyPromoDiscount}
                purchaseBalanceKopeks={purchaseOptions?.balance_kopeks}
                isPurchasePending={tariffPurchaseMutation.isPending}
                purchaseErrorMessage={tariffPurchaseErrorMessage}
                purchaseInsufficientBalanceMissingKopeks={tariffPurchaseInsufficientBalance}
                onBack={handleCloseTariffPurchase}
                onPurchase={() => tariffPurchaseMutation.mutate()}
              />
            )
          )}
        </div>
      )}

      {/* Purchase/Extend Section - Classic Mode */}
      {classicOptions && classicOptions.periods.length > 0 && (
        <div ref={tariffsCardRef} className="bento-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-dark-100">
              {subscription && !subscription.is_trial
                ? t('subscription.extend')
                : t('subscription.getSubscription')}
            </h2>
            {!showPurchaseForm && (
              <button onClick={() => setShowPurchaseForm(true)} className="btn-primary">
                {subscription && !subscription.is_trial
                  ? t('subscription.extend')
                  : t('subscription.getSubscription')}
              </button>
            )}
          </div>

          {showPurchaseForm && (
            <div className="space-y-6">
              {/* Step Indicator */}
              <div className="mb-6 flex items-center justify-between">
                <div className="text-sm text-dark-400">
                  {t('subscription.step', { current: currentStepIndex + 1, total: steps.length })}
                </div>
                <div className="flex gap-2">
                  {steps.map((step, idx) => (
                    <div
                      key={step}
                      className={`h-1 w-8 rounded-full transition-colors ${
                        idx <= currentStepIndex ? 'bg-accent-500' : 'bg-dark-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-4 text-lg font-medium text-dark-100">
                {getStepLabel(t, currentStep)}
              </div>

              {/* Step: Period Selection */}
              {currentStep === 'period' && classicOptions && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {classicOptions.periods.map((period) => {
                    const hasExistingDiscount = !!(
                      period.discount_percent && period.discount_percent > 0
                    );
                    const promoPeriod = applyPromoDiscount(
                      period.price_kopeks,
                      hasExistingDiscount,
                    );
                    const displayDiscount = hasExistingDiscount
                      ? period.discount_percent
                      : promoPeriod.percent;
                    const displayOriginal = hasExistingDiscount
                      ? period.original_price_kopeks
                      : promoPeriod.original;

                    return (
                      <button
                        key={period.id}
                        onClick={() => {
                          setSelectedPeriod(period);
                          if (period.traffic.current !== undefined) {
                            setSelectedTraffic(period.traffic.current);
                          }
                          const availableServers = getAvailableServersForPeriod(
                            period,
                            Boolean(subscription?.is_trial),
                          );
                          // If only 1 server available, auto-select it (step will be skipped)
                          if (availableServers.length === 1) {
                            setSelectedServers([availableServers[0].uuid]);
                          } else if (period.servers.selected) {
                            const availUuids = new Set(availableServers.map((s) => s.uuid));
                            setSelectedServers(
                              period.servers.selected.filter((uuid) => availUuids.has(uuid)),
                            );
                          }
                          if (period.devices.current) {
                            setSelectedDevices(period.devices.current);
                          }
                        }}
                        className={`bento-card-hover relative p-4 text-left transition-all ${
                          selectedPeriod?.id === period.id
                            ? 'bento-card-glow border-accent-500'
                            : ''
                        }`}
                      >
                        {displayDiscount && displayDiscount > 0 && (
                          <div
                            className={`absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 text-xs font-medium text-white shadow-sm ${
                              hasExistingDiscount ? 'bg-success-500' : 'bg-orange-500'
                            }`}
                          >
                            -{displayDiscount}%
                          </div>
                        )}
                        <div className="text-lg font-semibold text-dark-100">{period.label}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-medium text-accent-400">
                            {formatPrice(promoPeriod.price)}
                          </span>
                          {displayOriginal && displayOriginal > promoPeriod.price && (
                            <span className="text-sm text-dark-500 line-through">
                              {formatPrice(displayOriginal)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step: Traffic Selection */}
              {currentStep === 'traffic' && selectedPeriod?.traffic.options && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {selectedPeriod.traffic.options.map((option) => {
                    const hasExistingDiscount = !!(
                      option.discount_percent && option.discount_percent > 0
                    );
                    const promoTraffic = applyPromoDiscount(
                      option.price_kopeks,
                      hasExistingDiscount,
                    );

                    return (
                      <button
                        key={option.value}
                        onClick={() => setSelectedTraffic(option.value)}
                        disabled={!option.is_available}
                        className={`bento-card-hover relative p-4 text-center transition-all ${
                          selectedTraffic === option.value
                            ? 'bento-card-glow border-accent-500'
                            : ''
                        } ${!option.is_available ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        {(() => {
                          const trafficDisplayDiscount = hasExistingDiscount
                            ? option.discount_percent
                            : promoTraffic.percent;
                          const trafficDisplayOriginal = hasExistingDiscount
                            ? option.original_price_kopeks
                            : promoTraffic.original;
                          return (
                            <>
                              {trafficDisplayDiscount && trafficDisplayDiscount > 0 && (
                                <div
                                  className={`absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 text-xs font-medium text-white shadow-sm ${
                                    hasExistingDiscount ? 'bg-success-500' : 'bg-orange-500'
                                  }`}
                                >
                                  -{trafficDisplayDiscount}%
                                </div>
                              )}
                              <div className="text-lg font-semibold text-dark-100">
                                {option.label}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                                <span className="text-accent-400">
                                  {formatPrice(promoTraffic.price)}
                                </span>
                                {trafficDisplayOriginal &&
                                  trafficDisplayOriginal > promoTraffic.price && (
                                    <span className="text-xs text-dark-500 line-through">
                                      {formatPrice(trafficDisplayOriginal)}
                                    </span>
                                  )}
                              </div>
                            </>
                          );
                        })()}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step: Server Selection */}
              {currentStep === 'servers' && selectedPeriod?.servers.options && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {selectedPeriod.servers.options
                    // Hide unavailable (disabled) servers and trial servers for existing trial users
                    .filter((server) => {
                      if (!server.is_available) return false;
                      if (subscription?.is_trial && server.name.toLowerCase().includes('trial')) {
                        return false;
                      }
                      return true;
                    })
                    .map((server) => {
                      const hasExistingDiscount = !!(
                        server.discount_percent && server.discount_percent > 0
                      );
                      const promoServer = applyPromoDiscount(
                        server.price_kopeks,
                        hasExistingDiscount,
                      );

                      return (
                        <button
                          key={server.uuid}
                          onClick={() => toggleServer(server.uuid)}
                          disabled={!server.is_available}
                          className={`relative rounded-xl border p-4 text-left transition-all ${
                            selectedServers.includes(server.uuid)
                              ? 'border-accent-500 bg-accent-500/10'
                              : server.is_available
                                ? 'border-dark-700/50 bg-dark-800/50 hover:border-dark-600'
                                : 'cursor-not-allowed border-dark-800/30 bg-dark-900/30 opacity-50'
                          }`}
                        >
                          {(() => {
                            const serverDisplayDiscount = hasExistingDiscount
                              ? server.discount_percent
                              : promoServer.percent;
                            return serverDisplayDiscount && serverDisplayDiscount > 0 ? (
                              <div
                                className={`absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 text-xs font-medium text-white shadow-sm ${
                                  hasExistingDiscount ? 'bg-success-500' : 'bg-orange-500'
                                }`}
                              >
                                -{serverDisplayDiscount}%
                              </div>
                            ) : null;
                          })()}
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 ${
                                selectedServers.includes(server.uuid)
                                  ? 'border-accent-500 bg-accent-500'
                                  : 'border-dark-600'
                              }`}
                            >
                              {selectedServers.includes(server.uuid) && <CheckIcon />}
                            </div>
                            <div>
                              <div className="font-medium text-dark-100">{server.name}</div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-sm text-accent-400">
                                  {formatPrice(promoServer.price)}
                                  {t('subscription.perMonth')}
                                </span>
                                {(() => {
                                  const serverOriginal = hasExistingDiscount
                                    ? server.original_price_kopeks
                                    : promoServer.original;
                                  return serverOriginal && serverOriginal > promoServer.price ? (
                                    <span className="text-xs text-dark-500 line-through">
                                      {formatPrice(serverOriginal)}
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}

              {/* Step: Device Selection */}
              {currentStep === 'devices' && selectedPeriod && (
                <div className="flex flex-col items-center py-8">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() =>
                        setSelectedDevices(
                          Math.max(selectedPeriod.devices.min, selectedDevices - 1),
                        )
                      }
                      disabled={selectedDevices <= selectedPeriod.devices.min}
                      className="btn-secondary flex h-14 w-14 items-center justify-center !p-0 text-2xl"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <div className="text-5xl font-bold text-dark-100">{selectedDevices}</div>
                      <div className="mt-2 text-dark-500">{t('subscription.devices')}</div>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedDevices(
                          Math.min(selectedPeriod.devices.max, selectedDevices + 1),
                        )
                      }
                      disabled={selectedDevices >= selectedPeriod.devices.max}
                      className="btn-secondary flex h-14 w-14 items-center justify-center !p-0 text-2xl"
                    >
                      +
                    </button>
                  </div>
                  <div className="mt-4 space-y-1 text-center text-sm text-dark-500">
                    <div className="text-accent-400">
                      {t('subscription.devicesFree', { count: selectedPeriod.devices.min })}
                    </div>
                    {selectedPeriod.devices.max > selectedPeriod.devices.min && (
                      <div>
                        {formatPrice(selectedPeriod.devices.price_per_device_kopeks)}{' '}
                        {t('subscription.perExtraDevice')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step: Confirm */}
              {currentStep === 'confirm' && (
                <div>
                  {previewLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
                    </div>
                  ) : preview ? (
                    <div className="space-y-4 rounded-xl bg-dark-800/50 p-5">
                      {/* Active promo discount banner */}
                      {activeDiscount?.is_active && activeDiscount.discount_percent && (
                        <div className="flex items-center justify-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
                          <svg
                            className="h-4 w-4 text-orange-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                            />
                          </svg>
                          <span className="text-sm font-medium text-orange-400">
                            {t('promo.discountApplied')} -{activeDiscount.discount_percent}%
                          </span>
                        </div>
                      )}

                      {preview.breakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-dark-300">
                          <span>{item.label}</span>
                          <span>{item.value}</span>
                        </div>
                      ))}

                      {(() => {
                        // Apply promo discount if not already applied by server
                        const hasServerDiscount = !!preview.original_price_kopeks;
                        const promoTotal = applyPromoDiscount(
                          preview.total_price_kopeks,
                          hasServerDiscount,
                        );
                        const displayTotal = promoTotal.price;
                        const displayOriginal = hasServerDiscount
                          ? preview.original_price_kopeks
                          : promoTotal.original;

                        return (
                          <div className="flex items-center justify-between border-t border-dark-700/50 pt-4">
                            <span className="text-lg font-semibold text-dark-100">
                              {t('subscription.total')}
                            </span>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-accent-400">
                                {formatPrice(displayTotal)}
                              </div>
                              {displayOriginal && (
                                <div className="text-sm text-dark-500 line-through">
                                  {formatPrice(displayOriginal)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {preview.discount_label && (
                        <div className="text-center text-sm text-success-400">
                          {preview.discount_label}
                        </div>
                      )}

                      {!preview.can_purchase &&
                        (preview.missing_amount_kopeks > 0 ? (
                          <InsufficientBalancePrompt
                            missingAmountKopeks={preview.missing_amount_kopeks}
                            compact
                          />
                        ) : preview.status_message ? (
                          <div className="rounded-lg bg-error-500/10 px-4 py-3 text-center text-sm text-error-400">
                            {preview.status_message}
                          </div>
                        ) : null)}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 border-t border-dark-800/50 pt-4">
                {!isFirstStep && (
                  <button onClick={goToPrevStep} className="btn-secondary flex-1">
                    {t('common.back')}
                  </button>
                )}

                {isFirstStep && (
                  <button onClick={resetPurchase} className="btn-secondary">
                    {t('common.cancel')}
                  </button>
                )}

                {!isLastStep ? (
                  <button
                    onClick={goToNextStep}
                    disabled={!selectedPeriod}
                    className="btn-primary flex-1"
                  >
                    {t('common.next')}
                  </button>
                ) : (
                  <button
                    onClick={() => purchaseMutation.mutate()}
                    disabled={
                      purchaseMutation.isPending || previewLoading || !preview?.can_purchase
                    }
                    className="btn-primary flex-1"
                  >
                    {purchaseMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        {t('common.loading')}
                      </span>
                    ) : (
                      t('subscription.purchase')
                    )}
                  </button>
                )}
              </div>

              {purchaseMutation.isError && (
                <div className="text-center text-sm text-error-400">
                  {getErrorMessage(purchaseMutation.error)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
