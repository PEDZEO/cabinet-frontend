import { useState, useEffect, useMemo, useCallback, type SyntheticEvent } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import { authApi } from '../api/auth';
import { isValidEmail } from '../utils/validation';
import {
  brandingApi,
  getCachedBranding,
  setCachedBranding,
  preloadLogo,
  isLogoPreloaded,
  type BrandingInfo,
  type EmailAuthEnabled,
} from '../api/branding';
import { getAndClearReturnUrl } from '../utils/token';
import { isInTelegramWebApp, getTelegramInitData, useTelegramSDK } from '../hooks/useTelegramSDK';
import LanguageSwitcher from '../components/LanguageSwitcher';
import TelegramLoginButton from '../components/TelegramLoginButton';
import { saveOAuthState } from '../utils/oauthState';
import { LoginBranding } from './login/components/LoginBranding';
import { LoginCheckEmailCard } from './login/components/LoginCheckEmailCard';
import { LoginEmailAuthSection } from './login/components/LoginEmailAuthSection';
import { LoginOAuthSection } from './login/components/LoginOAuthSection';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    isAuthenticated,
    isLoading: isAuthInitializing,
    loginWithTelegram,
    loginWithEmail,
    registerWithEmail,
  } = useAuthStore();

  // Extract referral code from URL
  const referralCode = searchParams.get('ref') || '';

  const [authMode, setAuthMode] = useState<'login' | 'register'>(() =>
    referralCode ? 'register' : 'login',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(() => isLogoPreloaded());
  const [logoShape, setLogoShape] = useState<'square' | 'wide' | 'tall'>('square');
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(() => !!referralCode);

  // Telegram safe area insets
  const { safeAreaInset, contentSafeAreaInset } = useTelegramSDK();
  const safeTop = Math.max(safeAreaInset.top, contentSafeAreaInset.top);
  const safeBottom = Math.max(safeAreaInset.bottom, contentSafeAreaInset.bottom);

  // Получаем URL для возврата после авторизации
  const getReturnUrl = useCallback(() => {
    // Сначала проверяем state от React Router
    const stateFrom = (location.state as { from?: string })?.from;
    if (stateFrom && stateFrom !== '/login') {
      return stateFrom;
    }
    // Затем проверяем сохранённый URL в sessionStorage (от safeRedirectToLogin)
    const savedUrl = getAndClearReturnUrl();
    if (savedUrl && savedUrl !== '/login') {
      return savedUrl;
    }
    // По умолчанию на главную
    return '/';
  }, [location.state]);

  // Fetch branding with unified cache
  const cachedBranding = useMemo(() => getCachedBranding(), []);

  const { data: branding } = useQuery<BrandingInfo>({
    queryKey: ['branding'],
    queryFn: async () => {
      const data = await brandingApi.getBranding();
      setCachedBranding(data);
      await preloadLogo(data);
      return data;
    },
    staleTime: 60000,
    initialData: cachedBranding ?? undefined,
    initialDataUpdatedAt: 0,
  });

  // Check if email auth is enabled
  const { data: emailAuthConfig, isLoading: isEmailAuthLoading } = useQuery<EmailAuthEnabled>({
    queryKey: ['email-auth-enabled'],
    queryFn: brandingApi.getEmailAuthEnabled,
    staleTime: 60000,
  });
  // Default to disabled until config is loaded to avoid showing email auth when it is off.
  const isEmailAuthEnabled = emailAuthConfig?.enabled ?? false;

  // Fetch enabled OAuth providers
  const { data: oauthData, isLoading: isOAuthProvidersLoading } = useQuery({
    queryKey: ['oauth-providers'],
    queryFn: authApi.getOAuthProviders,
    staleTime: 60000,
    retry: 2,
  });
  const oauthProviders = Array.isArray(oauthData?.providers) ? oauthData.providers : [];

  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const handleOAuthLogin = async (provider: string) => {
    setError('');
    setOauthLoading(provider);
    try {
      const { authorize_url, state } = await authApi.getOAuthAuthorizeUrl(provider);

      // Validate redirect URL — only allow HTTPS to prevent open redirect
      try {
        const parsed = new URL(authorize_url);
        if (parsed.protocol !== 'https:') {
          throw new Error('Invalid OAuth redirect URL');
        }
      } catch {
        throw new Error('Invalid OAuth redirect URL');
      }

      saveOAuthState(state, provider);
      window.location.href = authorize_url;
    } catch {
      setError(t('auth.oauthError', 'Authorization was denied or failed'));
      setOauthLoading(null);
    }
  };

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '';

  // If email auth is disabled but user came with ref param, redirect to bot
  useEffect(() => {
    if (referralCode && emailAuthConfig?.enabled === false && botUsername) {
      window.location.href = `https://t.me/${botUsername}?start=${encodeURIComponent(referralCode)}`;
    }
  }, [referralCode, emailAuthConfig, botUsername]);

  const appName = branding ? branding.name : import.meta.env.VITE_APP_NAME || 'VPN';
  const appLogo = branding?.logo_letter || import.meta.env.VITE_APP_LOGO || 'V';
  const logoUrl = branding ? brandingApi.getLogoUrl(branding) : null;

  const handleLogoLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;

    if (naturalWidth > naturalHeight * 1.2) {
      setLogoShape('wide');
    } else if (naturalHeight > naturalWidth * 1.2) {
      setLogoShape('tall');
    } else {
      setLogoShape('square');
    }

    setLogoLoaded(true);
  }, []);

  // Set document title
  useEffect(() => {
    document.title = appName || 'VPN';
  }, [appName]);

  useEffect(() => {
    setLogoShape('square');
    setLogoLoaded(false);
  }, [branding?.has_custom_logo, logoUrl]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getReturnUrl(), { replace: true });
    }
  }, [isAuthenticated, navigate, getReturnUrl]);

  // Try Telegram WebApp authentication on mount (with auto-retry on 401)
  // Wait for auth store initialization to complete to avoid race conditions
  // with stale tokens triggering interceptor refresh/redirect loops
  useEffect(() => {
    // Don't attempt Telegram auth until store initialization is done
    if (isAuthInitializing) return;

    const tryTelegramAuth = async () => {
      const initData = getTelegramInitData();
      if (!isInTelegramWebApp() || !initData) return;

      setIsTelegramWebApp(true);
      setIsLoading(true);

      const MAX_RETRIES = 1;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          await loginWithTelegram(initData);
          navigate(getReturnUrl(), { replace: true });
          return;
        } catch (err) {
          const error = err as { response?: { status?: number; data?: { detail?: string } } };
          const status = error.response?.status;
          const detail = error.response?.data?.detail;
          if (import.meta.env.DEV)
            console.warn(`Telegram auth attempt ${attempt + 1} failed:`, status, detail);

          if (status === 401 && attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }

          // Show backend error detail if available, otherwise generic message
          setError(detail || t('auth.telegramRequired'));
        }
      }

      setIsLoading(false);
    };

    tryTelegramAuth();
  }, [isAuthInitializing, loginWithTelegram, navigate, t, getReturnUrl]);

  // Manual retry for Telegram Mini App auth
  const handleRetryTelegramAuth = async () => {
    const initData = getTelegramInitData();
    if (!initData) {
      setError(t('auth.telegramRequired'));
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await loginWithTelegram(initData);
      navigate(getReturnUrl(), { replace: true });
    } catch (err) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      const status = error.response?.status;
      const detail = error.response?.data?.detail;
      if (import.meta.env.DEV) console.warn('Telegram auth retry failed:', status, detail);
      setError(
        detail ||
          t('auth.telegramRetryFailed', 'Authorization failed. Close the app and try again.'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Валидация email
    if (!email.trim() || !isValidEmail(email.trim())) {
      setError(t('auth.invalidEmail', 'Please enter a valid email address'));
      return;
    }

    if (authMode === 'register') {
      // Валидация для регистрации
      if (password !== confirmPassword) {
        setError(t('auth.passwordMismatch', 'Passwords do not match'));
        return;
      }
      if (password.length < 8) {
        setError(t('auth.passwordTooShort', 'Password must be at least 8 characters'));
        return;
      }
    }

    setIsLoading(true);

    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
        navigate(getReturnUrl(), { replace: true });
      } else {
        const result = await registerWithEmail(
          email,
          password,
          firstName || undefined,
          referralCode || undefined,
        );
        // Show "check your email" screen
        setRegisteredEmail(result.email);
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      if (status === 400 && detail?.includes('already registered')) {
        setError(t('auth.emailAlreadyRegistered', 'This email is already registered'));
      } else if (status === 401 || status === 403) {
        if (detail?.includes('verify your email')) {
          setError(t('auth.emailNotVerified', 'Please verify your email first'));
        } else {
          setError(t('auth.invalidCredentials', 'Invalid email or password'));
        }
      } else if (status === 429) {
        setError(t('auth.tooManyAttempts', 'Too many attempts. Please try again later'));
      } else {
        setError(detail || t('common.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError('');

    if (!forgotPasswordEmail.trim() || !isValidEmail(forgotPasswordEmail.trim())) {
      setForgotPasswordError(t('auth.invalidEmail', 'Please enter a valid email address'));
      return;
    }

    setForgotPasswordLoading(true);
    try {
      await authApi.forgotPassword(forgotPasswordEmail.trim());
      setForgotPasswordSent(true);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      const detail = error.response?.data?.detail;
      setForgotPasswordError(detail || t('common.error'));
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
    setForgotPasswordSent(false);
    setForgotPasswordError('');
  };

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
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-500/10 via-transparent to-transparent" />

      {/* Language switcher */}
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

        {/* Check Email Screen */}
        {registeredEmail ? (
          <LoginCheckEmailCard
            email={registeredEmail}
            onBackToLogin={() => {
              setRegisteredEmail(null);
              setAuthMode('login');
            }}
          />
        ) : (
          /* Main auth card */
          <div className="card">
            {error && (
              <div className="mb-4 rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-2.5 text-sm text-error-400">
                {error}
              </div>
            )}

            {/* Telegram auth section */}
            <div className="space-y-3">
              {isLoading && isTelegramWebApp ? (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
                  <p className="text-sm text-dark-400">{t('auth.authenticating')}</p>
                </div>
              ) : isTelegramWebApp && error ? (
                <div className="space-y-3 text-center">
                  <button
                    onClick={handleRetryTelegramAuth}
                    className="btn-primary mx-auto flex items-center gap-2 px-5 py-2.5"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                      />
                    </svg>
                    {t('auth.tryAgain')}
                  </button>
                  <p className="text-xs text-dark-500">
                    {t(
                      'auth.telegramReopenHint',
                      'If the problem persists, close and reopen the app',
                    )}
                  </p>
                </div>
              ) : (
                <TelegramLoginButton botUsername={botUsername} />
              )}
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
              onToggleEmailForm={() => setShowEmailForm(!showEmailForm)}
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
              onShowForgotPassword={() => setShowForgotPassword(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
