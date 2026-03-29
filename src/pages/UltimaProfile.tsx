import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { initDataUser } from '@telegram-apps/sdk-react';
import { subscriptionApi } from '@/api/subscription';
import { infoApi } from '@/api/info';
import { ticketsApi } from '@/api/tickets';
import { balanceApi } from '@/api/balance';
import { referralApi } from '@/api/referral';
import { brandingApi } from '@/api/branding';
import { partnerApi } from '@/api/partners';
import { authApi } from '@/api/auth';
import { giftApi } from '@/api/gift';
import { ultimaAgreementApi } from '@/api/ultimaAgreement';
import { withdrawalApi } from '@/api/withdrawals';
import {
  UltimaDesktopPanel,
  UltimaDesktopSectionLayout,
} from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import { useAuthStore } from '@/store/auth';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { warmUltimaStartup } from '@/features/ultima/warmup';
import { ultimaPanelClassName, ultimaSurfaceStyle } from '@/features/ultima/surfaces';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path
      d="M10 7.5V6a2.5 2.5 0 0 1 2.5-2.5h4A2.5 2.5 0 0 1 19 6v12a2.5 2.5 0 0 1-2.5 2.5h-4A2.5 2.5 0 0 1 10 18v-1.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 12h10m-3-3 3 3-3 3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PaymentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="3.5" y="6" width="17" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.5 10h17" stroke="currentColor" strokeWidth="1.8" />
    <path d="M7.5 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const DevicesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="7.5" y="3.5" width="9" height="17" rx="2.4" stroke="currentColor" strokeWidth="1.8" />
    <path d="M10 17.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ReferralIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M12 20s-6.5-3.8-8.6-7.6C1.8 9.4 3.2 6 6.6 6c2.1 0 3.2 1.2 4 2.3.8-1.1 1.9-2.3 4-2.3 3.4 0 4.8 3.4 3.2 6.4C18.5 16.2 12 20 12 20Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const PromocodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M4.5 8.5A2.5 2.5 0 0 1 7 6h10a2.5 2.5 0 0 1 2.5 2.5v1.4a1.6 1.6 0 0 0 0 3.2v1.4A2.5 2.5 0 0 1 17 17H7a2.5 2.5 0 0 1-2.5-2.5v-1.4a1.6 1.6 0 0 0 0-3.2V8.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M9.5 9.5h5M9.5 14.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const GiftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AccessIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M12 3 5 5.8v5.4c0 4.3 2.9 8.3 7 9.5 4.1-1.2 7-5.2 7-9.5V5.8L12 3Z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path d="m9.3 12.3 1.8 1.8 3.5-3.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M7 18.5 3.5 21V6.5A2.5 2.5 0 0 1 6 4h12a2.5 2.5 0 0 1 2.5 2.5V16A2.5 2.5 0 0 1 18 18.5H7Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M8 9h8M8 12.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const TermsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="6" y="3.5" width="12" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M9 8.5h6M9 12h6M9 15.5h4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path
      d="M9 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type SectionItem = {
  key: string;
  title: string;
  subtitle: string;
  path: string;
  icon: ReactNode;
};

const ULTIMA_TOP_UP_PATH = '/balance/top-up?returnTo=/subscription';
const ULTIMA_SECTION_SURFACE_STYLE = ultimaSurfaceStyle;
const ULTIMA_MENU_ITEM_STYLE = {
  borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
  background:
    'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-secondary) 56%, transparent) 0%, color-mix(in srgb, var(--ultima-color-surface) 52%, transparent) 100%)',
};

function MenuItem({ item, onClick }: { item: SectionItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-[22px] border px-3.5 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md transition hover:translate-y-[-1px] active:translate-y-0"
      style={ULTIMA_MENU_ITEM_STYLE}
    >
      <div
        className="text-white/88 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
        style={{
          borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 18%, transparent)',
          background: 'color-mix(in srgb, var(--ultima-color-surface) 44%, transparent)',
        }}
      >
        {item.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-[15px] font-medium leading-snug text-white/95">
          {item.title}
        </p>
        <p className="text-white/56 mt-0.5 break-words text-[12px] leading-snug">{item.subtitle}</p>
      </div>
      <span
        className="text-white/56 group-hover:text-white/86 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors"
        style={{
          borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 20%, transparent)',
          background: 'color-mix(in srgb, #ffffff 4%, transparent)',
        }}
      >
        <ArrowRightIcon />
      </span>
    </button>
  );
}

