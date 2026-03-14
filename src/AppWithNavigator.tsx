import { useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  showBackButton,
  hideBackButton,
  onBackButtonClick,
  offBackButtonClick,
} from '@telegram-apps/sdk-react';
import Twemoji from 'react-twemoji';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PlatformProvider } from './platform/PlatformProvider';
import { ThemeColorsProvider } from './providers/ThemeColorsProvider';
import { WebSocketProvider } from './providers/WebSocketProvider';
import { ToastProvider } from './components/Toast';
import { TooltipProvider } from './components/primitives/Tooltip';
import { isInTelegramWebApp } from './hooks/useTelegramSDK';
import { getCachedUltimaMode } from './hooks/useUltimaMode';
import { useUltimaThemeConfig } from './features/ultima/theme';

const TWEMOJI_OPTIONS = { className: 'twemoji', folder: 'svg', ext: '.svg' } as const;

/**
 * Resets scroll position to top on every route change.
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

/**
 * Manages Telegram BackButton visibility based on navigation location.
 * Shows back button on non-root routes, hides on root.
 */
/** Pages reachable from bottom nav — treat as top-level (no back button). */
const DEFAULT_TOP_LEVEL_PATHS = ['/', '/connection', '/balance', '/referral', '/support', '/wheel'];
const ULTIMA_TOP_LEVEL_PATHS = ['/', '/connection', '/profile', '/support'];

const getBackFallbackPath = (pathname: string): string | null => {
  if (/^\/admin\/users\/[^/]+$/.test(pathname)) {
    return '/admin/users';
  }

  return null;
};

function TelegramBackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    const isUltimaMode = getCachedUltimaMode() === true;
    const topLevelPaths = isUltimaMode ? ULTIMA_TOP_LEVEL_PATHS : DEFAULT_TOP_LEVEL_PATHS;
    const isTopLevel = location.pathname === '' || topLevelPaths.includes(location.pathname);
    try {
      if (isTopLevel) {
        hideBackButton();
      } else {
        showBackButton();
      }
    } catch {
      // Back button not mounted
    }
  }, [location]);

  // Stable handler — ref prevents re-subscription on every render
  const handler = useCallback(() => {
    const fallbackPath = getBackFallbackPath(location.pathname);
    if (fallbackPath) {
      navigateRef.current(fallbackPath);
      return;
    }
    navigateRef.current(-1);
  }, [location.pathname]);

  useEffect(() => {
    try {
      onBackButtonClick(handler);
    } catch {
      // Back button not mounted
    }
    return () => {
      try {
        offBackButtonClick(handler);
      } catch {
        // Back button not mounted
      }
    };
  }, [handler]);

  return null;
}

export function AppWithNavigator() {
  const isTelegram = isInTelegramWebApp();
  const { ready } = useTranslation();
  useUltimaThemeConfig();

  return (
    <BrowserRouter>
      <ScrollToTop />
      {isTelegram && <TelegramBackButton />}
      <ErrorBoundary level="page">
        <PlatformProvider>
          <ThemeColorsProvider>
            <TooltipProvider>
              <ToastProvider>
                <WebSocketProvider>
                  <Twemoji options={TWEMOJI_OPTIONS}>{ready ? <App /> : null}</Twemoji>
                </WebSocketProvider>
              </ToastProvider>
            </TooltipProvider>
          </ThemeColorsProvider>
        </PlatformProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
