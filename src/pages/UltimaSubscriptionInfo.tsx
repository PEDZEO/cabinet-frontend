import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { subscriptionApi } from '@/api/subscription';
import { ticketsApi } from '@/api/tickets';
import { infoApi } from '@/api/info';
import {
  UltimaDesktopPanel,
  UltimaDesktopSectionLayout,
} from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useHaptic } from '@/platform';
import { usePlatform } from '@/platform';

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path d="M8 12h8m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M16 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2M8 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);

const StatCard = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <article
    className="rounded-2xl border p-3 backdrop-blur-md"
    style={{
      borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
      background: 'color-mix(in srgb, var(--ultima-color-surface) 36%, transparent)',
    }}
  >
    <p className="text-white/62 text-[12px] leading-tight">{label}</p>
    <p className="mt-1 text-[20px] font-semibold leading-none text-white">{value}</p>
    {hint ? <p className="text-white/54 mt-1 text-[12px]">{hint}</p> : null}
  </article>
);

export function UltimaSubscriptionInfo() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const haptic = useHaptic();
  const { openTelegramLink } = usePlatform();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [linkCopied, setLinkCopied] = useState(false);

  const { data: subscriptionResponse, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getSubscription,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });

  const subscription = subscriptionResponse?.subscription ?? null;
  const hasSubscription = subscriptionResponse?.has_subscription === true;
  const subscriptionLink = subscription?.subscription_url ?? '';
  const trafficTotal = subscription?.traffic_limit_gb ?? 0;
  const trafficUsed = subscription?.traffic_used_gb ?? 0;
  const trafficLeft = Math.max(0, trafficTotal - trafficUsed);
  const isUnlimitedTraffic = trafficTotal <= 0;
  const endDateLabel = (() => {
    if (!subscription?.end_date) return t('subscription.notActive', { defaultValue: 'Не активна' });
    const date = new Date(subscription.end_date);
    if (Number.isNaN(date.getTime()))
      return t('subscription.notActive', { defaultValue: 'Не активна' });
    return date.toLocaleDateString(i18n.language || 'ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  })();
  const timeLeftLabel = (() => {
    if (!subscription) return '-';
    const days = Math.max(0, subscription.days_left ?? 0);
    const hours = Math.max(0, subscription.hours_left ?? 0);
    const minutes = Math.max(0, subscription.minutes_left ?? 0);
    const isRu = (i18n.language || '').toLowerCase().startsWith('ru');
    if (days > 0) {
      if (hours > 0) return isRu ? `${days} дн. ${hours} ч.` : `${days}d ${hours}h`;
      return isRu ? `${days} дн.` : `${days}d`;
    }
    if (hours > 0) {
      if (minutes > 0) return isRu ? `${hours} ч. ${minutes} мин.` : `${hours}h ${minutes}m`;
      return isRu ? `${hours} ч.` : `${hours}h`;
    }
    return isRu ? `${minutes} мин.` : `${minutes}m`;
  })();
  const tariffLabel = (i18n.language || '').toLowerCase().startsWith('ru') ? 'Тариф' : 'Tariff';

  const openSupport = () => {
    void queryClient.prefetchQuery({
      queryKey: ['support-config'],
      queryFn: infoApi.getSupportConfig,
    });
    void queryClient.prefetchQuery({
      queryKey: ['tickets'],
      queryFn: () => ticketsApi.getTickets({ per_page: 20 }),
    });
    navigate('/support');
  };

  const copySubscriptionLink = async () => {
    if (!subscriptionLink) return;
    await navigator.clipboard.writeText(subscriptionLink);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 1400);
  };

  const shareSubscriptionLink = async () => {
    if (!subscriptionLink) return;
    const fallbackTelegramShare = () => {
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(subscriptionLink)}`;
      openTelegramLink(shareUrl);
    };
    if (typeof navigator.share !== 'function') {
      fallbackTelegramShare();
      return;
    }
    try {
      await navigator.share({
        title: t('profile.subscriptionLink', { defaultValue: 'Ваша ссылка на подписку' }),
        text: subscriptionLink,
        url: subscriptionLink,
      });
    } catch {
      fallbackTelegramShare();
    }
  };

  if (isLoading) {
    return <div className="h-[100svh] min-h-[100dvh] w-full bg-transparent" />;
  }

  const bottomNav = <UltimaBottomNav active="home" onSupportClick={openSupport} />;

  const infoContent =
    !hasSubscription || !subscription ? (
      <section
        className="text-white/82 rounded-2xl border p-4 text-sm backdrop-blur-md"
        style={{
          borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
          background: 'color-mix(in srgb, var(--ultima-color-surface) 36%, transparent)',
        }}
      >
        {t('subscription.connection.needSubscription', {
          defaultValue: 'Для просмотра информации нужна активная подписка.',
        })}
      </section>
    ) : (
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 lg:space-y-4 lg:overflow-visible lg:pr-0">
        <section
          className="rounded-2xl border p-3 backdrop-blur-md"
          style={{
            borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
            background: 'color-mix(in srgb, var(--ultima-color-surface) 36%, transparent)',
          }}
        >
          <p className="text-white/62 mb-2 text-[12px]">
            {t('profile.subscriptionLink', { defaultValue: 'Ваша ссылка на подписку' })}
          </p>
          <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
            <p className="text-white/92 truncate text-[13px]">{subscriptionLink || '-'}</p>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void copySubscriptionLink()}
              className="ultima-btn-pill ultima-btn-secondary rounded-xl px-3 py-2 text-[13px]"
              disabled={!subscriptionLink}
            >
              <span className="inline-flex items-center gap-1.5">
                <CopyIcon />
                {linkCopied
                  ? t('common.copied', { defaultValue: 'Скопировано' })
                  : t('common.copy', { defaultValue: 'Копировать' })}
              </span>
            </button>
            <button
              type="button"
              onClick={() => void shareSubscriptionLink()}
              className="ultima-btn-pill ultima-btn-secondary rounded-xl px-3 py-2 text-[13px]"
              disabled={!subscriptionLink}
            >
              <span className="inline-flex items-center gap-1.5">
                <ShareIcon />
                {t('common.share', { defaultValue: 'Поделиться' })}
              </span>
            </button>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-4">
          <StatCard
            label={t('subscription.status', { defaultValue: 'Статус' })}
            value={
              subscription.is_active && !subscription.is_expired
                ? t('subscription.active', { defaultValue: 'Активна' })
                : t('subscription.expired', { defaultValue: 'Истекла' })
            }
          />
          <StatCard
            label={t('subscription.expiresAt', { defaultValue: 'Действует до' })}
            value={endDateLabel}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-4">
          <StatCard
            label={t('subscription.trafficUsed', { defaultValue: 'Трафик использован' })}
            value={`${trafficUsed.toFixed(1)} GB`}
            hint={
              isUnlimitedTraffic
                ? t('subscription.unlimited', { defaultValue: 'Безлимит' })
                : t('subscription.trafficLimit', {
                    defaultValue: 'Лимит: {{limit}} GB',
                    limit: trafficTotal,
                  })
            }
          />
          <StatCard
            label={t('subscription.trafficRemaining', { defaultValue: 'Осталось трафика' })}
            value={
              isUnlimitedTraffic
                ? t('subscription.unlimited', { defaultValue: 'Безлимит' })
                : `${trafficLeft.toFixed(1)} GB`
            }
            hint={
              isUnlimitedTraffic
                ? '∞'
                : `${Math.min(100, Math.max(0, 100 - (subscription.traffic_used_percent ?? 0))).toFixed(0)}%`
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label={t('subscription.devices', { defaultValue: 'Устройства' })}
            value={String(subscription.device_limit ?? 0)}
          />
          <StatCard
            label={t('subscription.timeLeft', { defaultValue: 'Осталось времени' })}
            value={timeLeftLabel}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label={tariffLabel}
            value={
              subscription.tariff_name || t('common.notSpecified', { defaultValue: 'Не указан' })
            }
          />
          <StatCard
            label={t('subscription.servers', { defaultValue: 'Серверы' })}
            value={String(subscription.servers?.length ?? 0)}
          />
        </div>
      </div>
    );

  if (isDesktop) {
    return (
      <div className="ultima-shell ultima-shell-wide ultima-shell-profile-desktop">
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={<ShareIcon />}
          eyebrow={t('subscription.infoTitle', { defaultValue: 'Инфо о подписке' })}
          title={t('subscription.desktopTitle', { defaultValue: 'Подписка' })}
          subtitle={t('subscription.infoDescription', {
            defaultValue:
              'Срок действия, ссылка на подписку и быстрый переход к устройствам в одном окне.',
          })}
          metrics={[
            {
              label: t('subscription.status', { defaultValue: 'Статус' }),
              value:
                subscription?.is_active && !subscription?.is_expired
                  ? t('subscription.active', { defaultValue: 'Активна' })
                  : t('subscription.expired', { defaultValue: 'Истекла' }),
              hint: endDateLabel,
            },
            {
              label: t('subscription.devices', { defaultValue: 'Устройства' }),
              value: String(subscription?.device_limit ?? 0),
              hint: t('subscription.manageDevices', { defaultValue: 'Управление устройствами' }),
            },
            {
              label: t('subscription.timeLeft', { defaultValue: 'Осталось времени' }),
              value: timeLeftLabel,
              hint: subscription?.tariff_name || tariffLabel,
            },
          ]}
          heroActions={
            hasSubscription ? (
              <button
                type="button"
                onClick={() => {
                  haptic.impact('light');
                  navigate('/ultima/devices');
                }}
                className="ultima-btn-pill ultima-btn-primary px-5 py-3 text-sm"
              >
                {t('subscription.desktopOpenDevices', { defaultValue: 'Открыть устройства' })}
              </button>
            ) : undefined
          }
          aside={
            <UltimaDesktopPanel
              title={t('subscription.desktopAsideTitle', { defaultValue: 'Ссылка и помощь' })}
              subtitle={t('subscription.desktopAsideHint', {
                defaultValue:
                  'Скопируйте ссылку, отправьте ее себе или сразу откройте поддержку, если что-то не работает.',
              })}
            >
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => void copySubscriptionLink()}
                  className="ultima-btn-pill ultima-btn-secondary w-full px-4 py-2.5 text-sm"
                  disabled={!subscriptionLink}
                >
                  {linkCopied
                    ? t('common.copied', { defaultValue: 'Скопировано' })
                    : t('common.copy', { defaultValue: 'Копировать ссылку' })}
                </button>
                <button
                  type="button"
                  onClick={() => void shareSubscriptionLink()}
                  className="ultima-btn-pill ultima-btn-secondary w-full px-4 py-2.5 text-sm"
                  disabled={!subscriptionLink}
                >
                  {t('common.share', { defaultValue: 'Поделиться' })}
                </button>
                <button
                  type="button"
                  onClick={openSupport}
                  className="ultima-btn-pill ultima-btn-secondary w-full px-4 py-2.5 text-sm"
                >
                  {t('nav.support', { defaultValue: 'Поддержка' })}
                </button>
              </div>
            </UltimaDesktopPanel>
          }
          bottomNav={bottomNav}
        >
          {infoContent}
        </UltimaDesktopSectionLayout>
      </div>
    );
  }

  return (
    <div className="ultima-shell ultima-shell-wide">
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner lg:max-w-[960px]">
        <header className="mb-3">
          <h1 className="text-[clamp(34px,9.2vw,42px)] font-semibold leading-[0.92] tracking-[-0.01em] text-white">
            {t('subscription.infoTitle', { defaultValue: 'Инфо о подписке' })}
          </h1>
          <p className="text-white/62 mt-1.5 text-[14px] leading-tight">
            {t('subscription.infoDescription', {
              defaultValue: 'Ключевые параметры подписки и управления устройствами.',
            })}
          </p>
        </header>

        {infoContent}

        <section className="mt-3 space-y-3 pb-0">
          <button
            type="button"
            onClick={() => {
              haptic.impact('light');
              navigate('/ultima/devices');
            }}
            className="ultima-btn-pill ultima-btn-secondary flex w-full items-center justify-center px-4 py-3 text-[15px]"
          >
            {t('subscription.manageDevices', { defaultValue: 'Управление устройствами' })}
          </button>

          <div className="ultima-nav-dock">{bottomNav}</div>
        </section>
      </div>
    </div>
  );
}
