import { type ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type UltimaDesktopWorkspaceProps = {
  bottomNav: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
};

export function UltimaDesktopRail({ bottomNav }: { bottomNav: ReactNode }) {
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

      <div className="ultima-desktop-navigation">{bottomNav}</div>

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

      <main className="ultima-desktop-main">{children}</main>

      {aside ? <aside className="ultima-desktop-context">{aside}</aside> : null}
    </div>
  );
}
