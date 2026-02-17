import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface LoginEmailAuthSectionProps {
  isEmailAuthLoading: boolean;
  isEmailAuthEnabled: boolean;
  showEmailForm: boolean;
  onToggleEmailForm: () => void;
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

export function LoginEmailAuthSection({
  isEmailAuthLoading,
  isEmailAuthEnabled,
  showEmailForm,
  onToggleEmailForm,
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

  if (isEmailAuthLoading || !isEmailAuthEnabled) {
    return null;
  }

  return (
    <>
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-dark-700" />
        <button
          type="button"
          onClick={onToggleEmailForm}
          className="flex items-center gap-1.5 rounded-full border border-dark-700 bg-dark-800/60 px-3.5 py-1.5 text-xs font-medium text-dark-300 transition-all hover:border-dark-600 hover:bg-dark-700 hover:text-dark-200"
        >
          <svg
            className="h-3.5 w-3.5 text-dark-400"
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
          <span>{t('auth.loginWithEmail')}</span>
          <svg
            className={`h-3 w-3 text-dark-400 transition-transform duration-300 ${showEmailForm ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="h-px flex-1 bg-dark-700" />
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          showEmailForm ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
        style={{ transform: 'translateZ(0)' }}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 pb-1 pt-1">
            {showForgotPassword ? (
              forgotPasswordSent ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-success-500/20">
                    <svg
                      className="h-6 w-6 text-success-400"
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
                  <p className="text-sm font-medium text-dark-100">
                    {t('auth.checkEmail', 'Check your email')}
                  </p>
                  <p className="text-xs text-dark-400">
                    {t(
                      'auth.passwordResetSent',
                      'If an account exists with this email, we sent password reset instructions.',
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={onCloseForgotPassword}
                    className="text-sm text-accent-400 transition-colors hover:text-accent-300"
                  >
                    {t('common.back', 'Back')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-center text-sm text-dark-400">
                    {t(
                      'auth.forgotPasswordHint',
                      'Enter your email and we will send you instructions to reset your password.',
                    )}
                  </p>
                  <form onSubmit={onForgotPasswordSubmit} className="space-y-3">
                    <div>
                      <label htmlFor="forgotEmail" className="label">
                        Email
                      </label>
                      <input
                        id="forgotEmail"
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(event) => onForgotPasswordEmailChange(event.target.value)}
                        placeholder="you@example.com"
                        className="input"
                        autoFocus
                      />
                    </div>
                    {forgotPasswordError && (
                      <p className="text-sm text-error-400">{forgotPasswordError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={forgotPasswordLoading}
                      className="btn-primary w-full py-2.5"
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
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={onCloseForgotPassword}
                      className="text-sm text-dark-400 transition-colors hover:text-dark-200"
                    >
                      {t('common.back', 'Back')}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <>
                <div className="flex rounded-lg bg-dark-800 p-1">
                  <button
                    type="button"
                    className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                      authMode === 'login'
                        ? 'bg-accent-500 text-white'
                        : 'text-dark-400 hover:text-dark-200'
                    }`}
                    onClick={() => onAuthModeChange('login')}
                  >
                    {t('auth.login')}
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                      authMode === 'register'
                        ? 'bg-accent-500 text-white'
                        : 'text-dark-400 hover:text-dark-200'
                    }`}
                    onClick={() => onAuthModeChange('register')}
                  >
                    {t('auth.register', 'Register')}
                  </button>
                </div>

                <form className="space-y-3" onSubmit={onEmailSubmit}>
                  {authMode === 'register' && (
                    <div>
                      <label htmlFor="firstName" className="label">
                        {t('auth.firstName', 'First Name')}
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        className="input"
                        placeholder={t('auth.firstNamePlaceholder', 'Your name (optional)')}
                        value={firstName}
                        onChange={(event) => onFirstNameChange(event.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="label">
                      {t('auth.email')}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => onEmailChange(event.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="label">
                      {t('auth.password')}
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      required
                      className="input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => onPasswordChange(event.target.value)}
                    />
                  </div>

                  {authMode === 'register' && (
                    <div>
                      <label htmlFor="confirmPassword" className="label">
                        {t('auth.confirmPassword', 'Confirm Password')}
                      </label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        className="input"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(event) => onConfirmPasswordChange(event.target.value)}
                      />
                    </div>
                  )}

                  <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5">
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        {t('common.loading')}
                      </span>
                    ) : authMode === 'login' ? (
                      t('auth.login')
                    ) : (
                      t('auth.register', 'Register')
                    )}
                  </button>
                </form>

                {authMode === 'register' && (
                  <p className="text-center text-xs text-dark-500">
                    {t(
                      'auth.verificationEmailNotice',
                      'After registration, a verification email will be sent to your address',
                    )}
                  </p>
                )}

                {authMode === 'login' && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={onShowForgotPassword}
                      className="text-sm text-accent-400 transition-colors hover:text-accent-300"
                    >
                      {t('auth.forgotPassword', 'Forgot password?')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
