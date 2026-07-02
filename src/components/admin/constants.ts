import { ThemeColors, DEFAULT_THEME_COLORS } from '../../types/theme';

// Tree sidebar types
export interface TreeSubItem {
  id: string;
  label: string;
  categories: string[];
}

export interface TreeGroup {
  id: string;
  label: string;
  icon: string;
  children: TreeSubItem[];
}

export interface SpecialItem {
  id: string;
  label: string;
  icon?: string;
  iconType?: 'star' | null;
}

export interface SettingsTreeConfig {
  specialItems: SpecialItem[];
  groups: TreeGroup[];
}

// Hierarchical settings tree ported from Stitch and adapted to our available categories.
export const SETTINGS_TREE: SettingsTreeConfig = {
  specialItems: [
    { id: 'favorites', label: 'Избранное', iconType: 'star' },
    { id: 'branding', label: 'Брендинг', icon: '🎨' },
    { id: 'theme', label: 'Тема', icon: '🌈' },
    { id: 'analytics', label: 'Аналитика', icon: '📊' },
    { id: 'buttons', label: 'Кнопки', icon: '📱' },
  ],
  groups: [
    {
      id: 'payments',
      label: 'Платежи',
      icon: '💳',
      children: [
        {
          id: 'payments_general',
          label: 'Общие настройки',
          categories: ['PAYMENT', 'PAYMENT_VERIFICATION'],
        },
        { id: 'payments_stars', label: 'Telegram Stars', categories: ['TELEGRAM'] },
        { id: 'payments_yookassa', label: 'YooKassa', categories: ['YOOKASSA'] },
        { id: 'payments_cryptobot', label: 'CryptoBot', categories: ['CRYPTOBOT'] },
        { id: 'payments_cloudpayments', label: 'CloudPayments', categories: ['CLOUDPAYMENTS'] },
        { id: 'payments_freekassa', label: 'Freekassa', categories: ['FREEKASSA'] },
        { id: 'payments_kassa_ai', label: 'Kassa AI', categories: ['KASSA_AI'] },
        { id: 'payments_platega', label: 'Platega', categories: ['PLATEGA'] },
        { id: 'payments_pal24', label: 'PAL24 / PayPalych', categories: ['PAL24'] },
        { id: 'payments_heleket', label: 'Heleket', categories: ['HELEKET'] },
        { id: 'payments_mulenpay', label: 'MulenPay', categories: ['MULENPAY'] },
        { id: 'payments_tribute', label: 'Tribute', categories: ['TRIBUTE'] },
        { id: 'payments_wata', label: 'Wata', categories: ['WATA'] },
        { id: 'payments_riopay', label: 'RioPay', categories: ['RIOPAY'] },
        { id: 'payments_severpay', label: 'SeverPay', categories: ['SEVERPAY'] },
        { id: 'payments_paypear', label: 'PayPear', categories: ['PAYPEAR'] },
        { id: 'payments_rollypay', label: 'RollyPay', categories: ['ROLLYPAY'] },
        { id: 'payments_overpay', label: 'Overpay', categories: ['OVERPAY'] },
        { id: 'payments_aurapay', label: 'AuraPay', categories: ['AURAPAY'] },
        { id: 'payments_etoplatezhi', label: 'Etoplatezhi', categories: ['ETOPLATEZHI'] },
        { id: 'payments_antilopay', label: 'Antilopay', categories: ['ANTILOPAY'] },
        { id: 'payments_jupiter', label: 'Jupiter', categories: ['JUPITER'] },
        { id: 'payments_donut', label: 'Donut', categories: ['DONUT'] },
        { id: 'payments_lava', label: 'Lava', categories: ['LAVA'] },
      ],
    },
    {
      id: 'subscriptions',
      label: 'Подписки',
      icon: '📦',
      children: [
        { id: 'subs_core', label: 'Основные лимиты', categories: ['SUBSCRIPTIONS_CORE'] },
        { id: 'subs_trial', label: 'Пробный период', categories: ['TRIAL'] },
        { id: 'subs_pricing', label: 'Стоимость тарифов', categories: ['SUBSCRIPTION_PRICES'] },
        { id: 'subs_periods', label: 'Периоды', categories: ['PERIODS'] },
        { id: 'subs_traffic', label: 'Трафик', categories: ['TRAFFIC', 'TRAFFIC_PACKAGES'] },
        { id: 'subs_simple', label: 'Простая покупка', categories: ['SIMPLE_SUBSCRIPTION'] },
        { id: 'subs_autopay', label: 'Автопродление', categories: ['AUTOPAY'] },
      ],
    },
    {
      id: 'interface',
      label: 'Интерфейс',
      icon: '🖥️',
      children: [
        {
          id: 'iface_general',
          label: 'Общий вид',
          categories: ['INTERFACE', 'INTERFACE_BRANDING', 'INTERFACE_SUBSCRIPTION'],
        },
        { id: 'iface_connect', label: 'Кнопка подключения', categories: ['CONNECT_BUTTON'] },
        { id: 'iface_miniapp', label: 'Mini App', categories: ['MINIAPP'] },
        { id: 'iface_happ', label: 'Happ', categories: ['HAPP'] },
        { id: 'iface_skip', label: 'Быстрый старт', categories: ['SKIP'] },
        { id: 'iface_additional', label: 'Дополнительно', categories: ['ADDITIONAL'] },
      ],
    },
    {
      id: 'users',
      label: 'Пользователи',
      icon: '👥',
      children: [
        { id: 'users_support', label: 'Поддержка', categories: ['SUPPORT'] },
        { id: 'users_channel', label: 'Каналы', categories: ['CHANNEL'] },
        {
          id: 'users_localization',
          label: 'Локализация',
          categories: ['LOCALIZATION', 'TIMEZONE'],
        },
        {
          id: 'users_moderation',
          label: 'Модерация',
          categories: ['MODERATION', 'BAN_NOTIFICATIONS'],
        },
        { id: 'users_referral', label: 'Реферальная программа', categories: ['REFERRAL'] },
      ],
    },
    {
      id: 'marketing',
      label: 'Маркетинг',
      icon: '📣',
      children: [
        { id: 'marketing_tap_rewards', label: 'Подарки за тапы', categories: ['TAP_REWARDS'] },
      ],
    },
    {
      id: 'notifications',
      label: 'Уведомления',
      icon: '🔔',
      children: [
        {
          id: 'notif_user',
          label: 'Пользователям',
          categories: ['NOTIFICATIONS', 'WEBHOOK_NOTIFICATIONS'],
        },
        { id: 'notif_admin', label: 'Администраторам', categories: ['ADMIN_NOTIFICATIONS'] },
        { id: 'notif_reports', label: 'Отчеты', categories: ['ADMIN_REPORTS'] },
      ],
    },
    {
      id: 'database',
      label: 'База данных',
      icon: '🗄️',
      children: [
        { id: 'db_general', label: 'Общие', categories: ['DATABASE'] },
        { id: 'db_postgres', label: 'PostgreSQL', categories: ['POSTGRES'] },
        { id: 'db_sqlite', label: 'SQLite', categories: ['SQLITE'] },
        { id: 'db_redis', label: 'Redis', categories: ['REDIS'] },
      ],
    },
    {
      id: 'system',
      label: 'Система',
      icon: '⚙️',
      children: [
        { id: 'sys_core', label: 'Ядро и отладка', categories: ['CORE', 'DEBUG'] },
        {
          id: 'sys_remnawave',
          label: 'RemnaWave и балансер',
          categories: ['REMNAWAVE', 'BALANCER'],
        },
        { id: 'sys_webapi', label: 'Web API', categories: ['WEB_API', 'EXTERNAL_ADMIN'] },
        { id: 'sys_webhook', label: 'Webhook', categories: ['WEBHOOK'] },
        { id: 'sys_server', label: 'Статус серверов', categories: ['SERVER_STATUS'] },
        { id: 'sys_monitoring', label: 'Мониторинг', categories: ['MONITORING'] },
        { id: 'sys_maintenance', label: 'Обслуживание', categories: ['MAINTENANCE'] },
        { id: 'sys_backup', label: 'Резервные копии', categories: ['BACKUP'] },
        { id: 'sys_version', label: 'Версии', categories: ['VERSION'] },
        { id: 'sys_logging', label: 'Логи', categories: ['LOG'] },
      ],
    },
  ],
};

