import apiClient from './client';
import type {
  AuthResponse,
  LinkCodeCreateResponse,
  LinkCodePreviewResponse,
  ManualMergeTicketStatus,
  UnlinkIdentityRequestResponse,
  UnlinkIdentityResponse,
  LinkedIdentitiesResponse,
  ManualMergeResponse,
  OAuthProvider,
  RegisterResponse,
  TokenResponse,
  User,
} from '../types';

export const authApi = {
  // Telegram WebApp authentication
  loginTelegram: async (
    initData: string,
    campaignSlug?: string | null,
    referralCode?: string | null,
  ): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/cabinet/auth/telegram', {
      init_data: initData,
      campaign_slug: campaignSlug || undefined,
      referral_code: referralCode || undefined,
    });
    return response.data;
  },

  // Telegram Login Widget authentication
  loginTelegramWidget: async (
    data: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
      auth_date: number;
      hash: string;
    },
    campaignSlug?: string | null,
    referralCode?: string | null,
  ): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/cabinet/auth/telegram/widget', {
      ...data,
      campaign_slug: campaignSlug || undefined,
      referral_code: referralCode || undefined,
    });
    return response.data;
  },

  // Email login
  loginEmail: async (
    email: string,
    password: string,
    campaignSlug?: string | null,
    referralCode?: string | null,
  ): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/cabinet/auth/email/login', {
      email,
      password,
      campaign_slug: campaignSlug || undefined,
      referral_code: referralCode || undefined,
    });
    return response.data;
  },

  // Register email (link to existing Telegram account)
  registerEmail: async (
    email: string,
    password: string,
  ): Promise<{ message: string; email: string }> => {
    const response = await apiClient.post('/cabinet/auth/email/register', {
      email,
      password,
    });
    return response.data;
  },

  // Register standalone email account (no Telegram required)
  // Returns message - user must verify email before login
  registerEmailStandalone: async (data: {
    email: string;
    password: string;
    first_name?: string;
    language?: string;
    referral_code?: string;
  }): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>(
      '/cabinet/auth/email/register/standalone',
      data,
    );
    return response.data;
  },

  // Verify email and get auth tokens
  verifyEmail: async (token: string, campaignSlug?: string | null): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/cabinet/auth/email/verify', {
      token,
      campaign_slug: campaignSlug || undefined,
    });
    return response.data;
  },

  // Resend verification email
  resendVerification: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/cabinet/auth/email/resend');
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/cabinet/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  // Logout
  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/cabinet/auth/logout', {
      refresh_token: refreshToken,
    });
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/cabinet/auth/password/forgot', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/cabinet/auth/password/reset', {
      token,
      password,
    });
    return response.data;
  },

  // Get current user
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/cabinet/auth/me');
    return response.data;
  },

  // Request email change - sends verification code to new email
  requestEmailChange: async (
    newEmail: string,
  ): Promise<{ message: string; new_email: string; expires_in_minutes: number }> => {
    const response = await apiClient.post('/cabinet/auth/email/change', {
      new_email: newEmail,
    });
    return response.data;
  },

  // Verify email change with code
  verifyEmailChange: async (code: string): Promise<{ message: string; email: string }> => {
    const response = await apiClient.post('/cabinet/auth/email/change/verify', {
      code,
    });
    return response.data;
  },

  // OAuth: get enabled providers
  getOAuthProviders: async (): Promise<{ providers: OAuthProvider[] }> => {
    const response = await apiClient.get<{ providers: OAuthProvider[] }>(
      '/cabinet/auth/oauth/providers',
    );
    return response.data;
  },

  // OAuth: get authorization URL
  getOAuthAuthorizeUrl: async (
    provider: string,
  ): Promise<{ authorize_url: string; state: string }> => {
    const response = await apiClient.get<{ authorize_url: string; state: string }>(
      `/cabinet/auth/oauth/${encodeURIComponent(provider)}/authorize`,
    );
    return response.data;
  },

  // OAuth: callback (exchange code for tokens)
  oauthCallback: async (
    provider: string,
    code: string,
    state: string,
    options?: {
      campaignSlug?: string | null;
      referralCode?: string | null;
      device_id?: string;
      type?: string;
    },
  ): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      `/cabinet/auth/oauth/${encodeURIComponent(provider)}/callback`,
      {
        code,
        state,
        campaign_slug: options?.campaignSlug || undefined,
        referral_code: options?.referralCode || undefined,
        device_id: options?.device_id,
        type: options?.type,
      },
    );
    return response.data;
  },

  getLinkedIdentities: async (): Promise<LinkedIdentitiesResponse> => {
    const response = await apiClient.get<LinkedIdentitiesResponse>('/cabinet/auth/identities');
    return response.data;
  },

  createLinkCode: async (): Promise<LinkCodeCreateResponse> => {
    const response = await apiClient.post<LinkCodeCreateResponse>('/cabinet/auth/link-code/create');
    return response.data;
  },

  previewLinkCode: async (code: string): Promise<LinkCodePreviewResponse> => {
    const response = await apiClient.post<LinkCodePreviewResponse>(
      '/cabinet/auth/link-code/preview',
      {
        code,
      },
    );
    return response.data;
  },

  confirmLinkCode: async (code: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/cabinet/auth/link-code/confirm', {
      code,
    });
    return response.data;
  },

  requestManualMerge: async (code: string, comment?: string): Promise<ManualMergeResponse> => {
    const response = await apiClient.post<ManualMergeResponse>(
      '/cabinet/auth/link-code/manual-request',
      {
        code,
        comment,
      },
    );
    return response.data;
  },

  getLatestManualMergeRequest: async (): Promise<ManualMergeTicketStatus | null> => {
    const response = await apiClient.get<ManualMergeTicketStatus | null>(
      '/cabinet/auth/link-code/manual-request/latest',
    );
    return response.data;
  },

  requestUnlinkIdentity: async (provider: string): Promise<UnlinkIdentityRequestResponse> => {
    const response = await apiClient.post<UnlinkIdentityRequestResponse>(
      `/cabinet/auth/identities/${encodeURIComponent(provider)}/unlink/request`,
    );
    return response.data;
  },

  confirmUnlinkIdentity: async (
    provider: string,
    requestToken: string,
    otpCode: string,
  ): Promise<UnlinkIdentityResponse> => {
    const response = await apiClient.post<UnlinkIdentityResponse>(
      `/cabinet/auth/identities/${encodeURIComponent(provider)}/unlink/confirm`,
      { request_token: requestToken, otp_code: otpCode },
    );
    return response.data;
  },
};
