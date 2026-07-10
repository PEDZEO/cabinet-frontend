import { type ReactNode } from 'react';
import { ChevronRight, CreditCard, Settings, ShieldCheck, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
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

  return (
    <aside className="ultima-desktop-rail" aria-label="Ultimteam">
      <div className="ultima-desktop-brand">
        <span className="ultima-desktop-brand-mark" aria-hidden>
          <ShieldCheck size={20} strokeWidth={1.8} />
        </span>
        <span className="ultima-desktop-brand-copy">
          <strong>Ultimteam</strong>
          <small>VPN кабинет</small>
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

      <div className="ultima-desktop-rail-status">
        <span aria-hidden />
        <div>
          <strong>Сервис работает</strong>
          <small>Защищённое подключение</small>
        </div>
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
  const navigate = useNavigate();
  const pageTitle = getWorkspaceTitle(location.pathname);

  return (
    <header className="ultima-desktop-topbar">
      <div className="ultima-desktop-breadcrumb">
        <span>Ultimteam</span>
        <ChevronRight className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        <strong>{pageTitle}</strong>
      </div>

      <div className="ultima-desktop-topbar-actions">
        <div className="ultima-desktop-security-label">
          <ShieldCheck className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          <span>Защищенный кабинет</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/subscription')}
          aria-label="Тарифы и оплата"
          title="Тарифы и оплата"
        >
          <CreditCard className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          aria-label="Профиль"
          title="Профиль"
        >
          <UserRound className="h-[18px] w-[18px]" strokeWidth={1.8} />
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
