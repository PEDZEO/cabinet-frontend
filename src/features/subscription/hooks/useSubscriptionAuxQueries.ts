import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { subscriptionApi } from '@/api/subscription';
import type { Subscription } from '@/types';

type UseSubscriptionAuxQueriesParams = {
  devicesToAdd: number;
  showDeviceTopup: boolean;
  showDeviceReduction: boolean;
  showServerManagement: boolean;
  subscription: Subscription | null;
  setTargetDeviceLimit: (value: number) => void;
  setSelectedServersToUpdate: (value: string[]) => void;
};

export const useSubscriptionAuxQueries = ({
  devicesToAdd,
  showDeviceTopup,
  showDeviceReduction,
  showServerManagement,
  subscription,
  setTargetDeviceLimit,
  setSelectedServersToUpdate,
}: UseSubscriptionAuxQueriesParams) => {
  const { data: devicePriceData } = useQuery({
    queryKey: ['device-price', devicesToAdd],
    queryFn: () => subscriptionApi.getDevicePrice(devicesToAdd),
    enabled: showDeviceTopup && !!subscription,
  });

  const { data: deviceReductionInfo } = useQuery({
    queryKey: ['device-reduction-info'],
    queryFn: subscriptionApi.getDeviceReductionInfo,
    enabled: showDeviceReduction && !!subscription,
  });

  useEffect(() => {
    if (deviceReductionInfo && showDeviceReduction) {
      setTargetDeviceLimit(
        Math.max(
          deviceReductionInfo.min_device_limit,
          deviceReductionInfo.current_device_limit - 1,
        ),
      );
    }
  }, [deviceReductionInfo, showDeviceReduction, setTargetDeviceLimit]);

  const { data: countriesData, isLoading: countriesLoading } = useQuery({
    queryKey: ['countries'],
    queryFn: subscriptionApi.getCountries,
    enabled: showServerManagement && !!subscription && !subscription.is_trial,
  });

  useEffect(() => {
    if (countriesData && showServerManagement) {
      const connected = countriesData.countries.filter((c) => c.is_connected).map((c) => c.uuid);
      setSelectedServersToUpdate(connected);
    }
  }, [countriesData, showServerManagement, setSelectedServersToUpdate]);

  return { devicePriceData, deviceReductionInfo, countriesData, countriesLoading };
};
