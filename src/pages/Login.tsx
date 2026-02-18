import LanguageSwitcher from '@/components/LanguageSwitcher';
import {
  LoginBranding,
  LoginCheckEmailCard,
  LoginEmailAuthSection,
  LoginOAuthSection,
  LoginTelegramSection,
  useLoginPage,
} from '@/features/auth/login';

export default function Login() {
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
