import LanguageSwitcher from '@/components/LanguageSwitcher';
import PageLoader from '@/components/common/PageLoader';
import { useTranslation } from 'react-i18next';
import { useUltimaMode } from '@/hooks/useUltimaMode';
import {
  LoginBranding,
  LoginCheckEmailCard,
  LoginEmailAuthSection,
  LoginOAuthSection,
  LoginTelegramSection,
  useLoginPage,
} from '@/features/auth/login';

function UltimaLogoShield() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="h-12 w-12 text-white">
      <path
        d="M32 6.5c7 6 15.8 9 24 9v17.2c0 13.8-9.5 22.4-24 24.8-14.5-2.4-24-11-24-24.8V15.5c8.2 0 17-3 24-9Z"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <path
        d="m22.5 33 6.2 6.2L42 25.8"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Login() {
  const { t } = useTranslation();
  const { isUltimaMode, isUltimaModeReady } = useUltimaMode();
  const {
    safeTop,
    safeBottom,
    branding,
    logoShape,
    logoLoaded,
    appLogo,
    appName,
    logoUrl,
    referralCode,
    isEmailAuthEnabled,
    registeredEmail,
    error,
    isLoading,
    isTelegramWebApp,
    botUsername,
    isOAuthProvidersLoading,
    oauthProviders,
    oauthLoading,
    isEmailAuthLoading,
    showEmailForm,
    showForgotPassword,
    forgotPasswordSent,
    forgotPasswordEmail,
    forgotPasswordError,
    forgotPasswordLoading,
    authMode,
    firstName,
    email,
    password,
    confirmPassword,
    setForgotPasswordEmail,
    setAuthMode,
    setFirstName,
    setEmail,
    setPassword,
    setConfirmPassword,
    handleLogoLoad,
    handleBackToLogin,
    handleRetryTelegramAuth,
    handleOAuthLogin,
    handleToggleEmailForm,
    handleForgotPassword,
    closeForgotPasswordModal,
    handleEmailSubmit,
    handleShowForgotPassword,
  } = useLoginPage();

  if (!isUltimaModeReady) {
    return <PageLoader variant="ultima" />;
  }

  if (isUltimaMode) {
    return (
      <div
        className="relative min-h-[100dvh] overflow-hidden"
        style={{
          background:
            'linear-gradient(160deg, color-mix(in srgb, var(--ultima-color-bg-top) 28%, transparent) 0%, color-mix(in srgb, var(--ultima-color-bg-bottom) 40%, #000000) 100%)',
          paddingTop:
            safeTop > 0 ? `${safeTop + 16}px` : 'calc(1rem + env(safe-area-inset-top, 0px))',
          paddingBottom:
            safeBottom > 0
              ? `${safeBottom + 16}px`
              : 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="ultima-shell-aura" />
        {[0, 2.8, 5.6].map((delay) => (
          <div
            key={delay}
            className="ultima-ring-wave absolute left-1/2 top-[36%] h-[150vmax] w-[150vmax] -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}

        <div
          className="fixed right-3 z-50"
          style={{
            top: safeTop > 0 ? `${safeTop + 12}px` : 'calc(12px + env(safe-area-inset-top, 0px))',
          }}
        >
          <LanguageSwitcher />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-md flex-col px-4">
          <header className="mb-4 flex flex-col items-center pt-8 text-center">
            <div
              className="mb-3 flex h-20 w-20 items-center justify-center rounded-[28px] border"
              style={{
                borderColor:
                  'color-mix(in srgb, var(--ultima-color-surface-border) 28%, transparent)',
                background: 'color-mix(in srgb, var(--ultima-color-primary) 16%, transparent)',
              }}
            >
              <UltimaLogoShield />
            </div>
            <h1 className="text-[34px] font-semibold leading-none tracking-[-0.01em] text-white">
              {appName}
            </h1>
            <p className="text-white/62 mt-2 text-[14px]">
              {t('auth.loginToAccount', { defaultValue: 'Войдите в аккаунт для продолжения' })}
            </p>
          </header>

          {registeredEmail ? (
            <div
              className="rounded-[28px] border p-4 backdrop-blur-md"
              style={{
                borderColor:
                  'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
                background: 'color-mix(in srgb, var(--ultima-color-surface) 44%, transparent)',
              }}
            >
              <LoginCheckEmailCard email={registeredEmail} onBackToLogin={handleBackToLogin} />
            </div>
          ) : (
            <div
              className="rounded-[28px] border p-4 backdrop-blur-md"
              style={{
                borderColor:
                  'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
                background: 'color-mix(in srgb, var(--ultima-color-surface) 44%, transparent)',
              }}
            >
              {error && (
                <div className="bg-rose-500/12 mb-4 rounded-xl border border-rose-300/35 px-4 py-2.5 text-sm text-rose-100">
                  {error}
                </div>
              )}

              <div
                className="rounded-2xl border p-3"
                style={{
                  borderColor:
                    'color-mix(in srgb, var(--ultima-color-surface-border) 20%, transparent)',
                  background: 'color-mix(in srgb, var(--ultima-color-surface) 34%, transparent)',
                }}
              >
                <LoginTelegramSection
                  isLoading={isLoading}
                  isTelegramWebApp={isTelegramWebApp}
                  hasError={Boolean(error)}
                  botUsername={botUsername}
                  referralCode={referralCode || undefined}
                  onRetryTelegramAuth={handleRetryTelegramAuth}
                />
              </div>

              <div
                className="mt-3 rounded-2xl border p-3"
                style={{
                  borderColor:
                    'color-mix(in srgb, var(--ultima-color-surface-border) 20%, transparent)',
                  background: 'color-mix(in srgb, var(--ultima-color-surface) 34%, transparent)',
                }}
              >
                <LoginOAuthSection
                  isLoading={isOAuthProvidersLoading}
                  providers={oauthProviders}
                  oauthLoading={oauthLoading}
                  onOAuthLogin={handleOAuthLogin}
                />
              </div>

              <div
                className="mt-3 rounded-2xl border p-3"
                style={{
                  borderColor:
                    'color-mix(in srgb, var(--ultima-color-surface-border) 20%, transparent)',
                  background: 'color-mix(in srgb, var(--ultima-color-surface) 34%, transparent)',
                }}
              >
                <LoginEmailAuthSection
                  isEmailAuthLoading={isEmailAuthLoading}
                  isEmailAuthEnabled={isEmailAuthEnabled}
                  showEmailForm={showEmailForm}
                  onToggleEmailForm={handleToggleEmailForm}
                  showForgotPassword={showForgotPassword}
                  forgotPasswordSent={forgotPasswordSent}
                  forgotPasswordEmail={forgotPasswordEmail}
                  onForgotPasswordEmailChange={setForgotPasswordEmail}
                  forgotPasswordError={forgotPasswordError}
                  forgotPasswordLoading={forgotPasswordLoading}
                  onForgotPasswordSubmit={handleForgotPassword}
                  onCloseForgotPassword={closeForgotPasswordModal}
                  authMode={authMode}
                  onAuthModeChange={setAuthMode}
                  onEmailSubmit={handleEmailSubmit}
                  firstName={firstName}
                  onFirstNameChange={setFirstName}
                  email={email}
                  onEmailChange={setEmail}
                  password={password}
                  onPasswordChange={setPassword}
                  confirmPassword={confirmPassword}
                  onConfirmPasswordChange={setConfirmPassword}
                  isLoading={isLoading}
                  onShowForgotPassword={handleShowForgotPassword}
                />
              </div>
            </div>
          )}

          <p className="mt-4 text-center text-[11px] text-white/45">
            {t('auth.secureLoginHint', {
              defaultValue: 'Безопасный вход через Telegram, OAuth или email.',
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center px-4 sm:px-6 lg:px-8"
      style={{
        paddingTop:
          safeTop > 0 ? `${safeTop + 16}px` : 'calc(1rem + env(safe-area-inset-top, 0px))',
        paddingBottom:
          safeBottom > 0 ? `${safeBottom + 16}px` : 'calc(1rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-500/10 via-transparent to-transparent" />

      <div
        className="fixed right-3 z-50"
        style={{
          top: safeTop > 0 ? `${safeTop + 12}px` : 'calc(12px + env(safe-area-inset-top, 0px))',
        }}
      >
        <LanguageSwitcher />
      </div>

      <div className="relative w-full max-w-md space-y-5">
        <LoginBranding
          branding={branding}
          logoShape={logoShape}
          logoLoaded={logoLoaded}
          appLogo={appLogo}
          appName={appName}
          logoUrl={logoUrl}
          onLogoLoad={handleLogoLoad}
          referralCode={referralCode}
          isEmailAuthEnabled={isEmailAuthEnabled}
        />

        {registeredEmail ? (
          <LoginCheckEmailCard email={registeredEmail} onBackToLogin={handleBackToLogin} />
        ) : (
          <div className="card">
            {error && (
              <div className="mb-4 rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-2.5 text-sm text-error-400">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <LoginTelegramSection
                isLoading={isLoading}
                isTelegramWebApp={isTelegramWebApp}
                hasError={Boolean(error)}
                botUsername={botUsername}
                referralCode={referralCode || undefined}
                onRetryTelegramAuth={handleRetryTelegramAuth}
              />
            </div>

            <LoginOAuthSection
              isLoading={isOAuthProvidersLoading}
              providers={oauthProviders}
              oauthLoading={oauthLoading}
              onOAuthLogin={handleOAuthLogin}
            />

            <LoginEmailAuthSection
              isEmailAuthLoading={isEmailAuthLoading}
              isEmailAuthEnabled={isEmailAuthEnabled}
              showEmailForm={showEmailForm}
              onToggleEmailForm={handleToggleEmailForm}
              showForgotPassword={showForgotPassword}
              forgotPasswordSent={forgotPasswordSent}
              forgotPasswordEmail={forgotPasswordEmail}
              onForgotPasswordEmailChange={setForgotPasswordEmail}
              forgotPasswordError={forgotPasswordError}
              forgotPasswordLoading={forgotPasswordLoading}
              onForgotPasswordSubmit={handleForgotPassword}
              onCloseForgotPassword={closeForgotPasswordModal}
              authMode={authMode}
              onAuthModeChange={setAuthMode}
              onEmailSubmit={handleEmailSubmit}
              firstName={firstName}
              onFirstNameChange={setFirstName}
              email={email}
              onEmailChange={setEmail}
              password={password}
              onPasswordChange={setPassword}
              confirmPassword={confirmPassword}
              onConfirmPasswordChange={setConfirmPassword}
              isLoading={isLoading}
              onShowForgotPassword={handleShowForgotPassword}
            />
          </div>
        )}
      </div>
    </div>
  );
}
