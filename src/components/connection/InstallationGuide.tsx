import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import DOMPurify from 'dompurify';
import type {
  AppConfig,
  LocalizedText,
  RemnawaveAppClient,
  RemnawavePlatformData,
  RemnawaveButtonClient,
} from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { useBranding } from '@/hooks/useBranding';
import { copyToClipboard } from '@/utils/clipboard';
import { getLiteOnboardingFlowState, markLiteOnboardingStep } from '@/features/lite/onboardingFlow';
import { useAuthStore } from '@/store/auth';
import { CardsBlock, TimelineBlock, AccordionBlock, MinimalBlock, BlockButtons } from './blocks';
import type { BlockRendererProps, RenderBlock } from './blocks';
import TvQuickConnect from './TvQuickConnect';

const platformOrder = ['ios', 'android', 'windows', 'macos', 'linux', 'androidTV', 'appleTV'];

function detectPlatform(): string | null {
  if (typeof window === 'undefined' || !navigator?.userAgent) return null;
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return /tv|television/.test(ua) ? 'androidTV' : 'android';
  if (/macintosh|mac os x/.test(ua)) return 'macos';
  if (/windows/.test(ua)) return 'windows';
  if (/linux/.test(ua)) return 'linux';
  return null;
}

const RENDERERS: Record<string, React.ComponentType<BlockRendererProps>> = {
  cards: CardsBlock,
  timeline: TimelineBlock,
  accordion: AccordionBlock,
  minimal: MinimalBlock,
};