// Helper: find which group and sub-item a backend category key belongs to.
export function findTreeLocation(
  categoryKey: string,
): { groupId: string; subItemId: string } | null {
  for (const group of SETTINGS_TREE.groups) {
    for (const child of group.children) {
      if (child.categories.includes(categoryKey)) {
        return { groupId: group.id, subItemId: child.id };
      }
    }
  }
  return null;
}

// Helper: get all backend category keys for a given sub-item id.
export function getCategoriesForSubItem(subItemId: string): string[] {
  for (const group of SETTINGS_TREE.groups) {
    const child = group.children.find((c) => c.id === subItemId);
    if (child) return child.categories;
  }
  return [];
}

// Menu item types
export interface MenuItem {
  id: string;
  iconType?: 'star' | null;
  categories?: string[];
}

export interface MenuSection {
  id: string;
  items: MenuItem[];
}

// Sidebar menu configuration
export const MENU_SECTIONS: MenuSection[] = [
  {
    id: 'main',
    items: [
      { id: 'favorites', iconType: 'star' },
      { id: 'branding', iconType: null },
      { id: 'theme', iconType: null },
      { id: 'analytics', iconType: null },
      { id: 'buttons', iconType: null },
    ],
  },
  {
    id: 'settings',
    items: [
      {
        id: 'payments',
        iconType: null,
        categories: [
          'PAYMENT',
          'PAYMENT_VERIFICATION',
          'YOOKASSA',
          'CRYPTOBOT',
          'HELEKET',
          'PLATEGA',
          'TRIBUTE',
          'MULENPAY',
          'PAL24',
          'WATA',
          'CLOUDPAYMENTS',
          'FREEKASSA',
          'KASSA_AI',
          'RIOPAY',
          'SEVERPAY',
          'PAYPEAR',
          'ROLLYPAY',
          'OVERPAY',
          'AURAPAY',
          'ETOPLATEZHI',
          'ANTILOPAY',
          'JUPITER',
          'DONUT',
          'LAVA',
          'TELEGRAM',
        ],
      },
      {
        id: 'subscriptions',
        iconType: null,
        categories: [
          'SUBSCRIPTIONS_CORE',
          'SIMPLE_SUBSCRIPTION',
          'PERIODS',
          'SUBSCRIPTION_PRICES',
          'TRAFFIC',
          'TRAFFIC_PACKAGES',
          'TRIAL',
          'AUTOPAY',
        ],
      },
      {
        id: 'interface',
        iconType: null,
        categories: [
          'INTERFACE',
          'INTERFACE_BRANDING',
          'INTERFACE_SUBSCRIPTION',
          'CONNECT_BUTTON',
          'MINIAPP',
          'HAPP',
          'SKIP',
          'ADDITIONAL',
        ],
      },
      {
        id: 'notifications',
        iconType: null,
        categories: ['NOTIFICATIONS', 'ADMIN_NOTIFICATIONS', 'ADMIN_REPORTS'],
      },
      { id: 'database', iconType: null, categories: ['DATABASE', 'POSTGRES', 'SQLITE', 'REDIS'] },
      {
        id: 'system',
        iconType: null,
        categories: [
          'CORE',
          'REMNAWAVE',
          'SERVER_STATUS',
          'MONITORING',
          'MAINTENANCE',
          'BACKUP',
          'VERSION',
          'WEB_API',
          'WEBHOOK',
          'LOG',
          'DEBUG',
          'EXTERNAL_ADMIN',
        ],
      },
      {
        id: 'users',
        iconType: null,
        categories: ['SUPPORT', 'LOCALIZATION', 'CHANNEL', 'TIMEZONE', 'REFERRAL', 'MODERATION'],
      },
      {
        id: 'marketing',
        iconType: null,
        categories: ['TAP_REWARDS'],
      },
    ],
  },
];

