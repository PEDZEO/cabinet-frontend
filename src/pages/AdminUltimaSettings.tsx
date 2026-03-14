import { useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminSettingsApi, type SettingDefinition } from '@/api/adminSettings';
import { AdminBackButton } from '@/components/admin';
import { SettingRow } from '@/components/admin/SettingRow';

const UltimaIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3l7 2.8v5.4c0 4.3-2.9 8.3-7 9.5-4.1-1.2-7-5.2-7-9.5V5.8L12 3z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
  </svg>
);

const StartMessageIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <rect x="4" y="4" width="16" height="5" rx="1.5" />
    <rect x="4" y="15" width="10" height="5" rx="1.5" />
    <path d="M17 17.5h3M18.5 16v3" strokeLinecap="round" />
  </svg>
);

const DocIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 3.5h7l4 4v12A1.5 1.5 0 0 1 17.5 21h-9A1.5 1.5 0 0 1 7 19.5v-14A1.5 1.5 0 0 1 8.5 4"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 3.5V8h4" />
    <path strokeLinecap="round" d="M10 12h7M10 15h7M10 18h5" />
  </svg>
);

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

function isUltimaSetting(setting: SettingDefinition): boolean {
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

export default function AdminUltimaSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

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

  const ultimaSettings = useMemo(
    () => (allSettings ?? []).filter((setting) => isUltimaSetting(setting)),
    [allSettings],
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-2 flex items-center gap-3">
        <AdminBackButton to="/admin" />
        <div className="rounded-lg bg-violet-500/20 p-2 text-violet-300">
          <UltimaIcon />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-dark-100">
            {t('admin.nav.ultimaSettings', { defaultValue: 'Ultima настройки' })}
          </h1>
          <p className="text-sm text-dark-400">
            {t('admin.ultimaSettings.subtitle', {
              defaultValue:
                'Отдельный раздел для режима Ultima: стартовое сообщение, соглашение и профильные параметры.',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Link
          to="/admin/ultima-settings/start-message"
          className="group rounded-2xl border border-dark-700/50 bg-dark-800/40 p-4 transition-colors hover:border-violet-400/40 hover:bg-dark-800/70"
        >
          <div className="mb-2 flex items-center gap-2 text-violet-300">
            <StartMessageIcon />
            <span className="text-sm font-medium">
              {t('admin.ultimaSettings.startMessageTitle', {
                defaultValue: 'Сообщение после /start',
              })}
            </span>
          </div>
          <p className="text-sm text-dark-400">
            {t('admin.ultimaSettings.startMessageDesc', {
              defaultValue:
                'Отдельная настройка текста и кнопки стартового сообщения Ultima в боте.',
            })}
          </p>
        </Link>

        <Link
          to="/admin/ultima-settings/agreement"
          className="group rounded-2xl border border-dark-700/50 bg-dark-800/40 p-4 transition-colors hover:border-violet-400/40 hover:bg-dark-800/70"
        >
          <div className="mb-2 flex items-center gap-2 text-violet-300">
            <DocIcon />
            <span className="text-sm font-medium">
              {t('admin.ultimaSettings.agreementTitle', {
                defaultValue: 'Пользовательское соглашение',
              })}
            </span>
          </div>
          <p className="text-sm text-dark-400">
            {t('admin.ultimaSettings.agreementDesc', {
              defaultValue:
                'Отдельная страница редактирования текста соглашения для режима Ultima.',
            })}
          </p>
        </Link>
      </div>

      <div className="rounded-2xl border border-dark-700/50 bg-dark-800/30 p-4">
        <h2 className="mb-3 text-base font-semibold text-dark-100">
          {t('admin.ultimaSettings.inlineSettings', { defaultValue: 'Параметры Ultima' })}
        </h2>
        {isLoading ? (
          <div className="py-8 text-center text-dark-400">{t('common.loading')}</div>
        ) : ultimaSettings.length === 0 ? (
          <div className="rounded-xl border border-dark-700/40 bg-dark-800/40 p-6 text-center text-sm text-dark-400">
            {t('admin.ultimaSettings.noSettings', {
              defaultValue:
                'Параметры Ultima не найдены. Проверьте категории MINIAPP/HAPP в системных настройках.',
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {ultimaSettings.map((setting) => (
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