export function UltimaProfile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [idCopied, setIdCopied] = useState(false);

  const userLabel = useMemo(() => {
    const fallback = user?.telegram_id ?? user?.id ?? 0;
    return `id: ${fallback}`;
  }, [user?.id, user?.telegram_id]);

  const telegramPhotoUrl = useMemo(() => {
    if (!user?.telegram_id) return null;
    try {
      const tgUser = initDataUser();
      const photoUrl = tgUser?.photo_url;
      return typeof photoUrl === 'string' && photoUrl.length > 0 ? photoUrl : null;
    } catch {
      return null;
    }
  }, [user?.telegram_id]);

  const avatarFallbackLabel = useMemo(() => {
    const source =
      user?.first_name?.trim() ||
      user?.username?.trim() ||
      String(user?.telegram_id ?? user?.id ?? '?');
    return source.slice(0, 1).toUpperCase();
  }, [user?.first_name, user?.id, user?.telegram_id, user?.username]);

  const profileItems: SectionItem[] = [
    {
      key: 'payment',
      title: t('profile.paymentMethodsTitle', { defaultValue: 'Способы оплаты' }),
      subtitle: t('profile.paymentMethodsDescription', {
        defaultValue: 'Настройка способов оплаты',
      }),
      path: ULTIMA_TOP_UP_PATH,
      icon: <PaymentIcon />,
    },
    {
      key: 'devices',
      title: 'Устройства',
      subtitle: t('profile.devicesDescription', {
        defaultValue: 'Удаление устройств и изменение лимита',
      }),
      path: '/ultima/devices',
      icon: <DevicesIcon />,
    },
    {
      key: 'referral',
      title: t('profile.referralTitle', { defaultValue: 'Реферальная программа' }),
      subtitle: t('profile.referralDescription', {
        defaultValue: 'Получайте бонусы за приглашения',
      }),
      path: '/referral',
      icon: <ReferralIcon />,
    },
    {
      key: 'promocode',
      title: t('balance.promocode.title', { defaultValue: 'Промокод' }),
      subtitle: t('profile.promocodeDescription', {
        defaultValue: 'Активация бонусов и скидок',
      }),
      path: '/promocode',
      icon: <PromocodeIcon />,
    },
    {
      key: 'gift',
      title: t('nav.gift', { defaultValue: 'Подарок' }),
      subtitle: t('profile.giftDescription', {
        defaultValue: 'Создание подарочной подписки',
      }),
      path: '/ultima/gift',
      icon: <GiftIcon />,
    },
    {
      key: 'linking',
      title: t('profile.accountLinkingTitle', { defaultValue: 'Сохранение доступа' }),
      subtitle: t('profile.accountLinkingDescription', {
        defaultValue: 'На случай блокировки Telegram',
      }),
      path: '/account-linking',
      icon: <AccessIcon />,
    },
  ];

  const supportItems: SectionItem[] = [
    {
      key: 'support',
      title: t('profile.supportContactTitle', { defaultValue: 'Связаться с поддержкой' }),
      subtitle: t('profile.supportContactDescription', { defaultValue: 'Решение проблем онлайн' }),
      path: '/support',
      icon: <ChatIcon />,
    },
    {
      key: 'terms',
      title: t('profile.termsTitle', { defaultValue: 'Пользовательское соглашение' }),
      subtitle: t('profile.termsDescription', { defaultValue: 'Соглашения и правила сервиса' }),
      path: '/ultima/agreement',
      icon: <TermsIcon />,
    },
  ];

  const copyText = async (value: string, setDone: (value: boolean) => void) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setDone(true);
    window.setTimeout(() => setDone(false), 1500);
  };

  useEffect(() => {
    void warmUltimaStartup(queryClient, { language: i18n.language || 'ru' });
  }, [i18n.language, queryClient]);

  const handleCopyUserId = useCallback(() => {
    void copyText(String(user?.telegram_id ?? user?.id ?? ''), setIdCopied);
  }, [user?.id, user?.telegram_id]);

  const handleLogout = useCallback(() => {
    logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  }, [logout, navigate, queryClient]);

  const openPathFast = useCallback(
    async (path: string) => {
      const tasks: Array<Promise<unknown>> = [];

      if (path.startsWith('/balance/top-up')) {
        tasks.push(import('./UltimaTopUpMethodSelect'));
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['payment-methods'],
            queryFn: balanceApi.getPaymentMethods,
            staleTime: 60000,
          }),
        );
      } else if (path === '/ultima/devices') {
        tasks.push(import('./UltimaDevices'));
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['subscription'],
            queryFn: subscriptionApi.getSubscription,
            staleTime: 15000,
          }),
        );
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['devices'],
            queryFn: subscriptionApi.getDevices,
            staleTime: 10000,
          }),
        );
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['device-reduction-info'],
            queryFn: subscriptionApi.getDeviceReductionInfo,
            staleTime: 10000,
          }),
        );
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['device-price', 1],
            queryFn: () => subscriptionApi.getDevicePrice(1),
            staleTime: 10000,
          }),
        );
      } else if (path === '/referral') {
        tasks.push(import('./Referral'));
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['referral-info'],
            queryFn: referralApi.getReferralInfo,
            staleTime: 15000,
          }),
        );
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['referral-terms'],
            queryFn: referralApi.getReferralTerms,
            staleTime: 15000,
          }),
        );
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['referral-list'],
            queryFn: () => referralApi.getReferralList({ per_page: 20 }),
            staleTime: 15000,
          }),
        );
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['referral-earnings'],
            queryFn: () => referralApi.getReferralEarnings({ per_page: 20 }),
            staleTime: 15000,
          }),
        );
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['branding'],
            queryFn: brandingApi.getBranding,
            staleTime: 60000,
          }),
        );
        const partnerStatus = await queryClient.fetchQuery({
          queryKey: ['partner-status'],
          queryFn: partnerApi.getStatus,
          staleTime: 30000,
        });
        if (partnerStatus?.partner_status === 'approved') {
          tasks.push(
            queryClient.prefetchQuery({
              queryKey: ['withdrawal-balance'],
              queryFn: withdrawalApi.getBalance,
              staleTime: 15000,
            }),
          );
          tasks.push(
            queryClient.prefetchQuery({
              queryKey: ['withdrawal-history'],
              queryFn: withdrawalApi.getHistory,
              staleTime: 15000,
            }),
          );
        }
      } else if (path === '/account-linking') {
        tasks.push(import('./AccountLinking'));
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['linked-identities'],
            queryFn: authApi.getLinkedIdentities,
            staleTime: 15000,
          }),
        );
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['latest-manual-merge-request'],
            queryFn: authApi.getLatestManualMergeRequest,
            staleTime: 15000,
          }),
        );
      } else if (path === '/promocode') {
        tasks.push(import('./UltimaPromocode'));
      } else if (path === '/ultima/gift') {
        tasks.push(import('./UltimaGift'));
        tasks.push(
          queryClient.fetchQuery({
            queryKey: ['gift-config'],
            queryFn: giftApi.getConfig,
            staleTime: 0,
          }),
        );
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['gift-sent'],
            queryFn: giftApi.getSentGifts,
            staleTime: 15000,
          }),
        );
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['gift-received'],
            queryFn: giftApi.getReceivedGifts,
            staleTime: 15000,
          }),
        );
      } else if (path === '/support') {
        tasks.push(import('./Support'));
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['support-config'],
            queryFn: infoApi.getSupportConfig,
            staleTime: 60000,
          }),
        );
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['tickets'],
            queryFn: () => ticketsApi.getTickets({ per_page: 20 }),
            staleTime: 15000,
          }),
        );
      } else if (path === '/ultima/agreement') {
        tasks.push(import('./UltimaAgreement'));
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['ultima-agreement', i18n.language],
            queryFn: () => ultimaAgreementApi.getAgreement(i18n.language || 'ru'),
            staleTime: 60000,
          }),
        );
      } else if (path === '/connection') {
        tasks.push(import('./Connection'));
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['appConfig'],
            queryFn: () => subscriptionApi.getAppConfig(),
            staleTime: 15000,
          }),
        );
      }

      if (tasks.length > 0) {
        await Promise.allSettled(tasks);
      }

      navigate(path);
    },
    [i18n.language, navigate, queryClient],
  );

  const openSupportFast = () => {
    void queryClient.prefetchQuery({
      queryKey: ['support-config'],
      queryFn: infoApi.getSupportConfig,
      staleTime: 60000,
    });
    void queryClient.prefetchQuery({
      queryKey: ['tickets'],
      queryFn: () => ticketsApi.getTickets({ per_page: 20 }),
      staleTime: 15000,
    });
    void import('./Support');
    navigate('/support');
  };

  const bottomNav = <UltimaBottomNav active="profile" onSupportClick={openSupportFast} />;
  const sectionListClassName = isDesktop ? 'ultima-stagger-list space-y-2.5' : 'space-y-2.5';

  const sectionsContent = (
    <div className="grid gap-3 lg:gap-4 xl:grid-cols-2">
      <section
        className={`${ultimaPanelClassName} p-3.5 lg:p-4`}
        style={ULTIMA_SECTION_SURFACE_STYLE}
      >
        <p className="text-white/56 mb-3 text-[12px] font-medium uppercase tracking-[0.14em]">
          {t('profile.profileSettings', { defaultValue: 'Настройки профиля' })}
        </p>
        <div className={sectionListClassName}>
          {profileItems.map((item) => (
            <MenuItem key={item.key} item={item} onClick={() => openPathFast(item.path)} />
          ))}
        </div>
      </section>

      <section
        className={`${ultimaPanelClassName} p-3.5 lg:p-4`}
        style={ULTIMA_SECTION_SURFACE_STYLE}
      >
        <p className="text-white/56 mb-3 text-[12px] font-medium uppercase tracking-[0.14em]">
          {t('nav.support', { defaultValue: 'Поддержка' })}
        </p>
        <div className={sectionListClassName}>
          {supportItems.map((item) => (
            <MenuItem key={item.key} item={item} onClick={() => openPathFast(item.path)} />
          ))}
        </div>
      </section>
    </div>
  );

  if (isDesktop) {
    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-profile-desktop ultima-shell-muted-aura">
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={<AccessIcon />}
          eyebrow={t('nav.profile', { defaultValue: 'Профиль' })}
          title={t('profile.title', { defaultValue: 'Профиль' })}
          subtitle={t('profile.desktopDescription', {
            defaultValue:
              'Здесь собраны платежи, устройства, подарки, промокоды и помощь по аккаунту.',
          })}
          metrics={[
            {
              label: t('profile.accountId', { defaultValue: 'Аккаунт' }),
              value: userLabel,
              hint: user?.username ? `@${user.username}` : avatarFallbackLabel,
            },
            {
              label: t('profile.profileSettings', { defaultValue: 'Настройки профиля' }),
              value: String(profileItems.length),
              hint: t('profile.desktopSettingsHint', {
                defaultValue: 'Платежи, устройства, рефералы и доступ.',
              }),
            },
            {
              label: t('nav.support', { defaultValue: 'Поддержка' }),
              value: String(supportItems.length),
              hint: t('profile.desktopSupportHint', {
                defaultValue: 'Тикеты, соглашение и помощь по сервису.',
              }),
            },
          ]}
          heroActions={
            <>
              <button
                type="button"
                onClick={() => void openPathFast(ULTIMA_TOP_UP_PATH)}
                className="ultima-btn-pill ultima-btn-primary px-5 py-3 text-sm"
              >
                {t('balance.topUp', { defaultValue: 'Пополнить баланс' })}
              </button>
              <button
                type="button"
                onClick={openSupportFast}
                className="ultima-btn-pill ultima-btn-secondary px-5 py-3 text-sm"
              >
                {t('support.title', { defaultValue: 'Поддержка' })}
              </button>
            </>
          }
          aside={
            <>
              <UltimaDesktopPanel
                title={t('profile.accountOverview', { defaultValue: 'Доступ к аккаунту' })}
                subtitle={t('profile.accountOverviewHint', {
                  defaultValue: 'Самое важное по аккаунту и быстрые переходы без лишнего поиска.',
                })}
              >
                <div className="space-y-3">
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center gap-3">
                      {telegramPhotoUrl ? (
                        <img
                          src={telegramPhotoUrl}
                          alt="telegram-avatar"
                          className="h-12 w-12 rounded-full object-cover shadow-[0_6px_12px_rgba(0,0,0,0.22)]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-300 text-base font-semibold text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
                          {avatarFallbackLabel}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white/92 break-all text-sm font-medium">{userLabel}</p>
                        <p className="break-words text-xs text-white/55">
                          {user?.first_name || user?.username || 'Telegram user'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        className="ultima-btn-pill ultima-btn-secondary flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm"
                        onClick={handleCopyUserId}
                      >
                        <CopyIcon />
                        {idCopied
                          ? t('common.copied', { defaultValue: 'Скопировано' })
                          : t('profile.copyAccountId', { defaultValue: 'Скопировать ID' })}
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="border-rose-300/18 hover:bg-rose-500/18 flex w-full items-center justify-center gap-2 rounded-full border bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-50 transition"
                      >
                        <LogoutIcon />
                        {t('profile.logoutButton', { defaultValue: 'Выйти из аккаунта' })}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void openPathFast('/ultima/devices')}
                    className="flex min-h-[56px] items-center justify-between rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-3 text-left transition hover:bg-white/[0.08]"
                  >
                    <span className="text-sm font-medium text-white/90">
                      {t('lite.connectedDevices', { defaultValue: 'Устройства' })}
                    </span>
                    <span className="text-white/58 text-xs">
                      {t('profile.devicesDescription', {
                        defaultValue: 'Управление лимитом и подключениями',
                      })}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void openPathFast('/ultima/gift')}
                    className="flex min-h-[56px] items-center justify-between rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-3 text-left transition hover:bg-white/[0.08]"
                  >
                    <span className="text-sm font-medium text-white/90">
                      {t('nav.gift', { defaultValue: 'Подарок' })}
                    </span>
                    <span className="text-white/58 text-xs">
                      {t('profile.giftDescription', {
                        defaultValue: 'Подарочные подписки и история кодов',
                      })}
                    </span>
                  </button>
                </div>
              </UltimaDesktopPanel>
            </>
          }
          bottomNav={bottomNav}
        >
          {sectionsContent}
        </UltimaDesktopSectionLayout>
      </div>
    );
  }

  return (
    <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-muted-aura">
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <section className="ultima-scrollbar ultima-scroll-stable flex min-h-0 flex-1 flex-col overflow-y-auto pb-3 pr-1 pt-[clamp(8px,2vh,16px)]">
          <section
            className={`${ultimaPanelClassName} mb-3 p-3.5`}
            style={ULTIMA_SECTION_SURFACE_STYLE}
          >
            <div className="flex items-center gap-3">
              {telegramPhotoUrl ? (
                <img
                  src={telegramPhotoUrl}
                  alt="telegram-avatar"
                  className="h-11 w-11 rounded-full object-cover shadow-[0_6px_12px_rgba(0,0,0,0.22)]"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-300 text-sm font-semibold text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
                  {avatarFallbackLabel}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="break-words text-[15px] font-medium leading-snug text-white/95">
                  {user?.first_name || user?.username || 'Telegram user'}
                </p>
                <p className="text-white/64 mt-0.5 break-all text-[13px]">{userLabel}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="ultima-btn-pill ultima-btn-secondary flex w-full items-center justify-center gap-2 px-4 py-2.5 text-[14px]"
                onClick={handleCopyUserId}
                aria-label="copy-user-id"
              >
                <CopyIcon />
                {idCopied
                  ? t('common.copied', { defaultValue: 'Скопировано' })
                  : t('profile.copyAccountId', { defaultValue: 'Скопировать ID' })}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="border-rose-300/18 hover:bg-rose-500/18 flex w-full items-center justify-center gap-2 rounded-full border bg-rose-500/10 px-4 py-2.5 text-[14px] font-medium text-rose-50 transition"
              >
                <LogoutIcon />
                {t('profile.logoutButton', { defaultValue: 'Выйти из аккаунта' })}
              </button>
            </div>
          </section>

          <div className="min-h-0 flex-1">{sectionsContent}</div>
        </section>

        <section className="ultima-mobile-dock-footer">
          <div className="ultima-nav-dock">{bottomNav}</div>
        </section>
      </div>
    </div>
  );
}