// Theme preset type
export interface ThemePreset {
  id: string;
  colors: ThemeColors;
}

// Theme presets
export const THEME_PRESETS: ThemePreset[] = [
  { id: 'standard', colors: DEFAULT_THEME_COLORS },
  {
    id: 'ocean',
    colors: {
      accent: '#0ea5e9',
      darkBackground: '#0c1222',
      darkSurface: '#1e293b',
      darkText: '#f1f5f9',
      darkTextSecondary: '#94a3b8',
      lightBackground: '#e0f2fe',
      lightSurface: '#f0f9ff',
      lightText: '#0c4a6e',
      lightTextSecondary: '#0369a1',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  {
    id: 'forest',
    colors: {
      accent: '#22c55e',
      darkBackground: '#0a1a0f',
      darkSurface: '#14532d',
      darkText: '#f0fdf4',
      darkTextSecondary: '#86efac',
      lightBackground: '#dcfce7',
      lightSurface: '#f0fdf4',
      lightText: '#14532d',
      lightTextSecondary: '#166534',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  {
    id: 'sunset',
    colors: {
      accent: '#f97316',
      darkBackground: '#1c1009',
      darkSurface: '#2d1a0e',
      darkText: '#fff7ed',
      darkTextSecondary: '#fdba74',
      lightBackground: '#ffedd5',
      lightSurface: '#fff7ed',
      lightText: '#7c2d12',
      lightTextSecondary: '#c2410c',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  {
    id: 'violet',
    colors: {
      accent: '#a855f7',
      darkBackground: '#0f0a1a',
      darkSurface: '#1e1b2e',
      darkText: '#faf5ff',
      darkTextSecondary: '#c4b5fd',
      lightBackground: '#f3e8ff',
      lightSurface: '#faf5ff',
      lightText: '#581c87',
      lightTextSecondary: '#7e22ce',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  {
    id: 'rose',
    colors: {
      accent: '#f43f5e',
      darkBackground: '#1a0a10',
      darkSurface: '#2d1520',
      darkText: '#fff1f2',
      darkTextSecondary: '#fda4af',
      lightBackground: '#ffe4e6',
      lightSurface: '#fff1f2',
      lightText: '#881337',
      lightTextSecondary: '#be123c',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  {
    id: 'midnight',
    colors: {
      accent: '#6366f1',
      darkBackground: '#030712',
      darkSurface: '#111827',
      darkText: '#f9fafb',
      darkTextSecondary: '#9ca3af',
      lightBackground: '#e5e7eb',
      lightSurface: '#f3f4f6',
      lightText: '#111827',
      lightTextSecondary: '#4b5563',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  {
    id: 'turquoise',
    colors: {
      accent: '#14b8a6',
      darkBackground: '#0a1614',
      darkSurface: '#134e4a',
      darkText: '#f0fdfa',
      darkTextSecondary: '#5eead4',
      lightBackground: '#ccfbf1',
      lightSurface: '#f0fdfa',
      lightText: '#134e4a',
      lightTextSecondary: '#0f766e',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
];
