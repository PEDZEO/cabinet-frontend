import { useCallback, useEffect, useState, type SyntheticEvent } from 'react';
import { getLogoBlobUrl, isLogoPreloaded } from '@/api/branding';

const loadedBrandLogoUrls = new Set<string>();

const isBrandLogoLoaded = (logoUrl: string | null): boolean => {
  if (!logoUrl) {
    return false;
  }

  return loadedBrandLogoUrls.has(logoUrl) || getLogoBlobUrl() === logoUrl || isLogoPreloaded();
};

export function useBrandLogoImage(logoUrl: string | null) {
  const [isLoaded, setIsLoaded] = useState(() => isBrandLogoLoaded(logoUrl));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(isBrandLogoLoaded(logoUrl));
    setHasError(false);
  }, [logoUrl]);

  const handleLoad = useCallback(
    (event?: SyntheticEvent<HTMLImageElement>) => {
      const currentSrc = event?.currentTarget.currentSrc;
      if (currentSrc) {
        loadedBrandLogoUrls.add(currentSrc);
      }
      if (logoUrl) {
        loadedBrandLogoUrls.add(logoUrl);
      }
      setIsLoaded(true);
      setHasError(false);
    },
    [logoUrl],
  );

  const handleError = useCallback(() => {
    setIsLoaded(false);
    setHasError(true);
  }, []);

  return {
    isLoaded,
    hasError,
    handleLoad,
    handleError,
  };
}
