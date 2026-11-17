import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  Copy,
  Headphones,
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
import { UltimaMeteredTrafficPeriodNotice } from '@/components/ultima/UltimaMeteredTrafficPeriodNotice';
import { UltimaTrafficTopUpSection } from '@/components/ultima/UltimaTrafficTopUpSection';
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

type CryptoLinkKind = 'happ' | 'incy';

function QuickAction({ icon, label, hint, onClick, primary = false, testId }: QuickActionProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className="ultima-sub-info-action"
      data-primary={primary || undefined}
    >
      <span className="ultima-sub-info-action-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="ultima-sub-info-action-copy">
        <span className="ultima-sub-info-action-label">{label}</span>
        {hint ? <span className="ultima-sub-info-action-hint">{hint}</span> : null}
      </span>
      <ArrowRight className="ultima-sub-info-action-arrow" aria-hidden="true" />
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
  const [selectedCryptoLinkKind, setSelectedCryptoLinkKind] = useState<CryptoLinkKind>('happ');
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
  const { data: appConfig } = useQuery({
    queryKey: ['appConfig'],
    queryFn: subscriptionApi.getAppConfig,
    enabled: subscriptionResponse?.has_subscription === true,
    staleTime: 60000,
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
  const isUnlimitedTraffic = subscription?.metered_traffic_enabled
    ? subscription.traffic_limit_gb <= 0
    : currentTariff
      ? isUltimaTariffUnlimited(currentTariff)
      : (subscription?.traffic_limit_gb ?? 0) <= 0;
  const canTopUpTraffic =
    hasSubscription &&
    !isUnlimitedTraffic &&
    (subscription.is_active || !subscription.is_expired) &&
    (trafficPackages?.length ?? 0) > 0;
  const rawSubscriptionLink = subscription?.subscription_url?.trim() ?? '';
  const happCryptoLink = appConfig?.subscriptionCryptoLink?.trim() ?? '';
  const incyCryptoLink = appConfig?.subscriptionIncyCryptoLink?.trim() ?? '';
  const cryptoLinksEnabled = appConfig?.cryptoLinksEnabled !== false;
  const activeCryptoLinkKind: CryptoLinkKind =
    selectedCryptoLinkKind === 'incy' && incyCryptoLink ? 'incy' : happCryptoLink ? 'happ' : 'incy';
  const activeCryptoLink = activeCryptoLinkKind === 'happ' ? happCryptoLink : incyCryptoLink;
  const subscriptionLink =
    subscription && !subscription.hide_subscription_link && appConfig
      ? cryptoLinksEnabled
        ? activeCryptoLink
        : rawSubscriptionLink
      : '';
  const subscriptionLinkKind = !subscriptionLink
    ? null
    : cryptoLinksEnabled
      ? activeCryptoLinkKind
      : 'regular';
  const canChooseCryptoLink = cryptoLinksEnabled && !!happCryptoLink && !!incyCryptoLink;
  const subscriptionLinkMeta =
    subscriptionLinkKind === 'happ'
      ? 'Happ · crypt5'
      : subscriptionLinkKind === 'incy'
        ? 'INCY · crypt1'
        : null;

  const trafficTotal = Math.max(0, subscription?.traffic_limit_gb ?? 0);
  const trafficUsed = Math.max(0, subscription?.traffic_used_gb ?? 0);
  const trafficLeft = Math.max(
    0,
    subscription?.metered_traffic_remaining_gb ?? trafficTotal - trafficUsed,
  );
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

  const selectCryptoLink = (kind: CryptoLinkKind) => {
    haptic.selection();
    setLinkCopied(false);
    setSelectedCryptoLinkKind(kind);
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

  const trafficNotice = isUnlimitedTraffic
    ? t('ultima.subscriptionInfo.unlimitedHint')
    : subscription?.metered_traffic_enabled
      ? subscription.metered_access_blocked
        ? t('ultima.subscriptionInfo.meteredBlocked')
        : t('ultima.subscriptionInfo.meteredActive', {
            label: subscription.metered_server_label || t('ultima.subscriptionInfo.specialServers'),
          })
      : t('ultima.subscriptionInfo.limitedHint');

  const statusPill = (
    <span
      data-testid="ultima-subscription-info-status"
      className="ultima-sub-info-status"
      data-active={isActive}
    >
      <span className="ultima-sub-info-status-dot" aria-hidden="true" />
      {statusLabel}
    </span>
  );

  const trafficSection = hasSubscription ? (
    <section
      data-testid="ultima-subscription-traffic-overview"
      className="ultima-sub-info-section ultima-sub-info-traffic"
    >
      <div className="ultima-sub-info-section-heading">
        <div>
          <p className="ultima-sub-info-eyebrow">{t('ultima.subscriptionInfo.trafficTitle')}</p>
          <h2 className="ultima-sub-info-traffic-value">
            {isUnlimitedTraffic
              ? t('ultima.subscriptionInfo.unlimited')
              : formatTraffic(trafficLeft)}
          </h2>
        </div>
        {!isUnlimitedTraffic ? (
          <span className="ultima-sub-info-traffic-percent">
            {numberFormatter.format(Math.max(0, 100 - trafficProgress))}%
          </span>
        ) : null}
      </div>

      {!isUnlimitedTraffic ? (
        <>
          <div className="ultima-sub-info-meter">
            <div className="ultima-sub-info-meter-fill" style={{ width: `${trafficProgress}%` }} />
          </div>
          <dl className="ultima-sub-info-facts ultima-sub-info-traffic-facts">
            {[
              [t('ultima.subscriptionInfo.used'), formatTraffic(trafficUsed)],
              [t('ultima.subscriptionInfo.remaining'), formatTraffic(trafficLeft)],
              [t('ultima.subscriptionInfo.limit'), formatTraffic(trafficTotal)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}

      {!isUnlimitedTraffic &&
      subscription.metered_traffic_enabled &&
      subscription.traffic_reset_mode === 'MONTH' ? (
        <UltimaMeteredTrafficPeriodNotice
          subscription={subscription}
          className="ultima-sub-info-policy"
        />
      ) : (
        <p
          className="ultima-sub-info-policy"
          data-blocked={subscription.metered_access_blocked || undefined}
        >
          {trafficNotice}
        </p>
      )}
    </section>
  ) : null;

  const topUpSection = canTopUpTraffic ? (
    <UltimaTrafficTopUpSection
      t={t}
      subscription={subscription}
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
        data-link-kind={subscriptionLinkKind}
        className="ultima-sub-info-section ultima-sub-info-link"
      >
        <div className="ultima-sub-info-section-heading">
          <div>
            <div className="ultima-sub-info-link-heading">
              <h2>{t('ultima.subscriptionInfo.subscriptionLink')}</h2>
              {subscriptionLinkMeta ? (
                <span className="ultima-sub-info-protocol">{subscriptionLinkMeta}</span>
              ) : null}
            </div>
            <p className="ultima-sub-info-description">{t('ultima.subscriptionInfo.linkHint')}</p>
          </div>
        </div>
        {canChooseCryptoLink ? (
          <div
            data-testid="ultima-subscription-link-selector"
            role="radiogroup"
            aria-label={t('ultima.subscriptionInfo.linkApp')}
            className="ultima-sub-info-link-selector"
          >
            {(
              [
                ['happ', 'Happ', 'crypt5'],
                ['incy', 'INCY', 'crypt1'],
              ] as const
            ).map(([kind, label, protocol]) => {
              const isSelected = subscriptionLinkKind === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  data-testid={`ultima-subscription-link-${kind}`}
                  onClick={() => selectCryptoLink(kind)}
                  className="ultima-sub-info-link-option"
                >
                  <span>{label}</span>
                  <span className="ultima-sub-info-option-protocol">{protocol}</span>
                </button>
              );
            })}
          </div>
        ) : null}
        <div className="ultima-sub-info-link-value">
          <p>{subscriptionLink}</p>
          <button
            type="button"
            aria-label={t('ultima.subscriptionInfo.copyLink')}
            title={t('ultima.subscriptionInfo.copyLink')}
            onClick={() => void copySubscriptionLink()}
            className="ultima-sub-info-copy-icon"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <div className="ultima-sub-info-link-actions">
          <button
            type="button"
            onClick={() => void copySubscriptionLink()}
            className="ultima-btn-pill ultima-btn-primary ultima-sub-info-link-copy"
          >
            <Copy className="h-4 w-4" />
            {linkCopied
              ? t('ultima.subscriptionInfo.copied')
              : t('ultima.subscriptionInfo.copyLink')}
          </button>
          <button
            type="button"
            onClick={() => void shareSubscriptionLink()}
            className="ultima-btn-pill ultima-btn-secondary ultima-sub-info-link-share"
          >
            <Share2 className="h-4 w-4" />
            {t('ultima.subscriptionInfo.shareLink')}
          </button>
        </div>
      </section>
    ) : null;

  const emptyState = (
    <section
      className="ultima-sub-info-section ultima-sub-info-empty"
      data-testid="ultima-subscription-empty"
    >
      <h1>{t('ultima.subscriptionInfo.noSubscription')}</h1>
      <p className="ultima-sub-info-description">{t('ultima.subscriptionInfo.description')}</p>
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
      <div className="ultima-shell ultima-shell-wide ultima-shell-profile-desktop ultima-sub-info">
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
              <div className="ultima-sub-info-action-list">
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
              className="ultima-sub-info-desktop-content"
            >
              <div className="ultima-sub-info-column">
                {trafficSection}
                {topUpSection}
              </div>
              <div className="ultima-sub-info-column">
                <section className="ultima-sub-info-section ultima-sub-info-details">
                  <div className="ultima-sub-info-section-heading">
                    <div>
                      <p className="ultima-sub-info-eyebrow">
                        {t('ultima.subscriptionInfo.eyebrow')}
                      </p>
                      <h2>{subscriptionTitle}</h2>
                    </div>
                    {statusPill}
                  </div>
                  <dl className="ultima-sub-info-facts">
                    {[
                      [t('ultima.subscriptionInfo.validUntil'), endDateLabel],
                      [t('ultima.subscriptionInfo.timeLeft'), timeLeftLabel],
                      [t('ultima.subscriptionInfo.devices'), String(deviceCount)],
                      [t('ultima.subscriptionInfo.servers'), String(serverCount)],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
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
    <div className="ultima-shell ultima-shell-wide ultima-sub-info">
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <section className="flex min-h-0 flex-1 flex-col pt-[clamp(8px,2vh,16px)]">
          {!hasSubscription ? (
            emptyState
          ) : (
            <div
              data-testid="ultima-subscription-info-page"
              className="ultima-scrollbar ultima-sub-info-mobile-content min-h-0 flex-1 overflow-y-auto pb-3 pr-1"
            >
              <section className="ultima-sub-info-section ultima-sub-info-overview">
                <div className="ultima-sub-info-section-heading">
                  <div>
                    <p className="ultima-sub-info-eyebrow">
                      {t('ultima.subscriptionInfo.eyebrow')}
                    </p>
                    <h1>{subscriptionTitle}</h1>
                  </div>
                  {statusPill}
                </div>

                <dl className="ultima-sub-info-facts ultima-sub-info-overview-facts">
                  <div>
                    <dt>{t('ultima.subscriptionInfo.validUntil')}</dt>
                    <dd>{endDateLabel}</dd>
                  </div>
                  {[
                    [t('ultima.subscriptionInfo.timeLeft'), timeLeftLabel],
                    [t('ultima.subscriptionInfo.devices'), String(deviceCount)],
                    [t('ultima.subscriptionInfo.servers'), String(serverCount)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="ultima-sub-info-action-list ultima-sub-info-overview-actions">
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
