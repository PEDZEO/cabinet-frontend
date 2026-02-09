import { useQuery } from '@tanstack/react-query';
import { brandingApi } from '@/api/branding';

const LITE_MODE_CACHE_KEY = 'cabinet_lite_mode';

export const getCachedLiteMode = (): boolean | null => {
  try {
    const cached = localStorage.getItem(LITE_MODE_CACHE_KEY);
    if (cached === null) return null; // no cache - new user
    return cached === 'true';
  } catch {
    return null;
  }
};

export const setCachedLiteMode = (enabled: boolean) => {
  try {
    localStorage.setItem(LITE_MODE_CACHE_KEY, String(enabled));
  } catch {
    // localStorage not available
  }
};

export function useLiteMode() {
  const cachedValue = getCachedLiteMode();
  const hasCache = cachedValue !== null;

  const { data: liteModeSettings, isLoading } = useQuery({
    queryKey: ['lite-mode-enabled'],
    queryFn: async () => {
      const result = await brandingApi.getLiteModeEnabled();
      setCachedLiteMode(result.enabled);
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - balance between sync and stability
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in memory longer
    refetchOnWindowFocus: true, // refetch when user returns to tab
    refetchOnReconnect: true, // refetch when network reconnects
    retry: 2, // retry on failure
    retryDelay: 1000, // 1 second between retries
    // Only use initialData if we have cache - new users should wait for API
    initialData: hasCache ? () => ({ enabled: cachedValue }) : undefined,
    initialDataUpdatedAt: hasCache
      ? () => {
          // Treat cached data as somewhat fresh to avoid immediate refetch blocking render
          return Date.now() - 1000 * 60; // 1 minute ago
        }
      : undefined,
  });

  // For new users (no cache), show lite mode if API returned enabled
  // For returning users, use cached value as fallback
  const isLiteMode = liteModeSettings?.enabled ?? cachedValue ?? false;

  // isLiteModeReady: true when we have a reliable value (either from cache or API)
  const isLiteModeReady = hasCache || !isLoading;

  return { isLiteMode, isLoading, isLiteModeReady };
}
