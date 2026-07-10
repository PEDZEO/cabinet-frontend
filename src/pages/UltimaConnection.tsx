import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { subscriptionApi } from '@/api/subscription';
import { UltimaDesktopConnection } from '@/components/ultima/desktop/UltimaDesktopConnection';
import { useHaptic } from '@/platform';
import { useAuthStore } from '@/store/auth';
import type {
  AppConfig,
  LocalizedText,
  RemnawaveAppClient,
  RemnawaveButtonClient,
  RemnawavePlatformData,
} from '@/types';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  ULTIMA_CONNECTION_PENDING_STEP2_KEY,
  ULTIMA_CONNECTION_PENDING_STEP3_KEY,
  readUltimaConnectionCompleted,
  readUltimaConnectionReminderHidden,
  readUltimaConnectionStep,
  writeUltimaConnectionCompleted,
  writeUltimaConnectionReminderHidden,
  writeUltimaConnectionStep,
} from '@/features/ultima/connectionFlow';
import { trackAnalyticsEvent } from '@/utils/analyticsEvents';

type Step = 1 | 2 | 3;

type UltimaConnectionProps = {
  appConfig: AppConfig;
  onOpenDeepLink: (url: string) => void;
  onGoBack: () => void;
  onRefreshAppConfig?: () => void;
};

type InstallOption = {
  key: string;
  label: string;
  url: string;
  kind: 'apk' | 'play' | 'appstore' | 'store' | 'download';
};

const PLATFORM_ORDER = ['ios', 'android', 'windows', 'macos', 'linux', 'androidTV', 'appleTV'];

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-[74px] w-[74px] text-white/90">
    <path
      d="M12 4.5v8m0 0 3-3m-3 3-3-3M6 15.5v1A2.5 2.5 0 0 0 8.5 19h7a2.5 2.5 0 0 0 2.5-2.5v-1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-[74px] w-[74px] text-white/90">
    <path
      d="M12 5.5v13m6.5-6.5h-13"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-[74px] w-[74px] text-white/90">
    <path
      d="m6.7 12.2 3.6 3.6 7.1-7.1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StepDoneIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 text-emerald-100">
    <path
      d="m4.8 10.2 3.1 3.1 7.3-7.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const getLocalizedText = (text: LocalizedText | undefined, lang: string): string => {
  if (!text) return '';
  return text[lang] || text.en || text.ru || Object.values(text)[0] || '';
};

const detectPlatformKey = (): string | null => {
  if (typeof window === 'undefined' || !navigator?.userAgent) return null;
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return /tv|television/.test(ua) ? 'androidTV' : 'android';
  if (/macintosh|mac os x/.test(ua)) return 'macos';
  if (/windows/.test(ua)) return 'windows';
  if (/linux/.test(ua)) return 'linux';
  return null;
};

const resolveTemplateUrl = (
  value: string,
  subscriptionUrl: string | null,
  subscriptionCryptoLink?: string | null,
): string => {
  if (!value) return value;
  return value
    .replace(/\{\{\s*subscriptionUrl\s*\}\}/gi, subscriptionUrl ?? '')
    .replace(/\{\{\s*SUBSCRIPTION_LINK\s*\}\}/gi, subscriptionUrl ?? '')
    .replace(/\{\{\s*HAPP_CRYPT3_LINK\s*\}\}/gi, subscriptionCryptoLink ?? '')
    .replace(/\{\{\s*HAPP_CRYPT4_LINK\s*\}\}/gi, subscriptionCryptoLink ?? '');
};

const getPlatformDisplayName = (appConfig: AppConfig, key: string, language: string): string => {
  const platform = appConfig.platforms?.[key] as RemnawavePlatformData | undefined;
  const label = getLocalizedText(platform?.displayName, language);
  if (label) return label;

  const configuredName = getLocalizedText(appConfig.platformNames?.[key], language);
  if (configuredName) return configuredName;

  const fallback: Record<string, string> = {
    ios: 'iOS',
    android: 'Android',
    windows: 'Windows',
    macos: 'macOS',
    linux: 'Linux',
    androidTV: 'Android TV',
    appleTV: 'Apple TV',
  };
  return fallback[key] || key;
};

const getAvailablePlatformKeys = (appConfig: AppConfig): string[] => {
  const configuredKeys = Object.keys(appConfig.platforms ?? {});
  const sorted = PLATFORM_ORDER.filter((key) => {
    const platform = appConfig.platforms?.[key];
    return platform?.apps?.length;
  });
  const extra = configuredKeys.filter(
    (key) => !PLATFORM_ORDER.includes(key) && appConfig.platforms?.[key]?.apps?.length,
  );
  return [...sorted, ...extra];
};

const getAppKey = (app: RemnawaveAppClient, index: number): string => `${app.name}:${index}`;

const getButtonUrl = (button: RemnawaveButtonClient): string | null =>
  button.resolvedUrl || button.url || button.link || button.buttonLink || null;

const getAppButtons = (app: RemnawaveAppClient | null | undefined): RemnawaveButtonClient[] => {
  if (!app) return [];
  return [...(app.buttons ?? []), ...(app.blocks ?? []).flatMap((block) => block.buttons ?? [])];
};

