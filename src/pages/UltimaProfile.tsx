import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { initDataUser } from '@telegram-apps/sdk-react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Copy,
  CreditCard,
  Gift,
  Headphones,
  Info,
  KeyRound,
  LogOut,
  MonitorSmartphone,
  ShieldCheck,
  TicketPercent,
  Users,
  Wallet,
} from 'lucide-react';
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
import { ultimaSurfaceStyle } from '@/features/ultima/surfaces';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { copyToClipboard } from '@/utils/clipboard';

type SectionItem = {
  key: string;
  title: string;
  subtitle: string;
  path: string;
  icon: ReactNode;
  meta?: string;
};

const ULTIMA_TOP_UP_PATH = '/balance/top-up?returnTo=/subscription';
const ULTIMA_SECTION_SURFACE_STYLE = ultimaSurfaceStyle;
const ULTIMA_SECTION_CLASS_NAME =
  'rounded-[24px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_16px_36px_rgba(3,14,24,0.18)] lg:rounded-[8px]';

function ProfileActionRow({ item, onClick }: { item: SectionItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`ultima-profile-action-${item.key}`}
      className="group flex min-h-[64px] w-full items-center gap-3 border-b border-white/[0.07] px-1 py-3 text-left transition-colors last:border-b-0 hover:bg-white/[0.025]"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border text-emerald-50/[0.88] lg:rounded-[6px]"
        style={{
          borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 15%, transparent)',
          background: 'color-mix(in srgb, var(--ultima-color-primary) 10%, transparent)',
        }}
      >
        {item.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 flex-1 break-words text-[14px] font-semibold leading-snug text-white/[0.94]">
            {item.title}
          </p>
          {item.meta ? (
            <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-white/[0.58]">
              {item.meta}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 break-words text-[11px] leading-snug text-white/[0.48]">
          {item.subtitle}
        </p>
      </div>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center text-white/[0.38] transition-colors group-hover:text-white/[0.72]">
        <ChevronRight className="h-4 w-4" />
      </span>
    </button>
  );
}

function ProfileSection({
  title,
  hint,
  items,
  onOpen,
}: {
  title: string;
  hint: string;
  items: SectionItem[];
  onOpen: (path: string) => void;
}) {
  return (
    <section
      className={`${ULTIMA_SECTION_CLASS_NAME} min-w-0 p-4 lg:p-5`}
      style={ULTIMA_SECTION_SURFACE_STYLE}
    >
      <div className="mb-1">
        <h2 className="text-[14px] font-semibold text-white/[0.94]">{title}</h2>
        <p className="mt-1 text-[11px] leading-snug text-white/[0.44]">{hint}</p>
      </div>
      <div className="mt-2">
        {items.map((item) => (
          <ProfileActionRow key={item.key} item={item} onClick={() => onOpen(item.path)} />
        ))}
      </div>
    </section>
  );
}

function ProfileAvatar({
  src,
  fallback,
  large = false,
}: {
  src: string | null;
  fallback: string;
  large?: boolean;
}) {
  const sizeClass = large ? 'h-14 w-14 text-lg' : 'h-12 w-12 text-base';
  if (src) {
    return (
      <img
        src={src}
        alt="telegram-avatar"
        className={`${sizeClass} shrink-0 rounded-full object-cover ring-1 ring-white/[0.1]`}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full border border-emerald-100/[0.18] bg-emerald-300/[0.14] font-semibold text-emerald-50`}
    >
      {fallback}
    </div>
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
  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });
  const { data: linkedIdentities, isLoading: linkedIdentitiesLoading } = useQuery({
    queryKey: ['linked-identities'],
    queryFn: authApi.getLinkedIdentities,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });

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

  const language = i18n.resolvedLanguage || i18n.language || 'ru';
  const displayName = useMemo(() => {
    const fullName = [user?.first_name?.trim(), user?.last_name?.trim()].filter(Boolean).join(' ');
    return fullName || user?.username?.trim() || t('profile.ultima.fallbackName');
  }, [t, user?.first_name, user?.last_name, user?.username]);
  const accountHandle = user?.username ? `@${user.username}` : user?.email || userLabel;
  const identityCount = linkedIdentities?.identities.length ?? 1;
  const hasBackupAccess = identityCount > 1;
  const identityCountLabel = linkedIdentitiesLoading
    ? null
    : t('profile.ultima.loginMethodCount', { count: identityCount });
  const balanceKopeks = balanceData?.balance_kopeks ?? user?.balance_kopeks ?? 0;
  const balanceLabel = new Intl.NumberFormat(language, {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: balanceKopeks % 100 === 0 ? 0 : 2,
  }).format(balanceKopeks / 100);
  const registeredAtLabel = useMemo(() => {
    if (!user?.created_at) return '—';
    const date = new Date(user.created_at);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(language, { month: 'short', year: 'numeric' });
  }, [language, user?.created_at]);

  const accountItems: SectionItem[] = [
    {
      key: 'devices',
      title: t('lite.connectedDevices', { defaultValue: 'Устройства' }),
      subtitle: t('profile.devicesDescription', {
        defaultValue: 'Подключения, удаление устройств и лимит',
      }),
      path: '/ultima/devices',
      icon: <MonitorSmartphone className="h-5 w-5" />,
    },
    {
      key: 'linking',
      title: t('profile.accountLinkingTitle', { defaultValue: 'Способы входа' }),
      subtitle: hasBackupAccess
        ? t('profile.ultima.accessProtected')
        : t('profile.ultima.accessNeedsBackup'),
      path: '/account-linking',
      icon: <KeyRound className="h-5 w-5" />,
      meta: identityCountLabel ?? undefined,
    },
  ];

  const benefitItems: SectionItem[] = [
    {
      key: 'referral',
      title: t('profile.referralTitle', { defaultValue: 'Реферальная программа' }),
      subtitle: t('profile.referralDescription', {
        defaultValue: 'Получайте бонусы за приглашения',
      }),
      path: '/referral',
      icon: <Users className="h-5 w-5" />,
    },
    {
      key: 'promocode',
      title: t('balance.promocode.title', { defaultValue: 'Промокод' }),
      subtitle: t('profile.promocodeDescription', {
        defaultValue: 'Активация бонусов и скидок',
      }),
      path: '/promocode',
      icon: <TicketPercent className="h-5 w-5" />,
    },
    {
      key: 'gift',
      title: t('nav.gift', { defaultValue: 'Подарок' }),
      subtitle: t('profile.giftDescription', {
        defaultValue: 'Создание подарочной подписки',
      }),
      path: '/ultima/gift',
      icon: <Gift className="h-5 w-5" />,
    },
  ];

  const supportItems: SectionItem[] = [
    {
      key: 'support',
      title: t('profile.supportContactTitle', { defaultValue: 'Связаться с поддержкой' }),
      subtitle: t('profile.supportContactDescription', { defaultValue: 'Решение проблем онлайн' }),
      path: '/support',
      icon: <Headphones className="h-5 w-5" />,
    },
    {
      key: 'info',
      title: t('nav.info', { defaultValue: 'Информация' }),
      subtitle: t('profile.infoDescription', {
        defaultValue: 'FAQ, правила, соглашение и документы сервиса',
      }),
      path: '/ultima/info',
      icon: <Info className="h-5 w-5" />,
    },
  ];
  const totalActionItems = accountItems.length + benefitItems.length + supportItems.length;

  const copyText = async (value: string, setDone: (value: boolean) => void) => {
    if (!value) return;
    await copyToClipboard(value);
    setDone(true);
    window.setTimeout(() => setDone(false), 1500);
  };

  useEffect(() => {
    let cancelled = false;

    const runWarmup = () => {
      if (cancelled) {
        return;
      }

      void warmUltimaStartup(queryClient, { language: i18n.language || 'ru' });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(runWarmup, { timeout: 1200 });

      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = setTimeout(runWarmup, 180);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
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
        tasks.push(import('./TopUpMethodSelect'));
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
      } else if (path === '/ultima/info') {
        tasks.push(import('./UltimaInfo'));
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['faq-pages'],
            queryFn: infoApi.getFaqPages,
            staleTime: 60000,
          }),
        );
        tasks.push(
          queryClient.prefetchQuery({
            queryKey: ['rules'],
            queryFn: infoApi.getRules,
            staleTime: 60000,
          }),
        );
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
  const sectionsContent = (
    <div
      data-testid="ultima-profile-sections"
      className="grid min-w-0 gap-3 lg:grid-cols-2 lg:gap-4"
    >
      <ProfileSection
        title={t('profile.ultima.accountSection')}
        hint={t('profile.ultima.accountSectionHint')}
        items={accountItems}
        onOpen={(path) => void openPathFast(path)}
      />
      <div className="lg:row-span-2">
        <ProfileSection
          title={t('profile.ultima.benefitsSection')}
          hint={t('profile.ultima.benefitsSectionHint')}
          items={benefitItems}
          onOpen={(path) => void openPathFast(path)}
        />
      </div>
      <ProfileSection
        title={t('profile.ultima.helpSection')}
        hint={t('profile.ultima.helpSectionHint')}
        items={supportItems}
        onOpen={(path) => void openPathFast(path)}
      />
    </div>
  );

  if (isDesktop) {
    return (
      <div
        data-testid="ultima-profile-page"
        className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-profile-desktop ultima-shell-muted-aura"
      >
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={<ShieldCheck className="h-5 w-5" />}
          eyebrow={t('nav.profile', { defaultValue: 'Профиль' })}
          title={displayName}
          subtitle={`${accountHandle} · ${userLabel}`}
          metrics={[
            {
              label: t('profile.ultima.balance'),
              value: balanceLabel,
              hint: t('profile.ultima.balanceHint'),
            },
            {
              label: t('profile.ultima.loginMethods'),
              value: linkedIdentitiesLoading ? '—' : String(identityCount),
              hint: hasBackupAccess
                ? t('profile.ultima.accessProtected')
                : t('profile.ultima.accessNeedsBackup'),
            },
            {
              label: t('profile.ultima.registered'),
              value: registeredAtLabel,
              hint: t('profile.ultima.availableActions', { count: totalActionItems }),
            },
          ]}
          heroActions={
            <>
              <button
                type="button"
                onClick={() => void openPathFast(ULTIMA_TOP_UP_PATH)}
                className="ultima-btn-pill ultima-btn-primary flex items-center gap-2 px-5 py-3 text-sm"
              >
                <Wallet className="h-4 w-4" />
                {t('balance.topUp', { defaultValue: 'Пополнить баланс' })}
              </button>
              <button
                type="button"
                onClick={openSupportFast}
                className="ultima-btn-pill ultima-btn-secondary flex items-center gap-2 px-5 py-3 text-sm"
              >
                <Headphones className="h-4 w-4" />
                {t('support.title', { defaultValue: 'Поддержка' })}
              </button>
            </>
          }
          aside={
            <UltimaDesktopPanel
              title={t('profile.ultima.accountCard')}
              subtitle={t('profile.ultima.accountCardHint')}
            >
              <div data-testid="ultima-profile-account" className="min-w-0">
                <div className="flex items-center gap-3">
                  <ProfileAvatar src={telegramPhotoUrl} fallback={avatarFallbackLabel} large />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-[15px] font-semibold text-white/[0.94]">
                      {displayName}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-white/[0.5]">{accountHandle}</p>
                  </div>
                </div>

                <div
                  className={`mt-4 flex items-center gap-2 border-y border-white/[0.07] py-3 text-[12px] ${
                    linkedIdentitiesLoading
                      ? 'text-white/[0.52]'
                      : hasBackupAccess
                        ? 'text-emerald-100/[0.88]'
                        : 'text-amber-100/[0.88]'
                  }`}
                >
                  {hasBackupAccess ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                  )}
                  <span>
                    {linkedIdentitiesLoading
                      ? t('profile.ultima.checkingAccess')
                      : hasBackupAccess
                        ? t('profile.ultima.accessProtected')
                        : t('profile.ultima.accessNeedsBackup')}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-white/[0.44]">{t('profile.ultima.accountId')}</span>
                  <span className="break-all text-right font-medium text-white/[0.82]">
                    {userLabel}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="ultima-btn-pill ultima-btn-secondary flex min-h-[42px] items-center justify-center gap-2 px-3 py-2 text-[12px]"
                    onClick={handleCopyUserId}
                  >
                    <Copy className="h-4 w-4" />
                    {idCopied ? t('common.copied') : t('profile.ultima.copyId')}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-[42px] items-center justify-center gap-2 rounded-[7px] border border-rose-300/[0.16] bg-rose-500/[0.08] px-3 py-2 text-[12px] font-medium text-rose-50 transition-colors hover:bg-rose-500/[0.14]"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('profile.ultima.logout')}
                  </button>
                </div>
              </div>
            </UltimaDesktopPanel>
          }
          bottomNav={bottomNav}
        >
          {sectionsContent}
        </UltimaDesktopSectionLayout>
      </div>
    );
  }

  return (
    <div
      data-testid="ultima-profile-page"
      className="ultima-shell ultima-shell-shared-nav-docked ultima-shell-wide ultima-flat-frames ultima-shell-muted-aura"
    >
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <section className="ultima-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pr-1 pt-[clamp(8px,2vh,16px)]">
          <section
            data-testid="ultima-profile-account"
            className={`${ULTIMA_SECTION_CLASS_NAME} mb-3 p-4`}
            style={ULTIMA_SECTION_SURFACE_STYLE}
          >
            <div className="flex items-center gap-3">
              <ProfileAvatar src={telegramPhotoUrl} fallback={avatarFallbackLabel} />
              <div className="min-w-0 flex-1">
                <p className="break-words text-[16px] font-semibold leading-snug text-white/[0.96]">
                  {displayName}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-white/[0.5]">{accountHandle}</p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase ${
                  linkedIdentitiesLoading
                    ? 'border-white/[0.1] bg-white/[0.04] text-white/[0.48]'
                    : hasBackupAccess
                      ? 'border-emerald-200/[0.2] bg-emerald-300/[0.1] text-emerald-100/[0.9]'
                      : 'border-amber-200/[0.2] bg-amber-300/[0.1] text-amber-100/[0.9]'
                }`}
              >
                {linkedIdentitiesLoading
                  ? t('profile.ultima.checking')
                  : hasBackupAccess
                    ? t('profile.ultima.protected')
                    : t('profile.ultima.oneLogin')}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 divide-x divide-white/[0.07] border-y border-white/[0.07] py-3">
              {[
                [
                  t('profile.ultima.balance'),
                  balanceLabel,
                  <Wallet key="wallet" className="h-4 w-4" />,
                ],
                [
                  t('profile.ultima.loginMethods'),
                  linkedIdentitiesLoading ? '—' : String(identityCount),
                  <KeyRound key="key" className="h-4 w-4" />,
                ],
                [
                  t('profile.ultima.registered'),
                  registeredAtLabel,
                  <CalendarDays key="calendar" className="h-4 w-4" />,
                ],
              ].map(([label, value, icon]) => (
                <div key={String(label)} className="min-w-0 px-2 first:pl-0 last:pr-0">
                  <div className="flex items-center gap-1.5 text-white/[0.4]">
                    {icon}
                    <span className="truncate text-[8px] font-medium uppercase">{label}</span>
                  </div>
                  <p className="mt-1.5 truncate text-[11px] font-semibold text-white/[0.9]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              data-testid="ultima-profile-top-up"
              onClick={() => void openPathFast(ULTIMA_TOP_UP_PATH)}
              className="ultima-btn-pill ultima-btn-primary mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 px-4 py-2.5 text-[13px]"
            >
              <CreditCard className="h-4 w-4" />
              {t('balance.topUp', { defaultValue: 'Пополнить баланс' })}
            </button>
          </section>

          <div className="shrink-0">{sectionsContent}</div>

          <div className="mt-3 grid grid-cols-2 gap-2 pb-3">
            <button
              type="button"
              className="ultima-btn-pill ultima-btn-secondary flex min-h-[42px] items-center justify-center gap-2 px-3 py-2 text-[12px]"
              onClick={handleCopyUserId}
              aria-label="copy-user-id"
            >
              <Copy className="h-4 w-4" />
              {idCopied ? t('common.copied') : t('profile.ultima.copyId')}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-rose-300/[0.16] bg-rose-500/[0.08] px-3 py-2 text-[12px] font-medium text-rose-50 transition-colors hover:bg-rose-500/[0.14]"
            >
              <LogOut className="h-4 w-4" />
              {t('profile.ultima.logout')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
