import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Headphones, LayoutDashboard, Newspaper, Settings2, UserRound } from 'lucide-react';
import type { UltimaBottomNavTab } from '@/features/ultima/navigation';

type UltimaBottomNavProps = {
  active: UltimaBottomNavTab;
  onHomeClick?: () => void;
  onConnectionClick?: () => void;
  onNewsClick?: () => void;
  onProfileClick?: () => void;
  onSupportClick?: () => void;
};

export function UltimaBottomNav({
  active,
  onHomeClick,
  onConnectionClick,
  onNewsClick,
  onProfileClick,
  onSupportClick,
}: UltimaBottomNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const navLabels: Record<UltimaBottomNavTab, string> = {
    home: t('nav.dashboard', { defaultValue: 'Главная' }),
    connection: t('lite.connect', { defaultValue: 'Подключиться' }),
    news: t('nav.info', { defaultValue: 'Информация' }),
    profile: t('nav.profile', { defaultValue: 'Профиль' }),
    support: t('nav.support', { defaultValue: 'Поддержка' }),
  };

  const getButtonClassName = (isActive: boolean) =>
    isActive
      ? 'flex h-10 items-center justify-center rounded-[15px] border transition-colors duration-150 active:scale-[0.985] lg:h-11 lg:rounded-[8px] xl:justify-start xl:gap-3 xl:px-3'
      : 'flex h-10 items-center justify-center rounded-[15px] transition-colors duration-150 hover:bg-white/[0.07] active:scale-[0.985] lg:h-11 lg:rounded-[8px] xl:justify-start xl:gap-3 xl:px-3';

  const getButtonStyle = (isActive: boolean) => {
    return {
      ...(isActive
        ? {
            backgroundColor: 'var(--ultima-color-nav-active)',
            borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 28%, transparent)',
            color: 'var(--ultima-color-primary-text)',
            boxShadow:
              '0 6px 16px color-mix(in srgb, var(--ultima-color-nav-active) 22%, transparent), inset 0 1px 0 rgba(255,255,255,0.16)',
          }
        : {
            color: 'color-mix(in srgb, var(--ultima-color-nav-text) 78%, transparent)',
          }),
    };
  };

  return (
    <nav
      className="ultima-bottom-nav grid grid-cols-5 items-center gap-1 rounded-[20px] p-1 shadow-[0_14px_34px_rgba(3,9,18,0.45),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl lg:grid-cols-1 lg:gap-1.5 lg:rounded-[8px] lg:p-0 lg:shadow-none lg:backdrop-blur-none"
      style={{
        background: `linear-gradient(
          180deg,
          color-mix(in srgb, var(--ultima-color-nav-bg) 76%, transparent),
          color-mix(in srgb, var(--ultima-color-nav-bg) 92%, #000)
        )`,
        color: 'var(--ultima-color-nav-text)',
      }}
    >
      <button
        type="button"
        data-ultima-nav-btn="1"
        className={getButtonClassName(active === 'home')}
        style={getButtonStyle(active === 'home')}
        onClick={onHomeClick ?? (() => navigate('/'))}
        aria-label={navLabels.home}
        title={navLabels.home}
      >
        <LayoutDashboard className="h-5 w-5 shrink-0" strokeWidth={1.8} />
        <span className="hidden min-w-0 truncate text-sm font-medium xl:inline">
          {navLabels.home}
        </span>
      </button>
      <button
        type="button"
        data-ultima-nav-btn="1"
        className={getButtonClassName(active === 'connection')}
        style={getButtonStyle(active === 'connection')}
        onClick={onConnectionClick ?? (() => navigate('/connection'))}
        aria-label={navLabels.connection}
        title={navLabels.connection}
      >
        <Settings2 className="h-5 w-5 shrink-0" strokeWidth={1.8} />
        <span className="hidden min-w-0 truncate text-sm font-medium xl:inline">
          {navLabels.connection}
        </span>
      </button>
      <button
        type="button"
        data-ultima-nav-btn="1"
        className={getButtonClassName(active === 'news')}
        style={getButtonStyle(active === 'news')}
        onClick={onNewsClick ?? (() => navigate('/ultima/news'))}
        aria-label={navLabels.news}
        title={navLabels.news}
      >
        <Newspaper className="h-5 w-5 shrink-0" strokeWidth={1.8} />
        <span className="hidden min-w-0 truncate text-sm font-medium xl:inline">
          {navLabels.news}
        </span>
      </button>
      <button
        type="button"
        data-ultima-nav-btn="1"
        className={getButtonClassName(active === 'profile')}
        style={getButtonStyle(active === 'profile')}
        onClick={onProfileClick ?? (() => navigate('/profile'))}
        aria-label={navLabels.profile}
        title={navLabels.profile}
      >
        <UserRound className="h-5 w-5 shrink-0" strokeWidth={1.8} />
        <span className="hidden min-w-0 truncate text-sm font-medium xl:inline">
          {navLabels.profile}
        </span>
      </button>
      <button
        type="button"
        data-ultima-nav-btn="1"
        className={getButtonClassName(active === 'support')}
        style={getButtonStyle(active === 'support')}
        onClick={onSupportClick ?? (() => navigate('/support'))}
        aria-label={navLabels.support}
        title={navLabels.support}
      >
        <Headphones className="h-5 w-5 shrink-0" strokeWidth={1.8} />
        <span className="hidden min-w-0 truncate text-sm font-medium xl:inline">
          {navLabels.support}
        </span>
      </button>
    </nav>
  );
}