const BackIcon = () => (
  <svg
    className="h-[18px] w-[18px]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

function isHappApp(app: RemnawaveAppClient | null): boolean {
  if (!app) return false;
  if ((app.deepLink ?? '').toLowerCase().startsWith('happ://')) return true;
  return app.name.toLowerCase().includes('happ');
}

interface Props {
  appConfig: AppConfig;
  onOpenDeepLink: (url: string) => void;
  isTelegramWebApp: boolean;
  onGoBack: () => void;
  onOpenQR?: () => void;
  telegramTopOffset?: number;
  telegramBottomOffset?: number;
  reserveTelegramRightControls?: boolean;
}

export default function InstallationGuide({
  appConfig,
  onOpenDeepLink,
  isTelegramWebApp,
  onGoBack,
  onOpenQR,
  telegramTopOffset = 0,
  telegramBottomOffset = 0,
  reserveTelegramRightControls = false,
}: Props) {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const { isLight } = useTheme();
  const { appName, logoUrl } = useBranding();
  const user = useAuthStore((state) => state.user);

  const detectedPlatform = useMemo(() => detectPlatform(), []);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const [activePlatformKey, setActivePlatformKey] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<RemnawaveAppClient | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPlatformSelectorOpen, setIsPlatformSelectorOpen] = useState(false);
  const [isAppSelectorOpen, setIsAppSelectorOpen] = useState(false);
  const [flowState, setFlowState] = useState(() => getLiteOnboardingFlowState(user?.id));
  const topPadding = isTelegramWebApp ? telegramTopOffset + 16 : undefined;
  const bottomPadding = isTelegramWebApp ? telegramBottomOffset + 32 : undefined;
  const useInlineQrAction = reserveTelegramRightControls && Boolean(onOpenQR);
  const pagePaddingStyle =
    topPadding !== undefined || bottomPadding !== undefined
      ? {
          ...(topPadding !== undefined ? { paddingTop: `max(${topPadding}px, 1rem)` } : {}),
          ...(bottomPadding !== undefined
            ? { paddingBottom: `max(${bottomPadding}px, 2rem)` }
            : {}),
        }
      : undefined;

  const getLocalizedText = useCallback(
    (text: LocalizedText | undefined): string => {
      if (!text) return '';
      const lang = i18n.language || 'en';
      return text[lang] || text['en'] || text['ru'] || Object.values(text)[0] || '';
    },
    [i18n.language],
  );

  const getBaseTranslation = useCallback(
    (key: string, i18nKey: string): string => {
      const bt = appConfig.baseTranslations;
      if (bt && key in bt) {
        const text = getLocalizedText(bt[key as keyof typeof bt] as LocalizedText);
        if (text) return text;
      }
      return t(i18nKey);
    },
    [appConfig.baseTranslations, getLocalizedText, t],
  );

  useEffect(() => {
    setFlowState(getLiteOnboardingFlowState(user?.id));
  }, [user?.id]);

  const isTrialStepTwoGuide =
    searchParams.get('guide') === 'trial' && searchParams.get('step') === '2';

  const trialStep1Done = flowState.trial_activated;
  const trialStep2Done = flowState.connection_opened;
  const trialStep3Done = flowState.subscription_added;

  useEffect(() => {
    if (isTrialStepTwoGuide && !flowState.connection_opened) {
      setFlowState(markLiteOnboardingStep('connection_opened', user?.id));
    }
  }, [flowState.connection_opened, isTrialStepTwoGuide, user?.id]);

  const handleOpenDeepLinkWithFlow = useCallback(
    (url: string) => {
      if (isTrialStepTwoGuide && !flowState.subscription_added) {
        setFlowState(markLiteOnboardingStep('subscription_added', user?.id));
      }
      onOpenDeepLink(url);
    },
    [flowState.subscription_added, isTrialStepTwoGuide, onOpenDeepLink, user?.id],
  );

  const getSvgHtml = useCallback(
    (svgKey: string | undefined): string => {
      if (!svgKey || !appConfig.svgLibrary?.[svgKey]) return '';
      const entry = appConfig.svgLibrary[svgKey];
      const raw = typeof entry === 'string' ? entry : entry.svgString;
      if (!raw) return '';
      return DOMPurify.sanitize(raw, { USE_PROFILES: { svg: true, svgFilters: true } });
    },
    [appConfig.svgLibrary],
  );

  const availablePlatforms = useMemo(() => {
    if (!appConfig.platforms) return [];
    const available = platformOrder.filter((key) => {
      const data = appConfig.platforms[key] as RemnawavePlatformData | undefined;
      return data && data.apps && data.apps.length > 0;
    });
    if (detectedPlatform && available.includes(detectedPlatform)) {
      return [detectedPlatform, ...available.filter((p) => p !== detectedPlatform)];
    }
    return available;
  }, [appConfig.platforms, detectedPlatform]);

  useEffect(() => {
    if (selectedApp || !availablePlatforms.length) return;
    const platform = availablePlatforms[0];
    const data = appConfig.platforms[platform] as RemnawavePlatformData | undefined;
    if (!data?.apps?.length) return;
    const app = data.apps.find((a) => a.featured) || data.apps[0];
    if (app) {
      setSelectedApp(app);
      setActivePlatformKey(platform);
    }
  }, [appConfig.platforms, availablePlatforms, selectedApp]);

  const currentPlatformKey = activePlatformKey || availablePlatforms[0];
  const currentPlatformData = currentPlatformKey
    ? (appConfig.platforms[currentPlatformKey] as RemnawavePlatformData | undefined)
    : undefined;
  const currentPlatformApps = currentPlatformData?.apps || [];

  const renderBlockButtons = useCallback(
    (buttons: RemnawaveButtonClient[] | undefined, variant: 'light' | 'subtle') => (
      <BlockButtons
        buttons={buttons}
        variant={variant}
        isLight={isLight}
        platformKey={currentPlatformKey}
        subscriptionUrl={appConfig.subscriptionUrl}
        hideLink={appConfig.hideLink}
        deepLink={selectedApp?.deepLink}
        getLocalizedText={getLocalizedText}
        getBaseTranslation={getBaseTranslation}
        getSvgHtml={getSvgHtml}
        onOpenDeepLink={handleOpenDeepLinkWithFlow}
      />
    ),
    [
      appConfig.subscriptionUrl,
      appConfig.hideLink,
      currentPlatformKey,
      selectedApp?.deepLink,
      isLight,
      getLocalizedText,
      getBaseTranslation,
      getSvgHtml,
      handleOpenDeepLinkWithFlow,
    ],
  );

  const selectedIsTv =
    (activePlatformKey || availablePlatforms[0]) === 'androidTV' ||
    (activePlatformKey || availablePlatforms[0]) === 'appleTV';
  const userIsOnTv = detectedPlatform === 'androidTV' || detectedPlatform === 'appleTV';
  const isTvPlatform = selectedIsTv && !userIsOnTv;
  const showTvQuickConnect = Boolean(
    selectedApp && isTvPlatform && isHappApp(selectedApp) && appConfig.subscriptionUrl,
  );

  const renderBlocks = useMemo<RenderBlock[]>(() => {
    if (!selectedApp) return [];
    if (!showTvQuickConnect || !appConfig.subscriptionUrl) return selectedApp.blocks;

    const quickConnect = (
      <TvQuickConnect subscriptionUrl={appConfig.subscriptionUrl} isLight={isLight} />
    );
    const targetIndex =
      selectedApp.blocks.length >= 3 ? 1 : Math.max(0, selectedApp.blocks.length - 1);

    return selectedApp.blocks.map((block, index) =>
      index === targetIndex ? { ...block, customNode: quickConnect } : block,
    );
  }, [appConfig.subscriptionUrl, isLight, selectedApp, showTvQuickConnect]);

  // Platform display name
  const getPlatformDisplayName = useCallback(
    (key: string): string => {
      const data = appConfig.platforms[key] as RemnawavePlatformData | undefined;
      if (data?.displayName) {
        const name = getLocalizedText(data.displayName);
        if (name) return name;
      }
      if (appConfig.platformNames?.[key]) {
        return getLocalizedText(appConfig.platformNames[key]);
      }
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
    },
    [appConfig.platforms, appConfig.platformNames, getLocalizedText],
  );

  // Platform SVG icon for dropdown
  const currentPlatformSvg = getSvgHtml(currentPlatformData?.svgIconKey);

  // Block renderer
  const blockType = appConfig.uiConfig?.installationGuidesBlockType || 'timeline';
  const Renderer = RENDERERS[blockType] || CardsBlock;

  const handleCopyLink = useCallback(async () => {
    if (!appConfig.subscriptionUrl) return;
    await copyToClipboard(appConfig.subscriptionUrl);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1600);
  }, [appConfig.subscriptionUrl]);

  const handlePlatformChange = useCallback(
    (newPlatform: string) => {
      setActivePlatformKey(newPlatform);
      const data = appConfig.platforms[newPlatform] as RemnawavePlatformData | undefined;
      if (data?.apps?.length) {
        const app =
          data.apps.find((a) => a.name === selectedApp?.name) ||
          data.apps.find((a) => a.featured) ||
          data.apps[0];
        if (app) setSelectedApp(app);
      }
      setIsPlatformSelectorOpen(false);
    },
    [appConfig.platforms, selectedApp?.name],
  );

  return (
    <div
      className={`min-h-[var(--app-viewport-height)] w-full overflow-y-auto ${isLight ? 'bg-champagne-50' : 'bg-dark-950'}`}
    >
      <div
        className="mx-auto flex min-h-[var(--app-viewport-height)] w-full max-w-[1180px] flex-col gap-4 px-3 pb-5 pt-4 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8 lg:py-8 xl:py-10"
        style={pagePaddingStyle}
      >
        {/* Top bar */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 lg:gap-4">
          {!isTelegramWebApp ? (
            <button
              onClick={onGoBack}
              className={`flex h-[36px] items-center gap-1.5 justify-self-start rounded-full px-3 text-xs font-semibold transition-all active:scale-[0.98] sm:h-10 sm:px-4 sm:text-sm ${
                isLight
                  ? 'border border-champagne-300/70 bg-white/80 text-champagne-900 shadow-sm'
                  : 'border border-dark-700/60 bg-dark-900/80 text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]'
              }`}
            >
              <BackIcon />
              <span>Назад</span>
            </button>
          ) : (
            <div className="h-9 w-9 sm:h-10 sm:w-10" />
          )}

          <div
            className={`flex min-w-0 max-w-[190px] items-center gap-2 justify-self-center rounded-full px-4 py-2 text-sm font-semibold shadow-[0_16px_36px_rgba(0,0,0,0.18)] sm:max-w-[260px] sm:px-5 sm:py-2.5 lg:max-w-[340px] ${
              isLight
                ? 'border border-champagne-300/70 bg-champagne-100 text-champagne-900'
                : 'border-white/8 border bg-accent-500/15 text-accent-400'
            }`}
          >
            <span className="bg-current/10 flex h-6 w-6 items-center justify-center rounded-full text-current">
              {logoUrl ? (
                <img src={logoUrl} alt={appName} className="h-5 w-5 rounded-full object-contain" />
              ) : (
                <span className="text-xs">◎</span>
              )}
            </span>
            <span className="truncate">{appName || 'Telega'}</span>
          </div>

          {!useInlineQrAction && (
            <button
              type="button"
              onClick={onOpenQR}
              className={`flex h-9 w-9 items-center justify-center justify-self-end rounded-full transition-all active:scale-[0.96] sm:h-10 sm:w-10 ${
                isLight
                  ? 'border border-champagne-300/70 bg-white/80 text-champagne-900 shadow-sm'
                  : 'border border-dark-700/60 bg-dark-900/80 text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]'
              }`}
              aria-label="QR-код"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2h-2v-2Zm4 0h2v2h-2v-2Z"
                />
              </svg>
            </button>
          )}
        </div>

        <main className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)] lg:items-start xl:grid-cols-[minmax(380px,0.9fr)_minmax(620px,1.1fr)]">
          <section className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-8">
            <div className="px-1 pt-1 text-center sm:pt-2 lg:text-left">
              <p
                className={`text-xs font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-champagne-500' : 'text-dark-300'}`}
              >
                Добавление устройства
              </p>
              <h2
                className={`mt-2 text-[30px] font-extrabold leading-[1.05] tracking-tight sm:text-[42px] lg:text-[52px] xl:text-[58px] ${isLight ? 'text-champagne-900' : 'text-white'}`}
              >
                Ссылка для настройки
              </h2>
            </div>

            {/* Connection card */}
            <div
              className={`overflow-hidden rounded-[28px] border p-3 sm:p-4 lg:p-5 ${
                isLight
                  ? 'border-champagne-300/70 bg-champagne-100 shadow-[0_24px_70px_rgba(116,89,44,0.1)]'
                  : 'border-dark-700/70 bg-dark-900/75 shadow-[0_24px_70px_rgba(0,0,0,0.32)]'
              }`}
            >
              <div
                className={`whitespace-normal break-all rounded-[22px] px-3 py-3 text-center font-mono text-[11px] font-bold leading-tight sm:px-4 sm:text-xs lg:text-sm ${
                  isLight ? 'bg-champagne-200 text-champagne-900' : 'bg-dark-800 text-white'
                }`}
              >
                {appConfig.subscriptionUrl || '—'}
              </div>
              <button
                onClick={handleCopyLink}
                className={`mt-3 flex w-full items-center justify-center gap-2 rounded-[22px] border px-4 py-3 text-sm font-bold transition-all active:scale-[0.99] sm:text-base lg:py-3.5 ${
                  isLight
                    ? 'border-accent-500 bg-accent-950/20 text-accent-600 shadow-[0_10px_28px_rgba(var(--color-accent-500),0.18)]'
                    : 'border-accent-500 bg-accent-500/10 text-accent-400 shadow-[0_10px_28px_rgba(var(--color-accent-500),0.12)]'
                }`}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16 1H8a2 2 0 0 0-2 2v2h2V3h8v16H8v-2H6v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2Z" />
                  <path d="M10 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Zm0 12H4V9h6v10Z" />
                </svg>
                {isCopied ? 'Скопировано' : 'Скопировать ссылку'}
              </button>
              {useInlineQrAction && (
                <button
                  type="button"
                  onClick={onOpenQR}
                  className={`mt-2 flex w-full items-center justify-center gap-2 rounded-[20px] border px-4 py-3 text-sm font-bold transition-all active:scale-[0.99] sm:text-base ${
                    isLight
                      ? 'border-champagne-300/80 bg-white/75 text-champagne-900 shadow-sm'
                      : 'border-dark-700/70 bg-dark-800/80 text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)]'
                  }`}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2h-2v-2Zm4 0h2v2h-2v-2Z"
                    />
                  </svg>
                  QR-код
                </button>
              )}
            </div>
          </section>

          {/* Instruction section */}
          <section
            className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border p-3 sm:p-4 lg:min-h-[560px] lg:p-5 ${
              isLight
                ? 'border-champagne-300/70 bg-champagne-100 shadow-[0_24px_70px_rgba(116,89,44,0.08)]'
                : 'border-dark-700/70 bg-dark-900/75 shadow-[0_24px_70px_rgba(0,0,0,0.32)]'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <h3
                className={`text-[20px] font-extrabold leading-none sm:text-2xl ${isLight ? 'text-champagne-900' : 'text-white'}`}
              >
                Инструкция
              </h3>
              {availablePlatforms.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsPlatformSelectorOpen(true)}
                  className={`relative flex shrink-0 items-center rounded-full border px-3 py-2 text-sm font-semibold transition-all active:scale-[0.98] sm:px-4 sm:py-2.5 ${
                    isLight
                      ? 'border-champagne-300/70 bg-white/75 text-champagne-900 shadow-sm'
                      : 'border-dark-700/70 bg-dark-800/85 text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)]'
                  }`}
                  aria-haspopup="dialog"
                  aria-expanded={isPlatformSelectorOpen}
                >
                  {currentPlatformSvg && (
                    <span
                      className="mr-2 h-5 w-5 text-current opacity-90 [&>svg]:h-full [&>svg]:w-full"
                      dangerouslySetInnerHTML={{ __html: currentPlatformSvg }}
                    />
                  )}
                  <span>
                    {currentPlatformKey ? getPlatformDisplayName(currentPlatformKey) : 'Платформа'}
                  </span>
                  <svg
                    className="ml-2 h-4 w-4 text-current opacity-70"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 9l4-4 4 4M8 15l4 4 4-4"
                    />
                  </svg>
                </button>
              )}
            </div>

            {currentPlatformApps.length > 0 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => currentPlatformApps.length > 1 && setIsAppSelectorOpen(true)}
                  disabled={currentPlatformApps.length <= 1}
                  className={`relative flex w-full items-center justify-center rounded-[22px] border px-5 py-2.5 text-sm font-bold transition-all active:scale-[0.99] disabled:cursor-default disabled:active:scale-100 sm:text-base lg:py-3 ${
                    isLight
                      ? 'border-accent-500 bg-accent-950/20 text-accent-600 shadow-[0_8px_24px_rgba(var(--color-accent-500),0.16)]'
                      : 'border-accent-500 bg-accent-500/10 text-accent-400 shadow-[0_8px_24px_rgba(var(--color-accent-500),0.12)]'
                  }`}
                  aria-haspopup={currentPlatformApps.length > 1 ? 'dialog' : undefined}
                  aria-expanded={currentPlatformApps.length > 1 ? isAppSelectorOpen : undefined}
                  aria-label="Выберите приложение"
                >
                  {(() => {
                    const appIconSvg = selectedApp ? getSvgHtml(selectedApp.svgIconKey) : '';
                    return appIconSvg ? (
                      <span
                        className="mr-2 h-5 w-5 shrink-0 [&>svg]:h-full [&>svg]:w-full"
                        dangerouslySetInnerHTML={{ __html: appIconSvg }}
                      />
                    ) : null;
                  })()}
                  <span className="min-w-0 truncate">
                    {selectedApp?.name || currentPlatformApps[0]?.name}
                  </span>
                  {currentPlatformApps.length > 1 && (
                    <svg
                      className="ml-2 h-4 w-4 shrink-0 text-current opacity-70"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 9l4-4 4 4M8 15l4 4 4-4"
                      />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {isTrialStepTwoGuide && (
              <div
                className={`mt-4 rounded-[22px] border p-4 ${
                  isLight
                    ? 'border-success-500/45 bg-success-500/10 text-champagne-900'
                    : 'border-success-500/45 bg-success-500/10 text-dark-100'
                }`}
              >
                <p className="text-sm font-semibold text-success-300">
                  {t('subscription.connection.trialStep2.title', 'Continue setup')}
                </p>
                <p className="mt-1 text-xs text-dark-300">
                  {t(
                    'subscription.connection.trialStep2.description',
                    'Install the app and add your subscription after trial activation.',
                  )}
                </p>
                <p className="mt-2 text-2xs font-semibold uppercase tracking-[0.05em] text-dark-400">
                  {t('subscription.connection.trialStep2.progress', {
                    current: trialStep3Done ? 3 : trialStep2Done ? 2 : trialStep1Done ? 1 : 0,
                    total: 3,
                    defaultValue: 'Step {{current}} of {{total}}',
                  })}
                </p>
                <ol className="mt-3 space-y-1.5 text-xs text-dark-300">
                  {[
                    {
                      done: trialStep1Done,
                      label: t(
                        'subscription.connection.trialStep2.ifNoApp',
                        'If the app is not installed yet, install it first.',
                      ),
                    },
                    {
                      done: trialStep2Done,
                      label: t(
                        'subscription.connection.trialStep2.afterInstall',
                        'Return here after installation and add the subscription.',
                      ),
                    },
                    {
                      done: trialStep3Done,
                      label: t(
                        'subscription.connection.trialStep2.ifAppExists',
                        'If the app is already installed, add the subscription now.',
                      ),
                    },
                  ].map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold ${
                          step.done
                            ? 'bg-success-500/20 text-success-300'
                            : isLight
                              ? 'bg-champagne-200 text-champagne-700'
                              : 'bg-dark-700 text-dark-300'
                        }`}
                      >
                        {step.done ? '✓' : index + 1}
                      </span>
                      <span>{step.label}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Tutorial button */}
            {appConfig.baseSettings?.isShowTutorialButton &&
              appConfig.baseSettings?.tutorialUrl && (
                <a
                  href={appConfig.baseSettings.tutorialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full justify-center"
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
                      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                  {getBaseTranslation('tutorial', 'subscription.connection.tutorial')}
                </a>
              )}

            {selectedApp ? (
              <Renderer
                blocks={renderBlocks}
                isMobile={isMobile}
                isLight={isLight}
                getLocalizedText={getLocalizedText}
                getSvgHtml={getSvgHtml}
                platformKey={currentPlatformKey}
                renderBlockButtons={renderBlockButtons}
              />
            ) : null}
          </section>
        </main>

        {isPlatformSelectorOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 px-3 pb-4 pt-10 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setIsPlatformSelectorOpen(false)}
          >
            <div
              className={`w-full max-w-[520px] overflow-hidden rounded-[28px] border p-2 shadow-[0_24px_70px_rgba(0,0,0,0.45)] ${
                isLight
                  ? 'border-champagne-300/80 bg-champagne-100 text-champagne-900'
                  : 'border-dark-700/80 bg-dark-900 text-white'
              }`}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Выберите платформу"
            >
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-bold opacity-80">Выберите платформу</span>
                <button
                  type="button"
                  onClick={() => setIsPlatformSelectorOpen(false)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${isLight ? 'bg-white/70' : 'bg-dark-800'}`}
                  aria-label="Закрыть"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="max-h-[60dvh] space-y-1 overflow-y-auto p-1">
                {availablePlatforms.map((platform) => {
                  const data = appConfig.platforms[platform] as RemnawavePlatformData | undefined;
                  const platformSvg = getSvgHtml(data?.svgIconKey);
                  const isActive = platform === currentPlatformKey;
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => handlePlatformChange(platform)}
                      className={`flex w-full items-center gap-3 rounded-[20px] border px-4 py-3 text-left text-base font-semibold transition-all active:scale-[0.99] ${
                        isActive
                          ? isLight
                            ? 'border-accent-500 bg-accent-950/20 text-accent-600 shadow-[0_10px_26px_rgba(var(--color-accent-500),0.16)]'
                            : 'bg-accent-500/12 border-accent-500 text-accent-400 shadow-[0_10px_26px_rgba(var(--color-accent-500),0.14)]'
                          : isLight
                            ? 'border-champagne-300/70 bg-white/60 text-champagne-900'
                            : 'border-dark-700/70 bg-dark-800/70 text-white'
                      }`}
                    >
                      {platformSvg && (
                        <span
                          className="h-5 w-5 shrink-0 text-current [&>svg]:h-full [&>svg]:w-full"
                          dangerouslySetInnerHTML={{ __html: platformSvg }}
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {getPlatformDisplayName(platform)}
                      </span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isActive ? 'border-current' : isLight ? 'border-champagne-400' : 'border-dark-500'}`}
                      >
                        {isActive && <span className="h-2.5 w-2.5 rounded-full bg-current" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {isAppSelectorOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 px-3 pb-4 pt-10 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setIsAppSelectorOpen(false)}
          >
            <div
              className={`w-full max-w-[520px] overflow-hidden rounded-[28px] border p-2 shadow-[0_24px_70px_rgba(0,0,0,0.45)] ${
                isLight
                  ? 'border-champagne-300/80 bg-champagne-100 text-champagne-900'
                  : 'border-dark-700/80 bg-dark-900 text-white'
              }`}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Выберите приложение"
            >
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-bold opacity-80">Выберите приложение</span>
                <button
                  type="button"
                  onClick={() => setIsAppSelectorOpen(false)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${isLight ? 'bg-white/70' : 'bg-dark-800'}`}
                  aria-label="Закрыть"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="max-h-[60dvh] space-y-1 overflow-y-auto p-1">
                {currentPlatformApps.map((app, idx) => {
                  const appSvg = getSvgHtml(app.svgIconKey);
                  const isActive = app.name === selectedApp?.name;
                  return (
                    <button
                      key={app.name + idx}
                      type="button"
                      onClick={() => {
                        setSelectedApp(app);
                        setIsAppSelectorOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-[20px] border px-4 py-3 text-left text-base font-semibold transition-all active:scale-[0.99] ${
                        isActive
                          ? isLight
                            ? 'border-accent-500 bg-accent-950/20 text-accent-600 shadow-[0_10px_26px_rgba(var(--color-accent-500),0.16)]'
                            : 'bg-accent-500/12 border-accent-500 text-accent-400 shadow-[0_10px_26px_rgba(var(--color-accent-500),0.14)]'
                          : isLight
                            ? 'border-champagne-300/70 bg-white/60 text-champagne-900'
                            : 'border-dark-700/70 bg-dark-800/70 text-white'
                      }`}
                    >
                      {appSvg && (
                        <span
                          className="h-5 w-5 shrink-0 text-current [&>svg]:h-full [&>svg]:w-full"
                          dangerouslySetInnerHTML={{ __html: appSvg }}
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate">{app.name}</span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isActive ? 'border-current' : isLight ? 'border-champagne-400' : 'border-dark-500'}`}
                      >
                        {isActive && <span className="h-2.5 w-2.5 rounded-full bg-current" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
