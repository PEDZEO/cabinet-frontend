import { useMutation, type QueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '@/api/subscription';

type UseDeviceManagementMutationsParams = {
  queryClient: QueryClient;
  devicesToAdd: number;
  targetDeviceLimit: number;
  setShowDeviceTopup: (value: boolean) => void;
  setDevicesToAdd: (value: number) => void;
  setShowDeviceReduction: (value: boolean) => void;
};

export const useDeviceManagementMutations = ({
  queryClient,
  devicesToAdd,
  targetDeviceLimit,
  setShowDeviceTopup,
  setDevicesToAdd,
  setShowDeviceReduction,
}: UseDeviceManagementMutationsParams) => {
  const devicePurchaseMutation = useMutation({
    mutationFn: () => subscriptionApi.purchaseDevices(devicesToAdd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setShowDeviceTopup(false);
      setDevicesToAdd(1);
    },
  });

  const deviceReductionMutation = useMutation({
    mutationFn: () => subscriptionApi.reduceDevices(targetDeviceLimit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['device-reduction-info'] });
      setShowDeviceReduction(false);
    },
  });

  return { devicePurchaseMutation, deviceReductionMutation };
};
