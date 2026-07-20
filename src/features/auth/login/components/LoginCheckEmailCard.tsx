import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import { consumeCampaignSlug, getPendingCampaignSlug } from '@/utils/campaign';
import { tokenStorage } from '@/utils/token';
import { KeyRound, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useShallow } from 'zustand/shallow';

interface LoginCheckEmailCardProps {
  email: string;
  onBackToLogin: () => void;
}

export function LoginCheckEmailCard({ email, onBackToLogin }: LoginCheckEmailCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTokens, setUser, checkAdminStatus } = useAuthStore(
    useShallow((state) => ({
      setTokens: state.setTokens,
      setUser: state.setUser,
      checkAdminStatus: state.checkAdminStatus,
    })),
  );
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    if (isVerifying || code.length !== 6) return;
    setIsVerifying(true);
    setVerifyError('');
    try {
      const response = await authApi.verifyEmail(code, getPendingCampaignSlug(), email);
      consumeCampaignSlug();
      tokenStorage.setTokens(response.access_token, response.refresh_token);
      setTokens(response.access_token, response.refresh_token);
      setUser(response.user);
      if (response.campaign_bonus) {
        useAuthStore.setState({ pendingCampaignBonus: response.campaign_bonus });
      }
      checkAdminStatus();
      navigate('/', { replace: true });
    } catch (error: unknown) {
      const apiError = error as { response?: { status?: number; data?: { detail?: string } } };
      setVerifyError(
        apiError.response?.status === 400
          ? t('auth.invalidVerificationCode', 'The code is invalid or has expired.')
          : apiError.response?.data?.detail || t('common.error', 'Something went wrong.'),
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending || cooldown > 0) return;
    setIsResending(true);
    setFeedback(null);
    try {
      await authApi.resendVerificationStandalone(email);
      setCooldown(60);
      setFeedback({
        type: 'success',
        message: t('auth.verificationResent', 'Verification email sent again.'),
      });
    } catch {
      setFeedback({
        type: 'error',
        message: t(
          'auth.verificationResendFailed',
          'Could not send the email. Please try again later.',
        ),
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="card text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success-500/20">
        <svg
          className="h-7 w-7 text-success-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          />
        </svg>
      </div>
      <h2 className="mb-2 text-lg font-bold text-dark-50">
        {t('auth.checkEmail', 'Check your email')}
      </h2>
      <p className="mb-3 text-sm text-dark-400">
        {t('auth.verificationSent', 'We sent a 6-digit verification code to:')}
      </p>
      <p className="mb-4 break-all text-sm font-medium text-accent-400">{email}</p>
      <div className="mb-3 rounded-lg border border-dark-700 bg-dark-900/60 p-3 text-left">
        <label htmlFor="emailVerificationCode" className="mb-2 block text-xs text-dark-400">
          {t('auth.enterVerificationCode', 'Verification code')}
        </label>
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 shrink-0 text-accent-400" aria-hidden="true" />
          <input
            id="emailVerificationCode"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleVerify();
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            className="input min-w-0 flex-1 text-center font-mono text-xl tracking-[0.3em]"
            placeholder="000000"
            aria-invalid={Boolean(verifyError)}
          />
        </div>
      </div>
      {verifyError && (
        <p className="mb-3 text-xs text-error-400" role="alert">
          {verifyError}
        </p>
      )}
      <button
        type="button"
        onClick={() => void handleVerify()}
        disabled={isVerifying || code.length !== 6}
        className="btn-primary mb-3 w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isVerifying
          ? t('auth.verifyingCode', 'Verifying...')
          : t('auth.verifyCode', 'Verify and continue')}
      </button>
      <p className="mb-5 text-xs text-dark-500">
        {t('auth.checkSpamFolder', 'If the email is missing, check the Spam folder.')}
      </p>
      {feedback && (
        <p
          className={`mb-3 rounded-lg border px-3 py-2 text-xs ${
            feedback.type === 'success'
              ? 'border-success-500/30 bg-success-500/10 text-success-400'
              : 'border-error-500/30 bg-error-500/10 text-error-400'
          }`}
          aria-live="polite"
        >
          {feedback.message}
        </p>
      )}
      <button
        type="button"
        onClick={handleResend}
        disabled={isResending || cooldown > 0}
        className="btn-primary mb-2 flex min-h-11 w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} aria-hidden="true" />
        <span>
          {isResending
            ? t('auth.verificationSending', 'Sending...')
            : cooldown > 0
              ? t('auth.resendIn', 'Resend in {{seconds}} sec.', { seconds: cooldown })
              : t('auth.resendVerification', 'Send again')}
        </span>
      </button>
      <button type="button" onClick={onBackToLogin} className="btn-secondary w-full">
        {t('auth.backToLogin', 'Back to login')}
      </button>
    </div>
  );
}
