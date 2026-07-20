import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import { consumeCampaignSlug, getPendingCampaignSlug } from '@/utils/campaign';
import { tokenStorage } from '@/utils/token';
import { ArrowLeft, CheckCircle2, Clock3, MailCheck, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useShallow } from 'zustand/shallow';

interface LoginCheckEmailCardProps {
  email: string;
  onBackToLogin: () => void;
}

const RESEND_COOLDOWN_SECONDS = 60;

function getCooldownStorageKey(email: string) {
  return `email-verification-resend:${email.trim().toLowerCase()}`;
}

function getInitialDeadline(email: string) {
  const key = getCooldownStorageKey(email);
  const stored = Number(window.sessionStorage.getItem(key));
  if (Number.isFinite(stored) && stored > Date.now()) return stored;

  const deadline = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
  window.sessionStorage.setItem(key, String(deadline));
  return deadline;
}

export function LoginCheckEmailCard({ email, onBackToLogin }: LoginCheckEmailCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const verifyingRef = useRef(false);
  const autoSubmittedCodeRef = useRef('');
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
  const [resendDeadline, setResendDeadline] = useState(() => getInitialDeadline(email));
  const [now, setNow] = useState(Date.now());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const cooldown = Math.max(0, Math.ceil((resendDeadline - now) / 1000));
  const formattedCooldown = useMemo(() => `00:${String(cooldown).padStart(2, '0')}`, [cooldown]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleVerify = useCallback(async () => {
    if (verifyingRef.current || code.length !== 6) return;
    verifyingRef.current = true;
    setIsVerifying(true);
    setVerifyError('');
    setFeedback(null);
    try {
      const response = await authApi.verifyEmail(code, getPendingCampaignSlug(), email);
      consumeCampaignSlug();
      window.sessionStorage.removeItem(getCooldownStorageKey(email));
      tokenStorage.setTokens(response.access_token, response.refresh_token);
      setTokens(response.access_token, response.refresh_token);
      setUser(response.user);
      if (response.campaign_bonus) {
        useAuthStore.setState({ pendingCampaignBonus: response.campaign_bonus });
      }
      void checkAdminStatus();
      navigate('/', { replace: true });
    } catch (error: unknown) {
      const apiError = error as { response?: { status?: number; data?: { detail?: string } } };
      setVerifyError(
        apiError.response?.status === 400
          ? t('auth.invalidVerificationCode', 'The code is invalid or has expired.')
          : apiError.response?.data?.detail || t('common.error', 'Something went wrong.'),
      );
      autoSubmittedCodeRef.current = code;
      window.requestAnimationFrame(() => inputRef.current?.select());
    } finally {
      verifyingRef.current = false;
      setIsVerifying(false);
    }
  }, [checkAdminStatus, code, email, navigate, setTokens, setUser, t]);

  useEffect(() => {
    if (code.length !== 6 || code === autoSubmittedCodeRef.current || isVerifying) return;
    const timer = window.setTimeout(() => void handleVerify(), 180);
    return () => window.clearTimeout(timer);
  }, [code, handleVerify, isVerifying]);

  const handleResend = async () => {
    if (isResending || cooldown > 0) return;
    setIsResending(true);
    setFeedback(null);
    setVerifyError('');
    try {
      await authApi.resendVerificationStandalone(email);
      const deadline = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
      window.sessionStorage.setItem(getCooldownStorageKey(email), String(deadline));
      setNow(Date.now());
      setResendDeadline(deadline);
      setCode('');
      autoSubmittedCodeRef.current = '';
      setFeedback({
        type: 'success',
        message: t('auth.verificationResent', 'Verification email sent again.'),
      });
      window.requestAnimationFrame(() => inputRef.current?.focus());
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
    <div className="relative">
      <button
        type="button"
        onClick={onBackToLogin}
        className="mb-5 flex min-h-9 items-center gap-2 rounded-md px-1 text-sm font-medium text-dark-400 transition-colors hover:text-dark-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('auth.backToLogin', 'Back to login')}
      </button>

      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-success-400/25 bg-success-500/10">
          <MailCheck className="h-6 w-6 text-success-300" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-success-300">
            {t('auth.codeSent', 'Code sent')}
          </p>
          <h2 className="mt-1 text-2xl font-semibold leading-tight text-dark-50">
            {t('auth.checkEmail', 'Check your email')}
          </h2>
          <p className="mt-2 text-sm leading-6 text-dark-400">
            {t('auth.verificationSent', 'We sent a 6-digit verification code to:')}
          </p>
          <p className="mt-1 break-all text-sm font-semibold text-accent-300">{email}</p>
        </div>
      </div>

      <label
        htmlFor="emailVerificationCode"
        className="mb-2 block text-xs font-medium text-dark-300"
      >
        {t('auth.enterVerificationCode', 'Verification code')}
      </label>
      <input
        ref={inputRef}
        id="emailVerificationCode"
        value={code}
        onChange={(event) => {
          const nextCode = event.target.value.replace(/\D/g, '').slice(0, 6);
          setCode(nextCode);
          setVerifyError('');
          if (nextCode !== autoSubmittedCodeRef.current) autoSubmittedCodeRef.current = '';
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') void handleVerify();
        }}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        disabled={isVerifying}
        className={`h-16 w-full rounded-lg border bg-dark-950/35 px-4 text-center font-mono text-3xl font-semibold tracking-[0.38em] text-dark-50 outline-none transition-colors placeholder:text-dark-700 focus:ring-2 disabled:opacity-70 ${
          verifyError
            ? 'border-error-400/60 focus:border-error-400 focus:ring-error-400/15'
            : 'border-dark-700/60 focus:border-accent-400/70 focus:ring-accent-400/15'
        }`}
        placeholder="000000"
        aria-invalid={Boolean(verifyError)}
      />

      <div className="mt-3 min-h-10" aria-live="polite">
        {isVerifying ? (
          <div className="flex items-center gap-2 rounded-lg border border-accent-400/20 bg-accent-500/10 px-3 py-2 text-sm text-accent-200">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-100/30 border-t-accent-100" />
            {t('auth.verifyingCode', 'Verifying...')}
          </div>
        ) : verifyError ? (
          <p
            className="rounded-lg border border-error-500/25 bg-error-500/10 px-3 py-2 text-sm text-error-300"
            role="alert"
          >
            {verifyError}
          </p>
        ) : (
          <p className="flex items-center gap-2 px-1 py-2 text-xs text-dark-500">
            <CheckCircle2 className="h-4 w-4 text-accent-300" aria-hidden="true" />
            {t('auth.autoVerifyHint', 'Verification starts automatically after the sixth digit.')}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => void handleVerify()}
        disabled={isVerifying || code.length !== 6}
        className="btn-primary mt-2 min-h-12 w-full rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isVerifying
          ? t('auth.verifyingCode', 'Verifying...')
          : t('auth.verifyCode', 'Verify and continue')}
      </button>

      <div className="mt-5 border-t border-dark-700/45 pt-4">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm text-dark-400">
            <Clock3 className="h-4 w-4 shrink-0 text-dark-500" aria-hidden="true" />
            {cooldown > 0 ? (
              <span>
                {t('auth.resendAvailableIn', 'Resend available in')}{' '}
                <strong className="tabular-nums text-dark-100">{formattedCooldown}</strong>
              </span>
            ) : (
              <span>{t('auth.codeNotReceived', 'Did not receive the code?')}</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
            className="flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-dark-700/60 bg-white/[0.03] px-3 text-xs font-semibold text-dark-200 transition-colors hover:border-accent-400/45 hover:text-accent-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            {isResending
              ? t('auth.verificationSending', 'Sending...')
              : t('auth.resendVerification', 'Send again')}
          </button>
        </div>
        <p className="mt-2 text-xs leading-5 text-dark-500">
          {t('auth.checkSpamFolder', 'If the email is missing, check the Spam folder.')}
        </p>
      </div>

      {feedback && (
        <p
          className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
            feedback.type === 'success'
              ? 'border-success-500/25 bg-success-500/10 text-success-300'
              : 'border-error-500/25 bg-error-500/10 text-error-300'
          }`}
          aria-live="polite"
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
