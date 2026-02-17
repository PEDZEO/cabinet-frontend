import { useState, useEffect, useCallback, type SyntheticEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  brandingApi,
  getCachedBranding,
  setCachedBranding,
  preloadLogo,
  isLogoPreloaded,
} from '@/api/branding';
import { balanceApi } from '@/api/balance';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { LiteModeMenu } from './LiteModeMenu';
import LanguageSwitcher from '@/components/LanguageSwitcher';

import type { TelegramPlatform } from '@/hooks/useTelegramSDK';

const FALLBACK_NAME = import.meta.env.VITE_APP_NAME || 'Cabinet';
const FALLBACK_LOGO = import.meta.env.VITE_APP_LOGO || 'V';

// Icons
const MenuIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const BackIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

const AdminIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SunIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

interface LiteModeHeaderProps {
  headerHeight: number;
  isFullscreen: boolean;
  safeAreaInset: { top: number; bottom: number; left: number; right: number };
  contentSafeAreaInset: { top: number; bottom: number; left: number; right: number };
  telegramPlatform?: TelegramPlatform;
}

export function LiteModeHeader({
  isFullscreen,
  safeAreaInset,
  contentSafeAreaInset,
  telegramPlatform,
}: LiteModeHeaderProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const { formatWithCurrency } = useCurrency();
  const { toggleTheme, isDark, canToggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(() => isLogoPreloaded());
  const [logoShape, setLogoShape] = useState<'square' | 'wide' | 'tall'>('square');

  // Branding
  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: async () => {
      const data = await brandingApi.getBranding();
      setCachedBranding(data);
      await preloadLogo(data);
      return data;
    },
    initialData: getCachedBranding() ?? undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });

  // Balance
  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: 30000,
  });

  const appName = branding ? branding.name : FALLBACK_NAME;
  const logoLetter = branding?.logo_letter || FALLBACK_LOGO;
  const hasCustomLogo = branding?.has_custom_logo || false;
  const logoUrl = branding ? brandingApi.getLogoUrl(branding) : null;

  const balance = balanceData?.balance_kopeks ?? 0;

  const handleLogoLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;

    if (naturalWidth > naturalHeight * 1.2) {
      setLogoShape('wide');
    } else if (naturalHeight > naturalWidth * 1.2) {
      setLogoShape('tall');
    } else {
      setLogoShape('square');
    }

    setLogoLoaded(true);
  }, []);

  useEffect(() => {
    setLogoShape('square');
    setLogoLoaded(false);
  }, [logoUrl]);

  const isAdminPage = location.pathname.startsWith('/admin');
  const isMainPage = location.pathname === '/';

  // Calculate full header height for menu positioning
  const telegramHeaderHeight = telegramPlatform === 'android' ? 48 : 45;
  const calculatedHeaderHeight = isFullscreen
    ? 64 + Math.max(safeAreaInset.top, contentSafeAreaInset.top) + telegramHeaderHeight
    : 64;

  return (
    <>
      <header
        className="glass fixed left-0 right-0 top-0 z-50 shadow-lg shadow-black/10"
        style={{
          paddingTop: isFullscreen
            ? `${Math.max(safeAreaInset.top, contentSafeAreaInset.top) + (telegramPlatform === 'android' ? 48 : 45)}px`
            : undefined,
        }}
      >
        <div className="mx-auto w-full px-3 min-[360px]:px-4">
          <div className="flex h-16 items-center justify-between gap-1.5 min-[360px]:gap-2">
            {/* Back button or Logo */}
            {!isMainPage ? (
              <button
                onClick={() => navigate(-1)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-dark-300 transition-colors hover:bg-dark-800 hover:text-dark-100 active:scale-[0.98]"
                aria-label={t('common.back')}
              >
                <BackIcon />
              </button>
            ) : (
              <Link
                to="/"
                className={cn('flex flex-shrink-0 items-center gap-2.5', !appName && 'mr-4')}
                aria-label={appName || 'Home'}
                title={appName || undefined}
              >
                <div
                  className={cn(
                    'relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-linear-lg border border-dark-700/50 bg-dark-800/80 shadow-md',
                    hasCustomLogo
                      ? logoShape === 'wide'
                        ? 'h-10 w-14'
                        : logoShape === 'tall'
                          ? 'h-11 w-9'
                          : 'h-10 w-10'
                      : 'h-10 w-10',
                  )}
                >
                  <span
                    className={cn(
                      'absolute text-lg font-bold text-accent-400 transition-opacity duration-200',
                      hasCustomLogo && logoLoaded ? 'opacity-0' : 'opacity-100',
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
                        logoLoaded ? 'opacity-100' : 'opacity-0',
                      )}
                      onLoad={handleLogoLoad}
                    />
                  )}
                </div>
                {appName && !isMainPage ? (
                  <span className="hidden whitespace-nowrap text-base font-semibold text-dark-100 sm:block">
                    {appName}
                  </span>
                ) : (
                  <span className="sr-only">{appName}</span>
                )}
              </Link>
            )}

            {/* Center: Balance */}
            <Link
              to="/"
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-1.5 py-1 transition-colors hover:bg-dark-800/50 active:scale-[0.98] min-[360px]:gap-2 min-[360px]:px-2"
            >
              <div className="text-right">
                <div className="text-xs font-semibold text-dark-100 min-[360px]:text-sm">
                  {formatWithCurrency(balance / 100)}
                </div>
              </div>
            </Link>

            {/* Right: Language + Theme + Admin link + Menu */}
            <div className="flex flex-shrink-0 items-center gap-1 min-[360px]:gap-2">
              <div className="hidden min-[390px]:block">
                <LanguageSwitcher />
              </div>
              <button
                onClick={toggleTheme}
                className={cn(
                  'rounded-xl p-2 transition-all duration-200 min-[360px]:p-2.5',
                  !canToggle && 'pointer-events-none invisible',
                  'text-dark-400 hover:bg-dark-800 hover:text-dark-100',
                )}
                title={isDark ? t('theme.light') || 'Light mode' : t('theme.dark') || 'Dark mode'}
                aria-label={
                  isDark ? t('theme.light') || 'Switch to light mode' : t('theme.dark') || 'Switch to dark mode'
                }
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={cn(
                    'rounded-xl p-2 transition-all duration-200 min-[360px]:p-2.5',
                    isAdminPage
                      ? 'bg-warning-500/20 text-warning-400'
                      : 'text-warning-500/70 hover:bg-dark-800 hover:text-warning-400',
                  )}
                  title={t('admin.nav.title')}
                >
                  <AdminIcon />
                </Link>
              )}

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={cn(
                  'rounded-xl p-2 transition-all duration-200 min-[360px]:p-2.5',
                  menuOpen
                    ? 'bg-dark-700 text-dark-100'
                    : 'text-dark-400 hover:bg-dark-800 hover:text-dark-100',
                )}
                aria-label={t('lite.menu')}
              >
                <MenuIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      <LiteModeMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        headerHeight={calculatedHeaderHeight}
      />
    </>
  );
}
