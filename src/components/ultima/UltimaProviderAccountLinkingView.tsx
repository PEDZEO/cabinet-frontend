import type { ReactNode } from 'react';
import { Link } from 'react-router';
import OAuthProviderIcon from '@/components/OAuthProviderIcon';
import { Button } from '@/components/primitives/Button';
import { cn } from '@/lib/utils';
import type {
  LinkedIdentity,
  ManualMergeTicketStatus,
  OAuthProvider,
  TelegramRelinkStatus,
} from '@/types';
import { UltimaBottomNav } from './UltimaBottomNav';

const ShieldIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3l7 3.5v5.25c0 4.037-2.421 7.682-6.136 9.235L12 21.5l-.864-.515C7.421 19.432 5 15.787 5 11.75V6.5L12 3z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.8 1.8L14.75 10.25" />
  </svg>
);

const MergeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h4a3 3 0 0 1 3 3v7" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h-4a3 3 0 0 1-3-3V7" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 17l3 3 3-3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 7L7 4 4 7" />
  </svg>
);

const SupportIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 10.5h8M8 14h5.5M6.75 19.5L4.5 21V6.75A2.25 2.25 0 0 1 6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75z"
    />
  </svg>
);

const TelegramIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#2AABEE" />
    <path
      d="M16.78 7.91 6.87 11.73c-.68.27-.67.65-.12.82l2.55.8 5.9-3.72c.28-.17.54-.08.33.11l-4.78 4.32-.18 2.67c.27 0 .39-.13.54-.28l1.3-1.27 2.7 2c.5.28.86.14.99-.46l1.68-7.93c.19-.73-.28-1.06-.83-.81Z"
      fill="#fff"
    />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" className="opacity-30" stroke="currentColor" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const PROVIDER_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  email: 'Email',
  google: 'Google',
  yandex: 'Yandex',
  discord: 'Discord',
  vk: 'VK',
};

const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  telegram: 'Основной вход для Telegram Mini App и быстрый доступ с телефона.',
  email: 'Резервный вход по email для входа вне Telegram.',
  google: 'Привяжите Google как дополнительный способ входа.',
  yandex: 'Подключите Яндекс, чтобы быстро входить без потери подписки.',
  discord: 'Добавьте Discord как запасной доступ к профилю.',
  vk: 'Подключите VK как резервный вход и способ восстановления доступа.',
};

const getProviderLabel = (provider: string): string =>
  PROVIDER_LABELS[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);

const getProviderDescription = (provider: string): string =>
  PROVIDER_DESCRIPTIONS[provider] ?? 'Дополнительный способ входа в этот же профиль.';

