import { type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  CheckCircle2,
  Gauge,
  Headphones,
  MonitorSmartphone,
  Router,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import type { ActiveDiscount, PromoOffer } from '@/api/promo';
import {
  ultimaAccentSurfaceStyle,
  ultimaCardClassName,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';
import type { UltimaNextActionKind } from '@/features/ultima/nextAction';
import { cn } from '@/lib/utils';
import type { Subscription } from '@/types';
import { UltimaDesktopRail, UltimaDesktopTopbar } from './UltimaDesktopWorkspace';

export type UltimaDashboardStatusTone = 'active' | 'trial' | 'warning' | 'expired';

type UltimaDesktopDashboardProps = {
  heroButton: ReactNode;
  referralCta?: ReactNode;
  devicesCta?: ReactNode;
  trafficWarning?: ReactNode;
  subscription: Subscription | null;
  connectedDevicesCount: number;
  isDevicesLoading: boolean;
  expiryLabel: string;
  statusLabel: string;
  statusTone: UltimaDashboardStatusTone;
  daysLeft: number | null;
  connectionStep: 1 | 2 | 3;
  isConnectionCompleted: boolean;
  primaryActionKind: UltimaNextActionKind;
  primaryCtaLabel: string;
  primaryCtaMeta: string;
  promoMessage: string | null;
  activeDiscount?: ActiveDiscount;
  firstPromoOffer: PromoOffer | null;
  showTrialSetupCard: boolean;
  trialGuide: ReactNode | null;
  showConnectionCtaHighlight: boolean;
  onPrimaryAction: () => void;
  onBuySubscription: () => void;
  onOpenConnection: () => void;
  onOpenSupport: () => void;
  onActivateOffer: (() => void) | null;
  isActivatingOffer: boolean;
  bottomNav: ReactNode;
};

type DashboardMetricProps = {
  icon: ReactNode;
  label: string;
  value: string;
  meta: string;
};

const defaultCardStyle: CSSProperties = ultimaSurfaceStyle;
const accentCardStyle: CSSProperties = ultimaAccentSurfaceStyle;

const toneMap: Record<
  UltimaDashboardStatusTone,
  { chip: string; accent: string; progress: string }
> = {
  active: {
    chip: 'border-emerald-200/25 bg-emerald-300/[0.12] text-emerald-50',
    accent: 'text-emerald-100/[0.88]',
    progress: 'var(--ultima-color-primary)',
  },
  trial: {
    chip: 'border-cyan-200/25 bg-cyan-300/[0.12] text-cyan-50',
    accent: 'text-cyan-100/[0.88]',
    progress: 'rgb(103 232 249 / 0.88)',
  },
  warning: {
    chip: 'border-amber-200/25 bg-amber-300/[0.12] text-amber-50',
    accent: 'text-amber-100/[0.88]',
    progress: 'rgb(252 211 77 / 0.88)',
  },
  expired: {
    chip: 'border-rose-200/25 bg-rose-300/[0.12] text-rose-50',
    accent: 'text-rose-100/[0.88]',
    progress: 'rgb(253 164 175 / 0.88)',
  },
};

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function DashboardMetric({ icon, label, value, meta }: DashboardMetricProps) {
  return (
    <article className={cn(ultimaCardClassName, 'min-w-0 p-4')} style={defaultCardStyle}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-white/[0.08] bg-white/[0.04] text-emerald-50/[0.82]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[9px] font-semibold uppercase text-white/[0.4]">{label}</p>
          <p className="mt-1.5 truncate text-[22px] font-semibold leading-none text-white/[0.96]">
            {value}
          </p>
          <p className="mt-1.5 truncate text-[11px] text-white/[0.5]">{meta}</p>
        </div>
      </div>
    </article>
  );
}

export function UltimaDesktopDashboardSkeleton({ bottomNav }: { bottomNav: ReactNode }) {
  return (
    <div className="ultima-shell-inner ultima-desktop-workspace">
      <UltimaDesktopRail bottomNav={bottomNav} />
      <div className="ultima-desktop-stage">
        <UltimaDesktopTopbar />
        <div className="ultima-desktop-stage-body has-context">
          <main className="ultima-desktop-main">
            <div className="space-y-4">
              <section
                className={cn(ultimaCardClassName, 'min-h-[228px] animate-pulse')}
                style={accentCardStyle}
              />
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(ultimaCardClassName, 'min-h-[104px] animate-pulse')}
                    style={defaultCardStyle}
                  />
                ))}
              </div>
              <section
                className={cn(ultimaCardClassName, 'min-h-[238px] animate-pulse')}
                style={defaultCardStyle}
              />
            </div>
          </main>
          <aside className="ultima-desktop-context space-y-3">
            <section
              className={cn(ultimaCardClassName, 'min-h-[148px] animate-pulse')}
              style={defaultCardStyle}
            />
            <section
              className={cn(ultimaCardClassName, 'min-h-[148px] animate-pulse')}
              style={defaultCardStyle}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

