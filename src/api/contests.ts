import apiClient from './client';

export interface ContestGamePayload {
  total?: number;
  grid_size?: number;
  secret?: string;
  flags?: string[];
  button_text?: string;
  question?: string;
  letters?: string;
  [key: string]: unknown;
}

export interface ContestInfo {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  prize_days: number;
  is_available: boolean;
  already_played: boolean;
}

export interface ContestGameData {
  round_id: number;
  game_type: string;
  // Dynamic game data from backend - shape depends on game_type
  game_data: ContestGamePayload;
  instructions: string;
}

export interface ContestResult {
  is_winner: boolean;
  message: string;
  prize_days?: number;
}

export interface ContestsCountResponse {
  count: number;
}

export const contestsApi = {
  // Get count of available contests
  getCount: async (): Promise<ContestsCountResponse> => {
    const response = await apiClient.get<ContestsCountResponse>('/cabinet/contests/count');
    return response.data;
  },

  // Get list of available contests
  getContests: async (): Promise<ContestInfo[]> => {
    const response = await apiClient.get<ContestInfo[]>('/cabinet/contests');
    return response.data;
  },

  // Get game data for a specific contest
  getContestGame: async (roundId: number): Promise<ContestGameData> => {
    const response = await apiClient.get<ContestGameData>(`/cabinet/contests/${roundId}`);
    return response.data;
  },

  // Submit answer for a contest
  submitAnswer: async (roundId: number, answer: string): Promise<ContestResult> => {
    const response = await apiClient.post<ContestResult>(`/cabinet/contests/${roundId}/answer`, {
      round_id: roundId,
      answer,
    });
    return response.data;
  },
};
