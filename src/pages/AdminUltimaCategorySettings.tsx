import { useMemo } from 'react';
import { useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminSettingsApi } from '@/api/adminSettings';
import { AdminBackButton } from '@/components/admin';
import { SettingRow } from '@/components/admin/SettingRow';
import { groupUltimaSettings, isUltimaSetting } from './adminUltimaSettings/utils';

export default function AdminUltimaCategorySettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { categoryKey = '' } = useParams();
  const normalizedCategoryKey = decodeURIComponent(categoryKey);

  const { data: allSettings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminSettingsApi.getSettings(),
  });

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

  const categoryGroup = useMemo(() => {
    const ultimaSettings = (allSettings ?? []).filter((setting) => isUltimaSetting(setting));
    return groupUltimaSettings(ultimaSettings).find((group) => group.key === normalizedCategoryKey);
  }, [allSettings, normalizedCategoryKey]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-2 flex items-center gap-3">
        <AdminBackButton to="/admin/ultima-settings" />
        <div>
          <h1 className="text-xl font-semibold text-dark-100">
            {categoryGroup?.label ||
              t('admin.ultimaSettings.inlineSettings', {
                defaultValue: 'Параметры Ultima',
              })}
          </h1>
          <p className="text-sm text-dark-400">
            {t('admin.ultimaSettings.categorySubtitle', {
              defaultValue: 'Параметры раздела Ultima.',
            })}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-dark-700/50 bg-dark-800/30 p-4">
        {isLoading ? (
          <div className="py-8 text-center text-dark-400">{t('common.loading')}</div>
        ) : !categoryGroup ? (
          <div className="rounded-xl border border-dark-700/40 bg-dark-800/40 p-6 text-center text-sm text-dark-400">
            {t('admin.ultimaSettings.categoryNotFound', {
              defaultValue: 'Раздел параметров не найден.',
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {categoryGroup.items.map((setting) => (
              <SettingRow
                key={setting.key}
                setting={setting}
                isFavorite={false}
                onToggleFavorite={() => {}}
                onUpdate={(value) => updateSettingMutation.mutate({ key: setting.key, value })}
                onReset={() => resetSettingMutation.mutate(setting.key)}
                isUpdating={updateSettingMutation.isPending}
                isResetting={resetSettingMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