const isSubscriptionButton = (button: RemnawaveButtonClient, label: string): boolean =>
  button.type === 'subscriptionLink' ||
  button.type === 'copyButton' ||
  label.includes('subscription') ||
  label.includes('подпис');

const classifyInstallKind = (label: string, url: string): InstallOption['kind'] => {
  const normalizedUrl = url.toLowerCase();
  if (label.includes('apk') || normalizedUrl.includes('.apk')) return 'apk';
  if (
    normalizedUrl.includes('play.google') ||
    label.includes('google play') ||
    label.includes('play market')
  ) {
    return 'play';
  }
  if (normalizedUrl.includes('apps.apple') || label.includes('app store')) return 'appstore';
  if (label.includes('store') || label.includes('market')) return 'store';
  return 'download';
};

const isInstallButton = (button: RemnawaveButtonClient, label: string, url: string): boolean => {
  if (button.type === 'subscriptionLink' || button.type === 'copyButton') return false;
  if (isSubscriptionButton(button, label)) return false;

  const normalizedUrl = url.toLowerCase();
  if (normalizedUrl.includes('.apk')) return true;
  if (normalizedUrl.includes('play.google') || normalizedUrl.includes('apps.apple')) return true;
  if (normalizedUrl.includes('github.com') && normalizedUrl.includes('release')) return true;

  return (
    label.includes('install') ||
    label.includes('download') ||
    label.includes('store') ||
    label.includes('market') ||
    label.includes('apk') ||
    label.includes('скач') ||
    label.includes('установ') ||
    label.includes('загруз')
  );
};

const labelForDirectInstallUrl = (field: string, url: string, language: string): string => {
  const normalized = url.toLowerCase();
  const isRu = language.toLowerCase().startsWith('ru');
  if (field.toLowerCase().includes('apk') || normalized.includes('.apk')) return 'APK';
  if (normalized.includes('play.google')) return 'Google Play';
  if (normalized.includes('apps.apple')) return 'App Store';
  return isRu ? 'Скачать напрямую' : 'Direct download';
};

const collectInstallOptions = (
  app: RemnawaveAppClient | null,
  appConfig: AppConfig,
  language: string,
): InstallOption[] => {
  if (!app) return [];

  const seen = new Set<string>();
  const options: InstallOption[] = [];
  const addOption = (label: string, rawUrl: string | null, key: string) => {
    if (!rawUrl) return;
    const resolved = resolveTemplateUrl(
      rawUrl,
      appConfig.subscriptionUrl,
      appConfig.subscriptionCryptoLink,
    );
    if (!resolved || resolved.includes('{{') || seen.has(resolved)) return;
    seen.add(resolved);
    const finalLabel = label.trim() || labelForDirectInstallUrl(key, resolved, language);
    options.push({
      key,
      label: finalLabel,
      url: resolved,
      kind: classifyInstallKind(finalLabel.toLowerCase(), resolved),
    });
  };

  getAppButtons(app).forEach((button, index) => {
    const label = getLocalizedText(button.text, language);
    const rawUrl = getButtonUrl(button);
    const lowerLabel = label.toLowerCase();
    if (rawUrl && isInstallButton(button, lowerLabel, rawUrl)) {
      addOption(label, rawUrl, `button-${index}`);
    }
  });

  const appUrls = app as RemnawaveAppClient & Record<string, unknown>;
  ['apkUrl', 'apkDownloadUrl', 'directDownloadUrl', 'downloadUrl', 'storeUrl'].forEach((field) => {
    const value = appUrls[field];
    if (typeof value === 'string') {
      addOption(labelForDirectInstallUrl(field, value, language), value, `app-${field}`);
    }
  });

  return options.slice(0, 6);
};

const findSetupUrls = (
  appConfig: AppConfig,
  language: string,
  app: RemnawaveAppClient | null,
): {
  installOptions: InstallOption[];
  installUrl: string | null;
  addSubscriptionUrl: string | null;
} => {
  if (!app) return { installOptions: [], installUrl: null, addSubscriptionUrl: null };

  const flatButtons = getAppButtons(app);
  const installOptions = collectInstallOptions(app, appConfig, language);
  let installUrl: string | null = null;
  let addSubscriptionUrl: string | null = app.deepLink ?? null;

  for (const button of flatButtons) {
    const localized = getLocalizedText(button.text, language).toLowerCase();
    const rawUrl = getButtonUrl(button);
    if (!rawUrl) continue;

    if (!addSubscriptionUrl && button.type === 'subscriptionLink') {
      addSubscriptionUrl = rawUrl;
    }

    if (
      !addSubscriptionUrl &&
      (localized.includes('подпис') || localized.includes('subscription'))
    ) {
      addSubscriptionUrl = rawUrl;
    }

    if (
      !installUrl &&
      (localized.includes('установ') ||
        localized.includes('download') ||
        localized.includes('play') ||
        localized.includes('store') ||
        localized.includes('apk'))
    ) {
      installUrl = rawUrl;
    }

    if (!installUrl && isInstallButton(button, localized, rawUrl)) {
      installUrl = rawUrl;
    }
  }

  const primaryInstall =
    installOptions.find((option) => option.kind === 'apk') ?? installOptions[0];
  const resolvedInstall = primaryInstall?.url
    ? primaryInstall.url
    : installUrl
      ? resolveTemplateUrl(installUrl, appConfig.subscriptionUrl, appConfig.subscriptionCryptoLink)
      : null;
  const resolvedAdd = addSubscriptionUrl
    ? resolveTemplateUrl(
        addSubscriptionUrl,
        appConfig.subscriptionUrl,
        appConfig.subscriptionCryptoLink,
      )
    : appConfig.subscriptionUrl;

  return { installOptions, installUrl: resolvedInstall, addSubscriptionUrl: resolvedAdd };
};

