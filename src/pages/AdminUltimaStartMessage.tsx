import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminMenuLayoutApi } from '@/api/adminMenuLayout';
import { AdminBackButton } from '@/components/admin';

export default function AdminUltimaStartMessage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [messageText, setMessageText] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: ultimaStartConfig, isLoading } = useQuery({
    queryKey: ['admin', 'menu-layout', 'ultima-start'],
    queryFn: adminMenuLayoutApi.getUltimaStartConfig,
  });

  useEffect(() => {
    if (!ultimaStartConfig) return;
    setMessageText(ultimaStartConfig.message_text || '');
    setButtonText(ultimaStartConfig.button_text || '');
    setButtonUrl(ultimaStartConfig.button_url || '');
  }, [ultimaStartConfig]);

  const updateMutation = useMutation({
    mutationFn: adminMenuLayoutApi.updateUltimaStartConfig,
    onSuccess: () => {
      setError(null);
      setSuccess(t('admin.mainMenuButtons.ultimaStartSaved'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'menu-layout', 'ultima-start'] });
    },
    onError: () => {
      setSuccess(null);
      setError(t('admin.mainMenuButtons.ultimaStartSaveError'));
    },
  });

  const onSave = () => {
    const nextMessageText = messageText.trim();
    const nextButtonText = buttonText.trim();
    const nextButtonUrl = buttonUrl.trim();

    if (!nextMessageText || !nextButtonText) {
      setSuccess(null);
      setError(t('admin.mainMenuButtons.ultimaStartValidationError'));
      return;
    }

    setError(null);
    updateMutation.mutate({
      message_text: nextMessageText,
      button_text: nextButtonText,
      button_url: nextButtonUrl,
    });
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
            disabled={isLoading || updateMutation.isPending}
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
              disabled={isLoading || updateMutation.isPending}
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
              disabled={isLoading || updateMutation.isPending}
            />
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (!ultimaStartConfig) return;
              setMessageText(ultimaStartConfig.message_text || '');
              setButtonText(ultimaStartConfig.button_text || '');
              setButtonUrl(ultimaStartConfig.button_url || '');
              setError(null);
              setSuccess(null);
            }}
            disabled={isLoading || updateMutation.isPending}
          >
            {t('common.reset', { defaultValue: 'Сбросить' })}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onSave}
            disabled={isLoading || updateMutation.isPending}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
