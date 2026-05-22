import { apiClient } from './client';

export type UltimaDiagnosticStatus = 'ok' | 'warning' | 'error';

export interface UltimaOverviewMode {
  enabled: boolean;
  main_menu_mode: string;
  account_linking_mode: string;
}

export interface UltimaOverviewStart {
  enabled: boolean;
  message_text: string;
  button_text: string;
  button_url: string;
  fallback_to_regular_menu: boolean;
}

export interface UltimaOverviewSupport {
  support_type: string;
  tickets_enabled: boolean;
  miniapp_tickets_enabled: boolean;
  global_tickets_enabled: boolean;
  support_username: string | null;
  support_url: string | null;
  channel_label: string;
}

export interface UltimaOverviewNotificationButton {
  text: string;
  path: string;
}

export interface UltimaOverviewNotifications {
  enabled: boolean;
  buttons: UltimaOverviewNotificationButton[];
}

export interface UltimaOverviewConfig {
  miniapp_url: string;
  purchase_url: string;
  static_path: string;
  service_name_ru: string;
  service_name_en: string;
}

export interface UltimaOverviewDiagnostic {
  key: string;
  label: string;
  status: UltimaDiagnosticStatus;
  message: string;
}

export interface UltimaOverviewMetrics {
  tickets_total: number;
  tickets_open: number;
  tickets_pending: number;
  tickets_answered: number;
  tickets_closed: number;
  tickets_created_7d: number;
}

export interface UltimaOverview {
  status: UltimaDiagnosticStatus;
  mode: UltimaOverviewMode;
  start: UltimaOverviewStart;
  support: UltimaOverviewSupport;
  notifications: UltimaOverviewNotifications;
  config: UltimaOverviewConfig;
  diagnostics: UltimaOverviewDiagnostic[];
  metrics: UltimaOverviewMetrics;
}

export const adminUltimaApi = {
  getOverview: async (): Promise<UltimaOverview> => {
    const response = await apiClient.get<UltimaOverview>('/cabinet/admin/ultima/overview');
    return response.data;
  },
};
