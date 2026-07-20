import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  Headphones,
  KeyRound,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Send,
  ShieldCheck,
  Smartphone,
  Unlink,
  X,
} from 'lucide-react';
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

const PROVIDER_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  email: 'Email',
  google: 'Google',
  yandex: 'Яндекс',
  discord: 'Discord',
  vk: 'VK',
};

const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  telegram: 'Вход через Telegram Mini App',
  email: 'Вход по адресу электронной почты',
  google: 'Быстрый вход через аккаунт Google',
  yandex: 'Быстрый вход через Яндекс ID',
  discord: 'Резервный вход через Discord',
  vk: 'Резервный вход через VK ID',
};

const getProviderLabel = (provider: string): string =>
  PROVIDER_LABELS[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);

const getProviderDescription = (provider: string): string =>
  PROVIDER_DESCRIPTIONS[provider] ?? 'Дополнительный способ входа в этот профиль';

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === 'telegram') return <Send className="h-5 w-5 text-sky-300" />;
  if (provider === 'email') return <Mail className="h-5 w-5 text-emerald-200" />;
  return <OAuthProviderIcon provider={provider} className="h-5 w-5" />;
}

const getManualMergeStatus = (request: ManualMergeTicketStatus): string => {
  if (request.decision === 'approve') return 'Одобрен';
  if (request.decision === 'reject') return 'Отклонён';
  return 'На рассмотрении';
};

interface UltimaProviderAccountLinkingViewProps {
  isDesktop: boolean;
  userId?: number | null;
  identitiesLoading: boolean;
  providersLoading: boolean;
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

type NoticeProps = {
  tone: 'success' | 'error' | 'waiting';
  children: ReactNode;
};

function Notice({ tone, children }: NoticeProps) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'error' ? AlertTriangle : LoaderCircle;

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm leading-relaxed',
        tone === 'success' && 'border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100',
        tone === 'error' && 'border-red-300/20 bg-red-400/[0.08] text-red-100',
        tone === 'waiting' && 'border-sky-300/20 bg-sky-300/[0.08] text-sky-100',
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone === 'waiting' && 'animate-spin')} />
      <span>{children}</span>
    </div>
  );
}

