import { useTranslation } from 'react-i18next';
import OAuthProviderIcon from '@/components/OAuthProviderIcon';
import type { OAuthProvider } from '@/types';

interface LoginOAuthSectionProps {
  isLoading: boolean;
  providers: OAuthProvider[];
  oauthLoading: string | null;
  onOAuthLogin: (provider: string) => void;
}

export function LoginOAuthSection({
  isLoading,
  providers,
  oauthLoading,
  onOAuthLogin,
}: LoginOAuthSectionProps) {
  const { t } = useTranslation();

  if (!isLoading && providers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-dark-700" />
        <span className="text-xs text-dark-500">{t('auth.or', 'or')}</span>
        <div className="h-px flex-1 bg-dark-700" />
      </div>

      <div className="flex items-stretch gap-2">
        {isLoading
          ? [0, 1, 2].map((idx) => (
              <div
                key={`oauth-skeleton-${idx}`}
                className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-dark-700 bg-dark-800/60 py-2.5"
              >
                <span className="h-5 w-5 animate-pulse rounded-full bg-dark-600" />
                <span className="h-2 w-10 animate-pulse rounded bg-dark-600" />
              </div>
            ))
          : providers.map((provider) => (
              <button
                key={provider.name}
                type="button"
                onClick={() => onOAuthLogin(provider.name)}
                disabled={oauthLoading !== null}
                className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-dark-700 bg-dark-800/80 py-2.5 transition-all hover:border-dark-600 hover:bg-dark-700 disabled:opacity-50"
                title={provider.display_name}
              >
                {oauthLoading === provider.name ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-dark-400 border-t-white" />
                ) : (
                  <OAuthProviderIcon provider={provider.name} className="h-5 w-5" />
                )}
                <span className="text-[10px] leading-none text-dark-500">
                  {provider.display_name}
                </span>
              </button>
            ))}
      </div>
    </>
  );
}