export function UltimaDesktopDashboard({
  heroButton,
  referralCta,
  devicesCta,
  trafficWarning,
  subscription,
  connectedDevicesCount,
  isDevicesLoading,
  expiryLabel,
  statusLabel,
  statusTone,
  daysLeft,
  connectionStep,
  isConnectionCompleted,
  primaryActionKind,
  primaryCtaLabel,
  primaryCtaMeta,
  promoMessage,
  activeDiscount,
  firstPromoOffer,
  showTrialSetupCard,
  trialGuide,
  showConnectionCtaHighlight,
  onPrimaryAction,
  onBuySubscription,
  onOpenConnection,
  onOpenSupport,
  onActivateOffer,
  isActivatingOffer,
  bottomNav,
}: UltimaDesktopDashboardProps) {
  const { t, i18n } = useTranslation();
  const tone = toneMap[statusTone];
  const deviceLimit = Math.max(0, subscription?.device_limit ?? 0);
  const serversCount = Math.max(0, subscription?.servers?.length ?? 0);
  const trafficLimitGb = Math.max(0, subscription?.traffic_limit_gb ?? 0);
  const trafficUsedGb = Math.max(0, subscription?.traffic_used_gb ?? 0);
  const trafficUsedPercent = clampPercent(subscription?.traffic_used_percent ?? 0);
  const trafficRemainingGb = Math.max(0, trafficLimitGb - trafficUsedGb);
  const isMeteredTraffic = subscription?.metered_traffic_enabled === true;
  const formatter = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 });
  const unit = t('common.units.gb', { defaultValue: 'ГБ' });
  const planName =
    subscription?.tariff_name ||
    (subscription?.is_trial
      ? t('subscription.trialStatus', { defaultValue: 'Пробный период' })
      : t('subscription.infoTitle', { defaultValue: 'Подписка' }));
  const daysValue = daysLeft === null ? '—' : formatter.format(Math.max(daysLeft, 0));
  const trafficValue = !subscription
    ? '—'
    : trafficLimitGb > 0
      ? `${formatter.format(trafficRemainingGb)} ${unit}`
      : t('subscription.unlimited', { defaultValue: 'Безлимит' });
  const trafficUsageLabel = !subscription
    ? t('subscription.notActive', { defaultValue: 'Не активна' })
    : trafficLimitGb > 0
      ? `${formatter.format(trafficUsedGb)} / ${formatter.format(trafficLimitGb)} ${unit}`
      : t('subscription.unlimited', { defaultValue: 'Безлимит' });
  const deviceValue = isDevicesLoading ? '…' : `${connectedDevicesCount}/${deviceLimit}`;
  const connectionProgress = isConnectionCompleted
    ? 100
    : connectionStep === 3
      ? 88
      : connectionStep === 2
        ? 62
        : 28;
  const hasDiscount = activeDiscount?.is_active === true || Boolean(firstPromoOffer);
  const discountPercent =
    activeDiscount?.is_active === true
      ? activeDiscount.discount_percent
      : (firstPromoOffer?.discount_percent ?? null);

  const spotlight =
    showTrialSetupCard && trialGuide ? (
      trialGuide
    ) : hasDiscount ? (
      <section className={cn(ultimaCardClassName, 'h-full p-5')} style={defaultCardStyle}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase text-white/[0.4]">
              {t('promo.offers.specialOffer', { defaultValue: 'Спецпредложение' })}
            </p>
            <h2 className="mt-2 text-[20px] font-semibold leading-tight text-white/[0.95]">
              {discountPercent
                ? t('promo.offers.discountActiveTitle', {
                    percent: discountPercent,
                    defaultValue: `Скидка ${discountPercent}%`,
                  })
                : t('promo.offers.specialOffer', { defaultValue: 'Спецпредложение' })}
            </h2>
            <p className="mt-2 text-[13px] leading-snug text-white/[0.56]">
              {activeDiscount?.is_active
                ? t('promo.useNow', { defaultValue: 'Скидка уже активна.' })
                : t('promo.offers.activateDiscountHint', {
                    defaultValue: 'Активируйте предложение перед оплатой.',
                  })}
            </p>
          </div>
          <Gauge className="h-5 w-5 shrink-0 text-emerald-100/[0.78]" />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {onActivateOffer && firstPromoOffer ? (
            <button
              type="button"
              onClick={onActivateOffer}
              disabled={isActivatingOffer}
              className="ultima-btn-pill ultima-btn-secondary min-h-[42px] px-4 text-[13px] disabled:opacity-60"
            >
              {t('promo.activate', { defaultValue: 'Активировать' })}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onBuySubscription}
            className="ultima-btn-pill ultima-btn-primary min-h-[42px] px-4 text-[13px]"
          >
            {t('promo.useNow', { defaultValue: 'Использовать' })}
          </button>
        </div>
      </section>
    ) : null;

  return (
    <div className="ultima-shell-inner ultima-desktop-workspace">
      <UltimaDesktopRail bottomNav={bottomNav} />
      <div className="ultima-desktop-stage">
        <UltimaDesktopTopbar />
        <div className="ultima-desktop-stage-body has-context">
          <main className="ultima-desktop-main">
            <div data-testid="ultima-home-desktop" className="space-y-4">
              <section className={cn(ultimaCardClassName, 'relative p-6')} style={accentCardStyle}>
                <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_148px] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[10px] font-semibold uppercase text-white/[0.42]">
                        {t('ultima.currentTariff', { defaultValue: 'Ваш тариф' })}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold',
                          tone.chip,
                        )}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {statusLabel}
                      </span>
                    </div>
                    <h1 className="mt-4 max-w-[22ch] break-words text-[40px] font-semibold leading-[0.98] text-white/[0.98]">
                      {planName}
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
                      <span className="text-white/[0.68]">{expiryLabel}</span>
                      <span className={tone.accent}>
                        {daysLeft === null
                          ? t('ultima.desktop.noDeadline', {
                              defaultValue: 'Срок появится после активации',
                            })
                          : t('ultima.desktop.daysLeftShort', {
                              count: Math.max(daysLeft, 0),
                              defaultValue: `${Math.max(daysLeft, 0)} дней осталось`,
                            })}
                      </span>
                    </div>
                    {promoMessage ? (
                      <p className="mt-3 text-[12px] text-white/[0.74]">{promoMessage}</p>
                    ) : null}
                    <div className="mt-6 flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={onPrimaryAction}
                        className="ultima-btn-pill ultima-btn-primary inline-flex min-h-[46px] items-center gap-4 px-5 text-[14px]"
                      >
                        <span>{primaryCtaLabel}</span>
                        <span className="text-white/[0.72]">{primaryCtaMeta}</span>
                      </button>
                      {primaryActionKind !== 'setup' ? (
                        <button
                          type="button"
                          onClick={onOpenConnection}
                          className={cn(
                            'ultima-btn-pill inline-flex min-h-[46px] items-center gap-2 px-5 text-[14px]',
                            showConnectionCtaHighlight
                              ? 'ultima-btn-primary'
                              : 'ultima-btn-secondary',
                          )}
                        >
                          <Wrench className="h-4 w-4" />
                          {t('lite.connectAndSetup', { defaultValue: 'Установка и настройка' })}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mx-auto flex items-center justify-center lg:justify-self-end">
                    {heroButton}
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <DashboardMetric
                  icon={<CalendarDays className="h-5 w-5" />}
                  label={t('subscription.timeLeft', { defaultValue: 'Осталось времени' })}
                  value={daysValue}
                  meta={t('ultima.home.daysMeta', { defaultValue: 'дней доступа' })}
                />
                <DashboardMetric
                  icon={<Gauge className="h-5 w-5" />}
                  label={t('ultima.trafficRemaining', { defaultValue: 'Осталось трафика' })}
                  value={trafficValue}
                  meta={trafficUsageLabel}
                />
                <DashboardMetric
                  icon={<MonitorSmartphone className="h-5 w-5" />}
                  label={t('lite.devicesTotal', { defaultValue: 'Устройства' })}
                  value={deviceValue}
                  meta={t('ultima.home.devicesMeta', { defaultValue: 'подключено / доступно' })}
                />
                <DashboardMetric
                  icon={<Router className="h-5 w-5" />}
                  label={t('subscription.servers', { defaultValue: 'Серверы' })}
                  value={String(serversCount)}
                  meta={t('ultima.desktop.serversMeta', {
                    defaultValue: 'доступно для текущего доступа',
                  })}
                />
              </div>

              <div
                className={cn(
                  'grid gap-4',
                  spotlight ? 'xl:grid-cols-[minmax(0,1fr)_320px]' : 'grid-cols-1',
                )}
              >
                <section
                  data-testid="ultima-home-usage"
                  className={cn(ultimaCardClassName, 'min-w-0 p-5')}
                  style={defaultCardStyle}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-[19px] font-semibold text-white/[0.95]">
                        {t('ultima.home.usage', { defaultValue: 'Использование' })}
                      </h2>
                      <p className="mt-1 text-[12px] text-white/[0.46]">
                        {t('ultima.home.usageHint', {
                          defaultValue: 'Трафик и готовность подключения',
                        })}
                      </p>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-emerald-100/[0.72]" />
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3 text-[12px]">
                        <span className="text-white/[0.58]">
                          {isMeteredTraffic
                            ? subscription?.metered_server_label ||
                              t('ultima.meteredTraffic.defaultLabel', {
                                defaultValue: 'Спецсерверы',
                              })
                            : t('subscription.traffic', { defaultValue: 'Трафик' })}
                        </span>
                        <span className="font-medium text-white/[0.88]">{trafficUsageLabel}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.18]">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${trafficLimitGb > 0 ? trafficUsedPercent : 18}%`,
                            background: tone.progress,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-[10px] leading-snug text-white/[0.42]">
                        {isMeteredTraffic
                          ? t('ultima.meteredTraffic.unlimitedAvailable', {
                              defaultValue: 'Обычные серверы без лимита',
                            })
                          : t('ultima.home.trafficMeta', {
                              defaultValue: 'Использование за текущий период',
                            })}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3 text-[12px]">
                        <span className="text-white/[0.58]">
                          {t('ultima.desktop.connectionState', { defaultValue: 'Подключение' })}
                        </span>
                        <span className="font-medium text-white/[0.88]">
                          {isConnectionCompleted
                            ? t('common.done', { defaultValue: 'Готово' })
                            : t('ultima.desktop.stepCounter', {
                                step: connectionStep,
                                defaultValue: `Шаг ${connectionStep} из 3`,
                              })}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.18]">
                        <span
                          className="block h-full rounded-full bg-emerald-300/[0.78]"
                          style={{ width: `${connectionProgress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[10px] leading-snug text-white/[0.42]">
                        {isConnectionCompleted
                          ? t('ultima.home.connectionReady', {
                              defaultValue: 'Подписка добавлена и готова к работе',
                            })
                          : t('ultima.home.connectionPending', {
                              defaultValue: 'Завершите настройку приложения',
                            })}
                      </p>
                    </div>
                  </div>
                </section>
                {spotlight}
              </div>
            </div>
          </main>

          <aside className="ultima-desktop-context space-y-3">
            {trafficWarning}
            {referralCta}
            {devicesCta}
            <section className={cn(ultimaCardClassName, 'p-5')} style={defaultCardStyle}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[18px] font-semibold text-white/[0.94]">
                    {t('support.title', { defaultValue: 'Поддержка' })}
                  </h2>
                  <p className="mt-1.5 text-[12px] leading-snug text-white/[0.48]">
                    {t('ultima.desktop.supportHint', {
                      defaultValue: 'Поможем с подключением и доступом.',
                    })}
                  </p>
                </div>
                <Headphones className="h-5 w-5 text-emerald-100/[0.72]" />
              </div>
              <button
                type="button"
                onClick={onOpenSupport}
                className="ultima-btn-pill ultima-btn-secondary mt-4 flex min-h-[42px] w-full items-center justify-center gap-2 px-4 text-[13px]"
              >
                <CheckCircle2 className="h-4 w-4" />
                {t('profile.supportContactTitle', { defaultValue: 'Связаться с поддержкой' })}
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
