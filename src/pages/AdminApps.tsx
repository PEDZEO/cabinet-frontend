import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Link2, LoaderCircle, ShieldCheck } from 'lucide-react';
import { adminAppsApi } from '../api/adminApps';
import { Toggle } from '../components/admin/Toggle';
import { useToast } from '../components/Toast';
import { usePlatform } from '../platform/hooks/usePlatform';

export default function AdminApps() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { capabilities } = usePlatform();
  const { showToast } = useToast();

  const {
    data: cryptoLinksSettings,
    isLoading: isLoadingCryptoLinks,
    isError: cryptoLinksSettingsFailed,
  } = useQuery({
    queryKey: ['admin-apps-crypto-links'],
    queryFn: adminAppsApi.getCryptoLinksSettings,
    staleTime: 30000,
  });

  const updateCryptoLinksMutation = useMutation({
    mutationFn: adminAppsApi.updateCryptoLinksSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['admin-apps-crypto-links'], data);
      queryClient.invalidateQueries({ queryKey: ['appConfig'] });
      queryClient.invalidateQueries({ queryKey: ['connectionLink'] });
      showToast({
        type: 'success',
        title: t('admin.apps.cryptoLinksSavedTitle', 'Настройка сохранена'),
        message: data.enabled
          ? t('admin.apps.cryptoLinksEnabledMessage', 'Защищённые ссылки включены.')
          : t('admin.apps.cryptoLinksDisabledMessage', 'Пользователям выдаются обычные ссылки.'),
      });
    },
    onError: () => {
      showToast({
        type: 'error',
        title: t('admin.apps.cryptoLinksErrorTitle', 'Не удалось сохранить'),
        message: t('admin.apps.cryptoLinksErrorMessage', 'Повторите попытку немного позже.'),
      });
    },
  });

  // RemnaWave status
  const { data: status } = useQuery({
    queryKey: ['remnawave-status'],
    queryFn: adminAppsApi.getRemnaWaveStatus,
    staleTime: 60000,
  });

  // Available configs
  const { data: configs, isLoading: isLoadingConfigs } = useQuery({
    queryKey: ['remnawave-configs-list'],
    queryFn: adminAppsApi.listRemnaWaveConfigs,
    staleTime: 30000,
  });

  // Set UUID mutation
  const setUuidMutation = useMutation({
    mutationFn: adminAppsApi.setRemnaWaveUuid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remnawave-status'] });
      queryClient.invalidateQueries({ queryKey: ['remnawave-config'] });
      queryClient.invalidateQueries({ queryKey: ['appConfig'] });
    },
  });

  const currentUuid = status?.config_uuid || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {!capabilities.hasBackButton && (
          <button
            type="button"
            onClick={() => navigate('/admin')}
            aria-label={t('common.back', 'Назад')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-700 bg-dark-800 transition-colors hover:border-dark-600"
          >
            <ArrowLeft className="h-5 w-5 text-dark-400" aria-hidden="true" />
          </button>
        )}
        <h1 className="text-2xl font-bold text-dark-50 sm:text-3xl">{t('admin.apps.title')}</h1>
      </div>

      {/* Status card */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${status?.enabled ? 'bg-success-400' : 'bg-dark-600'}`}
          />
          <span className="text-sm font-medium text-dark-200">
            {status?.enabled
              ? t('admin.apps.remnaWaveConnected', 'RemnaWave connected')
              : t('admin.apps.remnaWaveDisconnected', 'RemnaWave not connected')}
          </span>
        </div>
        {status?.config_uuid && (
          <div className="mt-2 truncate font-mono text-xs text-dark-500">
            UUID: {status.config_uuid}
          </div>
        )}
      </div>

      <section className="card p-4 sm:p-5" data-testid="admin-crypto-links-settings">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div>
                <h2 className="text-base font-semibold text-dark-100">
                  {t('admin.apps.cryptoLinksTitle', 'Защищённые ссылки')}
                </h2>
                <p className="mt-1 text-sm leading-5 text-dark-400">
                  {t(
                    'admin.apps.cryptoLinksDescription',
                    'Happ использует crypt5, INCY — crypt1. При отключении кабинет выдаёт обычную ссылку подписки.',
                  )}
                </p>
              </div>
              {isLoadingCryptoLinks ? (
                <LoaderCircle className="h-6 w-6 animate-spin text-dark-500" aria-hidden="true" />
              ) : (
                <Toggle
                  checked={Boolean(cryptoLinksSettings?.enabled)}
                  onChange={() => updateCryptoLinksMutation.mutate(!cryptoLinksSettings?.enabled)}
                  disabled={updateCryptoLinksMutation.isPending || cryptoLinksSettingsFailed}
                  aria-label={t('admin.apps.cryptoLinksToggle', 'Включить защищённые ссылки')}
                  data-testid="admin-crypto-links-toggle"
                />
              )}
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-dark-700/70 pt-3 text-xs text-dark-400">
              <Link2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {cryptoLinksSettingsFailed
                  ? t(
                      'admin.apps.cryptoLinksStatusError',
                      'Не удалось загрузить состояние настройки',
                    )
                  : cryptoLinksSettings?.enabled
                    ? t(
                        'admin.apps.cryptoLinksStatusEnabled',
                        'Включено: Happ crypt5 и INCY crypt1',
                      )
                    : t(
                        'admin.apps.cryptoLinksStatusDisabled',
                        'Отключено: используется обычная ссылка',
                      )}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Available configs */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-dark-300">
          {t('admin.apps.availableConfigs', 'Available configs')}
        </h2>
        {isLoadingConfigs ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
          </div>
        ) : configs && configs.length > 0 ? (
          <div className="space-y-2">
            {configs.map((config) => (
              <button
                key={config.uuid}
                onClick={() => {
                  if (config.uuid !== currentUuid) {
                    setUuidMutation.mutate(config.uuid);
                  }
                }}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  currentUuid === config.uuid
                    ? 'border-accent-500 bg-accent-500/10'
                    : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                }`}
              >
                <div className="font-medium text-dark-100">{config.name}</div>
                <div className="mt-1 font-mono text-xs text-dark-500">{config.uuid}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="card py-8 text-center text-sm text-dark-500">
            {t('admin.apps.noConfigs', 'No configs available')}
          </div>
        )}
      </div>
    </div>
  );
}
