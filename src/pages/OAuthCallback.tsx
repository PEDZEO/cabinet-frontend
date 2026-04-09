import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/api/auth';
import { getLocalizedIdentityLinkMessage } from '@/features/account-linking/linkingMessages';
import {
  getLocalizedAuthErrorDetailMessage,
  parseApiErrorDetail,
} from '@/features/auth/shared/authErrorMessages';
import { UltimaAuthStatusScreen } from '@/features/auth/shared/UltimaAuthStatusScreen';
import { useUltimaAuthBranding } from '@/features/auth/shared/useUltimaAuthBranding';
import { useUltimaMode } from '@/hooks/useUltimaMode';
import { tokenStorage } from '@/utils/token';
import {
  markPendingAccountLinkRefresh,
  stashPendingAccountLinkOutcome,
} from '@/utils/accountLinkingFlow';
import { useAuthStore } from '@/store/auth';
import {
  getAndClearLinkOAuthState,
  getAndClearOAuthState,
  peekLinkOAuthState,
} from '@/utils/oauthState';
import type { LinkOperationResponse } from '@/types';

type CallbackMode = 'login' | 'link-browser' | 'link-server';

function buildAppOAuthCallbackUrl(search: string): string {
  return `ultimteamvpn://auth/oauth/callback${search}`;
}

