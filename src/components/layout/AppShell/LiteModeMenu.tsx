import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface LiteModeMenuProps {
  isOpen: boolean;
  onClose: () => void;
  headerHeight?: number;
}

// Icons
const SupportIcon = () => (
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
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ReferralIcon = () => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ProfileIcon = () => (
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
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LogoutIcon = () => (
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
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export function LiteModeMenu({ isOpen, onClose, headerHeight = 64 }: LiteModeMenuProps) {
  const { t } = useTranslation();
  const { logout } = useAuthStore();
  const { referralEnabled } = useFeatureFlags();

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const menuItems = [
    { to: '/support', label: t('nav.support'), icon: <SupportIcon /> },
    ...(referralEnabled
      ? [{ to: '/referral', label: t('nav.referral'), icon: <ReferralIcon /> }]
      : []),
    { to: '/profile', label: t('nav.profile'), icon: <ProfileIcon /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />

          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed right-4 z-50 w-56 overflow-hidden rounded-2xl border border-dark-600 bg-dark-800 shadow-xl"
            style={{ top: headerHeight + 8 }}
          >
            <div className="py-2">
              {menuItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 text-dark-100 transition-colors hover:bg-dark-700"
                >
                  <span className="text-dark-400">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

              <div className="my-2 border-t border-dark-600" />

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-error-400 transition-colors hover:bg-dark-700"
              >
                <LogoutIcon />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
