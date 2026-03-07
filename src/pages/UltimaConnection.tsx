import { useEffect, useMemo, useState } from 'react';
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

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
    <path
      d="M15.5 5 8.5 12l7 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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
  const [isFinishing, setIsFinishing] = useState(false);

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

    const applyPendingReturn = () => {
      try {
        const pending = localStorage.getItem(pendingKey) === '1';
        if (!pending) return;
        localStorage.removeItem(pendingKey);
        setStep(3);
        setShowReturnConfetti(true);
        setBurst((prev) => prev + 1);
        window.setTimeout(() => setShowReturnConfetti(false), 1700);
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
      } catch {
        // ignore localStorage errors
      }
      openAddSubscription();
      return;
    }
    setStep(1);
  };

  const finishFlow = () => {
    if (isFinishing) return;
    setIsFinishing(true);
    setBurst((prev) => prev + 1);
    window.setTimeout(() => {
      setStep(1);
      setShowInfo(false);
      setIsFinishing(false);
      onGoBack();
    }, 1200);
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-transparent px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-4">
      <div className="relative z-10 mx-auto flex h-full min-h-0 max-w-md flex-col">
        <button
          type="button"
          onClick={onGoBack}
          className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-white/85"
          aria-label="ultima-connection-back"
        >
          <BackIcon />
        </button>

        <section className="flex min-h-0 flex-1 flex-col">
          <div key={step} className="ultima-step-enter pt-2 text-center">
            <h1 className="text-[46px] font-semibold leading-[0.96] text-white sm:text-[50px]">
              {title}
            </h1>
            <p className="mx-auto mt-2 max-w-[330px] text-[18px] leading-[1.2] text-white/70">
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

          <div className="relative mt-10 flex flex-1 items-center justify-center">
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
            <div className="bg-black/8 relative flex h-[132px] w-[132px] items-center justify-center rounded-full">
              {icon}
              {step === 3 && showReturnConfetti && (
                <div className="pointer-events-none absolute inset-0 overflow-visible">
                  {Array.from({ length: 96 }).map((_, index) => {
                    const angle = (index * 360) / 96;
                    const distance = 80 + ((index * 13) % 160);
                    const hue = (index * 37) % 360;
                    return (
                      <span
                        key={`${burst}-${index}`}
                        className="absolute left-1/2 top-1/2 h-2.5 w-1.5 rounded-sm"
                        style={{
                          background: `hsl(${hue} 95% 62%)`,
                          transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${distance}px)`,
                          animation: 'ultima-confetti-fall 1300ms ease-out forwards',
                          opacity: 0,
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="pb-1">
          {step === 1 && (
            <button
              type="button"
              onClick={openInstall}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#4ceac2]/45 bg-[#14cf9a] px-5 py-4 text-[18px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_6px_16px_rgba(7,146,108,0.24)]"
            >
              <span aria-hidden>⟳</span>
              {t('subscription.connection.installApp', { defaultValue: 'Установить приложение' })}
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={openAddSubscription}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#4ceac2]/45 bg-[#14cf9a] px-5 py-4 text-[18px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_6px_16px_rgba(7,146,108,0.24)]"
            >
              <span aria-hidden>◌</span>
              {t('subscription.connection.addSubscription', { defaultValue: 'Добавить подписку' })}
            </button>
          )}
          {step === 3 && (
            <button
              type="button"
              onClick={finishFlow}
              className="mb-3 flex w-full items-center justify-center rounded-full border border-[#4ceac2]/45 bg-[#14cf9a] px-5 py-4 text-[18px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_6px_16px_rgba(7,146,108,0.24)]"
            >
              {t('subscription.connection.finishSetup', { defaultValue: 'Завершить настройку' })}
            </button>
          )}

          {step !== 3 && (
            <button
              type="button"
              onClick={advanceStep}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-4 text-[18px] font-medium text-white/95"
            >
              {t('subscription.connection.nextStep', { defaultValue: 'Следующий шаг' })}
              <span aria-hidden className="text-white/70">
                →
              </span>
            </button>
          )}

          <UltimaBottomNav active="connection" />
        </section>
      </div>

      {step === 1 && showInfo && (
        <div className="ultima-step-enter absolute inset-x-4 bottom-[140px] z-20 rounded-[28px] border border-white/10 bg-black/85 p-5 text-white shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="text-[34px] font-semibold leading-[1.04]">
              {t('subscription.connection.importantInfo', { defaultValue: 'Важная информация' })}
            </h3>
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/70"
              aria-label="close-info-modal"
            >
              ×
            </button>
          </div>
          <p className="text-[18px] leading-[1.24] text-white/85">
            {t('subscription.connection.importantInfoDesc', {
              defaultValue:
                'После установки приложения Happ, обязательно вернитесь на этот экран и нажмите «Следующий шаг», чтобы добавить конфигурацию в приложение.',
            })}
          </p>
          <button
            type="button"
            onClick={() => {
              setShowInfo(false);
              openInstall();
            }}
            className="mt-5 flex w-full items-center justify-center rounded-full border border-[#4ceac2]/45 bg-[#14cf9a] px-5 py-4 text-[18px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_6px_16px_rgba(7,146,108,0.24)]"
          >
            {t('subscription.connection.goInstall', {
              defaultValue: 'Хорошо, перейти к установке',
            })}
          </button>
        </div>
      )}
    </div>
  );
}
