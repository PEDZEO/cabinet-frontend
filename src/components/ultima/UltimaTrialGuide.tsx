import { useTranslation } from 'react-i18next';

type UltimaTrialGuideProps = {
  variant: 'overlay' | 'inline';
  expiryDateLabel: string;
  daysLeft: number | null;
  trafficLimitGb: number;
  deviceLimit: number;
  onPrimaryAction: () => void;
  onDismiss?: () => void;
};

type StatProps = {
  value: string;
  label: string;
};

function Stat({ value, label }: StatProps) {
  return (
    <div className="border-white/12 rounded-2xl border bg-white/[0.05] px-3 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="text-[22px] font-semibold leading-none tracking-[-0.03em] text-white">
        {value}
      </div>
      <div className="text-white/48 mt-1 text-[11px] uppercase tracking-[0.18em]">{label}</div>
    </div>
  );
}

export function UltimaTrialGuide({
  variant,
  expiryDateLabel,
  daysLeft,
  trafficLimitGb,
  deviceLimit,
  onPrimaryAction,
  onDismiss,
}: UltimaTrialGuideProps) {
  const { t } = useTranslation();
  const normalizedDaysLeft = daysLeft === null ? null : Math.max(daysLeft, 0);
  const stats = [
    {
      value: normalizedDaysLeft === null ? '...' : String(normalizedDaysLeft),
      label:
        normalizedDaysLeft === null
          ? t('ultima.trialGuide.stats.days', { defaultValue: 'Дней' })
          : t('ultima.trialGuide.stats.daysUnit', {
              count: normalizedDaysLeft,
              defaultValue: 'дней',
            }),
    },
    {
      value:
        trafficLimitGb > 0
          ? `${trafficLimitGb} ${t('common.units.gb', { defaultValue: 'ГБ' })}`
          : '∞',
      label:
        trafficLimitGb > 0
          ? t('ultima.trialGuide.stats.traffic', { defaultValue: 'Трафик' })
          : t('ultima.trialGuide.stats.unlimited', { defaultValue: 'Безлимит' }),
    },
    {
      value: String(deviceLimit),
      label: t('ultima.trialGuide.stats.devices', { defaultValue: 'Устройств' }),
    },
  ];

  if (variant === 'overlay') {
    return (
      <div className="pointer-events-none fixed inset-0 z-40">
        <div className="bg-black/58 absolute inset-0 backdrop-blur-[3px]" />
        <div className="absolute inset-x-4 bottom-[calc(128px+env(safe-area-inset-bottom,0px))] md:inset-x-auto md:left-1/2 md:w-[440px] md:-translate-x-1/2">
          <div className="pointer-events-auto relative overflow-hidden rounded-[30px] border border-emerald-200/20 bg-[linear-gradient(160deg,rgba(7,16,25,0.96),rgba(4,11,18,0.98))] p-5 shadow-[0_28px_60px_rgba(0,0,0,0.52),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.22),transparent_48%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_42%)]" />
            <div className="bg-emerald-300/12 pointer-events-none absolute -right-16 top-[-72px] h-44 w-44 rounded-full blur-3xl" />

            <div className="relative">
              <div className="text-emerald-100/92 inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-200" />
                {t('ultima.trialGuide.badge', { defaultValue: 'Триал активирован' })}
              </div>

              <p className="mt-4 text-[30px] font-semibold leading-[0.98] tracking-[-0.04em] text-white">
                {t('ultima.trialGuide.title', { defaultValue: 'Можно подключаться прямо сейчас' })}
              </p>
              <p className="text-white/74 mt-3 max-w-[320px] text-[14px] leading-[1.38]">
                {t('ultima.trialGuide.description', {
                  date: expiryDateLabel,
                  defaultValue:
                    'Пробный доступ уже активирован до {{date}}. Осталось установить приложение и добавить подписку.',
                })}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {stats.map((stat) => (
                  <Stat key={stat.label} value={stat.value} label={stat.label} />
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
                <div>
                  <p className="text-white/42 text-[12px] font-medium uppercase tracking-[0.18em]">
                    {t('ultima.trialGuide.stepLabel', {
                      defaultValue: 'Шаг 1 из 3',
                    })}
                  </p>
                  <p className="text-white/68 mt-1 text-[13px] leading-snug">
                    {t('ultima.trialGuide.hint', {
                      defaultValue:
                        'Сначала открываем экран установки, дальше интерфейс поведет вас сам.',
                    })}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <span
                      key={index}
                      className={`h-2.5 rounded-full ${
                        index === 0 ? 'w-7 bg-emerald-200' : 'bg-white/16 w-2.5'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={onPrimaryAction}
                  className="ultima-btn-pill ultima-btn-primary flex-1 px-5 py-3 text-[15px]"
                >
                  {t('ultima.trialGuide.primaryAction', { defaultValue: 'Начать установку' })}
                </button>
                {onDismiss && (
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="ultima-btn-pill ultima-btn-secondary px-4 py-3 text-[15px]"
                  >
                    {t('ultima.trialGuide.dismissAction', { defaultValue: 'Позже' })}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-emerald-200/18 mb-4 overflow-hidden rounded-[28px] border bg-[linear-gradient(160deg,rgba(10,34,36,0.48),rgba(6,16,24,0.62))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(3,14,24,0.24)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[16px] font-semibold leading-tight text-white/95">
            {t('ultima.trialGuide.inlineTitle', {
              date: expiryDateLabel,
              defaultValue: 'Триал активен до {{date}}',
            })}
          </p>
          <p className="mt-1 text-[13px] leading-snug text-white/70">
            {t('ultima.trialGuide.inlineDescription', {
              defaultValue:
                'Следующий шаг: установите приложение и добавьте подписку в один поток.',
            })}
          </p>
        </div>
        <span className="border-emerald-200/18 bg-emerald-300/12 text-emerald-100/88 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em]">
          {t('ultima.trialGuide.stepLabel', { defaultValue: 'Шаг 1 из 3' })}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <Stat key={stat.label} value={stat.value} label={stat.label} />
        ))}
      </div>

      <button
        type="button"
        onClick={onPrimaryAction}
        className="ultima-btn-pill ultima-btn-primary mt-3 flex w-full items-center justify-center px-5 py-2.5 text-[15px]"
      >
        {t('ultima.trialGuide.inlineAction', { defaultValue: 'Открыть установку' })}
      </button>
    </div>
  );
}
