import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminMenuLayoutApi, type UltimaNotificationButton } from '@/api/adminMenuLayout';
import { AdminBackButton } from '@/components/admin';

const PATH_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '/subscription/purchase', label: 'Покупка подписки' },
  { value: '/connection', label: 'Установка и настройка' },
  { value: '/support', label: 'Поддержка (тикеты)' },
  { value: '/subscription', label: 'Моя подписка' },
  { value: '/profile', label: 'Профиль' },
  { value: '/balance/top-up', label: 'Пополнение баланса' },
  { value: '/ultima/gift', label: 'Подарки' },
  { value: '/', label: 'Главная miniapp' },
];

const DEFAULT_NOTIFICATION_BUTTONS: UltimaNotificationButton[] = [
  { text: '💳 Купить подписку', path: '/subscription/purchase' },
  { text: '💰 Пополнить баланс', path: '/balance/top-up' },
  { text: '🛠 Установка и настройка', path: '/connection' },
  { text: '💬 Поддержка', path: '/support' },
];

export default function AdminUltimaStartMessage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [messageText, setMessageText] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationButtons, setNotificationButtons] = useState<UltimaNotificationButton[]>(
    DEFAULT_NOTIFICATION_BUTTONS,
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: ultimaStartConfig, isLoading: isLoadingStart } = useQuery({
    queryKey: ['admin', 'menu-layout', 'ultima-start'],
    queryFn: adminMenuLayoutApi.getUltimaStartConfig,
  });

  const { data: ultimaNotificationsConfig, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['admin', 'menu-layout', 'ultima-notification-buttons'],
    queryFn: adminMenuLayoutApi.getUltimaNotificationButtonsConfig,
  });

  useEffect(() => {
    if (!ultimaStartConfig) {
      return;
    }
    setMessageText(ultimaStartConfig.message_text || '');
    setButtonText(ultimaStartConfig.button_text || '');
    setButtonUrl(ultimaStartConfig.button_url || '');
  }, [ultimaStartConfig]);

  useEffect(() => {
    if (!ultimaNotificationsConfig) {
      return;
    }
    setNotificationsEnabled(ultimaNotificationsConfig.enabled);
    setNotificationButtons(
      ultimaNotificationsConfig.buttons.length > 0
        ? ultimaNotificationsConfig.buttons
        : DEFAULT_NOTIFICATION_BUTTONS,
    );
  }, [ultimaNotificationsConfig]);

  const updateStartMutation = useMutation({
    mutationFn: adminMenuLayoutApi.updateUltimaStartConfig,
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: adminMenuLayoutApi.updateUltimaNotificationButtonsConfig,
  });

  const isSaving = updateStartMutation.isPending || updateNotificationsMutation.isPending;
  const isLoading = isLoadingStart || isLoadingNotifications;

  const canAddNotificationButton = useMemo(
    () => notificationButtons.length < 6,
    [notificationButtons],
  );

  const onSave = async () => {
    const nextMessageText = messageText.trim();
    const nextButtonText = buttonText.trim();
    const nextButtonUrl = buttonUrl.trim();
    const nextNotificationButtons = notificationButtons
      .map((button) => ({
        text: button.text.trim(),
        path: button.path.trim(),
      }))
      .filter((button) => button.text.length > 0 && button.path.length > 0);

    if (!nextMessageText || !nextButtonText) {
      setSuccess(null);
      setError(t('admin.mainMenuButtons.ultimaStartValidationError'));
      return;
    }

    if (notificationsEnabled && nextNotificationButtons.length === 0) {
      setSuccess(null);
      setError(t('admin.mainMenuButtons.ultimaNotificationsValidationError'));
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await Promise.all([
        updateStartMutation.mutateAsync({
          message_text: nextMessageText,
          button_text: nextButtonText,
          button_url: nextButtonUrl,
        }),
        updateNotificationsMutation.mutateAsync({
          enabled: notificationsEnabled,
          buttons: nextNotificationButtons,
        }),
      ]);

      setSuccess(t('admin.mainMenuButtons.ultimaStartSaved'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'menu-layout', 'ultima-start'] }),
        queryClient.invalidateQueries({
          queryKey: ['admin', 'menu-layout', 'ultima-notification-buttons'],
        }),
      ]);
    } catch {
      setSuccess(null);
      setError(t('admin.mainMenuButtons.ultimaStartSaveError'));
    }
  };

  const resetForm = () => {
    if (ultimaStartConfig) {
      setMessageText(ultimaStartConfig.message_text || '');
      setButtonText(ultimaStartConfig.button_text || '');
      setButtonUrl(ultimaStartConfig.button_url || '');
    }
    if (ultimaNotificationsConfig) {
      setNotificationsEnabled(ultimaNotificationsConfig.enabled);
      setNotificationButtons(
        ultimaNotificationsConfig.buttons.length > 0
          ? ultimaNotificationsConfig.buttons
          : DEFAULT_NOTIFICATION_BUTTONS,
      );
    }
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="mb-2 flex items-center gap-3">
        <AdminBackButton to="/admin/ultima-settings" />
        <div>
          <h1 className="text-xl font-semibold text-dark-100">
            {t('admin.mainMenuButtons.ultimaStartTitle')}
          </h1>
          <p className="text-sm text-dark-400">{t('admin.mainMenuButtons.ultimaStartSubtitle')}</p>
        </div>
      </div>

      <div className="card space-y-3 p-4">
        {error && (
          <div className="rounded-lg border border-error-500/30 bg-error-500/10 px-3 py-2 text-sm text-error-300">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-success-500/30 bg-success-500/10 px-3 py-2 text-sm text-success-300">
            {success}
          </div>
        )}

        <label className="space-y-1">
          <span className="text-xs text-dark-400">
            {t('admin.mainMenuButtons.ultimaStartMessageLabel')}
          </span>
          <textarea
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            className="input min-h-[180px] resize-y"
            maxLength={4096}
            disabled={isLoading || isSaving}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-dark-400">
              {t('admin.mainMenuButtons.ultimaStartButtonTextLabel')}
            </span>
            <input
              value={buttonText}
              onChange={(event) => setButtonText(event.target.value)}
              className="input"
              maxLength={64}
              disabled={isLoading || isSaving}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-dark-400">
              {t('admin.mainMenuButtons.ultimaStartButtonUrlLabel')}
            </span>
            <input
              value={buttonUrl}
              onChange={(event) => setButtonUrl(event.target.value)}
              className="input"
              maxLength={1024}
              placeholder="https://..."
              disabled={isLoading || isSaving}
            />
          </label>
        </div>

        <div className="mt-2 rounded-lg border border-dark-700/50 bg-dark-800/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-dark-100">
                {t('admin.mainMenuButtons.ultimaNotificationsTitle')}
              </h3>
              <p className="text-xs text-dark-400">
                {t('admin.mainMenuButtons.ultimaNotificationsSubtitle')}
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-dark-300">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-dark-600 bg-dark-900 text-accent-400"
                checked={notificationsEnabled}
                onChange={(event) => setNotificationsEnabled(event.target.checked)}
                disabled={isLoading || isSaving}
              />
              {t('admin.mainMenuButtons.ultimaNotificationsEnabled')}
            </label>
          </div>

          <div className="mt-3 space-y-2">
            {notificationButtons.map((button, index) => (
              <div
                key={`notif-button-${index}`}
                className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_220px_auto]"
              >
                <input
                  className="input"
                  value={button.text}
                  onChange={(event) => {
                    const value = event.target.value;
                    setNotificationButtons((previous) =>
                      previous.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, text: value } : item,
                      ),
                    );
                  }}
                  maxLength={64}
                  placeholder={t('admin.mainMenuButtons.ultimaNotificationsButtonTextPlaceholder')}
                  disabled={isLoading || isSaving}
                />
                <select
                  className="input"
                  value={button.path}
                  onChange={(event) => {
                    const value = event.target.value;
                    setNotificationButtons((previous) =>
                      previous.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, path: value } : item,
                      ),
                    );
                  }}
                  disabled={isLoading || isSaving}
                >
                  {PATH_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-secondary px-3"
                  onClick={() => {
                    setNotificationButtons((previous) =>
                      previous.filter((_, itemIndex) => itemIndex !== index),
                    );
                  }}
                  disabled={isLoading || isSaving || notificationButtons.length <= 1}
                >
                  {t('common.delete', { defaultValue: 'Удалить' })}
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (!canAddNotificationButton) {
                  return;
                }
                setNotificationButtons((previous) => [
                  ...previous,
                  { text: '', path: PATH_OPTIONS[0]?.value || '/subscription/purchase' },
                ]);
              }}
              disabled={isLoading || isSaving || !canAddNotificationButton}
            >
              {t('admin.mainMenuButtons.ultimaNotificationsAddButton')}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setNotificationButtons(DEFAULT_NOTIFICATION_BUTTONS)}
              disabled={isLoading || isSaving}
            >
              {t('admin.mainMenuButtons.ultimaNotificationsFillDefaults')}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={resetForm}
            disabled={isLoading || isSaving}
          >
            {t('common.reset', { defaultValue: 'Сбросить' })}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              void onSave();
            }}
            disabled={isLoading || isSaving}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
