import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/api/auth';
import { Button } from '@/components/primitives/Button';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { useAuthStore } from '@/store/auth';
import type { LinkCodePreviewResponse, LinkedIdentity } from '@/types';

const LinkIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 6H16a4.5 4.5 0 110 9h-2.5m-3 0H8a4.5 4.5 0 010-9h2.5m-1.5 6l6-4"
    />
  </svg>
);

type LinkFlowStep = 'idle' | 'preview' | 'warning' | 'manual' | 'done';

export default function UltimaAccountLinking() {
  const { t } = useTranslation();
  const { setUser, setTokens, checkAdminStatus, user } = useAuthStore();
  const queryClient = useQueryClient();

  const [linkCode, setLinkCode] = useState('');
  const [activeLinkCode, setActiveLinkCode] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);
  const [linkPreview, setLinkPreview] = useState<LinkCodePreviewResponse | null>(null);
  const [manualMergeComment, setManualMergeComment] = useState('');
  const [linkFlowStep, setLinkFlowStep] = useState<LinkFlowStep>('idle');
  const [previewedCode, setPreviewedCode] = useState('');
  const [unlinkProvider, setUnlinkProvider] = useState<string | null>(null);
  const [unlinkRequestToken, setUnlinkRequestToken] = useState<string | null>(null);
  const [unlinkOtpCode, setUnlinkOtpCode] = useState('');
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);

  const parseApiError = (
    err: unknown,
  ): { code?: string; message?: string; reason?: string; retry_after_seconds?: number } => {
    const error = err as { response?: { data?: { detail?: unknown } } };
    const detail = error.response?.data?.detail;
    if (!detail) return {};
    if (typeof detail === 'string') return { message: detail };
    if (typeof detail === 'object') {
      const payload = detail as {
        code?: string;
        message?: string;
        reason?: string;
        retry_after_seconds?: number;
      };
      return {
        code: payload.code,
        message: payload.message,
        reason: payload.reason,
        retry_after_seconds: payload.retry_after_seconds,
      };
    }
    return {};
  };

  const formatDateTime = (value?: string | null): string => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleString();
  };

  const formatDurationShort = (totalSeconds?: number | null): string => {
    if (!totalSeconds || totalSeconds <= 0) return '0с';
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (days > 0) return `${days}д ${hours}ч`;
    if (hours > 0) return `${hours}ч ${minutes}м`;
    if (minutes > 0) return `${minutes}м`;
    return `${totalSeconds}с`;
  };

  const getLocalizedLinkError = (err: unknown): string => {
    const { code, message, retry_after_seconds } = parseApiError(err);
    switch (code) {
      case 'link_code_invalid':
        return 'Код недействителен или истек';
      case 'link_code_same_account':
        return 'Нельзя привязать аккаунт к самому себе';
      case 'link_code_attempts_exceeded':
        return 'Слишком много попыток. Попробуйте позже';
      case 'link_code_identity_conflict':
        return 'Конфликт идентификаторов. Нужна ручная проверка';
      case 'link_code_source_inactive':
      case 'link_code_target_inactive':
        return 'Один из аккаунтов неактивен';
      case 'manual_merge_required':
        return 'Оба аккаунта содержат данные. Нужна ручная обработка support.';
      case 'support_disabled':
        return 'Тикеты поддержки отключены';
      case 'telegram_relink_requires_unlink':
        return 'Чтобы привязать другой Telegram, сначала отвяжите текущий Telegram-аккаунт.';
      case 'telegram_relink_cooldown_active':
        return (
          'Смена Telegram-аккаунта доступна не чаще одного раза в 30 дней.' +
          (retry_after_seconds
            ? ` Доступно через: ${formatDurationShort(retry_after_seconds)}.`
            : '')
        );
      default:
        return message || t('common.error', 'Произошла ошибка');
    }
  };

  const getUnlinkReasonText = (reason?: string | null) => {
    switch (reason) {
      case 'last_identity':
        return t(
          'profile.linking.unlink.reasons.lastIdentity',
          'Нельзя отвязать единственный способ входа',
        );
      case 'cooldown_active':
        return t(
          'profile.linking.unlink.reasons.cooldownActive',
          'Сейчас действует ограничение по времени',
        );
      case 'identity_not_linked':
        return t('profile.linking.unlink.reasons.notLinked', 'Этот способ входа не привязан');
      case 'provider_not_supported':
        return t(
          'profile.linking.unlink.reasons.providerNotSupported',
          'Для этого способа отвязка не поддерживается',
        );
      case 'telegram_required':
        return t(
          'profile.linking.unlink.reasons.telegramRequired',
          'Telegram должен оставаться привязанным',
        );
      default:
        return t('profile.linking.unlink.reasons.generic', 'Сейчас отвязка недоступна');
    }
  };

  const getIdentityBlockedDetails = (identity: LinkedIdentity): string => {
    const reasonText = getUnlinkReasonText(identity.blocked_reason);
    if (identity.blocked_reason !== 'cooldown_active') return reasonText;
    const cooldownText = identity.retry_after_seconds
      ? `Доступно через: ${formatDurationShort(identity.retry_after_seconds)}`
      : '';
    const dateText = identity.blocked_until
      ? `Доступно в: ${formatDateTime(identity.blocked_until)}`
      : '';
    return [reasonText, cooldownText, dateText].filter(Boolean).join('. ');
  };

  const getLocalizedUnlinkError = (err: unknown) => {
    const parsed = parseApiError(err);
    if (parsed.reason) return getUnlinkReasonText(parsed.reason);
    if (parsed.code === 'unlink_otp_resend_cooldown')
      return t(
        'profile.linking.unlink.errors.otpResendCooldown',
        'Код уже отправлен, подождите перед повторной отправкой',
      );
    if (parsed.code === 'unlink_otp_rate_limited')
      return t(
        'profile.linking.unlink.errors.otpRateLimited',
        'Слишком много попыток. Попробуйте позже',
      );
    if (parsed.code === 'unlink_request_invalid')
      return t('profile.linking.unlink.errors.requestInvalid', 'Запрос устарел. Начните заново');
    if (parsed.code === 'unlink_request_mismatch')
      return t(
        'profile.linking.unlink.errors.requestMismatch',
        'Запрос не совпадает. Повторите действие',
      );
    if (parsed.code === 'unlink_otp_invalid') {
      return t('profile.linking.unlink.errors.otpInvalid', 'Неверный код подтверждения');
    }
    if (parsed.code === 'unlink_otp_attempts_exceeded')
      return t(
        'profile.linking.unlink.errors.otpAttemptsExceeded',
        'Превышено число попыток ввода кода',
      );
    if (parsed.code === 'unlink_otp_delivery_failed')
      return t(
        'profile.linking.unlink.errors.otpDeliveryFailed',
        'Не удалось отправить код подтверждения',
      );
    return parsed.message || t('common.error', 'Произошла ошибка');
  };

  const { data: linkedIdentitiesData } = useQuery({
    queryKey: ['linked-identities'],
    queryFn: authApi.getLinkedIdentities,
    enabled: !!user,
  });

  const { data: latestManualMerge } = useQuery({
    queryKey: ['latest-manual-merge-request'],
    queryFn: authApi.getLatestManualMergeRequest,
    enabled: !!user,
  });

  const linkedIdentities = linkedIdentitiesData?.identities || [];
  const telegramRelink = linkedIdentitiesData?.telegram_relink;
  const telegramIdentity = linkedIdentities.find((identity) => identity.provider === 'telegram');
  const hasCurrentTelegramIdentity = linkedIdentities.some(
    (identity) => identity.provider === 'telegram',
  );
  const previewHasTelegramIdentity = !!linkPreview?.source_identity_hints?.telegram;
  const shouldShowTelegramReplaceWarning = hasCurrentTelegramIdentity && previewHasTelegramIdentity;

  const createLinkCodeMutation = useMutation({
    mutationFn: authApi.createLinkCode,
    onSuccess: (data) => {
      setLinkError(null);
      setLinkSuccess('Код привязки создан');
      setActiveLinkCode(data.code);
      setLinkCode(data.code);
      setLinkPreview(null);
      setPreviewedCode('');
      setLinkFlowStep('idle');
      setManualMergeComment('');
    },
    onError: (err) => {
      setLinkSuccess(null);
      setLinkError(getLocalizedLinkError(err));
    },
  });

  const previewLinkCodeMutation = useMutation({
    mutationFn: (code: string) => authApi.previewLinkCode(code),
    onSuccess: (data, code) => {
      setLinkError(null);
      setLinkPreview(data);
      const hasTelegramInPreview = !!data.source_identity_hints?.telegram;
      setLinkFlowStep(hasCurrentTelegramIdentity && hasTelegramInPreview ? 'warning' : 'preview');
      setPreviewedCode(code);
    },
    onError: (err: unknown) => {
      setLinkPreview(null);
      setLinkSuccess(null);
      const parsed = parseApiError(err);
      setLinkFlowStep(parsed.code === 'manual_merge_required' ? 'manual' : 'idle');
      setPreviewedCode('');
      setLinkError(getLocalizedLinkError(err));
    },
  });

  const confirmLinkCodeMutation = useMutation({
    mutationFn: (code: string) => authApi.confirmLinkCode(code),
    onSuccess: async (data) => {
      setTokens(data.access_token, data.refresh_token);
      setUser(data.user);
      await checkAdminStatus();
      setLinkSuccess('Аккаунты успешно объединены');
      setLinkError(null);
      setActiveLinkCode('');
      setLinkCode('');
      setLinkPreview(null);
      setPreviewedCode('');
      setLinkFlowStep('done');
      setManualMergeComment('');
      queryClient.invalidateQueries({ queryKey: ['linked-identities'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (err: unknown) => {
      setLinkSuccess(null);
      const parsed = parseApiError(err);
      setLinkFlowStep(parsed.code === 'manual_merge_required' ? 'manual' : 'idle');
      setLinkError(getLocalizedLinkError(err));
    },
  });

  const manualMergeMutation = useMutation({
    mutationFn: ({ code, comment }: { code: string; comment?: string }) =>
      authApi.requestManualMerge(code, comment),
    onSuccess: (data) => {
      setLinkError(null);
      setLinkSuccess(`Запрос на ручное объединение отправлен. Тикет #${data.ticket_id}`);
      setLinkFlowStep('done');
      setManualMergeComment('');
      queryClient.invalidateQueries({ queryKey: ['latest-manual-merge-request'] });
    },
    onError: (err: unknown) => {
      setLinkSuccess(null);
      setLinkError(getLocalizedLinkError(err));
    },
  });

  const requestUnlinkMutation = useMutation({
    mutationFn: (provider: string) => authApi.requestUnlinkIdentity(provider),
    onSuccess: (data) => {
      setUnlinkError(null);
      setLinkError(null);
      setLinkSuccess(
        data.provider === 'telegram'
          ? 'Код подтверждения отправлен в Telegram. После отвязки сразу сможете привязать новый Telegram-код.'
          : t(
              'profile.linking.unlink.codeSent',
              'Код отправлен в Telegram. Введите его для подтверждения',
            ),
      );
      setUnlinkProvider(data.provider);
      setUnlinkRequestToken(data.request_token);
      setUnlinkOtpCode('');
    },
    onError: (err: unknown) => {
      setUnlinkError(getLocalizedUnlinkError(err));
    },
  });

  const confirmUnlinkMutation = useMutation({
    mutationFn: ({
      provider,
      token,
      otpCode,
    }: {
      provider: string;
      token: string;
      otpCode: string;
    }) => authApi.confirmUnlinkIdentity(provider, token, otpCode),
    onSuccess: (data) => {
      setUnlinkError(null);
      setUnlinkProvider(null);
      setUnlinkRequestToken(null);
      setUnlinkOtpCode('');
      setLinkSuccess(
        t('profile.linking.unlink.success', {
          provider: data.provider,
          defaultValue: 'Способ входа {{provider}} успешно отвязан',
        }),
      );
      queryClient.invalidateQueries({ queryKey: ['linked-identities'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (err: unknown) => {
      setUnlinkError(getLocalizedUnlinkError(err));
    },
  });

  const normalizedLinkCode = linkCode.trim().toUpperCase();
  const hasLinkCode = normalizedLinkCode.length > 0;
  const isCodePreviewed = hasLinkCode && previewedCode === normalizedLinkCode && !!linkPreview;
  const canConfirmLink =
    isCodePreviewed && (linkFlowStep === 'preview' || linkFlowStep === 'warning');

  return (
    <div className="ultima-shell ultima-flat-frames">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_70%_at_50%_45%,rgba(33,208,154,0.14),rgba(7,20,46,0.02)_62%,rgba(7,20,46,0)_100%)]" />
      <div className="ultima-shell-inner">
        <header className="mb-3">
          <h1 className="text-[clamp(32px,8.5vw,38px)] font-semibold leading-[0.95] tracking-[-0.01em] text-white">
            Привязка аккаунтов
          </h1>
          <p className="text-white/62 mt-1.5 text-[13px]">
            Единая страница для безопасной привязки и смены Telegram, Yandex и VK.
          </p>
        </header>

        <div className="ultima-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <section className="border-emerald-200/12 mb-1 rounded-[28px] border bg-[linear-gradient(180deg,rgba(69,186,142,0.16),rgba(18,79,64,0.28))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="border-white/12 bg-white/8 flex h-10 w-10 items-center justify-center rounded-2xl border text-white/85">
                <LinkIcon />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-white">Привязка аккаунтов</h1>
                <p className="text-white/62 mt-1 text-sm">
                  Единая страница для безопасной привязки и смены Telegram, Yandex и VK.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="border-white/12 bg-white/6 rounded-xl border px-2 py-1 text-white/70">
                    1. Введите код с другого аккаунта
                  </span>
                  <span className="border-white/12 bg-white/6 rounded-xl border px-2 py-1 text-white/70">
                    2. Проверьте, что найден нужный аккаунт
                  </span>
                  <span className="border-white/12 bg-white/6 rounded-xl border px-2 py-1 text-white/70">
                    3. Подтвердите привязку или отправьте в поддержку
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button variant="secondary" onClick={() => setShowTips((prev) => !prev)}>
                    {showTips ? 'Скрыть подсказки' : 'Показать подсказки'}
                  </Button>
                  <Link
                    to="/profile"
                    className="inline-flex text-xs text-[#56e8c2] hover:text-[#7af3d7]"
                  >
                    Вернуться в профиль
                  </Link>
                </div>
                {showTips && (
                  <div className="border-white/12 bg-white/6 text-white/72 mt-3 rounded-2xl border p-3 text-xs">
                    <p>
                      Код нужно брать на втором аккаунте: нажмите там "Сгенерировать код", затем
                      введите его здесь.
                    </p>
                    <p className="mt-1">
                      Если Telegram уже привязан, сначала отвяжите его через код из Telegram. После
                      этого можно сразу привязать новый.
                    </p>
                    <p className="mt-1">
                      Если система не может объединить автоматически, нажмите "Отправить в
                      поддержку" и коротко опишите ситуацию.
                    </p>
                    <p className="mt-1">
                      Если есть ограничение по времени, мы покажем точную дату и время, когда можно
                      повторить действие.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="border-emerald-200/12 rounded-3xl border bg-[rgba(12,45,42,0.2)] p-3 backdrop-blur-md">
            <h2 className="mb-4 text-lg font-semibold text-white/95">Связанные способы входа</h2>

            <div className="mb-4 flex flex-wrap gap-2">
              {linkedIdentities.length > 0 ? (
                linkedIdentities.map((identity) => (
                  <div
                    key={`${identity.provider}-${identity.provider_user_id_masked}`}
                    className="border-white/12 bg-white/6 text-white/82 flex items-center gap-2 rounded-xl border px-3 py-1 text-xs"
                  >
                    <span>
                      {identity.provider}: {identity.provider_user_id_masked}
                    </span>
                    <button
                      type="button"
                      onClick={() => requestUnlinkMutation.mutate(identity.provider)}
                      disabled={!identity.can_unlink || requestUnlinkMutation.isPending}
                      className="rounded border border-error-500/40 px-2 py-0.5 text-[10px] text-error-300 transition-colors hover:bg-error-500/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
                      title={identity.can_unlink ? undefined : getIdentityBlockedDetails(identity)}
                    >
                      {t('profile.linking.unlink.button', 'Отвязать')}
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-sm text-white/55">
                  {t('profile.linking.none', 'Нет привязанных способов входа')}
                </span>
              )}
            </div>

            {telegramRelink && (
              <div className="border-white/12 bg-white/6 mb-4 rounded-2xl border p-3">
                <p className="text-white/92 text-sm font-medium">Статус смены Telegram</p>
                {linkedIdentities.length <= 1 && (
                  <p className="mt-1 text-xs text-warning-300">
                    Важно: если привязан только Telegram, сменить его не получится. Сначала
                    привяжите хотя бы один дополнительный способ входа (Yandex или VK).
                  </p>
                )}
                {telegramRelink.requires_unlink_first ? (
                  <p className="mt-1 text-xs text-warning-300">
                    Сейчас привязан Telegram. Для смены сначала отвяжите текущий Telegram, затем
                    привяжите новый.
                  </p>
                ) : telegramRelink.retry_after_seconds ? (
                  <p className="mt-1 text-xs text-warning-300">
                    Доступно через: {formatDurationShort(telegramRelink.retry_after_seconds)}
                    {telegramRelink.cooldown_until
                      ? ` (в: ${formatDateTime(telegramRelink.cooldown_until)})`
                      : ''}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-success-400">
                    Смена Telegram доступна. Можно привязать другой Telegram-код.
                  </p>
                )}
                {telegramIdentity && (
                  <p className="text-white/62 mt-2 text-xs">
                    Текущий Telegram: {telegramIdentity.provider_user_id_masked}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3 border-t border-white/10 pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => createLinkCodeMutation.mutate()}
                  loading={createLinkCodeMutation.isPending}
                >
                  Сгенерировать код привязки
                </Button>
                {activeLinkCode && (
                  <span className="bg-[#1bd29f]/12 rounded-xl border border-[#59f0c9]/35 px-3 py-2 font-mono text-sm text-[#8ff8de]">
                    {activeLinkCode}
                  </span>
                )}
              </div>

              <input
                type="text"
                value={linkCode}
                onChange={(e) => {
                  const nextCode = e.target.value.toUpperCase().trim();
                  setLinkCode(nextCode);
                  setLinkError(null);
                  setLinkSuccess(null);
                  if (nextCode !== previewedCode) {
                    setLinkPreview(null);
                    setLinkFlowStep('idle');
                  }
                }}
                placeholder="Введите код привязки"
                className="border-white/12 bg-white/6 w-full rounded-2xl border px-3 py-2.5 text-white placeholder:text-white/45 focus:border-[#59f0c9]/45 focus:outline-none"
              />

              <div className="border-white/12 bg-white/6 text-white/72 rounded-2xl border px-3 py-2 text-xs">
                {linkFlowStep === 'idle' &&
                  'Шаг 1 из 3: вставьте код со второго аккаунта и нажмите "Проверить".'}
                {linkFlowStep === 'preview' &&
                  'Шаг 2 из 3: код верный. Убедитесь, что это нужный аккаунт, и нажмите "Привязать".'}
                {linkFlowStep === 'warning' &&
                  'Шаг 3 из 3: будет заменён Telegram. Подтвердите только если хотите отвязать старый Telegram и привязать новый.'}
                {linkFlowStep === 'manual' &&
                  'Шаг 3 из 3: автоматически объединить не получилось. Отправьте запрос в поддержку на этой странице.'}
                {linkFlowStep === 'done' &&
                  'Готово. Привязка завершена. При необходимости можно создать новый код.'}
              </div>

              {linkPreview && (
                <div className="border-white/12 bg-white/6 rounded-2xl border p-3">
                  <p className="text-white/74 mb-2 text-sm">
                    Будет привязан к аккаунту #{' '}
                    <span className="font-semibold text-white">{linkPreview.source_user_id}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(linkPreview.source_identity_hints).map(([provider, value]) => (
                      <span
                        key={`${provider}-${value}`}
                        className="border-white/12 bg-white/6 text-white/82 rounded-xl border px-2 py-1 text-xs"
                      >
                        {provider}: {value}
                      </span>
                    ))}
                  </div>
                  {shouldShowTelegramReplaceWarning && (
                    <div className="mt-3 rounded-linear border border-warning-500/30 bg-warning-500/10 p-2 text-xs text-warning-300">
                      Внимание: вы пытаетесь сменить Telegram-аккаунт. После привязки нового
                      Telegram старый Telegram-вход будет потерян.
                    </div>
                  )}
                </div>
              )}

              {linkFlowStep === 'manual' && (
                <div className="rounded-linear border border-warning-500/30 bg-warning-500/10 p-3">
                  <p className="mb-2 text-sm text-warning-300">
                    Автоматическое объединение невозможно. Отправьте запрос в поддержку для ручного
                    merge.
                  </p>
                  <textarea
                    value={manualMergeComment}
                    onChange={(e) => setManualMergeComment(e.target.value)}
                    className="border-white/12 bg-white/6 mb-3 min-h-[88px] w-full rounded-2xl border px-3 py-2.5 text-white placeholder:text-white/45 focus:border-[#59f0c9]/45 focus:outline-none"
                    placeholder="Опишите, какой аккаунт основной и почему нужно объединение"
                    maxLength={1000}
                  />
                </div>
              )}

              {linkError && (
                <div className="rounded-linear border border-error-500/30 bg-error-500/10 p-3 text-sm text-error-400">
                  {linkError}
                </div>
              )}

              {unlinkProvider && unlinkRequestToken && (
                <div className="rounded-linear border border-warning-500/30 bg-warning-500/10 p-3">
                  <p className="mb-2 text-sm text-warning-300">
                    {t('profile.linking.unlink.confirmText', {
                      provider: unlinkProvider,
                      defaultValue:
                        'Вы уверены, что хотите отвязать {{provider}}? Для подтверждения нужен код из Telegram.',
                    })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() =>
                        confirmUnlinkMutation.mutate({
                          provider: unlinkProvider,
                          token: unlinkRequestToken,
                          otpCode: unlinkOtpCode.trim(),
                        })
                      }
                      loading={confirmUnlinkMutation.isPending}
                      disabled={unlinkOtpCode.trim().length !== 6}
                    >
                      {t('profile.linking.unlink.confirm', 'Подтвердить')}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setUnlinkProvider(null);
                        setUnlinkRequestToken(null);
                        setUnlinkOtpCode('');
                        setUnlinkError(null);
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={unlinkOtpCode}
                    onChange={(e) =>
                      setUnlinkOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder={t(
                      'profile.linking.unlink.otpPlaceholder',
                      'Введите код подтверждения',
                    )}
                    className="border-white/12 bg-white/6 mt-3 w-full rounded-2xl border px-3 py-2.5 text-center tracking-[0.4em] text-white placeholder:text-white/45 focus:border-[#59f0c9]/45 focus:outline-none"
                  />
                </div>
              )}

              {unlinkError && (
                <div className="rounded-linear border border-error-500/30 bg-error-500/10 p-3 text-sm text-error-400">
                  {unlinkError}
                </div>
              )}

              {linkSuccess && (
                <div className="rounded-linear border border-success-500/30 bg-success-500/10 p-3 text-sm text-success-400">
                  {linkSuccess}
                </div>
              )}

              {latestManualMerge && (
                <div className="border-white/12 bg-white/6 rounded-2xl border p-3">
                  <div className="text-white/92 mb-1 text-sm font-medium">
                    Последний спорный merge-запрос #{latestManualMerge.ticket_id}
                  </div>
                  <div className="text-sm text-white/75">
                    {latestManualMerge.decision === 'approve'
                      ? 'Запрос одобрен'
                      : latestManualMerge.decision === 'reject'
                        ? 'Запрос отклонен'
                        : 'Запрос на рассмотрении'}
                  </div>
                  {latestManualMerge.resolution_comment && (
                    <div className="text-white/62 mt-2 text-xs">
                      Комментарий: {latestManualMerge.resolution_comment}
                    </div>
                  )}
                  <div className="text-white/52 mt-1 text-xs">
                    Обновлено {new Date(latestManualMerge.updated_at).toLocaleString()}
                  </div>
                  <Link
                    to="/support"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-[#56e8c2] transition-colors hover:text-[#7af3d7]"
                  >
                    Открыть поддержку
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="border-white/12 mb-2 rounded-2xl border bg-[rgba(7,18,33,0.9)] p-2 backdrop-blur-xl">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="border-emerald-200/20 bg-emerald-950/45 text-emerald-100 hover:bg-emerald-900/45"
              onClick={() => previewLinkCodeMutation.mutate(normalizedLinkCode)}
              loading={previewLinkCodeMutation.isPending}
              disabled={!hasLinkCode}
            >
              Проверить
            </Button>
            <Button
              className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
              onClick={() => confirmLinkCodeMutation.mutate(normalizedLinkCode)}
              loading={confirmLinkCodeMutation.isPending}
              disabled={!canConfirmLink}
            >
              Привязать
            </Button>
            {linkFlowStep === 'manual' && (
              <Button
                className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                onClick={() =>
                  manualMergeMutation.mutate({
                    code: normalizedLinkCode,
                    comment: manualMergeComment.trim() || undefined,
                  })
                }
                loading={manualMergeMutation.isPending}
                disabled={!hasLinkCode}
              >
                Отправить в поддержку
              </Button>
            )}
          </div>
        </div>

        <div className="ultima-nav-dock">
          <UltimaBottomNav active="profile" />
        </div>
      </div>
    </div>
  );
}
