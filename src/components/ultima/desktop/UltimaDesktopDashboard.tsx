import { type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActiveDiscount, PromoOffer } from '@/api/promo';
import { cn } from '@/lib/utils';
import type { Subscription } from '@/types';

export type UltimaDashboardStatusTone = 'active' | 'trial' | 'warning' | 'expired';

type UltimaDesktopDashboardProps = {
  heroButton: ReactNode;
  subscription: Subscription | null;
  expiryLabel: string;
  statusLabel: string;
  statusTone: UltimaDashboardStatusTone;
  daysLeft: number | null;
  connectionStep: 1 | 2 | 3;
  isConnectionCompleted: boolean;
  buyCtaLabel: string;
  buyFromLabel: string;
  promoMessage: string | null;
  activeDiscount?: ActiveDiscount;
  firstPromoOffer: PromoOffer | null;
  showTrialSetupCard: boolean;
  trialGuide: ReactNode | null;
  hasSetupReminder: boolean;
  hasCompactSetupReminder: boolean;
  showConnectionCtaHighlight: boolean;
  onBuySubscription: () => void;
  onOpenConnection: () => void;
  onOpenDevices: () => void;
  onOpenSubscriptionInfo: () => void;
  onOpenSupport: () => void;
  onActivateOffer: (() => void) | null;
  isActivatingOffer: boolean;
  bottomNav: ReactNode;
};

type DesktopMetricCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  meta: string;
};

type DesktopQuickActionProps = {
  label: string;
  hint: string;
  onClick: () => void;
};

const sharedCardClassName =
  'rounded-[30px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_22px_48px_rgba(3,14,24,0.24)] backdrop-blur-xl';

const defaultCardStyle: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 22%, transparent)',
  background:
    'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-surface) 30%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 66%, transparent))',
};

const accentCardStyle: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 32%, transparent)',
  background:
    'linear-gradient(145deg, color-mix(in srgb, var(--ultima-color-aura) 22%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 72%, transparent))',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.08), 0 28px 56px color-mix(in srgb, var(--ultima-color-aura) 12%, transparent)',
};

const toneMap: Record<
  UltimaDashboardStatusTone,
  { chip: string; glow: string; accent: string; soft: string }
> = {
  active: {
    chip: 'border-emerald-200/30 bg-emerald-300/12 text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
    glow: 'bg-emerald-300/40',
    accent: 'text-emerald-100',
    soft: 'text-emerald-200/80',
  },
  trial: {
    chip: 'border-cyan-200/30 bg-cyan-300/12 text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
    glow: 'bg-cyan-300/42',
    accent: 'text-cyan-100',
    soft: 'text-cyan-200/82',
  },
  warning: {
    chip: 'border-amber-200/30 bg-amber-300/12 text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
    glow: 'bg-amber-300/42',
    accent: 'text-amber-100',
    soft: 'text-amber-200/82',
  },
  expired: {
    chip: 'border-rose-200/28 bg-rose-300/12 text-rose-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
    glow: 'bg-rose-300/40',
    accent: 'text-rose-100',
    soft: 'text-rose-200/80',
  },
};

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M7 2.75V5m10-2.25V5M3.75 8.5h16.5M5.75 4.5h12.5A1.75 1.75 0 0 1 20 6.25v11.5a1.75 1.75 0 0 1-1.75 1.75H5.75A1.75 1.75 0 0 1 4 17.75V6.25A1.75 1.75 0 0 1 5.75 4.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const DevicesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="3.5" y="5" width="11" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="16.5" y="8" width="4" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8.75 15.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ServersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="4" y="4" width="16" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="4" y="10" width="16" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="4" y="16" width="16" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M7 6.5h.01M7 12.5h.01M7 18h.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const TrafficIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M19 5 5 19M7.5 7.5A6.5 6.5 0 1 1 16.5 16.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ConnectionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M8 12a4 4 0 0 1 4-4h4M16 12a4 4 0 0 1-4 4H8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M5 9h3v3M19 12h-3V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

const ArrowUpRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path
      d="M7 17 17 7M9 7h8v8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function DesktopMetricCard({ icon, label, value, meta }: DesktopMetricCardProps) {
  return (
    <div className={cn(sharedCardClassName, 'p-4')} style={defaultCardStyle}>
      <div className="text-white/84 mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
        {icon}
      </div>
      <div className="text-white/42 text-[11px] uppercase tracking-[0.22em]">{label}</div>
      <div className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] text-white">
        {value}
      </div>
      <div className="text-white/62 mt-2 text-sm leading-snug">{meta}</div>
    </div>
  );
}

function DesktopQuickAction({ label, hint, onClick }: DesktopQuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:bg-white/[0.08]"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-white/92 text-sm font-medium">{label}</div>
          <div className="text-white/58 mt-1 text-xs leading-snug">{hint}</div>
        </div>
        <span className="text-white/68 rounded-full border border-white/10 p-1">
          <ArrowUpRightIcon />
        </span>
      </div>
    </button>
  );
}

export function UltimaDesktopDashboardSkeleton({ bottomNav }: { bottomNav: ReactNode }) {
  return (
    <div className="ultima-shell-inner lg:max-w-[1180px]">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_360px] lg:items-start">
        <div className="space-y-5">
          <section className={cn(sharedCardClassName, 'min-h-[280px]')} style={accentCardStyle}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center">
              <div>
                <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
                <div className="mt-5 h-16 w-[78%] animate-pulse rounded-[28px] bg-white/10" />
                <div className="mt-4 h-5 w-[60%] animate-pulse rounded-full bg-white/10" />
                <div className="mt-8 flex gap-3">
                  <div className="h-14 flex-1 animate-pulse rounded-full bg-white/10" />
                  <div className="h-14 w-[240px] animate-pulse rounded-full bg-white/10" />
                </div>
              </div>
              <div className="mx-auto h-[152px] w-[152px] animate-pulse rounded-full border border-white/10 bg-white/[0.06]" />
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={cn(sharedCardClassName, 'min-h-[164px] animate-pulse')}
                style={defaultCardStyle}
              />
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div
              className={cn(sharedCardClassName, 'min-h-[250px] animate-pulse')}
              style={defaultCardStyle}
            />
            <div
              className={cn(sharedCardClassName, 'min-h-[250px] animate-pulse')}
              style={defaultCardStyle}
            />
          </div>
        </div>

        <aside className="space-y-5">
          <div
            className={cn(sharedCardClassName, 'min-h-[280px] animate-pulse')}
            style={defaultCardStyle}
          />
          <div className="ultima-nav-dock mt-0">{bottomNav}</div>
        </aside>
      </div>
    </div>
  );
}

