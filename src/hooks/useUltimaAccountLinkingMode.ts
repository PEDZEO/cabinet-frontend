import { useQuery } from '@tanstack/react-query';
import { brandingApi } from '@/api/branding';

const ULTIMA_ACCOUNT_LINKING_MODE_CACHE_KEY = 'cabinet_ultima_account_linking_mode';

export const getCachedUltimaAccountLinkingMode = (): 'code' | 'provider_auth' | null => {
  try {
    const cached = localStorage.getItem(ULTIMA_ACCOUNT_LINKING_MODE_CACHE_KEY);
    return cached === 'provider_auth' || cached === 'code' ? cached : null;
  } catch {
    return null;
  }
};

export function useUltimaAccountLinkingMode() {
  const cachedMode = getCachedUltimaAccountLinkingMode();

  const { data, isLoading } = useQuery({
    queryKey: ['ultima-account-linking-mode'],
    queryFn: brandingApi.getUltimaAccountLinkingMode,
    staleTime: 15000,
    refetchOnWindowFocus: true,
    retry: 1,
    initialData: cachedMode ? { mode: cachedMode } : undefined,
  });

  return {
    mode: data?.mode ?? cachedMode ?? 'code',
    isProviderAuthMode: (data?.mode ?? cachedMode ?? 'code') === 'provider_auth',
    isLoading,
  };
}
