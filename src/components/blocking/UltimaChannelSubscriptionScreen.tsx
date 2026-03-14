import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useBlockingStore } from '../../store/blocking';
import { apiClient, isChannelSubscriptionError } from '../../api/client';

const CHECK_COOLDOWN_SECONDS = 5;

function safeOpenUrl(url: string | undefined | null): void {
  if (!url) return;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch {
    // ignore invalid URL
  }
}

export default function UltimaChannelSubscriptionScreen() {
  const { t } = useTranslation();
  const channelInfo = useBlockingStore((state) => state.channelInfo);
  const clearBlocking = useBlockingStore((state) => state.clearBlocking);
  const [isChecking, setIsChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const allChannels = channelInfo?.channels ?? [];
  const channels = allChannels.filter((channel) => !channel.is_subscribed);
  const backendMessage = channelInfo?.message?.trim() ?? '';
  const isDefaultBackendMessage =
    backendMessage.toLowerCase() === 'please subscribe to the required channels to continue';
  const resolvedMessage =
    backendMessage && !isDefaultBackendMessage
      ? backendMessage
      : t('blocking.channel.defaultMessage', {
          defaultValue: 'Подпишитесь на обязательные каналы, чтобы продолжить.',
        });

  const checkSubscription = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setIsChecking(true);
    setError(null);

    try {
      await apiClient.get('/cabinet/auth/me');
      clearBlocking();
      window.location.reload();
    } catch (err: unknown) {
      if (isChannelSubscriptionError(err)) {
        setError(
          t('blocking.channel.notSubscribed', {
            defaultValue: 'Подписка не найдена. Подпишитесь на канал(ы) и попробуйте снова.',
          }),
        );
      } else {
        setError(
          t('blocking.channel.checkError', {
            defaultValue: 'Не удалось проверить подписку. Попробуйте еще раз.',
          }),
        );
      }
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
      setCooldown(CHECK_COOLDOWN_SECONDS);
    }
  }, [clearBlocking, t]);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#041225]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_70%_at_50%_45%,rgba(33,208,154,0.16),rgba(7,20,46,0.02)_62%,rgba(7,20,46,0)_100%)]" />
      {[0, 2.8, 5.6].map((delay) => (
        <div
          key={delay}
          className="ultima-ring-wave absolute left-1/2 top-[36%] h-[150vmax] w-[150vmax] -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}

      <div className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col justify-center px-4 py-6">
        <section className="rounded-[28px] border border-emerald-200/15 bg-[rgba(10,40,44,0.36)] p-4 backdrop-blur-md">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200/20 bg-emerald-400/15 text-emerald-100">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <path
                  d="M7 12.5 10 15.5 17 8.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="3.75"
                  y="3.75"
                  width="16.5"
                  height="16.5"
                  rx="8.25"
                  stroke="currentColor"
                  strokeOpacity="0.45"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-[30px] font-semibold leading-none tracking-[-0.01em] text-white">
                {t('blocking.channel.title', { defaultValue: 'Проверка подписки' })}
              </h1>
              <p className="text-white/62 mt-1 text-[13px]">{resolvedMessage}</p>
            </div>
          </div>

          <div className="ultima-scrollbar max-h-[34vh] space-y-2 overflow-y-auto pr-1">
            {channels.length > 0 ? (
              channels.map((channel) => (
                <div
                  key={channel.channel_id}
                  className="border-emerald-200/14 bg-emerald-950/28 rounded-2xl border p-3"
                >
                  <p className="truncate text-[14px] font-medium text-white/95">
                    {channel.title || channel.channel_id}
                  </p>
                  <div className="mt-2 flex justify-end">
                    {channel.channel_link ? (
                      <button
                        type="button"
                        onClick={() => safeOpenUrl(channel.channel_link)}
                        className="rounded-full border border-[#52ecc6]/40 bg-[#12cd97] px-3 py-1.5 text-[12px] font-medium text-white"
                      >
                        {t('blocking.channel.openChannel', { defaultValue: 'Открыть канал' })}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : channelInfo?.channel_link ? (
              <button
                type="button"
                onClick={() => safeOpenUrl(channelInfo.channel_link)}
                className="w-full rounded-full border border-[#52ecc6]/40 bg-[#12cd97] px-5 py-2.5 text-sm font-medium text-white"
              >
                {t('blocking.channel.openChannel', { defaultValue: 'Открыть канал' })}
              </button>
            ) : null}
          </div>

          {error ? (
            <p className="bg-rose-500/12 mt-3 rounded-xl border border-rose-300/35 px-3 py-2 text-[12px] text-rose-100">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={checkSubscription}
            disabled={isChecking || cooldown > 0}
            className="mt-3 w-full rounded-full border border-[#52ecc6]/40 bg-[#12cd97] px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isChecking
              ? t('blocking.channel.checking', { defaultValue: 'Проверяем...' })
              : cooldown > 0
                ? t('blocking.channel.waitSeconds', {
                    seconds: cooldown,
                    defaultValue: `Подождите ${cooldown} сек.`,
                  })
                : t('blocking.channel.checkSubscription', {
                    defaultValue: 'Я подписался, проверить',
                  })}
          </button>

          <p className="mt-2 text-center text-[11px] text-white/50">
            {t('blocking.channel.hint', {
              defaultValue: 'После подписки нажмите кнопку проверки.',
            })}
          </p>
        </section>
      </div>
    </div>
  );
}