export default function OAuthCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isUltimaMode, isUltimaModeReady } = useUltimaMode();
  const { appName, logoUrl, showUltimaBrandLogo } = useUltimaAuthBranding(isUltimaMode);
  const [error, setError] = useState('');
  const [errorMode, setErrorMode] = useState<CallbackMode>('login');
  const [serverResult, setServerResult] = useState<LinkOperationResponse | null>(null);
  const hasRun = useRef(false);
  const accountLinkedTitle = t('successNotification.accountLinked.title', 'Аккаунты связаны!');
  const accountLinkedMessage = t(
    'successNotification.accountLinked.message',
    'Привязка завершена. Теперь вы можете входить через связанные способы входа.',
  );

  const loginWithOAuth = useAuthStore((state) => state.loginWithOAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasStoredSession =
    Boolean(tokenStorage.getAccessToken()) || Boolean(tokenStorage.getRefreshToken());

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const code = searchParams.get('code');
    const urlState = searchParams.get('state');
    const deviceId = searchParams.get('device_id');
    const responseType = searchParams.get('type');
    const oauthError = searchParams.get('error');
    const oauthErrorDescription = searchParams.get('error_description');
    const isAppFlow = searchParams.get('app') === '1';

    let mode: CallbackMode = 'link-server';
    let provider: string | undefined;
    let returnTo: string | undefined;

    const linkSaved = peekLinkOAuthState();
    if (linkSaved && linkSaved.state === urlState) {
      const consumed = getAndClearLinkOAuthState();
      mode = 'link-browser';
      provider = consumed?.provider;
      returnTo = consumed?.returnTo;
    } else {
      const loginSaved = getAndClearOAuthState();
      if (loginSaved && loginSaved.state === urlState) {
        mode = 'login';
        provider = loginSaved.provider;
        returnTo = loginSaved.returnTo;
      }
    }

    if (oauthError) {
      setError(
        getLocalizedAuthErrorDetailMessage(t, {
          message: oauthErrorDescription || oauthError,
          provider,
          fallback: t('auth.oauthError', 'Authorization was denied or failed'),
        }),
      );
      return;
    }

    if (!code || !urlState) {
      setError(t('auth.oauthError', 'Authorization was denied or failed'));
      return;
    }

    const handle = async () => {
      window.history.replaceState({}, '', '/auth/oauth/callback');

      if (mode === 'link-browser' && provider) {
        try {
          await authApi.linkProviderCallback(provider, code, urlState, {
            device_id: deviceId || undefined,
            type: responseType || undefined,
          });
          markPendingAccountLinkRefresh();
          stashPendingAccountLinkOutcome({
            status: 'success',
            code: 'identity_linked',
            message: accountLinkedMessage,
            provider,
          });
          window.location.replace(returnTo || '/account-linking');
        } catch (err) {
          const parsedError = parseApiErrorDetail(err);
          stashPendingAccountLinkOutcome({
            status: 'error',
            code: parsedError.code,
            message:
              parsedError.message || t('auth.oauthError', 'Authorization was denied or failed'),
            provider: provider ?? parsedError.provider ?? null,
          });
          window.location.replace(returnTo || '/account-linking');
          setErrorMode('link-browser');
          setError(
            getLocalizedAuthErrorDetailMessage(t, {
              ...parsedError,
              provider: provider ?? parsedError.provider,
              fallback: t('auth.oauthError', 'Authorization was denied or failed'),
            }),
          );
        }
        return;
      }

      if (mode === 'login' && provider) {
        if (isAuthenticated) {
          navigate(returnTo || '/', { replace: true });
          return;
        }
        try {
          await loginWithOAuth(provider, code, urlState, {
            device_id: deviceId || undefined,
            type: responseType || undefined,
          });
          navigate(returnTo || '/', { replace: true });
        } catch (err) {
          const parsedError = parseApiErrorDetail(err);
          setErrorMode('login');
          setError(
            getLocalizedAuthErrorDetailMessage(t, {
              ...parsedError,
              provider: provider ?? parsedError.provider,
              fallback: t('auth.oauthError', 'Authorization was denied or failed'),
            }),
          );
        }
        return;
      }

      if (isAppFlow || (mode === 'link-server' && !hasStoredSession)) {
        window.location.replace(buildAppOAuthCallbackUrl(window.location.search));
        return;
      }

      try {
        const response = await authApi.linkProviderServerComplete(code, urlState, {
          device_id: deviceId || undefined,
          type: responseType || undefined,
        });

        if (hasStoredSession) {
          markPendingAccountLinkRefresh();
          stashPendingAccountLinkOutcome({
            status: response.status,
            code: response.code,
            message: response.message,
            provider: response.provider,
          });
          window.location.replace('/account-linking');
          return;
        }

        setServerResult(response);
      } catch (err) {
        const parsedError = parseApiErrorDetail(err);
        if (hasStoredSession) {
          stashPendingAccountLinkOutcome({
            status: 'error',
            code: parsedError.code,
            message:
              parsedError.message || t('auth.oauthError', 'Authorization was denied or failed'),
            provider: parsedError.provider ?? null,
          });
          window.location.replace('/account-linking');
          return;
        }

        setErrorMode('link-server');
        setError(
          getLocalizedAuthErrorDetailMessage(t, {
            ...parsedError,
            fallback: t('auth.oauthError', 'Authorization was denied or failed'),
          }),
        );
      }
    };

    void handle();
  }, [
    searchParams,
    loginWithOAuth,
    navigate,
    isAuthenticated,
    t,
    accountLinkedTitle,
    accountLinkedMessage,
    hasStoredSession,
  ]);

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '';
  const telegramLink = botUsername ? `https://t.me/${botUsername}` : '';
  const shouldRenderUltima = isUltimaModeReady && isUltimaMode;

  if (serverResult) {
    const success = serverResult.status === 'success';
    const localizedServerMessage = getLocalizedIdentityLinkMessage(
      t,
      serverResult.code,
      serverResult.message,
      serverResult.provider,
    );
    const action = telegramLink ? (
      <a
        href={telegramLink}
        className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-[color:var(--ultima-color-primary)] px-4 py-3 text-sm font-medium text-[color:var(--ultima-color-primary-text)] no-underline transition hover:opacity-95"
      >
        {success
          ? t('profile.linking.returnToTelegram', 'Вернуться в Telegram')
          : t('profile.linking.openTelegram', 'Открыть Telegram')}
      </a>
    ) : (
      <button
        onClick={() => navigate('/login', { replace: true })}
        className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-[color:var(--ultima-color-primary)] px-4 py-3 text-sm font-medium text-[color:var(--ultima-color-primary-text)] transition hover:opacity-95"
      >
        {t('auth.backToLogin', 'Back to login')}
      </button>
    );

    if (shouldRenderUltima) {
      return (
        <UltimaAuthStatusScreen
          appName={appName}
          logoUrl={logoUrl}
          showBrandLogo={showUltimaBrandLogo}
          tone={success ? 'success' : 'error'}
          title={success ? accountLinkedTitle : t('auth.loginFailed')}
          message={localizedServerMessage}
          action={action}
        />
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
        <div className="relative w-full max-w-md text-center">
          <div className="card">
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
                success ? 'bg-success-500/20' : 'bg-error-500/20'
              }`}
            >
              <svg
                className={`h-8 w-8 ${success ? 'text-success-400' : 'text-error-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                {success ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                )}
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-dark-50">
              {success ? accountLinkedTitle : t('auth.loginFailed')}
            </h2>
            <p className="mb-6 text-sm text-dark-400">{localizedServerMessage}</p>
            {telegramLink ? (
              <a
                href={telegramLink}
                className="btn-primary inline-block w-full rounded-lg bg-accent-500 px-6 py-3 text-center font-medium text-dark-950 no-underline transition-colors hover:bg-accent-400"
              >
                {success
                  ? t('profile.linking.returnToTelegram', 'Вернуться в Telegram')
                  : t('profile.linking.openTelegram', 'Открыть Telegram')}
              </a>
            ) : (
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="btn-primary w-full"
              >
                {t('auth.backToLogin', 'Back to login')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const action =
      errorMode === 'link-browser' ? (
        <button
          onClick={() => navigate('/account-linking', { replace: true })}
          className="btn-primary w-full"
        >
          {t('profile.linking.backToLinking', 'Вернуться к привязке')}
        </button>
      ) : telegramLink && errorMode === 'link-server' ? (
        <a
          href={telegramLink}
          className="btn-primary inline-block w-full rounded-lg bg-accent-500 px-6 py-3 text-center font-medium text-dark-950 no-underline transition-colors hover:bg-accent-400"
        >
          {t('profile.linking.openTelegram', 'Открыть Telegram')}
        </a>
      ) : (
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="btn-primary w-full"
        >
          {t('auth.backToLogin', 'Back to login')}
        </button>
      );

    if (shouldRenderUltima) {
      return (
        <UltimaAuthStatusScreen
          appName={appName}
          logoUrl={logoUrl}
          showBrandLogo={showUltimaBrandLogo}
          tone={errorMode === 'link-server' ? 'warning' : 'error'}
          title={t('auth.loginFailed')}
          message={error}
          action={action}
        />
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
        <div className="relative w-full max-w-md text-center">
          <div className="card">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-error-500/20">
              <svg
                className="h-8 w-8 text-error-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-dark-50">{t('auth.loginFailed')}</h2>
            <p className="mb-6 text-sm text-dark-400">{error}</p>
            {action}
          </div>
        </div>
      </div>
    );
  }

  if (shouldRenderUltima) {
    return (
      <UltimaAuthStatusScreen
        appName={appName}
        logoUrl={logoUrl}
        showBrandLogo={showUltimaBrandLogo}
        tone="loading"
        title={t('auth.authenticating')}
        message={t('common.loading')}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
      <div className="relative text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        <h2 className="text-lg font-semibold text-dark-50">{t('auth.authenticating')}</h2>
        <p className="mt-2 text-sm text-dark-400">{t('common.loading')}</p>
      </div>
    </div>
  );
}
