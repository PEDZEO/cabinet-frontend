import { useCallback, useEffect, useState, type SyntheticEvent } from 'react';
import { cn } from '@/lib/utils';

type LogoShape = 'square' | 'wide' | 'tall';
type BrandMarkVariant = 'hero' | 'card';

interface UltimaAuthBrandMarkProps {
  appName: string;
  logoUrl: string | null;
  showBrandLogo: boolean;
  variant?: BrandMarkVariant;
  className?: string;
}

function UltimaLogoShield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={cn('text-white', className)}>
      <path
        d="M32 6.5c7 6 15.8 9 24 9v17.2c0 13.8-9.5 22.4-24 24.8-14.5-2.4-24-11-24-24.8V15.5c8.2 0 17-3 24-9Z"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <path
        d="m22.5 33 6.2 6.2L42 25.8"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const dimensionClassNames: Record<BrandMarkVariant, Record<LogoShape, string>> = {
  hero: {
    square: 'h-20 w-20',
    wide: 'h-20 w-32',
    tall: 'h-24 w-20',
  },
  card: {
    square: 'h-16 w-16',
    wide: 'h-16 w-28',
    tall: 'h-20 w-16',
  },
};

const iconClassNames: Record<BrandMarkVariant, string> = {
  hero: 'h-12 w-12',
  card: 'h-9 w-9',
};

export function UltimaAuthBrandMark({
  appName,
  logoUrl,
  showBrandLogo,
  variant = 'hero',
  className,
}: UltimaAuthBrandMarkProps) {
  const [logoShape, setLogoShape] = useState<LogoShape>('square');
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoShape('square');
    setLogoLoaded(false);
    setLogoFailed(false);
  }, [logoUrl, showBrandLogo]);

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
    setLogoFailed(false);
  }, []);

  const shouldRenderImage = Boolean(showBrandLogo && logoUrl && !logoFailed);
  const dimensionClassName = shouldRenderImage
    ? dimensionClassNames[variant][logoShape]
    : dimensionClassNames[variant].square;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-[28px] border',
        dimensionClassName,
        className,
      )}
      style={{
        borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 28%, transparent)',
        background: 'color-mix(in srgb, var(--ultima-color-primary) 16%, transparent)',
      }}
    >
      <span
        className={cn(
          'absolute transition-opacity duration-200',
          iconClassNames[variant],
          shouldRenderImage && logoLoaded ? 'opacity-0' : 'opacity-100',
        )}
      >
        <UltimaLogoShield className={iconClassNames[variant]} />
      </span>

      {shouldRenderImage ? (
        <img
          src={logoUrl ?? undefined}
          alt={appName || 'Logo'}
          className={cn(
            'absolute h-full w-full object-contain p-1.5 transition-opacity duration-200',
            logoLoaded ? 'opacity-100' : 'opacity-0',
          )}
          onLoad={handleLogoLoad}
          onError={() => {
            setLogoFailed(true);
            setLogoLoaded(false);
          }}
        />
      ) : null}
    </div>
  );
}
