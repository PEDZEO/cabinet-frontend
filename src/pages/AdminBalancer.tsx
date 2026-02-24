import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { BalancerGroupsResponse, adminBalancerApi } from '../api/adminBalancer';
import { AdminBackButton } from '../components/admin/AdminBackButton';

type GroupDraft = {
  id: string;
  name: string;
  patterns: string;
};

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

function groupsToDraft(groupsData: BalancerGroupsResponse): GroupDraft[] {
  return Object.entries(groupsData.groups).map(([name, patterns], idx) => ({
    id: `${idx}-${name}`,
    name,
    patterns: patterns.join(', '),
  }));
}

function parsePatterns(raw: string): string[] {
  return raw
    .split(/[\n,]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function AdminBalancer() {
  const { t } = useTranslation();
  const [token, setToken] = useState('');
  const [tokenResult, setTokenResult] = useState<unknown>(null);
  const [actionMessage, setActionMessage] = useState<string>('');
  const [groupsDraft, setGroupsDraft] = useState<GroupDraft[]>([]);
  const [fastestEnabled, setFastestEnabled] = useState(true);
  const [excludeGroups, setExcludeGroups] = useState<string[]>([]);
  const [groupsDirty, setGroupsDirty] = useState(false);

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

  const { data: groupsData, refetch: refetchGroups } = useQuery({
    queryKey: ['admin', 'balancer', 'groups'],
    queryFn: adminBalancerApi.getGroups,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!groupsData || groupsDirty) return;
    setGroupsDraft(groupsToDraft(groupsData));
    setFastestEnabled(Boolean(groupsData.fastest_group));
    setExcludeGroups(groupsData.fastest_exclude_groups || []);
  }, [groupsData, groupsDirty]);

  const refreshGroupsMutation = useMutation({
    mutationFn: adminBalancerApi.refreshGroups,
    onSuccess: async () => {
      setActionMessage(t('admin.balancer.actions.refreshGroupsSuccess', 'Groups updated'));
      await Promise.all([refetchDebugStats(), refetchGroups()]);
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

  const saveGroupsMutation = useMutation({
    mutationFn: adminBalancerApi.updateGroups,
    onSuccess: async (data) => {
      setActionMessage(t('admin.balancer.actions.groupsSaved', 'Groups saved'));
      setGroupsDirty(false);
      setGroupsDraft(groupsToDraft(data));
      setFastestEnabled(Boolean(data.fastest_group));
      setExcludeGroups(data.fastest_exclude_groups || []);
      await refetchGroups();
    },
    onError: () => {
      setActionMessage(t('admin.balancer.actions.groupsSaveError', 'Groups save failed'));
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

  const availableGroupNames = useMemo(
    () =>
      groupsDraft
        .map((g) => g.name.trim())
        .filter(Boolean)
        .filter((name, idx, arr) => arr.indexOf(name) === idx),
    [groupsDraft],
  );

  const addGroup = () => {
    setGroupsDirty(true);
    setGroupsDraft((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        name: '',
        patterns: '',
      },
    ]);
  };

  const removeGroup = (id: string) => {
    setGroupsDirty(true);
    setGroupsDraft((prev) => prev.filter((g) => g.id !== id));
  };

  const updateGroup = (id: string, patch: Partial<GroupDraft>) => {
    setGroupsDirty(true);
    setGroupsDraft((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const toggleExclude = (groupName: string) => {
    setGroupsDirty(true);
    setExcludeGroups((prev) =>
      prev.includes(groupName) ? prev.filter((x) => x !== groupName) : [...prev, groupName],
    );
  };

  const saveGroups = async () => {
    const groups: Record<string, string[]> = {};
    const names = new Set<string>();

    for (const item of groupsDraft) {
      const name = item.name.trim();
      if (!name) {
        setActionMessage(t('admin.balancer.actions.groupNameRequired', 'Group name is required'));
        return;
      }
      if (names.has(name)) {
        setActionMessage(
          t('admin.balancer.actions.groupNamesUnique', 'Group names must be unique'),
        );
        return;
      }
      names.add(name);

      const patterns = parsePatterns(item.patterns);
      if (patterns.length === 0) {
        setActionMessage(
          t('admin.balancer.actions.groupPatternsRequired', 'Each group must contain patterns'),
        );
        return;
      }
      groups[name] = patterns;
    }

    const filteredExclude = excludeGroups.filter((x) => names.has(x));
    await saveGroupsMutation.mutateAsync({
      groups,
      fastest_group: fastestEnabled,
      fastest_exclude_groups: filteredExclude,
    });
  };

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
                refetchGroups(),
              ])
            }
            className="rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 transition-colors hover:bg-dark-600"
          >
            {t('common.refresh', 'Refresh')}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-dark-100">
            {t('admin.balancer.groups.title', 'Groups editor')}
          </h3>
          <button
            onClick={addGroup}
            className="rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 transition-colors hover:bg-dark-600"
          >
            {t('admin.balancer.groups.add', 'Add group')}
          </button>
        </div>

        <div className="space-y-3">
          {groupsDraft.map((group) => (
            <div key={group.id} className="rounded-lg border border-dark-700 bg-dark-900/50 p-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input
                  value={group.name}
                  onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                  placeholder={t('admin.balancer.groups.groupName', 'Group name')}
                  className="rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none placeholder:text-dark-500 focus:border-accent-500"
                />
                <div className="flex gap-2">
                  <input
                    value={group.patterns}
                    onChange={(e) => updateGroup(group.id, { patterns: e.target.value })}
                    placeholder={t(
                      'admin.balancer.groups.patterns',
                      'Patterns separated by comma or new line',
                    )}
                    className="min-w-0 flex-1 rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none placeholder:text-dark-500 focus:border-accent-500"
                  />
                  <button
                    onClick={() => removeGroup(group.id)}
                    className="rounded-lg border border-error-500/50 bg-error-500/10 px-3 py-2 text-sm text-error-300 transition-colors hover:bg-error-500/20"
                  >
                    {t('common.delete', 'Delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-dark-700 bg-dark-900/40 p-3">
          <label className="mb-2 flex items-center gap-2 text-sm text-dark-200">
            <input
              type="checkbox"
              checked={fastestEnabled}
              onChange={(e) => {
                setGroupsDirty(true);
                setFastestEnabled(e.target.checked);
              }}
            />
            {t('admin.balancer.groups.fastestToggle', 'Enable fastest group')}
          </label>

          <p className="mb-2 text-xs text-dark-400">
            {t(
              'admin.balancer.groups.excludeLabel',
              'Exclude these groups from fastest selection:',
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {availableGroupNames.map((name) => (
              <label
                key={name}
                className="inline-flex items-center gap-1 rounded-md border border-dark-600 bg-dark-800 px-2 py-1 text-xs text-dark-200"
              >
                <input
                  type="checkbox"
                  checked={excludeGroups.includes(name)}
                  onChange={() => toggleExclude(name)}
                />
                {name}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => void saveGroups()}
            disabled={saveGroupsMutation.isPending}
            className="rounded-lg border border-accent-500/50 bg-accent-500/20 px-3 py-2 text-sm text-accent-300 transition-colors hover:bg-accent-500/30 disabled:opacity-60"
          >
            {t('common.save', 'Save')}
          </button>
          <button
            onClick={() => {
              if (!groupsData) return;
              setGroupsDraft(groupsToDraft(groupsData));
              setFastestEnabled(Boolean(groupsData.fastest_group));
              setExcludeGroups(groupsData.fastest_exclude_groups || []);
              setGroupsDirty(false);
            }}
            className="rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 transition-colors hover:bg-dark-600"
          >
            {t('common.cancel', 'Cancel')}
          </button>
        </div>
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

      {actionMessage && <p className="text-sm text-dark-300">{actionMessage}</p>}

      {statusLoading && (
        <p className="text-sm text-dark-500">{t('common.loading', 'Loading...')}</p>
      )}
    </div>
  );
}
