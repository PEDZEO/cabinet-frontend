import { type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;

type UltimaDesktopConnectionProps = {
  step: Step;
  title: string;
  subtitle: string;
  importantInfoDescription: string;
  showInfo: boolean;
  canPermanentlyHideReminder: boolean;
  bottomNav: ReactNode;
  onStartInstall: () => void;
  onStartAddSubscription: () => void;
  onAdvance: () => void;
  onFinish: () => void;
  onNeedHelp: () => void;
  onToggleVpn: () => void;
  onDismissInfo: () => void;
  onHideReminderPermanently: () => void;
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

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16 text-white/90">
    <path
      d="M12 4.5v8m0 0 3-3m-3 3-3-3M6 15.5v1A2.5 2.5 0 0 0 8.5 19h7a2.5 2.5 0 0 0 2.5-2.5v-1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16 text-white/90">
    <path
      d="M12 5.5v13m6.5-6.5h-13"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16 text-white/90">
    <path
      d="m6.7 12.2 3.6 3.6 7.1-7.1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StepDoneIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 text-emerald-100">
    <path
      d="m4.8 10.2 3.1 3.1 7.3-7.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function UltimaDesktopConnection({
  step,
  title,
  subtitle,
  importantInfoDescription,
  showInfo,
  canPermanentlyHideReminder,
  bottomNav,
  onStartInstall,
  onStartAddSubscription,
  onAdvance,
  onFinish,
  onNeedHelp,
  onToggleVpn,
  onDismissInfo,
  onHideReminderPermanently,
}: UltimaDesktopConnectionProps) {
  const { t } = useTranslation();
  const isDoneStep = step === 3;
  const progressRatio = step === 1 ? 0.34 : step === 2 ? 0.67 : 1;
  const stepProgressPercent = step === 1 ? 0 : step === 2 ? 50 : 100;
  const ringRadius = 90;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressRatio);
  const icon = step === 1 ? <DownloadIcon /> : step === 2 ? <PlusIcon /> : <CheckIcon />;
  const toggleVpnLabel = t('subscription.connection.toggleVpnInApp', {
    defaultValue: 'Переключить VPN в приложении',
  });
  const stepCards = [
    {
      step: 1 as Step,
      title: t('subscription.connection.installApp', {
        defaultValue: 'Установить приложение',
      }),
      subtitle: t('subscription.connection.desktopInstallHint', {
        defaultValue: 'Скачайте Happ и вернитесь к настройке.',
      }),
    },
    {
      step: 2 as Step,
      title: t('subscription.connection.addSubscription', {
        defaultValue: 'Добавить подписку',
      }),
      subtitle: t('subscription.connection.desktopConfigHint', {
        defaultValue: 'Откройте ссылку и импортируйте конфигурацию.',
      }),
    },
    {
      step: 3 as Step,
      title: toggleVpnLabel,
      subtitle: t('subscription.connection.desktopToggleHint', {
        defaultValue: 'Включите VPN и завершите настройку.',
      }),
    },
  ];

  const primaryAction =
    step === 1
      ? {
          label: t('subscription.connection.installApp', {
            defaultValue: 'Установить приложение',
          }),
          onClick: onStartInstall,
        }
      : step === 2
        ? {
            label: t('subscription.connection.addSubscription', {
              defaultValue: 'Добавить подписку',
            }),
            onClick: onStartAddSubscription,
          }
        : {
            label: t('subscription.connection.finishSetup', {
              defaultValue: 'Завершить настройку',
            }),
            onClick: onFinish,
          };

  const secondaryAction =
    step === 3
      ? {
          label: t('subscription.connection.needHelp', { defaultValue: 'Нужна помощь' }),
          onClick: onNeedHelp,
        }
      : {
          label: t('subscription.connection.nextStep', { defaultValue: 'Следующий шаг' }),
          onClick: onAdvance,
        };

  return (
    <div className="ultima-shell-inner lg:max-w-[1180px]">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-4">
          <section
            className={cn(sharedCardClassName, 'relative overflow-hidden p-6 lg:p-7')}
            style={accentCardStyle}
          >
            <div className="absolute inset-y-0 right-[-10%] w-[34%] rounded-full bg-white/[0.05] blur-3xl" />
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
              <div>
                <div className="border-emerald-200/28 bg-emerald-300/12 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-emerald-50">
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {t('ultima.desktop.stepShort', {
                    step,
                    defaultValue: `Шаг ${step}/3`,
                  })}
                </div>
                <h1 className="mt-4 text-[clamp(40px,4.8vw,58px)] font-semibold leading-[0.94] tracking-[-0.045em] text-white">
                  {title}
                </h1>
                <p className="text-white/72 mt-3 max-w-[48ch] text-[15px] leading-[1.6]">
                  {subtitle}
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative flex h-[340px] w-[340px] items-center justify-center">
                  <div className="ultima-step-ring border-emerald-200/22 pointer-events-none absolute h-[340px] w-[340px] rounded-full border" />
                  <div className="ultima-step-ring ultima-step-ring-delay-1 pointer-events-none absolute h-[258px] w-[258px] rounded-full border border-emerald-200/20" />
                  <div className="ultima-step-ring ultima-step-ring-delay-2 pointer-events-none absolute h-[180px] w-[180px] rounded-full border border-emerald-300/65" />
                  <svg
                    viewBox="0 0 240 240"
                    className="pointer-events-none absolute -rotate-90"
                    style={{ width: 210, height: 210 }}
                    aria-hidden
                  >
                    <circle
                      cx="120"
                      cy="120"
                      r={ringRadius}
                      fill="none"
                      stroke="rgba(180,255,235,0.22)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="120"
                      cy="120"
                      r={ringRadius}
                      fill="none"
                      stroke="rgba(45,212,191,0.95)"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      style={{
                        transition:
                          'stroke-dashoffset 880ms cubic-bezier(0.22,0.88,0.24,1), stroke 380ms ease',
                      }}
                    />
                  </svg>
                  <button
                    type="button"
                    onClick={
                      step === 1
                        ? onStartInstall
                        : step === 2
                          ? onStartAddSubscription
                          : onToggleVpn
                    }
                    className="bg-black/8 group relative z-10 inline-flex h-[112px] w-[112px] items-center justify-center rounded-full transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
                    aria-label={step === 3 ? toggleVpnLabel : primaryAction.label}
                  >
                    {icon}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 lg:mt-2">
              {[1, 2, 3].map((index) => {
                const done = step > index || (step === 3 && index === 3);
                const active = step === index && !done;
                return (
                  <span
                    key={index}
                    className={cn(
                      'inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-xs font-medium',
                      active
                        ? 'border-emerald-200/70 bg-emerald-300/20 text-white'
                        : done
                          ? 'border-emerald-200/55 bg-emerald-400/35 text-emerald-50'
                          : 'border-white/18 bg-white/8 text-white/60',
                    )}
                  >
                    {done ? <StepDoneIcon /> : index}
                  </span>
                );
              })}
            </div>
            <div className="mx-auto mt-2 h-1 w-[188px] overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-200/85 via-emerald-300/90 to-emerald-200/85 transition-[width] duration-500 ease-out"
                style={{ width: `${stepProgressPercent}%` }}
              />
            </div>
            {isDoneStep && (
              <p className="text-emerald-50/82 mt-4 text-center text-sm">
                {t('subscription.connection.tapCheckHint', {
                  defaultValue: 'Кнопка в центре тоже включает VPN в приложении.',
                })}
              </p>
            )}
          </section>

          <section className={cn(sharedCardClassName, 'p-5')} style={defaultCardStyle}>
            <div className="grid gap-3 md:grid-cols-3">
              {stepCards.map((card) => {
                const done = step > card.step;
                const active = step === card.step;
                return (
                  <div
                    key={card.step}
                    className={cn(
                      'rounded-[24px] border px-4 py-4 transition-colors',
                      active
                        ? 'border-emerald-200/34 bg-emerald-300/10'
                        : done
                          ? 'border-emerald-200/24 bg-emerald-300/[0.08]'
                          : 'border-white/10 bg-white/[0.04]',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-white">{card.title}</div>
                      <span
                        className={cn(
                          'inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-xs',
                          done || active
                            ? 'bg-emerald-300/18 border-emerald-200/45 text-emerald-50'
                            : 'border-white/12 bg-white/8 text-white/60',
                        )}
                      >
                        {done ? <StepDoneIcon /> : card.step}
                      </span>
                    </div>
                    <p className="text-white/66 mt-2 text-sm leading-[1.55]">{card.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4">
          {showInfo && step === 1 && (
            <section className={cn(sharedCardClassName, 'p-5')} style={defaultCardStyle}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[28px] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
                  {t('subscription.connection.importantInfo', {
                    defaultValue: 'Важная информация',
                  })}
                </h2>
                <button
                  type="button"
                  onClick={onDismissInfo}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/80"
                  aria-label="close-info-card"
                >
                  ×
                </button>
              </div>
              <p className="text-white/74 mt-3 text-sm leading-[1.6]">{importantInfoDescription}</p>
              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={onDismissInfo}
                  className="ultima-btn-pill ultima-btn-secondary flex w-full items-center justify-center px-5 py-3 text-[15px]"
                >
                  {canPermanentlyHideReminder
                    ? t('subscription.connection.remindLater', {
                        defaultValue: 'Напомнить позже',
                      })
                    : t('subscription.connection.gotIt', {
                        defaultValue: 'Все понятно',
                      })}
                </button>
                {canPermanentlyHideReminder && (
                  <button
                    type="button"
                    onClick={onHideReminderPermanently}
                    className="ultima-btn-pill ultima-btn-secondary flex w-full items-center justify-center px-5 py-3 text-[15px]"
                  >
                    {t('subscription.connection.hideReminderPermanently', {
                      defaultValue: 'Больше не показывать',
                    })}
                  </button>
                )}
              </div>
            </section>
          )}

          <section className={cn(sharedCardClassName, 'p-5')} style={defaultCardStyle}>
            <div className="text-[30px] font-semibold leading-[0.98] tracking-[-0.04em] text-white">
              {title}
            </div>
            <p className="text-white/68 mt-3 text-sm leading-[1.6]">{subtitle}</p>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="ultima-btn-pill ultima-btn-primary flex w-full items-center justify-center px-5 py-3 text-[15px]"
              >
                {primaryAction.label}
              </button>
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="ultima-btn-pill ultima-btn-secondary flex w-full items-center justify-center px-5 py-3 text-[15px]"
              >
                {secondaryAction.label}
              </button>
              {step === 3 && (
                <button
                  type="button"
                  onClick={onToggleVpn}
                  className="ultima-btn-pill ultima-btn-secondary flex w-full items-center justify-center px-5 py-3 text-[15px]"
                >
                  {t('subscription.connection.desktopOpenHapp', { defaultValue: 'Открыть Happ' })}
                </button>
              )}
            </div>
          </section>

          <div className="ultima-nav-dock mt-0">{bottomNav}</div>
        </aside>
      </div>
    </div>
  );
}
