import { useState } from 'react';
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
import { subscriptionApi } from '@/api/subscription';
import { balanceApi } from '@/api/balance';
import { useCurrency } from '@/hooks/useCurrency';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { LiteModeMenu } from './LiteModeMenu';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(() => isLogoPreloaded());

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

  // Subscription
  const { data: subscriptionResponse } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getSubscription,
    staleTime: 30000,
  });

  const appName = branding ? branding.name : FALLBACK_NAME;
  const logoLetter = branding?.logo_letter || FALLBACK_LOGO;
  const hasCustomLogo = branding?.has_custom_logo || false;
  const logoUrl = branding ? brandingApi.getLogoUrl(branding) : null;

  const subscription = subscriptionResponse?.subscription;
  const balance = balanceData?.balance_kopeks ?? 0;

  const getSubscriptionStatus = () => {
    if (!subscription) return null;

    if (subscription.is_trial) {
      return (
        <span className="rounded-full bg-warning-500/20 px-2 py-0.5 text-xs font-medium text-warning-400">
          {t('lite.subscriptionTrial')}
        </span>
      );
    }

    if (subscription.is_expired) {
      return (
        <span className="rounded-full bg-error-500/20 px-2 py-0.5 text-xs font-medium text-error-400">
          {t('lite.subscriptionExpired')}
        </span>
      );
    }

    if (subscription.days_left > 0) {
      return (
        <span className="rounded-full bg-success-500/20 px-2 py-0.5 text-xs font-medium text-success-400">
          {t('lite.daysLeft', { count: subscription.days_left })}
        </span>
      );
    }

    if (subscription.hours_left > 0) {
      return (
        <span className="rounded-full bg-warning-500/20 px-2 py-0.5 text-xs font-medium text-warning-400">
          {t('lite.hoursLeft', { count: subscription.hours_left })}
        </span>
      );
    }

    return null;
  };

  const isAdminPage = location.pathname.startsWith('/admin');
  const isMainPage = location.pathname === '/';

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
        <div className="mx-auto w-full px-4">
          <div className="flex h-16 items-center justify-between">
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
              >
                <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-linear-lg border border-dark-700/50 bg-dark-800/80 shadow-md">
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
                      onLoad={() => setLogoLoaded(true)}
                    />
                  )}
                </div>
                {appName && (
                  <span className="hidden whitespace-nowrap text-base font-semibold text-dark-100 sm:block">
                    {appName}
                  </span>
                )}
              </Link>
            )}

            {/* Center: Balance & Status */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-semibold text-dark-100">
                  {formatWithCurrency(balance / 100)}
                </div>
              </div>
              {getSubscriptionStatus()}
            </div>

            {/* Right: Admin link + Menu */}
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link
                  to="/admin"
                  className={cn(
                    'rounded-xl p-2.5 transition-all duration-200',
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
                  'rounded-xl p-2.5 transition-all duration-200',
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

      <LiteModeMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
