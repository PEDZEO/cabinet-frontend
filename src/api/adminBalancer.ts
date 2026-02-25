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
  fastest_group_name?: string;
  fastest_exclude_groups: string[];
  quarantine_nodes?: string[];
}

export interface BalancerQuarantineResponse {
  status: string;
  quarantine_nodes: string[];
  quarantine_count: number;
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
    try {
      const response = await apiClient.get('/cabinet/admin/balancer/ready');
      return response.data;
    } catch (error) {
      const maybeError = error as {
        response?: {
          status?: number;
          data?: {
            detail?: unknown;
          };
        };
      };
      const status = maybeError.response?.status;
      const detail = maybeError.response?.data?.detail;

      if (status === 503 && detail && typeof detail === 'object' && !Array.isArray(detail)) {
        return detail as Record<string, unknown>;
      }
      throw error;
    }
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
    fastest_group_name?: string;
    fastest_exclude_groups: string[];
  }): Promise<BalancerGroupsResponse> => {
    const response = await apiClient.put('/cabinet/admin/balancer/groups', payload);
    return response.data;
  },

  getQuarantine: async (): Promise<BalancerQuarantineResponse> => {
    const response = await apiClient.get('/cabinet/admin/balancer/quarantine');
    return response.data;
  },

  addQuarantine: async (node: string): Promise<BalancerQuarantineResponse> => {
    const response = await apiClient.post('/cabinet/admin/balancer/quarantine', { node });
    return response.data;
  },

  removeQuarantine: async (node: string): Promise<BalancerQuarantineResponse> => {
    const response = await apiClient.delete(
      `/cabinet/admin/balancer/quarantine/${encodeURIComponent(node)}`,
    );
    return response.data;
  },
};
