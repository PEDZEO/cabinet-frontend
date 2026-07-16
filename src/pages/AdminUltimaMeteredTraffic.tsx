import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Network,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  adminSettingsApi,
  type MeteredTrafficConfiguration,
  type MeteredTrafficConfigurationResponse,
  type MeteredTrafficNode,
} from '@/api/adminSettings';
import { AdminBackButton, Toggle } from '@/components/admin';
import { cn } from '@/lib/utils';

const TEMPLATE_VARIABLES = ['percent', 'used_gb', 'limit_gb', 'remaining_gb'] as const;

type ApiErrorLike = {
  response?: { data?: { detail?: string } };
};

function getErrorMessage(error: unknown, fallback: string): string {
  const detail = (error as ApiErrorLike)?.response?.data?.detail;
  return typeof detail === 'string' && detail.trim() ? detail : fallback;
}

function normalizedConfiguration(configuration: MeteredTrafficConfiguration) {
  return {
    ...configuration,
    squad_uuid: configuration.squad_uuid.trim(),
    server_label: configuration.server_label.trim(),
    exhausted_message_ru: configuration.exhausted_message_ru.trim(),
    metered_node_uuids: [...configuration.metered_node_uuids].sort(),
  };
}

function nodeStatus(node: MeteredTrafficNode) {
  if (node.is_disabled) return { label: 'Отключена', tone: 'text-dark-500', dot: 'bg-dark-500' };
  if (node.is_connected)
    return { label: 'Онлайн', tone: 'text-success-300', dot: 'bg-success-400' };
  return { label: 'Не в сети', tone: 'text-warning-300', dot: 'bg-warning-400' };
}

