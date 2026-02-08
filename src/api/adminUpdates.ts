import apiClient from './client';

// ============ Types ============

export interface ReleaseItem {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  prerelease: boolean;
}

export interface ProjectReleasesInfo {
  current_version: string;
  has_updates: boolean;
  releases: ReleaseItem[];
  repo_url: string;
}

export interface ReleasesResponse {
  bot: ProjectReleasesInfo;
  cabinet: ProjectReleasesInfo;
}

// ============ API ============

export const adminUpdatesApi = {
  getReleases: async (): Promise<ReleasesResponse> => {
    const response = await apiClient.get('/cabinet/admin/updates/releases');
    return response.data;
  },
};
