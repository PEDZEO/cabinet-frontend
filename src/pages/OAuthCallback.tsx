import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';

// SessionStorage helpers for OAuth state
const OAUTH_STATE_KEY = 'oauth_state';
const OAUTH_PROVIDER_KEY = 'oauth_provider';

export function saveOAuthState(state: string, provider: string): void {
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  sessionStorage.setItem(OAUTH_PROVIDER_KEY, provider);
}

export function getAndClearOAuthState(): { state: string; provider: string } | null {
  const state = sessionStorage.getItem(OAUTH_STATE_KEY);
  const provider = sessionStorage.getItem(OAUTH_PROVIDER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_PROVIDER_KEY);
  if (!state || !provider) return null;
  return { state, provider };
}

export default function OAuthCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const { loginWithOAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }

    const authenticate = async () => {
      const code = searchParams.get('code');
      const urlState = searchParams.get('state');

      if (!code || !urlState) {
        setError(t('auth.oauthError', 'Authorization was denied or failed'));
        return;
      }

      // Get saved state from sessionStorage
      const saved = getAndClearOAuthState();
      if (!saved) {
        setError(t('auth.oauthExpired', 'OAuth session expired. Please try again.'));
        return;
      }

      // Validate state match
      if (saved.state !== urlState) {
        setError(t('auth.oauthError', 'Authorization was denied or failed'));
        return;
      }

      try {
        await loginWithOAuth(saved.provider, code, urlState);
        navigate('/', { replace: true });
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } };
        setError(
          error.response?.data?.detail ||
            t('auth.oauthError', 'Authorization was denied or failed'),
        );
      }
    };

    authenticate();
  }, [searchParams, loginWithOAuth, navigate, isAuthenticated, t]);

  if (error) {
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
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="btn-primary w-full"
            >
              {t('auth.backToLogin', 'Back to login')}
            </button>
          </div>
        </div>
      </div>
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
