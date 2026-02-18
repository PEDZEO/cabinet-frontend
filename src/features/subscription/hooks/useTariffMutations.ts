import { useMutation, type QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { subscriptionApi } from '@/api/subscription';
import type { Tariff, TariffPeriod } from '@/types';

type UseTariffMutationsParams = {
  queryClient: QueryClient;
  tariffs: Tariff[];
  switchTariffId: number | null;
  selectedTariff: Tariff | null;
  selectedTariffPeriod: TariffPeriod | null;
  useCustomDays: boolean;
  useCustomTraffic: boolean;
  customDays: number;
  customTrafficGb: number;
  setSwitchTariffId: (value: number | null) => void;
  setSelectedTariff: (value: Tariff | null) => void;
  setSelectedTariffPeriod: (value: TariffPeriod | null) => void;
  setShowTariffPurchase: (value: boolean) => void;
  setUseCustomDays: (value: boolean) => void;
  setUseCustomTraffic: (value: boolean) => void;
};

export const useTariffMutations = ({
  queryClient,
  tariffs,
  switchTariffId,
  selectedTariff,
  selectedTariffPeriod,
  useCustomDays,
  useCustomTraffic,
  customDays,
  customTrafficGb,
  setSwitchTariffId,
  setSelectedTariff,
  setSelectedTariffPeriod,
  setShowTariffPurchase,
  setUseCustomDays,
  setUseCustomTraffic,
}: UseTariffMutationsParams) => {
  const switchTariffMutation = useMutation({
    mutationFn: (tariffId: number) => subscriptionApi.switchTariff(tariffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
      setSwitchTariffId(null);
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        const detail = error.response?.data?.detail;
        if (
          typeof detail === 'object' &&
          detail?.error_code === 'subscription_expired' &&
          detail?.use_purchase_flow === true
        ) {
          const targetTariff = tariffs.find((t) => t.id === switchTariffId);
          if (targetTariff) {
            setSwitchTariffId(null);
            setSelectedTariff(targetTariff);
            setSelectedTariffPeriod(targetTariff.periods[0] || null);
            setShowTariffPurchase(true);
            queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
          }
        }
      }
    },
  });

  const tariffPurchaseMutation = useMutation({
    mutationFn: () => {
      if (!selectedTariff) {
        throw new Error('Tariff not selected');
      }
      const isDailyTariff =
        selectedTariff.is_daily ||
        (selectedTariff.daily_price_kopeks && selectedTariff.daily_price_kopeks > 0);
      const days = isDailyTariff
        ? 1
        : useCustomDays
          ? customDays
          : selectedTariffPeriod?.days || 30;
      const trafficGb =
        useCustomTraffic && selectedTariff.custom_traffic_enabled ? customTrafficGb : undefined;
      return subscriptionApi.purchaseTariff(selectedTariff.id, days, trafficGb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
      setShowTariffPurchase(false);
      setSelectedTariff(null);
      setSelectedTariffPeriod(null);
      setUseCustomDays(false);
      setUseCustomTraffic(false);
    },
  });

  return { switchTariffMutation, tariffPurchaseMutation };
};
