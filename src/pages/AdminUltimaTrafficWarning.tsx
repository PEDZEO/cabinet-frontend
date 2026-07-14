import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, Gauge, MessageSquareText, RotateCcw, Save, ShoppingBag } from 'lucide-react';
import { adminSettingsApi } from '@/api/adminSettings';
import { AdminBackButton, Toggle, stripHtml } from '@/components/admin';

const ENABLED_KEY = 'WEBHOOK_NOTIFY_BANDWIDTH_THRESHOLD';
const PERCENT_KEY = 'ULTIMA_TRAFFIC_WARNING_DEFAULT_PERCENT';
const MESSAGE_KEY = 'ULTIMA_TRAFFIC_WARNING_MESSAGE_RU';

const DEFAULT_MESSAGE =
  '📊 <b>Трафик почти закончился</b>\n\n' +
  'Использовано <b>{percent}%</b>: {used_gb} из {limit_gb} ГБ.\n' +
  'Осталось <b>{remaining_gb} ГБ</b>.\n\n' +
  'Докупить трафик можно сейчас — дополнительный пакет будет действовать 30 дней.';

const TEMPLATE_VARIABLES = ['percent', 'used_gb', 'limit_gb', 'remaining_gb'] as const;
const SAMPLE_VALUES: Record<(typeof TEMPLATE_VARIABLES)[number], string> = {
  percent: '85',
  used_gb: '85',
  limit_gb: '100',
  remaining_gb: '15',
};

type TrafficWarningForm = {
  enabled: boolean;
  percent: number;
  message: string;
};

const buildPreview = (message: string) => {
  const withValues = TEMPLATE_VARIABLES.reduce(
    (result, variable) => result.split(`{${variable}}`).join(SAMPLE_VALUES[variable]),
    message,
  );
  return stripHtml(withValues.replace(/<br\s*\/?>/gi, '\n'));
};

const validateMessage = (message: string) => {
  if (!message.trim()) return 'Введите текст уведомления.';
  if (message.length > 4096) return 'Текст не должен превышать 4096 символов.';

  const variables = Array.from(message.matchAll(/\{([^{}]+)\}/g), (match) => match[1]);
  const unsupported = variables.find(
    (variable) => !TEMPLATE_VARIABLES.includes(variable as (typeof TEMPLATE_VARIABLES)[number]),
  );
  return unsupported ? `Неизвестная переменная: {${unsupported}}` : null;
};