export function UltimaConnection({
  appConfig,
  onOpenDeepLink,
  onGoBack,
  onRefreshAppConfig,
}: UltimaConnectionProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const haptic = useHaptic();
  const user = useAuthStore((state) => state.user);
  const isDesktopViewport = useMediaQuery('(min-width: 1024px)');
  const detectedPlatform = useMemo(() => detectPlatformKey(), []);
  const [step, setStep] = useState<Step>(1);
  const [showInfo, setShowInfo] = useState(true);
  const [burst, setBurst] = useState(0);
  const [showReturnConfetti, setShowReturnConfetti] = useState(false);
  const [showFinishSuccess, setShowFinishSuccess] = useState(false);
  const [isReminderHidden, setIsReminderHidden] = useState(false);
  const [activePlatformKey, setActivePlatformKey] = useState<string | null>(null);
  const [selectedAppKey, setSelectedAppKey] = useState<string | null>(null);
  const [viewportHeight, setViewportHeight] = useState<number>(() =>
    typeof window === 'undefined' ? 820 : window.innerHeight,
  );
  const stepInitRef = useRef(false);
  const centerActionRef = useRef<HTMLDivElement | null>(null);
  const [successWaveOrigin, setSuccessWaveOrigin] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const availablePlatformKeys = useMemo(() => getAvailablePlatformKeys(appConfig), [appConfig]);

  useEffect(() => {
    const preferred =
      detectedPlatform && availablePlatformKeys.includes(detectedPlatform)
        ? detectedPlatform
        : (availablePlatformKeys[0] ?? null);
    setActivePlatformKey((current) =>
      current && availablePlatformKeys.includes(current) ? current : preferred,
    );
  }, [availablePlatformKeys, detectedPlatform]);

  const currentPlatformData = activePlatformKey
    ? (appConfig.platforms[activePlatformKey] as RemnawavePlatformData | undefined)
    : undefined;
  const currentPlatformApps = useMemo(
    () => currentPlatformData?.apps ?? [],
    [currentPlatformData?.apps],
  );

  useEffect(() => {
    if (!currentPlatformApps.length) {
      setSelectedAppKey(null);
      return;
    }
    setSelectedAppKey((current) => {
      if (current && currentPlatformApps.some((app, index) => getAppKey(app, index) === current)) {
        return current;
      }
      const featuredIndex = currentPlatformApps.findIndex((app) => app.featured);
      const index = featuredIndex >= 0 ? featuredIndex : 0;
      return getAppKey(currentPlatformApps[index]!, index);
    });
  }, [currentPlatformApps]);

  const selectedApp = useMemo(() => {
    if (!selectedAppKey)
      return currentPlatformApps.find((app) => app.featured) ?? currentPlatformApps[0] ?? null;
    return (
      currentPlatformApps.find((app, index) => getAppKey(app, index) === selectedAppKey) ??
      currentPlatformApps.find((app) => app.featured) ??
      currentPlatformApps[0] ??
      null
    );
  }, [currentPlatformApps, selectedAppKey]);

  const setupUrls = useMemo(
    () => findSetupUrls(appConfig, i18n.language || 'ru', selectedApp),
    [appConfig, i18n.language, selectedApp],
  );
  const { data: subscriptionResponse } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getSubscription,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });
  const subscription = subscriptionResponse?.subscription ?? null;
  const isActiveTrial = Boolean(
    subscription?.is_active && !subscription?.is_expired && subscription?.is_trial,
  );
  const canPermanentlyHideReminder = Boolean(
    subscription?.is_active && !subscription?.is_expired && !subscription?.is_trial,
  );

  useEffect(() => {
    const normalized = readUltimaConnectionStep(user?.id);
    const completed = readUltimaConnectionCompleted(user?.id);
    const hidden = readUltimaConnectionReminderHidden(user?.id);
    setStep(normalized);
    setIsReminderHidden(hidden);
    setShowInfo(normalized === 1 && !hidden && !completed);
  }, [user?.id]);

  useEffect(() => {
    const pendingStep2Key = `${ULTIMA_CONNECTION_PENDING_STEP2_KEY}:${user?.id ?? 'guest'}`;
    const pendingKey = `${ULTIMA_CONNECTION_PENDING_STEP3_KEY}:${user?.id ?? 'guest'}`;
    const pendingStep2GlobalKey = ULTIMA_CONNECTION_PENDING_STEP2_KEY;
    const pendingGlobalKey = ULTIMA_CONNECTION_PENDING_STEP3_KEY;

    const applyPendingReturn = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      try {
        const pending =
          localStorage.getItem(pendingKey) === '1' ||
          localStorage.getItem(pendingGlobalKey) === '1';
        const pendingStep2 =
          localStorage.getItem(pendingStep2Key) === '1' ||
          localStorage.getItem(pendingStep2GlobalKey) === '1';
        if (pending) {
          localStorage.removeItem(pendingKey);
          localStorage.removeItem(pendingGlobalKey);
          onRefreshAppConfig?.();
          setStep(3);
          window.setTimeout(() => {
            setShowReturnConfetti(true);
            setBurst((prev) => prev + 1);
          }, 180);
          window.setTimeout(() => setShowReturnConfetti(false), 2580);
          return;
        }
        if (pendingStep2) {
          localStorage.removeItem(pendingStep2Key);
          localStorage.removeItem(pendingStep2GlobalKey);
          onRefreshAppConfig?.();
          setStep(2);
          return;
        }
      } catch {
        // ignore localStorage errors
      }
    };

    applyPendingReturn();
    window.addEventListener('focus', applyPendingReturn);
    document.addEventListener('visibilitychange', applyPendingReturn);
    return () => {
      window.removeEventListener('focus', applyPendingReturn);
      document.removeEventListener('visibilitychange', applyPendingReturn);
    };
  }, [onRefreshAppConfig, user?.id]);

  useEffect(() => {
    writeUltimaConnectionStep(user?.id, step);
  }, [step, user?.id]);

  useEffect(() => {
    if (!canPermanentlyHideReminder && isReminderHidden) {
      writeUltimaConnectionReminderHidden(user?.id, false);
      setIsReminderHidden(false);
    }
  }, [canPermanentlyHideReminder, isReminderHidden, user?.id]);

  useEffect(() => {
    if (!stepInitRef.current) {
      stepInitRef.current = true;
      return;
    }
    haptic.impact('light');
  }, [haptic, step]);

  useEffect(() => {
    const syncViewport = () => setViewportHeight(window.innerHeight);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const isShortViewport = viewportHeight < 790;
  const isVeryShortViewport = viewportHeight < 720;

  const title =
    step === 1
      ? t('subscription.connection.stepInstallTitle', { defaultValue: 'Приложение' })
      : step === 2
        ? t('subscription.connection.stepSubscriptionTitle', { defaultValue: 'Подписка' })
        : t('subscription.connection.stepDoneTitle', { defaultValue: 'Готово!' });
  const isDoneStep = step === 3;

  const subtitle =
    step === 1
      ? t('subscription.connection.stepInstallDesc', {
          defaultValue: 'Установите приложение Happ и вернитесь к этому экрану',
        })
      : step === 2
        ? t('subscription.connection.stepSubscriptionDesc', {
            defaultValue: 'Добавьте подписку в приложении Happ с помощью кнопки ниже',
          })
        : t('subscription.connection.stepDoneDesc', {
            defaultValue: 'Нажмите на круглую кнопку включения VPN в приложении Happ',
          });
  const importantInfoDescription = isActiveTrial
    ? t('ultima.trialGuide.connectionInfoDesc', {
        defaultValue:
          'Пробный доступ уже активирован. После установки приложения вернитесь сюда и перейдите к следующему шагу, чтобы добавить подписку.',
      })
    : t('subscription.connection.importantInfoDesc', {
        defaultValue:
          'После установки приложения Happ, обязательно вернитесь на этот экран и нажмите «Следующий шаг», чтобы добавить конфигурацию в приложение.',
      });

  const icon = step === 1 ? <DownloadIcon /> : step === 2 ? <PlusIcon /> : <CheckIcon />;
  const isFinalStep = step === 3;
  const progressRatio = step === 1 ? 0.34 : step === 2 ? 0.67 : 1;
  const stepProgressPercent = step === 1 ? 0 : step === 2 ? 50 : 100;
  const ringSizes = isFinalStep
    ? isVeryShortViewport
      ? { outer: 248, middle: 188, inner: 136, progress: 164, center: 92, button: 82 }
      : isShortViewport
        ? { outer: 284, middle: 214, inner: 152, progress: 182, center: 102, button: 90 }
        : { outer: 320, middle: 238, inner: 168, progress: 198, center: 112, button: 98 }
    : isVeryShortViewport
      ? { outer: 286, middle: 218, inner: 156, progress: 186, center: 104, button: 92 }
      : isShortViewport
        ? { outer: 320, middle: 244, inner: 172, progress: 202, center: 114, button: 100 }
        : { outer: 360, middle: 270, inner: 188, progress: 220, center: 124, button: 110 };
  const ringRadius = 90;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressRatio);

  const openInstall = () => {
    if (setupUrls.installUrl) {
      onOpenDeepLink(setupUrls.installUrl);
    }
  };

  const startInstallUrlFlow = (url: string) => {
    writeUltimaConnectionCompleted(user?.id, false);
    trackAnalyticsEvent('ultima_connection_install_start', {
      platform: activePlatformKey,
      app: selectedApp?.name ?? null,
      step,
    });
    try {
      localStorage.setItem(`${ULTIMA_CONNECTION_PENDING_STEP2_KEY}:${user?.id ?? 'guest'}`, '1');
      localStorage.setItem(ULTIMA_CONNECTION_PENDING_STEP2_KEY, '1');
    } catch {
      // ignore localStorage errors
    }
    onOpenDeepLink(url);
  };

  const startInstallFlow = () => {
    if (setupUrls.installUrl) {
      startInstallUrlFlow(setupUrls.installUrl);
      return;
    }
    openInstall();
  };

  const openAddSubscription = () => {
    if (setupUrls.addSubscriptionUrl) {
      onOpenDeepLink(setupUrls.addSubscriptionUrl);
    }
  };

  const startAddSubscriptionFlow = () => {
    writeUltimaConnectionCompleted(user?.id, false);
    trackAnalyticsEvent('ultima_connection_add_subscription_start', {
      platform: activePlatformKey,
      app: selectedApp?.name ?? null,
      step,
    });
    try {
      localStorage.setItem(`${ULTIMA_CONNECTION_PENDING_STEP3_KEY}:${user?.id ?? 'guest'}`, '1');
      localStorage.setItem(ULTIMA_CONNECTION_PENDING_STEP3_KEY, '1');
    } catch {
      // ignore localStorage errors
    }
    openAddSubscription();
  };

  const openToggleVpn = () => {
    onOpenDeepLink('happ://toggle');
  };

  const advanceStep = () => {
    if (step === 1) {
      writeUltimaConnectionCompleted(user?.id, false);
      setStep(2);
      return;
    }
    if (step === 2) {
      startAddSubscriptionFlow();
      return;
    }
    setStep(1);
  };

  const finishFlow = () => {
    const centerRect = centerActionRef.current?.getBoundingClientRect();
    if (centerRect) {
      setSuccessWaveOrigin({
        x: centerRect.left + centerRect.width / 2,
        y: centerRect.top + centerRect.height / 2,
      });
    } else {
      setSuccessWaveOrigin({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    }
    writeUltimaConnectionCompleted(user?.id, true);
    trackAnalyticsEvent('ultima_connection_flow_complete', {
      platform: activePlatformKey,
      app: selectedApp?.name ?? null,
      is_trial: isActiveTrial,
    });
    haptic.notification('success');
    window.setTimeout(() => {
      setShowFinishSuccess(true);
    }, 180);
    window.setTimeout(() => {
      setShowFinishSuccess(false);
      writeUltimaConnectionStep(user?.id, 1);
      setStep(1);
      setShowInfo(false);
      onGoBack();
    }, 1560);
  };

  const dismissReminderForNow = () => {
    setShowInfo(false);
  };

  const hideReminderPermanently = () => {
    if (!canPermanentlyHideReminder) {
      setShowInfo(false);
      return;
    }
    writeUltimaConnectionReminderHidden(user?.id, true);
    setIsReminderHidden(true);
    setShowInfo(false);
  };

  const bottomNav = <UltimaBottomNav active="connection" />;
  const hasMultiplePlatforms = availablePlatformKeys.length > 1;
  const hasMultipleApps = currentPlatformApps.length > 1;

  const handlePlatformChange = (platformKey: string) => {
    setActivePlatformKey(platformKey);
    const apps = appConfig.platforms[platformKey]?.apps ?? [];
    const featuredIndex = apps.findIndex((app) => app.featured);
    const nextIndex = featuredIndex >= 0 ? featuredIndex : 0;
    setSelectedAppKey(apps[nextIndex] ? getAppKey(apps[nextIndex], nextIndex) : null);
  };

  const renderConnectionPicker = (compact = false) => {
    if (!hasMultiplePlatforms && !hasMultipleApps && setupUrls.installOptions.length <= 1) {
      return null;
    }

    return (
      <section
        className={`rounded-[22px] border border-white/10 bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl ${
          compact ? 'mb-3 p-2.5' : 'p-3.5'
        }`}
      >
        {(hasMultiplePlatforms || hasMultipleApps) && (
          <div className="space-y-2.5">
            {hasMultiplePlatforms && (
              <div
                className={
                  isDesktopViewport
                    ? 'grid grid-cols-2 gap-1.5'
                    : 'flex gap-1.5 overflow-x-auto pb-1'
                }
              >
                {availablePlatformKeys.map((platformKey) => {
                  const isActive = platformKey === activePlatformKey;
                  return (
                    <button
                      key={platformKey}
                      type="button"
                      onClick={() => handlePlatformChange(platformKey)}
                      className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                        isDesktopViewport ? 'min-w-0 truncate text-center' : 'shrink-0'
                      } ${
                        isActive
                          ? 'border-emerald-200/[0.45] bg-emerald-300/[0.16] text-white'
                          : 'border-white/10 bg-white/[0.04] text-white/[0.62] hover:border-white/20 hover:text-white/85'
                      }`}
                    >
                      {getPlatformDisplayName(appConfig, platformKey, i18n.language || 'ru')}
                    </button>
                  );
                })}
              </div>
            )}

            {hasMultipleApps && (
              <div className="grid grid-cols-1 gap-1.5 min-[380px]:grid-cols-2">
                {currentPlatformApps.map((app, index) => {
                  const appKey = getAppKey(app, index);
                  const isActive = appKey === selectedAppKey;
                  return (
                    <button
                      key={appKey}
                      type="button"
                      onClick={() => setSelectedAppKey(appKey)}
                      className={`flex min-h-[40px] items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-left text-[12px] font-medium transition ${
                        isActive
                          ? 'border-emerald-200/[0.36] bg-emerald-300/[0.12] text-white'
                          : 'border-white/10 bg-white/[0.035] text-white/[0.66] hover:border-white/20 hover:text-white/90'
                      }`}
                    >
                      <span className="min-w-0 truncate">{app.name}</span>
                      {app.featured ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-300" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {setupUrls.installOptions.length > 1 && (
          <div className={hasMultiplePlatforms || hasMultipleApps ? 'mt-3' : ''}>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/[0.46]">
              {t('subscription.connection.downloadSource', { defaultValue: 'Откуда скачать' })}
            </p>
            <div className="grid grid-cols-1 gap-1.5 min-[380px]:grid-cols-2">
              {setupUrls.installOptions.map((option) => (
                <button
                  key={`${option.key}-${option.url}`}
                  type="button"
                  onClick={() => startInstallUrlFlow(option.url)}
                  className={`rounded-2xl border px-3 py-2 text-left text-[12px] font-semibold transition ${
                    option.kind === 'apk'
                      ? 'border-emerald-200/[0.36] bg-emerald-300/[0.14] text-emerald-50'
                      : 'border-white/10 bg-white/[0.04] text-white/[0.72] hover:border-white/20 hover:text-white/90'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  };

  if (isDesktopViewport) {
    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-connection-desktop relative">
        <div className="ultima-shell-aura" />
        <UltimaDesktopConnection
          step={step}
          title={title}
          subtitle={subtitle}
          importantInfoDescription={importantInfoDescription}
          showInfo={showInfo}
          canPermanentlyHideReminder={canPermanentlyHideReminder}
          bottomNav={bottomNav}
          setupControls={renderConnectionPicker()}
          onStartInstall={startInstallFlow}
          onStartAddSubscription={startAddSubscriptionFlow}
          onAdvance={advanceStep}
          onFinish={finishFlow}
          onNeedHelp={() => navigate('/support')}
          onToggleVpn={openToggleVpn}
          onDismissInfo={dismissReminderForNow}
          onHideReminderPermanently={hideReminderPermanently}
        />
        {showFinishSuccess && (
          <div className="pointer-events-none absolute inset-0 z-40">
            <div
              className="absolute"
              style={{
                left: successWaveOrigin.x,
                top: successWaveOrigin.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="ultima-success-wave h-[54vmax] w-[54vmax] rounded-full border"
                style={{
                  borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 52%, transparent)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="ultima-shell ultima-shell-shared-nav-docked ultima-shell-compact">
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[560px] lg:justify-between">
        <section className="ultima-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-none lg:pb-2">
          <div
            key={step}
            className={`ultima-step-enter text-center lg:pt-3 ${isVeryShortViewport ? 'pt-0.5' : 'pt-2'}`}
          >
            <h1
              className={`font-semibold leading-[0.96] text-white ${
                isDoneStep
                  ? isVeryShortViewport
                    ? 'text-[clamp(26px,7.6vw,30px)]'
                    : 'text-[clamp(30px,8.4vw,36px)]'
                  : isVeryShortViewport
                    ? 'text-[clamp(32px,9vw,38px)]'
                    : 'text-[clamp(34px,10vw,42px)]'
              }`}
            >
              {title}
            </h1>
            <p
              className={`mx-auto mt-2 leading-[1.2] ${
                isDoneStep
                  ? isVeryShortViewport
                    ? 'max-w-[280px] text-[13px] text-white/[0.72]'
                    : 'max-w-[332px] text-[clamp(14px,3.8vw,15px)] text-white/[0.72]'
                  : 'max-w-[360px] text-[clamp(14px,4.4vw,17px)] text-white/70'
              }`}
            >
              {subtitle}
            </p>
            {step === 3 && (
              <div
                className={`mx-auto w-full max-w-[332px] rounded-2xl border border-emerald-200/[0.28] bg-[linear-gradient(130deg,rgba(28,171,142,0.30),rgba(8,27,24,0.58))] px-3.5 shadow-[0_10px_24px_rgba(4,16,14,0.35),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-md ${isVeryShortViewport ? 'mt-1.5 py-1.5' : 'mt-2 py-2'}`}
              >
                <p className="text-[12px] font-medium leading-[1.22] text-emerald-50/95">
                  {t('subscription.connection.tapCheckHint', {
                    defaultValue: 'Можно нажать и здесь: галочка в центре тоже переключает VPN.',
                  })}
                </p>
              </div>
            )}
            <div
              className={`mx-auto flex w-fit items-center gap-2 lg:mt-3 ${isVeryShortViewport ? 'mt-2' : 'mt-4'}`}
            >
              {[1, 2, 3].map((index) => {
                const done = step > index || (step === 3 && index === 3);
                const active = step === index && !done;
                return (
                  <span
                    key={index}
                    className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-xs font-medium ${
                      active
                        ? 'border-emerald-200/70 bg-emerald-300/20 text-white'
                        : done
                          ? 'border-emerald-200/[0.55] bg-emerald-400/[0.35] text-emerald-50'
                          : 'border-white/[0.18] bg-white/[0.08] text-white/60'
                    } ${done ? 'ultima-step-done-pop' : ''}`}
                  >
                    {done ? <StepDoneIcon /> : index}
                  </span>
                );
              })}
            </div>
            <div
              className={`mx-auto h-1 w-full max-w-[168px] overflow-hidden rounded-full bg-white/[0.15] lg:mt-1.5 ${isVeryShortViewport ? 'mt-1.5' : 'mt-2'}`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-200/[0.85] via-emerald-300/90 to-emerald-200/[0.85] transition-[width] duration-500 ease-out"
                style={{ width: `${stepProgressPercent}%` }}
              />
            </div>
          </div>

          <div
            className={`relative flex flex-1 items-center justify-center lg:mt-8 lg:min-h-[320px] lg:flex-none ${isFinalStep ? 'mb-2' : ''} ${isVeryShortViewport ? 'mt-3' : isShortViewport ? 'mt-5' : 'mt-7'}`}
          >
            <div
              className="ultima-step-ring pointer-events-none absolute rounded-full border"
              style={{
                width: ringSizes.outer,
                height: ringSizes.outer,
                borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 22%, transparent)',
              }}
            />
            <div
              className="ultima-step-ring ultima-step-ring-delay-1 pointer-events-none absolute rounded-full border"
              style={{
                width: ringSizes.middle,
                height: ringSizes.middle,
                borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 18%, transparent)',
              }}
            />
            <div
              className="ultima-step-ring ultima-step-ring-delay-2 pointer-events-none absolute rounded-full border"
              style={{
                width: ringSizes.inner,
                height: ringSizes.inner,
                borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 46%, transparent)',
              }}
            />
            <svg
              viewBox="0 0 240 240"
              className="pointer-events-none absolute -rotate-90"
              style={{ width: ringSizes.progress, height: ringSizes.progress }}
              aria-hidden
            >
              <circle
                cx="120"
                cy="120"
                r={ringRadius}
                fill="none"
                strokeWidth="4"
                style={{ stroke: 'color-mix(in srgb, var(--ultima-color-ring) 22%, transparent)' }}
              />
              <circle
                cx="120"
                cy="120"
                r={ringRadius}
                fill="none"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                style={{
                  stroke: 'var(--ultima-color-primary)',
                  transition:
                    'stroke-dashoffset 880ms cubic-bezier(0.22,0.88,0.24,1), stroke 380ms ease',
                }}
              />
            </svg>
            <div
              ref={centerActionRef}
              className="relative flex items-center justify-center rounded-full bg-black/[0.08]"
              style={{ width: ringSizes.center, height: ringSizes.center }}
            >
              {step === 3 ? (
                <button
                  type="button"
                  onClick={openToggleVpn}
                  className="group relative z-10 inline-flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
                  style={{ width: ringSizes.button, height: ringSizes.button }}
                  aria-label={t('subscription.connection.toggleVpnInApp', {
                    defaultValue: 'Переключить VPN в приложении',
                  })}
                >
                  {icon}
                </button>
              ) : step === 2 ? (
                <button
                  type="button"
                  onClick={startAddSubscriptionFlow}
                  className="group relative z-10 inline-flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
                  style={{ width: ringSizes.button, height: ringSizes.button }}
                  aria-label={t('subscription.connection.addSubscription', {
                    defaultValue: 'Добавить подписку',
                  })}
                >
                  {icon}
                </button>
              ) : step === 1 ? (
                <button
                  type="button"
                  onClick={startInstallFlow}
                  className="group relative z-10 inline-flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
                  style={{ width: ringSizes.button, height: ringSizes.button }}
                  aria-label={t('subscription.connection.installApp', {
                    defaultValue: 'Установить приложение',
                  })}
                >
                  {icon}
                </button>
              ) : (
                icon
              )}
              {step === 3 && showReturnConfetti && (
                <div className="pointer-events-none absolute inset-[-160px] overflow-visible">
                  {Array.from({ length: 260 }).map((_, index) => {
                    const angle = (index * 137.5) % 360;
                    const distance = 140 + ((index * 23) % 420);
                    const hue = (index * 37) % 360;
                    const spin = 150 + ((index * 61) % 410);
                    const duration = 1400 + ((index * 37) % 900);
                    const width = 4 + ((index * 5) % 4);
                    const height = 9 + ((index * 7) % 7);
                    const delay = ((index * 11) % 260) / 1000;
                    const confettiStyle = {
                      background: `hsl(${hue} 95% 62%)`,
                      width: `${width}px`,
                      height: `${height}px`,
                      animationDelay: `${delay}s`,
                      opacity: 0,
                      '--angle': `${angle}deg`,
                      '--distance': `${distance}px`,
                      '--spin': `${spin}deg`,
                      '--duration': `${duration}ms`,
                    } as CSSProperties;
                    return (
                      <span
                        key={`${burst}-return-${index}`}
                        className="ultima-confetti-chip absolute left-1/2 top-1/2 rounded-sm"
                        style={confettiStyle}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={`${isFinalStep ? 'pt-1' : ''} pb-0 lg:pt-3`}>
          {step !== 3 && renderConnectionPicker(true)}
          {step === 1 && (
            <button
              type="button"
              onClick={startInstallFlow}
              className="ultima-btn-pill ultima-btn-primary mb-3 flex w-full items-center justify-center gap-2 px-5 py-2.5 text-[16px] lg:mb-2"
            >
              <span aria-hidden>⟳</span>
              {t('subscription.connection.installApp', { defaultValue: 'Установить приложение' })}
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={startAddSubscriptionFlow}
              className="ultima-btn-pill ultima-btn-primary mb-3 flex w-full items-center justify-center gap-2 px-5 py-2.5 text-[16px] lg:mb-2"
            >
              <span aria-hidden>◌</span>
              {t('subscription.connection.addSubscription', { defaultValue: 'Добавить подписку' })}
            </button>
          )}
          {step === 3 && (
            <>
              <button
                type="button"
                onClick={finishFlow}
                disabled={showFinishSuccess}
                className={`ultima-btn-pill ultima-btn-primary mb-3 flex w-full items-center justify-center px-5 text-[16px] lg:mb-2 ${isVeryShortViewport ? 'py-2' : 'py-2.5'}`}
              >
                {t('subscription.connection.finishSetup', { defaultValue: 'Завершить настройку' })}
              </button>
              <button
                type="button"
                onClick={() => navigate('/support')}
                className={`ultima-btn-pill ultima-btn-secondary mb-3 flex w-full items-center justify-center px-5 text-[15px] lg:mb-2 ${isVeryShortViewport ? 'py-2' : 'py-2.5'}`}
              >
                {t('subscription.connection.needHelp', { defaultValue: 'Не получилось?' })}
              </button>
            </>
          )}

          {step !== 3 && (
            <button
              type="button"
              onClick={advanceStep}
              className={`ultima-btn-pill ultima-btn-secondary mb-3 flex w-full items-center justify-center gap-2 px-5 text-[16px] lg:mb-2 ${isVeryShortViewport ? 'py-2' : 'py-2.5'}`}
            >
              {t('subscription.connection.nextStep', { defaultValue: 'Следующий шаг' })}
              <span aria-hidden className="text-white/70">
                →
              </span>
            </button>
          )}
        </section>
      </div>

      {step === 1 && showInfo && (
        <>
          <div className="ultima-mobile-overlay-backdrop" />
          <div className="ultima-mobile-overlay">
            <div className="ultima-mobile-overlay-panel">
              <div className="ultima-step-enter rounded-[24px] border border-white/[0.24] bg-[#05070B] p-4 text-white shadow-[0_26px_56px_rgba(0,0,0,0.72)] backdrop-blur-xl">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="text-[24px] font-semibold leading-[1.06] text-white/95">
                    {t('subscription.connection.importantInfo', {
                      defaultValue: 'Важная информация',
                    })}
                  </h3>
                  <button
                    type="button"
                    onClick={dismissReminderForNow}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/30 text-white/90"
                    aria-label="close-info-modal"
                  >
                    ×
                  </button>
                </div>
                <p className="text-[15px] leading-[1.28] text-white/[0.92]">
                  {importantInfoDescription}
                </p>
                <button
                  type="button"
                  onClick={dismissReminderForNow}
                  className="ultima-btn-pill ultima-btn-secondary mt-4 flex w-full items-center justify-center px-5 py-2.5 text-[15px]"
                >
                  {canPermanentlyHideReminder
                    ? t('subscription.connection.remindLater', {
                        defaultValue: 'Напомнить позже',
                      })
                    : t('subscription.connection.gotIt', {
                        defaultValue: 'Все понятно',
                      })}
                </button>
                {canPermanentlyHideReminder && (
                  <button
                    type="button"
                    onClick={hideReminderPermanently}
                    className="ultima-btn-pill ultima-btn-secondary mt-2 flex w-full items-center justify-center px-5 py-2.5 text-[15px]"
                  >
                    {t('subscription.connection.hideReminderPermanently', {
                      defaultValue: 'Больше не показывать',
                    })}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      {showFinishSuccess && (
        <div className="pointer-events-none absolute inset-0 z-40">
          <div
            className="absolute"
            style={{
              left: successWaveOrigin.x,
              top: successWaveOrigin.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="ultima-success-wave h-[54vmax] w-[54vmax] rounded-full border"
              style={{
                borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 52%, transparent)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
