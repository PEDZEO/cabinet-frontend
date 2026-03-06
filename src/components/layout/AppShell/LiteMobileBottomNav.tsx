import { Link, useLocation } from 'react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { usePlatform } from '@/platform';
import { cn } from '@/lib/utils';

const HomeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z" />
  </svg>
);

const ConnectIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path d="M9 12a4 4 0 0 0 6.04.43l2.4-2.4a4 4 0 0 0-5.66-5.66l-1.36 1.36" />
    <path d="M15 12a4 4 0 0 0-6.04-.43l-2.4 2.4a4 4 0 1 0 5.66 5.66l1.36-1.36" />
  </svg>
);

const BalanceIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path d="M3 6a2 2 0 0 1 2-2h14v4H5a2 2 0 1 0 0 4h16v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" />
    <circle cx="16" cy="12" r="1.5" />
  </svg>
);

const TariffIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18M9 20V10" />
  </svg>
);

const SupportIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path d="M7 10a5 5 0 0 1 10 0v4a2 2 0 0 1-2 2h-2l-3 3v-3H9a2 2 0 0 1-2-2v-4Z" />
  </svg>
);

interface LiteMobileBottomNavProps {
  isKeyboardOpen: boolean;
}

export function LiteMobileBottomNav({ isKeyboardOpen }: LiteMobileBottomNavProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { haptic } = usePlatform();

  const items = [
    { path: '/', label: t('nav.dashboard'), icon: HomeIcon },
    { path: '/connection', label: t('lite.connect', 'Подключение'), icon: ConnectIcon },
    { path: '/balance', label: t('nav.balance'), icon: BalanceIcon },
    { path: '/subscription', label: t('lite.tariffs', 'Тарифы'), icon: TariffIcon },
    { path: '/support', label: t('nav.support'), icon: SupportIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className={cn(
        'fixed inset-x-3 z-50 rounded-2xl border border-white/10 bg-dark-950/90 p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 lg:hidden',
        isKeyboardOpen ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
      style={{ bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}
      aria-label="Lite mobile navigation"
    >
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => haptic.impact('light')}
            className={cn(
              'relative flex min-h-[58px] flex-col items-center justify-center rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors',
              isActive(item.path) ? 'text-accent-300' : 'text-dark-400',
            )}
          >
            {isActive(item.path) && (
              <motion.span
                layoutId="lite-mobile-active"
                className="absolute inset-0 rounded-xl border border-accent-400/35 bg-accent-500/15"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <item.icon className="relative z-10 h-5 w-5" />
            <span className="relative z-10 mt-1 truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
