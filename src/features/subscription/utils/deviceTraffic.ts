import type { Tariff } from '@/types';

export type DeviceTrafficBreakdown = {
  extraDevices: number;
  trafficPerExtraDeviceGb: number;
  bonusTrafficGb: number;
  totalTrafficGb: number;
};

export const getDeviceTrafficBreakdown = (
  tariff: Tariff,
  selectedDeviceLimit: number,
): DeviceTrafficBreakdown => {
  const baseDeviceLimit = Math.max(1, tariff.base_device_limit ?? tariff.device_limit ?? 1);
  const extraDevices = Math.max(0, Math.floor(selectedDeviceLimit) - baseDeviceLimit);
  const trafficPerExtraDeviceGb = Math.max(0, Math.floor(tariff.device_traffic_gb ?? 0));
  const isUnlimited = tariff.is_unlimited_traffic || tariff.traffic_limit_gb <= 0;
  const bonusTrafficGb = isUnlimited ? 0 : extraDevices * trafficPerExtraDeviceGb;
  const totalTrafficGb = isUnlimited ? 0 : Math.max(0, tariff.traffic_limit_gb) + bonusTrafficGb;

  return {
    extraDevices,
    trafficPerExtraDeviceGb,
    bonusTrafficGb,
    totalTrafficGb,
  };
};
