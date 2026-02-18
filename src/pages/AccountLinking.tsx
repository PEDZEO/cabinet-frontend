import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/api/auth';
import { Card } from '@/components/data-display/Card';
import { Button } from '@/components/primitives/Button';
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

export default function AccountLinking() {
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
        return message || t('common.error');
    }
  };

  const getUnlinkReasonText = (reason?: string | null) => {
    switch (reason) {
      case 'last_identity':
        return t('profile.linking.unlink.reasons.lastIdentity');
      case 'cooldown_active':
        return t('profile.linking.unlink.reasons.cooldownActive');
      case 'identity_not_linked':
        return t('profile.linking.unlink.reasons.notLinked');
      case 'provider_not_supported':
        return t('profile.linking.unlink.reasons.providerNotSupported');
      case 'telegram_required':
        return t('profile.linking.unlink.reasons.telegramRequired');
      default:
        return t('profile.linking.unlink.reasons.generic');
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
      return t('profile.linking.unlink.errors.otpResendCooldown');
    if (parsed.code === 'unlink_otp_rate_limited')
      return t('profile.linking.unlink.errors.otpRateLimited');
    if (parsed.code === 'unlink_request_invalid')
      return t('profile.linking.unlink.errors.requestInvalid');
    if (parsed.code === 'unlink_request_mismatch')
      return t('profile.linking.unlink.errors.requestMismatch');
    if (parsed.code === 'unlink_otp_invalid') return t('profile.linking.unlink.errors.otpInvalid');
    if (parsed.code === 'unlink_otp_attempts_exceeded')
      return t('profile.linking.unlink.errors.otpAttemptsExceeded');
    if (parsed.code === 'unlink_otp_delivery_failed')
      return t('profile.linking.unlink.errors.otpDeliveryFailed');
    return parsed.message || t('common.error');
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
          : t('profile.linking.unlink.codeSent'),
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
      setLinkSuccess(t('profile.linking.unlink.success', { provider: data.provider }));
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
    <div className="space-y-6">
      <Card>
        <div className="flex items-start gap-3">
          <div className="rounded-linear bg-accent-500/20 p-2 text-accent-300">
            <LinkIcon />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-dark-50">Привязка аккаунтов</h1>
            <p className="mt-1 text-sm text-dark-400">
              Управляйте Telegram, Yandex и VK в одном месте. Здесь есть безопасная смена Telegram,
              OTP-подтверждение и ручная заявка в поддержку для спорных кейсов.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-linear border border-dark-700/70 bg-dark-800/60 px-2 py-1 text-dark-300">
                1. Проверка кода
              </span>
              <span className="rounded-linear border border-dark-700/70 bg-dark-800/60 px-2 py-1 text-dark-300">
                2. Предупреждение о Telegram
              </span>
              <span className="rounded-linear border border-dark-700/70 bg-dark-800/60 px-2 py-1 text-dark-300">
                3. Подтверждение / support
              </span>
            </div>
            <Link
              to="/profile"
              className="mt-3 inline-flex text-xs text-accent-400 hover:text-accent-300"
            >
              Вернуться в профиль
            </Link>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-dark-100">Связанные способы входа</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          {linkedIdentities.length > 0 ? (
            linkedIdentities.map((identity) => (
              <div
                key={`${identity.provider}-${identity.provider_user_id_masked}`}
                className="flex items-center gap-2 rounded-linear border border-dark-700/80 bg-dark-800/70 px-3 py-1 text-xs text-dark-200"
              >
                <span>
                  {identity.provider}: {identity.provider_user_id_masked}
                </span>
                <button
                  type="button"
                  onClick={() => requestUnlinkMutation.mutate(identity.provider)}
                  disabled={!identity.can_unlink || requestUnlinkMutation.isPending}
                  className="rounded border border-error-500/40 px-2 py-0.5 text-[10px] text-error-300 transition-colors hover:bg-error-500/10 disabled:cursor-not-allowed disabled:border-dark-600 disabled:text-dark-500"
                  title={identity.can_unlink ? undefined : getIdentityBlockedDetails(identity)}
                >
                  {t('profile.linking.unlink.button')}
                </button>
              </div>
            ))
          ) : (
            <span className="text-sm text-dark-500">
              {t('profile.linking.none', 'Нет привязанных способов входа')}
            </span>
          )}
        </div>

        {telegramRelink && (
          <div className="mb-4 rounded-linear border border-dark-700/80 bg-dark-800/60 p-3">
            <p className="text-sm font-medium text-dark-100">Статус смены Telegram</p>
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
              <p className="mt-2 text-xs text-dark-400">
                Текущий Telegram: {telegramIdentity.provider_user_id_masked}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3 border-t border-dark-800/50 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => createLinkCodeMutation.mutate()}
              loading={createLinkCodeMutation.isPending}
            >
              Сгенерировать код привязки
            </Button>
            {activeLinkCode && (
              <span className="rounded-linear border border-accent-500/40 bg-accent-500/10 px-3 py-2 font-mono text-sm text-accent-300">
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
            className="input w-full"
          />

          <div className="rounded-linear border border-dark-700/70 bg-dark-800/40 px-3 py-2 text-xs text-dark-300">
            {linkFlowStep === 'idle' && 'Шаг 1: введите код и нажмите "Проверить".'}
            {linkFlowStep === 'preview' &&
              'Шаг 2: код проверен. Проверьте данные аккаунта и нажмите "Привязать".'}
            {linkFlowStep === 'warning' &&
              'Шаг 2: обнаружена смена Telegram. Подтвердите, если согласны заменить текущий Telegram.'}
            {linkFlowStep === 'manual' &&
              'Шаг 2: автоматическое объединение недоступно. Отправьте запрос в поддержку.'}
            {linkFlowStep === 'done' &&
              'Операция завершена. Можно создать новый код при необходимости.'}
          </div>

          <div className="sticky bottom-3 z-20 rounded-linear border border-dark-700/80 bg-dark-900/90 p-2 backdrop-blur">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => previewLinkCodeMutation.mutate(normalizedLinkCode)}
                loading={previewLinkCodeMutation.isPending}
                disabled={!hasLinkCode}
              >
                Проверить
              </Button>
              <Button
                onClick={() => confirmLinkCodeMutation.mutate(normalizedLinkCode)}
                loading={confirmLinkCodeMutation.isPending}
                disabled={!canConfirmLink}
              >
                Привязать
              </Button>
              {linkFlowStep === 'manual' && (
                <Button
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

          {linkPreview && (
            <div className="rounded-linear border border-dark-700/80 bg-dark-800/60 p-3">
              <p className="mb-2 text-sm text-dark-300">
                Будет привязан к аккаунту #{' '}
                <span className="font-semibold text-dark-100">{linkPreview.source_user_id}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(linkPreview.source_identity_hints).map(([provider, value]) => (
                  <span
                    key={`${provider}-${value}`}
                    className="rounded-linear border border-dark-700/80 bg-dark-800/70 px-2 py-1 text-xs text-dark-200"
                  >
                    {provider}: {value}
                  </span>
                ))}
              </div>
              {shouldShowTelegramReplaceWarning && (
                <div className="mt-3 rounded-linear border border-warning-500/30 bg-warning-500/10 p-2 text-xs text-warning-300">
                  Внимание: вы пытаетесь сменить Telegram-аккаунт. После привязки нового Telegram
                  старый Telegram-вход будет потерян.
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
                className="input mb-3 min-h-[88px] w-full"
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
                {t('profile.linking.unlink.confirmText', { provider: unlinkProvider })}
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
                  {t('profile.linking.unlink.confirm')}
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
                onChange={(e) => setUnlinkOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('profile.linking.unlink.otpPlaceholder')}
                className="input mt-3 w-full text-center tracking-[0.4em]"
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
            <div className="rounded-linear border border-dark-700/80 bg-dark-800/60 p-3">
              <div className="mb-1 text-sm font-medium text-dark-100">
                Последний спорный merge-запрос #{latestManualMerge.ticket_id}
              </div>
              <div className="text-sm text-dark-300">
                {latestManualMerge.decision === 'approve'
                  ? 'Запрос одобрен'
                  : latestManualMerge.decision === 'reject'
                    ? 'Запрос отклонен'
                    : 'Запрос на рассмотрении'}
              </div>
              {latestManualMerge.resolution_comment && (
                <div className="mt-2 text-xs text-dark-400">
                  Комментарий: {latestManualMerge.resolution_comment}
                </div>
              )}
              <div className="mt-1 text-xs text-dark-500">
                Обновлено {new Date(latestManualMerge.updated_at).toLocaleString()}
              </div>
              <Link
                to="/support"
                className="mt-2 inline-flex items-center gap-1 text-xs text-accent-400 transition-colors hover:text-accent-300"
              >
                Открыть поддержку
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
