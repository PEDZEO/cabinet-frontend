import apiClient from './client';
import type {
  NewsArticle,
  NewsListResponse,
  NewsCreateRequest,
  NewsUpdateRequest,
} from '../types/news';

export const newsApi = {
  // User endpoints
  getNews: async (params?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<NewsListResponse> => {
    const response = await apiClient.get<NewsListResponse>('/cabinet/news', { params });
    return response.data;
  },

  getArticle: async (slug: string): Promise<NewsArticle> => {
    const response = await apiClient.get<NewsArticle>(`/cabinet/news/${slug}`);
    return response.data;
  },

  // Admin endpoints
  getAdminNews: async (params?: { limit?: number; offset?: number }): Promise<NewsListResponse> => {
    const response = await apiClient.get<NewsListResponse>('/cabinet/admin/news', { params });
    return response.data;
  },

  getAdminArticle: async (id: number): Promise<NewsArticle> => {
    const response = await apiClient.get<NewsArticle>(`/cabinet/admin/news/${id}`);
    return response.data;
  },

  createArticle: async (data: NewsCreateRequest): Promise<NewsArticle> => {
    const response = await apiClient.post<NewsArticle>('/cabinet/admin/news', data);
    return response.data;
  },

  updateArticle: async (id: number, data: NewsUpdateRequest): Promise<NewsArticle> => {
    const response = await apiClient.put<NewsArticle>(`/cabinet/admin/news/${id}`, data);
    return response.data;
  },

  deleteArticle: async (id: number): Promise<void> => {
    await apiClient.delete(`/cabinet/admin/news/${id}`);
  },

  togglePublish: async (id: number): Promise<NewsArticle> => {
    const response = await apiClient.post<NewsArticle>(`/cabinet/admin/news/${id}/publish`);
    return response.data;
  },

  toggleFeatured: async (id: number): Promise<NewsArticle> => {
    const response = await apiClient.post<NewsArticle>(`/cabinet/admin/news/${id}/feature`);
    return response.data;
  },
};