export default function AdminUltimaTrafficWarning() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TrafficWarningForm>({
    enabled: true,
    percent: 80,
    message: DEFAULT_MESSAGE,
  });
  const [savedForm, setSavedForm] = useState<TrafficWarningForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ultima', 'traffic-warning'],
    queryFn: async (): Promise<TrafficWarningForm> => {
      const [enabled, percent, message] = await Promise.all([
        adminSettingsApi.getSetting(ENABLED_KEY),
        adminSettingsApi.getSetting(PERCENT_KEY),
        adminSettingsApi.getSetting(MESSAGE_KEY),
      ]);
      return {
        enabled: enabled.current === true || enabled.current === 'true',
        percent: Number(percent.current) || 80,
        message: String(message.current || DEFAULT_MESSAGE),
      };
    },
  });

  useEffect(() => {
    if (!data) return;
    setForm(data);
    setSavedForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (values: TrafficWarningForm) => {
      await Promise.all([
        adminSettingsApi.updateSetting(ENABLED_KEY, values.enabled),
        adminSettingsApi.updateSetting(PERCENT_KEY, values.percent),
        adminSettingsApi.updateSetting(MESSAGE_KEY, values.message.trim()),
      ]);
      return { ...values, message: values.message.trim() };
    },
    onSuccess: async (values) => {
      setForm(values);
      setSavedForm(values);
      setError(null);
      setSuccess('Настройки предупреждения сохранены.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'ultima', 'traffic-warning'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-settings'] }),
      ]);
    },
    onError: () => {
      setSuccess(null);
      setError('Не удалось сохранить настройки. Проверьте значения и повторите попытку.');
    },
  });

  const preview = useMemo(() => buildPreview(form.message), [form.message]);
  const isDirty = savedForm ? JSON.stringify(form) !== JSON.stringify(savedForm) : false;

  const save = () => {
    const messageError = validateMessage(form.message);
    if (messageError) {
      setSuccess(null);
      setError(messageError);
      return;
    }
    if (!Number.isInteger(form.percent) || form.percent < 25 || form.percent > 95) {
      setSuccess(null);
      setError('Порог должен быть целым числом от 25 до 95%.');
      return;
    }
    setError(null);
    setSuccess(null);
    saveMutation.mutate(form);
  };

  const reset = () => {
    if (savedForm) setForm(savedForm);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3">
        <AdminBackButton to="/admin/ultima-settings" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-dark-100">Заканчивается трафик</h1>
          <p className="text-sm text-dark-400">Предупреждение с прямым переходом к докупке</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-error-500/30 bg-error-500/10 px-3 py-2 text-sm text-error-300">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-success-500/30 bg-success-500/10 px-3 py-2 text-sm text-success-300">
          {success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4 rounded-lg border border-dark-700/50 bg-dark-800/30 p-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-dark-700/45 bg-dark-900/30 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="rounded-lg bg-accent-500/10 p-2 text-accent-300">
                <BellRing size={18} />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-dark-100">Предупреждать пользователей</h2>
                <p className="truncate text-xs text-dark-500">
                  Для тарифов с ограниченным трафиком
                </p>
              </div>
            </div>
            <Toggle
              checked={form.enabled}
              onChange={() => setForm((current) => ({ ...current, enabled: !current.enabled }))}
              disabled={isLoading || saveMutation.isPending}
              aria-label="Включить предупреждение о трафике"
            />
          </div>

          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium text-dark-200">
              <Gauge size={16} className="text-dark-500" />
              Порог по умолчанию
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={25}
                max={95}
                step={1}
                value={form.percent}
                onChange={(event) =>
                  setForm((current) => ({ ...current, percent: Number(event.target.value) }))
                }
                className="input max-w-32"
                disabled={isLoading || saveMutation.isPending || !form.enabled}
              />
              <span className="text-sm text-dark-400">% использовано</span>
            </div>
            <p className="text-xs leading-5 text-dark-500">
              Личный порог из профиля пользователя имеет приоритет.
            </p>
          </label>

          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium text-dark-200">
              <MessageSquareText size={16} className="text-dark-500" />
              Текст уведомления
            </span>
            <textarea
              value={form.message}
              onChange={(event) =>
                setForm((current) => ({ ...current, message: event.target.value }))
              }
              className="input min-h-52 resize-y font-mono text-sm leading-6"
              maxLength={4096}
              disabled={isLoading || saveMutation.isPending || !form.enabled}
            />
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  className="rounded-md border border-dark-700/60 bg-dark-900/50 px-2 py-1 font-mono text-[11px] text-dark-300 transition hover:border-accent-500/40 hover:text-accent-300"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      message: `${current.message}{${variable}}`,
                    }))
                  }
                  disabled={isLoading || saveMutation.isPending || !form.enabled}
                >
                  {`{${variable}}`}
                </button>
              ))}
            </div>
          </label>

          <div className="flex flex-wrap justify-end gap-2 border-t border-dark-700/40 pt-4">
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2"
              onClick={reset}
              disabled={!isDirty || isLoading || saveMutation.isPending}
            >
              <RotateCcw size={16} />
              Отменить
            </button>
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2"
              onClick={save}
              disabled={!isDirty || isLoading || saveMutation.isPending}
            >
              <Save size={16} />
              {saveMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </section>

        <aside className="h-fit rounded-lg border border-dark-700/50 bg-dark-800/30 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-dark-100">Предпросмотр</h2>
            <span className="rounded-full border border-accent-500/25 bg-accent-500/10 px-2 py-0.5 text-[11px] text-accent-300">
              Telegram
            </span>
          </div>
          <div className="rounded-lg border border-dark-700/50 bg-dark-950/60 p-3">
            <p className="whitespace-pre-wrap text-sm leading-6 text-dark-200">
              {preview || 'Текст уведомления'}
            </p>
            <div className="mt-3 space-y-2 border-t border-dark-700/45 pt-3">
              <div className="flex items-center justify-center gap-2 rounded-lg bg-accent-500 px-3 py-2.5 text-sm font-semibold text-dark-950">
                <ShoppingBag size={16} />
                Докупить трафик
              </div>
              <div className="rounded-lg border border-dark-700/60 px-3 py-2 text-center text-sm text-dark-300">
                Моя подписка
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-dark-500">
            Событие отправляет Remnawave. В панели должны быть включены bandwidth notifications с
            нужным порогом.
          </p>
        </aside>
      </div>
    </div>
  );
}
