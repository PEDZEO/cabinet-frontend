import { useMutation, type QueryClient } from '@tanstack/react-query';

import { subscriptionApi } from '@/api/subscription';

type TrafficData = {
  traffic_used_gb: number;
  traffic_used_percent: number;
  is_unlimited: boolean;
};

type UseTrafficAndCountriesMutationsParams = {
  queryClient: QueryClient;
  setShowTrafficTopup: (value: boolean) => void;
  setSelectedTrafficPackage: (value: number | null) => void;
  setShowServerManagement: (value: boolean) => void;
  setTrafficData: (value: TrafficData) => void;
  setTrafficRefreshCooldown: (value: number) => void;
};

export const useTrafficAndCountriesMutations = ({
  queryClient,
  setShowTrafficTopup,
  setSelectedTrafficPackage,
  setShowServerManagement,
  setTrafficData,
  setTrafficRefreshCooldown,
}: UseTrafficAndCountriesMutationsParams) => {
  const trafficPurchaseMutation = useMutation({
    mutationFn: (gb: number) => subscriptionApi.purchaseTraffic(gb),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setShowTrafficTopup(false);
      setSelectedTrafficPackage(null);
    },
  });

  const updateCountriesMutation = useMutation({
    mutationFn: (countries: string[]) => subscriptionApi.updateCountries(countries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      setShowServerManagement(false);
    },
  });

  const refreshTrafficMutation = useMutation({
    mutationFn: subscriptionApi.refreshTraffic,
    onSuccess: (data) => {
      setTrafficData({
        traffic_used_gb: data.traffic_used_gb,
        traffic_used_percent: data.traffic_used_percent,
        is_unlimited: data.is_unlimited,
      });
      localStorage.setItem('traffic_refresh_ts', Date.now().toString());
      if (data.rate_limited && data.retry_after_seconds) {
        setTrafficRefreshCooldown(data.retry_after_seconds);
      } else {
        setTrafficRefreshCooldown(30);
      }
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (error: {
      response?: { status?: number; headers?: { get?: (key: string) => string } };
    }) => {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers?.get?.('Retry-After');
        setTrafficRefreshCooldown(retryAfter ? parseInt(retryAfter, 10) : 30);
      }
    },
  });

  return { trafficPurchaseMutation, updateCountriesMutation, refreshTrafficMutation };
};
