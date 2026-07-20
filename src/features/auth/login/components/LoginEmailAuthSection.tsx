import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface LoginEmailAuthSectionProps {
  isEmailAuthLoading: boolean;
  isEmailAuthEnabled: boolean;
  showForgotPassword: boolean;
  forgotPasswordSent: boolean;
  forgotPasswordEmail: string;
  onForgotPasswordEmailChange: (value: string) => void;
  forgotPasswordError: string;
  forgotPasswordLoading: boolean;
  onForgotPasswordSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCloseForgotPassword: () => void;
  authMode: 'login' | 'register';
  onAuthModeChange: (mode: 'login' | 'register') => void;
  onEmailSubmit: (event: FormEvent<HTMLFormElement>) => void;
  firstName: string;
  onFirstNameChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  isLoading: boolean;
  onShowForgotPassword: () => void;
}

const fieldClassName =
  'h-12 w-full rounded-lg border border-dark-700/60 bg-dark-950/35 pl-11 pr-11 text-sm text-dark-50 outline-none transition-colors placeholder:text-dark-500 focus:border-accent-400/70 focus:bg-dark-900/65 focus:ring-2 focus:ring-accent-400/15';

export function LoginEmailAuthSection({
  isEmailAuthLoading,
  isEmailAuthEnabled,
  showForgotPassword,
  forgotPasswordSent,
  forgotPasswordEmail,
  onForgotPasswordEmailChange,
  forgotPasswordError,
  forgotPasswordLoading,
  onForgotPasswordSubmit,
  onCloseForgotPassword,
  authMode,
  onAuthModeChange,
  onEmailSubmit,
  firstName,
  onFirstNameChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  isLoading,
  onShowForgotPassword,
}: LoginEmailAuthSectionProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isRegister = authMode === 'register';
  const hasValidPassword = password.length >= 8;
  const passwordsMatch = Boolean(confirmPassword) && password === confirmPassword;

  if (isEmailAuthLoading) {
    return (
      <div className="space-y-4" aria-label={t('common.loading')}>
        <div className="h-11 animate-pulse rounded-lg bg-white/[0.06]" />
        <div className="h-20 animate-pulse rounded-lg bg-white/[0.04]" />
        <div className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />
        <div className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />
      </div>
    );
  }

  if (!isEmailAuthEnabled) return null;

  if (showForgotPassword) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={onCloseForgotPassword}
          className="text-sm font-medium text-dark-400 transition-colors hover:text-dark-100"
        >
          {t('common.back', 'Back')}
        </button>

        {forgotPasswordSent ? (
          <div className="py-5 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-success-400/25 bg-success-500/10">
              <Mail className="h-6 w-6 text-success-300" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold text-dark-50">
              {t('auth.checkEmail', 'Check your email')}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-dark-400">
              {t(
                'auth.passwordResetSent',
                'If an account exists with this email, we sent password reset instructions.',
              )}
            </p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs font-semibold uppercase text-accent-300">
                {t('auth.accountRecovery', 'Account recovery')}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-dark-50">
                {t('auth.resetPassword', 'Reset password')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-dark-400">
                {t(
                  'auth.forgotPasswordHint',
                  'Enter your email and we will send you instructions to reset your password.',
                )}
              </p>
            </div>
            <form onSubmit={onForgotPasswordSubmit} className="space-y-4">
              <label className="block" htmlFor="forgotEmail">
                <span className="mb-2 block text-xs font-medium text-dark-300">
                  {t('auth.email')}
                </span>
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500" />
                  <input
                    id="forgotEmail"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(event) => onForgotPasswordEmailChange(event.target.value)}
                    placeholder="you@example.com"
                    className={fieldClassName}
                    autoComplete="email"
                    autoFocus
                  />
                </span>
              </label>
              {forgotPasswordError && (
                <p className="rounded-lg border border-error-500/25 bg-error-500/10 px-3 py-2 text-sm text-error-300">
                  {forgotPasswordError}
                </p>
              )}
              <button
                type="submit"
                disabled={forgotPasswordLoading}
                className="btn-primary min-h-12 w-full rounded-lg"
              >
                {forgotPasswordLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t('common.loading')}
                  </span>
                ) : (
                  t('auth.sendResetLink', 'Send reset link')
                )}
              </button>
            </form>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-dark-700/45 bg-dark-950/35 p-1"
        role="tablist"
        aria-label={t('auth.accountAccess', 'Account access')}
      >
        {(['login', 'register'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={authMode === mode}
            onClick={() => onAuthModeChange(mode)}
            className={`min-h-10 rounded-md px-3 text-sm font-semibold transition-colors ${
              authMode === mode
                ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/15'
                : 'text-dark-400 hover:bg-white/[0.04] hover:text-dark-100'
            }`}
          >
            {mode === 'login' ? t('auth.login') : t('auth.register', 'Register')}
          </button>
        ))}
      </div>

      <div className="mb-5">
        <p className="text-xs font-semibold uppercase text-accent-300">
          {isRegister
            ? t('auth.newAccount', 'New account')
            : t('auth.secureAccess', 'Secure access')}
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-dark-50 sm:text-[28px]">
          {isRegister
            ? t('auth.createAccount', 'Create an account')
            : t('auth.loginTitle', 'Sign in to your account')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-dark-400">
          {isRegister
            ? t('auth.registerSubtitle', 'Enter your details and confirm your email with a code.')
            : t('auth.loginSubtitle', 'Sign in with your email and password.')}
        </p>
      </div>

      <form className="space-y-4" onSubmit={onEmailSubmit}>
        {isRegister && (
          <label className="block" htmlFor="firstName">
            <span className="mb-2 flex items-center justify-between text-xs font-medium text-dark-300">
              <span>{t('auth.firstName', 'First name')}</span>
              <span className="font-normal text-dark-500">{t('auth.optional', 'Optional')}</span>
            </span>
            <span className="relative block">
              <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500" />
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                className={fieldClassName}
                placeholder={t('auth.firstNamePlaceholder', 'Your name')}
                value={firstName}
                onChange={(event) => onFirstNameChange(event.target.value)}
              />
            </span>
          </label>
        )}

        <label className="block" htmlFor="email">
          <span className="mb-2 block text-xs font-medium text-dark-300">{t('auth.email')}</span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={fieldClassName}
              placeholder="you@example.com"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
            />
          </span>
        </label>

        <label className="block" htmlFor="password">
          <span className="mb-2 block text-xs font-medium text-dark-300">{t('auth.password')}</span>
          <span className="relative block">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
              className={fieldClassName}
              placeholder="••••••••"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-dark-500 transition-colors hover:bg-white/[0.06] hover:text-dark-200"
              aria-label={
                showPassword
                  ? t('auth.hidePassword', 'Hide password')
                  : t('auth.showPassword', 'Show password')
              }
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>

        {isRegister && (
          <>
            <label className="block" htmlFor="confirmPassword">
              <span className="mb-2 block text-xs font-medium text-dark-300">
                {t('auth.confirmPassword', 'Confirm password')}
              </span>
              <span className="relative block">
                <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={fieldClassName}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) => onConfirmPasswordChange(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-dark-500 transition-colors hover:bg-white/[0.06] hover:text-dark-200"
                  aria-label={
                    showConfirmPassword
                      ? t('auth.hidePassword', 'Hide password')
                      : t('auth.showPassword', 'Show password')
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div
                className={`flex items-center gap-2 ${hasValidPassword ? 'text-success-300' : 'text-dark-500'}`}
              >
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>{t('auth.passwordRequirement', 'At least 8 characters')}</span>
              </div>
              <div
                className={`flex items-center gap-2 ${passwordsMatch ? 'text-success-300' : 'text-dark-500'}`}
              >
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>{t('auth.passwordsMatch', 'Passwords match')}</span>
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary min-h-12 w-full rounded-lg text-sm font-semibold"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {isRegister ? t('auth.creatingAccount', 'Creating account...') : t('common.loading')}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {isRegister ? t('auth.createAccount', 'Create an account') : t('auth.login')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </button>
      </form>

      <div className="mt-4 flex min-h-8 items-center justify-center">
        {isRegister ? (
          <div className="flex items-center gap-2 text-center text-xs text-dark-500">
            <ShieldCheck className="h-4 w-4 shrink-0 text-accent-300" />
            <span>
              {t(
                'auth.verificationEmailNotice',
                'A 6-digit verification code will be sent to your email.',
              )}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onShowForgotPassword}
            className="text-sm font-medium text-accent-300 transition-colors hover:text-accent-200"
          >
            {t('auth.forgotPassword', 'Forgot password?')}
          </button>
        )}
      </div>
    </div>
  );
}
