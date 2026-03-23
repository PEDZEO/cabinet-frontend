import { type CSSProperties } from 'react';
import { useNavigate } from 'react-router';

type UltimaBottomNavTab = 'home' | 'connection' | 'profile' | 'support';

type UltimaBottomNavProps = {
  active: UltimaBottomNavTab;
  onHomeClick?: () => void;
  onConnectionClick?: () => void;
  onProfileClick?: () => void;
  onSupportClick?: () => void;
};

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const GearIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const SupportIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M5 17.5V12a7 7 0 1 1 14 0v5.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M8 17.5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export function UltimaBottomNav({
  active,
  onHomeClick,
  onConnectionClick,
  onProfileClick,
  onSupportClick,
}: UltimaBottomNavProps) {
  const navigate = useNavigate();

  const getButtonClassName = () =>
    'flex h-11 items-center justify-center rounded-[16px] border text-[var(--ultima-color-nav-text)] transition-[background-color,border-color,color,box-shadow] duration-200';

  const getButtonStyle = (isActive: boolean): CSSProperties => {
    return {
      backgroundColor: isActive
        ? 'var(--ultima-color-nav-active)'
        : 'color-mix(in srgb, var(--ultima-color-nav-bg) 72%, transparent)',
      borderColor: isActive
        ? 'color-mix(in srgb, var(--ultima-color-ring) 35%, transparent)'
        : 'color-mix(in srgb, var(--ultima-color-surface-border) 22%, transparent)',
      color: isActive
        ? 'var(--ultima-color-primary-text)'
        : 'color-mix(in srgb, var(--ultima-color-nav-text) 86%, #ffffff)',
      ...(isActive
        ? {
            boxShadow:
              '0 8px 20px color-mix(in srgb, var(--ultima-color-nav-active) 34%, transparent), inset 0 1px 0 rgba(255,255,255,0.24)',
          }
        : {
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }),
    };
  };

  return (
    <nav
      className="ultima-bottom-nav grid grid-cols-4 gap-1.5 rounded-[22px] p-1.5 shadow-[0_14px_34px_rgba(3,9,18,0.45),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl"
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
        className={getButtonClassName()}
        style={getButtonStyle(active === 'home')}
        onClick={onHomeClick ?? (() => navigate('/'))}
        aria-label="ultima-nav-home"
        aria-current={active === 'home' ? 'page' : undefined}
      >
        <GridIcon />
      </button>
      <button
        type="button"
        data-ultima-nav-btn="1"
        className={getButtonClassName()}
        style={getButtonStyle(active === 'connection')}
        onClick={onConnectionClick ?? (() => navigate('/connection'))}
        aria-label="ultima-nav-connection"
        aria-current={active === 'connection' ? 'page' : undefined}
      >
        <GearIcon />
      </button>
      <button
        type="button"
        data-ultima-nav-btn="1"
        className={getButtonClassName()}
        style={getButtonStyle(active === 'profile')}
        onClick={onProfileClick ?? (() => navigate('/profile'))}
        aria-label="ultima-nav-profile"
        aria-current={active === 'profile' ? 'page' : undefined}
      >
        <ProfileIcon />
      </button>
      <button
        type="button"
        data-ultima-nav-btn="1"
        className={getButtonClassName()}
        style={getButtonStyle(active === 'support')}
        onClick={onSupportClick ?? (() => navigate('/support'))}
        aria-label="ultima-nav-support"
        aria-current={active === 'support' ? 'page' : undefined}
      >
        <SupportIcon />
      </button>
    </nav>
  );
}
