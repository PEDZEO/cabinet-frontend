import apiClient from './client';

// Types
export interface RequiredChannel {
  id: number;
  channel_id: string;
  channel_link: string | null;
  title: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface ChannelListResponse {
  items: RequiredChannel[];
  total: number;
}

export interface CreateChannelRequest {
  channel_id: string;
  channel_link?: string;
  title?: string;
}

export interface UpdateChannelRequest {
  channel_id?: string;
  channel_link?: string;
  title?: string;
  is_active?: boolean;
  sort_order?: number;
}

export const adminChannelsApi = {
  list: async (): Promise<ChannelListResponse> => {
    const { data } = await apiClient.get<ChannelListResponse>(
      '/cabinet/admin/channel-subscriptions',
    );
    return data;
  },

  create: async (req: CreateChannelRequest): Promise<RequiredChannel> => {
    const { data } = await apiClient.post<RequiredChannel>(
      '/cabinet/admin/channel-subscriptions',
      req,
    );
    return data;
  },

  update: async (id: number, req: UpdateChannelRequest): Promise<RequiredChannel> => {
    const { data } = await apiClient.patch<RequiredChannel>(
      `/cabinet/admin/channel-subscriptions/${id}`,
      req,
    );
    return data;
  },

  toggle: async (id: number): Promise<RequiredChannel> => {
    const { data } = await apiClient.post<RequiredChannel>(
      `/cabinet/admin/channel-subscriptions/${id}/toggle`,
    );
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/cabinet/admin/channel-subscriptions/${id}`);
  },
};

export default adminChannelsApi;
