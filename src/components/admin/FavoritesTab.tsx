import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SettingDefinition, adminSettingsApi } from '../../api/adminSettings';
import { StarIcon } from './icons';
import { SettingRow } from './SettingRow';
import type { CategoryGroup } from './SettingsTab';

interface FavoriteCategory extends CategoryGroup {
  sectionId: string;
  sectionLabel: string;
}

interface FavoritesTabProps {
  categories: FavoriteCategory[];
  settings: SettingDefinition[];
  isFavorite: (key: string) => boolean;
  toggleFavorite: (key: string) => void;
  toggleFavoriteCategory: (key: string) => void;
  onOpenCategory: (categoryKey: string, sectionId: string) => void;
}

export function FavoritesTab({
  categories,
  settings,
  isFavorite,
  toggleFavorite,
  toggleFavoriteCategory,
  onOpenCategory,
}: FavoritesTabProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminSettingsApi.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
  });

  const resetSettingMutation = useMutation({
    mutationFn: (key: string) => adminSettingsApi.resetSetting(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
  });

  if (settings.length === 0 && categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dark-700/30 bg-dark-800/30 p-12 text-center">
        <div className="mb-4 flex justify-center text-dark-500">
          <StarIcon filled={false} />
        </div>
        <p className="text-dark-400">{t('admin.settings.favoritesEmpty')}</p>
        <p className="mt-1 text-sm text-dark-500">{t('admin.settings.favoritesHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {categories.length > 0 && (
        <div className="rounded-2xl border border-dark-700/30 bg-dark-800/20 p-4">
          <div className="mb-3">
            <p className="text-sm font-medium text-dark-100">
              {t('admin.settings.favoriteCategories')}
            </p>
            <p className="mt-1 text-xs text-dark-500">
              {t('admin.settings.favoriteCategoriesHint')}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {categories.map((category) => (
              <div
                key={category.key}
                className="rounded-xl border border-dark-700/40 bg-dark-900/30 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-dark-100">{category.label}</p>
                    <p className="mt-1 text-xs text-dark-500">{category.sectionLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFavoriteCategory(category.key)}
                    className="rounded-lg bg-warning-500/15 p-2 text-warning-400 transition-colors hover:bg-warning-500/25"
                    title={t('admin.settings.removeCategoryFromFavorites')}
                  >
                    <StarIcon filled />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-dark-400">
                    {t('admin.settings.settingsCountLabel', { count: category.settings.length })}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenCategory(category.key, category.sectionId)}
                    className="rounded-lg border border-dark-700 px-3 py-1.5 text-sm text-dark-200 transition-colors hover:border-dark-500 hover:bg-dark-800"
                  >
                    {t('admin.settings.openCategory')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {settings.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {settings.map((setting) => (
            <SettingRow
              key={setting.key}
              setting={setting}
              isFavorite={isFavorite(setting.key)}
              onToggleFavorite={() => toggleFavorite(setting.key)}
              onUpdate={(value) => updateSettingMutation.mutate({ key: setting.key, value })}
              onReset={() => resetSettingMutation.mutate(setting.key)}
              isUpdating={updateSettingMutation.isPending}
              isResetting={resetSettingMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
