import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/auth';
import { authApi } from '../api/auth';
import { isValidEmail } from '../utils/validation';
import type { LinkCodePreviewResponse, LinkedIdentity } from '../types';
import {
  notificationsApi,
  NotificationSettings,
  NotificationSettingsUpdate,
} from '../api/notifications';
import { referralApi } from '../api/referral';
import { brandingApi, type EmailAuthEnabled } from '../api/branding';
import { UI } from '../config/constants';
import { Card } from '@/components/data-display/Card';
import { Button } from '@/components/primitives/Button';
import { Switch } from '@/components/primitives/Switch';
import { staggerContainer, staggerItem } from '@/components/motion/transitions';

// Icons
const CopyIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
    />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const ShareIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8l5-5m0 0l5 5m-5-5v12" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    className={className || 'h-5 w-5'}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const PencilIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
    />
  </svg>
);

type LinkFlowStep = 'idle' | 'preview' | 'warning' | 'manual' | 'done';

export default function Profile() {
  const { t } = useTranslation();
  const { user, setUser, setTokens, checkAdminStatus } = useAuthStore();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);
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

  // Inline email change flow
  const [changeEmailStep, setChangeEmailStep] = useState<'email' | 'code' | 'success' | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [changeCode, setChangeCode] = useState('');
  const [changeError, setChangeError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const newEmailInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Referral data
  const { data: referralInfo } = useQuery({
    queryKey: ['referral-info'],
    queryFn: referralApi.getReferralInfo,
  });

  const { data: referralTerms } = useQuery({
    queryKey: ['referral-terms'],
    queryFn: referralApi.getReferralTerms,
  });

  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: brandingApi.getBranding,
    staleTime: 60000,
  });

  // Check if email auth is enabled
  const { data: emailAuthConfig } = useQuery<EmailAuthEnabled>({
    queryKey: ['email-auth-enabled'],
    queryFn: brandingApi.getEmailAuthEnabled,
    staleTime: 60000,
  });
  const isEmailAuthEnabled = emailAuthConfig?.enabled ?? true;
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
    (user?.username ? `@${user.username}` : null) ||
    (user?.email ? user.email.split('@')[0] : null) ||
    '-';

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

  const getLocalizedLinkError = (err: unknown): string => {
    const { code, message, retry_after_seconds } = parseApiError(err);
    switch (code) {
      case 'link_code_invalid':
        return t('profile.linking.errors.invalidCode', 'Код недействителен или истек');
      case 'link_code_same_account':
        return t('profile.linking.errors.sameAccount', 'Нельзя привязать аккаунт к самому себе');
      case 'link_code_attempts_exceeded':
        return t(
          'profile.linking.errors.tooManyAttempts',
          'Слишком много попыток. Попробуйте позже',
        );
      case 'link_code_identity_conflict':
        return t(
          'profile.linking.errors.identityConflict',
          'Конфликт идентификаторов. Нужна ручная проверка',
        );
      case 'link_code_source_inactive':
      case 'link_code_target_inactive':
        return t('profile.linking.errors.inactiveAccount', 'Один из аккаунтов неактивен');
      case 'manual_merge_required':
        return t(
          'profile.linking.errors.manualRequired',
          'Оба аккаунта содержат данные. Нужна ручная обработка support.',
        );
      case 'support_disabled':
        return t('profile.linking.errors.supportDisabled', 'Тикеты поддержки отключены');
      case 'telegram_relink_requires_unlink':
        return t(
          'profile.linking.errors.telegramRelinkRequiresUnlink',
          'Чтобы привязать другой Telegram, сначала отвяжите текущий Telegram-аккаунт.',
        );
      case 'telegram_relink_cooldown_active':
        return (
          t(
            'profile.linking.errors.telegramRelinkCooldown',
            'Смена Telegram-аккаунта доступна не чаще одного раза в 30 дней.',
          ) +
          (retry_after_seconds
            ? ` ${t('profile.linking.availableAfter', 'Доступно через')}: ${formatDurationShort(retry_after_seconds)}.`
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
      case 'current_auth_provider':
        return t('profile.linking.unlink.reasons.currentProvider');
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
      ? `${t('profile.linking.availableAfter', 'Доступно через')}: ${formatDurationShort(identity.retry_after_seconds)}`
      : '';
    const dateText = identity.blocked_until
      ? `${t('profile.linking.availableAt', 'Доступно в')}: ${formatDateTime(identity.blocked_until)}`
      : '';
    return [reasonText, cooldownText, dateText].filter(Boolean).join('. ');
  };

  const getLocalizedUnlinkError = (err: unknown) => {
    const parsed = parseApiError(err);
    if (parsed.reason) return getUnlinkReasonText(parsed.reason);
    if (parsed.code === 'unlink_otp_resend_cooldown') {
      return t('profile.linking.unlink.errors.otpResendCooldown');
    }
    if (parsed.code === 'unlink_otp_rate_limited') {
      return t('profile.linking.unlink.errors.otpRateLimited');
    }
    if (parsed.code === 'unlink_request_invalid') {
      return t('profile.linking.unlink.errors.requestInvalid');
    }
    if (parsed.code === 'unlink_request_mismatch') {
      return t('profile.linking.unlink.errors.requestMismatch');
    }
    if (parsed.code === 'unlink_request_storage_error') {
      return t('profile.linking.unlink.errors.storageError');
    }
    if (parsed.code === 'unlink_otp_invalid') {
      return t('profile.linking.unlink.errors.otpInvalid');
    }
    if (parsed.code === 'unlink_otp_attempts_exceeded') {
      return t('profile.linking.unlink.errors.otpAttemptsExceeded');
    }
    if (parsed.code === 'unlink_otp_delivery_failed') {
      return t('profile.linking.unlink.errors.otpDeliveryFailed');
    }
    return parsed.message || t('common.error');
  };

  // Build referral link for cabinet
  const referralLink = referralInfo?.referral_code
    ? `${window.location.origin}/login?ref=${referralInfo.referral_code}`
    : '';

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferralLink = () => {
    if (!referralLink) return;
    const shareText = t('referral.shareMessage', {
      percent: referralInfo?.commission_percent || 0,
      botName: branding?.name || import.meta.env.VITE_APP_NAME || 'Cabinet',
    });

    if (navigator.share) {
      navigator
        .share({
          title: t('referral.title'),
          text: shareText,
          url: referralLink,
        })
        .catch(() => {});
      return;
    }

    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  const registerEmailMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.registerEmail(email, password),
    onSuccess: async () => {
      setSuccess(t('profile.emailSent'));
      setError(null);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      const updatedUser = await authApi.getMe();
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      const detail = err.response?.data?.detail;
      if (detail?.includes('already registered')) {
        setError(t('profile.emailAlreadyRegistered'));
      } else if (detail?.includes('already have a verified email')) {
        setError(t('profile.alreadyHaveEmail'));
      } else {
        setError(detail || t('common.error'));
      }
      setSuccess(null);
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: authApi.resendVerification,
    onSuccess: () => {
      setSuccess(t('profile.verificationResent'));
      setError(null);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail || t('common.error'));
      setSuccess(null);
    },
  });

  // Email change mutations
  const requestEmailChangeMutation = useMutation({
    mutationFn: (emailAddr: string) => authApi.requestEmailChange(emailAddr),
    onSuccess: async (data) => {
      setChangeError(null);
      if (data.expires_in_minutes === 0) {
        // Unverified email was replaced directly
        setChangeEmailStep('success');
        const updatedUser = await authApi.getMe();
        setUser(updatedUser);
      } else {
        setChangeEmailStep('code');
        setResendCooldown(UI.RESEND_COOLDOWN_SEC);
      }
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      const detail = err.response?.data?.detail;
      if (detail?.includes('already registered') || detail?.includes('already in use')) {
        setChangeError(t('profile.changeEmail.emailAlreadyUsed'));
      } else if (detail?.includes('same as current')) {
        setChangeError(t('profile.changeEmail.sameEmail'));
      } else if (detail?.includes('rate limit') || detail?.includes('too many')) {
        setChangeError(t('profile.changeEmail.tooManyRequests'));
      } else {
        setChangeError(detail || t('common.error'));
      }
    },
  });

  const verifyEmailChangeMutation = useMutation({
    mutationFn: (verificationCode: string) => authApi.verifyEmailChange(verificationCode),
    onSuccess: async () => {
      setChangeError(null);
      setChangeEmailStep('success');
      const updatedUser = await authApi.getMe();
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      const detail = err.response?.data?.detail;
      if (detail?.includes('invalid') || detail?.includes('wrong')) {
        setChangeError(t('profile.changeEmail.invalidCode'));
      } else if (detail?.includes('expired')) {
        setChangeError(t('profile.changeEmail.codeExpired'));
      } else {
        setChangeError(detail || t('common.error'));
      }
    },
  });

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-focus inputs on step change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (changeEmailStep === 'email') newEmailInputRef.current?.focus();
      else if (changeEmailStep === 'code') codeInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [changeEmailStep]);

  // Auto-close success after 3s
  useEffect(() => {
    if (changeEmailStep !== 'success') return;
    const timer = setTimeout(() => resetChangeEmail(), 3000);
    return () => clearTimeout(timer);
  }, [changeEmailStep]);

  const resetChangeEmail = () => {
    setChangeEmailStep(null);
    setNewEmail('');
    setChangeCode('');
    setChangeError(null);
    setResendCooldown(0);
  };

  const handleSendChangeCode = () => {
    setChangeError(null);
    if (!newEmail.trim()) {
      setChangeError(t('profile.emailRequired'));
      return;
    }
    if (!isValidEmail(newEmail.trim())) {
      setChangeError(t('profile.invalidEmail'));
      return;
    }
    if (user?.email && newEmail.toLowerCase().trim() === user.email.toLowerCase()) {
      setChangeError(t('profile.changeEmail.sameEmail'));
      return;
    }
    requestEmailChangeMutation.mutate(newEmail.trim());
  };

  const handleVerifyChangeCode = () => {
    setChangeError(null);
    if (!changeCode.trim()) {
      setChangeError(t('profile.changeEmail.enterCode'));
      return;
    }
    if (changeCode.trim().length < 4) {
      setChangeError(t('profile.changeEmail.invalidCode'));
      return;
    }
    verifyEmailChangeMutation.mutate(changeCode.trim());
  };

  const handleResendChangeCode = () => {
    if (resendCooldown > 0) return;
    requestEmailChangeMutation.mutate(newEmail.trim());
  };

  const { data: notificationSettings, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: notificationsApi.getSettings,
  });

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
      setLinkSuccess(t('profile.linking.codeGenerated', 'Код привязки создан'));
      setActiveLinkCode(data.code);
      setLinkCode(data.code);
      setLinkPreview(null);
      setPreviewedCode('');
      setLinkFlowStep('idle');
      setManualMergeComment('');
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
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
      setLinkSuccess(t('profile.linking.linked', 'Аккаунты успешно объединены'));
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
      setLinkSuccess(
        t('profile.linking.manualSent', 'Запрос на ручное объединение отправлен. Тикет') +
          ` #${data.ticket_id}`,
      );
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
          ? t(
              'profile.linking.telegramStatus.unlinkCodeSent',
              'Код подтверждения отправлен в Telegram. После отвязки сразу сможете привязать новый Telegram-код.',
            )
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

  const updateNotificationsMutation = useMutation({
    mutationFn: notificationsApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });

  const handleNotificationToggle = (key: keyof NotificationSettings, value: boolean) => {
    const update: NotificationSettingsUpdate = { [key]: value };
    updateNotificationsMutation.mutate(update);
  };

  const handleNotificationValue = (key: keyof NotificationSettings, value: number) => {
    const update: NotificationSettingsUpdate = { [key]: value };
    updateNotificationsMutation.mutate(update);
  };

  const getManualMergeStatusLabel = () => {
    if (!latestManualMerge) return null;
    if (latestManualMerge.decision === 'approve') {
      return t('profile.linking.manualStatus.approved', 'Запрос одобрен');
    }
    if (latestManualMerge.decision === 'reject') {
      return t('profile.linking.manualStatus.rejected', 'Запрос отклонен');
    }
    return t('profile.linking.manualStatus.pending', 'Запрос на рассмотрении');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !isValidEmail(email.trim())) {
      setError(t('profile.invalidEmail', 'Please enter a valid email address'));
      return;
    }

    if (!password || password.length < 8) {
      setError(t('profile.passwordMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('profile.passwordsMismatch'));
      return;
    }

    registerEmailMutation.mutate({ email, password });
  };

  const normalizedLinkCode = linkCode.trim().toUpperCase();
  const hasLinkCode = normalizedLinkCode.length > 0;
  const isCodePreviewed = hasLinkCode && previewedCode === normalizedLinkCode && !!linkPreview;
  const canConfirmLink =
    isCodePreviewed && (linkFlowStep === 'preview' || linkFlowStep === 'warning');

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-bold text-dark-50 sm:text-3xl">{t('profile.title')}</h1>
      </motion.div>

      {/* User Info Card */}
      <motion.div variants={staggerItem}>
        <Card>
          <h2 className="mb-6 text-lg font-semibold text-dark-100">{t('profile.accountInfo')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-dark-800/50 py-3">
              <span className="text-dark-400">{t('profile.telegramId')}</span>
              <span className="font-medium text-dark-100">{user?.telegram_id ?? '-'}</span>
            </div>
            {user?.username && (
              <div className="flex items-center justify-between border-b border-dark-800/50 py-3">
                <span className="text-dark-400">{t('profile.username')}</span>
                <span className="font-medium text-dark-100">@{user.username}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-b border-dark-800/50 py-3">
              <span className="text-dark-400">{t('profile.name')}</span>
              <span className="font-medium text-dark-100">{displayName}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-dark-400">{t('profile.registeredAt')}</span>
              <span className="font-medium text-dark-100">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Account Linking */}
      <motion.div variants={staggerItem}>
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-dark-100">
            {t('profile.linking.title', 'Связанные способы входа')}
          </h2>
          <p className="mb-4 text-sm text-dark-400">
            {t(
              'profile.linking.description',
              'Привяжите Telegram, Yandex и VK к одному аккаунту, чтобы подписка была общей.',
            )}
          </p>

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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-dark-100">
                    {t('profile.linking.telegramStatus.title', 'Статус смены Telegram')}
                  </p>
                  {telegramRelink.requires_unlink_first ? (
                    <p className="mt-1 text-xs text-warning-300">
                      {t(
                        'profile.linking.telegramStatus.requiresUnlink',
                        'Сейчас привязан Telegram. Для смены сначала отвяжите текущий Telegram, затем привяжите новый.',
                      )}
                    </p>
                  ) : telegramRelink.retry_after_seconds ? (
                    <p className="mt-1 text-xs text-warning-300">
                      {t('profile.linking.availableAfter', 'Доступно через')}:{' '}
                      {formatDurationShort(telegramRelink.retry_after_seconds)}{' '}
                      {telegramRelink.cooldown_until
                        ? `(${t('profile.linking.availableAt', 'в')}: ${formatDateTime(telegramRelink.cooldown_until)})`
                        : ''}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-success-400">
                      {t(
                        'profile.linking.telegramStatus.ready',
                        'Смена Telegram доступна. Можно привязать другой Telegram-код.',
                      )}
                    </p>
                  )}
                  {telegramIdentity && (
                    <p className="mt-2 text-xs text-dark-400">
                      {t('profile.linking.telegramStatus.current', 'Текущий Telegram')}:{' '}
                      {'telegram'}: {telegramIdentity.provider_user_id_masked}
                    </p>
                  )}
                </div>
                {telegramRelink.requires_unlink_first && (
                  <Button
                    variant="secondary"
                    onClick={() => requestUnlinkMutation.mutate('telegram')}
                    loading={requestUnlinkMutation.isPending}
                  >
                    {t('profile.linking.telegramStatus.startRelink', 'Сменить Telegram')}
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3 border-t border-dark-800/50 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => createLinkCodeMutation.mutate()}
                loading={createLinkCodeMutation.isPending}
              >
                {t('profile.linking.generateCode', 'Сгенерировать код привязки')}
              </Button>
              {activeLinkCode && (
                <span className="rounded-linear border border-accent-500/40 bg-accent-500/10 px-3 py-2 font-mono text-sm text-accent-300">
                  {activeLinkCode}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
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
                placeholder={t('profile.linking.enterCode', 'Введите код привязки')}
                className="input sm:flex-1"
              />
            </div>

            <div className="rounded-linear border border-dark-700/70 bg-dark-800/40 px-3 py-2 text-xs text-dark-300">
              {linkFlowStep === 'idle' &&
                t('profile.linking.flow.idle', 'Шаг 1: введите код и нажмите "Проверить".')}
              {linkFlowStep === 'preview' &&
                t(
                  'profile.linking.flow.preview',
                  'Шаг 2: код проверен. Проверьте данные аккаунта и нажмите "Привязать".',
                )}
              {linkFlowStep === 'warning' &&
                t(
                  'profile.linking.flow.warning',
                  'Шаг 2: обнаружена смена Telegram. Подтвердите, если согласны заменить текущий Telegram.',
                )}
              {linkFlowStep === 'manual' &&
                t(
                  'profile.linking.flow.manual',
                  'Шаг 2: автоматическое объединение недоступно. Отправьте запрос в поддержку.',
                )}
              {linkFlowStep === 'done' &&
                t(
                  'profile.linking.flow.done',
                  'Операция завершена. Можно создать новый код при необходимости.',
                )}
            </div>

            <div className="sticky bottom-3 z-20 rounded-linear border border-dark-700/80 bg-dark-900/90 p-2 backdrop-blur">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => previewLinkCodeMutation.mutate(normalizedLinkCode)}
                  loading={previewLinkCodeMutation.isPending}
                  disabled={!hasLinkCode}
                >
                  {t('profile.linking.preview', 'Проверить')}
                </Button>
                <Button
                  onClick={() => confirmLinkCodeMutation.mutate(normalizedLinkCode)}
                  loading={confirmLinkCodeMutation.isPending}
                  disabled={!canConfirmLink}
                >
                  {t('profile.linking.confirm', 'Привязать')}
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
                    {t('profile.linking.sendManual', 'Отправить в поддержку')}
                  </Button>
                )}
              </div>
            </div>

            {linkPreview && (
              <div className="rounded-linear border border-dark-700/80 bg-dark-800/60 p-3">
                <p className="mb-2 text-sm text-dark-300">
                  {t('profile.linking.previewSource', 'Будет привязан к аккаунту')} #{' '}
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
                    {t(
                      'profile.linking.telegramReplaceWarning',
                      'Внимание: вы пытаетесь сменить Telegram-аккаунт. После привязки нового Telegram старый Telegram-вход будет потерян.',
                    )}
                  </div>
                )}
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
            {linkFlowStep === 'manual' && (
              <div className="rounded-linear border border-warning-500/30 bg-warning-500/10 p-3">
                <p className="mb-2 text-sm text-warning-300">
                  {t(
                    'profile.linking.manualHint',
                    'Автоматическое объединение невозможно. Отправьте запрос в поддержку для ручного merge.',
                  )}
                </p>
                <textarea
                  value={manualMergeComment}
                  onChange={(e) => setManualMergeComment(e.target.value)}
                  className="input mb-3 min-h-[88px] w-full"
                  placeholder={t(
                    'profile.linking.manualComment',
                    'Опишите, какой аккаунт основной и почему нужно объединение',
                  )}
                  maxLength={1000}
                />
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
                  {t('profile.linking.manualStatus.title', 'Последний спорный merge-запрос')} #
                  {latestManualMerge.ticket_id}
                </div>
                <div className="text-sm text-dark-300">{getManualMergeStatusLabel()}</div>
                {latestManualMerge.resolution_comment && (
                  <div className="mt-2 text-xs text-dark-400">
                    {t('profile.linking.manualStatus.comment', 'Комментарий')}:{' '}
                    {latestManualMerge.resolution_comment}
                  </div>
                )}
                <div className="mt-1 text-xs text-dark-500">
                  {t('profile.linking.manualStatus.updatedAt', 'Обновлено')}{' '}
                  {new Date(latestManualMerge.updated_at).toLocaleString()}
                </div>
                <Link
                  to="/support"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-accent-400 transition-colors hover:text-accent-300"
                >
                  {t('profile.linking.manualStatus.openSupport', 'Открыть поддержку')}
                </Link>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Referral Link Widget */}
      {referralTerms?.is_enabled && referralLink && (
        <motion.div variants={staggerItem}>
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-dark-100">{t('referral.yourLink')}</h2>
              <Link
                to="/referral"
                className="flex items-center gap-1 text-accent-400 transition-colors hover:text-accent-300"
              >
                <span className="text-sm">{t('referral.title')}</span>
                <ArrowRightIcon />
              </Link>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <input type="text" readOnly value={referralLink} className="input w-full text-sm" />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={copyReferralLink}
                  variant={copied ? 'primary' : 'primary'}
                  className={copied ? 'bg-success-500 hover:bg-success-500' : ''}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  <span className="ml-2">
                    {copied ? t('referral.copied') : t('referral.copyLink')}
                  </span>
                </Button>
                <Button onClick={shareReferralLink} variant="secondary">
                  <ShareIcon />
                  <span className="ml-2 hidden sm:inline">{t('referral.shareButton')}</span>
                </Button>
              </div>
            </div>
            <p className="mt-3 text-sm text-dark-500">
              {t('referral.shareHint', { percent: referralInfo?.commission_percent || 0 })}
            </p>
          </Card>
        </motion.div>
      )}

      {/* Email Section - only show when email auth is enabled */}
      {isEmailAuthEnabled && (
        <motion.div variants={staggerItem}>
          <Card>
            <h2 className="mb-6 text-lg font-semibold text-dark-100">{t('profile.emailAuth')}</h2>

            {user?.email ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-dark-800/50 py-3">
                  <span className="text-dark-400">Email</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-dark-100">{user.email}</span>
                    {user.email_verified ? (
                      <span className="badge-success">{t('profile.verified')}</span>
                    ) : (
                      <span className="badge-warning">{t('profile.notVerified')}</span>
                    )}
                  </div>
                </div>

                {!user.email_verified && (
                  <div className="rounded-linear border border-warning-500/30 bg-warning-500/10 p-4">
                    <p className="mb-4 text-sm text-warning-400">
                      {t('profile.verificationRequired')}
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => resendVerificationMutation.mutate()}
                        loading={resendVerificationMutation.isPending}
                      >
                        {t('profile.resendVerification')}
                      </Button>
                      {(user.auth_type === 'telegram' || user.auth_type === 'email') && (
                        <button
                          onClick={() => setChangeEmailStep('email')}
                          className="text-sm text-accent-400 transition-colors hover:text-accent-300"
                        >
                          {t('profile.changeEmail.button')}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {user.email_verified &&
                  (user.auth_type === 'telegram' || user.auth_type === 'email') && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-dark-400">{t('profile.canLoginWithEmail')}</p>
                      <button
                        onClick={() => setChangeEmailStep('email')}
                        className="flex items-center gap-2 text-sm text-accent-400 transition-colors hover:text-accent-300"
                      >
                        <PencilIcon />
                        <span>{t('profile.changeEmail.button')}</span>
                      </button>
                    </div>
                  )}

                {/* Inline email change flow */}
                <AnimatePresence>
                  {changeEmailStep === 'email' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 border-t border-dark-800/50 pt-4">
                        <label className="block text-sm font-medium text-dark-400">
                          {t('profile.changeEmail.newEmail')}
                        </label>
                        <input
                          ref={newEmailInputRef}
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSendChangeCode();
                            }
                          }}
                          placeholder="new@email.com"
                          className="input w-full"
                          autoComplete="email"
                        />
                        {changeError && <p className="text-sm text-error-400">{changeError}</p>}
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={handleSendChangeCode}
                            loading={requestEmailChangeMutation.isPending}
                            disabled={!newEmail.trim()}
                          >
                            {t('profile.changeEmail.sendCode')}
                          </Button>
                          <button
                            onClick={resetChangeEmail}
                            className="text-sm text-dark-400 hover:text-dark-200"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {changeEmailStep === 'code' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 border-t border-dark-800/50 pt-4">
                        <div className="rounded-linear border border-accent-500/30 bg-accent-500/10 p-3">
                          <p className="text-sm text-accent-400">
                            {t('profile.changeEmail.codeSentTo', { email: newEmail })}
                          </p>
                        </div>
                        <label className="block text-sm font-medium text-dark-400">
                          {t('profile.changeEmail.verificationCode')}
                        </label>
                        <input
                          ref={codeInputRef}
                          type="text"
                          inputMode="numeric"
                          value={changeCode}
                          onChange={(e) => setChangeCode(e.target.value.replace(/\D/g, ''))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleVerifyChangeCode();
                            }
                          }}
                          placeholder="000000"
                          maxLength={6}
                          className="input w-full text-center text-2xl tracking-[0.5em]"
                          autoComplete="one-time-code"
                        />
                        {changeError && <p className="text-sm text-error-400">{changeError}</p>}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button
                              onClick={handleVerifyChangeCode}
                              loading={verifyEmailChangeMutation.isPending}
                              disabled={!changeCode.trim()}
                            >
                              {t('profile.changeEmail.verify')}
                            </Button>
                            <button
                              onClick={() => {
                                setChangeEmailStep('email');
                                setChangeCode('');
                                setChangeError(null);
                              }}
                              className="text-sm text-dark-400 hover:text-dark-200"
                            >
                              {t('common.back')}
                            </button>
                          </div>
                          <button
                            onClick={handleResendChangeCode}
                            disabled={resendCooldown > 0 || requestEmailChangeMutation.isPending}
                            className={`text-sm ${resendCooldown > 0 ? 'text-dark-500' : 'text-accent-400 hover:text-accent-300'}`}
                          >
                            {resendCooldown > 0
                              ? t('profile.changeEmail.resendIn', { seconds: resendCooldown })
                              : t('profile.changeEmail.resendCode')}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {changeEmailStep === 'success' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-dark-800/50 pt-4">
                        <div className="flex items-center gap-3 rounded-linear border border-success-500/30 bg-success-500/10 p-4">
                          <CheckIcon />
                          <div>
                            <p className="font-medium text-success-400">
                              {t('profile.changeEmail.success')}
                            </p>
                            <p className="text-sm text-dark-400">{newEmail}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div>
                <p className="mb-6 text-sm text-dark-400">{t('profile.linkEmailDescription')}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">{t('auth.password')}</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('profile.passwordPlaceholder')}
                      className="input"
                    />
                    <p className="mt-2 text-xs text-dark-500">{t('profile.passwordHint')}</p>
                  </div>

                  <div>
                    <label className="label">{t('auth.confirmPassword')}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('profile.confirmPasswordPlaceholder')}
                      className="input"
                    />
                  </div>

                  {error && (
                    <div className="rounded-linear border border-error-500/30 bg-error-500/10 p-4 text-sm text-error-400">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="rounded-linear border border-success-500/30 bg-success-500/10 p-4 text-sm text-success-400">
                      {success}
                    </div>
                  )}

                  <Button type="submit" fullWidth loading={registerEmailMutation.isPending}>
                    {t('profile.linkEmail')}
                  </Button>
                </form>
              </div>
            )}

            {(error || success) && user?.email && (
              <div className="mt-4">
                {error && (
                  <div className="rounded-linear border border-error-500/30 bg-error-500/10 p-4 text-sm text-error-400">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-linear border border-success-500/30 bg-success-500/10 p-4 text-sm text-success-400">
                    {success}
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Notification Settings */}
      <motion.div variants={staggerItem}>
        <Card>
          <button
            onClick={() => setNotificationsExpanded(!notificationsExpanded)}
            className="flex w-full items-center justify-between text-left"
          >
            <h2 className="text-lg font-semibold text-dark-100">
              {t('profile.notifications.title')}
            </h2>
            <ChevronDownIcon
              className={`h-5 w-5 text-dark-400 transition-transform duration-200 ${
                notificationsExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {notificationsExpanded && (
            <div className="mt-6">
              {notificationsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
                </div>
              ) : notificationSettings ? (
                <div className="space-y-6">
                  {/* Subscription Expiry */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-dark-100">
                          {t('profile.notifications.subscriptionExpiry')}
                        </p>
                        <p className="text-sm text-dark-400">
                          {t('profile.notifications.subscriptionExpiryDesc')}
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.subscription_expiry_enabled}
                        onCheckedChange={(checked) =>
                          handleNotificationToggle('subscription_expiry_enabled', checked)
                        }
                      />
                    </div>
                    {notificationSettings.subscription_expiry_enabled && (
                      <div className="flex items-center gap-3 pl-4">
                        <span className="text-sm text-dark-400">
                          {t('profile.notifications.daysBeforeExpiry')}
                        </span>
                        <select
                          value={notificationSettings.subscription_expiry_days}
                          onChange={(e) =>
                            handleNotificationValue(
                              'subscription_expiry_days',
                              Number(e.target.value),
                            )
                          }
                          className="input w-20 py-1"
                        >
                          {[1, 2, 3, 5, 7, 14].map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Traffic Warning */}
                  <div className="space-y-3 border-t border-dark-800/50 pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-dark-100">
                          {t('profile.notifications.trafficWarning')}
                        </p>
                        <p className="text-sm text-dark-400">
                          {t('profile.notifications.trafficWarningDesc')}
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.traffic_warning_enabled}
                        onCheckedChange={(checked) =>
                          handleNotificationToggle('traffic_warning_enabled', checked)
                        }
                      />
                    </div>
                    {notificationSettings.traffic_warning_enabled && (
                      <div className="flex items-center gap-3 pl-4">
                        <span className="text-sm text-dark-400">
                          {t('profile.notifications.atPercent')}
                        </span>
                        <select
                          value={notificationSettings.traffic_warning_percent}
                          onChange={(e) =>
                            handleNotificationValue(
                              'traffic_warning_percent',
                              Number(e.target.value),
                            )
                          }
                          className="input w-20 py-1"
                        >
                          {[50, 70, 80, 90, 95].map((p) => (
                            <option key={p} value={p}>
                              {p}%
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Balance Low */}
                  <div className="space-y-3 border-t border-dark-800/50 pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-dark-100">
                          {t('profile.notifications.balanceLow')}
                        </p>
                        <p className="text-sm text-dark-400">
                          {t('profile.notifications.balanceLowDesc')}
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.balance_low_enabled}
                        onCheckedChange={(checked) =>
                          handleNotificationToggle('balance_low_enabled', checked)
                        }
                      />
                    </div>
                    {notificationSettings.balance_low_enabled && (
                      <div className="flex items-center gap-3 pl-4">
                        <span className="text-sm text-dark-400">
                          {t('profile.notifications.threshold')}
                        </span>
                        <input
                          type="number"
                          value={notificationSettings.balance_low_threshold}
                          onChange={(e) =>
                            handleNotificationValue('balance_low_threshold', Number(e.target.value))
                          }
                          min={0}
                          className="input w-24 py-1"
                        />
                      </div>
                    )}
                  </div>

                  {/* News */}
                  <div className="flex items-center justify-between border-t border-dark-800/50 pt-6">
                    <div>
                      <p className="font-medium text-dark-100">{t('profile.notifications.news')}</p>
                      <p className="text-sm text-dark-400">{t('profile.notifications.newsDesc')}</p>
                    </div>
                    <Switch
                      checked={notificationSettings.news_enabled}
                      onCheckedChange={(checked) =>
                        handleNotificationToggle('news_enabled', checked)
                      }
                    />
                  </div>

                  {/* Promo Offers */}
                  <div className="flex items-center justify-between border-t border-dark-800/50 pt-6">
                    <div>
                      <p className="font-medium text-dark-100">
                        {t('profile.notifications.promoOffers')}
                      </p>
                      <p className="text-sm text-dark-400">
                        {t('profile.notifications.promoOffersDesc')}
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.promo_offers_enabled}
                      onCheckedChange={(checked) =>
                        handleNotificationToggle('promo_offers_enabled', checked)
                      }
                    />
                  </div>
                </div>
              ) : (
                <p className="text-dark-400">{t('profile.notifications.unavailable')}</p>
              )}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
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
