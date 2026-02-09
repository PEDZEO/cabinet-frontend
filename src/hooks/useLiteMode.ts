import { useQuery } from '@tanstack/react-query';
import { brandingApi } from '@/api/branding';

const LITE_MODE_CACHE_KEY = 'cabinet_lite_mode';

export const getCachedLiteMode = (): boolean => {
  try {
    const cached = localStorage.getItem(LITE_MODE_CACHE_KEY);
    return cached === 'true';
  } catch {
    return false;
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
    // Use initialData from cache - prevents flicker to main version
    initialData: () => {
      const cached = getCachedLiteMode();
      return { enabled: cached };
    },
    initialDataUpdatedAt: () => {
      // Treat cached data as somewhat fresh to avoid immediate refetch blocking render
      return Date.now() - 1000 * 60; // 1 minute ago
    },
  });

  // Always use cached value as fallback if query data is undefined
  const cachedValue = getCachedLiteMode();
  const isLiteMode = liteModeSettings?.enabled ?? cachedValue;

  return { isLiteMode, isLoading };
}
