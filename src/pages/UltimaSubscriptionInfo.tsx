import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { subscriptionApi } from '@/api/subscription';
import { ticketsApi } from '@/api/tickets';
import { infoApi } from '@/api/info';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { useHaptic } from '@/platform';

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
    if (typeof navigator.share !== 'function') {
      await copySubscriptionLink();
      return;
    }
    try {
      await navigator.share({
        title: t('profile.subscriptionLink', { defaultValue: 'Ваша ссылка на подписку' }),
        text: subscriptionLink,
        url: subscriptionLink,
      });
    } catch {
      // user cancelled share dialog
    }
  };

  if (isLoading) {
    return <div className="h-[100svh] min-h-[100dvh] w-full bg-transparent" />;
  }

  return (
    <div className="ultima-shell">
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner">
        <header className="mb-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-2 inline-flex items-center gap-2 text-[13px] text-white/70 transition hover:text-white/90"
          >
            ← {t('common.back', { defaultValue: 'Назад' })}
          </button>
          <h1 className="text-[clamp(34px,9.2vw,42px)] font-semibold leading-[0.92] tracking-[-0.01em] text-white">
            {t('subscription.infoTitle', { defaultValue: 'Инфо о подписке' })}
          </h1>
          <p className="text-white/62 mt-1.5 text-[14px] leading-tight">
            {t('subscription.infoDescription', {
              defaultValue: 'Ключевые параметры подписки без дублирования управления устройствами.',
            })}
          </p>
        </header>

        {!hasSubscription || !subscription ? (
          <section
            className="text-white/82 rounded-2xl border p-4 text-sm backdrop-blur-md"
            style={{
              borderColor:
                'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
              background: 'color-mix(in srgb, var(--ultima-color-surface) 36%, transparent)',
            }}
          >
            {t('subscription.connection.needSubscription', {
              defaultValue: 'Для просмотра информации нужна активная подписка.',
            })}
          </section>
        ) : (
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            <section
              className="rounded-2xl border p-3 backdrop-blur-md"
              style={{
                borderColor:
                  'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
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

            <div className="grid grid-cols-2 gap-2">
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

            <div className="grid grid-cols-2 gap-2">
              <StatCard
                label={t('subscription.trafficUsed', { defaultValue: 'Трафик использован' })}
                value={`${trafficUsed.toFixed(1)} GB`}
                hint={t('subscription.trafficLimit', {
                  defaultValue: 'Лимит: {{limit}} GB',
                  limit: trafficTotal,
                })}
              />
              <StatCard
                label={t('subscription.trafficRemaining', { defaultValue: 'Осталось трафика' })}
                value={`${trafficLeft.toFixed(1)} GB`}
                hint={`${Math.min(100, Math.max(0, 100 - (subscription.traffic_used_percent ?? 0))).toFixed(0)}%`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StatCard
                label={t('subscription.devices', { defaultValue: 'Устройства' })}
                value={String(subscription.device_limit ?? 0)}
              />
              <StatCard
                label={t('subscription.timeLeft', { defaultValue: 'Осталось времени' })}
                value={subscription.time_left_display || `${subscription.days_left ?? 0} д.`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StatCard
                label={t('subscription.tariff', { defaultValue: 'Тариф' })}
                value={
                  subscription.tariff_name ||
                  t('common.notSpecified', { defaultValue: 'Не указан' })
                }
              />
              <StatCard
                label={t('subscription.servers', { defaultValue: 'Серверы' })}
                value={String(subscription.servers?.length ?? 0)}
              />
            </div>
          </div>
        )}

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

          <div className="ultima-nav-dock">
            <UltimaBottomNav active="home" onSupportClick={openSupport} />
          </div>
        </section>
      </div>
    </div>
  );
}
