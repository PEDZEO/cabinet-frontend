import { useTranslation } from 'react-i18next';

interface LoginCheckEmailCardProps {
  email: string;
  onBackToLogin: () => void;
}

export function LoginCheckEmailCard({ email, onBackToLogin }: LoginCheckEmailCardProps) {
  const { t } = useTranslation();

  return (
    <div className="card text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success-500/20">
        <svg
          className="h-7 w-7 text-success-400"
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
      <h2 className="mb-2 text-lg font-bold text-dark-50">
        {t('auth.checkEmail', 'Check your email')}
      </h2>
      <p className="mb-3 text-sm text-dark-400">
        {t('auth.verificationSent', 'We sent a verification link to:')}
      </p>
      <p className="mb-4 text-sm font-medium text-accent-400">{email}</p>
      <p className="mb-5 text-xs text-dark-500">
        {t(
          'auth.clickLinkToVerify',
          'Click the link in the email to verify your account and log in.',
        )}
      </p>
      <button onClick={onBackToLogin} className="btn-secondary w-full">
        {t('auth.backToLogin', 'Back to login')}
      </button>
    </div>
  );
}
