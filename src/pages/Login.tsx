import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Send, UserRoundPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import PageLoader from '@/components/common/PageLoader';
import {
  LoginAccessChooser,
  LoginCheckEmailCard,
  LoginEmailAuthSection,
  LoginTelegramSection,
  useLoginPage,
} from '@/features/auth/login';
import { UltimaAuthBrandMark } from '@/features/auth/shared/UltimaAuthBrandMark';
import { useUltimaMode } from '@/hooks/useUltimaMode';
import { useAuthStore } from '@/store/auth';

type AccessView = 'methods' | 'email' | 'telegram';

const getViewTransition = (reducedMotion: boolean | null) => ({
  initial: reducedMotion ? { opacity: 0 } : { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0 },
  exit: reducedMotion ? { opacity: 0 } : { opacity: 0, x: -14 },
  transition: { duration: reducedMotion ? 0.12 : 0.24, ease: [0.22, 1, 0.36, 1] as const },
});

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { isUltimaMode, isUltimaModeReady } = useUltimaMode();
  const {
    safeTop,
    safeBottom,
    branding,
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
    handleBackToLogin,
    handleRetryTelegramAuth,
    handleOAuthLogin,
    handleForgotPassword,
    closeForgotPasswordModal,
    handleEmailSubmit,
    handleShowForgotPassword,
    clearAuthError,
  } = useLoginPage();
  const [accessView, setAccessView] = useState<AccessView>(() =>
    referralCode ? 'email' : 'methods',
  );

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!isUltimaModeReady) {
    return <PageLoader variant="ultima" />;
  }

  const normalizedBotUsername = botUsername.replace(/^@+/, '').trim();
  const canUseTelegram = isTelegramWebApp || Boolean(normalizedBotUsername);
  const activeView: AccessView = isTelegramWebApp ? 'telegram' : accessView;
  const hasCustomLogo = Boolean(branding?.has_custom_logo && logoUrl);
  const viewTransition = getViewTransition(reduceMotion);

  const openView = (view: AccessView, mode?: 'login' | 'register') => {
    clearAuthError();
    closeForgotPasswordModal();
    if (mode) setAuthMode(mode);
    setAccessView(view);
  };

  const goBack = () => {
    clearAuthError();
    if (showForgotPassword) {
      closeForgotPasswordModal();
      return;
    }
    setAccessView('methods');
  };

  const changeAuthMode = (mode: 'login' | 'register') => {
    clearAuthError();
    closeForgotPasswordModal();
    setAuthMode(mode);
  };

  const safeAreaStyle = {
    paddingTop: safeTop > 0 ? `${safeTop + 12}px` : 'calc(12px + env(safe-area-inset-top, 0px))',
    paddingBottom:
      safeBottom > 0 ? `${safeBottom + 12}px` : 'calc(12px + env(safe-area-inset-bottom, 0px))',
  };

  const renderActiveView = () => {
    if (registeredEmail) {
      return (
        <motion.div key="check-email" {...viewTransition}>
          <LoginCheckEmailCard email={registeredEmail} onBackToLogin={handleBackToLogin} />
        </motion.div>
      );
    }

    if (activeView === 'email') {
      return (
        <motion.div key={`email-${authMode}-${showForgotPassword}`} {...viewTransition}>
          <LoginEmailAuthSection
            isEmailAuthLoading={isEmailAuthLoading}
            isEmailAuthEnabled={isEmailAuthEnabled}
            showForgotPassword={showForgotPassword}
            forgotPasswordSent={forgotPasswordSent}
            forgotPasswordEmail={forgotPasswordEmail}
            onForgotPasswordEmailChange={setForgotPasswordEmail}
            forgotPasswordError={forgotPasswordError}
            forgotPasswordLoading={forgotPasswordLoading}
            onForgotPasswordSubmit={handleForgotPassword}
            onCloseForgotPassword={closeForgotPasswordModal}
            authMode={authMode}
            onAuthModeChange={changeAuthMode}
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
            showModeTabs={false}
          />
        </motion.div>
      );
    }

    if (activeView === 'telegram') {
      return (
        <motion.div key="telegram" {...viewTransition}>
          <header className="auth-view-heading auth-view-heading--telegram">
            <span className="auth-view-icon" aria-hidden="true">
              <Send />
            </span>
            <div>
              <span className="auth-view-kicker">Telegram</span>
              <h1>{t('auth.loginWithTelegram', 'Sign in with Telegram')}</h1>
              <p>{t('auth.telegramPanelHint', 'Confirm sign-in in Telegram to continue.')}</p>
            </div>
          </header>
          <LoginTelegramSection
            isLoading={isLoading}
            isTelegramWebApp={isTelegramWebApp}
            hasError={Boolean(error)}
            botUsername={botUsername}
            referralCode={referralCode || undefined}
            onRetryTelegramAuth={handleRetryTelegramAuth}
          />
        </motion.div>
      );
    }

    return (
      <motion.div key="methods" {...viewTransition}>
        <LoginAccessChooser
          isEmailAuthLoading={isEmailAuthLoading}
          isEmailAuthEnabled={isEmailAuthEnabled}
          canUseTelegram={canUseTelegram}
          isOAuthProvidersLoading={isOAuthProvidersLoading}
          oauthProviders={oauthProviders}
          oauthLoading={oauthLoading}
          onEmailLogin={() => openView('email', 'login')}
          onEmailRegister={() => openView('email', 'register')}
          onTelegramLogin={() => openView('telegram')}
          onOAuthLogin={handleOAuthLogin}
          onOpenSupport={() => navigate('/support/guest')}
        />
      </motion.div>
    );
  };

  return (
    <div
      className={`auth-portal ${isUltimaMode ? 'auth-portal--ultima ultima-login' : 'auth-portal--standard'}`}
      style={safeAreaStyle}
    >
      <div className="auth-portal-backdrop" aria-hidden="true">
        {isUltimaMode && <div className="ultima-shell-aura" />}
        <div className="auth-portal-grid" />
      </div>

      <div
        className="auth-language-switcher"
        style={{
          top: safeTop > 0 ? `${safeTop + 12}px` : 'calc(12px + env(safe-area-inset-top, 0px))',
        }}
      >
        <LanguageSwitcher />
      </div>

      <motion.main
        className="auth-portal-frame"
        initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <section className="auth-brand-panel" aria-label={t('auth.portalWelcome', 'Welcome')}>
          <div className="auth-brand-scene" aria-hidden="true">
            <span className="auth-brand-orbit auth-brand-orbit--outer" />
            <span className="auth-brand-orbit auth-brand-orbit--middle" />
            <span className="auth-brand-orbit auth-brand-orbit--inner" />
            <span className="auth-brand-scan" />
          </div>

          <div className="auth-brand-content">
            <UltimaAuthBrandMark
              appName={appName}
              logoUrl={logoUrl}
              showBrandLogo={hasCustomLogo}
              variant="hero"
              className="auth-brand-logo"
            />
            <div className="auth-brand-copy">
              <span>{t('auth.portalEyebrow', 'Personal account')}</span>
              <h2>{t('auth.portalWelcome', 'Welcome')}</h2>
              <p>{t('auth.portalSubtitle', 'Everything you need is available after sign-in.')}</p>
            </div>
          </div>

          {referralCode && isEmailAuthEnabled && (
            <div className="auth-referral-note">
              <UserRoundPlus aria-hidden="true" />
              <span>{t('auth.referralInvite')}</span>
            </div>
          )}

          <div className="auth-brand-footnote">
            <span className="auth-brand-status-dot" />
            <span>
              {t('auth.secureLoginHint', 'Secure sign-in with email, Telegram or OAuth.')}
            </span>
          </div>
        </section>

        <motion.section className="auth-portal-card" layout={!reduceMotion}>
          {!registeredEmail && activeView !== 'methods' && !isTelegramWebApp && (
            <button type="button" className="auth-back-button" onClick={goBack}>
              <ArrowLeft aria-hidden="true" />
              <span>{t('auth.allLoginMethods', 'All sign-in methods')}</span>
            </button>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {error && (
              <motion.div
                key={error}
                className="auth-error-message"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="alert"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            {renderActiveView()}
          </AnimatePresence>
        </motion.section>
      </motion.main>
    </div>
  );
}
