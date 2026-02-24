import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { adminBalancerApi } from '../api/adminBalancer';
import { AdminBackButton } from '../components/admin/AdminBackButton';

function JsonCard({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-4">
      <h3 className="mb-2 text-sm font-semibold text-dark-100">{title}</h3>
      <pre className="max-h-72 overflow-auto rounded-lg bg-dark-900/80 p-3 text-xs text-dark-300">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function StatusBadge({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        ok ? 'bg-success-500/20 text-success-400' : 'bg-error-500/20 text-error-400'
      }`}
    >
      {text}
    </span>
  );
}

export default function AdminBalancer() {
  const { t } = useTranslation();
  const [token, setToken] = useState('');
  const [tokenResult, setTokenResult] = useState<unknown>(null);
  const [actionMessage, setActionMessage] = useState<string>('');

  const {
    data: status,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['admin', 'balancer', 'status'],
    queryFn: adminBalancerApi.getStatus,
    refetchInterval: 30_000,
  });

  const {
    data: health,
    refetch: refetchHealth,
    isLoading: healthLoading,
  } = useQuery({
    queryKey: ['admin', 'balancer', 'health'],
    queryFn: adminBalancerApi.getHealth,
    refetchInterval: 15_000,
  });

  const {
    data: ready,
    refetch: refetchReady,
    isLoading: readyLoading,
  } = useQuery({
    queryKey: ['admin', 'balancer', 'ready'],
    queryFn: adminBalancerApi.getReady,
    refetchInterval: 15_000,
  });

  const {
    data: debugStats,
    refetch: refetchDebugStats,
    isLoading: debugLoading,
  } = useQuery({
    queryKey: ['admin', 'balancer', 'debug-stats'],
    queryFn: adminBalancerApi.getDebugStats,
    refetchInterval: 15_000,
  });

  const {
    data: nodeStats,
    refetch: refetchNodeStats,
    isLoading: nodesLoading,
  } = useQuery({
    queryKey: ['admin', 'balancer', 'node-stats'],
    queryFn: adminBalancerApi.getNodeStats,
    refetchInterval: 60_000,
  });

  const refreshGroupsMutation = useMutation({
    mutationFn: adminBalancerApi.refreshGroups,
    onSuccess: () => {
      setActionMessage(t('admin.balancer.actions.refreshGroupsSuccess', 'Groups updated'));
      void refetchDebugStats();
    },
    onError: () => {
      setActionMessage(t('admin.balancer.actions.actionError', 'Action failed'));
    },
  });

  const refreshStatsMutation = useMutation({
    mutationFn: adminBalancerApi.refreshStats,
    onSuccess: async () => {
      setActionMessage(t('admin.balancer.actions.refreshStatsSuccess', 'Stats updated'));
      await Promise.all([refetchNodeStats(), refetchDebugStats(), refetchReady()]);
    },
    onError: () => {
      setActionMessage(t('admin.balancer.actions.actionError', 'Action failed'));
    },
  });

  const tokenDebugMutation = useMutation({
    mutationFn: adminBalancerApi.getTokenDebug,
    onSuccess: (data) => {
      setTokenResult(data);
      setActionMessage('');
    },
    onError: () => {
      setTokenResult(null);
      setActionMessage(t('admin.balancer.actions.tokenError', 'Token debug failed'));
    },
  });

  const profileMode = useMemo(() => {
    const raw = debugStats?.profile_mode;
    if (!raw || typeof raw !== 'string') return '—';
    return raw;
  }, [debugStats]);
  const hasTokenResult = tokenResult !== null;

  const readyOk = ready?.status === 'ready';
  const healthOk = health?.status === 'ok';

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3">
        <AdminBackButton to="/admin" />
        <div>
          <h1 className="text-xl font-semibold text-dark-100">
            {t('admin.nav.balancer', 'Balancer')}
          </h1>
          <p className="text-sm text-dark-400">
            {t('admin.balancer.subtitle', 'Manage xray-balancer middleware from cabinet')}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusBadge
            ok={Boolean(status?.configured)}
            text={
              status?.configured
                ? t('admin.balancer.status.configured', 'Configured')
                : t('admin.balancer.status.notConfigured', 'Not configured')
            }
          />
          <StatusBadge ok={healthOk} text={`health: ${health?.status ?? '—'}`} />
          <StatusBadge ok={readyOk} text={`ready: ${ready?.status ?? '—'}`} />
          <StatusBadge
            ok={Boolean(status?.has_admin_token)}
            text={`token: ${status?.has_admin_token ? 'ok' : 'missing'}`}
          />
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm text-dark-300 md:grid-cols-2">
          <div>
            base_url: <span className="font-mono text-dark-100">{status?.base_url || '—'}</span>
          </div>
          <div>
            timeout:{' '}
            <span className="font-mono text-dark-100">{status?.request_timeout_sec ?? '—'}s</span>
          </div>
          <div>
            profile_mode: <span className="font-mono text-dark-100">{profileMode}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => void refreshGroupsMutation.mutateAsync()}
            disabled={refreshGroupsMutation.isPending}
            className="rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 transition-colors hover:bg-dark-600 disabled:opacity-60"
          >
            {t('admin.balancer.actions.refreshGroups', 'Refresh groups')}
          </button>
          <button
            onClick={() => void refreshStatsMutation.mutateAsync()}
            disabled={refreshStatsMutation.isPending}
            className="rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 transition-colors hover:bg-dark-600 disabled:opacity-60"
          >
            {t('admin.balancer.actions.refreshStats', 'Refresh stats')}
          </button>
          <button
            onClick={() =>
              void Promise.all([
                refetchStatus(),
                refetchHealth(),
                refetchReady(),
                refetchDebugStats(),
                refetchNodeStats(),
              ])
            }
            className="rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 transition-colors hover:bg-dark-600"
          >
            {t('common.refresh', 'Refresh')}
          </button>
        </div>

        {actionMessage && <p className="mt-3 text-sm text-dark-300">{actionMessage}</p>}
      </div>

      <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-dark-100">
          {t('admin.balancer.tokenDebug.title', 'Token debug')}
        </h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={t('admin.balancer.tokenDebug.placeholder', 'Paste subscription token')}
            className="min-w-0 flex-1 rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none placeholder:text-dark-500 focus:border-accent-500"
          />
          <button
            onClick={() => token.trim() && tokenDebugMutation.mutate(token.trim())}
            disabled={tokenDebugMutation.isPending || !token.trim()}
            className="rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 transition-colors hover:bg-dark-600 disabled:opacity-60"
          >
            {t('admin.balancer.tokenDebug.run', 'Run debug')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <JsonCard
          title={t('admin.balancer.cards.health', 'Health')}
          data={healthLoading ? { loading: true } : (health ?? {})}
        />
        <JsonCard
          title={t('admin.balancer.cards.ready', 'Ready')}
          data={readyLoading ? { loading: true } : (ready ?? {})}
        />
        <JsonCard
          title={t('admin.balancer.cards.debugStats', 'Debug stats')}
          data={debugLoading ? { loading: true } : (debugStats ?? {})}
        />
        <JsonCard
          title={t('admin.balancer.cards.nodeStats', 'Node stats')}
          data={nodesLoading ? { loading: true } : (nodeStats ?? {})}
        />
      </div>

      {hasTokenResult && (
        <JsonCard
          title={t('admin.balancer.cards.tokenDebug', 'Token debug result')}
          data={tokenResult}
        />
      )}

      {statusLoading && (
        <p className="text-sm text-dark-500">{t('common.loading', 'Loading...')}</p>
      )}
    </div>
  );
}
