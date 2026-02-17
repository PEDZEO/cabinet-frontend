import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type SyntheticEvent,
} from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth';
import { authApi } from '../../../api/auth';
import { isValidEmail } from '../../../utils/validation';
import {
  brandingApi,
  getCachedBranding,
  setCachedBranding,
  preloadLogo,
  isLogoPreloaded,
  type BrandingInfo,
  type EmailAuthEnabled,
} from '../../../api/branding';
import { getAndClearReturnUrl } from '../../../utils/token';
import {
  isInTelegramWebApp,
  getTelegramInitData,
  useTelegramSDK,
} from '../../../hooks/useTelegramSDK';
import { saveOAuthState } from '../../../utils/oauthState';

type AuthMode = 'login' | 'register';
type LogoShape = 'square' | 'wide' | 'tall';

interface ApiErrorPayload {
  detail?: string;
}

interface ApiError {
  response?: {
    status?: number;
    data?: ApiErrorPayload;
  };
}

export function useLoginPage() {
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

  const referralCode = searchParams.get('ref') || '';

  const [authMode, setAuthMode] = useState<AuthMode>(() => (referralCode ? 'register' : 'login'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(() => isLogoPreloaded());
  const [logoShape, setLogoShape] = useState<LogoShape>('square');
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(() => !!referralCode);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const { safeAreaInset, contentSafeAreaInset } = useTelegramSDK();
  const safeTop = Math.max(safeAreaInset.top, contentSafeAreaInset.top);
  const safeBottom = Math.max(safeAreaInset.bottom, contentSafeAreaInset.bottom);

  const getReturnUrl = useCallback(() => {
    const stateFrom = (location.state as { from?: string })?.from;
    if (stateFrom && stateFrom !== '/login') {
      return stateFrom;
    }

    const savedUrl = getAndClearReturnUrl();
    if (savedUrl && savedUrl !== '/login') {
      return savedUrl;
    }

    return '/';
  }, [location.state]);

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

  const { data: emailAuthConfig, isLoading: isEmailAuthLoading } = useQuery<EmailAuthEnabled>({
    queryKey: ['email-auth-enabled'],
    queryFn: brandingApi.getEmailAuthEnabled,
    staleTime: 60000,
  });
  const isEmailAuthEnabled = emailAuthConfig?.enabled ?? false;

  const { data: oauthData, isLoading: isOAuthProvidersLoading } = useQuery({
    queryKey: ['oauth-providers'],
    queryFn: authApi.getOAuthProviders,
    staleTime: 60000,
    retry: 2,
  });
  const oauthProviders = Array.isArray(oauthData?.providers) ? oauthData.providers : [];

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '';
  const appName = branding ? branding.name : import.meta.env.VITE_APP_NAME || 'VPN';
  const appLogo = branding?.logo_letter || import.meta.env.VITE_APP_LOGO || 'V';
  const logoUrl = branding ? brandingApi.getLogoUrl(branding) : null;

  useEffect(() => {
    if (referralCode && emailAuthConfig?.enabled === false && botUsername) {
      window.location.href = `https://t.me/${botUsername}?start=${encodeURIComponent(referralCode)}`;
    }
  }, [referralCode, emailAuthConfig, botUsername]);

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

  useEffect(() => {
    if (isAuthInitializing) return;

    const tryTelegramAuth = async () => {
      const initData = getTelegramInitData();
      if (!isInTelegramWebApp() || !initData) return;

      setIsTelegramWebApp(true);
      setIsLoading(true);

      const maxRetries = 1;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          await loginWithTelegram(initData);
          navigate(getReturnUrl(), { replace: true });
          return;
        } catch (err) {
          const apiError = err as ApiError;
          const status = apiError.response?.status;
          const detail = apiError.response?.data?.detail;
          if (import.meta.env.DEV) {
            console.warn(`Telegram auth attempt ${attempt + 1} failed:`, status, detail);
          }

          if (status === 401 && attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
          }

          setError(detail || t('auth.telegramRequired'));
        }
      }

      setIsLoading(false);
    };

    void tryTelegramAuth();
  }, [getReturnUrl, isAuthInitializing, loginWithTelegram, navigate, t]);

  const handleOAuthLogin = useCallback(
    async (provider: string) => {
      setError('');
      setOauthLoading(provider);
      try {
        const { authorize_url, state } = await authApi.getOAuthAuthorizeUrl(provider);

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
    },
    [t],
  );

  const handleRetryTelegramAuth = useCallback(async () => {
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
      const apiError = err as ApiError;
      const status = apiError.response?.status;
      const detail = apiError.response?.data?.detail;
      if (import.meta.env.DEV) {
        console.warn('Telegram auth retry failed:', status, detail);
      }
      setError(
        detail ||
          t('auth.telegramRetryFailed', 'Authorization failed. Close the app and try again.'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [getReturnUrl, loginWithTelegram, navigate, t]);

  const handleEmailSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError('');

      if (!email.trim() || !isValidEmail(email.trim())) {
        setError(t('auth.invalidEmail', 'Please enter a valid email address'));
        return;
      }

      if (authMode === 'register') {
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
          setRegisteredEmail(result.email);
        }
      } catch (err: unknown) {
        const apiError = err as ApiError;
        const status = apiError.response?.status;
        const detail = apiError.response?.data?.detail;

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
    },
    [
      authMode,
      confirmPassword,
      email,
      firstName,
      getReturnUrl,
      loginWithEmail,
      navigate,
      password,
      referralCode,
      registerWithEmail,
      t,
    ],
  );

  const handleForgotPassword = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
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
        const apiError = err as ApiError;
        const detail = apiError.response?.data?.detail;
        setForgotPasswordError(detail || t('common.error'));
      } finally {
        setForgotPasswordLoading(false);
      }
    },
    [forgotPasswordEmail, t],
  );

  const closeForgotPasswordModal = useCallback(() => {
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
    setForgotPasswordSent(false);
    setForgotPasswordError('');
  }, []);

  const handleBackToLogin = useCallback(() => {
    setRegisteredEmail(null);
    setAuthMode('login');
  }, []);

  const handleToggleEmailForm = useCallback(() => {
    setShowEmailForm((prev) => !prev);
  }, []);

  const handleShowForgotPassword = useCallback(() => {
    setShowForgotPassword(true);
  }, []);

  return {
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
  };
}
