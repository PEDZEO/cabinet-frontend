import apiClient from './client';

export type MainMenuButtonActionType = 'url' | 'mini_app';
export type MainMenuButtonVisibility = 'all' | 'admins' | 'subscribers';

export interface MainMenuButtonResponse {
  id: number;
  text: string;
  action_type: MainMenuButtonActionType;
  action_value: string;
  visibility: MainMenuButtonVisibility;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MainMenuButtonListResponse {
  items: MainMenuButtonResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface MainMenuButtonCreateRequest {
  text: string;
  action_type: MainMenuButtonActionType;
  action_value: string;
  visibility: MainMenuButtonVisibility;
  is_active: boolean;
  display_order?: number;
}

export interface MainMenuButtonUpdateRequest {
  text?: string;
  action_type?: MainMenuButtonActionType;
  action_value?: string;
  visibility?: MainMenuButtonVisibility;
  is_active?: boolean;
  display_order?: number;
}

export const adminMainMenuButtonsApi = {
  list: async (limit = 200, offset = 0): Promise<MainMenuButtonListResponse> => {
    const response = await apiClient.get<MainMenuButtonListResponse>(
      '/cabinet/admin/main-menu/buttons',
      {
        params: { limit, offset },
      },
    );
    return response.data;
  },

  create: async (payload: MainMenuButtonCreateRequest): Promise<MainMenuButtonResponse> => {
    const response = await apiClient.post<MainMenuButtonResponse>(
      '/cabinet/admin/main-menu/buttons',
      payload,
    );
    return response.data;
  },

  update: async (
    id: number,
    payload: MainMenuButtonUpdateRequest,
  ): Promise<MainMenuButtonResponse> => {
    const response = await apiClient.patch<MainMenuButtonResponse>(
      `/cabinet/admin/main-menu/buttons/${id}`,
      payload,
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/cabinet/admin/main-menu/buttons/${id}`);
  },
};
