import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { subscriptionApi } from '@/api/subscription';

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

export function UltimaDashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

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
    <div className="relative min-h-[calc(100dvh-28px)] overflow-hidden rounded-3xl border border-emerald-600/20 bg-[radial-gradient(circle_at_70%_50%,rgba(16,185,129,0.25),rgba(4,17,26,0.96)_55%)] p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[34%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/10" />
        <div className="absolute left-1/2 top-[34%] h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/10" />
        <div className="absolute left-1/2 top-[34%] h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/10" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-70px)] w-full max-w-md flex-col justify-between">
        <section className="pt-16">
          <div className="mx-auto mb-28 flex h-24 w-24 items-center justify-center rounded-full bg-black/15">
            <ShieldIcon />
          </div>

          <div className="mb-5 flex items-center justify-between text-white">
            <div>
              <p className="text-[22px] font-semibold leading-none">{expiryLabel}</p>
              <p className="mt-2 text-sm text-emerald-300/90">online</p>
            </div>
            <span className="bg-white/8 rounded-full border border-white/15 px-3 py-1 text-xs text-white/80">
              {statusLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/subscription')}
            className="mb-3 flex w-full items-center justify-between rounded-2xl bg-emerald-500 px-4 py-3.5 text-base font-medium text-white transition hover:bg-emerald-400"
          >
            <span className="flex items-center gap-2">
              <GlobeIcon />
              {t('lite.buySubscription', { defaultValue: 'Купить подписку' })}
            </span>
            <span className="text-white/90">от 199 ₽</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/connection')}
            className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-base font-medium text-slate-900 transition hover:bg-white/90"
          >
            <span className="flex items-center gap-2">
              <SetupIcon />
              {t('lite.connectAndSetup', { defaultValue: 'Установка и настройка' })}
            </span>
            <span className="text-slate-500">
              <PhoneIcon />
            </span>
          </button>
        </section>

        <nav className="mb-2 grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-emerald-900/40 p-2 text-white/80 backdrop-blur">
          <button
            type="button"
            className="rounded-xl bg-emerald-500 p-3 text-white"
            onClick={() => navigate('/')}
          >
            <GridIcon />
          </button>
          <button
            type="button"
            className="rounded-xl p-3 hover:bg-white/5"
            onClick={() => navigate('/connection')}
          >
            <GearIcon />
          </button>
          <button
            type="button"
            className="rounded-xl p-3 hover:bg-white/5"
            onClick={() => navigate('/profile')}
          >
            <ProfileIcon />
          </button>
          <button
            type="button"
            className="rounded-xl p-3 hover:bg-white/5"
            onClick={() => navigate('/support')}
          >
            <SupportIcon />
          </button>
        </nav>
      </div>
    </div>
  );
}
