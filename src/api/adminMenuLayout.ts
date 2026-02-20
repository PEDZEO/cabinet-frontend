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
};
