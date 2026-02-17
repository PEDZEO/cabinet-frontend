import { useCallback, useMemo, useState } from 'react';
import {
  adminUsersApi,
  type UserAvailableTariff,
  type UserNodeUsageResponse,
  type UserPanelInfo,
} from '../../../api/adminUsers';

interface UseAdminUserSubscriptionDataParams {
  userId: number | null;
  subscriptionTariffId: number | null;
}

export function useAdminUserSubscriptionData({
  userId,
  subscriptionTariffId,
}: UseAdminUserSubscriptionDataParams) {
  const [tariffs, setTariffs] = useState<UserAvailableTariff[]>([]);
  const [panelInfo, setPanelInfo] = useState<UserPanelInfo | null>(null);
  const [panelInfoLoading, setPanelInfoLoading] = useState(false);
  const [nodeUsage, setNodeUsage] = useState<UserNodeUsageResponse | null>(null);
  const [nodeUsageDays, setNodeUsageDays] = useState(7);
  const [devices, setDevices] = useState<
    { hwid: string; platform: string; device_model: string; created_at: string | null }[]
  >([]);
  const [devicesTotal, setDevicesTotal] = useState(0);
  const [deviceLimit, setDeviceLimit] = useState(0);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const loadTariffs = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const data = await adminUsersApi.getAvailableTariffs(userId, true);
      setTariffs(data.tariffs);
    } catch (error) {
      console.error('Failed to load tariffs:', error);
    }
  }, [userId]);

  const loadPanelInfo = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      setPanelInfoLoading(true);
      const data = await adminUsersApi.getPanelInfo(userId);
      setPanelInfo(data);
    } catch {
      // ignore
    } finally {
      setPanelInfoLoading(false);
    }
  }, [userId]);

  const loadNodeUsage = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const data = await adminUsersApi.getNodeUsage(userId);
      setNodeUsage(data);
    } catch {
      // ignore
    }
  }, [userId]);

  const loadDevices = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      setDevicesLoading(true);
      const data = await adminUsersApi.getUserDevices(userId);
      setDevices(data.devices);
      setDevicesTotal(data.total);
      setDeviceLimit(data.device_limit);
    } catch {
      // ignore
    } finally {
      setDevicesLoading(false);
    }
  }, [userId]);

  const loadSubscriptionData = useCallback(async () => {
    await Promise.all([loadPanelInfo(), loadNodeUsage(), loadDevices()]);
  }, [loadDevices, loadNodeUsage, loadPanelInfo]);

  const currentTariff = useMemo(
    () => tariffs.find((tariff) => tariff.id === subscriptionTariffId) || null,
    [subscriptionTariffId, tariffs],
  );

  return {
    tariffs,
    panelInfo,
    panelInfoLoading,
    nodeUsage,
    nodeUsageDays,
    setNodeUsageDays,
    devices,
    devicesTotal,
    deviceLimit,
    devicesLoading,
    loadTariffs,
    loadSubscriptionData,
    loadDevices,
    currentTariff,
  };
}
