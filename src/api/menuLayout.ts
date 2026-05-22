import apiClient from './client';

export type MenuButtonActionType = 'builtin' | 'url' | 'mini_app' | 'callback';

export interface MenuButtonConfig {
  id: string;
  type: 'builtin' | 'custom';
  style: 'primary' | 'success' | 'danger' | 'default';
  icon_custom_emoji_id: string;
  enabled: boolean;
  labels: Record<string, string>;
  url: string | null;
  actionType?: MenuButtonActionType;
  action?: string;
  builtin_id?: string | null;
  visibility?: 'all' | 'admins' | 'moderators' | 'subscribers';
  conditions?: Record<string, unknown> | null;
  dynamic_text?: boolean;
  open_mode?: 'callback' | 'direct';
  webapp_url?: string | null;
  description?: string | null;
  sort_order?: number | null;
}

export interface MenuRowConfig {
  id: string;
  max_per_row: number;
  buttons: MenuButtonConfig[];
  conditions?: Record<string, unknown> | null;
}

export interface MenuConfig {
  rows: MenuRowConfig[];
  buttonCatalog?: MenuButtonConfig[];
}

interface ApiMenuRowConfig {
  id: string;
  buttons: string[];
  max_per_row: number;
  conditions?: Record<string, unknown> | null;
}

interface ApiMenuButtonConfig {
  type: MenuButtonActionType;
  builtin_id?: string | null;
  text: Record<string, string>;
  icon?: string | null;
  action: string;
  enabled: boolean;
  visibility: 'all' | 'admins' | 'moderators' | 'subscribers';
  conditions?: Record<string, unknown> | null;
  dynamic_text?: boolean;
  open_mode?: 'callback' | 'direct';
  webapp_url?: string | null;
  description?: string | null;
  sort_order?: number | null;
}

interface ApiMenuLayoutResponse {
  version?: number;
  rows?: ApiMenuRowConfig[];
  buttons?: Record<string, ApiMenuButtonConfig>;
  is_enabled?: boolean;
  updated_at?: string | null;
}

interface ApiMenuLayoutUpdateRequest {
  rows: ApiMenuRowConfig[];
  buttons: Record<string, ApiMenuButtonConfig>;
}

export const BOT_LOCALES = ['ru', 'en', 'ua', 'zh', 'fa'] as const;
export type BotLocale = (typeof BOT_LOCALES)[number];

export const BUILTIN_SECTIONS = [
  'connect',
  'happ_download',
  'subscription',
  'buy_traffic',
  'balance',
  'trial',
  'buy_subscription',
  'simple_subscription',
  'resume_checkout',
  'promocode',
  'referrals',
  'contests',
  'support',
  'info',
  'language',
  'admin_panel',
  'moderator_panel',
] as const;

export type BuiltinSection = (typeof BUILTIN_SECTIONS)[number];

export const STYLE_OPTIONS = [
  { value: 'default' as const, colorClass: 'bg-dark-500' },
  { value: 'primary' as const, colorClass: 'bg-blue-500' },
  { value: 'success' as const, colorClass: 'bg-success-500' },
  { value: 'danger' as const, colorClass: 'bg-red-500' },
];

const DEFAULT_CONFIG: MenuConfig = { rows: [] };

const DEFAULT_BUTTON: Omit<MenuButtonConfig, 'id' | 'type'> = {
  style: 'primary',
  icon_custom_emoji_id: '',
  enabled: true,
  labels: {},
  url: null,
  actionType: 'url',
  action: '',
  builtin_id: null,
  visibility: 'all',
  conditions: null,
  dynamic_text: false,
  open_mode: 'callback',
  webapp_url: null,
  description: null,
  sort_order: null,
};

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isHttpUrl(value: string | null | undefined): boolean {
  return Boolean(value && (value.startsWith('http://') || value.startsWith('https://')));
}

function normalizeLabels(labels: Record<string, string> | undefined): Record<string, string> {
  return Object.fromEntries(
    Object.entries(labels || {}).filter(([, value]) => typeof value === 'string'),
  );
}

function toEditorButton(id: string, button?: ApiMenuButtonConfig): MenuButtonConfig {
  if (!button) {
    return {
      ...DEFAULT_BUTTON,
      id,
      type: 'custom',
      labels: { ru: id, en: id },
      actionType: 'callback',
      action: id,
    };
  }

  const actionType = button.type || 'builtin';
  const isBuiltin = actionType === 'builtin';
  const url =
    actionType === 'url' || actionType === 'mini_app'
      ? button.action
      : isHttpUrl(button.webapp_url)
        ? button.webapp_url || null
        : isHttpUrl(button.action)
          ? button.action
          : null;

  return {
    ...DEFAULT_BUTTON,
    id,
    type: isBuiltin ? 'builtin' : 'custom',
    icon_custom_emoji_id: button.icon || '',
    enabled: button.enabled ?? true,
    labels: normalizeLabels(button.text),
    url,
    actionType,
    action: button.action || '',
    builtin_id: button.builtin_id ?? (isBuiltin ? id : null),
    visibility: button.visibility || 'all',
    conditions: button.conditions ?? null,
    dynamic_text: Boolean(button.dynamic_text),
    open_mode: button.open_mode || 'callback',
    webapp_url: button.webapp_url ?? null,
    description: button.description ?? null,
    sort_order: button.sort_order ?? null,
  };
}

