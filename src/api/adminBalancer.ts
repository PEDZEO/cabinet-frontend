import apiClient from './client';

export interface BalancerStatusResponse {
  configured: boolean;
  base_url: string | null;
  has_admin_token: boolean;
  request_timeout_sec: number;
}

export interface BalancerRuntimeStatsResponse {
  status: string;
  profile_mode?: string;
  runtime_stats?: Record<string, unknown>;
  circuit_breaker?: Record<string, unknown>;
}

export interface BalancerGroupsResponse {
  status: string;
  groups: Record<string, string[]>;
  fastest_group: boolean;
  fastest_exclude_groups: string[];
}

export const adminBalancerApi = {
  getStatus: async (): Promise<BalancerStatusResponse> => {
    const response = await apiClient.get('/cabinet/admin/balancer/status');
    return response.data;
  },

  getHealth: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get('/cabinet/admin/balancer/health');
    return response.data;
  },

  getReady: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get('/cabinet/admin/balancer/ready');
    return response.data;
  },

  getDebugStats: async (): Promise<BalancerRuntimeStatsResponse> => {
    const response = await apiClient.get('/cabinet/admin/balancer/debug/stats');
    return response.data;
  },

  getNodeStats: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get('/cabinet/admin/balancer/node-stats');
    return response.data;
  },

  getTokenDebug: async (token: string): Promise<Record<string, unknown>> => {
    const response = await apiClient.get('/cabinet/admin/balancer/debug/token', {
      params: { token },
    });
    return response.data;
  },

  refreshGroups: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.post('/cabinet/admin/balancer/refresh-groups');
    return response.data;
  },

  refreshStats: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.post('/cabinet/admin/balancer/refresh-stats');
    return response.data;
  },

  getGroups: async (): Promise<BalancerGroupsResponse> => {
    const response = await apiClient.get('/cabinet/admin/balancer/groups');
    return response.data;
  },

  updateGroups: async (payload: {
    groups: Record<string, string[]>;
    fastest_group: boolean;
    fastest_exclude_groups: string[];
  }): Promise<BalancerGroupsResponse> => {
    const response = await apiClient.put('/cabinet/admin/balancer/groups', payload);
    return response.data;
  },
};
