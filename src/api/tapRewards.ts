import apiClient from './client';

export interface TapRewardResponse {
  enabled: boolean;
  total_taps: number;
  progress_taps: number;
  threshold: number;
  taps_until_next: number;
  streak_timeout_seconds: number;
  rewards_granted_total: number;
  daily_reward_limit: number;
  daily_rewards_granted: number;
  daily_limit_reached: boolean;
  reward_granted: boolean;
  reward_type?: 'balance' | 'subscription_days' | string | null;
  reward_value?: number | null;
  message?: string | null;
  balance_kopeks?: number | null;
  subscription_end_date?: string | null;
}

export const tapRewardsApi = {
  getProgress: async (): Promise<TapRewardResponse> => {
    const response = await apiClient.get<TapRewardResponse>('/cabinet/tap-rewards/progress');
    return response.data;
  },

  recordTap: async (): Promise<TapRewardResponse> => {
    const response = await apiClient.post<TapRewardResponse>('/cabinet/tap-rewards/tap', {
      count: 1,
    });
    return response.data;
  },
};
