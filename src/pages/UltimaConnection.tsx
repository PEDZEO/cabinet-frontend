import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';
import type { AppConfig, LocalizedText, RemnawaveAppClient } from '@/types';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';

type Step = 1 | 2 | 3;

type UltimaConnectionProps = {
  appConfig: AppConfig;
  onOpenDeepLink: (url: string) => void;
  onGoBack: () => void;
};

const ULTIMA_CONNECTION_STATE_KEY = 'ultima_connection_flow_v1';
const ULTIMA_CONNECTION_PENDING_STEP3_KEY = 'ultima_connection_pending_step3_v1';

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-[74px] w-[74px] text-white/90">
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
  <svg viewBox="0 0 24 24" fill="none" className="h-[74px] w-[74px] text-white/90">
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
  <svg viewBox="0 0 24 24" fill="none" className="h-[74px] w-[74px] text-white/90">
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

const getLocalizedText = (text: LocalizedText | undefined, lang: string): string => {
  if (!text) return '';
  return text[lang] || text.en || text.ru || Object.values(text)[0] || '';
};

const detectPlatformKey = (): string | null => {
  if (typeof window === 'undefined' || !navigator?.userAgent) return null;
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return /tv|television/.test(ua) ? 'androidTV' : 'android';
  if (/macintosh|mac os x/.test(ua)) return 'macos';
  if (/windows/.test(ua)) return 'windows';
  if (/linux/.test(ua)) return 'linux';
  return null;
};

const resolveTemplateUrl = (value: string, subscriptionUrl: string | null): string => {
  if (!value) return value;
  if (value.includes('{{subscriptionUrl}}')) {
    return value.split('{{subscriptionUrl}}').join(subscriptionUrl ?? '');
  }
  return value;
};

const findSetupUrls = (
  appConfig: AppConfig,
  language: string,
): {
  installUrl: string | null;
  addSubscriptionUrl: string | null;
} => {
  const platforms = Object.entries(appConfig.platforms ?? {});
  if (!platforms.length) return { installUrl: null, addSubscriptionUrl: null };

  const detected = detectPlatformKey();
  const pickedPlatform =
    (detected && appConfig.platforms[detected]) ||
    appConfig.platforms.android ||
    appConfig.platforms.ios ||
    platforms[0]?.[1];

  const apps = pickedPlatform?.apps ?? [];
  const app: RemnawaveAppClient | undefined = apps.find((entry) => entry.featured) ?? apps[0];
  if (!app) return { installUrl: null, addSubscriptionUrl: null };

  const flatButtons = app.blocks.flatMap((block) => block.buttons ?? []);
  let installUrl: string | null = null;
  let addSubscriptionUrl: string | null = app.deepLink ?? null;

  for (const button of flatButtons) {
    const localized = getLocalizedText(button.text, language).toLowerCase();
    const rawUrl = button.resolvedUrl || button.url || button.link || null;
    if (!rawUrl) continue;

    if (!addSubscriptionUrl && button.type === 'subscriptionLink') {
      addSubscriptionUrl = rawUrl;
    }

    if (
      !addSubscriptionUrl &&
      (localized.includes('подпис') || localized.includes('subscription'))
    ) {
      addSubscriptionUrl = rawUrl;
    }

    if (
      !installUrl &&
      (localized.includes('установ') ||
        localized.includes('download') ||
        localized.includes('play') ||
        localized.includes('store') ||
        localized.includes('apk'))
    ) {
      installUrl = rawUrl;
    }

    if (!installUrl) {
      installUrl = rawUrl;
    }
  }

  const resolvedInstall = installUrl
    ? resolveTemplateUrl(installUrl, appConfig.subscriptionUrl)
    : null;
  const resolvedAdd = addSubscriptionUrl
    ? resolveTemplateUrl(addSubscriptionUrl, appConfig.subscriptionUrl)
    : appConfig.subscriptionUrl;

  return { installUrl: resolvedInstall, addSubscriptionUrl: resolvedAdd };
};

