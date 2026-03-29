import {
  startTransition,
  useEffect,
  useState,
  useCallback,
  useRef,
  type SyntheticEvent,
} from 'react';
import { useLocation, Link, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';

import { useAuthStore } from '@/store/auth';
import { useHaptic } from '@/platform';
import { useTelegramSDK } from '@/hooks/useTelegramSDK';
import { useTheme } from '@/hooks/useTheme';
import { useBranding } from '@/hooks/useBranding';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useLiteMode } from '@/hooks/useLiteMode';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePendingTopUpFollowUp } from '@/hooks/usePendingTopUpFollowUp';
import { getCachedUltimaMode, useUltimaMode } from '@/hooks/useUltimaMode';
import { themeColorsApi } from '@/api/themeColors';
import { isLogoPreloaded } from '@/api/branding';
import { cn } from '@/lib/utils';
import { UI } from '@/config/constants';

import WebSocketNotifications from '@/components/WebSocketNotifications';
import CampaignBonusNotifier from '@/components/CampaignBonusNotifier';
import SuccessNotificationModal from '@/components/SuccessNotificationModal';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import TicketNotificationBell from '@/components/TicketNotificationBell';
import PageLoader from '@/components/common/PageLoader';
import { BackgroundRenderer } from '@/components/backgrounds/BackgroundRenderer';
import { SubscriptionIcon } from '@/components/icons';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import {
  getUltimaTopLevelPath,
  getUltimaTopLevelTab,
  prefetchUltimaTopLevelTab,
  type UltimaBottomNavTab,
} from '@/features/ultima/navigation';

import { MobileBottomNav } from './MobileBottomNav';
import { AppHeader } from './AppHeader';
import { LiteModeHeader } from './LiteModeHeader';

const ULTIMA_RING_DURATION_SEC = 18;
const ULTIMA_SHARED_NAV_BOTTOM_GAP = 'calc(98px + env(safe-area-inset-bottom, 0px))';

// Desktop nav icons
const HomeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
    />
  </svg>
);

const CreditCardIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
    />
  </svg>
);

const ChatIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
    />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
    />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
    />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
    />
  </svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
    />
  </svg>
);

const SunIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
    />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
    />
  </svg>
);

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMainPage = location.pathname === '/';
  const { isAdmin, logout } = useAuthStore();
  const { isFullscreen, safeAreaInset, contentSafeAreaInset, platform, isMobile } =
    useTelegramSDK();
  const haptic = useHaptic();
  const { toggleTheme, isDark } = useTheme();

  // Extracted hooks
  const { appName, logoLetter, hasCustomLogo, logoUrl } = useBranding();
  const { referralEnabled, wheelEnabled, hasContests, hasPolls, giftEnabled } = useFeatureFlags();
  const { isLiteMode, isLiteModeReady } = useLiteMode();
  const { isUltimaMode, isUltimaModeReady } = useUltimaMode();
  const isDesktopViewport = useMediaQuery('(min-width: 1024px)');
  const isCompactMode = isLiteMode || isUltimaMode;
  const ultimaTopLevelTab = getUltimaTopLevelTab(location.pathname);
  const isUltimaTopLevelRoute = isUltimaMode && ultimaTopLevelTab !== null;
  const isUltimaAnimatedRoute = isUltimaMode && !location.pathname.startsWith('/admin');
  const isUltimaSceneRoute =
    isUltimaMode && ['/', '/subscription', '/connection'].includes(location.pathname);
  const shouldShowUltimaSharedNav = isUltimaTopLevelRoute && !isDesktopViewport;
  const ultimaWavePhaseShiftSecRef = useRef(-((Date.now() / 1000) % ULTIMA_RING_DURATION_SEC));
  const hasLiteHeader = isLiteMode;
  const hasRegularHeader = !isCompactMode;
  const isCompactMainPage = isCompactMode && location.pathname === '/';
  const [desktopLogoLoaded, setDesktopLogoLoaded] = useState(() => isLogoPreloaded());
  const [desktopLogoShape, setDesktopLogoShape] = useState<'square' | 'wide' | 'tall'>('square');
  useScrollRestoration();
  usePendingTopUpFollowUp();

  // Theme toggle visibility
  const { data: enabledThemes } = useQuery({
    queryKey: ['enabled-themes'],
    queryFn: themeColorsApi.getEnabledThemes,
    staleTime: 1000 * 60 * 5,
  });
  const canToggleTheme = enabledThemes?.dark && enabledThemes?.light;

  // Only apply fullscreen UI adjustments on mobile Telegram (iOS/Android)
  const isMobileFullscreen = isFullscreen && isMobile;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Keyboard detection for hiding bottom nav
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (
        !relatedTarget ||
        (relatedTarget.tagName !== 'INPUT' &&
          relatedTarget.tagName !== 'TEXTAREA' &&
          !relatedTarget.isContentEditable)
      ) {
        setIsKeyboardOpen(false);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Desktop navigation items
  const desktopNavItems = [
    { path: '/', label: t('nav.dashboard'), icon: HomeIcon },
    { path: '/subscription', label: t('nav.subscription'), icon: SubscriptionIcon },
    ...(giftEnabled
      ? [{ path: '/gift', label: t('nav.gift', 'Подарок'), icon: SubscriptionIcon }]
      : []),
    { path: '/balance', label: t('nav.balance'), icon: CreditCardIcon },
    { path: '/support', label: t('nav.support'), icon: ChatIcon },
    { path: '/info', label: t('nav.info'), icon: InfoIcon },
    { path: '/profile', label: t('nav.profile'), icon: UserIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleNavClick = () => {
    haptic.impact('light');
  };

  const handleUltimaTabChange = useCallback(
    (tab: UltimaBottomNavTab) => {
      if (!isUltimaMode || ultimaTopLevelTab === tab) {
        return;
      }

      haptic.impact('light');
      prefetchUltimaTopLevelTab(queryClient, tab);
      startTransition(() => {
        navigate(getUltimaTopLevelPath(tab));
      });
    },
    [haptic, isUltimaMode, navigate, queryClient, ultimaTopLevelTab],
  );

  // Calculate header height based on fullscreen mode (only on mobile Telegram)
  // On iOS: contentSafeAreaInset.top includes status bar + dynamic island + Telegram header
  // On Android: safeAreaInset.top only includes status bar, need to add Telegram header height (~48px)
  const telegramHeaderHeight =
    platform === 'android' ? UI.TELEGRAM_HEADER_ANDROID_PX : UI.TELEGRAM_HEADER_IOS_PX;
  const headerHeight = isMobileFullscreen
    ? 64 + Math.max(safeAreaInset.top, contentSafeAreaInset.top) + telegramHeaderHeight
    : 64;

  const handleDesktopLogoLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;

    if (naturalWidth > naturalHeight * 1.2) {
      setDesktopLogoShape('wide');
    } else if (naturalHeight > naturalWidth * 1.2) {
      setDesktopLogoShape('tall');
    } else {
      setDesktopLogoShape('square');
    }

    setDesktopLogoLoaded(true);
  }, []);

  useEffect(() => {
    setDesktopLogoShape('square');
    setDesktopLogoLoaded(false);
  }, [logoUrl]);

  useEffect(() => {
    if (!isUltimaSceneRoute || isDesktopViewport) {
      return;
    }
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [isDesktopViewport, isUltimaSceneRoute]);

  useEffect(() => {
    if (!isUltimaMode) {
      return;
    }
    // Warm core Ultima routes to avoid fallback flashes on first transition.
    void import('@/pages/Dashboard');
    void import('@/pages/Subscription');
    void import('@/pages/Support');
    void import('@/pages/Connection');
    void import('@/pages/Profile');
    void import('@/pages/Referral');
    void import('@/pages/Balance');
    void import('@/pages/TopUpMethodSelect');
    void import('@/pages/TopUpAmount');
    void import('@/pages/AccountLinking');
  }, [isUltimaMode]);

  if (!isLiteModeReady || !isUltimaModeReady) {
    return (
      <div className="min-h-screen">
        <BackgroundRenderer />
        <PageLoader variant={getCachedUltimaMode() ? 'ultima' : 'dark'} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Animated background (disabled for Ultima mode) */}
      {(!isUltimaModeReady || !isUltimaMode) && <BackgroundRenderer />}
      {isUltimaModeReady && isUltimaAnimatedRoute && (
        <div
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 74% 58%, color-mix(in srgb, var(--ultima-color-aura) 26%, transparent), color-mix(in srgb, var(--ultima-color-bg-top) 98%, #000000) 56%)',
          }}
        >
          <div className="ultima-shell-aura" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 30% 84%, color-mix(in srgb, var(--ultima-color-aura) 22%, transparent), transparent 52%), radial-gradient(circle at 84% 18%, color-mix(in srgb, var(--ultima-color-ring) 14%, transparent), transparent 48%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(160deg, color-mix(in srgb, var(--ultima-color-bg-top) 68%, #000000) 0%, color-mix(in srgb, var(--ultima-color-bg-bottom) 42%, transparent) 44%, color-mix(in srgb, var(--ultima-color-bg-top) 80%, #000000) 100%)',
            }}
          />
          {[0, 1.8, 3.6, 5.4, 7.2, 9, 10.8, 12.6, 14.4].map((delay) => (
            <div
              key={delay}
              className="ultima-ring-wave absolute left-1/2 top-1/2 h-[170vmax] w-[170vmax] -translate-x-1/2 -translate-y-1/2 transform-gpu rounded-full border"
              style={{ animationDelay: `${ultimaWavePhaseShiftSecRef.current + delay}s` }}
            />
          ))}
        </div>
      )}

      {/* Global components */}
      <WebSocketNotifications />
      <CampaignBonusNotifier />
      <SuccessNotificationModal />

      {/* Lite Mode Header */}
      {isLiteModeReady && isUltimaModeReady && hasLiteHeader && (
        <LiteModeHeader
          isFullscreen={isMobileFullscreen}
          safeAreaInset={safeAreaInset}
          contentSafeAreaInset={contentSafeAreaInset}
          telegramPlatform={platform}
        />
      )}

      {/* Desktop Header (hidden in Lite Mode, hidden until mode is determined) */}
      <header
        className={cn(
          'fixed left-0 right-0 top-0 z-50 border-b border-dark-800/50 bg-dark-950/80 backdrop-blur-xl',
          !isLiteModeReady || !isUltimaModeReady || isCompactMode ? 'hidden' : 'hidden lg:block',
        )}
      >
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-6">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5"
            onClick={handleNavClick}
            aria-label={appName || 'Home'}
            title={appName || undefined}
          >
            <div
              className={cn(
                'relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-dark-800',
                hasCustomLogo
                  ? desktopLogoShape === 'wide'
                    ? 'h-8 w-12'
                    : desktopLogoShape === 'tall'
                      ? 'h-9 w-7'
                      : 'h-8 w-8'
                  : 'h-8 w-8',
              )}
            >
              <span
                className={cn(
                  'absolute text-sm font-bold text-accent-400 transition-opacity duration-200',
                  hasCustomLogo && desktopLogoLoaded ? 'opacity-0' : 'opacity-100',
                )}
              >
                {logoLetter}
              </span>
              {hasCustomLogo && logoUrl && (
                <img
                  src={logoUrl}
                  alt={appName || 'Logo'}
                  className={cn(
                    'absolute h-full w-full object-contain transition-opacity duration-200',
                    desktopLogoLoaded ? 'opacity-100' : 'opacity-0',
                  )}
                  onLoad={handleDesktopLogoLoad}
                />
              )}
            </div>
            {!isMainPage ? (
              <span className="text-base font-semibold text-dark-100">{appName}</span>
            ) : (
              <span className="sr-only">{appName}</span>
            )}
          </Link>

          {/* Center Navigation */}
          <nav className="flex items-center justify-center gap-1">
            {desktopNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-dark-800 text-dark-50'
                    : 'text-dark-400 hover:bg-dark-800/50 hover:text-dark-200',
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            {referralEnabled && (
              <Link
                to="/referral"
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive('/referral')
                    ? 'bg-dark-800 text-dark-50'
                    : 'text-dark-400 hover:bg-dark-800/50 hover:text-dark-200',
                )}
              >
                <UsersIcon className="h-4 w-4" />
                <span>{t('nav.referral')}</span>
              </Link>
            )}
            {isAdmin && (
              <>
                {/* Separator before admin */}
                <div className="mx-2 h-5 w-px bg-dark-700" />
                <Link
                  to="/admin"
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    location.pathname.startsWith('/admin')
                      ? 'bg-warning-500/10 text-warning-400'
                      : 'text-warning-500/70 hover:bg-warning-500/10 hover:text-warning-400',
                  )}
                >
                  <ShieldIcon className="h-4 w-4" />
                  <span>{t('admin.nav.title')}</span>
                </Link>
              </>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                haptic.impact('light');
                toggleTheme();
              }}
              className={cn(
                'rounded-xl border border-dark-700/50 bg-dark-800/50 p-2 text-dark-400 transition-all duration-200 hover:bg-dark-700 hover:text-accent-400',
                !canToggleTheme && 'pointer-events-none invisible',
              )}
              title={isDark ? t('theme.light') || 'Light mode' : t('theme.dark') || 'Dark mode'}
            >
              {isDark ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
            </button>
            <TicketNotificationBell isAdmin={location.pathname.startsWith('/admin')} />
            <LanguageSwitcher />
            <button
              onClick={() => {
                haptic.impact('light');
                logout();
              }}
              className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-2 text-dark-400 transition-all duration-200 hover:bg-dark-700 hover:text-accent-400"
              title={t('nav.logout')}
            >
              <LogoutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Header (hidden in Lite Mode, wait for mode to be determined) */}
      {isLiteModeReady && isUltimaModeReady && hasRegularHeader && (
        <AppHeader
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          onCommandPaletteOpen={() => {}}
          headerHeight={headerHeight}
          isFullscreen={isMobileFullscreen}
          safeAreaInset={safeAreaInset}
          contentSafeAreaInset={contentSafeAreaInset}
          telegramPlatform={platform}
          wheelEnabled={wheelEnabled}
          referralEnabled={referralEnabled}
          hasContests={hasContests}
          hasPolls={hasPolls}
          giftEnabled={giftEnabled}
        />
      )}

      {/* Desktop spacer */}
      <div className="hidden h-14 lg:block" />

      {/* Mobile spacer */}
      <div
        className="lg:hidden"
        style={{
          height: hasLiteHeader
            ? isCompactMainPage
              ? Math.max(headerHeight - 10, 0)
              : headerHeight
            : hasRegularHeader
              ? headerHeight
              : 6,
        }}
      />

      {/* Main content */}
      <main
        className={cn(
          'relative z-10 mx-auto max-w-6xl px-4 lg:px-6 lg:pb-8',
          isUltimaMode && 'max-w-none px-0 lg:px-0',
          isUltimaMode ? 'pb-0' : isCompactMode ? 'pb-8' : 'pb-28',
          isUltimaMode
            ? 'pt-0'
            : isCompactMainPage
              ? 'pt-0 sm:pt-1'
              : isCompactMode
                ? 'pt-2 sm:pt-3'
                : 'pt-6',
        )}
        style={
          shouldShowUltimaSharedNav
            ? { ['--ultima-shell-bottom-gap' as string]: ULTIMA_SHARED_NAV_BOTTOM_GAP }
            : undefined
        }
      >
        {isLiteModeReady &&
        isUltimaModeReady &&
        isLiteMode &&
        !isUltimaMode &&
        !isUltimaSceneRoute ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(1px)' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        ) : (
          children
        )}
      </main>

      {shouldShowUltimaSharedNav && ultimaTopLevelTab ? (
        <div
          className={cn(
            'ultima-shared-nav-shell',
            isKeyboardOpen && 'pointer-events-none translate-y-3 opacity-0',
          )}
        >
          <UltimaBottomNav
            active={ultimaTopLevelTab}
            onHomeClick={() => handleUltimaTabChange('home')}
            onConnectionClick={() => handleUltimaTabChange('connection')}
            onProfileClick={() => handleUltimaTabChange('profile')}
            onSupportClick={() => handleUltimaTabChange('support')}
          />
        </div>
      ) : null}

      {/* Mobile Bottom Navigation (regular mode) */}
      {isLiteModeReady && isUltimaModeReady && !isCompactMode && (
        <MobileBottomNav
          isKeyboardOpen={isKeyboardOpen}
          referralEnabled={referralEnabled}
          wheelEnabled={wheelEnabled}
        />
      )}
    </div>
  );
}
