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

  const getButtonClassName = (isActive: boolean) =>
    isActive
      ? 'flex h-11 items-center justify-center rounded-[16px] border border-[#7af4d4]/35 bg-[#1bd29f] text-white shadow-[0_8px_20px_rgba(20,209,157,0.32),inset_0_1px_0_rgba(255,255,255,0.24)] transition-transform active:scale-[0.98]'
      : 'flex h-11 items-center justify-center rounded-[16px] text-white/78 transition hover:bg-white/8 active:scale-[0.98]';

  return (
    <nav className="ultima-bottom-nav grid grid-cols-4 gap-1.5 rounded-[22px] bg-[linear-gradient(180deg,rgba(24,92,76,0.76),rgba(10,48,40,0.92))] p-1.5 text-white/80 shadow-[0_14px_34px_rgba(3,9,18,0.45),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl">
      <button
        type="button"
        data-ultima-nav-btn="1"
        className={getButtonClassName(active === 'home')}
        onClick={onHomeClick ?? (() => navigate('/'))}
        aria-label="ultima-nav-home"
      >
        <GridIcon />
      </button>
      <button
        type="button"
        data-ultima-nav-btn="1"
        className={getButtonClassName(active === 'connection')}
        onClick={onConnectionClick ?? (() => navigate('/connection'))}
        aria-label="ultima-nav-connection"
      >
        <GearIcon />
      </button>
      <button
        type="button"
        data-ultima-nav-btn="1"
        className={getButtonClassName(active === 'profile')}
        onClick={onProfileClick ?? (() => navigate('/profile'))}
        aria-label="ultima-nav-profile"
      >
        <ProfileIcon />
      </button>
      <button
        type="button"
        data-ultima-nav-btn="1"
        className={getButtonClassName(active === 'support')}
        onClick={onSupportClick ?? (() => navigate('/support'))}
        aria-label="ultima-nav-support"
      >
        <SupportIcon />
      </button>
    </nav>
  );
}
