import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { subscriptionApi } from '@/api/subscription';
import { useAuthStore } from '@/store/auth';

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16 text-white/95">
    <path
      d="M12 3 5 5.7v5.54c0 4.4 2.99 8.5 7 9.76 4.01-1.26 7-5.36 7-9.76V5.7L12 3Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M9.3 12.4 11.2 14.3 15.1 10.4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M3 12h18M12 3c2.4 2.3 3.6 5.4 3.6 9S14.4 18.7 12 21M12 3c-2.4 2.3-3.6 5.4-3.6 9S9.6 18.7 12 21"
      stroke="currentColor"
      strokeWidth="1.4"
    />
  </svg>
);

const SetupIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M10 14 21 3M16 3h5v5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 10v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3h8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M11 18h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

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

const AdminIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path
      d="M12 3 4 6v5.5c0 4.2 2.8 8.1 8 9.5 5.2-1.4 8-5.3 8-9.5V6l-8-3Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path d="m9.5 12 1.8 1.8 3.2-3.2" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

export function UltimaDashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAdmin = useAuthStore((state) => state.isAdmin);

  const { data: subscriptionResponse } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getSubscription,
    refetchOnMount: 'always',
  });

  const subscription = subscriptionResponse?.subscription ?? null;
  const isActive = Boolean(subscription?.is_active && !subscription?.is_expired);
  const statusLabel = isActive ? t('subscription.active') : t('subscription.expired');

  const expiryLabel = (() => {
    if (!subscription?.end_date) return t('subscription.notActive');
    const date = new Date(subscription.end_date);
    if (Number.isNaN(date.getTime())) return t('subscription.notActive');
    const formatted = date.toLocaleDateString(i18n.language || 'ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if ((i18n.language || '').toLowerCase().startsWith('ru')) {
      return `до ${formatted.replace(' г.', '')}`;
    }
    return formatted;
  })();

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_76%_54%,rgba(16,185,129,0.34),rgba(4,17,26,0.98)_58%)] px-4 pb-[calc(20px+env(safe-area-inset-bottom,0px))] pt-2 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[38%] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/10" />
        <div className="absolute left-1/2 top-[38%] h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/10" />
        <div className="absolute left-1/2 top-[38%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/10" />
      </div>

      {isAdmin && (
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="absolute right-4 top-2 z-30 inline-flex h-9 items-center gap-1.5 rounded-full border border-amber-300/30 bg-black/30 px-3 text-xs font-medium text-amber-200 backdrop-blur"
        >
          <AdminIcon />
          <span>{t('admin.nav.title', { defaultValue: 'Админ' })}</span>
        </button>
      )}

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-26px)] w-full max-w-md flex-col">
        <section className="pt-[16vh]">
          <div className="mx-auto mb-[24vh] flex h-24 w-24 items-center justify-center rounded-full bg-black/15">
            <ShieldIcon />
          </div>

          <div className="mb-4 flex items-center justify-between text-white">
            <div>
              <p className="text-[34px] font-semibold leading-none tracking-[-0.02em] sm:text-[38px]">
                {expiryLabel}
              </p>
              <p className="mt-2 text-base text-emerald-300/90">online</p>
            </div>
            <span className="bg-white/8 rounded-full border border-white/15 px-3 py-1 text-xs text-white/75">
              {statusLabel}
            </span>
          </div>
        </section>

        <section className="mt-auto">
          <button
            type="button"
            onClick={() => navigate('/subscription')}
            className="mb-3 flex w-full items-center justify-between rounded-full bg-emerald-500 px-5 py-4 text-xl font-medium text-white transition hover:bg-emerald-400"
          >
            <span className="flex items-center gap-2">
              <GlobeIcon />
              {t('lite.buySubscription', { defaultValue: 'Купить подписку' })}
            </span>
            <span className="text-lg text-white/90">от 199 ₽</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/connection')}
            className="mb-4 flex w-full items-center justify-between rounded-full bg-white px-5 py-4 text-xl font-medium text-slate-900 transition hover:bg-white/90"
          >
            <span className="flex items-center gap-2">
              <SetupIcon />
              {t('lite.connectAndSetup', { defaultValue: 'Установка и настройка' })}
            </span>
            <span className="text-slate-500">
              <PhoneIcon />
            </span>
          </button>

          <nav className="grid grid-cols-4 gap-2 rounded-full border border-white/10 bg-emerald-900/45 p-2 text-white/80 backdrop-blur">
            <button
              type="button"
              className="rounded-full bg-emerald-500 p-3 text-white"
              onClick={() => navigate('/')}
            >
              <GridIcon />
            </button>
            <button
              type="button"
              className="rounded-full p-3 hover:bg-white/5"
              onClick={() => navigate('/connection')}
            >
              <GearIcon />
            </button>
            <button
              type="button"
              className="rounded-full p-3 hover:bg-white/5"
              onClick={() => navigate('/profile')}
            >
              <ProfileIcon />
            </button>
            <button
              type="button"
              className="rounded-full p-3 hover:bg-white/5"
              onClick={() => navigate('/support')}
            >
              <SupportIcon />
            </button>
          </nav>
        </section>
      </div>
    </div>
  );
}
