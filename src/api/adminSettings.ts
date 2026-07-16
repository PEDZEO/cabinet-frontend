import apiClient from './client';

export interface SettingCategoryRef {
  key: string;
  label: string;
}

export interface SettingCategorySummary {
  key: string;
  label: string;
  description: string;
  items: number;
}

export interface SettingChoice {
  value: unknown;
  label: string;
  description?: string | null;
}

export interface SettingHint {
  description: string;
  format: string;
  example: string;
  warning: string;
}

export interface SettingDefinition {
  key: string;
  name: string;
  category: SettingCategoryRef;
  type: string;
  is_optional: boolean;
  current: unknown;
  original: unknown;
  has_override: boolean;
  read_only: boolean;
  choices: SettingChoice[];
  hint?: SettingHint | null;
}

export interface MeteredTrafficStatus {
  enabled: boolean;
  running: boolean;
  squad_uuid: string;
  node_uuids?: string[];
  interval_seconds: number;
  last_run_at: string | null;
  last_error: string | null;
  topology_errors?: string[];
  last_stats?: MeteredTrafficRunStats;
  subscriptions: {
    active: number;
    initialized: number;
    blocked: number;
  };
}

export interface MeteredTrafficRunStats {
  checked: number;
  initialized: number;
  warned: number;
  blocked: number;
  restored: number;
  reconciled: number;
  errors: number;
  skipped: boolean;
}

export interface MeteredTrafficConfiguration {
  enabled: boolean;
  squad_uuid: string;
  metered_node_uuids: string[];
  check_interval_seconds: number;
  warning_percent: number;
  server_label: string;
  exhausted_message_ru: string;
}

export interface MeteredTrafficSquad {
  uuid: string;
  name: string;
  members_count: number;
  inbounds_count: number;
}

export interface MeteredTrafficNode {
  uuid: string;
  name: string;
  address: string;
  country_code?: string | null;
  is_connected: boolean;
  is_disabled: boolean;
  consumption_multiplier: number;
}

export interface MeteredTrafficConfigurationResponse {
  configuration: MeteredTrafficConfiguration;
  status: MeteredTrafficStatus;
  squads: MeteredTrafficSquad[];
  nodes: MeteredTrafficNode[];
  topology_errors: string[];
  nodes_updated: number;
}

export interface MeteredTrafficRunResponse extends MeteredTrafficStatus {
  run: MeteredTrafficRunStats;
}

export interface MeteredTrafficExhaustedUser {
  user_id: number;
  subscription_id: number;
  telegram_id: number | null;
  username: string | null;
  email: string | null;
  full_name: string;
  tariff_name: string | null;
  traffic_limit_gb: number;
  traffic_used_gb: number;
  purchased_traffic_gb: number;
  blocked_at: string | null;
  last_checked_at: string | null;
  subscription_end_date: string;
}

export interface MeteredTrafficExhaustedUsersResponse {
  items: MeteredTrafficExhaustedUser[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export const adminSettingsApi = {
  // Get list of setting categories
  getCategories: async (): Promise<SettingCategorySummary[]> => {
    const response = await apiClient.get<SettingCategorySummary[]>(
      '/cabinet/admin/settings/categories',
    );
    return response.data;
  },

  // Get all settings or settings for a specific category
  getSettings: async (categoryKey?: string): Promise<SettingDefinition[]> => {
    const params = categoryKey ? { category_key: categoryKey } : {};
    const response = await apiClient.get<SettingDefinition[]>('/cabinet/admin/settings', {
      params,
    });
    return response.data;
  },

  // Get a specific setting by key
  getSetting: async (key: string): Promise<SettingDefinition> => {
    const response = await apiClient.get<SettingDefinition>(`/cabinet/admin/settings/${key}`);
    return response.data;
  },

  // Update a setting value
  updateSetting: async (key: string, value: unknown): Promise<SettingDefinition> => {
    const response = await apiClient.put<SettingDefinition>(`/cabinet/admin/settings/${key}`, {
      value,
    });
    return response.data;
  },

  // Reset a setting to default
  resetSetting: async (key: string): Promise<SettingDefinition> => {
    const response = await apiClient.delete<SettingDefinition>(`/cabinet/admin/settings/${key}`);
    return response.data;
  },

  getMeteredTrafficStatus: async (): Promise<MeteredTrafficStatus> => {
    const response = await apiClient.get<MeteredTrafficStatus>(
      '/cabinet/admin/settings/metered-traffic/status',
    );
    return response.data;
  },

  getMeteredTrafficConfiguration: async (): Promise<MeteredTrafficConfigurationResponse> => {
    const response = await apiClient.get<MeteredTrafficConfigurationResponse>(
      '/cabinet/admin/settings/metered-traffic/configuration',
    );
    return response.data;
  },

  getMeteredTrafficExhaustedUsers: async (params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<MeteredTrafficExhaustedUsersResponse> => {
    const response = await apiClient.get<MeteredTrafficExhaustedUsersResponse>(
      '/cabinet/admin/settings/metered-traffic/exhausted-users',
      { params },
    );
    return response.data;
  },

  updateMeteredTrafficConfiguration: async (
    configuration: MeteredTrafficConfiguration,
  ): Promise<MeteredTrafficConfigurationResponse> => {
    const response = await apiClient.put<MeteredTrafficConfigurationResponse>(
      '/cabinet/admin/settings/metered-traffic/configuration',
      configuration,
    );
    return response.data;
  },

  runMeteredTrafficCheck: async (): Promise<MeteredTrafficRunResponse> => {
    const response = await apiClient.post<MeteredTrafficRunResponse>(
      '/cabinet/admin/settings/metered-traffic/run',
    );
    return response.data;
  },
};
