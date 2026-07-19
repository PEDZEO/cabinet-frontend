import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Copy,
  Gauge,
  Headphones,
  Link2,
  Server,
  Share2,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import { balanceApi } from '@/api/balance';
import { infoApi } from '@/api/info';
import { subscriptionApi } from '@/api/subscription';
import { ticketsApi } from '@/api/tickets';
import {
  UltimaDesktopPanel,
  UltimaDesktopSectionLayout,
} from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { UltimaTrafficTopUpSection } from '@/components/ultima/UltimaTrafficTopUpSection';
import {
  ultimaPaneClassName,
  ultimaPaneSurfaceStyle,
  ultimaPanelClassName,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';
import { isUltimaTariffUnlimited } from '@/features/ultima/subscription';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useHaptic, usePlatform } from '@/platform';
import { copyToClipboard } from '@/utils/clipboard';

type QuickActionProps = {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
  primary?: boolean;
  testId?: string;
};

function QuickAction({ icon, label, hint, onClick, primary = false, testId }: QuickActionProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`flex min-h-[58px] w-full items-center gap-3 rounded-[18px] border px-3.5 py-3 text-left transition-colors lg:rounded-[8px] ${
        primary
          ? 'border-emerald-200/[0.28] bg-emerald-300/[0.12] text-white hover:bg-emerald-300/[0.17]'
          : 'border-white/[0.09] bg-white/[0.035] text-white hover:bg-white/[0.065]'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] border lg:rounded-[6px] ${
          primary
            ? 'border-emerald-200/[0.24] bg-emerald-300/[0.13] text-emerald-50'
            : 'border-white/[0.09] bg-white/[0.04] text-white/[0.76]'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-[13px] font-semibold leading-tight">{label}</span>
        {hint ? (
          <span className="mt-1 block break-words text-[11px] leading-tight text-white/[0.48]">
            {hint}
          </span>
        ) : null}
      </span>
      <ArrowRight className="hidden h-4 w-4 shrink-0 text-white/[0.52] min-[480px]:block" />
    </button>
  );
}

export function UltimaSubscriptionInfo() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const haptic = useHaptic();
  const { openTelegramLink } = usePlatform();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedTrafficPackage, setSelectedTrafficPackage] = useState<number | null>(null);

  const { data: purchaseOptions } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: subscriptionApi.getPurchaseOptions,
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });
  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });
  const { data: subscriptionResponse, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getSubscription,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });
  const { data: trafficPackages } = useQuery({
    queryKey: ['traffic-packages', 'ultima-info'],
    queryFn: subscriptionApi.getTrafficPackages,
    enabled: subscriptionResponse?.has_subscription === true,
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const subscription = subscriptionResponse?.subscription ?? null;
  const hasSubscription = subscriptionResponse?.has_subscription === true && !!subscription;
  const currentTariff =
    purchaseOptions?.sales_mode === 'tariffs'
      ? (purchaseOptions.tariffs.find(
          (tariff) => tariff.id === subscription?.tariff_id || tariff.is_current,
        ) ?? null)
      : null;
  const canOpenTariffs = purchaseOptions?.sales_mode === 'tariffs';
  const isUnlimitedTraffic = currentTariff
    ? isUltimaTariffUnlimited(currentTariff)
    : (subscription?.traffic_limit_gb ?? 0) <= 0;
  const canTopUpTraffic =
    hasSubscription &&
    !isUnlimitedTraffic &&
    (subscription.is_active || !subscription.is_expired) &&
    (trafficPackages?.length ?? 0) > 0;
  const subscriptionLink =
    subscription && !subscription.hide_subscription_link
      ? (subscription.subscription_url ?? '')
      : '';

  const trafficTotal = Math.max(0, subscription?.traffic_limit_gb ?? 0);
  const trafficUsed = Math.max(0, subscription?.traffic_used_gb ?? 0);
  const trafficLeft = Math.max(0, trafficTotal - trafficUsed);
  const trafficProgress = isUnlimitedTraffic
    ? 0
    : Math.min(100, Math.max(0, trafficTotal > 0 ? (trafficUsed / trafficTotal) * 100 : 0));
  const language = i18n.resolvedLanguage || i18n.language || 'ru';
  const numberFormatter = new Intl.NumberFormat(language, { maximumFractionDigits: 1 });
  const formatTraffic = (value: number) =>
    `${numberFormatter.format(value)} ${t('common.units.gb')}`;
  const formatPrice = (kopeks: number) => `${(kopeks / 100).toFixed(kopeks % 100 === 0 ? 0 : 2)} ₽`;

  const endDateLabel = (() => {
    if (!subscription?.end_date) return t('subscription.notActive', { defaultValue: 'Не активна' });
    const date = new Date(subscription.end_date);
    if (Number.isNaN(date.getTime())) {
      return t('subscription.notActive', { defaultValue: 'Не активна' });
    }
    return date.toLocaleDateString(language, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  })();

  const timeLeftLabel = (() => {
    if (!subscription) return '—';
    const days = Math.max(0, subscription.days_left ?? 0);
    const hours = Math.max(0, subscription.hours_left ?? 0);
    const minutes = Math.max(0, subscription.minutes_left ?? 0);
    const isRu = language.toLowerCase().startsWith('ru');
    if (days > 0)
      return hours > 0
        ? isRu
          ? `${days} дн. ${hours} ч.`
          : `${days}d ${hours}h`
        : isRu
          ? `${days} дн.`
          : `${days}d`;
    if (hours > 0) {
      return minutes > 0
        ? isRu
          ? `${hours} ч. ${minutes} мин.`
          : `${hours}h ${minutes}m`
        : isRu
          ? `${hours} ч.`
          : `${hours}h`;
    }
    return isRu ? `${minutes} мин.` : `${minutes}m`;
  })();

  const isActive = subscription?.is_active === true && subscription.is_expired !== true;
  const statusLabel = isActive
    ? t('ultima.subscriptionInfo.active')
    : t('ultima.subscriptionInfo.expired');
  const subscriptionTitle = subscription?.tariff_name || t('ultima.subscriptionInfo.pageTitle');
  const deviceCount = subscription?.device_limit ?? 0;
  const serverCount = subscription?.servers?.length ?? 0;

  const purchaseTrafficMutation = useMutation({
    mutationFn: (gb: number) => subscriptionApi.purchaseTraffic(gb),
    onSuccess: async () => {
      setSelectedTrafficPackage(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['subscription'] }),
        queryClient.invalidateQueries({ queryKey: ['balance'] }),
        queryClient.invalidateQueries({ queryKey: ['traffic-packages', 'ultima-info'] }),
      ]);
    },
  });

  const trafficPurchaseErrorMessage =
    purchaseTrafficMutation.error instanceof Error ? purchaseTrafficMutation.error.message : null;

  const openTopUpForTraffic = async (gb: number) => {
    await subscriptionApi.saveTrafficCart(gb);
    navigate('/balance/top-up?returnTo=/ultima/subscription-info');
  };

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

  const openTariffs = () => {
    haptic.impact('light');
    navigate('/subscription');
  };

  const openDevices = () => {
    haptic.impact('light');
    navigate('/ultima/devices');
  };

  const copySubscriptionLink = async () => {
    if (!subscriptionLink) return;
    haptic.impact('light');
    await copyToClipboard(subscriptionLink);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 1400);
  };

  const shareSubscriptionLink = async () => {
    if (!subscriptionLink) return;
    haptic.impact('light');
    const fallbackTelegramShare = () => {
      openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(subscriptionLink)}`);
    };
    if (typeof navigator.share !== 'function') {
      fallbackTelegramShare();
      return;
    }
    try {
      await navigator.share({
        title: t('ultima.subscriptionInfo.subscriptionLink'),
        text: subscriptionLink,
        url: subscriptionLink,
      });
    } catch {
      fallbackTelegramShare();
    }
  };

  const trafficNotice = subscription?.metered_traffic_enabled
    ? subscription.metered_access_blocked
      ? t('ultima.subscriptionInfo.meteredBlocked')
      : t('ultima.subscriptionInfo.meteredActive', {
          label: subscription.metered_server_label || t('ultima.subscriptionInfo.specialServers'),
        })
    : isUnlimitedTraffic
      ? t('ultima.subscriptionInfo.unlimitedHint')
      : t('ultima.subscriptionInfo.limitedHint');

  const statusPill = (
    <span
      data-testid="ultima-subscription-info-status"
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium ${
        isActive
          ? 'border-emerald-200/[0.2] bg-emerald-300/[0.11] text-emerald-50'
          : 'border-rose-200/[0.2] bg-rose-300/[0.1] text-rose-50'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-200' : 'bg-rose-200'}`} />
      {statusLabel}
    </span>
  );

  const trafficSection = hasSubscription ? (
    <section
      data-testid="ultima-subscription-traffic-overview"
      className={`${ultimaPanelClassName} p-4 lg:p-5`}
      style={ultimaSurfaceStyle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-white/[0.09] bg-white/[0.045] text-emerald-100 lg:rounded-[7px]">
            <Gauge className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase text-white/[0.46]">
              {t('ultima.subscriptionInfo.trafficTitle')}
            </p>
            <h2 className="mt-0.5 break-words text-[19px] font-semibold leading-tight text-white">
              {isUnlimitedTraffic
                ? t('ultima.subscriptionInfo.unlimited')
                : formatTraffic(trafficLeft)}
            </h2>
          </div>
        </div>
        {!isUnlimitedTraffic ? (
          <span className="shrink-0 rounded-full border border-white/[0.09] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-white/[0.6]">
            {numberFormatter.format(Math.max(0, 100 - trafficProgress))}%
          </span>
        ) : null}
      </div>

      {!isUnlimitedTraffic ? (
        <>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/[0.24]">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${
                trafficProgress >= 90 ? 'bg-amber-300' : 'bg-emerald-300'
              }`}
              style={{ width: `${trafficProgress}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 divide-x divide-white/[0.08]">
            {[
              [t('ultima.subscriptionInfo.used'), formatTraffic(trafficUsed)],
              [t('ultima.subscriptionInfo.remaining'), formatTraffic(trafficLeft)],
              [t('ultima.subscriptionInfo.limit'), formatTraffic(trafficTotal)],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 px-2 first:pl-0 last:pr-0">
                <p className="text-[9px] font-medium uppercase text-white/[0.38]">{label}</p>
                <p className="mt-1 break-words text-[12px] font-semibold leading-tight text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <p
        className={`mt-4 border-t border-white/[0.07] pt-3 text-[12px] leading-relaxed ${
          subscription.metered_access_blocked ? 'text-amber-100/[0.9]' : 'text-white/[0.55]'
        }`}
      >
        {trafficNotice}
      </p>
    </section>
  ) : null;

  const topUpSection = canTopUpTraffic ? (
    <UltimaTrafficTopUpSection
      t={t}
      formatPrice={formatPrice}
      trafficLimitGb={subscription.traffic_limit_gb}
      trafficUsedGb={subscription.traffic_used_gb}
      trafficPurchases={subscription.traffic_purchases}
      trafficPackages={trafficPackages}
      selectedTrafficPackage={selectedTrafficPackage}
      setSelectedTrafficPackage={setSelectedTrafficPackage}
      purchaseBalanceKopeks={Math.max(0, balanceData?.balance_kopeks ?? 0)}
      isPending={purchaseTrafficMutation.isPending}
      error={trafficPurchaseErrorMessage}
      onPurchaseTraffic={(gb) => purchaseTrafficMutation.mutate(gb)}
      onTopUpBalance={(gb) => void openTopUpForTraffic(gb)}
    />
  ) : null;

  const linkSection =
    hasSubscription && subscriptionLink ? (
      <section
        data-testid="ultima-subscription-link"
        className={`${ultimaPanelClassName} p-4 lg:p-5`}
        style={ultimaSurfaceStyle}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-white/[0.09] bg-white/[0.045] text-white/[0.78] lg:rounded-[7px]">
            <Link2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold leading-tight text-white">
              {t('ultima.subscriptionInfo.subscriptionLink')}
            </h2>
            <p className="mt-1 text-[12px] leading-snug text-white/[0.5]">
              {t('ultima.subscriptionInfo.linkHint')}
            </p>
          </div>
        </div>
        <div
          className={`${ultimaPaneClassName} mt-3 flex min-w-0 items-center gap-2 px-3 py-2.5`}
          style={ultimaPaneSurfaceStyle}
        >
          <p className="min-w-0 flex-1 truncate text-[12px] text-white/[0.72]">
            {subscriptionLink}
          </p>
          <button
            type="button"
            aria-label={t('ultima.subscriptionInfo.copyLink')}
            title={t('ultima.subscriptionInfo.copyLink')}
            onClick={() => void copySubscriptionLink()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/[0.08] bg-white/[0.04] text-white/[0.76] lg:rounded-[5px]"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void copySubscriptionLink()}
            className="ultima-btn-pill ultima-btn-secondary flex min-h-[42px] items-center justify-center gap-2 px-3 py-2 text-[12px]"
          >
            <Copy className="h-4 w-4" />
            {linkCopied
              ? t('ultima.subscriptionInfo.copied')
              : t('ultima.subscriptionInfo.copyLink')}
          </button>
          <button
            type="button"
            onClick={() => void shareSubscriptionLink()}
            className="ultima-btn-pill ultima-btn-secondary flex min-h-[42px] items-center justify-center gap-2 px-3 py-2 text-[12px]"
          >
            <Share2 className="h-4 w-4" />
            {t('ultima.subscriptionInfo.shareLink')}
          </button>
        </div>
      </section>
    ) : null;

  const emptyState = (
    <section
      className={`${ultimaPanelClassName} p-5 text-center`}
      style={ultimaSurfaceStyle}
      data-testid="ultima-subscription-empty"
    >
      <ShieldCheck className="mx-auto h-9 w-9 text-white/[0.42]" />
      <h1 className="mt-3 text-[20px] font-semibold text-white">
        {t('ultima.subscriptionInfo.noSubscription')}
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-white/[0.54]">
        {t('ultima.subscriptionInfo.description')}
      </p>
      <button
        type="button"
        onClick={openTariffs}
        className="ultima-btn-pill ultima-btn-primary mt-4 w-full px-4 py-3 text-sm"
      >
        {t('ultima.subscriptionInfo.buySubscription')}
      </button>
    </section>
  );

  if (isLoading) {
    return <div className="min-h-[100dvh] min-h-[100svh] w-full bg-transparent" />;
  }

  const bottomNav = <UltimaBottomNav active="home" onSupportClick={openSupport} />;

  if (isDesktop) {
    return (
      <div className="ultima-shell ultima-shell-wide ultima-shell-profile-desktop">
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={<ShieldCheck className="h-5 w-5" />}
          eyebrow={t('ultima.subscriptionInfo.eyebrow')}
          title={hasSubscription ? subscriptionTitle : t('ultima.subscriptionInfo.pageTitle')}
          subtitle={
            hasSubscription
              ? `${t('ultima.subscriptionInfo.validUntil')} ${endDateLabel}`
              : t('ultima.subscriptionInfo.description')
          }
          metrics={
            hasSubscription
              ? [
                  {
                    label: t('ultima.subscriptionInfo.timeLeft'),
                    value: timeLeftLabel,
                    hint: statusLabel,
                  },
                  {
                    label: t('ultima.subscriptionInfo.remaining'),
                    value: isUnlimitedTraffic
                      ? t('ultima.subscriptionInfo.unlimited')
                      : formatTraffic(trafficLeft),
                    hint: isUnlimitedTraffic
                      ? trafficNotice
                      : `${t('ultima.subscriptionInfo.used')}: ${formatTraffic(trafficUsed)}`,
                  },
                  {
                    label: t('ultima.subscriptionInfo.devices'),
                    value: String(deviceCount),
                    hint: `${serverCount} ${t('ultima.subscriptionInfo.servers').toLowerCase()}`,
                  },
                ]
              : undefined
          }
          heroActions={
            hasSubscription ? (
              <div className="flex flex-wrap gap-2">
                {canOpenTariffs ? (
                  <button
                    type="button"
                    onClick={openTariffs}
                    className="ultima-btn-pill ultima-btn-primary px-5 py-2.5 text-sm"
                  >
                    {t('ultima.subscriptionInfo.renew')}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={openDevices}
                  className="ultima-btn-pill ultima-btn-secondary px-5 py-2.5 text-sm"
                >
                  {t('ultima.subscriptionInfo.manageDevices')}
                </button>
              </div>
            ) : undefined
          }
          aside={
            <UltimaDesktopPanel
              title={t('ultima.subscriptionInfo.quickActions')}
              subtitle={t('ultima.subscriptionInfo.quickActionsHint')}
            >
              <div className="space-y-2">
                {canOpenTariffs ? (
                  <QuickAction
                    icon={<CalendarDays className="h-4 w-4" />}
                    label={t('ultima.subscriptionInfo.renew')}
                    hint={endDateLabel}
                    onClick={openTariffs}
                    primary
                  />
                ) : null}
                <QuickAction
                  icon={<Smartphone className="h-4 w-4" />}
                  label={t('ultima.subscriptionInfo.manageDevices')}
                  hint={t('ultima.subscriptionInfo.deviceCount', { count: deviceCount })}
                  onClick={openDevices}
                />
                <QuickAction
                  icon={<Headphones className="h-4 w-4" />}
                  label={t('ultima.subscriptionInfo.support')}
                  onClick={openSupport}
                />
              </div>
            </UltimaDesktopPanel>
          }
          bottomNav={bottomNav}
        >
          {!hasSubscription ? (
            emptyState
          ) : (
            <div
              data-testid="ultima-subscription-info-page"
              className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]"
            >
              <div className="min-w-0 space-y-4">
                {trafficSection}
                {topUpSection}
              </div>
              <div className="min-w-0 space-y-4">
                <section className={`${ultimaPanelClassName} p-5`} style={ultimaSurfaceStyle}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase text-white/[0.44]">
                        {t('ultima.subscriptionInfo.eyebrow')}
                      </p>
                      <h2 className="mt-1 text-[22px] font-semibold text-white">
                        {subscriptionTitle}
                      </h2>
                    </div>
                    {statusPill}
                  </div>
                  <div className="mt-5 divide-y divide-white/[0.07] border-y border-white/[0.07]">
                    {[
                      [
                        <CalendarDays key="calendar" className="h-4 w-4" />,
                        t('ultima.subscriptionInfo.validUntil'),
                        endDateLabel,
                      ],
                      [
                        <Clock3 key="clock" className="h-4 w-4" />,
                        t('ultima.subscriptionInfo.timeLeft'),
                        timeLeftLabel,
                      ],
                      [
                        <Smartphone key="devices" className="h-4 w-4" />,
                        t('ultima.subscriptionInfo.devices'),
                        String(deviceCount),
                      ],
                      [
                        <Server key="servers" className="h-4 w-4" />,
                        t('ultima.subscriptionInfo.servers'),
                        String(serverCount),
                      ],
                    ].map(([icon, label, value]) => (
                      <div
                        key={String(label)}
                        className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-2.5 py-3 text-[12px]"
                      >
                        <span className="text-white/[0.44]">{icon}</span>
                        <span className="text-white/[0.5]">{label}</span>
                        <span className="max-w-[170px] break-words text-right font-semibold text-white">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
                {linkSection}
              </div>
            </div>
          )}
        </UltimaDesktopSectionLayout>
      </div>
    );
  }

  return (
    <div className="ultima-shell ultima-shell-wide">
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <section className="flex min-h-0 flex-1 flex-col pt-[clamp(8px,2vh,16px)]">
          {!hasSubscription ? (
            emptyState
          ) : (
            <div
              data-testid="ultima-subscription-info-page"
              className="ultima-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto pb-3 pr-1"
            >
              <section
                className={`${ultimaPanelClassName} overflow-hidden p-4`}
                style={ultimaSurfaceStyle}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase text-white/[0.44]">
                      {t('ultima.subscriptionInfo.eyebrow')}
                    </p>
                    <h1 className="mt-1 break-words text-[clamp(27px,7.6vw,34px)] font-semibold leading-none text-white">
                      {subscriptionTitle}
                    </h1>
                  </div>
                  {statusPill}
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-white/[0.07] pt-3 text-[12px] text-white/[0.62]">
                  <CalendarDays className="h-4 w-4 shrink-0 text-emerald-100/[0.8]" />
                  <span>{t('ultima.subscriptionInfo.validUntil')}</span>
                  <strong className="ml-auto break-words text-right font-semibold text-white">
                    {endDateLabel}
                  </strong>
                </div>

                <div className="mt-3 grid grid-cols-3 divide-x divide-white/[0.08] rounded-[18px] border border-white/[0.08] bg-black/[0.12] py-3 lg:rounded-[8px]">
                  {[
                    [t('ultima.subscriptionInfo.timeLeft'), timeLeftLabel],
                    [t('ultima.subscriptionInfo.devices'), String(deviceCount)],
                    [t('ultima.subscriptionInfo.servers'), String(serverCount)],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0 px-2.5">
                      <p className="text-[9px] font-medium uppercase text-white/[0.38]">{label}</p>
                      <p className="mt-1 break-words text-[12px] font-semibold leading-tight text-white">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {canOpenTariffs ? (
                    <QuickAction
                      icon={<CalendarDays className="h-4 w-4" />}
                      label={t('ultima.subscriptionInfo.renewShort')}
                      onClick={openTariffs}
                      primary
                      testId="ultima-subscription-info-renew"
                    />
                  ) : null}
                  <QuickAction
                    icon={<Smartphone className="h-4 w-4" />}
                    label={t('ultima.subscriptionInfo.manageDevices')}
                    onClick={openDevices}
                    testId="ultima-subscription-info-devices"
                  />
                </div>
              </section>

              {trafficSection}
              {topUpSection}
              {linkSection}
            </div>
          )}
        </section>

        <section className="mt-auto shrink-0 pb-0">
          {hasSubscription && canOpenTariffs ? (
            <button
              type="button"
              data-testid="ultima-subscription-info-primary-action"
              onClick={openTariffs}
              className="ultima-btn-pill ultima-btn-primary mb-3 flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] min-[360px]:px-5 min-[360px]:text-[16px]"
            >
              <CalendarDays className="h-5 w-5 shrink-0" />
              <span className="min-w-0 flex-1 break-words font-semibold leading-tight">
                {t('ultima.subscriptionInfo.renew')}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          ) : null}
          <div className="ultima-nav-dock">{bottomNav}</div>
        </section>
      </div>
    </div>
  );
}