export function UltimaProviderAccountLinkingView({
  isDesktop,
  userId,
  identitiesLoading,
  providersLoading,
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
  const linkedCount = linkedIdentities.length;
  const hasBackupLogin = linkedCount > 1;
  const busyLinking =
    telegramDirectLinkLoading ||
    directLinkProvider !== null ||
    waitingExternalProvider !== null ||
    requestUnlinkPending ||
    confirmUnlinkPending;
  const canConnectTelegram = isTelegramMiniApp && !telegramIdentity;
  const hasConnectOptions = canConnectTelegram || availableOAuthProviders.length > 0;

  const telegramGuidance = (() => {
    if (!telegramIdentity || !telegramRelink) return null;
    if (!hasBackupLogin) {
      return 'Перед заменой Telegram подключите Яндекс, email или другой резервный вход.';
    }
    if (telegramRelink.requires_unlink_first) {
      return 'Резервный вход подключён. Теперь Telegram можно безопасно отвязать и заменить.';
    }
    if (telegramRelink.retry_after_seconds) {
      const exactTime = telegramRelink.cooldown_until
        ? ` (${formatDateTime(telegramRelink.cooldown_until)})`
        : '';
      return `Повторная замена Telegram будет доступна через ${formatDurationShort(
        telegramRelink.retry_after_seconds,
      )}${exactTime}.`;
    }
    return 'Telegram можно заменить: отвяжите текущий вход и подключите новый.';
  })();

  return (
    <div
      className={`ultima-shell ultima-shell-wide ultima-flat-frames${isDesktop ? 'ultima-shell-profile-desktop' : ''}`}
    >
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[1040px]">
        <header className="mb-4 flex items-start gap-3">
          <Link
            to="/profile"
            title="Вернуться в профиль"
            aria-label="Вернуться в профиль"
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[clamp(30px,8vw,38px)] font-semibold leading-none text-white">
                Способы входа
              </h1>
              {userId ? (
                <span className="rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[11px] text-white/45">
                  #{userId}
                </span>
              ) : null}
            </div>
            <p className="mt-2 max-w-[650px] text-[13px] leading-relaxed text-white/55">
              Все подключённые способы открывают один профиль с общей подпиской и балансом.
            </p>
          </div>
        </header>

        <div className="ultima-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 lg:overflow-visible lg:pr-0">
          <section
            className={cn(
              'flex items-center gap-3 rounded-2xl border p-4',
              hasBackupLogin
                ? 'border-emerald-300/20 bg-emerald-300/[0.08]'
                : 'border-amber-200/20 bg-amber-200/[0.07]',
            )}
          >
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                hasBackupLogin
                  ? 'bg-emerald-300/15 text-emerald-200'
                  : 'bg-amber-200/10 text-amber-100',
              )}
            >
              {identitiesLoading ? (
                <LoaderCircle className="h-6 w-6 animate-spin" />
              ) : hasBackupLogin ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <KeyRound className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-white">
                {identitiesLoading
                  ? 'Проверяем способы входа'
                  : hasBackupLogin
                    ? 'Доступ защищён'
                    : 'Добавьте резервный вход'}
              </h2>
              <p className="mt-0.5 text-sm leading-relaxed text-white/60">
                {identitiesLoading
                  ? 'Загружаем актуальные привязки вашего профиля.'
                  : hasBackupLogin
                    ? `Подключено ${linkedCount}. Можно войти другим способом, если один окажется недоступен.`
                    : 'Сейчас доступ зависит от одного способа. Подключение второго не создаст новый аккаунт.'}
              </p>
            </div>
            <span className="shrink-0 rounded-lg border border-white/10 bg-black/10 px-2.5 py-1.5 text-xs font-semibold text-white/70">
              {identitiesLoading ? '…' : linkedCount}
            </span>
          </section>

          {providerLinkError ? <Notice tone="error">{providerLinkError}</Notice> : null}
          {providerLinkSuccess ? <Notice tone="success">{providerLinkSuccess}</Notice> : null}
          {linkSuccess ? <Notice tone="success">{linkSuccess}</Notice> : null}
          {waitingExternalProvider ? (
            <Notice tone="waiting">
              Вход через {getProviderLabel(waitingExternalProvider)} открыт во внешнем браузере.
              Завершите авторизацию, кабинет обновится автоматически.
            </Notice>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <section className="rounded-2xl border border-white/10 bg-[rgba(7,18,27,0.82)] p-4 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Подключённые</h2>
                  <p className="mt-0.5 text-sm text-white/50">Через них уже можно войти</p>
                </div>
                <LockKeyhole className="h-5 w-5 text-emerald-200/70" />
              </div>

              <div className="mt-4 divide-y divide-white/[0.08] overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.035]">
                {identitiesLoading ? (
                  <div className="space-y-3 px-3 py-4" aria-label="Загрузка способов входа">
                    <div className="h-10 animate-pulse rounded-lg bg-white/[0.06]" />
                    <div className="h-10 animate-pulse rounded-lg bg-white/[0.06]" />
                  </div>
                ) : linkedIdentities.length > 0 ? (
                  linkedIdentities.map((identity) => (
                    <div
                      key={`${identity.provider}-${identity.provider_user_id_masked}`}
                      className="flex min-h-[72px] items-center gap-3 px-3 py-2.5"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.07]">
                        <ProviderIcon provider={identity.provider} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <h3 className="text-sm font-semibold text-white">
                            {getProviderLabel(identity.provider)}
                          </h3>
                          <span className="rounded-md bg-emerald-300/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-200">
                            Подключён
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-white/45">
                          {identity.provider_user_id_masked}
                        </p>
                        {!identity.can_unlink ? (
                          <p className="mt-1 text-[11px] leading-relaxed text-white/40">
                            {getIdentityBlockedDetails(identity)}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRequestUnlink(identity.provider)}
                        disabled={!identity.can_unlink || busyLinking}
                        title={
                          identity.can_unlink
                            ? `Отвязать ${getProviderLabel(identity.provider)}`
                            : getIdentityBlockedDetails(identity)
                        }
                        aria-label={`Отвязать ${getProviderLabel(identity.provider)}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/45 transition hover:border-red-300/25 hover:bg-red-300/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        {requestUnlinkPending ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Unlink className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-5 text-sm text-white/50">
                    Способы входа ещё не загружены. Обновите страницу через несколько секунд.
                  </div>
                )}
              </div>

              {telegramGuidance ? (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5 text-xs leading-relaxed text-white/55">
                  <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                  <span>{telegramGuidance}</span>
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(7,18,27,0.82)] p-4 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Добавить вход</h2>
                  <p className="mt-0.5 text-sm text-white/50">Выберите удобный сервис</p>
                </div>
                <Link2 className="h-5 w-5 text-emerald-200/70" />
              </div>

              <div className="mt-4 space-y-2">
                {canConnectTelegram ? (
                  <button
                    type="button"
                    onClick={onLinkTelegramDirect}
                    disabled={busyLinking}
                    className="group flex min-h-[64px] w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5 text-left transition hover:border-emerald-200/20 hover:bg-emerald-200/[0.06] disabled:cursor-wait disabled:opacity-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.07]">
                      <ProviderIcon provider="telegram" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white">Telegram</div>
                      <div className="mt-0.5 text-xs text-white/45">
                        {getProviderDescription('telegram')}
                      </div>
                    </div>
                    {telegramDirectLinkLoading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin text-emerald-200" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-white/35 transition group-hover:text-emerald-200" />
                    )}
                  </button>
                ) : null}

                {availableOAuthProviders.map((provider) => (
                  <button
                    key={provider.name}
                    type="button"
                    onClick={() => onLinkOAuth(provider.name)}
                    disabled={busyLinking}
                    className="group flex min-h-[64px] w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5 text-left transition hover:border-emerald-200/20 hover:bg-emerald-200/[0.06] disabled:cursor-wait disabled:opacity-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.07]">
                      <ProviderIcon provider={provider.name} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white">
                        {provider.display_name}
                      </div>
                      <div className="mt-0.5 text-xs text-white/45">
                        {getProviderDescription(provider.name)}
                      </div>
                    </div>
                    {directLinkProvider === provider.name ? (
                      <LoaderCircle className="h-4 w-4 animate-spin text-emerald-200" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-white/35 transition group-hover:text-emerald-200" />
                    )}
                  </button>
                ))}

                {providersLoading ? (
                  <div className="space-y-2" aria-label="Загрузка доступных способов входа">
                    <div className="h-16 animate-pulse rounded-xl bg-white/[0.05]" />
                    <div className="h-16 animate-pulse rounded-xl bg-white/[0.05]" />
                  </div>
                ) : !hasConnectOptions ? (
                  <div className="flex min-h-[88px] items-center gap-3 rounded-xl border border-dashed border-white/10 px-3 py-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-200" />
                    <p className="text-sm leading-relaxed text-white/55">
                      Все доступные способы входа уже подключены.
                    </p>
                  </div>
                ) : null}
              </div>

              {!isTelegramMiniApp && !telegramIdentity ? (
                <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.035] p-3">
                  <p className="text-xs leading-relaxed text-white/55">
                    Telegram подключается внутри Mini App, чтобы кабинет мог безопасно определить
                    ваш аккаунт.
                  </p>
                  {telegramMiniAppLink ? (
                    <a
                      href={telegramMiniAppLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-200 transition hover:text-emerald-100"
                    >
                      Открыть Mini App <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              ) : null}
            </section>
          </div>

          <section className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/65">
                <Headphones className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-white">Не получается подключить вход?</h2>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  Поддержка проверит аккаунты и поможет объединить их без потери подписки.
                </p>
                {latestManualMerge ? (
                  <p className="mt-2 text-xs text-white/60">
                    Запрос #{latestManualMerge.ticket_id}: {getManualMergeStatus(latestManualMerge)}
                    {latestManualMerge.resolution_comment
                      ? ` · ${latestManualMerge.resolution_comment}`
                      : ''}
                  </p>
                ) : null}
              </div>
            </div>
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="shrink-0 border-white/10 bg-white/[0.06] text-white hover:bg-white/10"
            >
              <Link to="/support">Поддержка</Link>
            </Button>
          </section>
        </div>

        {unlinkProvider && unlinkRequestToken ? (
          <div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unlink-dialog-title"
          >
            <div className="w-full max-w-[430px] rounded-2xl border border-white/10 bg-[#0b1c21] p-4 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="unlink-dialog-title" className="text-lg font-semibold text-white">
                    Отвязать {getProviderLabel(unlinkProvider)}?
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-white/55">
                    Введите шестизначный код из Telegram. Остальные способы входа продолжат
                    работать.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCancelUnlink}
                  title="Закрыть"
                  aria-label="Закрыть"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={unlinkOtpCode}
                onChange={(event) => onUnlinkOtpCodeChange(event.target.value)}
                placeholder="000000"
                aria-label="Код подтверждения"
                className="mt-4 h-14 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-center text-xl font-semibold tracking-[0.35em] text-white outline-none transition placeholder:text-white/20 focus:border-emerald-200/35"
              />

              {unlinkError ? (
                <div className="mt-3">
                  <Notice tone="error">{unlinkError}</Notice>
                </div>
              ) : null}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  className="border-white/10 bg-white/[0.06] text-white hover:bg-white/10"
                  onClick={onCancelUnlink}
                >
                  Отмена
                </Button>
                <Button
                  className="bg-red-300 text-red-950 hover:bg-red-200"
                  onClick={onConfirmUnlink}
                  loading={confirmUnlinkPending}
                  disabled={unlinkOtpCode.trim().length !== 6}
                >
                  Отвязать
                </Button>
              </div>
            </div>
          </div>
        ) : unlinkError ? (
          <div className="fixed bottom-24 left-3 right-3 z-[80] mx-auto max-w-[620px]">
            <Notice tone="error">{unlinkError}</Notice>
          </div>
        ) : null}

        <div className="ultima-mobile-dock-footer lg:hidden">
          <div className="ultima-nav-dock">
            <UltimaBottomNav active="profile" />
          </div>
        </div>
      </div>
    </div>
  );
}
