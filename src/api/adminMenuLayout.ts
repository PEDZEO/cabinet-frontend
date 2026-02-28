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

const FALLBACK_DEFAULT_MENU_LAYOUT: MenuLayoutUpdateRequest = {
  rows: [
    {
      id: 'connect_row',
      buttons: ['connect'],
      max_per_row: 1,
      conditions: { has_active_subscription: true, subscription_is_active: true },
    },
    {
      id: 'subscription_row',
      buttons: ['subscription'],
      max_per_row: 1,
      conditions: { has_active_subscription: true },
    },
    {
      id: 'trial_buy_row',
      buttons: ['trial', 'buy_subscription'],
      max_per_row: 2,
      conditions: null,
    },
    {
      id: 'balance_row',
      buttons: ['balance'],
      max_per_row: 1,
      conditions: null,
    },
    {
      id: 'promo_referral_row',
      buttons: ['promocode', 'referrals'],
      max_per_row: 2,
      conditions: null,
    },
    {
      id: 'support_info_row',
      buttons: ['support', 'info'],
      max_per_row: 2,
      conditions: null,
    },
    {
      id: 'language_row',
      buttons: ['language'],
      max_per_row: 1,
      conditions: null,
    },
    {
      id: 'admin_row',
      buttons: ['admin_panel'],
      max_per_row: 1,
      conditions: { is_admin: true },
    },
  ],
  buttons: {
    connect: {
      type: 'builtin',
      builtin_id: 'connect',
      text: { ru: '🔗 Подключиться', en: '🔗 Connect' },
      action: 'subscription_connect',
      enabled: true,
      visibility: 'subscribers',
      conditions: { has_active_subscription: true, subscription_is_active: true },
      dynamic_text: false,
      open_mode: 'callback',
      webapp_url: null,
    },
    subscription: {
      type: 'builtin',
      builtin_id: 'subscription',
      text: { ru: '📊 Подписка', en: '📊 Subscription' },
      action: 'menu_subscription',
      enabled: true,
      visibility: 'subscribers',
      conditions: null,
      dynamic_text: false,
    },
    trial: {
      type: 'builtin',
      builtin_id: 'trial',
      text: { ru: '🎁 Пробный период', en: '🎁 Free trial' },
      action: 'menu_trial',
      enabled: true,
      visibility: 'all',
      conditions: { show_trial: true },
      dynamic_text: false,
    },
    buy_subscription: {
      type: 'builtin',
      builtin_id: 'buy_subscription',
      text: { ru: '🛒 Купить подписку', en: '🛒 Buy subscription' },
      action: 'menu_buy',
      enabled: true,
      visibility: 'all',
      conditions: { show_buy: true },
      dynamic_text: false,
    },
    balance: {
      type: 'builtin',
      builtin_id: 'balance',
      text: { ru: '💰 Баланс: {balance}', en: '💰 Balance: {balance}' },
      action: 'menu_balance',
      enabled: true,
      visibility: 'all',
      conditions: null,
      dynamic_text: true,
    },
    promocode: {
      type: 'builtin',
      builtin_id: 'promocode',
      text: { ru: '🎟️ Промокод', en: '🎟️ Promo code' },
      action: 'menu_promocode',
      enabled: true,
      visibility: 'all',
      conditions: null,
      dynamic_text: false,
    },
    referrals: {
      type: 'builtin',
      builtin_id: 'referrals',
      text: { ru: '👥 Рефералы', en: '👥 Referrals' },
      action: 'menu_referrals',
      enabled: true,
      visibility: 'all',
      conditions: { referral_enabled: true },
      dynamic_text: false,
    },
    support: {
      type: 'builtin',
      builtin_id: 'support',
      text: { ru: '💬 Поддержка', en: '💬 Support' },
      action: 'menu_support',
      enabled: true,
      visibility: 'all',
      conditions: { support_enabled: true },
      dynamic_text: false,
    },
    info: {
      type: 'builtin',
      builtin_id: 'info',
      text: { ru: 'ℹ️ Инфо', en: 'ℹ️ Info' },
      action: 'menu_info',
      enabled: true,
      visibility: 'all',
      conditions: null,
      dynamic_text: false,
    },
    language: {
      type: 'builtin',
      builtin_id: 'language',
      text: { ru: '🌐 Язык', en: '🌐 Language' },
      action: 'menu_language',
      enabled: true,
      visibility: 'all',
      conditions: null,
      dynamic_text: false,
    },
    admin_panel: {
      type: 'builtin',
      builtin_id: 'admin_panel',
      text: { ru: '⚙️ Админ', en: '⚙️ Admin' },
      action: 'admin_panel',
      enabled: true,
      visibility: 'admins',
      conditions: { is_admin: true },
      dynamic_text: false,
    },
  },
};

export const adminMenuLayoutApi = {
  get: async (): Promise<MenuLayoutResponse> => {
    const response = await apiClient.get<MenuLayoutResponse>('/cabinet/admin/menu-layout');
    return response.data;
  },

  update: async (payload: MenuLayoutUpdateRequest): Promise<MenuLayoutResponse> => {
    const response = await apiClient.put<MenuLayoutResponse>('/cabinet/admin/menu-layout', payload);
    return response.data;
  },

  reset: async (): Promise<MenuLayoutResponse> => {
    const response = await apiClient.post<MenuLayoutResponse>('/cabinet/admin/menu-layout/reset');
    return response.data;
  },

  resetWithFallback: async (): Promise<MenuLayoutResponse> => {
    try {
      return await adminMenuLayoutApi.reset();
    } catch {
      return adminMenuLayoutApi.update(FALLBACK_DEFAULT_MENU_LAYOUT);
    }
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
