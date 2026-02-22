import { apiClient } from './client';

export type MenuButtonType = 'builtin' | 'url' | 'mini_app' | 'callback';
export type MenuButtonVisibility = 'all' | 'admins' | 'moderators' | 'subscribers';

export interface MenuRowConfig {
  id: string;
  buttons: string[];
  max_per_row: number;
  conditions?: Record<string, unknown> | null;
}

export interface MenuButtonConfig {
  type: MenuButtonType;
  builtin_id?: string | null;
  text: Record<string, string>;
  icon?: string | null;
  action: string;
  enabled: boolean;
  visibility: MenuButtonVisibility;
  conditions?: Record<string, unknown> | null;
  dynamic_text?: boolean;
  open_mode?: 'callback' | 'direct';
  webapp_url?: string | null;
  description?: string | null;
  sort_order?: number | null;
}

export interface MenuLayoutResponse {
  version: number;
  rows: MenuRowConfig[];
  buttons: Record<string, MenuButtonConfig>;
  is_enabled: boolean;
  updated_at: string | null;
}

export interface MenuLayoutUpdateRequest {
  rows?: MenuRowConfig[];
  buttons?: Record<string, MenuButtonConfig>;
}

export interface MenuButtonUpdateRequest {
  text?: Record<string, string>;
  icon?: string | null;
  action?: string;
  open_mode?: 'callback' | 'direct';
  webapp_url?: string | null;
  enabled?: boolean;
  visibility?: MenuButtonVisibility;
  conditions?: Record<string, unknown> | null;
  description?: string | null;
}

export interface MenuClickStats {
  button_id: string;
  clicks_total: number;
  clicks_today: number;
  clicks_week: number;
  clicks_month: number;
  last_click_at: string | null;
  unique_users: number;
}

export interface MenuClickStatsResponse {
  items: MenuClickStats[];
  total_clicks: number;
  period_start: string;
  period_end: string;
}

export interface ButtonClickStatsResponse {
  button_id: string;
  stats: MenuClickStats;
  clicks_by_day: Array<{ date: string; count: number }>;
}

export interface ButtonTypeStatsResponse {
  items: Array<{
    button_type: string;
    clicks_total: number;
    unique_users: number;
  }>;
  total_clicks: number;
}

export interface HourlyStatsResponse {
  items: Array<{ hour: number; count: number }>;
  button_id: string | null;
}

export interface WeekdayStatsResponse {
  items: Array<{ weekday: number; weekday_name: string; count: number }>;
  button_id: string | null;
}

export interface TopUsersResponse {
  items: Array<{
    user_id: number;
    clicks_count: number;
    last_click_at: string | null;
  }>;
  button_id: string | null;
  limit: number;
}

export interface PeriodComparisonResponse {
  current_period: Record<string, unknown>;
  previous_period: Record<string, unknown>;
  change: Record<string, unknown>;
  button_id: string | null;
}

export interface UserClickSequencesResponse {
  user_id: number;
  items: Array<{
    button_id: string;
    button_text: string | null;
    clicked_at: string;
  }>;
  total: number;
}

export const adminMenuLayoutApi = {
  get: async (): Promise<MenuLayoutResponse> => {
    const response = await apiClient.get<MenuLayoutResponse>('/cabinet/admin/menu-layout');
    return response.data;
  },

  update: async (payload: MenuLayoutUpdateRequest): Promise<MenuLayoutResponse> => {
    const response = await apiClient.put<MenuLayoutResponse>('/cabinet/admin/menu-layout', payload);
    return response.data;
  },

  updateButton: async (
    buttonId: string,
    payload: MenuButtonUpdateRequest,
  ): Promise<MenuButtonConfig> => {
    const response = await apiClient.patch<MenuButtonConfig>(
      `/cabinet/admin/menu-layout/buttons/${encodeURIComponent(buttonId)}`,
      payload,
    );
    return response.data;
  },

  getStats: async (days = 30): Promise<MenuClickStatsResponse> => {
    const response = await apiClient.get<MenuClickStatsResponse>(
      '/cabinet/admin/menu-layout/stats',
      {
        params: { days },
      },
    );
    return response.data;
  },

  getButtonStats: async (buttonId: string, days = 30): Promise<ButtonClickStatsResponse> => {
    const response = await apiClient.get<ButtonClickStatsResponse>(
      `/cabinet/admin/menu-layout/stats/buttons/${encodeURIComponent(buttonId)}`,
      { params: { days } },
    );
    return response.data;
  },

  getStatsByType: async (days = 30): Promise<ButtonTypeStatsResponse> => {
    const response = await apiClient.get<ButtonTypeStatsResponse>(
      '/cabinet/admin/menu-layout/stats/by-type',
      { params: { days } },
    );
    return response.data;
  },

  getStatsByHour: async (days = 30, buttonId?: string): Promise<HourlyStatsResponse> => {
    const response = await apiClient.get<HourlyStatsResponse>(
      '/cabinet/admin/menu-layout/stats/by-hour',
      {
        params: { days, button_id: buttonId || undefined },
      },
    );
    return response.data;
  },

  getStatsByWeekday: async (days = 30, buttonId?: string): Promise<WeekdayStatsResponse> => {
    const response = await apiClient.get<WeekdayStatsResponse>(
      '/cabinet/admin/menu-layout/stats/by-weekday',
      { params: { days, button_id: buttonId || undefined } },
    );
    return response.data;
  },

  getTopUsers: async (days = 30, limit = 10, buttonId?: string): Promise<TopUsersResponse> => {
    const response = await apiClient.get<TopUsersResponse>(
      '/cabinet/admin/menu-layout/stats/top-users',
      {
        params: { days, limit, button_id: buttonId || undefined },
      },
    );
    return response.data;
  },

  getPeriodComparison: async (
    currentDays = 7,
    previousDays = 7,
    buttonId?: string,
  ): Promise<PeriodComparisonResponse> => {
    const response = await apiClient.get<PeriodComparisonResponse>(
      '/cabinet/admin/menu-layout/stats/compare',
      {
        params: {
          current_days: currentDays,
          previous_days: previousDays,
          button_id: buttonId || undefined,
        },
      },
    );
    return response.data;
  },

  getUserSequences: async (userId: number, limit = 50): Promise<UserClickSequencesResponse> => {
    const response = await apiClient.get<UserClickSequencesResponse>(
      `/cabinet/admin/menu-layout/stats/users/${userId}/sequences`,
      { params: { limit } },
    );
    return response.data;
  },
};
