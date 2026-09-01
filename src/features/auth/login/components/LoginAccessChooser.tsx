import { ArrowRight, Mail, MessageCircleMore, Send, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { OAuthProvider } from '@/types';
import { LoginOAuthSection } from './LoginOAuthSection';

interface LoginAccessChooserProps {
  isEmailAuthLoading: boolean;
  isEmailAuthEnabled: boolean;
  canUseTelegram: boolean;
  isOAuthProvidersLoading: boolean;
  oauthProviders: OAuthProvider[];
  oauthLoading: string | null;
  onEmailLogin: () => void;
  onEmailRegister: () => void;
  onTelegramLogin: () => void;
  onOAuthLogin: (provider: string) => void;
  onOpenSupport: () => void;
}

export function LoginAccessChooser({
  isEmailAuthLoading,
  isEmailAuthEnabled,
  canUseTelegram,
  isOAuthProvidersLoading,
  oauthProviders,
  oauthLoading,
  onEmailLogin,
  onEmailRegister,
  onTelegramLogin,
  onOAuthLogin,
  onOpenSupport,
}: LoginAccessChooserProps) {
  const { t } = useTranslation();
  const hasPrimaryMethods = canUseTelegram || isEmailAuthEnabled || isEmailAuthLoading;

  return (
    <div className="auth-methods-view">
      <header className="auth-view-heading">
        <span className="auth-view-kicker">{t('auth.accountAccess', 'Account access')}</span>
        <h1>{t('auth.chooseLoginMethod', 'Choose a sign-in method')}</h1>
        <p>{t('auth.chooseLoginMethodHint', 'Use the option that is convenient for you.')}</p>
      </header>

      {hasPrimaryMethods && (
        <div className="auth-method-list" aria-label={t('auth.chooseLoginMethod')}>
          {canUseTelegram && (
            <button
              type="button"
              className="auth-method-button auth-method-button--primary"
              onClick={onTelegramLogin}
            >
              <span className="auth-method-icon" aria-hidden="true">
                <Send />
              </span>
              <span className="auth-method-copy">
                <strong>{t('auth.continueWithTelegram', 'Continue with Telegram')}</strong>
                <small>{t('auth.telegramLoginHint', 'Fast sign-in without a password')}</small>
              </span>
              <ArrowRight className="auth-method-arrow" aria-hidden="true" />
            </button>
          )}

          {isEmailAuthLoading ? (
            <div className="auth-method-button auth-method-button--loading" aria-hidden="true">
              <span className="auth-method-icon" />
              <span className="auth-method-copy">
                <span />
                <small />
              </span>
            </div>
          ) : (
            isEmailAuthEnabled && (
              <button type="button" className="auth-method-button" onClick={onEmailLogin}>
                <span className="auth-method-icon" aria-hidden="true">
                  <Mail />
                </span>
                <span className="auth-method-copy">
                  <strong>{t('auth.loginWithEmail', 'Sign in with email')}</strong>
                  <small>{t('auth.emailLoginHint', 'Email and password')}</small>
                </span>
                <ArrowRight className="auth-method-arrow" aria-hidden="true" />
              </button>
            )
          )}
        </div>
      )}

      <LoginOAuthSection
        isLoading={isOAuthProvidersLoading}
        providers={oauthProviders}
        oauthLoading={oauthLoading}
        onOAuthLogin={onOAuthLogin}
        showDivider={hasPrimaryMethods}
        compact
      />

      {isEmailAuthEnabled && (
        <button type="button" className="auth-register-action" onClick={onEmailRegister}>
          <UserPlus aria-hidden="true" />
          <span>
            {t('auth.noAccount', 'No account?')}{' '}
            <strong>{t('auth.createAccount', 'Create an account')}</strong>
          </span>
          <ArrowRight aria-hidden="true" />
        </button>
      )}

      <button type="button" className="auth-support-action" onClick={onOpenSupport}>
        <MessageCircleMore aria-hidden="true" />
        <span>{t('support.contactUs', { defaultValue: 'Contact support' })}</span>
      </button>
    </div>
  );
}
