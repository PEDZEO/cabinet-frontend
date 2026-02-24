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

const DEFAULT_FASTEST_GROUP_NAME = '🏁 🇪🇺 Самые быстрые';

type AlertTone = 'default' | 'success' | 'error';

type MetricItem = {
  label: string;
  value: string;
  tone?: 'ok' | 'bad' | 'neutral';
};

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

function MetricsCard({
  title,
  items,
  loading,
  loadingText,
}: {
  title: string;
  items: MetricItem[];
  loading?: boolean;
  loadingText: string;
}) {
  return (
    <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-dark-100">{title}</h3>
      {loading ? (
        <p className="text-sm text-dark-400">{loadingText}</p>
      ) : (
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label} className="rounded-lg border border-dark-700 bg-dark-900/50 p-2">
              <dt className="text-xs text-dark-400">{item.label}</dt>
              <dd
                className={`truncate text-sm font-medium ${
                  item.tone === 'ok'
                    ? 'text-success-300'
                    : item.tone === 'bad'
                      ? 'text-error-300'
                      : 'text-dark-100'
                }`}
              >
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function JsonDetails({
  title,
  data,
  rawLabel,
}: {
  title: string;
  data: unknown;
  rawLabel: string;
}) {
  return (
    <details className="rounded-xl border border-dark-700 bg-dark-800/30 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-dark-200">
        {title} ({rawLabel})
      </summary>
      <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-dark-900/80 p-3 text-xs text-dark-300">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

function groupsToDraft(groupsData: BalancerGroupsResponse): GroupDraft[] {
  return Object.entries(groupsData.groups).map(([name, patterns], idx) => ({
    id: `${idx}-${name}`,
    name,
    patterns: patterns.join('\n'),
  }));
}

function parsePatterns(raw: string): string[] {
  return raw
    .split(/[\n,]/g)
    .map((value) => value.trim())
    .filter(Boolean);
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

function prettyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.join(', ');
  return JSON.stringify(value);
}

export default function AdminBalancer() {
  const { t, i18n } = useTranslation();
  const [token, setToken] = useState('');
  const [tokenResult, setTokenResult] = useState<unknown>(null);
  const [actionMessage, setActionMessage] = useState<string>('');
  const [actionTone, setActionTone] = useState<AlertTone>('default');
  const [groupsDraft, setGroupsDraft] = useState<GroupDraft[]>([]);
  const [fastestEnabled, setFastestEnabled] = useState(true);
  const [fastestGroupName, setFastestGroupName] = useState(DEFAULT_FASTEST_GROUP_NAME);
  const [excludeGroups, setExcludeGroups] = useState<string[]>([]);
  const [groupsDirty, setGroupsDirty] = useState(false);
  const [compactGroupsView, setCompactGroupsView] = useState(true);

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

  const {
    data: groupsData,
    refetch: refetchGroups,
    isLoading: groupsLoading,
    isError: groupsError,
  } = useQuery({
    queryKey: ['admin', 'balancer', 'groups'],
    queryFn: adminBalancerApi.getGroups,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!groupsData || groupsDirty) return;
    setGroupsDraft(groupsToDraft(groupsData));
    setFastestEnabled(Boolean(groupsData.fastest_group));
    setFastestGroupName((groupsData.fastest_group_name || DEFAULT_FASTEST_GROUP_NAME).trim());
    setExcludeGroups(groupsData.fastest_exclude_groups || []);
  }, [groupsData, groupsDirty]);

  const setAlert = (message: string, tone: AlertTone = 'default') => {
    setActionMessage(message);
    setActionTone(tone);
  };

  const refreshGroupsMutation = useMutation({
    mutationFn: adminBalancerApi.refreshGroups,
    onSuccess: async () => {
      setAlert(t('admin.balancer.actions.refreshGroupsSuccess', 'Groups updated'), 'success');
      await Promise.all([refetchDebugStats(), refetchGroups()]);
    },
    onError: () => {
      setAlert(t('admin.balancer.actions.actionError', 'Action failed'), 'error');
    },
  });

  const refreshStatsMutation = useMutation({
    mutationFn: adminBalancerApi.refreshStats,
    onSuccess: async () => {
      setAlert(t('admin.balancer.actions.refreshStatsSuccess', 'Stats updated'), 'success');
      await Promise.all([refetchNodeStats(), refetchDebugStats(), refetchReady()]);
    },
    onError: () => {
      setAlert(t('admin.balancer.actions.actionError', 'Action failed'), 'error');
    },
  });

  const saveGroupsMutation = useMutation({
    mutationFn: adminBalancerApi.updateGroups,
    onSuccess: async (data) => {
      setAlert(t('admin.balancer.actions.groupsSaved', 'Groups saved'), 'success');
      setGroupsDirty(false);
      setGroupsDraft(groupsToDraft(data));
      setFastestEnabled(Boolean(data.fastest_group));
      setFastestGroupName((data.fastest_group_name || DEFAULT_FASTEST_GROUP_NAME).trim());
      setExcludeGroups(data.fastest_exclude_groups || []);
      await refetchGroups();
    },
    onError: () => {
      setAlert(t('admin.balancer.actions.groupsSaveError', 'Groups save failed'), 'error');
    },
  });

  const tokenDebugMutation = useMutation({
    mutationFn: adminBalancerApi.getTokenDebug,
    onSuccess: (data) => {
      setTokenResult(data);
      setAlert('');
    },
    onError: () => {
      setTokenResult(null);
      setAlert(t('admin.balancer.actions.tokenError', 'Token debug failed'), 'error');
    },
  });

  const profileMode = useMemo(() => {
    const raw = debugStats?.profile_mode;
    if (!raw || typeof raw !== 'string') return '—';
    return raw;
  }, [debugStats]);

  const readyRecord = toRecord(ready);
  const healthRecord = toRecord(health);
  const runtimeStats = toRecord(debugStats?.runtime_stats);
  const circuitBreaker = toRecord(debugStats?.circuit_breaker);
  const hasTokenResult = tokenResult !== null;

  const readyOk = readyRecord.status === 'ready';
  const healthOk = healthRecord.status === 'ok';

  const availableGroupNames = useMemo(
    () =>
      groupsDraft
        .map((group) => group.name.trim())
        .filter(Boolean)
        .filter((name, idx, arr) => arr.indexOf(name) === idx),
    [groupsDraft],
  );

  const duplicateNameSet = useMemo(() => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const group of groupsDraft) {
      const normalized = group.name.trim().toLowerCase();
      if (!normalized) continue;
      if (seen.has(normalized)) duplicates.add(normalized);
      seen.add(normalized);
    }
    return duplicates;
  }, [groupsDraft]);

  const nodeRows = useMemo(() => {
    const source = toRecord(nodeStats);
    return Object.entries(source).map(([nodeName, stat]) => {
      const statRecord = toRecord(stat);
      return {
        nodeName,
        usersOnline: prettyValue(statRecord.usersOnline),
        totalRamGb: prettyValue(statRecord.totalRamGb),
        cpuLoad: prettyValue(statRecord.cpuLoad),
        ramLoad: prettyValue(statRecord.ramLoad),
        connected: prettyValue(statRecord.isConnected),
        disabled: prettyValue(statRecord.isDisabled),
        isAlias: Boolean(statRecord.isAlias),
      };
    });
  }, [nodeStats]);

  const visibleNodeRows = useMemo(() => {
    const primaryRows = nodeRows.filter((row) => !row.isAlias);
    return primaryRows.length > 0 ? primaryRows : nodeRows;
  }, [nodeRows]);

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
    setGroupsDraft((prev) => prev.filter((group) => group.id !== id));
  };

  const moveGroup = (id: string, direction: 'up' | 'down') => {
    setGroupsDirty(true);
    setGroupsDraft((prev) => {
      const idx = prev.findIndex((group) => group.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;

      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
  };

  const updateGroup = (id: string, patch: Partial<GroupDraft>) => {
    setGroupsDirty(true);
    setGroupsDraft((prev) =>
      prev.map((group) => (group.id === id ? { ...group, ...patch } : group)),
    );
  };

  const toggleExclude = (groupName: string) => {
    setGroupsDirty(true);
    setExcludeGroups((prev) =>
      prev.includes(groupName) ? prev.filter((value) => value !== groupName) : [...prev, groupName],
    );
  };

  const saveGroups = async () => {
    const groups: Record<string, string[]> = {};
    const names = new Set<string>();

    for (const item of groupsDraft) {
      const name = item.name.trim();
      const normalizedName = name.toLowerCase();
      if (!name) {
        setAlert(t('admin.balancer.actions.groupNameRequired', 'Group name is required'), 'error');
        return;
      }
      if (names.has(normalizedName)) {
        setAlert(
          t('admin.balancer.actions.groupNamesUnique', 'Group names must be unique'),
          'error',
        );
        return;
      }
      names.add(normalizedName);

      const patterns = parsePatterns(item.patterns);
      if (patterns.length === 0) {
        setAlert(
          t('admin.balancer.actions.groupPatternsRequired', 'Each group must contain patterns'),
          'error',
        );
        return;
      }
      groups[name] = patterns;
    }

    const availableNames = new Set(groupsDraft.map((item) => item.name.trim()).filter(Boolean));
    const filteredExclude = excludeGroups.filter((value) => availableNames.has(value));
    const normalizedFastestName = fastestGroupName.trim() || DEFAULT_FASTEST_GROUP_NAME;

    await saveGroupsMutation.mutateAsync({
      groups,
      fastest_group: fastestEnabled,
      fastest_group_name: normalizedFastestName,
      fastest_exclude_groups: filteredExclude,
    });
  };

  const alertClassName =
    actionTone === 'success'
      ? 'border-success-500/30 bg-success-500/10 text-success-200'
      : actionTone === 'error'
        ? 'border-error-500/30 bg-error-500/10 text-error-200'
        : 'border-dark-700 bg-dark-800/40 text-dark-200';

  const healthMetrics = useMemo<MetricItem[]>(
    () => [
      {
        label: t('admin.balancer.labels.status', 'Status'),
        value: String(healthRecord.status ?? '—'),
        tone: healthOk ? 'ok' : 'bad',
      },
      {
        label: t('admin.balancer.labels.groups', 'Groups'),
        value: Array.isArray(healthRecord.groups) ? healthRecord.groups.join(', ') || '—' : '—',
      },
      {
        label: t('admin.balancer.labels.autoGroups', 'Auto groups'),
        value: prettyValue(healthRecord.auto_groups),
      },
      {
        label: t('admin.balancer.labels.fastestGroup', 'Fastest group'),
        value: prettyValue(healthRecord.fastest_group),
      },
      {
        label: t('admin.balancer.labels.nodeStats', 'Node stats'),
        value: prettyValue(healthRecord.node_stats),
      },
      {
        label: t('admin.balancer.labels.cachedNodes', 'Cached nodes'),
        value: prettyValue(healthRecord.cached_nodes),
      },
      {
        label: t('admin.balancer.labels.panelAuth', 'Panel auth'),
        value: prettyValue(healthRecord.panel_auth),
      },
      {
        label: t('admin.balancer.labels.subPage', 'Sub page'),
        value: prettyValue(healthRecord.sub_page),
      },
    ],
    [healthOk, healthRecord, t],
  );

  const readyMetrics = useMemo<MetricItem[]>(
    () => [
      {
        label: t('admin.balancer.labels.status', 'Status'),
        value: String(readyRecord.status ?? '—'),
        tone: readyOk ? 'ok' : 'bad',
      },
      {
        label: t('admin.balancer.labels.recentUpstream', 'Recent upstream'),
        value: prettyValue(readyRecord.has_recent_upstream),
      },
      {
        label: t('admin.balancer.labels.cacheTtl', 'Cache ttl'),
        value: toNumber(readyRecord.cache_ttl_sec)?.toString() ?? '—',
      },
      {
        label: t('admin.balancer.labels.cachePresent', 'Cache present'),
        value: prettyValue(readyRecord.has_cache),
      },
      {
        label: t('admin.balancer.labels.circuitOpen', 'Circuit open'),
        value: prettyValue(readyRecord.circuit_open),
      },
    ],
    [readyOk, readyRecord, t],
  );

  const runtimeMetrics = useMemo<MetricItem[]>(() => {
    const startedAt = toNumber(runtimeStats.started_at);
    const startedAtText =
      startedAt !== null
        ? new Date(startedAt * 1000).toLocaleString(i18n.language, { hour12: false })
        : '—';

    return [
      {
        label: t('admin.balancer.labels.profileMode', 'Profile mode'),
        value: profileMode,
      },
      {
        label: t('admin.balancer.labels.startedAt', 'Started at'),
        value: startedAtText,
      },
      {
        label: t('admin.balancer.labels.requestsTotal', 'Requests total'),
        value: prettyValue(runtimeStats.requests_total),
      },
      {
        label: t('admin.balancer.labels.requestFailures', 'Request failures'),
        value: prettyValue(runtimeStats.request_failures),
        tone: toNumber(runtimeStats.request_failures) === 0 ? 'ok' : 'bad',
      },
      {
        label: t('admin.balancer.labels.rateLimited', 'Rate limited'),
        value: prettyValue(runtimeStats.rate_limited_ip_total),
      },
      {
        label: t('admin.balancer.labels.circuitOpenTotal', 'Circuit open total'),
        value: prettyValue(runtimeStats.circuit_open_total),
      },
      {
        label: t('admin.balancer.labels.cbFailCount', 'CB fail count'),
        value: prettyValue(circuitBreaker.fail_count),
      },
      {
        label: t('admin.balancer.labels.cbHalfOpen', 'CB half-open'),
        value: prettyValue(circuitBreaker.half_open),
        tone: toBoolean(circuitBreaker.half_open) ? 'bad' : 'ok',
      },
    ];
  }, [circuitBreaker, i18n.language, profileMode, runtimeStats, t]);

  const previewConfig = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const item of groupsDraft) {
      const name = item.name.trim();
      if (!name) continue;
      groups[name] = parsePatterns(item.patterns);
    }
    const availableNames = new Set(Object.keys(groups));
    return {
      groups,
      fastest_group: fastestEnabled,
      fastest_group_name: fastestGroupName.trim() || DEFAULT_FASTEST_GROUP_NAME,
      fastest_exclude_groups: excludeGroups.filter((name) => availableNames.has(name)),
    };
  }, [excludeGroups, fastestEnabled, fastestGroupName, groupsDraft]);

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
          <StatusBadge
            ok={healthOk}
            text={`${t('admin.balancer.labels.health', 'Health')}: ${String(healthRecord.status ?? '—')}`}
          />
          <StatusBadge
            ok={readyOk}
            text={`${t('admin.balancer.labels.ready', 'Ready')}: ${String(readyRecord.status ?? '—')}`}
          />
          <StatusBadge
            ok={Boolean(status?.has_admin_token)}
            text={`${t('admin.balancer.labels.token', 'Token')}: ${
              status?.has_admin_token
                ? t('admin.balancer.labels.ok', 'ok')
                : t('admin.balancer.labels.missing', 'missing')
            }`}
          />
          {groupsDirty && (
            <span className="inline-flex items-center rounded-full bg-warning-500/15 px-2.5 py-1 text-xs font-medium text-warning-300">
              {t('admin.balancer.groups.unsaved', 'Unsaved groups changes')}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm text-dark-300 md:grid-cols-2">
          <div>
            {t('admin.balancer.labels.baseUrl', 'Base URL')}:{' '}
            <span className="font-mono text-dark-100">{status?.base_url || '—'}</span>
          </div>
          <div>
            {t('admin.balancer.labels.timeout', 'Timeout')}:{' '}
            <span className="font-mono text-dark-100">{status?.request_timeout_sec ?? '—'}s</span>
          </div>
          <div>
            {t('admin.balancer.labels.profileMode', 'Profile mode')}:{' '}
            <span className="font-mono text-dark-100">{profileMode}</span>
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-dark-100">
            {t('admin.balancer.groups.title', 'Groups editor')}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCompactGroupsView((prev) => !prev)}
              className="rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 transition-colors hover:bg-dark-600"
            >
              {compactGroupsView
                ? t('admin.balancer.groups.viewExpanded', 'Expanded view')
                : t('admin.balancer.groups.viewCompact', 'Compact view')}
            </button>
            <button
              onClick={addGroup}
              className="rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 transition-colors hover:bg-dark-600"
              aria-label="Add balancer group"
            >
              {t('admin.balancer.groups.add', 'Add group')}
            </button>
            <button
              onClick={() => {
                if (!groupsData) return;
                setGroupsDraft(groupsToDraft(groupsData));
                setFastestEnabled(Boolean(groupsData.fastest_group));
                setFastestGroupName(
                  (groupsData.fastest_group_name || DEFAULT_FASTEST_GROUP_NAME).trim(),
                );
                setExcludeGroups(groupsData.fastest_exclude_groups || []);
                setGroupsDirty(false);
                setAlert(
                  t('admin.balancer.actions.changesDiscarded', 'Changes discarded'),
                  'default',
                );
              }}
              className="rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 transition-colors hover:bg-dark-600"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              onClick={() => void saveGroups()}
              disabled={saveGroupsMutation.isPending}
              className="rounded-lg border border-accent-500/50 bg-accent-500/20 px-3 py-2 text-sm text-accent-300 transition-colors hover:bg-accent-500/30 disabled:opacity-60"
            >
              {t('common.save', 'Save')}
            </button>
          </div>
        </div>

        <div className="mb-3 rounded-lg border border-dark-700 bg-dark-900/40 p-3 text-xs text-dark-300">
          <p className="font-semibold text-dark-100">
            {t('admin.balancer.groups.howTitle', 'How groups work')}
          </p>
          <p>
            {t('admin.balancer.groups.howLine1', 'Each group contains patterns for outbound tags.')}
          </p>
          <p>
            {t(
              'admin.balancer.groups.howLine2',
              'Fastest group is an additional auto-group built from all groups except excluded ones.',
            )}
          </p>
          <p>
            {t(
              'admin.balancer.groups.howLine3',
              'Save applies config to /admin/groups and updates balancer immediately.',
            )}
          </p>
        </div>

        <div className="space-y-3">
          {groupsError && (
            <div className="rounded-lg border border-error-500/40 bg-error-500/10 p-3 text-sm text-error-200">
              {t(
                'admin.balancer.groups.loadError',
                'Failed to load groups. Check /admin/groups availability.',
              )}
            </div>
          )}

          {groupsLoading && (
            <div className="rounded-lg border border-dark-700 bg-dark-900/40 p-3 text-sm text-dark-400">
              {t('common.loading', 'Loading...')}
            </div>
          )}

          {!groupsLoading && groupsDraft.length === 0 && (
            <div className="rounded-lg border border-dark-700 bg-dark-900/40 p-3 text-sm text-dark-400">
              {t('admin.balancer.groups.empty', 'No groups configured.')}
            </div>
          )}

          {groupsDraft.map((group, index) => {
            const trimmedName = group.name.trim().toLowerCase();
            const hasDuplicate = trimmedName ? duplicateNameSet.has(trimmedName) : false;
            const patternCount = parsePatterns(group.patterns).length;

            return (
              <div key={group.id} className="rounded-lg border border-dark-700 bg-dark-900/50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs text-dark-400">
                    {t('admin.balancer.groups.groupNumber', 'Group #{{index}}', {
                      index: index + 1,
                    })}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moveGroup(group.id, 'up')}
                      disabled={index === 0}
                      className="rounded-md border border-dark-600 px-2 py-1 text-xs text-dark-200 disabled:opacity-40"
                      aria-label="Move group up"
                    >
                      {t('admin.balancer.groups.moveUp', 'Up')}
                    </button>
                    <button
                      onClick={() => moveGroup(group.id, 'down')}
                      disabled={index === groupsDraft.length - 1}
                      className="rounded-md border border-dark-600 px-2 py-1 text-xs text-dark-200 disabled:opacity-40"
                      aria-label="Move group down"
                    >
                      {t('admin.balancer.groups.moveDown', 'Down')}
                    </button>
                    <button
                      onClick={() => removeGroup(group.id)}
                      className="rounded-md border border-error-500/40 bg-error-500/10 px-2 py-1 text-xs text-error-300"
                      aria-label="Delete group"
                    >
                      {t('common.delete', 'Delete')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-dark-400">
                      {t('admin.balancer.groups.groupName', 'Group name')}
                    </label>
                    <input
                      value={group.name}
                      onChange={(event) => updateGroup(group.id, { name: event.target.value })}
                      placeholder={t('admin.balancer.groups.groupName', 'Group name')}
                      className={`w-full rounded-lg border bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none placeholder:text-dark-500 ${
                        hasDuplicate
                          ? 'border-error-500/70'
                          : 'border-dark-600 focus:border-accent-500'
                      }`}
                    />
                    {hasDuplicate && (
                      <p className="mt-1 text-xs text-error-300">
                        {t('admin.balancer.actions.groupNamesUnique', 'Group names must be unique')}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-dark-400">
                      <span>{t('admin.balancer.groups.patternsTitle', 'Patterns')}</span>
                      <span>
                        {t('admin.balancer.groups.patternsCount', '{{count}} items', {
                          count: patternCount,
                        })}
                      </span>
                    </div>
                    <textarea
                      value={group.patterns}
                      onChange={(event) => updateGroup(group.id, { patterns: event.target.value })}
                      placeholder={t(
                        'admin.balancer.groups.patterns',
                        'Patterns separated by comma or new line',
                      )}
                      rows={compactGroupsView ? 2 : 4}
                      className="w-full rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none placeholder:text-dark-500 focus:border-accent-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-dark-700 bg-dark-900/40 p-3">
          <label className="mb-2 flex items-center gap-2 text-sm text-dark-200">
            <input
              type="checkbox"
              checked={fastestEnabled}
              onChange={(event) => {
                setGroupsDirty(true);
                setFastestEnabled(event.target.checked);
              }}
            />
            {t('admin.balancer.groups.fastestToggle', 'Enable fastest group')}
          </label>

          <div className="mb-2">
            <label className="mb-1 block text-xs text-dark-400">
              {t('admin.balancer.groups.fastestName', 'Fastest group name')}
            </label>
            <input
              value={fastestGroupName}
              onChange={(event) => {
                setGroupsDirty(true);
                setFastestGroupName(event.target.value);
              }}
              placeholder={DEFAULT_FASTEST_GROUP_NAME}
              className="w-full rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none placeholder:text-dark-500 focus:border-accent-500"
            />
          </div>

          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs text-dark-400">
                {t(
                  'admin.balancer.groups.excludeLabel',
                  'Exclude these groups from fastest selection:',
                )}
              </p>
              <p className="text-xs text-dark-500">
                {t('admin.balancer.groups.excludeCounter', 'Selected {{selected}} / {{total}}', {
                  selected: excludeGroups.length,
                  total: availableGroupNames.length,
                })}
              </p>
            </div>
            <button
              onClick={() => {
                setGroupsDirty(true);
                setExcludeGroups([]);
              }}
              className="text-xs text-dark-300 underline hover:text-dark-100"
            >
              {t('admin.balancer.groups.clearSelection', 'Clear selection')}
            </button>
          </div>

          <div className="max-h-40 overflow-auto rounded-md border border-dark-700 bg-dark-900/40 p-2">
            {availableGroupNames.length === 0 && (
              <p className="text-xs text-dark-500">
                {t(
                  'admin.balancer.groups.emptyExcludeHint',
                  'Add at least one group to manage exclusions.',
                )}
              </p>
            )}
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {availableGroupNames.map((name) => (
                <label key={name} className="inline-flex items-center gap-2 text-xs text-dark-200">
                  <input
                    type="checkbox"
                    checked={excludeGroups.includes(name)}
                    onChange={() => toggleExclude(name)}
                  />
                  <span className="truncate">{name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-dark-700 bg-dark-900/40 p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dark-300">
            {t('admin.balancer.groups.previewTitle', 'Config preview')}
          </h4>
          <p className="mb-2 text-xs text-dark-500">
            {t('admin.balancer.groups.previewHint', 'This is the payload for PUT /admin/groups.')}
          </p>
          <pre className="max-h-64 overflow-auto rounded-lg bg-dark-950/80 p-3 text-xs text-dark-300">
            {JSON.stringify(previewConfig, null, 2)}
          </pre>
        </div>
      </div>

      <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-dark-100">
          {t('admin.balancer.tokenDebug.title', 'Token debug')}
        </h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={token}
            onChange={(event) => setToken(event.target.value)}
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <MetricsCard
          title={t('admin.balancer.cards.health', 'Health')}
          items={healthMetrics}
          loading={healthLoading}
          loadingText={t('common.loading', 'Loading...')}
        />
        <MetricsCard
          title={t('admin.balancer.cards.ready', 'Ready')}
          items={readyMetrics}
          loading={readyLoading}
          loadingText={t('common.loading', 'Loading...')}
        />
        <MetricsCard
          title={t('admin.balancer.cards.debugStats', 'Debug stats')}
          items={runtimeMetrics}
          loading={debugLoading}
          loadingText={t('common.loading', 'Loading...')}
        />
      </div>

      <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-dark-100">
          {t('admin.balancer.cards.nodeStats', 'Node stats')}
        </h3>

        {nodesLoading ? (
          <p className="text-sm text-dark-400">{t('common.loading', 'Loading...')}</p>
        ) : visibleNodeRows.length === 0 ? (
          <p className="text-sm text-dark-500">
            {t('admin.balancer.cards.nodeStatsEmpty', 'No node stats yet.')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <p className="mb-2 text-xs text-dark-500">
              {t(
                'admin.balancer.cards.nodeStatsHint',
                'Showing real nodes without inbound aliases.',
              )}
            </p>
            <table className="min-w-full text-left text-sm text-dark-200">
              <thead>
                <tr className="border-b border-dark-700 text-xs uppercase text-dark-400">
                  <th className="px-2 py-2">{t('admin.balancer.table.node', 'Node')}</th>
                  <th className="px-2 py-2">{t('admin.balancer.table.users', 'Users')}</th>
                  <th className="px-2 py-2">{t('admin.balancer.table.cpu', 'CPU')}</th>
                  <th className="px-2 py-2">{t('admin.balancer.table.ram', 'RAM')}</th>
                  <th className="px-2 py-2">{t('admin.balancer.table.totalRam', 'Total RAM')}</th>
                  <th className="px-2 py-2">{t('admin.balancer.table.connected', 'Connected')}</th>
                  <th className="px-2 py-2">{t('admin.balancer.table.disabled', 'Disabled')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleNodeRows.map((row) => (
                  <tr key={row.nodeName} className="border-b border-dark-800/70">
                    <td className="px-2 py-2 font-medium text-dark-100">{row.nodeName}</td>
                    <td className="px-2 py-2">{row.usersOnline}</td>
                    <td className="px-2 py-2">{row.cpuLoad}</td>
                    <td className="px-2 py-2">{row.ramLoad}</td>
                    <td className="px-2 py-2">{row.totalRamGb}</td>
                    <td className="px-2 py-2">{row.connected}</td>
                    <td className="px-2 py-2">{row.disabled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasTokenResult && (
        <MetricsCard
          title={t('admin.balancer.cards.tokenDebug', 'Token debug result')}
          items={Object.entries(toRecord(tokenResult)).map(([key, value]) => ({
            label: key,
            value: prettyValue(value),
          }))}
          loadingText={t('common.loading', 'Loading...')}
        />
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <JsonDetails
          title={t('admin.balancer.cards.health', 'Health')}
          data={healthLoading ? { loading: true } : (health ?? {})}
          rawLabel={t('admin.balancer.rawJson', 'raw JSON')}
        />
        <JsonDetails
          title={t('admin.balancer.cards.ready', 'Ready')}
          data={readyLoading ? { loading: true } : (ready ?? {})}
          rawLabel={t('admin.balancer.rawJson', 'raw JSON')}
        />
        <JsonDetails
          title={t('admin.balancer.cards.debugStats', 'Debug stats')}
          data={debugLoading ? { loading: true } : (debugStats ?? {})}
          rawLabel={t('admin.balancer.rawJson', 'raw JSON')}
        />
        <JsonDetails
          title={t('admin.balancer.cards.nodeStats', 'Node stats')}
          data={nodesLoading ? { loading: true } : (nodeStats ?? {})}
          rawLabel={t('admin.balancer.rawJson', 'raw JSON')}
        />
      </div>

      {actionMessage && (
        <p className={`rounded-lg border px-3 py-2 text-sm ${alertClassName}`}>{actionMessage}</p>
      )}

      {statusLoading && (
        <p className="text-sm text-dark-500">{t('common.loading', 'Loading...')}</p>
      )}
    </div>
  );
}
