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
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialData: () => {
      const cached = getCachedLiteMode();
      return { enabled: cached };
    },
  });

  const isLiteMode = liteModeSettings?.enabled ?? false;

  return { isLiteMode, isLoading };
}