export function UltimaDesktopDashboard({
  heroButton,
  subscription,
  expiryLabel,
  statusLabel,
  statusTone,
  daysLeft,
  connectionStep,
  isConnectionCompleted,
  buyCtaLabel,
  buyFromLabel,
  promoMessage,
  activeDiscount,
  firstPromoOffer,
  showTrialSetupCard,
  trialGuide,
  hasSetupReminder,
  hasCompactSetupReminder,
  showConnectionCtaHighlight,
  onBuySubscription,
  onOpenConnection,
  onOpenDevices,
  onOpenSubscriptionInfo,
  onOpenSupport,
  onActivateOffer,
  isActivatingOffer,
  bottomNav,
}: UltimaDesktopDashboardProps) {
  const { t } = useTranslation();
  const tone = toneMap[statusTone];
  const normalizedDeviceLimit = Math.max(0, subscription?.device_limit ?? 0);
  const serversCount = Math.max(0, subscription?.servers.length ?? 0);
  const trafficLimitGb = subscription?.traffic_limit_gb ?? 0;
  const trafficUsedGb = subscription?.traffic_used_gb ?? 0;
  const trafficUsedPercent = clampPercent(subscription?.traffic_used_percent ?? 0);
  const connectionProgress = isConnectionCompleted
    ? 100
    : connectionStep === 3
      ? 88
      : connectionStep === 2
        ? 62
        : 28;
  const trafficLimitLabel =
    trafficLimitGb > 0
      ? `${trafficLimitGb} ${t('common.units.gb', { defaultValue: 'ГБ' })}`
      : t('subscription.unlimited', { defaultValue: 'Безлимит' });
  const daysLeftLabel =
    daysLeft === null
      ? '...'
      : t('ultima.desktop.daysLeftValue', {
          count: Math.max(daysLeft, 0),
          defaultValue: `${Math.max(daysLeft, 0)}`,
        });
  const daysLeftMeta =
    daysLeft === null
      ? t('subscription.notActive', { defaultValue: 'Подписка не активна' })
      : t('ultima.desktop.daysLeftMeta', {
          count: Math.max(daysLeft, 0),
          defaultValue: 'до следующего обновления доступа',
        });
  const discountPercent =
    activeDiscount?.is_active === true
      ? activeDiscount.discount_percent
      : (firstPromoOffer?.discount_percent ?? null);
  const supportCardTitle = hasSetupReminder
    ? t('ultima.setupNotFinishedTitle', { defaultValue: 'Установка не завершена' })
    : hasCompactSetupReminder
      ? t('ultima.setupCompactTitle', { defaultValue: 'VPN ещё не настроен' })
      : activeDiscount?.is_active === true
        ? t('promo.offers.discountActiveTitle', {
            percent: activeDiscount.discount_percent,
            defaultValue: `Активна скидка ${activeDiscount.discount_percent}%`,
          })
        : firstPromoOffer
          ? t('promo.offers.specialOffer', { defaultValue: 'Спецпредложение' })
          : t('support.title', { defaultValue: 'Поддержка и навигация' });
  const supportCardDescription = hasSetupReminder
    ? t('ultima.setupNotFinishedDesc', {
        defaultValue: 'Вернитесь к настройке и завершите подключение VPN.',
      })
    : hasCompactSetupReminder
      ? t('ultima.setupCompactDesc', {
          defaultValue: 'Откройте установку и завершите подключение, когда будет удобно.',
        })
      : activeDiscount?.is_active === true
        ? t('promo.useNow', {
            defaultValue: 'Скидка уже активна. Можно использовать сейчас.',
          })
        : firstPromoOffer
          ? t('promo.offers.activateDiscountHint', {
              defaultValue: 'Активируйте предложение, чтобы зафиксировать выгоду на оплате.',
            })
          : t('ultima.desktop.supportHint', {
              defaultValue:
                'Откройте детали подписки, устройства или чат поддержки без лишних переходов.',
            });

  const renderSpotlightCard = () => {
    if (showTrialSetupCard && trialGuide) {
      return trialGuide;
    }

    return (
      <section className={cn(sharedCardClassName, 'h-full')} style={defaultCardStyle}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-white/42 text-[11px] uppercase tracking-[0.22em]">
              {t('ultima.desktop.focusLabel', { defaultValue: 'Фокус на сейчас' })}
            </div>
            <h2 className="mt-3 text-[26px] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
              {supportCardTitle}
            </h2>
            <p className="mt-3 max-w-[38ch] text-sm leading-[1.55] text-white/70">
              {supportCardDescription}
            </p>
            {promoMessage && <p className="text-white/88 mt-3 text-sm">{promoMessage}</p>}
          </div>
          <div className="text-white/84 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
            {firstPromoOffer || activeDiscount?.is_active ? <TrafficIcon /> : <SupportIcon />}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {(hasSetupReminder || hasCompactSetupReminder) && (
            <button
              type="button"
              onClick={onOpenConnection}
              className="ultima-btn-pill ultima-btn-primary px-5 py-3 text-[15px]"
            >
              {t('ultima.finishSetup', { defaultValue: 'Завершить установку' })}
            </button>
          )}
          {!hasSetupReminder && !hasCompactSetupReminder && onActivateOffer && firstPromoOffer && (
            <button
              type="button"
              onClick={onActivateOffer}
              disabled={isActivatingOffer}
              className="ultima-btn-pill ultima-btn-secondary px-5 py-3 text-[15px] disabled:opacity-60"
            >
              {t('promo.activate', { defaultValue: 'Активировать' })}
            </button>
          )}
          {!hasSetupReminder && !hasCompactSetupReminder && (
            <button
              type="button"
              onClick={
                firstPromoOffer || activeDiscount?.is_active ? onBuySubscription : onOpenSupport
              }
              className="ultima-btn-pill ultima-btn-primary px-5 py-3 text-[15px]"
            >
              {firstPromoOffer || activeDiscount?.is_active
                ? t('promo.useNow', { defaultValue: 'Использовать' })
                : t('support.title', { defaultValue: 'Поддержка' })}
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <DesktopQuickAction
            label={t('subscription.details', { defaultValue: 'Детали подписки' })}
            hint={t('ultima.desktop.quick.subscription', {
              defaultValue: 'Проверить срок, трафик и текущие параметры.',
            })}
            onClick={onOpenSubscriptionInfo}
          />
          <DesktopQuickAction
            label={t('lite.devicesTotal', { defaultValue: 'Устройства' })}
            hint={t('ultima.desktop.quick.devices', {
              defaultValue: 'Управление лимитом и списком подключенных девайсов.',
            })}
            onClick={onOpenDevices}
          />
          <DesktopQuickAction
            label={t('lite.connectAndSetup', { defaultValue: 'Установка и настройка' })}
            hint={t('ultima.desktop.quick.connection', {
              defaultValue: 'Открыть flow подключения и пройти шаги заново.',
            })}
            onClick={onOpenConnection}
          />
        </div>
      </section>
    );
  };

  return (
    <div className="ultima-shell-inner lg:max-w-[1180px]">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_360px] lg:items-start">
        <div className="space-y-5">
          <section
            className={cn(sharedCardClassName, 'relative overflow-hidden p-6 lg:p-7')}
            style={accentCardStyle}
          >
            <div className="absolute inset-y-0 right-[-12%] w-[42%] rounded-full bg-white/[0.05] blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center">
              <div>
                <div className="text-white/42 text-[11px] uppercase tracking-[0.24em]">
                  {t('ultima.desktop.overline', { defaultValue: 'Ultima Desktop' })}
                </div>
                <h1 className="mt-4 max-w-[12ch] text-[clamp(42px,6vw,68px)] font-semibold leading-[0.94] tracking-[-0.045em] text-white">
                  {expiryLabel}
                </h1>
                <p className="text-white/72 mt-4 max-w-[56ch] text-[15px] leading-[1.65]">
                  {isConnectionCompleted
                    ? t('ultima.desktop.connectedSummary', {
                        defaultValue:
                          'Доступ уже активен. На desktop вы сразу видите срок подписки, нагрузку по трафику и ключевые действия без мобильной тесноты.',
                      })
                    : t('ultima.desktop.pendingSummary', {
                        defaultValue:
                          'Интерфейс собран как desktop cockpit: главные действия и состояние подключения находятся на одном экране, а не прячутся ниже fold.',
                      })}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      'relative inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm',
                      tone.chip,
                    )}
                  >
                    <span
                      className={cn(
                        'absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full blur-[6px]',
                        tone.glow,
                      )}
                    />
                    <span className="relative h-2 w-2 rounded-full bg-current" />
                    {statusLabel}
                  </span>
                  <span className={cn('text-sm', tone.soft)}>
                    {daysLeft === null
                      ? t('ultima.desktop.noDeadline', {
                          defaultValue: 'Срок появится после активации доступа.',
                        })
                      : t('ultima.desktop.daysLeftShort', {
                          count: Math.max(daysLeft, 0),
                          defaultValue: `${Math.max(daysLeft, 0)} дней осталось`,
                        })}
                  </span>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onBuySubscription}
                    className="ultima-btn-pill ultima-btn-primary inline-flex min-h-[54px] items-center justify-between gap-4 px-6 text-[15px]"
                  >
                    <span>{buyCtaLabel}</span>
                    <span className="text-white/84">{buyFromLabel}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenConnection}
                    className={cn(
                      'ultima-btn-pill inline-flex min-h-[54px] items-center justify-between gap-4 px-6 text-[15px]',
                      showConnectionCtaHighlight ? 'ultima-btn-primary' : 'ultima-btn-secondary',
                    )}
                  >
                    <span>
                      {t('lite.connectAndSetup', { defaultValue: 'Установка и настройка' })}
                    </span>
                    <span className="text-white/68">
                      {t('ultima.desktop.stepShort', {
                        step: isConnectionCompleted ? 3 : connectionStep,
                        defaultValue: `Шаг ${isConnectionCompleted ? 3 : connectionStep}/3`,
                      })}
                    </span>
                  </button>
                </div>
              </div>

              <div className="mx-auto flex items-center justify-center lg:justify-self-end">
                {heroButton}
              </div>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-4">
            <DesktopMetricCard
              icon={<CalendarIcon />}
              label={t('subscription.status', { defaultValue: 'Статус' })}
              value={daysLeftLabel}
              meta={daysLeftMeta}
            />
            <DesktopMetricCard
              icon={<DevicesIcon />}
              label={t('lite.devicesTotal', { defaultValue: 'Устройства' })}
              value={String(normalizedDeviceLimit)}
              meta={t('ultima.desktop.devicesMeta', {
                count: normalizedDeviceLimit,
                defaultValue: 'доступно в подписке сейчас',
              })}
            />
            <DesktopMetricCard
              icon={<TrafficIcon />}
              label={t('subscription.traffic', { defaultValue: 'Трафик' })}
              value={trafficLimitLabel}
              meta={t('ultima.desktop.trafficMeta', {
                defaultValue: `${trafficUsedPercent}% уже использовано`,
              })}
            />
            <DesktopMetricCard
              icon={<ServersIcon />}
              label={
                discountPercent
                  ? t('promo.discount', { defaultValue: 'Скидка' })
                  : t('subscription.servers', { defaultValue: 'Серверы' })
              }
              value={discountPercent ? `${discountPercent}%` : String(serversCount)}
              meta={
                discountPercent
                  ? t('ultima.desktop.discountMeta', {
                      defaultValue: 'активная выгода на оплату',
                    })
                  : t('ultima.desktop.serversMeta', {
                      defaultValue: 'доступно для текущего доступа',
                    })
              }
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <section className={cn(sharedCardClassName, 'p-5')} style={defaultCardStyle}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-white/42 text-[11px] uppercase tracking-[0.22em]">
                    {t('ultima.desktop.cockpitLabel', { defaultValue: 'Control Center' })}
                  </div>
                  <h2 className="mt-3 text-[28px] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
                    {t('ultima.desktop.connectionTitle', {
                      defaultValue: 'Подключение и текущая нагрузка',
                    })}
                  </h2>
                </div>
                <div className="text-white/84 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                  <ConnectionIcon />
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <div className="text-white/74 mb-2 flex items-center justify-between gap-3 text-sm">
                    <span>
                      {t('ultima.desktop.connectionProgress', {
                        defaultValue: 'Прогресс подключения',
                      })}
                    </span>
                    <span className={tone.accent}>
                      {isConnectionCompleted
                        ? t('common.done', { defaultValue: 'Готово' })
                        : t('ultima.desktop.stepCounter', {
                            step: connectionStep,
                            defaultValue: `Шаг ${connectionStep} из 3`,
                          })}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-black/20">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${connectionProgress}%`,
                        background:
                          'linear-gradient(90deg, var(--ultima-color-primary), color-mix(in srgb, var(--ultima-color-ring) 84%, #fff))',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-white/74 mb-2 flex items-center justify-between gap-3 text-sm">
                    <span>{t('subscription.traffic', { defaultValue: 'Трафик' })}</span>
                    <span className="text-white/92">
                      {trafficLimitGb > 0
                        ? `${trafficUsedGb.toFixed(1)} / ${trafficLimitGb} ${t('common.units.gb', {
                            defaultValue: 'ГБ',
                          })}`
                        : t('subscription.unlimited', { defaultValue: 'Безлимит' })}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-black/20">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${trafficLimitGb > 0 ? trafficUsedPercent : 18}%`,
                        background:
                          'linear-gradient(90deg, color-mix(in srgb, var(--ultima-color-ring) 78%, #fff), var(--ultima-color-primary))',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <DesktopQuickAction
                  label={t('subscription.details', { defaultValue: 'Детали подписки' })}
                  hint={t('ultima.desktop.quick.subscription', {
                    defaultValue: 'Срок, параметры и статус доступа.',
                  })}
                  onClick={onOpenSubscriptionInfo}
                />
                <DesktopQuickAction
                  label={t('lite.devicesTotal', { defaultValue: 'Устройства' })}
                  hint={t('ultima.desktop.quick.devices', {
                    defaultValue: 'Лимит, список и управление устройствами.',
                  })}
                  onClick={onOpenDevices}
                />
                <DesktopQuickAction
                  label={t('support.title', { defaultValue: 'Поддержка' })}
                  hint={t('ultima.desktop.quick.support', {
                    defaultValue: 'Открыть чат и решить вопросы без поиска.',
                  })}
                  onClick={onOpenSupport}
                />
              </div>
            </section>

            {renderSpotlightCard()}
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-5">
          <section className={cn(sharedCardClassName, 'p-5')} style={defaultCardStyle}>
            <div className="text-white/42 text-[11px] uppercase tracking-[0.22em]">
              {t('ultima.desktop.summaryLabel', { defaultValue: 'Account Summary' })}
            </div>
            <div className="mt-3 text-[34px] font-semibold leading-[0.98] tracking-[-0.04em] text-white">
              {expiryLabel}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  'relative inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs',
                  tone.chip,
                )}
              >
                <span
                  className={cn(
                    'absolute left-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full blur-[4px]',
                    tone.glow,
                  )}
                />
                <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
                {statusLabel}
              </span>
              <span className="text-white/58 text-sm">
                {t('ultima.desktop.rightRailHint', {
                  defaultValue: 'Быстрый срез по доступу и переходам.',
                })}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/62 text-sm">
                    {t('ultima.desktop.connectionState', { defaultValue: 'Состояние подключения' })}
                  </span>
                  <span className="text-white/88 text-sm font-medium">
                    {isConnectionCompleted
                      ? t('common.done', { defaultValue: 'Готово' })
                      : t('ultima.desktop.stepCounter', {
                          step: connectionStep,
                          defaultValue: `Шаг ${connectionStep} из 3`,
                        })}
                  </span>
                </div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/62 text-sm">
                    {t('subscription.traffic', { defaultValue: 'Трафик' })}
                  </span>
                  <span className="text-white/88 text-sm font-medium">
                    {trafficLimitGb > 0 ? `${trafficUsedPercent}%` : '∞'}
                  </span>
                </div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/62 text-sm">
                    {discountPercent
                      ? t('promo.discount', { defaultValue: 'Скидка' })
                      : t('subscription.servers', { defaultValue: 'Серверы' })}
                  </span>
                  <span className="text-white/88 text-sm font-medium">
                    {discountPercent ? `${discountPercent}%` : serversCount}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="ultima-nav-dock mt-0">{bottomNav}</div>
        </aside>
      </div>
    </div>
  );
}