function formatLastRun(value: string | null): string {
  if (!value) return 'Ещё не запускался';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Время неизвестно';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function AdminUltimaMeteredTraffic() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MeteredTrafficConfiguration | null>(null);
  const [savedForm, setSavedForm] = useState<MeteredTrafficConfiguration | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const configurationQuery = useQuery({
    queryKey: ['admin', 'ultima', 'metered-traffic', 'configuration'],
    queryFn: adminSettingsApi.getMeteredTrafficConfiguration,
  });

  useEffect(() => {
    if (!configurationQuery.data) return;
    setForm(configurationQuery.data.configuration);
    setSavedForm(configurationQuery.data.configuration);
  }, [configurationQuery.data]);

  const saveMutation = useMutation({
    mutationFn: adminSettingsApi.updateMeteredTrafficConfiguration,
    onSuccess: async (response) => {
      setForm(response.configuration);
      setSavedForm(response.configuration);
      setError(null);
      setSuccess(
        response.nodes_updated > 0
          ? `Настройки сохранены. Коэффициенты обновлены у ${response.nodes_updated} нод.`
          : 'Настройки сохранены. Коэффициенты нод уже были правильными.',
      );
      queryClient.setQueryData(['admin', 'ultima', 'metered-traffic', 'configuration'], response);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-settings'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'ultima', 'metered-traffic'] }),
      ]);
    },
    onError: (mutationError) => {
      setSuccess(null);
      setError(
        getErrorMessage(
          mutationError,
          'Не удалось применить настройки. Проверьте соединение с Remnawave и повторите попытку.',
        ),
      );
    },
  });

  const runMutation = useMutation({
    mutationFn: adminSettingsApi.runMeteredTrafficCheck,
    onSuccess: async (status) => {
      setError(null);
      setSuccess(
        status.last_stats
          ? `Проверено подписок: ${status.last_stats.checked}. Ошибок: ${status.last_stats.errors}.`
          : 'Проверка завершена.',
      );
      queryClient.setQueryData<MeteredTrafficConfigurationResponse>(
        ['admin', 'ultima', 'metered-traffic', 'configuration'],
        (current) => (current ? { ...current, status } : current),
      );
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'ultima', 'metered-traffic'],
      });
    },
    onError: (mutationError) => {
      setSuccess(null);
      setError(getErrorMessage(mutationError, 'Проверка завершилась с ошибкой.'));
    },
  });

  const selectedNodes = useMemo(() => new Set(form?.metered_node_uuids ?? []), [form]);
  const filteredNodes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const nodes = configurationQuery.data?.nodes ?? [];
    if (!query) return nodes;
    return nodes.filter((node) =>
      [node.name, node.address, node.country_code, node.uuid]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [configurationQuery.data?.nodes, search]);

  const selectedSquad = configurationQuery.data?.squads.find(
    (squad) => squad.uuid === form?.squad_uuid,
  );
  const desiredChanges = (configurationQuery.data?.nodes ?? []).filter((node) => {
    const desired = selectedNodes.has(node.uuid) ? 1 : 0;
    return Math.abs(node.consumption_multiplier - desired) > 0.001;
  }).length;
  const isDirty = Boolean(
    form &&
    savedForm &&
    JSON.stringify(normalizedConfiguration(form)) !==
      JSON.stringify(normalizedConfiguration(savedForm)),
  );
  const hasPendingChanges = isDirty || desiredChanges > 0;
  const isBusy = saveMutation.isPending || runMutation.isPending;

  const setNodeMetered = (nodeUuid: string, metered: boolean) => {
    setForm((current) => {
      if (!current) return current;
      const next = new Set(current.metered_node_uuids);
      if (metered) next.add(nodeUuid);
      else next.delete(nodeUuid);
      return { ...current, metered_node_uuids: [...next] };
    });
    setSuccess(null);
  };

  const save = () => {
    if (!form) return;
    if (form.enabled && !form.squad_uuid) {
      setError('Выберите сквад, который будет отключаться после расходования лимита.');
      return;
    }
    if (form.enabled && form.metered_node_uuids.length === 0) {
      setError('Выберите хотя бы одну ноду с коэффициентом 1×.');
      return;
    }
    if (!form.server_label.trim()) {
      setError('Введите название тарифицируемой группы серверов.');
      return;
    }
    if (!form.exhausted_message_ru.trim()) {
      setError('Введите текст уведомления об исчерпании трафика.');
      return;
    }
    setError(null);
    setSuccess(null);
    saveMutation.mutate(normalizedConfiguration(form));
  };

  const reset = () => {
    if (savedForm) setForm(savedForm);
    setError(null);
    setSuccess(null);
  };

  if (configurationQuery.isLoading) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center gap-3">
          <AdminBackButton to="/admin/ultima-settings" />
          <div>
            <h1 className="text-xl font-semibold text-dark-100">Раздельный трафик</h1>
            <p className="text-sm text-dark-400">Загрузка сквадов и нод из Remnawave...</p>
          </div>
        </div>
        <div className="h-40 animate-pulse rounded-lg border border-dark-700/50 bg-dark-800/30" />
      </div>
    );
  }

  if (configurationQuery.isError || !configurationQuery.data) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center gap-3">
          <AdminBackButton to="/admin/ultima-settings" />
          <h1 className="text-xl font-semibold text-dark-100">Раздельный трафик</h1>
        </div>
        <div className="rounded-lg border border-error-500/30 bg-error-500/10 p-4 text-sm text-error-300">
          {getErrorMessage(
            configurationQuery.error,
            'Не удалось загрузить сквады и ноды из Remnawave.',
          )}
        </div>
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-2"
          onClick={() => configurationQuery.refetch()}
        >
          <RefreshCw size={16} />
          Повторить
        </button>
      </div>
    );
  }

  if (!form) return null;

  const { status, squads, nodes, topology_errors: topologyErrors } = configurationQuery.data;

  return (
    <div className="animate-fade-in space-y-4 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AdminBackButton to="/admin/ultima-settings" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-dark-100">Раздельный трафик</h1>
            <p className="text-sm text-dark-400">Сквад, учет нод и коэффициенты в одном месте</p>
          </div>
        </div>
        <button
          type="button"
          className="btn-secondary inline-flex h-10 w-10 items-center justify-center p-0"
          onClick={() => configurationQuery.refetch()}
          disabled={configurationQuery.isFetching || isBusy}
          title="Обновить данные из Remnawave"
          aria-label="Обновить данные из Remnawave"
        >
          <RefreshCw size={17} className={configurationQuery.isFetching ? 'animate-spin' : ''} />
        </button>
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

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-dark-700/50 bg-dark-800/30 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="rounded-lg bg-accent-500/10 p-2 text-accent-300">
            <Network size={19} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-dark-100">Раздельный учет включен</h2>
            <p className="text-xs leading-5 text-dark-500">
              После лимита отключается только выбранный сквад, остальные серверы работают
              безлимитно.
            </p>
          </div>
        </div>
        <Toggle
          checked={form.enabled}
          onChange={() => {
            setForm((current) => (current ? { ...current, enabled: !current.enabled } : current));
            setSuccess(null);
          }}
          disabled={isBusy}
          aria-label="Включить раздельный учет трафика"
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-4 rounded-lg border border-dark-700/50 bg-dark-800/30 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-accent-300" />
            <div>
              <h2 className="text-sm font-semibold text-dark-100">Технический сквад</h2>
              <p className="text-xs text-dark-500">
                Он скрыт от выбора пользователя и снимается по лимиту.
              </p>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-dark-400">
              Сквад Remnawave
            </span>
            <select
              className="input w-full"
              value={form.squad_uuid}
              onChange={(event) => {
                setForm((current) =>
                  current ? { ...current, squad_uuid: event.target.value } : current,
                );
                setSuccess(null);
              }}
              disabled={isBusy}
            >
              <option value="">Выберите сквад</option>
              {squads.map((squad) => (
                <option key={squad.uuid} value={squad.uuid}>
                  {squad.name} · {squad.inbounds_count} входящих подключений
                </option>
              ))}
            </select>
          </label>

          {selectedSquad ? (
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-dark-700/45 bg-dark-900/35 p-3 text-xs">
              <div>
                <span className="block text-dark-500">Пользователей</span>
                <span className="mt-1 block font-semibold text-dark-100">
                  {selectedSquad.members_count}
                </span>
              </div>
              <div>
                <span className="block text-dark-500">Inbounds</span>
                <span className="mt-1 block font-semibold text-dark-100">
                  {selectedSquad.inbounds_count}
                </span>
              </div>
            </div>
          ) : null}

          <div className="border-t border-dark-700/45 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Server size={18} className="text-accent-300" />
                <div>
                  <h2 className="text-sm font-semibold text-dark-100">Коэффициенты нод</h2>
                  <p className="text-xs text-dark-500">
                    1× расходует лимит, 0× остается безлимитной.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-full border border-accent-500/25 bg-accent-500/10 px-2 py-1 text-accent-300">
                  1×: {selectedNodes.size}
                </span>
                <span className="rounded-full border border-dark-700/60 bg-dark-900/40 px-2 py-1 text-dark-400">
                  0×: {Math.max(0, nodes.length - selectedNodes.size)}
                </span>
                {desiredChanges > 0 ? (
                  <span className="rounded-full border border-warning-500/25 bg-warning-500/10 px-2 py-1 text-warning-300">
                    изменится: {desiredChanges}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <label className="relative min-w-[220px] flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dark-500"
                />
                <input
                  type="search"
                  className="input w-full pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Найти ноду"
                />
              </label>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() =>
                  setForm((current) => (current ? { ...current, metered_node_uuids: [] } : current))
                }
                disabled={isBusy || selectedNodes.size === 0}
              >
                Все в 0×
              </button>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() =>
                  setForm((current) =>
                    current
                      ? {
                          ...current,
                          metered_node_uuids: nodes
                            .filter((node) => Math.abs(node.consumption_multiplier - 1) <= 0.001)
                            .map((node) => node.uuid),
                        }
                      : current,
                  )
                }
                disabled={isBusy}
              >
                Взять из панели
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-lg border border-dark-700/50 bg-dark-900/25">
              {filteredNodes.length === 0 ? (
                <div className="p-5 text-center text-sm text-dark-500">
                  {nodes.length === 0 ? 'В Remnawave нет нод.' : 'По запросу ничего не найдено.'}
                </div>
              ) : (
                <div className="divide-y divide-dark-700/40">
                  {filteredNodes.map((node) => {
                    const isMetered = selectedNodes.has(node.uuid);
                    const liveMismatch =
                      Math.abs(node.consumption_multiplier - (isMetered ? 1 : 0)) > 0.001;
                    const statusInfo = nodeStatus(node);
                    return (
                      <div
                        key={node.uuid}
                        className="flex flex-wrap items-center gap-3 px-3 py-3 sm:flex-nowrap"
                      >
                        <span
                          className={cn('h-2.5 w-2.5 shrink-0 rounded-full', statusInfo.dot)}
                          title={statusInfo.label}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-sm font-medium text-dark-100">
                              {node.name}
                            </span>
                            {node.country_code ? (
                              <span className="shrink-0 text-[10px] uppercase text-dark-500">
                                {node.country_code}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-0.5 flex min-w-0 items-center gap-2 text-[11px]">
                            <span className="truncate text-dark-500">{node.address}</span>
                            <span className={cn('shrink-0', statusInfo.tone)}>
                              {statusInfo.label}
                            </span>
                            {liveMismatch ? (
                              <span className="shrink-0 text-warning-300">
                                в панели{' '}
                                {node.consumption_multiplier.toLocaleString('ru-RU', {
                                  maximumFractionDigits: 1,
                                })}
                                ×
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div
                          className="grid w-full shrink-0 grid-cols-2 rounded-lg border border-dark-700/60 bg-dark-950/40 p-1 sm:w-[210px]"
                          role="group"
                          aria-label={`Коэффициент ноды ${node.name}`}
                        >
                          <button
                            type="button"
                            className={cn(
                              'min-h-8 rounded-md px-2 text-xs font-medium transition',
                              !isMetered
                                ? 'bg-dark-700/75 text-dark-100 shadow-sm'
                                : 'text-dark-500 hover:text-dark-300',
                            )}
                            onClick={() => setNodeMetered(node.uuid, false)}
                            disabled={isBusy}
                          >
                            0× Безлимит
                          </button>
                          <button
                            type="button"
                            className={cn(
                              'min-h-8 rounded-md px-2 text-xs font-medium transition',
                              isMetered
                                ? 'bg-accent-500 text-dark-950 shadow-sm'
                                : 'text-dark-500 hover:text-dark-300',
                            )}
                            onClick={() => setNodeMetered(node.uuid, true)}
                            disabled={isBusy}
                          >
                            1× Считать
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:h-fit">
          <section className="rounded-lg border border-dark-700/50 bg-dark-800/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-accent-300" />
                <h2 className="text-sm font-semibold text-dark-100">Состояние</h2>
              </div>
              <span
                className={cn(
                  'rounded-full border px-2 py-1 text-[11px]',
                  status.enabled && status.running
                    ? 'border-success-500/25 bg-success-500/10 text-success-300'
                    : 'border-dark-700/60 bg-dark-900/40 text-dark-400',
                )}
              >
                {status.enabled && status.running ? 'Работает' : 'Остановлен'}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-dark-900/35 px-2 py-3">
                <dt className="text-[10px] uppercase text-dark-500">Активных</dt>
                <dd className="mt-1 text-lg font-semibold text-dark-100">
                  {status.subscriptions.active}
                </dd>
              </div>
              <div className="rounded-lg bg-dark-900/35 px-2 py-3">
                <dt className="text-[10px] uppercase text-dark-500">Учтено</dt>
                <dd className="mt-1 text-lg font-semibold text-dark-100">
                  {status.subscriptions.initialized}
                </dd>
              </div>
              <div className="rounded-lg bg-dark-900/35 px-2 py-3">
                <dt className="text-[10px] uppercase text-dark-500">Лимит</dt>
                <dd className="mt-1 text-lg font-semibold text-warning-200">
                  {status.subscriptions.blocked}
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex items-center gap-2 text-xs text-dark-500">
              {status.running ? <Wifi size={14} /> : <WifiOff size={14} />}
              Последняя проверка: {formatLastRun(status.last_run_at)}
            </div>

            {status.last_error ? (
              <div className="mt-3 rounded-lg border border-error-500/25 bg-error-500/10 p-2.5 text-xs leading-5 text-error-300">
                {status.last_error}
              </div>
            ) : null}

            <button
              type="button"
              className="btn-secondary mt-4 inline-flex w-full items-center justify-center gap-2"
              onClick={() => {
                setError(null);
                setSuccess(null);
                runMutation.mutate();
              }}
              disabled={!status.enabled || isBusy || hasPendingChanges}
              title={hasPendingChanges ? 'Сначала примените коэффициенты и настройки' : undefined}
            >
              <Play size={16} />
              {runMutation.isPending ? 'Проверяем...' : 'Проверить сейчас'}
            </button>
          </section>

          <section
            className={cn(
              'rounded-lg border p-4',
              topologyErrors.length > 0 || desiredChanges > 0
                ? 'border-warning-500/25 bg-warning-500/10'
                : 'border-success-500/25 bg-success-500/10',
            )}
          >
            <div className="flex items-start gap-2.5">
              {topologyErrors.length > 0 || desiredChanges > 0 ? (
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning-300" />
              ) : (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success-300" />
              )}
              <div>
                <h2 className="text-sm font-semibold text-dark-100">
                  {topologyErrors.length > 0 || desiredChanges > 0
                    ? 'Есть изменения коэффициентов'
                    : 'Топология настроена'}
                </h2>
                <p className="mt-1 text-xs leading-5 text-dark-400">
                  {topologyErrors.length > 0 || desiredChanges > 0
                    ? `После сохранения будет обновлено нод: ${desiredChanges}.`
                    : 'Все выбранные ноды имеют коэффициент 1×, остальные — 0×.'}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <details className="group rounded-lg border border-dark-700/50 bg-dark-800/30">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-dark-100">
            <Settings2 size={17} className="text-dark-400" />
            Дополнительные параметры
          </span>
          <span className="text-xs text-dark-500 group-open:hidden">Показать</span>
          <span className="hidden text-xs text-dark-500 group-open:inline">Скрыть</span>
        </summary>
        <div className="space-y-4 border-t border-dark-700/45 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-xs font-medium text-dark-300">
                <Gauge size={15} /> Интервал проверки
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={15}
                  max={3600}
                  step={1}
                  className="input w-full"
                  value={form.check_interval_seconds}
                  onChange={(event) =>
                    setForm((current) =>
                      current
                        ? { ...current, check_interval_seconds: Number(event.target.value) }
                        : current,
                    )
                  }
                  disabled={isBusy}
                />
                <span className="text-xs text-dark-500">сек.</span>
              </div>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium text-dark-300">Порог предупреждения</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={25}
                  max={95}
                  step={1}
                  className="input w-full"
                  value={form.warning_percent}
                  onChange={(event) =>
                    setForm((current) =>
                      current
                        ? { ...current, warning_percent: Number(event.target.value) }
                        : current,
                    )
                  }
                  disabled={isBusy}
                />
                <span className="text-xs text-dark-500">%</span>
              </div>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium text-dark-300">Название в кабинете</span>
              <input
                type="text"
                className="input w-full"
                maxLength={40}
                value={form.server_label}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, server_label: event.target.value } : current,
                  )
                }
                disabled={isBusy}
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-medium text-dark-300">
              Уведомление после расходования лимита
            </span>
            <textarea
              className="input min-h-40 w-full resize-y font-mono text-sm leading-6"
              maxLength={4096}
              value={form.exhausted_message_ru}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, exhausted_message_ru: event.target.value } : current,
                )
              }
              disabled={isBusy}
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_VARIABLES.map((variable) => (
              <button
                key={variable}
                type="button"
                className="rounded-md border border-dark-700/60 bg-dark-900/50 px-2 py-1 font-mono text-[11px] text-dark-300 transition hover:border-accent-500/40 hover:text-accent-300"
                onClick={() =>
                  setForm((current) =>
                    current
                      ? {
                          ...current,
                          exhausted_message_ru: `${current.exhausted_message_ru}{${variable}}`,
                        }
                      : current,
                  )
                }
                disabled={isBusy}
              >
                {`{${variable}}`}
              </button>
            ))}
          </div>
        </div>
      </details>

      <div className="flex flex-wrap justify-end gap-2 rounded-lg border border-dark-700/50 bg-dark-800/50 p-3 backdrop-blur">
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-2"
          onClick={reset}
          disabled={!isDirty || isBusy}
        >
          <RotateCcw size={16} />
          Отменить
        </button>
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          onClick={save}
          disabled={!hasPendingChanges || isBusy}
        >
          <Save size={16} />
          {saveMutation.isPending ? 'Применяем...' : 'Сохранить и применить'}
        </button>
      </div>
    </div>
  );
}
