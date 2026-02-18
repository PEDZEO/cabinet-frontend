import apiClient from './client';

// ==================== User-facing types ====================

export interface WithdrawalBalanceResponse {
  total_earned: number;
  referral_spent: number;
  withdrawn: number;
  pending: number;
  available_referral: number;
  available_total: number;
  only_referral_mode: boolean;
  min_amount_kopeks: number;
  is_withdrawal_enabled: boolean;
  can_request: boolean;
  cannot_request_reason: string | null;
  requisites_text: string;
}

export interface WithdrawalCreateRequest {
  amount_kopeks: number;
  payment_details: string;
}

export interface WithdrawalItem {
  id: number;
  amount_kopeks: number;
  amount_rubles: number;
  status: string;
  payment_details: string | null;
  admin_comment: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface WithdrawalListResponse {
  items: WithdrawalItem[];
  total: number;
}

export interface WithdrawalCreateResponse {
  id: number;
  amount_kopeks: number;
  status: string;
}

// ==================== Admin-facing types ====================

export interface AdminWithdrawalItem {
  id: number;
  user_id: number;
  username: string | null;
  first_name: string | null;
  telegram_id: number | null;
  amount_kopeks: number;
  amount_rubles: number;
  status: string;
  risk_score: number;
  risk_level: string;
  payment_details: string | null;
  admin_comment: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface AdminWithdrawalListResponse {
  items: AdminWithdrawalItem[];
  total: number;
  pending_count: number;
  pending_total_kopeks: number;
}

export interface AdminWithdrawalDetailResponse {
  id: number;
  user_id: number;
  username: string | null;
  first_name: string | null;
  telegram_id: number | null;
  amount_kopeks: number;
  amount_rubles: number;
  status: string;
  risk_score: number;
  risk_level: string;
  risk_analysis: Record<string, unknown> | null;
  payment_details: string | null;
  admin_comment: string | null;
  balance_kopeks: number;
  total_referrals: number;
  total_earnings_kopeks: number;
  created_at: string;
  processed_at: string | null;
}

export const withdrawalApi = {
  // User endpoints
  getBalance: async (): Promise<WithdrawalBalanceResponse> => {
    const response = await apiClient.get<WithdrawalBalanceResponse>(
      '/cabinet/referral/withdrawal/balance',
    );
    return response.data;
  },

  create: async (data: WithdrawalCreateRequest): Promise<WithdrawalCreateResponse> => {
    const response = await apiClient.post<WithdrawalCreateResponse>(
      '/cabinet/referral/withdrawal/create',
      data,
    );
    return response.data;
  },

  getHistory: async (): Promise<WithdrawalListResponse> => {
    const response = await apiClient.get<WithdrawalListResponse>(
      '/cabinet/referral/withdrawal/history',
    );
    return response.data;
  },

  cancel: async (requestId: number): Promise<void> => {
    await apiClient.post(`/cabinet/referral/withdrawal/${requestId}/cancel`);
  },

  // Admin endpoints
  getAll: async (params?: {
    status?: string;
    offset?: number;
    limit?: number;
  }): Promise<AdminWithdrawalListResponse> => {
    const response = await apiClient.get<AdminWithdrawalListResponse>(
      '/cabinet/admin/withdrawals',
      { params },
    );
    return response.data;
  },

  getDetail: async (withdrawalId: number): Promise<AdminWithdrawalDetailResponse> => {
    const response = await apiClient.get<AdminWithdrawalDetailResponse>(
      `/cabinet/admin/withdrawals/${withdrawalId}`,
    );
    return response.data;
  },

  approve: async (withdrawalId: number, comment?: string): Promise<void> => {
    await apiClient.post(`/cabinet/admin/withdrawals/${withdrawalId}/approve`, { comment });
  },

  reject: async (withdrawalId: number, comment?: string): Promise<void> => {
    await apiClient.post(`/cabinet/admin/withdrawals/${withdrawalId}/reject`, { comment });
  },

  complete: async (withdrawalId: number): Promise<void> => {
    await apiClient.post(`/cabinet/admin/withdrawals/${withdrawalId}/complete`);
  },
};
