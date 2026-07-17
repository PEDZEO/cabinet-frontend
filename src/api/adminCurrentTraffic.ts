import apiClient from './client';

export type CurrentTrafficStatus =
  | 'all'
  | 'current'
  | 'active'
  | 'trial'
  | 'expired'
  | 'disabled'
  | 'limited';

export type CurrentTrafficUsage =
  | 'all'
  | 'limited'
  | 'healthy'
  | 'warning'
  | 'exhausted'
  | 'unlimited';

export type CurrentTrafficSort =
  | 'user'
  | 'tariff'
  | 'status'
  | 'used'
  | 'limit'
  | 'remaining'
  | 'percent'
  | 'end_date';

export interface CurrentTrafficTariffOption {
  id: number;
  name: string;
}

export interface CurrentTrafficItem {
  user_id: number;
  telegram_id: number | null;
  username: string | null;
  email: string | null;
  full_name: string;
  tariff_id: number | null;
  tariff_name: string | null;
  subscription_status: string;
  is_trial: boolean;
  traffic_limit_gb: number;
  traffic_used_gb: number;
  traffic_remaining_gb: number | null;
  traffic_used_percent: number | null;
  is_unlimited: boolean;
  is_exhausted: boolean;
  metered_access_blocked: boolean;
  purchased_traffic_gb: number;
  device_bonus_traffic_gb: number;
  device_limit: number;
  traffic_reset_at: string | null;
  last_checked_at: string | null;
  end_date: string | null;
}

export interface CurrentTrafficStats {
  total: number;
  limited: number;
  unlimited: number;
  warning: number;
  exhausted: number;
  traffic_used_gb: number;
  traffic_limit_gb: number;
  traffic_remaining_gb: number;
  last_checked_at: string | null;
}

export interface CurrentTrafficResponse {
  items: CurrentTrafficItem[];
  stats: CurrentTrafficStats;
  tariffs: CurrentTrafficTariffOption[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  warning_percent: number;
}

export interface CurrentTrafficParams {
  page: number;
  page_size: number;
  search?: string;
  tariff_id?: number;
  status: CurrentTrafficStatus;
  usage: CurrentTrafficUsage;
  sort_by: CurrentTrafficSort;
  sort_desc: boolean;
}

export const adminCurrentTrafficApi = {
  getCurrentTraffic: async (params: CurrentTrafficParams): Promise<CurrentTrafficResponse> => {
    const response = await apiClient.get('/cabinet/admin/traffic/current', { params });
    return response.data;
  },
};
