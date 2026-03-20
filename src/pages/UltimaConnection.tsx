import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { subscriptionApi } from '@/api/subscription';
import { useHaptic } from '@/platform';
import { useAuthStore } from '@/store/auth';
import type { AppConfig, LocalizedText, RemnawaveAppClient } from '@/types';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import {
  ULTIMA_CONNECTION_PENDING_STEP2_KEY,
  ULTIMA_CONNECTION_PENDING_STEP3_KEY,
  readUltimaConnectionCompleted,
  readUltimaConnectionReminderHidden,
  readUltimaConnectionStep,
  writeUltimaConnectionCompleted,
  writeUltimaConnectionReminderHidden,
  writeUltimaConnectionStep,
} from '@/features/ultima/connectionFlow';

type Step = 1 | 2 | 3;

type UltimaConnectionProps = {
  appConfig: AppConfig;
  onOpenDeepLink: (url: string) => void;
  onGoBack: () => void;
  onRefreshAppConfig?: () => void;
};

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

export function UltimaConnection({
  appConfig,
  onOpenDeepLink,
  onGoBack,
  onRefreshAppConfig,
}: UltimaConnectionProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const haptic = useHaptic();
  const user = useAuthStore((state) => state.user);
  const [step, setStep] = useState<Step>(1);
  const [showInfo, setShowInfo] = useState(true);
  const [burst, setBurst] = useState(0);
  const [showReturnConfetti, setShowReturnConfetti] = useState(false);
  const [showFinishSuccess, setShowFinishSuccess] = useState(false);
  const [isReminderHidden, setIsReminderHidden] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number>(() =>
    typeof window === 'undefined' ? 820 : window.innerHeight,
  );
  const stepInitRef = useRef(false);
  const centerActionRef = useRef<HTMLDivElement | null>(null);
  const [successWaveOrigin, setSuccessWaveOrigin] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const setupUrls = useMemo(
    () => findSetupUrls(appConfig, i18n.language || 'ru'),
    [appConfig, i18n.language],
  );
  const { data: subscriptionResponse } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getSubscription,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });
  const subscription = subscriptionResponse?.subscription ?? null;
  const isActiveTrial = Boolean(
    subscription?.is_active && !subscription?.is_expired && subscription?.is_trial,
  );
  const canPermanentlyHideReminder = Boolean(
    subscription?.is_active && !subscription?.is_expired && !subscription?.is_trial,
  );

  useEffect(() => {
    const normalized = readUltimaConnectionStep(user?.id);
    const completed = readUltimaConnectionCompleted(user?.id);
    const hidden = readUltimaConnectionReminderHidden(user?.id);
    setStep(normalized);
    setIsReminderHidden(hidden);
    setShowInfo(normalized === 1 && !hidden && !completed);
  }, [user?.id]);

  useEffect(() => {
    const pendingStep2Key = `${ULTIMA_CONNECTION_PENDING_STEP2_KEY}:${user?.id ?? 'guest'}`;
    const pendingKey = `${ULTIMA_CONNECTION_PENDING_STEP3_KEY}:${user?.id ?? 'guest'}`;
    const pendingStep2GlobalKey = ULTIMA_CONNECTION_PENDING_STEP2_KEY;
    const pendingGlobalKey = ULTIMA_CONNECTION_PENDING_STEP3_KEY;

    const applyPendingReturn = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      try {
        const pending =
          localStorage.getItem(pendingKey) === '1' ||
          localStorage.getItem(pendingGlobalKey) === '1';
        const pendingStep2 =
          localStorage.getItem(pendingStep2Key) === '1' ||
          localStorage.getItem(pendingStep2GlobalKey) === '1';
        if (pending) {
          localStorage.removeItem(pendingKey);
          localStorage.removeItem(pendingGlobalKey);
          onRefreshAppConfig?.();
          setStep(3);
          window.setTimeout(() => {
            setShowReturnConfetti(true);
            setBurst((prev) => prev + 1);
          }, 180);
          window.setTimeout(() => setShowReturnConfetti(false), 2580);
          return;
        }
        if (pendingStep2) {
          localStorage.removeItem(pendingStep2Key);
          localStorage.removeItem(pendingStep2GlobalKey);
          onRefreshAppConfig?.();
          setStep(2);
          return;
        }
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
  }, [onRefreshAppConfig, user?.id]);

  useEffect(() => {
    writeUltimaConnectionStep(user?.id, step);
  }, [step, user?.id]);

  useEffect(() => {
    if (!canPermanentlyHideReminder && isReminderHidden) {
      writeUltimaConnectionReminderHidden(user?.id, false);
      setIsReminderHidden(false);
    }
  }, [canPermanentlyHideReminder, isReminderHidden, user?.id]);

  useEffect(() => {
    if (!stepInitRef.current) {
      stepInitRef.current = true;
      return;
    }
    haptic.impact('light');
  }, [haptic, step]);

  useEffect(() => {
    const syncViewport = () => setViewportHeight(window.innerHeight);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const isShortViewport = viewportHeight < 790;
  const isVeryShortViewport = viewportHeight < 720;

  const title =
    step === 1
      ? t('subscription.connection.stepInstallTitle', { defaultValue: 'Приложение' })
      : step === 2
        ? t('subscription.connection.stepSubscriptionTitle', { defaultValue: 'Подписка' })
        : t('subscription.connection.stepDoneTitle', { defaultValue: 'Готово!' });
  const isDoneStep = step === 3;

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
  const importantInfoDescription = isActiveTrial
    ? t('ultima.trialGuide.connectionInfoDesc', {
        defaultValue:
          'Пробный доступ уже активирован. После установки приложения вернитесь сюда и перейдите к следующему шагу, чтобы добавить подписку.',
      })
    : t('subscription.connection.importantInfoDesc', {
        defaultValue:
          'После установки приложения Happ, обязательно вернитесь на этот экран и нажмите «Следующий шаг», чтобы добавить конфигурацию в приложение.',
      });

  const icon = step === 1 ? <DownloadIcon /> : step === 2 ? <PlusIcon /> : <CheckIcon />;
  const isFinalStep = step === 3;
  const progressRatio = step === 1 ? 0.34 : step === 2 ? 0.67 : 1;
  const stepProgressPercent = step === 1 ? 0 : step === 2 ? 50 : 100;
  const ringSizes = isFinalStep
    ? isVeryShortViewport
      ? { outer: 248, middle: 188, inner: 136, progress: 164, center: 92, button: 82 }
      : isShortViewport
        ? { outer: 284, middle: 214, inner: 152, progress: 182, center: 102, button: 90 }
        : { outer: 320, middle: 238, inner: 168, progress: 198, center: 112, button: 98 }
    : isVeryShortViewport
      ? { outer: 286, middle: 218, inner: 156, progress: 186, center: 104, button: 92 }
      : isShortViewport
        ? { outer: 320, middle: 244, inner: 172, progress: 202, center: 114, button: 100 }
        : { outer: 360, middle: 270, inner: 188, progress: 220, center: 124, button: 110 };
  const ringRadius = 90;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressRatio);

  const openInstall = () => {
    if (setupUrls.installUrl) {
      onOpenDeepLink(setupUrls.installUrl);
    }
  };

  const startInstallFlow = () => {
    writeUltimaConnectionCompleted(user?.id, false);
    try {
      localStorage.setItem(`${ULTIMA_CONNECTION_PENDING_STEP2_KEY}:${user?.id ?? 'guest'}`, '1');
      localStorage.setItem(ULTIMA_CONNECTION_PENDING_STEP2_KEY, '1');
    } catch {
      // ignore localStorage errors
    }
    openInstall();
  };

  const openAddSubscription = () => {
    if (setupUrls.addSubscriptionUrl) {
      onOpenDeepLink(setupUrls.addSubscriptionUrl);
    }
  };

  const startAddSubscriptionFlow = () => {
    writeUltimaConnectionCompleted(user?.id, false);
    try {
      localStorage.setItem(`${ULTIMA_CONNECTION_PENDING_STEP3_KEY}:${user?.id ?? 'guest'}`, '1');
      localStorage.setItem(ULTIMA_CONNECTION_PENDING_STEP3_KEY, '1');
    } catch {
      // ignore localStorage errors
    }
    openAddSubscription();
  };

  const openToggleVpn = () => {
    onOpenDeepLink('happ://toggle');
  };

  const advanceStep = () => {
    if (step === 1) {
      writeUltimaConnectionCompleted(user?.id, false);
      setStep(2);
      return;
    }
    if (step === 2) {
      startAddSubscriptionFlow();
      return;
    }
    setStep(1);
  };

  const finishFlow = () => {
    const centerRect = centerActionRef.current?.getBoundingClientRect();
    if (centerRect) {
      setSuccessWaveOrigin({
        x: centerRect.left + centerRect.width / 2,
        y: centerRect.top + centerRect.height / 2,
      });
    } else {
      setSuccessWaveOrigin({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    }
    writeUltimaConnectionCompleted(user?.id, true);
    haptic.notification('success');
    window.setTimeout(() => {
      setShowFinishSuccess(true);
    }, 180);
    window.setTimeout(() => {
      setShowFinishSuccess(false);
      writeUltimaConnectionStep(user?.id, 1);
      setStep(1);
      setShowInfo(false);
      onGoBack();
    }, 1560);
  };

  const dismissReminderForNow = () => {
    setShowInfo(false);
  };

  const hideReminderPermanently = () => {
    if (!canPermanentlyHideReminder) {
      setShowInfo(false);
      return;
    }
    writeUltimaConnectionReminderHidden(user?.id, true);
    setIsReminderHidden(true);
    setShowInfo(false);
  };

  return (
    <div className="ultima-shell">
      <div className="ultima-shell-inner lg:max-w-[520px]">
        <section className="flex min-h-0 flex-1 flex-col">
          <div
            key={step}
            className={`ultima-step-enter text-center lg:pt-1 ${isVeryShortViewport ? 'pt-0.5' : 'pt-2'}`}
          >
            <h1
              className={`font-semibold leading-[0.96] text-white ${
                isDoneStep
                  ? isVeryShortViewport
                    ? 'text-[28px] sm:text-[32px]'
                    : 'text-[34px] sm:text-[38px]'
                  : isVeryShortViewport
                    ? 'text-[34px] sm:text-[38px]'
                    : 'text-[42px] sm:text-[46px]'
              }`}
            >
              {title}
            </h1>
            <p
              className={`mx-auto mt-2 leading-[1.2] ${
                isDoneStep
                  ? isVeryShortViewport
                    ? 'text-white/72 max-w-[280px] text-[13px]'
                    : 'text-white/72 max-w-[300px] text-[14px] sm:max-w-[332px] sm:text-[15px]'
                  : 'max-w-[360px] text-[17px] text-white/70'
              }`}
            >
              {subtitle}
            </p>
            {step === 3 && (
              <div
                className={`border-emerald-200/28 mx-auto w-full max-w-[332px] rounded-2xl border bg-[linear-gradient(130deg,rgba(28,171,142,0.30),rgba(8,27,24,0.58))] px-3.5 shadow-[0_10px_24px_rgba(4,16,14,0.35),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-md ${isVeryShortViewport ? 'mt-1.5 py-1.5' : 'mt-2 py-2'}`}
              >
                <p className="text-[12px] font-medium leading-[1.22] text-emerald-50/95">
                  {t('subscription.connection.tapCheckHint', {
                    defaultValue: 'Можно нажать и здесь: галочка в центре тоже переключает VPN.',
                  })}
                </p>
              </div>
            )}
            <div
              className={`mx-auto flex w-fit items-center gap-2 ${isVeryShortViewport ? 'mt-2' : 'mt-4'}`}
            >
              {[1, 2, 3].map((index) => {
                const done = step > index || (step === 3 && index === 3);
                const active = step === index && !done;
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
            <div
              className={`mx-auto h-1 w-[168px] overflow-hidden rounded-full bg-white/15 ${isVeryShortViewport ? 'mt-1.5' : 'mt-2'}`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-200/85 via-emerald-300/90 to-emerald-200/85 transition-[width] duration-500 ease-out"
                style={{ width: `${stepProgressPercent}%` }}
              />
            </div>
          </div>

          <div
            className={`relative flex flex-1 items-center justify-center lg:mt-5 ${isFinalStep ? 'mb-2' : ''} ${isVeryShortViewport ? 'mt-3' : isShortViewport ? 'mt-5' : 'mt-7'}`}
          >
            <div
              className="ultima-step-ring border-emerald-200/22 pointer-events-none absolute rounded-full border"
              style={{ width: ringSizes.outer, height: ringSizes.outer }}
            />
            <div
              className="ultima-step-ring ultima-step-ring-delay-1 pointer-events-none absolute rounded-full border border-emerald-200/20"
              style={{ width: ringSizes.middle, height: ringSizes.middle }}
            />
            <div
              className="ultima-step-ring ultima-step-ring-delay-2 pointer-events-none absolute rounded-full border border-emerald-300/65"
              style={{ width: ringSizes.inner, height: ringSizes.inner }}
            />
            <svg
              viewBox="0 0 240 240"
              className="pointer-events-none absolute -rotate-90"
              style={{ width: ringSizes.progress, height: ringSizes.progress }}
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
            <div
              ref={centerActionRef}
              className="bg-black/8 relative flex items-center justify-center rounded-full"
              style={{ width: ringSizes.center, height: ringSizes.center }}
            >
              {step === 3 ? (
                <button
                  type="button"
                  onClick={openToggleVpn}
                  className="group relative z-10 inline-flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
                  style={{ width: ringSizes.button, height: ringSizes.button }}
                  aria-label={t('subscription.connection.toggleVpnInApp', {
                    defaultValue: 'Переключить VPN в приложении',
                  })}
                >
                  {icon}
                </button>
              ) : step === 2 ? (
                <button
                  type="button"
                  onClick={startAddSubscriptionFlow}
                  className="group relative z-10 inline-flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
                  style={{ width: ringSizes.button, height: ringSizes.button }}
                  aria-label={t('subscription.connection.addSubscription', {
                    defaultValue: 'Добавить подписку',
                  })}
                >
                  {icon}
                </button>
              ) : step === 1 ? (
                <button
                  type="button"
                  onClick={startInstallFlow}
                  className="group relative z-10 inline-flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
                  style={{ width: ringSizes.button, height: ringSizes.button }}
                  aria-label={t('subscription.connection.installApp', {
                    defaultValue: 'Установить приложение',
                  })}
                >
                  {icon}
                </button>
              ) : (
                icon
              )}
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
                        key={`${burst}-return-${index}`}
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

        <section className={`${isFinalStep ? 'pt-1' : ''} pb-0`}>
          {step === 1 && (
            <button
              type="button"
              onClick={startInstallFlow}
              className="ultima-btn-pill ultima-btn-primary mb-3 flex w-full items-center justify-center gap-2 px-5 py-2.5 text-[16px]"
            >
              <span aria-hidden>⟳</span>
              {t('subscription.connection.installApp', { defaultValue: 'Установить приложение' })}
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={startAddSubscriptionFlow}
              className="ultima-btn-pill ultima-btn-primary mb-3 flex w-full items-center justify-center gap-2 px-5 py-2.5 text-[16px]"
            >
              <span aria-hidden>◌</span>
              {t('subscription.connection.addSubscription', { defaultValue: 'Добавить подписку' })}
            </button>
          )}
          {step === 3 && (
            <>
              <button
                type="button"
                onClick={finishFlow}
                disabled={showFinishSuccess}
                className={`ultima-btn-pill ultima-btn-primary mb-3 flex w-full items-center justify-center px-5 text-[16px] ${isVeryShortViewport ? 'py-2' : 'py-2.5'}`}
              >
                {t('subscription.connection.finishSetup', { defaultValue: 'Завершить настройку' })}
              </button>
              <button
                type="button"
                onClick={() => navigate('/support')}
                className={`ultima-btn-pill ultima-btn-secondary mb-3 flex w-full items-center justify-center px-5 text-[15px] ${isVeryShortViewport ? 'py-2' : 'py-2.5'}`}
              >
                {t('subscription.connection.needHelp', { defaultValue: 'Не получилось?' })}
              </button>
            </>
          )}

          {step !== 3 && (
            <button
              type="button"
              onClick={advanceStep}
              className={`ultima-btn-pill ultima-btn-secondary mb-3 flex w-full items-center justify-center gap-2 px-5 text-[16px] ${isVeryShortViewport ? 'py-2' : 'py-2.5'}`}
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
                onClick={dismissReminderForNow}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/30 text-white/90"
                aria-label="close-info-modal"
              >
                ×
              </button>
            </div>
            <p className="text-white/92 text-[15px] leading-[1.28]">{importantInfoDescription}</p>
            <button
              type="button"
              onClick={dismissReminderForNow}
              className="ultima-btn-pill ultima-btn-secondary mt-4 flex w-full items-center justify-center px-5 py-2.5 text-[15px]"
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
                onClick={hideReminderPermanently}
                className="ultima-btn-pill ultima-btn-secondary mt-2 flex w-full items-center justify-center px-5 py-2.5 text-[15px]"
              >
                {t('subscription.connection.hideReminderPermanently', {
                  defaultValue: 'Больше не показывать',
                })}
              </button>
            )}
          </div>
        </>
      )}
      {showFinishSuccess && (
        <div className="pointer-events-none absolute inset-0 z-40">
          <div
            className="absolute"
            style={{
              left: successWaveOrigin.x,
              top: successWaveOrigin.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="ultima-success-wave h-[54vmax] w-[54vmax] rounded-full border"
              style={{
                borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 52%, transparent)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
