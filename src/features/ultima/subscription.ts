import type { Subscription, Tariff, TariffPeriod } from '@/types';

export type UltimaDisplayPeriod = TariffPeriod & {
  tariffId: number;
  deviceLimit: number;
};

export const getUltimaBaseDeviceLimit = (tariff: Tariff): number =>
  Math.max(1, tariff.base_device_limit ?? tariff.device_limit ?? 1);

export const getUltimaTariffMaxDeviceLimit = (
  tariff: Tariff,
  currentSubscriptionLimit: number,
): number => {
  const baseLimit = getUltimaBaseDeviceLimit(tariff);
  const periodMaxLimit = tariff.periods.reduce((maxLimit, period) => {
    const extraDevices = Math.max(0, period.extra_devices_count ?? tariff.extra_devices_count ?? 0);
    return Math.max(maxLimit, baseLimit + extraDevices);
  }, baseLimit);

  if (tariff.is_current) {
    return Math.max(
      periodMaxLimit,
      tariff.max_device_limit ?? periodMaxLimit,
      currentSubscriptionLimit,
    );
  }

  return Math.max(periodMaxLimit, tariff.max_device_limit ?? periodMaxLimit);
};

export const getUltimaDeviceLimitsForTariff = (
  tariff: Tariff,
  subscription: Subscription | null,
): number[] => {
  const baseLimit = getUltimaBaseDeviceLimit(tariff);
  const currentSubscriptionLimit = Math.max(1, subscription?.device_limit ?? 1);
  const minLimit = tariff.is_current ? Math.max(baseLimit, currentSubscriptionLimit) : baseLimit;
  const maxLimit = getUltimaTariffMaxDeviceLimit(tariff, currentSubscriptionLimit);

  return Array.from(
    { length: Math.max(1, maxLimit - minLimit + 1) },
    (_, index) => minLimit + index,
  );
};

export const getUltimaPeriodsForDeviceLimit = (
  tariff: Tariff,
  deviceLimit: number,
): UltimaDisplayPeriod[] => {
  const baseLimit = getUltimaBaseDeviceLimit(tariff);
  const grouped = new Map<number, UltimaDisplayPeriod[]>();

  tariff.periods
    .filter((period) => period.days > 0)
    .forEach((period) => {
      const extraDevices = Math.max(
        0,
        period.extra_devices_count ?? tariff.extra_devices_count ?? 0,
      );
      const resolvedDeviceLimit = baseLimit + extraDevices;
      const list = grouped.get(resolvedDeviceLimit) ?? [];
      list.push({ ...period, tariffId: tariff.id, deviceLimit: resolvedDeviceLimit });
      grouped.set(resolvedDeviceLimit, list);
    });

  if (!grouped.size) {
    return [];
  }

  const exact = grouped.get(deviceLimit) ?? [];
  const source =
    exact.length > 0
      ? exact
      : ([...grouped.entries()].sort(
          ([leftLimit], [rightLimit]) =>
            Math.abs(leftLimit - deviceLimit) - Math.abs(rightLimit - deviceLimit),
        )[0]?.[1] ?? []);

  const bestByDays = new Map<number, UltimaDisplayPeriod>();
  source.forEach((period) => {
    const existing = bestByDays.get(period.days);
    if (!existing || period.price_kopeks < existing.price_kopeks) {
      bestByDays.set(period.days, period);
    }
  });

  return [...bestByDays.values()].sort(
    (left, right) =>
      left.months - right.months ||
      left.days - right.days ||
      left.price_kopeks - right.price_kopeks,
  );
};

export const getSortedUltimaTariffs = (
  tariffs: Tariff[],
  subscription: Subscription | null,
): Tariff[] =>
  [...tariffs]
    .filter((tariff) => tariff.is_available)
    .sort((left, right) => {
      const leftIsCurrent = left.is_current || left.id === subscription?.tariff_id;
      const rightIsCurrent = right.is_current || right.id === subscription?.tariff_id;
      if (leftIsCurrent && !rightIsCurrent) return -1;
      if (!leftIsCurrent && rightIsCurrent) return 1;
      if (left.tier_level !== right.tier_level) return left.tier_level - right.tier_level;
      return left.id - right.id;
    });

export const isUltimaTariffUnlimited = (tariff: Tariff): boolean =>
  tariff.is_unlimited_traffic || tariff.traffic_limit_gb <= 0;

export const canUltimaTariffTopUpTraffic = (tariff: Tariff): boolean =>
  !isUltimaTariffUnlimited(tariff) && tariff.traffic_topup_enabled !== false;
