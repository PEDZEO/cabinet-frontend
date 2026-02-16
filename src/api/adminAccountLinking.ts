import apiClient from './client';

export interface AdminManualMergeItem {
  ticket_id: number;
  status: string;
  decision: 'approve' | 'reject' | null;
  created_at: string;
  updated_at: string;
  requester_user_id: number;
  source_user_id: number | null;
  current_user_id: number | null;
  requester_identity_hints: Record<string, string>;
  source_identity_hints: Record<string, string>;
  user_comment: string | null;
  resolution_comment: string | null;
}

export interface AdminManualMergeListResponse {
  items: AdminManualMergeItem[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface AdminManualMergeResolveRequest {
  action: 'approve' | 'reject';
  primary_user_id?: number;
  comment?: string;
}

export const adminAccountLinkingApi = {
  getManualMerges: async (params: {
    state?: 'pending' | 'approved' | 'rejected' | 'all';
    page?: number;
    per_page?: number;
  }): Promise<AdminManualMergeListResponse> => {
    const response = await apiClient.get<AdminManualMergeListResponse>(
      '/cabinet/admin/account-linking/manual-merges',
      { params },
    );
    return response.data;
  },

  resolveManualMerge: async (
    ticketId: number,
    payload: AdminManualMergeResolveRequest,
  ): Promise<AdminManualMergeItem> => {
    const response = await apiClient.post<AdminManualMergeItem>(
      `/cabinet/admin/account-linking/manual-merges/${ticketId}/resolve`,
      payload,
    );
    return response.data;
  },
};
