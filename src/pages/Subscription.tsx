import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { AxiosError } from 'axios';
import { subscriptionApi } from '../api/subscription';
import { promoApi } from '../api/promo';
import TrafficProgressBar from '../components/dashboard/TrafficProgressBar';
import { getTrafficZone } from '../utils/trafficZone';
import { formatTraffic } from '../utils/formatTraffic';
import { getGlassColors } from '../utils/glassTheme';
import { useTheme } from '../hooks/useTheme';
import { HoverBorderGradient } from '../components/ui/hover-border-gradient';
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
  const { isDark } = useTheme();
  const g = getGlassColors(isDark);
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
        (() => {
          const usedPercent =
            trafficData?.traffic_used_percent ?? subscription.traffic_used_percent;
          const usedGb = trafficData?.traffic_used_gb ?? subscription.traffic_used_gb;
          const isUnlimited =
            (trafficData?.is_unlimited ?? false) || subscription.traffic_limit_gb === 0;
          const zone = getTrafficZone(usedPercent);
          const connectedDevices = devicesData?.total ?? 0;
          const formattedDate = new Date(subscription.end_date).toLocaleDateString();
          const daysLeft = subscription.days_left;

          return (
            <div
              className="relative overflow-hidden rounded-3xl backdrop-blur-xl"
              style={{
                background: g.cardBg,
                border: subscription.is_trial
                  ? '1px solid rgba(62,219,176,0.15)'
                  : `1px solid ${g.cardBorder}`,
                boxShadow: g.shadow,
                padding: '28px 28px 24px',
              }}
            >
              {/* Trial shimmer border */}
              {subscription.is_trial && (
                <div
                  className="pointer-events-none absolute inset-[-1px] animate-trial-glow rounded-3xl"
                  aria-hidden="true"
                />
              )}

              {/* Background glow */}
              <div
                className="pointer-events-none absolute"
                style={{
                  top: -60,
                  right: -60,
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${zone.mainHex}${g.glowAlpha} 0%, transparent 70%)`,
                  transition: 'background 0.8s ease',
                }}
                aria-hidden="true"
              />

              {/* ─── Header ─── */}
              <div className="mb-6 flex items-start justify-between">
                <div>
                  {/* Zone indicator */}
                  <div className="mb-1 flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{
                        background: zone.mainHex,
                        boxShadow: `0 0 8px ${zone.mainHex}80`,
                        transition: 'all 0.6s ease',
                      }}
                      aria-hidden="true"
                    />
                    <span
                      className="font-mono text-[11px] font-semibold uppercase tracking-widest"
                      style={{ color: zone.mainHex, transition: 'color 0.6s ease' }}
                    >
                      {isUnlimited ? t('dashboard.unlimited') : t(zone.labelKey)}
                    </span>
                    {subscription.is_trial && (
                      <span
                        className="inline-flex animate-trial-glow items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(62,219,176,0.15), rgba(62,219,176,0.06))',
                          border: '1px solid rgba(62,219,176,0.2)',
                          color: '#3EDBB0',
                        }}
                      >
                        {t('subscription.trialStatus')}
                      </span>
                    )}
                  </div>

                  {/* Plan name */}
                  <h2 className="text-lg font-bold tracking-tight text-dark-50">
                    {subscription.tariff_name || t('subscription.currentPlan')}
                  </h2>
                </div>

                {/* Status badge */}
                <span
                  className="rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    background: subscription.is_active
                      ? `${zone.mainHex}15`
                      : 'rgba(255,59,92,0.12)',
                    border: subscription.is_active
                      ? `1px solid ${zone.mainHex}30`
                      : '1px solid rgba(255,59,92,0.25)',
                    color: subscription.is_active ? zone.mainHex : '#FF3B5C',
                  }}
                >
                  {subscription.is_trial
                    ? t('subscription.trialStatus')
                    : subscription.is_active
                      ? t('subscription.active')
                      : t('subscription.expired')}
                </span>
              </div>

              {/* ─── Trial Info Banner ─── */}
              {subscription.is_trial && subscription.is_active && (
                <div
                  className="mb-6 rounded-[14px] p-4"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(62,219,176,0.08), rgba(62,219,176,0.03))',
                    border: '1px solid rgba(62,219,176,0.12)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
                      style={{ background: 'rgba(62,219,176,0.12)' }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#3EDBB0"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ color: '#3EDBB0' }}>
                        {t('subscription.trialInfo.title')}
                      </div>
                      <div className="mt-1 text-[12px] text-dark-50/40">
                        {t('subscription.trialInfo.description')}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-mono text-[12px] font-semibold"
                            style={{ color: '#3EDBB0' }}
                          >
                            {subscription.days_left > 0
                              ? t('subscription.days', { count: subscription.days_left })
                              : `${subscription.hours_left}${t('subscription.hours')} ${subscription.minutes_left}${t('subscription.minutes')}`}
                          </span>
                          <span className="text-[11px] text-dark-50/30">
                            {t('subscription.trialInfo.remaining')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-mono text-[12px] font-semibold"
                            style={{ color: '#3EDBB0' }}
                          >
                            {subscription.traffic_limit_gb || '∞'} {t('common.units.gb')}
                          </span>
                          <span className="text-[11px] text-dark-50/30">
                            {t('subscription.traffic')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-mono text-[12px] font-semibold"
                            style={{ color: '#3EDBB0' }}
                          >
                            {subscription.device_limit}
                          </span>
                          <span className="text-[11px] text-dark-50/30">
                            {t('subscription.devices')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Traffic Progress ─── */}
              <div className="mb-6">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-dark-50/40">
                    {t('subscription.traffic')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-dark-50/30">
                      {isUnlimited
                        ? formatTraffic(usedGb)
                        : `${formatTraffic(usedGb)} / ${formatTraffic(subscription.traffic_limit_gb)}`}
                    </span>
                    <button
                      onClick={() => refreshTrafficMutation.mutate()}
                      disabled={refreshTrafficMutation.isPending || trafficRefreshCooldown > 0}
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-dark-50/30 transition-colors hover:bg-dark-50/[0.05] hover:text-dark-50/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg
                        className={`h-3 w-3 ${refreshTrafficMutation.isPending ? 'animate-spin' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                        />
                      </svg>
                      {trafficRefreshCooldown > 0
                        ? `${trafficRefreshCooldown}s`
                        : t('common.refresh')}
                    </button>
                  </div>
                </div>
                {subscription.traffic_reset_mode &&
                  subscription.traffic_reset_mode !== 'NO_RESET' && (
                    <div className="mb-2 text-[10px] text-dark-50/25">
                      {t(`subscription.trafficReset.${subscription.traffic_reset_mode}`)}
                    </div>
                  )}
                <TrafficProgressBar
                  usedGb={usedGb}
                  limitGb={subscription.traffic_limit_gb}
                  percent={usedPercent}
                  isUnlimited={isUnlimited}
                  compact
                />
              </div>

              {/* ─── Connect Device Button ─── */}
              {subscription.subscription_url && (
                <HoverBorderGradient
                  as="button"
                  accentColor={zone.mainHex}
                  onClick={() => navigate('/connection')}
                  className="mb-5 flex w-full items-center gap-3.5 rounded-[14px] p-3.5 text-left transition-shadow duration-300"
                  style={{ fontFamily: 'inherit' }}
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] transition-colors duration-500"
                    style={{ background: `${zone.mainHex}12` }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={zone.mainHex}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <path d="M12 17v4M8 21h8" />
                      <path d="M12 8v4M10 10h4" opacity="0.7" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold tracking-tight text-dark-50">
                      {t('dashboard.connectDevice')}
                    </div>
                    <div className="mt-0.5 text-[11px] text-dark-50/30">
                      {t('dashboard.devicesOfMax', {
                        used: connectedDevices,
                        max: subscription.device_limit,
                      })}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-1.5" aria-hidden="true">
                    {Array.from({ length: subscription.device_limit }, (_, i) => (
                      <div
                        key={i}
                        className="h-[7px] w-[7px] rounded-full transition-all duration-300"
                        style={{
                          background: i < connectedDevices ? zone.mainHex : g.textGhost,
                          boxShadow: i < connectedDevices ? `0 0 6px ${zone.mainHex}50` : 'none',
                        }}
                      />
                    ))}
                  </div>
                </HoverBorderGradient>
              )}

              {/* ─── Subscription URL ─── */}
              {subscription.subscription_url && !subscription.hide_subscription_link && (
                <div className="mb-5 flex gap-2">
                  <code
                    className="scrollbar-hide flex-1 overflow-x-auto break-all rounded-[10px] px-3 py-2 font-mono text-[11px] text-dark-50/30"
                    style={{
                      background: g.codeBg,
                      border: `1px solid ${g.codeBorder}`,
                    }}
                  >
                    {subscription.subscription_url}
                  </code>
                  <button
                    onClick={copyUrl}
                    className="flex h-auto items-center rounded-[10px] px-3 transition-all duration-300"
                    style={{
                      background: copied ? 'rgba(62,219,176,0.12)' : g.innerBorder,
                      border: copied ? '1px solid rgba(62,219,176,0.2)' : `1px solid ${g.trackBg}`,
                      color: copied ? '#3EDBB0' : g.textMuted,
                    }}
                    title={t('subscription.copyLink')}
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </div>
              )}

              {/* ─── Stats Row ─── */}
              <div className="mb-5 grid grid-cols-2 gap-2.5">
                {/* Days left */}
                <div
                  className="rounded-[14px] p-3.5"
                  style={{
                    background: daysLeft <= 3 ? 'rgba(255,184,0,0.06)' : g.innerBg,
                    border:
                      daysLeft <= 3
                        ? '1px solid rgba(255,184,0,0.15)'
                        : `1px solid ${g.innerBorder}`,
                  }}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-dark-50/35">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-[7px]"
                      style={{
                        background: daysLeft <= 3 ? 'rgba(255,184,0,0.1)' : g.hoverBg,
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={daysLeft <= 3 ? '#FFB800' : g.textSecondary}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                    </div>
                    {t('dashboard.remaining')}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-[22px] font-bold tracking-tight"
                      style={{ color: daysLeft <= 3 ? '#FFB800' : g.text }}
                    >
                      {daysLeft > 0
                        ? daysLeft
                        : subscription.hours_left > 0
                          ? `${subscription.hours_left}h`
                          : `${subscription.minutes_left}m`}
                    </span>
                    <span className="text-xs font-medium text-dark-50/25">
                      {daysLeft > 0 ? t('subscription.daysShort') : ''}
                    </span>
                  </div>
                </div>

                {/* Devices */}
                <div
                  className="rounded-[14px] p-3.5"
                  style={{
                    background: g.innerBg,
                    border: `1px solid ${g.innerBorder}`,
                  }}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-dark-50/35">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-[7px]"
                      style={{ background: `${zone.mainHex}12` }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={zone.mainHex}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M12 17v4M8 21h8" />
                      </svg>
                    </div>
                    {t('subscription.devices')}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[22px] font-bold tracking-tight text-dark-50">
                      {connectedDevices}
                    </span>
                    <span className="text-xs font-medium text-dark-50/25">
                      / {subscription.device_limit}
                    </span>
                  </div>
                </div>

                {/* Expires */}
                <div
                  className="rounded-[14px] p-3.5"
                  style={{
                    background: g.innerBg,
                    border: `1px solid ${g.innerBorder}`,
                  }}
                >
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-dark-50/35">
                    {t('subscription.expiresAt')}
                  </div>
                  <div className="text-sm font-semibold tracking-tight text-dark-50">
                    {formattedDate}
                  </div>
                </div>

                {/* Traffic */}
                <div
                  className="rounded-[14px] p-3.5"
                  style={{
                    background: `linear-gradient(135deg, ${zone.mainHex}08, ${zone.mainHex}03)`,
                    border: `1px solid ${zone.mainHex}12`,
                  }}
                >
                  <div
                    className="mb-1 text-[10px] font-semibold uppercase tracking-wider opacity-70"
                    style={{ color: zone.mainHex }}
                  >
                    {t('subscription.traffic')}
                  </div>
                  <div className="text-sm font-semibold tracking-tight text-dark-50">
                    {isUnlimited ? '∞' : `${usedPercent.toFixed(0)}%`}
                  </div>
                </div>
              </div>

              {/* ─── Locations ─── */}
              {subscription.servers && subscription.servers.length > 0 && (
                <div className="mb-5">
                  <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-dark-50/35">
                    {t('subscription.locationsLabel')}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {subscription.servers.map((server) => (
                      <span
                        key={server.uuid}
                        className="inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[11px] font-medium text-dark-50/50"
                        style={{
                          background: g.innerBorder,
                          border: `1px solid ${g.trackBg}`,
                        }}
                      >
                        {server.country_code && (
                          <span className="text-xs">{getFlagEmoji(server.country_code)}</span>
                        )}
                        {server.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── Purchased Traffic Packages ─── */}
              {subscription.traffic_purchases && subscription.traffic_purchases.length > 0 && (
                <div className="mb-5">
                  <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-dark-50/35">
                    {t('subscription.purchasedTraffic')}
                  </div>
                  <div className="space-y-2">
                    {subscription.traffic_purchases.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="rounded-[12px] p-3"
                        style={{
                          background: g.innerBg,
                          border: `1px solid ${g.innerBorder}`,
                        }}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="flex h-7 w-7 items-center justify-center rounded-[8px]"
                              style={{ background: `${zone.mainHex}12` }}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={zone.mainHex}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <span className="text-sm font-semibold text-dark-50">
                              {purchase.traffic_gb} {t('common.units.gb')}
                            </span>
                          </div>
                          <div className="text-right">
                            <div
                              className="text-[11px] font-medium"
                              style={{
                                color: purchase.days_remaining === 0 ? '#FF6B35' : g.textSecondary,
                              }}
                            >
                              {purchase.days_remaining === 0
                                ? t('subscription.expired')
                                : t('subscription.days', { count: purchase.days_remaining })}
                            </div>
                            <div className="mt-0.5 font-mono text-[9px] text-dark-50/20">
                              {t('subscription.trafficResetAt')}:{' '}
                              {new Date(purchase.expires_at).toLocaleDateString(undefined, {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>
                        <div
                          className="relative h-1.5 overflow-hidden rounded-full"
                          style={{ background: g.trackBg }}
                        >
                          <div
                            className="absolute inset-0 rounded-full transition-all duration-500"
                            style={{
                              width: `${purchase.progress_percent}%`,
                              background: `linear-gradient(90deg, ${zone.mainHex}, ${zone.mainHex}80)`,
                            }}
                          />
                        </div>
                        <div className="mt-1 flex justify-between font-mono text-[9px] text-dark-50/20">
                          <span>{new Date(purchase.created_at).toLocaleDateString()}</span>
                          <span>{new Date(purchase.expires_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── Autopay Toggle ─── */}
              {!subscription.is_trial && !subscription.is_daily && (
                <div
                  className="flex items-center justify-between rounded-[14px] p-3.5"
                  style={{
                    background: g.innerBg,
                    border: `1px solid ${g.innerBorder}`,
                  }}
                >
                  <div>
                    <div className="text-sm font-semibold text-dark-50">
                      {t('subscription.autoRenewal')}
                    </div>
                    <div className="mt-0.5 text-[11px] text-dark-50/30">
                      {t('subscription.daysBeforeExpiry', {
                        count: subscription.autopay_days_before,
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => autopayMutation.mutate(!subscription.autopay_enabled)}
                    disabled={autopayMutation.isPending}
                    className="relative h-7 w-[52px] rounded-full transition-all duration-300"
                    style={{
                      background: subscription.autopay_enabled ? zone.mainHex : g.textGhost,
                    }}
                  >
                    <span
                      className="absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white transition-all duration-300"
                      style={{
                        left: subscription.autopay_enabled ? '26px' : '3px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}
                    />
                  </button>
                </div>
              )}
            </div>
          );
        })()
      ) : (
        <div
          className="relative overflow-hidden rounded-3xl py-12 text-center"
          style={{
            background: g.cardBg,
            border: `1px solid ${g.cardBorder}`,
            boxShadow: g.shadow,
          }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: g.hoverBg }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke={g.textFaint}
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
          </div>
          <div className="text-sm text-dark-50/30">{t('subscription.noSubscription')}</div>
        </div>
      )}

      {/* Daily Subscription Pause */}
      {subscription && subscription.is_daily && !subscription.is_trial && (
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: g.cardBg,
            border: `1px solid ${g.cardBorder}`,
            boxShadow: g.shadow,
            padding: '24px 28px',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-dark-50">
                {t('subscription.pause.title')}
              </h2>
              <div className="mt-1 text-[12px] text-dark-50/35">
                {subscription.is_daily_paused
                  ? t('subscription.pause.paused')
                  : t('subscription.pause.active')}
              </div>
            </div>
            <button
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
              className="rounded-[10px] px-4 py-2 text-sm font-semibold transition-all duration-300"
              style={{
                background: subscription.is_daily_paused
                  ? 'rgba(62,219,176,0.12)'
                  : 'rgba(255,184,0,0.12)',
                border: subscription.is_daily_paused
                  ? '1px solid rgba(62,219,176,0.2)'
                  : '1px solid rgba(255,184,0,0.2)',
                color: subscription.is_daily_paused ? '#3EDBB0' : '#FFB800',
              }}
            >
              {pauseMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
                <div
                  className="mt-4 rounded-[10px] p-3 text-center text-sm"
                  style={{
                    background: 'rgba(255,59,92,0.08)',
                    border: '1px solid rgba(255,59,92,0.15)',
                    color: '#FF3B5C',
                  }}
                >
                  {getErrorMessage(pauseMutation.error)}
                </div>
              );
            })()}

          {/* Paused info or Next charge progress bar */}
          {subscription.is_daily_paused ? (
            <div
              className="mt-4 rounded-[12px] p-4"
              style={{
                background: 'rgba(255,184,0,0.06)',
                border: '1px solid rgba(255,184,0,0.12)',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-lg" style={{ color: '#FFB800' }}>
                  ⏸️
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#FFB800' }}>
                    {t('subscription.pause.pausedInfo')}
                  </div>
                  <div className="mt-1 text-[12px] text-dark-50/35">
                    {t('subscription.pause.pausedDescription')}{' '}
                    {new Date(subscription.end_date).toLocaleDateString()} (
                    {t('subscription.pause.days', { count: subscription.days_left })})
                  </div>
                </div>
              </div>
            </div>
          ) : (
            subscription.next_daily_charge_at &&
            (() => {
              const now = new Date();
              const nextChargeStr = subscription.next_daily_charge_at.endsWith('Z')
                ? subscription.next_daily_charge_at
                : subscription.next_daily_charge_at + 'Z';
              const nextCharge = new Date(nextChargeStr);
              const totalMs = 24 * 60 * 60 * 1000;
              const remainingMs = Math.max(0, nextCharge.getTime() - now.getTime());
              const elapsedMs = totalMs - remainingMs;
              const progress = Math.min(100, (elapsedMs / totalMs) * 100);

              const hours = Math.floor(remainingMs / (1000 * 60 * 60));
              const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

              return (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-dark-50/35">
                      {t('subscription.pause.nextCharge')}
                    </span>
                    <span className="font-mono text-[12px] font-semibold text-dark-50">
                      {hours > 0
                        ? `${hours}${t('subscription.pause.hours')} ${minutes}${t('subscription.pause.minutes')}`
                        : `${minutes}${t('subscription.pause.minutes')}`}
                    </span>
                  </div>
                  <div
                    className="relative h-2 overflow-hidden rounded-full"
                    style={{ background: g.trackBg }}
                  >
                    <div
                      className="absolute inset-0 rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, #00E5A0, #00C987)',
                      }}
                    />
                  </div>
                  {subscription.daily_price_kopeks && (
                    <div className="mt-2 text-center text-[11px] text-dark-50/25">
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
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: g.cardBg,
            border: `1px solid ${g.cardBorder}`,
            boxShadow: g.shadow,
            padding: '24px 28px',
          }}
        >
          <h2 className="mb-4 text-base font-bold tracking-tight text-dark-50">
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
        <div
          ref={tariffsCardRef}
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: g.cardBg,
            border: `1px solid ${g.cardBorder}`,
            boxShadow: g.shadow,
            padding: '24px 28px',
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-dark-50">
              {subscription?.is_daily && !subscription?.is_trial
                ? t('subscription.switchTariff.title')
                : subscription && !subscription.is_trial
                  ? t('subscription.extend')
                  : t('subscription.getSubscription')}
            </h2>
          </div>

          {/* Trial upgrade prompt */}
          {subscription?.is_trial && (
            <div
              className="mb-6 rounded-[14px] p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(255,184,0,0.08), rgba(62,219,176,0.06))',
                border: '1px solid rgba(255,184,0,0.15)',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
                  style={{ background: 'rgba(255,184,0,0.12)' }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FFB800"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#FFB800' }}>
                    {t('subscription.trialUpgrade.title')}
                  </div>
                  <div className="mt-1 text-[12px] text-dark-50/40">
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
              <div
                className="mb-6 rounded-[14px] p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,59,92,0.08), rgba(255,184,0,0.06))',
                  border: '1px solid rgba(255,59,92,0.15)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
                    style={{ background: 'rgba(255,59,92,0.12)' }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FF3B5C"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#FF3B5C' }}>
                      {t('subscription.expiredBanner.title')}
                    </div>
                    <div className="mt-1 text-[12px] text-dark-50/40">
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
        <div
          ref={tariffsCardRef}
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: g.cardBg,
            border: `1px solid ${g.cardBorder}`,
            boxShadow: g.shadow,
            padding: '24px 28px',
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-dark-50">
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