const formatLinkedEntriesLabel = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return `${count} способ входа`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} способа входа`;
  }

  return `${count} способов входа`;
};

const getManualMergeStatus = (request: ManualMergeTicketStatus): string => {
  if (request.decision === 'approve') return 'Запрос одобрен';
  if (request.decision === 'reject') return 'Запрос отклонен';
  return 'Запрос на рассмотрении';
};

interface UltimaProviderAccountLinkingViewProps {
  isDesktop: boolean;
  userId?: number | null;
  linkedIdentities: LinkedIdentity[];
  telegramRelink?: TelegramRelinkStatus;
  telegramIdentity?: LinkedIdentity;
  latestManualMerge?: ManualMergeTicketStatus | null;
  availableOAuthProviders: OAuthProvider[];
  isTelegramMiniApp: boolean;
  directLinkProvider: string | null;
  waitingExternalProvider: string | null;
  telegramDirectLinkLoading: boolean;
  providerLinkError: string | null;
  providerLinkSuccess: string | null;
  linkSuccess: string | null;
  unlinkProvider: string | null;
  unlinkRequestToken: string | null;
  unlinkOtpCode: string;
  unlinkError: string | null;
  requestUnlinkPending: boolean;
  confirmUnlinkPending: boolean;
  onLinkTelegramDirect: () => void;
  onLinkOAuth: (provider: string) => void;
  onRequestUnlink: (provider: string) => void;
  onUnlinkOtpCodeChange: (value: string) => void;
  onConfirmUnlink: () => void;
  onCancelUnlink: () => void;
  getIdentityBlockedDetails: (identity: LinkedIdentity) => string;
  formatDurationShort: (totalSeconds?: number | null) => string;
  formatDateTime: (value?: string | null) => string;
}

type ProviderCardProps = {
  title: string;
  description: string;
  disabled?: boolean;
  busy?: boolean;
  status?: string;
  icon: ReactNode;
  onClick?: () => void;
};

function ProviderCard({
  title,
  description,
  disabled = false,
  busy = false,
  status,
  icon,
  onClick,
}: ProviderCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,41,39,0.9),rgba(7,20,35,0.96))] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-200',
        disabled
          ? 'cursor-not-allowed opacity-65'
          : 'hover:border-[#59f0c9]/35 hover:bg-[linear-gradient(180deg,rgba(18,55,51,0.96),rgba(8,26,42,0.98))]',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="bg-white/6 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-white">
          {busy ? <SpinnerIcon /> : icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {status ? (
              <span className="border-[#5cf2ca]/28 max-w-full whitespace-normal break-words rounded-full border bg-[#27cda4]/10 px-2.5 py-1 text-[10px] font-medium leading-tight text-[#95f7e1]">
                {status}
              </span>
            ) : null}
          </div>
          <p className="text-white/58 mt-1 text-xs leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  );
}

export function UltimaProviderAccountLinkingView({
  isDesktop,
  userId,
  linkedIdentities,
  telegramRelink,
  telegramIdentity,
  latestManualMerge,
  availableOAuthProviders,
  isTelegramMiniApp,
  directLinkProvider,
  waitingExternalProvider,
  telegramDirectLinkLoading,
  providerLinkError,
  providerLinkSuccess,
  linkSuccess,
  unlinkProvider,
  unlinkRequestToken,
  unlinkOtpCode,
  unlinkError,
  requestUnlinkPending,
  confirmUnlinkPending,
  onLinkTelegramDirect,
  onLinkOAuth,
  onRequestUnlink,
  onUnlinkOtpCodeChange,
  onConfirmUnlink,
  onCancelUnlink,
  getIdentityBlockedDetails,
  formatDurationShort,
  formatDateTime,
}: UltimaProviderAccountLinkingViewProps) {
  const botUsername = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '').replace(/^@+/, '').trim();
  const telegramMiniAppLink = botUsername ? `https://t.me/${botUsername}/app` : '';
  const busyLinking =
    telegramDirectLinkLoading ||
    directLinkProvider !== null ||
    waitingExternalProvider !== null ||
    requestUnlinkPending ||
    confirmUnlinkPending;

  const relinkStatusLabel = telegramIdentity
    ? telegramRelink?.requires_unlink_first
      ? 'Сначала отвяжите Telegram'
      : 'Telegram подключен'
    : isTelegramMiniApp
      ? 'Можно подключить'
      : 'Только в Mini App';

  const hasAnyAvailableProvider =
    availableOAuthProviders.length > 0 || (isTelegramMiniApp && !telegramIdentity);
  const linkedProvidersCount = linkedIdentities.length;
  const hasAlternativeIdentity = linkedIdentities.length > 1;
  const canReplaceTelegram = Boolean(telegramIdentity && hasAlternativeIdentity);
  const showTelegramMiniAppHint = !isTelegramMiniApp && !telegramIdentity;
  const shouldRenderConnectSection =
    hasAnyAvailableProvider ||
    showTelegramMiniAppHint ||
    waitingExternalProvider !== null ||
    providerLinkError !== null ||
    providerLinkSuccess !== null ||
    linkSuccess !== null;

  return (
    <div
      className={`ultima-shell ultima-shell-wide ultima-flat-frames${isDesktop ? 'ultima-shell-profile-desktop' : ''}`}
    >
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <header className="mb-3 flex flex-col gap-3 min-[390px]:flex-row min-[390px]:items-start min-[390px]:justify-between">
          <div className="min-w-0">
            <h1 className="text-[clamp(32px,8.5vw,38px)] font-semibold leading-[0.95] tracking-[-0.01em] text-white">
              Сохранение доступа
            </h1>
            <p className="text-white/62 mt-1.5 max-w-[620px] text-[13px]">
              Подключите несколько способов входа к одному профилю, чтобы не потерять подписку,
              баланс и доступ при смене способа авторизации.
            </p>
          </div>
          <Link
            to="/profile"
            className="bg-white/6 text-white/72 hover:border-white/16 self-start whitespace-nowrap rounded-full border border-white/10 px-3 py-2 text-xs transition hover:bg-white/10 hover:text-white min-[390px]:shrink-0"
          >
            Профиль
          </Link>
        </header>

        <div className="ultima-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 lg:overflow-visible lg:pr-0">
          <section className="border-emerald-200/12 rounded-[30px] border bg-[linear-gradient(180deg,rgba(64,180,140,0.16),rgba(8,33,36,0.94))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="bg-white/8 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-white">
                <ShieldIcon />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">
                    Один профиль, несколько входов
                  </h2>
                  {userId ? (
                    <span className="bg-white/8 text-white/56 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em]">
                      ID {userId}
                    </span>
                  ) : null}
                </div>
                <p className="text-white/66 mt-1 text-sm leading-relaxed">
                  Выберите нужный способ входа, авторизуйтесь в нем, и кабинет привяжет его к
                  текущему аккаунту.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 min-[360px]:grid-cols-2 xl:grid-cols-3">
              <div className="bg-white/6 rounded-[24px] border border-white/10 p-3.5 min-[360px]:min-h-[122px]">
                <div className="flex items-center gap-2 text-[#8ff8de]">
                  <MergeIcon />
                  <span className="text-xs font-medium uppercase tracking-[0.14em]">
                    Быстрое подключение
                  </span>
                </div>
                <p className="text-white/72 mt-2 text-[13px] leading-relaxed">
                  Новый вход подключается прямо в кабинете без лишних шагов.
                </p>
              </div>
              <div className="bg-white/6 rounded-[24px] border border-white/10 p-3.5 min-[360px]:min-h-[122px]">
                <div className="flex items-center gap-2 text-[#8ff8de]">
                  <ShieldIcon />
                  <span className="text-xs font-medium uppercase tracking-[0.14em]">
                    Общий доступ
                  </span>
                </div>
                <p className="text-white/72 mt-2 text-[13px] leading-relaxed">
                  Баланс, подписка и старые привязки остаются в одном профиле.
                </p>
              </div>
              <div className="bg-white/6 rounded-[24px] border border-white/10 p-3.5 min-[360px]:col-span-2 min-[360px]:min-h-[112px] xl:col-span-1 xl:min-h-[122px]">
                <div className="flex flex-wrap items-center gap-2 text-[#8ff8de]">
                  <TelegramIcon />
                  <span className="text-xs font-medium uppercase tracking-[0.14em]">
                    Запасной доступ
                  </span>
                  <span className="bg-white/8 rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/60">
                    {formatLinkedEntriesLabel(linkedProvidersCount)}
                  </span>
                </div>
                <p className="text-white/72 mt-2 text-[13px] leading-relaxed">
                  Чем больше привязанных способов входа, тем проще сохранить доступ к кабинету.
                </p>
              </div>
            </div>
          </section>

          {shouldRenderConnectSection ? (
            <section className="rounded-[30px] border border-white/10 bg-[rgba(7,18,33,0.88)] p-4 backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Подключить новый способ входа
                  </h2>
                  <p className="text-white/58 mt-1 text-sm">
                    {isTelegramMiniApp
                      ? 'Выберите вход, который хотите добавить к текущему профилю. Yandex и VK откроются в браузере телефона.'
                      : 'Выберите вход, который хотите добавить к текущему профилю. Для Telegram ниже есть отдельный переход в Mini App.'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 min-[360px]:grid-cols-2">
                {!telegramIdentity && isTelegramMiniApp ? (
                  <ProviderCard
                    title="Telegram"
                    description={
                      'Подключите Telegram как основной вход для Mini App и восстановления доступа.'
                    }
                    disabled={busyLinking}
                    busy={telegramDirectLinkLoading}
                    status={relinkStatusLabel}
                    icon={<TelegramIcon />}
                    onClick={onLinkTelegramDirect}
                  />
                ) : null}

                {availableOAuthProviders.map((provider) => (
                  <ProviderCard
                    key={provider.name}
                    title={provider.display_name}
                    description={getProviderDescription(provider.name)}
                    disabled={busyLinking}
                    busy={directLinkProvider === provider.name}
                    status={waitingExternalProvider === provider.name ? 'Ожидаем вход' : undefined}
                    icon={<OAuthProviderIcon provider={provider.name} className="h-5 w-5" />}
                    onClick={() => onLinkOAuth(provider.name)}
                  />
                ))}
              </div>

              {showTelegramMiniAppHint ? (
                <div className="bg-white/6 mt-3 rounded-[24px] border border-white/10 p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="bg-white/8 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-white">
                      <TelegramIcon />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          Telegram подключается в Mini App
                        </h3>
                        <span className="bg-white/8 rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/60">
                          Только в Telegram
                        </span>
                      </div>
                      <p className="text-white/62 mt-1 text-sm leading-relaxed">
                        Чтобы привязать именно Telegram к этому профилю, откройте кабинет в Telegram
                        Mini App и запустите привязку оттуда.
                      </p>
                      {telegramMiniAppLink ? (
                        <Button
                          asChild
                          className="mt-3 h-10 rounded-full border border-[#76f5d5]/25 bg-[rgba(22,207,161,0.92)] px-4 text-sm font-medium text-slate-950 hover:bg-[rgba(39,220,176,0.96)]"
                        >
                          <a href={telegramMiniAppLink} target="_blank" rel="noopener noreferrer">
                            Открыть Mini App
                          </a>
                        </Button>
                      ) : (
                        <p className="text-white/48 mt-3 text-xs leading-relaxed">
                          Telegram-бот не настроен в переменных окружения фронтенда. Добавьте
                          `VITE_TELEGRAM_BOT_USERNAME`, чтобы показать прямой переход.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {waitingExternalProvider ? (
                <div className="border-[#59f0c9]/18 bg-[#27cda4]/8 mt-3 rounded-[24px] border p-3 text-sm text-[#aaf9e8]">
                  Вход через {getProviderLabel(waitingExternalProvider)} открыт во внешнем браузере.
                  Как только авторизация завершится, кабинет сам покажет результат.
                </div>
              ) : null}

              {telegramIdentity ? (
                <div className="bg-white/6 text-white/68 mt-3 rounded-[24px] border border-white/10 p-3 text-sm">
                  {hasAlternativeIdentity
                    ? 'Чтобы заменить Telegram, сначала отвяжите текущий Telegram ниже, затем привяжите новый.'
                    : 'Чтобы заменить Telegram, сначала подключите любой другой способ входа: например Yandex или VK.'}
                </div>
              ) : null}

              {providerLinkError ? (
                <div className="mt-3 rounded-[24px] border border-error-500/30 bg-error-500/10 p-3 text-sm text-error-300">
                  {providerLinkError}
                </div>
              ) : null}

              {providerLinkSuccess ? (
                <div className="mt-3 rounded-[24px] border border-success-500/30 bg-success-500/10 p-3 text-sm text-success-300">
                  {providerLinkSuccess}
                </div>
              ) : null}

              {linkSuccess ? (
                <div className="mt-3 rounded-[24px] border border-success-500/30 bg-success-500/10 p-3 text-sm text-success-300">
                  {linkSuccess}
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-[30px] border border-white/10 bg-[rgba(7,18,33,0.88)] p-4 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-white">Уже подключено</h2>
                <p className="text-white/58 mt-1 text-sm">
                  Здесь видно, через какие входы уже можно открыть этот профиль.
                </p>
              </div>
            </div>

            {linkedIdentities.length > 0 ? (
              <div className="mt-4 space-y-2">
                {linkedIdentities.map((identity) => (
                  <div
                    key={`${identity.provider}-${identity.provider_user_id_masked}`}
                    className="bg-white/6 rounded-[24px] border border-white/10 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {getProviderLabel(identity.provider)}
                          </span>
                          <span className="bg-white/6 text-white/52 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]">
                            {identity.provider_user_id_masked}
                          </span>
                        </div>
                        {!identity.can_unlink ? (
                          <p className="text-white/56 mt-2 text-xs leading-relaxed">
                            {getIdentityBlockedDetails(identity)}
                          </p>
                        ) : null}
                      </div>
                      {identity.can_unlink ? (
                        <button
                          type="button"
                          onClick={() => onRequestUnlink(identity.provider)}
                          disabled={requestUnlinkPending || confirmUnlinkPending}
                          className="hover:bg-error-500/16 disabled:bg-white/8 disabled:text-white/38 shrink-0 rounded-full border border-error-500/35 bg-error-500/10 px-3 py-1.5 text-xs font-medium text-error-300 transition disabled:cursor-not-allowed disabled:border-white/10"
                        >
                          Отвязать
                        </button>
                      ) : (
                        <span
                          className="bg-white/6 text-white/48 shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em]"
                          title={getIdentityBlockedDetails(identity)}
                        >
                          Защищено
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-white/12 bg-white/4 text-white/52 mt-4 rounded-[24px] border border-dashed px-4 py-5 text-sm">
                Пока привязан только текущий способ входа. Подключите еще один вариант выше, чтобы
                доступ было проще восстановить.
              </div>
            )}
          </section>

          {telegramRelink ? (
            <section className="rounded-[30px] border border-white/10 bg-[rgba(7,18,33,0.88)] p-4 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <div className="bg-white/6 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-white">
                  <TelegramIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-white">Замена Telegram</h2>
                  <div className="bg-white/6 mt-2 rounded-[22px] border border-white/10 p-3">
                    {!hasAlternativeIdentity ? (
                      <p className="text-sm text-warning-300">
                        Сначала подключите любой другой способ входа. Без этого Telegram нельзя
                        заменить безопасно.
                      </p>
                    ) : telegramRelink.requires_unlink_first ? (
                      <p className="text-sm text-warning-300">
                        Дополнительный вход уже подключен. Теперь можно отвязать текущий Telegram и
                        затем привязать новый.
                      </p>
                    ) : telegramRelink.retry_after_seconds ? (
                      <p className="text-sm text-warning-300">
                        Смена Telegram будет доступна через{' '}
                        {formatDurationShort(telegramRelink.retry_after_seconds)}
                        {telegramRelink.cooldown_until
                          ? `, точное время: ${formatDateTime(telegramRelink.cooldown_until)}`
                          : ''}
                        .
                      </p>
                    ) : canReplaceTelegram ? (
                      <p className="text-sm text-success-300">
                        Можно отвязать текущий Telegram и привязать новый прямо из этого экрана.
                      </p>
                    ) : (
                      <p className="text-white/68 text-sm">
                        Подключите еще один способ входа, если хотите в будущем заменить Telegram.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {unlinkProvider && unlinkRequestToken ? (
            <section className="rounded-[30px] border border-warning-500/30 bg-warning-500/10 p-4 backdrop-blur-md">
              <h2 className="text-lg font-semibold text-white">Подтвердите отвязку</h2>
              <p className="mt-1 text-sm text-warning-100/85">
                Код подтверждения уже отправлен в Telegram. Введите его, чтобы завершить отвязку{' '}
                {getProviderLabel(unlinkProvider)}.
              </p>

              <input
                type="text"
                inputMode="numeric"
                value={unlinkOtpCode}
                onChange={(event) => onUnlinkOtpCodeChange(event.target.value)}
                placeholder="Введите 6 цифр"
                className="border-white/12 mt-4 w-full rounded-[22px] border bg-[rgba(7,18,33,0.75)] px-3 py-3 text-center tracking-[0.38em] text-white placeholder:text-white/35 focus:border-[#59f0c9]/45 focus:outline-none"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                  onClick={onConfirmUnlink}
                  loading={confirmUnlinkPending}
                  disabled={unlinkOtpCode.trim().length !== 6}
                >
                  Подтвердить отвязку
                </Button>
                <Button
                  variant="secondary"
                  className="border-white/12 bg-white/6 text-white hover:bg-white/10"
                  onClick={onCancelUnlink}
                >
                  Отмена
                </Button>
              </div>

              {unlinkError ? (
                <div className="mt-3 rounded-[22px] border border-error-500/30 bg-error-500/10 p-3 text-sm text-error-300">
                  {unlinkError}
                </div>
              ) : null}
            </section>
          ) : unlinkError ? (
            <section className="rounded-[30px] border border-error-500/30 bg-error-500/10 p-4 backdrop-blur-md">
              <p className="text-sm text-error-300">{unlinkError}</p>
            </section>
          ) : null}

          <section className="rounded-[28px] border border-white/10 bg-[rgba(7,18,33,0.88)] p-3.5 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="bg-white/6 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-white">
                <SupportIcon />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-white">Нужна помощь?</h2>
                <p className="text-white/58 mt-1 text-sm leading-relaxed">
                  Если кабинет не сможет объединить профили автоматически, поддержка поможет
                  завершить перенос вручную.
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                asChild
                size="sm"
                className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
              >
                <Link to="/support">Открыть поддержку</Link>
              </Button>
            </div>

            {latestManualMerge ? (
              <div className="bg-white/6 mt-3 rounded-[22px] border border-white/10 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    Последний merge-запрос #{latestManualMerge.ticket_id}
                  </span>
                  <span className="bg-white/6 text-white/52 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]">
                    {getManualMergeStatus(latestManualMerge)}
                  </span>
                </div>
                {latestManualMerge.resolution_comment ? (
                  <p className="text-white/66 mt-2 text-sm">
                    {latestManualMerge.resolution_comment}
                  </p>
                ) : null}
                <p className="text-white/48 mt-2 text-xs">
                  Обновлено {new Date(latestManualMerge.updated_at).toLocaleString()}
                </p>
              </div>
            ) : null}
          </section>
        </div>

        <div className="ultima-mobile-dock-footer">
          <div className="ultima-nav-dock">
            <UltimaBottomNav active="profile" />
          </div>
        </div>
      </div>
    </div>
  );
}
