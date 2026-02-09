import apiClient from './client';

export interface BrandingInfo {
  name: string;
  logo_url: string | null;
  logo_letter: string;
  has_custom_logo: boolean;
}

export interface AnimationEnabled {
  enabled: boolean;
}

export interface FullscreenEnabled {
  enabled: boolean;
}

export interface EmailAuthEnabled {
  enabled: boolean;
}

export interface LiteModeEnabled {
  enabled: boolean;
}

export interface AnalyticsCounters {
  yandex_metrika_id: string;
  google_ads_id: string;
  google_ads_label: string;
}

const BRANDING_CACHE_KEY = 'cabinet_branding';
const LOGO_PRELOADED_KEY = 'cabinet_logo_preloaded';

// In-memory blob URL cache to avoid exposing backend URL
let _logoBlobUrl: string | null = null;

// Check if logo was already preloaded in this session
export const isLogoPreloaded = (): boolean => {
  try {
    if (_logoBlobUrl) return true;
    const cached = getCachedBranding();
    if (!cached?.has_custom_logo || !cached?.logo_url) {
      return false;
    }
    const preloaded = sessionStorage.getItem(LOGO_PRELOADED_KEY);
    return preloaded === cached.logo_url;
  } catch {
    return false;
  }
};

// Get cached branding from localStorage
export const getCachedBranding = (): BrandingInfo | null => {
  try {
    const cached = localStorage.getItem(BRANDING_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // localStorage not available or invalid JSON
  }
  return null;
};

// Update branding cache in localStorage
export const setCachedBranding = (branding: BrandingInfo) => {
  try {
    localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(branding));
  } catch {
    // localStorage not available
  }
};

// Preload logo image as blob to hide backend URL
export const preloadLogo = async (branding: BrandingInfo): Promise<void> => {
  if (!branding.has_custom_logo || !branding.logo_url) {
    return;
  }

  // Check if already preloaded in this session
  if (_logoBlobUrl) {
    return;
  }

  const preloaded = sessionStorage.getItem(LOGO_PRELOADED_KEY);
  if (preloaded === branding.logo_url && _logoBlobUrl) {
    return;
  }

  try {
    const logoUrl = `${import.meta.env.VITE_API_URL || ''}${branding.logo_url}`;
    const response = await fetch(logoUrl);
    if (!response.ok) return;

    const blob = await response.blob();
    // Revoke previous blob URL if exists
    if (_logoBlobUrl) {
      URL.revokeObjectURL(_logoBlobUrl);
    }
    _logoBlobUrl = URL.createObjectURL(blob);
    sessionStorage.setItem(LOGO_PRELOADED_KEY, branding.logo_url);
  } catch {
    // Fetch failed, logo will use letter fallback
  }
};

// Get the blob URL for the logo (safe, doesn't expose backend)
export const getLogoBlobUrl = (): string | null => _logoBlobUrl;

// Initialize logo preload from cache on page load
export const initLogoPreload = () => {
  const cached = getCachedBranding();
  if (cached) {
    preloadLogo(cached);
  }
};

export const brandingApi = {
  // Get current branding (public, no auth required)
  getBranding: async (): Promise<BrandingInfo> => {
    const response = await apiClient.get<BrandingInfo>('/cabinet/branding');
    return response.data;
  },

  // Update project name (admin only)
  updateName: async (name: string): Promise<BrandingInfo> => {
    const response = await apiClient.put<BrandingInfo>('/cabinet/branding/name', { name });
    return response.data;
  },

  // Upload custom logo (admin only)
  uploadLogo: async (file: File): Promise<BrandingInfo> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<BrandingInfo>('/cabinet/branding/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // Invalidate cached blob so it gets re-fetched
    if (_logoBlobUrl) {
      URL.revokeObjectURL(_logoBlobUrl);
      _logoBlobUrl = null;
    }
    sessionStorage.removeItem(LOGO_PRELOADED_KEY);
    return response.data;
  },

  // Delete custom logo (admin only)
  deleteLogo: async (): Promise<BrandingInfo> => {
    const response = await apiClient.delete<BrandingInfo>('/cabinet/branding/logo');
    if (_logoBlobUrl) {
      URL.revokeObjectURL(_logoBlobUrl);
      _logoBlobUrl = null;
    }
    sessionStorage.removeItem(LOGO_PRELOADED_KEY);
    return response.data;
  },

  // Get logo URL as blob (hides backend URL from DOM)
  getLogoUrl: (_branding: BrandingInfo): string | null => {
    return _logoBlobUrl;
  },

  // Get animation enabled (public, no auth required)
  getAnimationEnabled: async (): Promise<AnimationEnabled> => {
    const response = await apiClient.get<AnimationEnabled>('/cabinet/branding/animation');
    return response.data;
  },

  // Update animation enabled (admin only)
  updateAnimationEnabled: async (enabled: boolean): Promise<AnimationEnabled> => {
    const response = await apiClient.patch<AnimationEnabled>('/cabinet/branding/animation', {
      enabled,
    });
    return response.data;
  },

  // Get fullscreen enabled (public, no auth required)
  getFullscreenEnabled: async (): Promise<FullscreenEnabled> => {
    try {
      const response = await apiClient.get<FullscreenEnabled>('/cabinet/branding/fullscreen');
      return response.data;
    } catch {
      // If endpoint doesn't exist, default to disabled
      return { enabled: false };
    }
  },

  // Update fullscreen enabled (admin only)
  updateFullscreenEnabled: async (enabled: boolean): Promise<FullscreenEnabled> => {
    const response = await apiClient.patch<FullscreenEnabled>('/cabinet/branding/fullscreen', {
      enabled,
    });
    return response.data;
  },

  // Get email auth enabled (public, no auth required)
  getEmailAuthEnabled: async (): Promise<EmailAuthEnabled> => {
    try {
      const response = await apiClient.get<EmailAuthEnabled>('/cabinet/branding/email-auth');
      return response.data;
    } catch {
      // If endpoint doesn't exist, default to enabled
      return { enabled: true };
    }
  },

  // Update email auth enabled (admin only)
  updateEmailAuthEnabled: async (enabled: boolean): Promise<EmailAuthEnabled> => {
    const response = await apiClient.patch<EmailAuthEnabled>('/cabinet/branding/email-auth', {
      enabled,
    });
    return response.data;
  },

  // Get lite mode enabled (public, no auth required)
  getLiteModeEnabled: async (): Promise<LiteModeEnabled> => {
    try {
      const response = await apiClient.get<LiteModeEnabled>('/cabinet/branding/lite-mode');
      return response.data;
    } catch {
      // If endpoint doesn't exist, default to disabled
      return { enabled: false };
    }
  },

  // Update lite mode enabled (admin only)
  updateLiteModeEnabled: async (enabled: boolean): Promise<LiteModeEnabled> => {
    const response = await apiClient.patch<LiteModeEnabled>('/cabinet/branding/lite-mode', {
      enabled,
    });
    return response.data;
  },

  // Get analytics counters (public, no auth required)
  getAnalyticsCounters: async (): Promise<AnalyticsCounters> => {
    try {
      const response = await apiClient.get<AnalyticsCounters>('/cabinet/branding/analytics');
      return response.data;
    } catch {
      return { yandex_metrika_id: '', google_ads_id: '', google_ads_label: '' };
    }
  },

  // Update analytics counters (admin only)
  updateAnalyticsCounters: async (data: Partial<AnalyticsCounters>): Promise<AnalyticsCounters> => {
    const response = await apiClient.patch<AnalyticsCounters>('/cabinet/branding/analytics', data);
    return response.data;
  },
};
