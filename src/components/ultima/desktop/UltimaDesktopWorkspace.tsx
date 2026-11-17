import { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { balanceApi } from '@/api/balance';
import { useBranding } from '@/hooks/useBranding';
import { useBrandLogoImage } from '@/hooks/useBrandLogoImage';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

type UltimaDesktopWorkspaceProps = {
  bottomNav: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
};

export function UltimaDesktopRail(_props: { bottomNav: ReactNode }) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const { appName, logoLetter, hasCustomLogo, logoUrl } = useBranding();
  const { isLoaded, hasError, handleLoad, handleError } = useBrandLogoImage(logoUrl);
  const showLogo = Boolean(hasCustomLogo && logoUrl && !hasError);
  const items = [
    ['home', '/', t('ultima.web.overview', { defaultValue: 'Обзор' })],
    [
      'subscription',
      '/ultima/subscription-info',
      t('ultima.web.subscriptionPayment', { defaultValue: 'Подписка и оплата' }),
    ],
    ['connection', '/connection', t('ultima.web.connection', { defaultValue: 'Подключение' })],
    ['devices', '/ultima/devices', t('ultima.web.devices', { defaultValue: 'Устройства' })],
    ['balance', '/balance', t('ultima.web.payments', { defaultValue: 'Баланс и платежи' })],
    ['support', '/support', t('nav.support')],
    ['profile', '/profile', t('ultima.web.account', { defaultValue: 'Аккаунт' })],
    ['news', '/ultima/news', t('nav.news')],
  ];
  return (
    <aside className="ultima-desktop-rail" aria-label={appName}>
      <Link to="/" className="ultima-desktop-brand">
        {showLogo ? (
          <img
            src={logoUrl ?? undefined}
            alt=""
            className={cn('ultima-web-brand-image', !isLoaded && 'opacity-0')}
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : (
          <span className="ultima-web-brand-letter" aria-hidden="true">
            {logoLetter}
          </span>
        )}
        <span className="ultima-desktop-brand-copy">
          <strong>{appName}</strong>
          <small>{t('ultima.web.cabinet', { defaultValue: 'Личный кабинет' })}</small>
        </span>
      </Link>
      <nav
        className="ultima-desktop-navigation ultima-web-navigation"
        aria-label={t('nav.mainNavigation')}
      >
        {items.map(([id, path, label]) => {
          const selected =
            id === 'subscription'
              ? pathname.startsWith('/subscription') || pathname === path
              : id === 'home'
                ? pathname === '/'
                : pathname === path || pathname.startsWith(path + '/');
          return (
            <Link
              key={id}
              to={path}
              data-ultima-nav-btn="1"
              data-ultima-nav-target={id}
              aria-current={selected ? 'page' : undefined}
              className={cn(
                'ultima-web-nav-link',
                selected && 'is-active',
                id === 'news' && 'is-secondary',
              )}
            >
              <span>{label}</span>
            </Link>
          );
        })}
        {isAdmin ? (
          <Link
            to="/admin"
            className="ultima-desktop-admin-link"
            data-testid="ultima-desktop-admin-link"
          >
            {t('admin.nav.title', { defaultValue: 'Администрирование' })}
          </Link>
        ) : null}
      </nav>
      <p className="ultima-web-rail-note">
        {t('ultima.web.railNote', {
          defaultValue: 'Всё для вашего подключения — в одном кабинете.',
        })}
      </p>
    </aside>
  );
}

function getWorkspaceTitle(pathname: string): string {
  if (pathname === '/') return 'Главная';
  if (pathname.startsWith('/subscription')) return 'Тарифы и оплата';
  if (pathname.startsWith('/connection')) return 'Подключение';
  if (pathname.startsWith('/ultima/devices')) return 'Устройства';
  if (pathname.startsWith('/ultima/news')) return 'Новости';
  if (pathname.startsWith('/support')) return 'Поддержка';
  if (pathname.startsWith('/profile')) return 'Профиль';
  if (pathname.startsWith('/referral')) return 'Реферальная программа';
  if (pathname.startsWith('/balance')) return 'Баланс';
  if (pathname.startsWith('/ultima/subscription-info')) return 'Подписка';
  return 'Личный кабинет';
}

export function UltimaDesktopTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { data: balance } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: 15000,
  });
  const pageTitle = getWorkspaceTitle(location.pathname);
  const balanceKopeks = balance?.balance_kopeks ?? user?.balance_kopeks;
  const balanceLabel =
    typeof balanceKopeks === 'number'
      ? new Intl.NumberFormat(i18n.resolvedLanguage || i18n.language || 'ru', {
          style: 'currency',
          currency: 'RUB',
          maximumFractionDigits: balanceKopeks % 100 === 0 ? 0 : 2,
        }).format(balanceKopeks / 100)
      : '—';

  return (
    <header className="ultima-desktop-topbar">
      <div className="ultima-desktop-breadcrumb">
        <span>{pageTitle}</span>
      </div>
      <div className="ultima-cabinet-account-actions">
        <button
          type="button"
          onClick={() => navigate('/balance')}
          className="ultima-cabinet-balance"
        >
          <span>{t('nav.balance', { defaultValue: 'Баланс' })}</span>
          <strong>{balanceLabel}</strong>
        </button>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="ultima-cabinet-avatar"
          aria-label={t('nav.profile', { defaultValue: 'Профиль' })}
        >
          {(user?.first_name || user?.username || user?.email || '?').slice(0, 1).toUpperCase()}
        </button>
      </div>
    </header>
  );
}

export function UltimaDesktopWorkspace({
  bottomNav,
  children,
  aside,
  className,
}: UltimaDesktopWorkspaceProps) {
  return (
    <div
      className={cn(
        'ultima-shell-inner ultima-desktop-workspace',
        !aside && 'ultima-desktop-workspace-no-context',
        className,
      )}
    >
      <UltimaDesktopRail bottomNav={bottomNav} />

      <div className="ultima-desktop-stage">
        <UltimaDesktopTopbar />

        <div className={cn('ultima-desktop-stage-body', aside && 'has-context')}>
          <main className="ultima-desktop-main">{children}</main>
          {aside ? <aside className="ultima-desktop-context">{aside}</aside> : null}
        </div>
      </div>
    </div>
  );
}
