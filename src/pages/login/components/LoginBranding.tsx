import type { SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { BrandingInfo } from '../../../api/branding';

interface LoginBrandingProps {
  branding?: BrandingInfo;
  logoShape: 'square' | 'wide' | 'tall';
  logoLoaded: boolean;
  appLogo: string;
  appName: string;
  logoUrl: string | null;
  onLogoLoad: (event: SyntheticEvent<HTMLImageElement>) => void;
  referralCode: string;
  isEmailAuthEnabled: boolean;
}

export function LoginBranding({
  branding,
  logoShape,
  logoLoaded,
  appLogo,
  appName,
  logoUrl,
  onLogoLoad,
  referralCode,
  isEmailAuthEnabled,
}: LoginBrandingProps) {
  const { t } = useTranslation();

  return (
    <div className="text-center">
      <div
        className={`relative mx-auto mb-3 flex items-center justify-center overflow-hidden rounded-2xl border border-dark-700/50 bg-dark-800/80 shadow-md ${
          branding?.has_custom_logo
            ? logoShape === 'wide'
              ? 'h-20 w-32 sm:h-24 sm:w-40'
              : logoShape === 'tall'
                ? 'h-24 w-20 sm:h-28 sm:w-24'
                : 'h-24 w-24 sm:h-28 sm:w-28'
            : 'h-20 w-20 sm:h-24 sm:w-24'
        }`}
      >
        <span
          className={`absolute text-3xl font-bold text-accent-400 transition-opacity duration-200 sm:text-4xl ${branding?.has_custom_logo && logoLoaded ? 'opacity-0' : 'opacity-100'}`}
        >
          {appLogo}
        </span>
        {branding?.has_custom_logo && logoUrl && (
          <img
            src={logoUrl}
            alt={appName || 'Logo'}
            className={`absolute h-full w-full object-contain transition-opacity duration-200 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={onLogoLoad}
          />
        )}
      </div>
      {appName && <h1 className="text-3xl font-bold text-dark-50 sm:text-4xl">{appName}</h1>}

      {referralCode && isEmailAuthEnabled && (
        <div className="mt-3 rounded-xl border border-accent-500/30 bg-accent-500/10 p-2.5">
          <div className="flex items-center justify-center gap-2 text-accent-400">
            <svg
              className="h-4 w-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
            <span className="text-xs font-medium">{t('auth.referralInvite')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
