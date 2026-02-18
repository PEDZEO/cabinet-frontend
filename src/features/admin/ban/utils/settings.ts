import type { BanSettingDefinition } from '@/api/banSystem';

const CATEGORY_ORDER = [
  'general',
  'punishment',
  'progressive_bans',
  'traffic',
  'network',
  'notifications',
  'rate_limit',
];

export function inferBanSettingCategory(key: string, apiCategory: string | null): string {
  if (apiCategory) return apiCategory;
  if (key.startsWith('punishment_') || key.startsWith('progressive_ban')) return 'punishment';
  if (key.startsWith('traffic_')) return 'traffic';
  if (key.startsWith('network_')) return 'network';
  if (key.startsWith('rate_limit_')) return 'rate_limit';
  if (key.startsWith('notify_') || key.startsWith('daily_report')) return 'notifications';
  return 'general';
}

export function groupBanSettingsByCategory(
  settings: BanSettingDefinition[],
): Record<string, BanSettingDefinition[]> {
  const grouped: Record<string, BanSettingDefinition[]> = {};
  settings.forEach((setting) => {
    const category = inferBanSettingCategory(setting.key, setting.category);
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(setting);
  });
  return grouped;
}

export function sortBanSettingCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const aIdx = CATEGORY_ORDER.indexOf(a);
    const bIdx = CATEGORY_ORDER.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
}

export function filterBanSettings(
  settings: BanSettingDefinition[],
  options: {
    showEditableOnly: boolean;
    normalizedQuery: string;
    formatSettingKey: (key: string) => string;
  },
): BanSettingDefinition[] {
  const { showEditableOnly, normalizedQuery, formatSettingKey } = options;
  return settings.filter((setting) => {
    if (showEditableOnly && !setting.editable) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    const label = formatSettingKey(setting.key).toLowerCase();
    const description = (setting.description ?? '').toLowerCase();
    return (
      setting.key.toLowerCase().includes(normalizedQuery) ||
      label.includes(normalizedQuery) ||
      description.includes(normalizedQuery)
    );
  });
}
