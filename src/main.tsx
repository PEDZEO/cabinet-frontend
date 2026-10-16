import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  init,
  restoreInitData,
  retrieveRawInitData,
  mountMiniApp,
  miniAppReady,
  mountViewport,
  expandViewport,
  mountSwipeBehavior,
  enableVerticalSwipes,
  mountClosingBehavior,
  disableClosingConfirmation,
  mountBackButton,
  bindThemeParamsCssVars,
  bindViewportCssVars,
  requestFullscreen,
  isFullscreen,
} from '@telegram-apps/sdk-react';
import { clearStaleSessionIfNeeded } from './utils/token';
import { AppWithNavigator } from './AppWithNavigator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initLogoPreload } from './api/branding';
import { getCachedFullscreenEnabled, isTelegramMobile } from './hooks/useTelegramSDK';
import i18n from './i18n';
import './styles/globals.css';
import './styles/ultima-cabinet.css';

// HMR guard — prevent double init when Vite hot-reloads the module
const HMR_KEY = '__tg_sdk_initialized';
const alreadyInitialized = (window as unknown as Record<string, unknown>)[HMR_KEY] === true;

if (!alreadyInitialized) {
  (window as unknown as Record<string, unknown>)[HMR_KEY] = true;

  try {
    init();
    restoreInitData();

    // Сбрасываем старые токены если init data изменился (новая сессия Telegram)
    clearStaleSessionIfNeeded(retrieveRawInitData() || null);

    // Mount components — each in its own try/catch so one failure doesn't block others
    // Note: mountMiniApp() internally mounts themeParams in SDK v3,
    // so we don't call mountThemeParams() separately to avoid ConcurrentCallError
    try {
      mountMiniApp();
    } catch {
      /* already mounted */
    }
    try {
      bindThemeParamsCssVars();
    } catch {
      /* theme params not yet available */
    }
    try {
      mountSwipeBehavior();
      enableVerticalSwipes();
    } catch {
      /* already mounted */
    }
    try {
      mountClosingBehavior();
      disableClosingConfirmation();
    } catch {
      /* already mounted */
    }
    try {
      mountBackButton();
    } catch {
      /* already mounted */
    }
    // Viewport — async, fullscreen зависит от смонтированного viewport
    mountViewport()
      .then(() => {
        bindViewportCssVars();
        expandViewport();

        // Auto-enter fullscreen if enabled in settings (mobile only)
        if (getCachedFullscreenEnabled() && isTelegramMobile()) {
          if (!isFullscreen()) {
            requestFullscreen();
          }
        }
      })
      .catch(() => {});

    miniAppReady();
  } catch {
    // Not in Telegram — ok
  }
}

// The brand mark is part of the first viewport, so warm it before route content appears.
void initLogoPreload();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const getBaseLanguage = (language: string | undefined) =>
  (language || 'ru').toLowerCase().replace('_', '-').split('-')[0];

const isTranslationReady = () => {
  if (!i18n.isInitialized) return false;
  const activeLanguage = getBaseLanguage(i18n.resolvedLanguage || i18n.language);
  return i18n.hasResourceBundle(activeLanguage, 'translation');
};

const ensureI18nReady = async () => {
  if (isTranslationReady()) return;

  await new Promise<void>((resolve) => {
    const finish = () => {
      if (!isTranslationReady()) return;
      cleanup();
      resolve();
    };

    const cleanup = () => {
      i18n.off('initialized', finish);
      i18n.off('loaded', finish);
      i18n.off('languageChanged', finish);
    };

    i18n.on('initialized', finish);
    i18n.on('loaded', finish);
    i18n.on('languageChanged', finish);
    finish();
  });
};

const renderApp = () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary level="app">
        <QueryClientProvider client={queryClient}>
          <AppWithNavigator />
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
};

void ensureI18nReady().finally(renderApp);
