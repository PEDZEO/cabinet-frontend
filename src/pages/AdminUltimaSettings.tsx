import { useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminSettingsApi } from '@/api/adminSettings';
import { AdminBackButton } from '@/components/admin';
import { groupUltimaSettings, isUltimaSetting } from './adminUltimaSettings/utils';

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

export default function AdminUltimaSettings() {
  const { t } = useTranslation();

  const { data: allSettings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminSettingsApi.getSettings(),
  });

  const ultimaSettings = useMemo(
    () => (allSettings ?? []).filter((setting) => isUltimaSetting(setting)),
    [allSettings],
  );
  const groupedUltimaSettings = useMemo(
    () => groupUltimaSettings(ultimaSettings),
    [ultimaSettings],
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

      <div className="rounded-2xl border border-dark-700/50 bg-dark-800/30 p-4">
        <h2 className="mb-3 text-base font-semibold text-dark-100">
          {t('admin.ultimaSettings.pages', { defaultValue: 'Страницы Ultima' })}
        </h2>
        <div className="space-y-2">
          <Link
            to="/admin/ultima-settings/start-message"
            className="group flex items-start gap-3 rounded-xl border border-dark-700/50 bg-dark-800/40 px-4 py-3 transition-colors hover:border-violet-400/40 hover:bg-dark-800/70"
          >
            <span className="mt-0.5 text-violet-300">
              <StartMessageIcon />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-dark-100">
                {t('admin.ultimaSettings.startMessageTitle', {
                  defaultValue: 'Сообщение после /start',
                })}
              </span>
              <span className="block text-xs text-dark-400">
                {t('admin.ultimaSettings.startMessageDesc', {
                  defaultValue:
                    'Отдельная настройка текста и кнопки стартового сообщения Ultima в боте.',
                })}
              </span>
            </span>
          </Link>
          <Link
            to="/admin/ultima-settings/agreement"
            className="group flex items-start gap-3 rounded-xl border border-dark-700/50 bg-dark-800/40 px-4 py-3 transition-colors hover:border-violet-400/40 hover:bg-dark-800/70"
          >
            <span className="mt-0.5 text-violet-300">
              <DocIcon />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-dark-100">
                {t('admin.ultimaSettings.agreementTitle', {
                  defaultValue: 'Пользовательское соглашение',
                })}
              </span>
              <span className="block text-xs text-dark-400">
                {t('admin.ultimaSettings.agreementDesc', {
                  defaultValue:
                    'Отдельная страница редактирования текста соглашения для режима Ultima.',
                })}
              </span>
            </span>
          </Link>
        </div>
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
          <div className="space-y-2">
            {groupedUltimaSettings.map((group) => (
              <Link
                key={group.key}
                to={`/admin/ultima-settings/params/${encodeURIComponent(group.key)}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-dark-700/50 bg-dark-800/40 px-4 py-3 transition-colors hover:border-violet-400/40 hover:bg-dark-800/70"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-dark-100">
                    {group.label}
                  </span>
                  <span className="block text-xs text-dark-400">
                    {t('admin.ultimaSettings.paramsCount', {
                      defaultValue: '{{count}} параметров',
                      count: group.items.length,
                    })}
                  </span>
                </span>
                <span className="shrink-0 text-dark-400 transition-colors group-hover:text-violet-300">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
