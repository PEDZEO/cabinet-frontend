import type { UserNodeUsageResponse } from '../../../api/adminUsers';

interface NodeUsageForPeriodItem {
  node_uuid: string;
  node_name: string;
  country_code: string | null;
  total_bytes: number;
}

export function buildNodeUsageForPeriod(
  nodeUsage: UserNodeUsageResponse | null,
  periodDays: number,
): NodeUsageForPeriodItem[] {
  if (!nodeUsage || nodeUsage.items.length === 0) {
    return [];
  }

  return nodeUsage.items
    .map((item) => {
      const daily = item.daily_bytes || [];
      const sliced = daily.slice(-periodDays);
      const total = sliced.reduce((sum, value) => sum + value, 0);
      return { ...item, total_bytes: total };
    })
    .sort((a, b) => b.total_bytes - a.total_bytes);
}
