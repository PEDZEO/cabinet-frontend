import type { SettingDefinition } from '@/api/adminSettings';

const ULTIMA_EXCLUDED_KEYS = new Set([
  'ULTIMA_START_BOT_CONFIG',
  'CABINET_ULTIMA_AGREEMENT_CONTENT',
  'CABINET_ULTIMA_MODE_ENABLED',
]);

const ULTIMA_INLINE_MINIAPP_KEYS = new Set([
  'MINIAPP_TICKETS_ENABLED',
  'MINIAPP_SUPPORT_TYPE',
  'MINIAPP_SUPPORT_URL',
  'MINIAPP_PURCHASE_URL',
]);

export function isUltimaSetting(setting: SettingDefinition): boolean {
  const key = setting.key.toUpperCase();
  const category = setting.category.key.toUpperCase();
  const text = `${setting.key} ${setting.name ?? ''}`.toLowerCase();

  if (ULTIMA_EXCLUDED_KEYS.has(key)) {
    return false;
  }

  if (key.startsWith('ULTIMA_') || key.startsWith('CABINET_ULTIMA_')) {
    return true;
  }

  if (key.startsWith('HAPP_') || key === 'CONNECT_BUTTON_HAPP_DOWNLOAD_ENABLED') {
    return true;
  }

  if (ULTIMA_INLINE_MINIAPP_KEYS.has(key)) {
    return true;
  }

  return /ultima|happ/.test(text) || category === 'HAPP';
}

export type UltimaSettingGroup = {
  key: string;
  label: string;
  items: SettingDefinition[];
};

export function groupUltimaSettings(settings: SettingDefinition[]): UltimaSettingGroup[] {
  const groups = new Map<string, { label: string; items: SettingDefinition[] }>();

  for (const setting of settings) {
    const key = setting.category.key || 'OTHER';
    const label = setting.category.label || key;
    const current = groups.get(key);
    if (current) {
      current.items.push(setting);
      continue;
    }
    groups.set(key, { label, items: [setting] });
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => ({ key, ...value }));
}
