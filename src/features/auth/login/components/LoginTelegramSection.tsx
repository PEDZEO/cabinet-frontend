import { useTranslation } from 'react-i18next';
import TelegramLoginButton from '@/components/TelegramLoginButton';

interface LoginTelegramSectionProps {
  isLoading: boolean;
  isTelegramWebApp: boolean;
  hasError: boolean;
  botUsername: string;
  onRetryTelegramAuth: () => void;
}

export function LoginTelegramSection({
  isLoading,
  isTelegramWebApp,
  hasError,
  botUsername,
  onRetryTelegramAuth,
}: LoginTelegramSectionProps) {
  const { t } = useTranslation();

  if (isLoading && isTelegramWebApp) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        <p className="text-sm text-dark-400">{t('auth.authenticating')}</p>
      </div>
    );
  }

  if (isTelegramWebApp && hasError) {
    return (
      <div className="space-y-3 text-center">
        <button
          onClick={onRetryTelegramAuth}
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
          {t('auth.telegramReopenHint', 'If the problem persists, close and reopen the app')}
        </p>
      </div>
    );
  }

  return <TelegramLoginButton botUsername={botUsername} />;
}
