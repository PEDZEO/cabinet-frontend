import { type ReactNode } from 'react';
import { ChevronRight, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
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

export function UltimaDesktopRail({ bottomNav }: { bottomNav: ReactNode }) {
  const navigate = useNavigate();
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const { appName, logoLetter, hasCustomLogo, logoUrl } = useBranding();
  const { isLoaded, hasError, handleLoad, handleError } = useBrandLogoImage(logoUrl);
  const showLogo = Boolean(hasCustomLogo && logoUrl && !hasError);

  return (
    <aside className="ultima-desktop-rail" aria-label={appName}>
      <div className="ultima-desktop-brand">
        <span className="ultima-desktop-brand-mark" aria-hidden>
          {showLogo ? (
            <img
              src={logoUrl ?? undefined}
              alt=""
              className={cn(
                'h-full w-full object-contain transition-opacity',
                isLoaded ? 'opacity-100' : 'opacity-0',
              )}
              onLoad={handleLoad}
              onError={handleError}
            />
          ) : (
            <span className="ultima-desktop-brand-letter">{logoLetter}</span>
          )}
        </span>
        <span className="ultima-desktop-brand-copy">
          <strong title={appName}>{appName}</strong>
        </span>
      </div>

      <div className="ultima-desktop-navigation">
        <span className="ultima-desktop-navigation-label">Навигация</span>
        {bottomNav}
        {isAdmin ? (
          <button
            type="button"
            className="ultima-desktop-admin-link"
            onClick={() => navigate('/admin')}
            aria-label="Админка"
            title="Админка"
            data-testid="ultima-desktop-admin-link"
          >
            <Settings size={18} strokeWidth={1.8} aria-hidden />
            <span>Админка</span>
          </button>
        ) : null}
      </div>
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
  const { appName } = useBranding();
  const pageTitle = getWorkspaceTitle(location.pathname);

  return (
    <header className="ultima-desktop-topbar">
      <div className="ultima-desktop-breadcrumb">
        <span>{appName}</span>
        <ChevronRight className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        <strong>{pageTitle}</strong>
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
