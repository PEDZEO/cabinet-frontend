import { type CSSProperties, type PointerEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import type { UltimaBottomNavTab } from '@/features/ultima/navigation';

type UltimaBottomNavProps = {
  active: UltimaBottomNavTab;
  onHomeClick?: () => void;
  onConnectionClick?: () => void;
  onNewsClick?: () => void;
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

const NewspaperIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M6 5.5h11.25A1.75 1.75 0 0 1 19 7.25V18a2.5 2.5 0 0 1-2.5 2.5H8A3 3 0 0 1 5 17.5V7.5A2 2 0 0 1 7 5.5h.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 9h7M8.5 12h7M8.5 15h4.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <rect x="14.5" y="8.5" width="2.5" height="2.5" rx="0.4" fill="currentColor" />
  </svg>
);

export function UltimaBottomNav({
  active,
  onHomeClick,
  onConnectionClick,
  onNewsClick,
  onProfileClick,
  onSupportClick,
}: UltimaBottomNavProps) {
  const navigate = useNavigate();
  const [magnetOffset, setMagnetOffset] = useState<
    Record<UltimaBottomNavTab, { x: number; y: number }>
  >({
    home: { x: 0, y: 0 },
    connection: { x: 0, y: 0 },
    news: { x: 0, y: 0 },
    profile: { x: 0, y: 0 },
    support: { x: 0, y: 0 },
  });

  const getButtonClassName = (isActive: boolean) =>
    isActive
      ? 'flex h-10 items-center justify-center rounded-[15px] border text-[var(--ultima-color-primary-text)] shadow-[0_8px_20px_rgba(20,209,157,0.32),inset_0_1px_0_rgba(255,255,255,0.24)] translate-y-[-1px] transition-all duration-200 active:translate-y-0 active:scale-[0.985]'
      : 'flex h-10 items-center justify-center rounded-[15px] text-[var(--ultima-color-nav-text)]/78 transition-all duration-200 hover:bg-white/8 hover:translate-y-[-1px] active:translate-y-0 active:scale-[0.985]';

  const handlePointerMove =
    (tab: UltimaBottomNavTab) => (event: PointerEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = Math.max(-3, Math.min(3, (event.clientX - centerX) * 0.16));
      const y = Math.max(-2.4, Math.min(2.4, (event.clientY - centerY) * 0.14));
      setMagnetOffset((prev) => ({ ...prev, [tab]: { x, y } }));
    };

  const resetMagnet = (tab: UltimaBottomNavTab) => () => {
    setMagnetOffset((prev) => ({ ...prev, [tab]: { x: 0, y: 0 } }));
  };

  const getButtonStyle = (tab: UltimaBottomNavTab, isActive: boolean): CSSProperties => {
    const offset = magnetOffset[tab] ?? { x: 0, y: 0 };
    const baseY = isActive ? -1 : 0;
    return {
      transform: `translate3d(${offset.x}px, ${baseY + offset.y}px, 0)`,
      willChange: 'transform',
      ...(isActive
        ? {
            backgroundColor: 'var(--ultima-color-nav-active)',
            borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 35%, transparent)',
            color: 'var(--ultima-color-primary-text)',
            boxShadow:
              '0 8px 20px color-mix(in srgb, var(--ultima-color-nav-active) 34%, transparent), inset 0 1px 0 rgba(255,255,255,0.24)',
          }
        : null),
    };
  };

  return (
    <nav
      className="ultima-bottom-nav grid grid-cols-5 items-center gap-1 rounded-[20px] p-1 shadow-[0_14px_34px_rgba(3,9,18,0.45),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl"
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
        style={getButtonStyle('home', active === 'home')}
        onClick={onHomeClick ?? (() => navigate('/'))}
        onPointerMove={handlePointerMove('home')}
        onPointerLeave={resetMagnet('home')}
        onPointerUp={resetMagnet('home')}
        aria-label="ultima-nav-home"
      >
        <GridIcon />
      </button>
      <button
        type="button"
        data-ultima-nav-btn="1"
        className={getButtonClassName(active === 'connection')}
        style={getButtonStyle('connection', active === 'connection')}
        onClick={onConnectionClick ?? (() => navigate('/connection'))}
        onPointerMove={handlePointerMove('connection')}
        onPointerLeave={resetMagnet('connection')}
        onPointerUp={resetMagnet('connection')}
        aria-label="ultima-nav-connection"
      >
        <GearIcon />
      </button>
      <button
        type="button"
        data-ultima-nav-btn="1"
        className={getButtonClassName(active === 'news')}
        style={{
          ...getButtonStyle('news', active === 'news'),
          minHeight: '46px',
          borderRadius: '17px',
          background:
            active === 'news'
              ? 'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-nav-active) 96%, #fff), color-mix(in srgb, var(--ultima-color-nav-active) 72%, #000))'
              : 'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-primary) 20%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 72%, transparent))',
          border: '1px solid color-mix(in srgb, var(--ultima-color-ring) 28%, transparent)',
          boxShadow:
            active === 'news'
              ? '0 12px 28px color-mix(in srgb, var(--ultima-color-nav-active) 38%, transparent), inset 0 1px 0 rgba(255,255,255,0.26)'
              : '0 10px 24px rgba(3,9,18,0.28), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
        onClick={onNewsClick ?? (() => navigate('/ultima/news'))}
        onPointerMove={handlePointerMove('news')}
        onPointerLeave={resetMagnet('news')}
        onPointerUp={resetMagnet('news')}
        aria-label="ultima-nav-news"
      >
        <NewspaperIcon />
      </button>
      <button
        type="button"
        data-ultima-nav-btn="1"
        className={getButtonClassName(active === 'profile')}
        style={getButtonStyle('profile', active === 'profile')}
        onClick={onProfileClick ?? (() => navigate('/profile'))}
        onPointerMove={handlePointerMove('profile')}
        onPointerLeave={resetMagnet('profile')}
        onPointerUp={resetMagnet('profile')}
        aria-label="ultima-nav-profile"
      >
        <ProfileIcon />
      </button>
      <button
        type="button"
        data-ultima-nav-btn="1"
        className={getButtonClassName(active === 'support')}
        style={getButtonStyle('support', active === 'support')}
        onClick={onSupportClick ?? (() => navigate('/support'))}
        onPointerMove={handlePointerMove('support')}
        onPointerLeave={resetMagnet('support')}
        onPointerUp={resetMagnet('support')}
        aria-label="ultima-nav-support"
      >
        <SupportIcon />
      </button>
    </nav>
  );
}