function normalizeOldEditorButton(value: unknown): MenuButtonConfig | null {
  if (!isObject(value) || typeof value.id !== 'string') {
    return null;
  }

  const labels = isObject(value.labels)
    ? normalizeLabels(value.labels as Record<string, string>)
    : {};
  const type = value.type === 'builtin' ? 'builtin' : 'custom';

  return {
    ...DEFAULT_BUTTON,
    ...(value as Partial<MenuButtonConfig>),
    id: value.id,
    type,
    labels,
    url: typeof value.url === 'string' ? value.url : null,
  };
}

function normalizeConfig(data: unknown): MenuConfig {
  if (!isObject(data)) {
    return DEFAULT_CONFIG;
  }

  const rowsValue = Array.isArray(data.rows) ? data.rows : [];
  const buttonsById = isObject(data.buttons)
    ? (data.buttons as Record<string, ApiMenuButtonConfig>)
    : {};
  const buttonCatalog = Object.entries(buttonsById).map(([id, button]) =>
    toEditorButton(id, button),
  );

  return {
    buttonCatalog,
    rows: rowsValue.map((rowValue) => {
      const row = rowValue as Partial<ApiMenuRowConfig> & { buttons?: unknown[] };
      const rawButtons = Array.isArray(row.buttons) ? row.buttons : [];

      return {
        id: typeof row.id === 'string' ? row.id : `row_${Math.random().toString(36).slice(2, 8)}`,
        max_per_row: row.max_per_row ?? 2,
        conditions: row.conditions ?? null,
        buttons: rawButtons
          .map((buttonOrId) => {
            if (typeof buttonOrId === 'string') {
              return toEditorButton(buttonOrId, buttonsById[buttonOrId]);
            }
            return normalizeOldEditorButton(buttonOrId);
          })
          .filter((button): button is MenuButtonConfig => Boolean(button)),
      };
    }),
  };
}

function cleanText(labels: Record<string, string>): Record<string, string> {
  const text: Record<string, string> = {};
  for (const [locale, label] of Object.entries(labels)) {
    const cleanLabel = String(label || '').trim();
    if (cleanLabel) {
      text[locale] = cleanLabel;
    }
  }
  return text;
}

function toApiButton(button: MenuButtonConfig): ApiMenuButtonConfig {
  const actionType = button.actionType || (button.type === 'builtin' ? 'builtin' : 'url');
  const action =
    button.type === 'custom' && actionType !== 'callback'
      ? button.url || button.action || ''
      : button.action || button.url || '';

  return {
    type: actionType,
    builtin_id: button.builtin_id ?? (actionType === 'builtin' ? button.id : null),
    text: cleanText(button.labels),
    icon: button.icon_custom_emoji_id.trim() || null,
    action,
    enabled: button.enabled,
    visibility: button.visibility || 'all',
    conditions: button.conditions ?? null,
    dynamic_text: Boolean(button.dynamic_text),
    open_mode: button.open_mode || 'callback',
    webapp_url: button.webapp_url ?? null,
    description: button.description ?? null,
    sort_order: button.sort_order ?? null,
  };
}

function toApiPayload(config: MenuConfig): ApiMenuLayoutUpdateRequest {
  const buttonMap = new Map<string, MenuButtonConfig>();

  for (const button of config.buttonCatalog || []) {
    buttonMap.set(button.id, button);
  }

  for (const row of config.rows) {
    for (const button of row.buttons) {
      buttonMap.set(button.id, button);
    }
  }

  const buttons: Record<string, ApiMenuButtonConfig> = {};
  for (const [id, button] of buttonMap.entries()) {
    buttons[id] = toApiButton(button);
  }

  return {
    rows: config.rows.map((row) => ({
      id: row.id,
      max_per_row: row.max_per_row,
      conditions: row.conditions ?? null,
      buttons: row.buttons.map((button) => button.id),
    })),
    buttons,
  };
}

export const menuLayoutApi = {
  getConfig: async (): Promise<MenuConfig> => {
    const response = await apiClient.get<ApiMenuLayoutResponse>('/cabinet/admin/menu-layout');
    return normalizeConfig(response.data);
  },

  updateConfig: async (config: MenuConfig): Promise<MenuConfig> => {
    const response = await apiClient.put<ApiMenuLayoutResponse>(
      '/cabinet/admin/menu-layout',
      toApiPayload(config),
    );
    return normalizeConfig(response.data);
  },

  resetConfig: async (): Promise<MenuConfig> => {
    const response = await apiClient.post<ApiMenuLayoutResponse>(
      '/cabinet/admin/menu-layout/reset',
    );
    return normalizeConfig(response.data);
  },
};