export function UltimaConnection({ appConfig, onOpenDeepLink, onGoBack }: UltimaConnectionProps) {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [step, setStep] = useState<Step>(1);
  const [showInfo, setShowInfo] = useState(true);
  const [burst, setBurst] = useState(0);
  const [showReturnConfetti, setShowReturnConfetti] = useState(false);

  const setupUrls = useMemo(
    () => findSetupUrls(appConfig, i18n.language || 'ru'),
    [appConfig, i18n.language],
  );

  useEffect(() => {
    const key = `${ULTIMA_CONNECTION_STATE_KEY}:${user?.id ?? 'guest'}`;
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? Number(raw) : 1;
      const normalized: Step = parsed === 3 ? 3 : parsed === 2 ? 2 : 1;
      setStep(normalized);
      setShowInfo(normalized === 1);
    } catch {
      setStep(1);
      setShowInfo(true);
    }
  }, [user?.id]);

  useEffect(() => {
    const pendingKey = `${ULTIMA_CONNECTION_PENDING_STEP3_KEY}:${user?.id ?? 'guest'}`;
    const pendingGlobalKey = ULTIMA_CONNECTION_PENDING_STEP3_KEY;

    const applyPendingReturn = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      try {
        const pending =
          localStorage.getItem(pendingKey) === '1' ||
          localStorage.getItem(pendingGlobalKey) === '1';
        if (!pending) return;
        localStorage.removeItem(pendingKey);
        localStorage.removeItem(pendingGlobalKey);
        setStep(3);
        setShowReturnConfetti(true);
        setBurst((prev) => prev + 1);
        window.setTimeout(() => setShowReturnConfetti(false), 2400);
      } catch {
        // ignore localStorage errors
      }
    };

    applyPendingReturn();
    window.addEventListener('focus', applyPendingReturn);
    document.addEventListener('visibilitychange', applyPendingReturn);
    return () => {
      window.removeEventListener('focus', applyPendingReturn);
      document.removeEventListener('visibilitychange', applyPendingReturn);
    };
  }, [user?.id]);

  useEffect(() => {
    const key = `${ULTIMA_CONNECTION_STATE_KEY}:${user?.id ?? 'guest'}`;
    try {
      localStorage.setItem(key, String(step));
    } catch {
      // ignore persistence errors
    }
  }, [step, user?.id]);

  const title =
    step === 1
      ? t('subscription.connection.stepInstallTitle', { defaultValue: 'Приложение' })
      : step === 2
        ? t('subscription.connection.stepSubscriptionTitle', { defaultValue: 'Подписка' })
        : t('subscription.connection.stepDoneTitle', { defaultValue: 'Готово!' });

  const subtitle =
    step === 1
      ? t('subscription.connection.stepInstallDesc', {
          defaultValue: 'Установите приложение Happ и вернитесь к этому экрану',
        })
      : step === 2
        ? t('subscription.connection.stepSubscriptionDesc', {
            defaultValue: 'Добавьте подписку в приложении Happ с помощью кнопки ниже',
          })
        : t('subscription.connection.stepDoneDesc', {
            defaultValue: 'Нажмите на круглую кнопку включения VPN в приложении Happ',
          });

  const icon = step === 1 ? <DownloadIcon /> : step === 2 ? <PlusIcon /> : <CheckIcon />;
  const progressRatio = step === 1 ? 0.34 : step === 2 ? 0.67 : 1;
  const ringRadius = 90;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressRatio);

  const openInstall = () => {
    if (setupUrls.installUrl) {
      onOpenDeepLink(setupUrls.installUrl);
    }
  };

  const openAddSubscription = () => {
    if (setupUrls.addSubscriptionUrl) {
      onOpenDeepLink(setupUrls.addSubscriptionUrl);
    }
  };

  const advanceStep = () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      try {
        localStorage.setItem(`${ULTIMA_CONNECTION_PENDING_STEP3_KEY}:${user?.id ?? 'guest'}`, '1');
        localStorage.setItem(ULTIMA_CONNECTION_PENDING_STEP3_KEY, '1');
      } catch {
        // ignore localStorage errors
      }
      openAddSubscription();
      return;
    }
    setStep(1);
  };

  const finishFlow = () => {
    setStep(1);
    setShowInfo(false);
    onGoBack();
  };

  return (
    <div className="ultima-shell">
      <div className="ultima-shell-inner lg:max-w-[520px]">
        <section className="flex min-h-0 flex-1 flex-col">
          <div key={step} className="ultima-step-enter pt-2 text-center lg:pt-1">
            <h1 className="text-[42px] font-semibold leading-[0.96] text-white sm:text-[46px]">
              {title}
            </h1>
            <p className="mx-auto mt-2 max-w-[360px] text-[17px] leading-[1.2] text-white/70">
              {subtitle}
            </p>
            <div className="mx-auto mt-4 flex w-fit items-center gap-2">
              {[1, 2, 3].map((index) => {
                const done = step > index;
                const active = step === index;
                return (
                  <span
                    key={index}
                    className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-xs font-medium ${
                      active
                        ? 'border-emerald-200/70 bg-emerald-300/20 text-white'
                        : done
                          ? 'border-emerald-200/55 bg-emerald-400/35 text-emerald-50'
                          : 'border-white/18 bg-white/8 text-white/60'
                    } ${done ? 'ultima-step-done-pop' : ''}`}
                  >
                    {done ? <StepDoneIcon /> : index}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="relative mt-7 flex flex-1 items-center justify-center lg:mt-5">
            <div className="border-emerald-200/22 pointer-events-none absolute h-[360px] w-[360px] rounded-full border" />
            <div className="pointer-events-none absolute h-[270px] w-[270px] rounded-full border border-emerald-200/20" />
            <div className="pointer-events-none absolute h-[188px] w-[188px] rounded-full border border-emerald-300/65" />
            <svg
              viewBox="0 0 240 240"
              className="pointer-events-none absolute h-[220px] w-[220px] -rotate-90"
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
                style={{ transition: 'stroke-dashoffset 420ms ease, stroke 240ms ease' }}
              />
            </svg>
            <div className="bg-black/8 relative flex h-[124px] w-[124px] items-center justify-center rounded-full">
              {icon}
              {step === 3 && showReturnConfetti && (
                <div className="pointer-events-none absolute inset-[-160px] overflow-visible">
                  {Array.from({ length: 260 }).map((_, index) => {
                    const angle = (index * 137.5) % 360;
                    const distance = 140 + ((index * 23) % 420);
                    const hue = (index * 37) % 360;
                    const spin = 150 + ((index * 61) % 410);
                    const duration = 1400 + ((index * 37) % 900);
                    const width = 4 + ((index * 5) % 4);
                    const height = 9 + ((index * 7) % 7);
                    const delay = ((index * 11) % 260) / 1000;
                    const confettiStyle = {
                      background: `hsl(${hue} 95% 62%)`,
                      width: `${width}px`,
                      height: `${height}px`,
                      animationDelay: `${delay}s`,
                      opacity: 0,
                      '--angle': `${angle}deg`,
                      '--distance': `${distance}px`,
                      '--spin': `${spin}deg`,
                      '--duration': `${duration}ms`,
                    } as CSSProperties;
                    return (
                      <span
                        key={`${burst}-${index}`}
                        className="ultima-confetti-chip absolute left-1/2 top-1/2 rounded-sm"
                        style={confettiStyle}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="pb-0">
          {step === 1 && (
            <button
              type="button"
              onClick={openInstall}
              className="border-[#66ebc9]/42 mb-3 flex w-full items-center justify-center gap-2 rounded-full border bg-[#14cf9a] px-5 py-2.5 text-[16px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(7,146,108,0.2)]"
            >
              <span aria-hidden>⟳</span>
              {t('subscription.connection.installApp', { defaultValue: 'Установить приложение' })}
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={openAddSubscription}
              className="border-[#66ebc9]/42 mb-3 flex w-full items-center justify-center gap-2 rounded-full border bg-[#14cf9a] px-5 py-2.5 text-[16px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(7,146,108,0.2)]"
            >
              <span aria-hidden>◌</span>
              {t('subscription.connection.addSubscription', { defaultValue: 'Добавить подписку' })}
            </button>
          )}
          {step === 3 && (
            <button
              type="button"
              onClick={finishFlow}
              className="border-[#66ebc9]/42 mb-3 flex w-full items-center justify-center rounded-full border bg-[#14cf9a] px-5 py-2.5 text-[16px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(7,146,108,0.2)]"
            >
              {t('subscription.connection.finishSetup', { defaultValue: 'Завершить настройку' })}
            </button>
          )}

          {step !== 3 && (
            <button
              type="button"
              onClick={advanceStep}
              className="border-emerald-200/22 mb-3 flex w-full items-center justify-center gap-2 rounded-full border bg-[rgba(12,45,42,0.34)] px-5 py-2.5 text-[16px] font-medium text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-md transition hover:bg-[rgba(16,58,52,0.42)]"
            >
              {t('subscription.connection.nextStep', { defaultValue: 'Следующий шаг' })}
              <span aria-hidden className="text-white/70">
                →
              </span>
            </button>
          )}

          <div className="ultima-nav-dock">
            <UltimaBottomNav active="connection" />
          </div>
        </section>
      </div>

      {step === 1 && showInfo && (
        <>
          <div className="bg-black/52 absolute inset-0 z-[18]" />
          <div className="ultima-step-enter border-white/24 absolute inset-x-4 bottom-[252px] z-20 rounded-[24px] border bg-[#05070B] p-4 text-white shadow-[0_26px_56px_rgba(0,0,0,0.72)] backdrop-blur-xl lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-24 lg:w-[500px] lg:-translate-x-1/2">
            <div className="mb-2 flex items-start justify-between gap-3">
              <h3 className="text-[24px] font-semibold leading-[1.06] text-white/95">
                {t('subscription.connection.importantInfo', {
                  defaultValue: 'Важная информация',
                })}
              </h3>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/30 text-white/90"
                aria-label="close-info-modal"
              >
                ×
              </button>
            </div>
            <p className="text-white/92 text-[15px] leading-[1.28]">
              {t('subscription.connection.importantInfoDesc', {
                defaultValue:
                  'После установки приложения Happ, обязательно вернитесь на этот экран и нажмите «Следующий шаг», чтобы добавить конфигурацию в приложение.',
              })}
            </p>
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="border-emerald-200/22 mt-4 flex w-full items-center justify-center rounded-full border bg-[rgba(12,45,42,0.34)] px-5 py-2.5 text-[15px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-md"
            >
              {t('subscription.connection.gotIt', {
                defaultValue: 'Все понятно',
              })}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
