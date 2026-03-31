import apiClient from './client';
import type {
  NewsArticle,
  NewsListResponse,
  NewsCreateRequest,
  NewsUpdateRequest,
  NewsMediaUploadResponse,
} from '../types/news';

function getNewsAssetBaseUrl(): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  if (typeof apiBaseUrl === 'string' && /^https?:\/\//i.test(apiBaseUrl)) {
    try {
      return new URL(apiBaseUrl).origin;
    } catch {
      // Fall through to browser origin.
    }
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost';
}

export function normalizeNewsMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url, getNewsAssetBaseUrl());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }

    // Uploaded news media can be stored as absolute HTTP URLs from a backend
    // running behind TLS termination. Upgrade them client-side to avoid mixed
    // content blocking in secure mobile webviews.
    if (
      parsed.protocol === 'http:' &&
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:'
    ) {
      parsed.protocol = 'https:';
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizeNewsArticle(article: NewsArticle): NewsArticle {
  return {
    ...article,
    featured_image_url: normalizeNewsMediaUrl(article.featured_image_url),
  };
}

function normalizeNewsListResponse(response: NewsListResponse): NewsListResponse {
  return {
    ...response,
    items: response.items.map((item) => ({
      ...item,
      featured_image_url: normalizeNewsMediaUrl(item.featured_image_url),
    })),
  };
}

function normalizeNewsMediaUploadResponse(
  response: NewsMediaUploadResponse,
): NewsMediaUploadResponse {
  return {
    ...response,
    url: normalizeNewsMediaUrl(response.url) ?? response.url,
    thumbnail_url: normalizeNewsMediaUrl(response.thumbnail_url),
  };
}

export const newsApi = {
  // User endpoints
  getNews: async (params?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<NewsListResponse> => {
    const response = await apiClient.get<NewsListResponse>('/cabinet/news', { params });
    return normalizeNewsListResponse(response.data);
  },

  getArticle: async (slug: string): Promise<NewsArticle> => {
    const response = await apiClient.get<NewsArticle>(`/cabinet/news/${encodeURIComponent(slug)}`);
    return normalizeNewsArticle(response.data);
  },

  // Admin endpoints
  getAdminNews: async (params?: { limit?: number; offset?: number }): Promise<NewsListResponse> => {
    const response = await apiClient.get<NewsListResponse>('/cabinet/admin/news', { params });
    return normalizeNewsListResponse(response.data);
  },

  getAdminArticle: async (id: number): Promise<NewsArticle> => {
    const response = await apiClient.get<NewsArticle>(`/cabinet/admin/news/${id}`);
    return normalizeNewsArticle(response.data);
  },

  createArticle: async (data: NewsCreateRequest): Promise<NewsArticle> => {
    const response = await apiClient.post<NewsArticle>('/cabinet/admin/news', data);
    return normalizeNewsArticle(response.data);
  },

  updateArticle: async (id: number, data: NewsUpdateRequest): Promise<NewsArticle> => {
    const response = await apiClient.put<NewsArticle>(`/cabinet/admin/news/${id}`, data);
    return normalizeNewsArticle(response.data);
  },

  deleteArticle: async (id: number): Promise<void> => {
    await apiClient.delete(`/cabinet/admin/news/${id}`);
  },

  togglePublish: async (id: number): Promise<NewsArticle> => {
    const response = await apiClient.post<NewsArticle>(`/cabinet/admin/news/${id}/publish`);
    return normalizeNewsArticle(response.data);
  },

  toggleFeatured: async (id: number): Promise<NewsArticle> => {
    const response = await apiClient.post<NewsArticle>(`/cabinet/admin/news/${id}/feature`);
    return normalizeNewsArticle(response.data);
  },

  uploadMedia: async (file: File, signal?: AbortSignal): Promise<NewsMediaUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<NewsMediaUploadResponse>(
      '/cabinet/admin/news/media/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal,
      },
    );
    return normalizeNewsMediaUploadResponse(response.data);
  },

  deleteMedia: async (filename: string): Promise<void> => {
    await apiClient.delete(`/cabinet/admin/news/media/${encodeURIComponent(filename)}`);
  },
};
