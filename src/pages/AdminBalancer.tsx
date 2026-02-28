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

type BalancerAdvancedSettings = {
  autoQuarantineEnabled: boolean;
  autoQuarantineFailures: number;
  autoQuarantineReleaseSuccesses: number;
  autoQuarantineMaxNodes: number;
  autoDrainEnabled: boolean;
  autoDrainFailures: number;
  autoDrainReleaseSuccesses: number;
  autoDrainLoadThreshold: number;
  autoDrainScorePenalty: number;
  balancerLoadWeight: number;
  balancerLatencyWeight: number;
  balancerMaxLatencyMs: number;
  balancerSmoothingAlpha: number;
  balancerHysteresisDelta: number;
};

const DEFAULT_ADVANCED_SETTINGS: BalancerAdvancedSettings = {
  autoQuarantineEnabled: false,
  autoQuarantineFailures: 3,
  autoQuarantineReleaseSuccesses: 2,
  autoQuarantineMaxNodes: 100,
  autoDrainEnabled: false,
  autoDrainFailures: 2,
  autoDrainReleaseSuccesses: 2,
  autoDrainLoadThreshold: 0.85,
  autoDrainScorePenalty: 0.6,
  balancerLoadWeight: 0.4,
  balancerLatencyWeight: 0.6,
  balancerMaxLatencyMs: 300,
  balancerSmoothingAlpha: 0.35,
  balancerHysteresisDelta: 0.08,
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

function normalizeAdvancedSettings(
  source?: Partial<BalancerGroupsResponse> | null,
): BalancerAdvancedSettings {
  const toFinite = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

  return {
    autoQuarantineEnabled:
      typeof source?.auto_quarantine_enabled === 'boolean'
        ? source.auto_quarantine_enabled
        : DEFAULT_ADVANCED_SETTINGS.autoQuarantineEnabled,
    autoQuarantineFailures: toFinite(
      source?.auto_quarantine_failures,
      DEFAULT_ADVANCED_SETTINGS.autoQuarantineFailures,
    ),
    autoQuarantineReleaseSuccesses: toFinite(
      source?.auto_quarantine_release_successes,
      DEFAULT_ADVANCED_SETTINGS.autoQuarantineReleaseSuccesses,
    ),
    autoQuarantineMaxNodes: toFinite(
      source?.auto_quarantine_max_nodes,
      DEFAULT_ADVANCED_SETTINGS.autoQuarantineMaxNodes,
    ),
    autoDrainEnabled:
      typeof source?.auto_drain_enabled === 'boolean'
        ? source.auto_drain_enabled
        : DEFAULT_ADVANCED_SETTINGS.autoDrainEnabled,
    autoDrainFailures: toFinite(
      source?.auto_drain_failures,
      DEFAULT_ADVANCED_SETTINGS.autoDrainFailures,
    ),
    autoDrainReleaseSuccesses: toFinite(
      source?.auto_drain_release_successes,
      DEFAULT_ADVANCED_SETTINGS.autoDrainReleaseSuccesses,
    ),
    autoDrainLoadThreshold: toFinite(
      source?.auto_drain_load_threshold,
      DEFAULT_ADVANCED_SETTINGS.autoDrainLoadThreshold,
    ),
    autoDrainScorePenalty: toFinite(
      source?.auto_drain_score_penalty,
      DEFAULT_ADVANCED_SETTINGS.autoDrainScorePenalty,
    ),
    balancerLoadWeight: toFinite(
      source?.balancer_load_weight,
      DEFAULT_ADVANCED_SETTINGS.balancerLoadWeight,
    ),
    balancerLatencyWeight: toFinite(
      source?.balancer_latency_weight,
      DEFAULT_ADVANCED_SETTINGS.balancerLatencyWeight,
    ),
    balancerMaxLatencyMs: toFinite(
      source?.balancer_max_latency_ms,
      DEFAULT_ADVANCED_SETTINGS.balancerMaxLatencyMs,
    ),
    balancerSmoothingAlpha: toFinite(
      source?.balancer_smoothing_alpha,
      DEFAULT_ADVANCED_SETTINGS.balancerSmoothingAlpha,
    ),
    balancerHysteresisDelta: toFinite(
      source?.balancer_hysteresis_delta,
      DEFAULT_ADVANCED_SETTINGS.balancerHysteresisDelta,
    ),
  };
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
  const [advancedSettings, setAdvancedSettings] =
    useState<BalancerAdvancedSettings>(DEFAULT_ADVANCED_SETTINGS);
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

  const {
    data: quarantineData,
    refetch: refetchQuarantine,
    isLoading: quarantineLoading,
  } = useQuery({
    queryKey: ['admin', 'balancer', 'quarantine'],
    queryFn: adminBalancerApi.getQuarantine,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!groupsData || groupsDirty) return;
    setGroupsDraft(groupsToDraft(groupsData));
    setFastestEnabled(Boolean(groupsData.fastest_group));
    setFastestGroupName((groupsData.fastest_group_name || DEFAULT_FASTEST_GROUP_NAME).trim());
    setExcludeGroups(groupsData.fastest_exclude_groups || []);
    setAdvancedSettings(normalizeAdvancedSettings(groupsData));
  }, [groupsData, groupsDirty]);

  const setAlert = (message: string, tone: AlertTone = 'default') => {
    setActionMessage(message);
    setActionTone(tone);
  };

  const refreshGroupsMutation = useMutation({
    mutationFn: adminBalancerApi.refreshGroups,
    onSuccess: async () => {
      setAlert(t('admin.balancer.actions.refreshGroupsSuccess', 'Groups updated'), 'success');
      await Promise.all([refetchDebugStats(), refetchGroups(), refetchQuarantine()]);
    },
    onError: () => {
      setAlert(t('admin.balancer.actions.actionError', 'Action failed'), 'error');
    },
  });

  const refreshStatsMutation = useMutation({
    mutationFn: adminBalancerApi.refreshStats,
    onSuccess: async () => {
      setAlert(t('admin.balancer.actions.refreshStatsSuccess', 'Stats updated'), 'success');
      await Promise.all([
        refetchNodeStats(),
        refetchDebugStats(),
        refetchReady(),
        refetchQuarantine(),
      ]);
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
      setAdvancedSettings(normalizeAdvancedSettings(data));
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

  const addQuarantineMutation = useMutation({
    mutationFn: adminBalancerApi.addQuarantine,
    onSuccess: async () => {
      setAlert(t('admin.balancer.actions.quarantineAdded', 'Node added to quarantine'), 'success');
      await Promise.all([
        refetchQuarantine(),
        refetchNodeStats(),
        refetchDebugStats(),
        refetchHealth(),
      ]);
    },
    onError: () => {
      setAlert(t('admin.balancer.actions.quarantineError', 'Failed to update quarantine'), 'error');
    },
  });

  const removeQuarantineMutation = useMutation({
    mutationFn: adminBalancerApi.removeQuarantine,
    onSuccess: async () => {
      setAlert(
        t('admin.balancer.actions.quarantineRemoved', 'Node removed from quarantine'),
        'success',
      );
      await Promise.all([
        refetchQuarantine(),
        refetchNodeStats(),
        refetchDebugStats(),
        refetchHealth(),
      ]);
    },
    onError: () => {
      setAlert(t('admin.balancer.actions.quarantineError', 'Failed to update quarantine'), 'error');
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

  const quarantineSet = useMemo(
    () =>
      new Set(
        (quarantineData?.quarantine_nodes || [])
          .map((name) => name.trim().toLowerCase())
          .filter(Boolean),
      ),
    [quarantineData],
  );

  const nodeRows = useMemo(() => {
    const source = toRecord(nodeStats);
    return Object.entries(source).map(([nodeName, stat]) => {
      const statRecord = toRecord(stat);
      return {
        nodeName,
        usersOnline: prettyValue(statRecord.usersOnline),
        cpuCount: prettyValue(statRecord.cpuCount),
        totalRamGb: `${prettyValue(statRecord.totalRamGb)} GB`,
        cpuLoad: `${prettyValue(statRecord.cpuLoad)} u/core`,
        ramLoad: `${prettyValue(statRecord.ramLoad)} u/GB`,
        connected: prettyValue(statRecord.isConnected),
        disabled: prettyValue(statRecord.isDisabled),
        isAlias: Boolean(statRecord.isAlias),
        quarantined:
          Boolean(statRecord.quarantined) || quarantineSet.has(nodeName.trim().toLowerCase()),
      };
    });
  }, [nodeStats, quarantineSet]);

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

  const toggleNodeQuarantine = (nodeName: string, quarantined: boolean) => {
    if (quarantined) {
      void removeQuarantineMutation.mutateAsync(nodeName);
      return;
    }
    void addQuarantineMutation.mutateAsync(nodeName);
  };

  const updateAdvancedSetting = <K extends keyof BalancerAdvancedSettings>(
    key: K,
    value: BalancerAdvancedSettings[K],
  ) => {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      return;
    }
    setGroupsDirty(true);
    setAdvancedSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const parseNumericInput = (raw: string, fallback: number): number => {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
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
    const nextAdvanced = {
      auto_quarantine_enabled: advancedSettings.autoQuarantineEnabled,
      auto_quarantine_failures: Math.max(1, Math.round(advancedSettings.autoQuarantineFailures)),
      auto_quarantine_release_successes: Math.max(
        1,
        Math.round(advancedSettings.autoQuarantineReleaseSuccesses),
      ),
      auto_quarantine_max_nodes: Math.max(1, Math.round(advancedSettings.autoQuarantineMaxNodes)),
      auto_drain_enabled: advancedSettings.autoDrainEnabled,
      auto_drain_failures: Math.max(1, Math.round(advancedSettings.autoDrainFailures)),
      auto_drain_release_successes: Math.max(
        1,
        Math.round(advancedSettings.autoDrainReleaseSuccesses),
      ),
      auto_drain_load_threshold: Math.max(0, advancedSettings.autoDrainLoadThreshold),
      auto_drain_score_penalty: Math.max(0, advancedSettings.autoDrainScorePenalty),
      balancer_load_weight: Math.max(0, advancedSettings.balancerLoadWeight),
      balancer_latency_weight: Math.max(0, advancedSettings.balancerLatencyWeight),
      balancer_max_latency_ms: Math.max(1, Math.round(advancedSettings.balancerMaxLatencyMs)),
      balancer_smoothing_alpha: Math.max(0, advancedSettings.balancerSmoothingAlpha),
      balancer_hysteresis_delta: Math.max(0, advancedSettings.balancerHysteresisDelta),
    };

    await saveGroupsMutation.mutateAsync({
      groups,
      fastest_group: fastestEnabled,
      fastest_group_name: normalizedFastestName,
      fastest_exclude_groups: filteredExclude,
      ...nextAdvanced,
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
        label: t('admin.balancer.labels.quarantineCount', 'Quarantine nodes'),
        value: prettyValue(healthRecord.quarantine_count),
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
        label: t('admin.balancer.labels.quarantineFiltered', 'Quarantine filtered'),
        value: prettyValue(runtimeStats.quarantine_filtered_total),
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
      auto_quarantine_enabled: advancedSettings.autoQuarantineEnabled,
      auto_quarantine_failures: Math.max(1, Math.round(advancedSettings.autoQuarantineFailures)),
      auto_quarantine_release_successes: Math.max(
        1,
        Math.round(advancedSettings.autoQuarantineReleaseSuccesses),
      ),
      auto_quarantine_max_nodes: Math.max(1, Math.round(advancedSettings.autoQuarantineMaxNodes)),
      auto_drain_enabled: advancedSettings.autoDrainEnabled,
      auto_drain_failures: Math.max(1, Math.round(advancedSettings.autoDrainFailures)),
      auto_drain_release_successes: Math.max(
        1,
        Math.round(advancedSettings.autoDrainReleaseSuccesses),
      ),
      auto_drain_load_threshold: Math.max(0, advancedSettings.autoDrainLoadThreshold),
      auto_drain_score_penalty: Math.max(0, advancedSettings.autoDrainScorePenalty),
      balancer_load_weight: Math.max(0, advancedSettings.balancerLoadWeight),
      balancer_latency_weight: Math.max(0, advancedSettings.balancerLatencyWeight),
      balancer_max_latency_ms: Math.max(1, Math.round(advancedSettings.balancerMaxLatencyMs)),
      balancer_smoothing_alpha: Math.max(0, advancedSettings.balancerSmoothingAlpha),
      balancer_hysteresis_delta: Math.max(0, advancedSettings.balancerHysteresisDelta),
    };
  }, [advancedSettings, excludeGroups, fastestEnabled, fastestGroupName, groupsDraft]);

  return (
    <div className="animate-fade-in space-y-4 overflow-x-hidden pb-28 md:pb-0">
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
                refetchQuarantine(),
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
                setAdvancedSettings(normalizeAdvancedSettings(groupsData));
                setGroupsDirty(false);
                setAlert(
                  t('admin.balancer.actions.changesDiscarded', 'Changes discarded'),
                  'default',
                );
              }}
              className="hidden rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 transition-colors hover:bg-dark-600 md:inline-flex"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              onClick={() => void saveGroups()}
              disabled={saveGroupsMutation.isPending}
              className="hidden rounded-lg border border-accent-500/50 bg-accent-500/20 px-3 py-2 text-sm text-accent-300 transition-colors hover:bg-accent-500/30 disabled:opacity-60 md:inline-flex"
            >
              {t('common.save', 'Save')}
            </button>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-dark-700 bg-dark-900/95 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur md:hidden">
          <div className="mx-auto flex w-full max-w-lg gap-2">
            <button
              onClick={() => {
                if (!groupsData) return;
                setGroupsDraft(groupsToDraft(groupsData));
                setFastestEnabled(Boolean(groupsData.fastest_group));
                setFastestGroupName(
                  (groupsData.fastest_group_name || DEFAULT_FASTEST_GROUP_NAME).trim(),
                );
                setExcludeGroups(groupsData.fastest_exclude_groups || []);
                setAdvancedSettings(normalizeAdvancedSettings(groupsData));
                setGroupsDirty(false);
                setAlert(
                  t('admin.balancer.actions.changesDiscarded', 'Changes discarded'),
                  'default',
                );
              }}
              className="min-w-0 flex-1 rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 transition-colors hover:bg-dark-600"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              onClick={() => void saveGroups()}
              disabled={saveGroupsMutation.isPending}
              className="min-w-0 flex-1 rounded-lg border border-accent-500/50 bg-accent-500/20 px-3 py-2 text-sm text-accent-300 transition-colors hover:bg-accent-500/30 disabled:opacity-60"
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
            {t('admin.balancer.groups.advancedTitle', 'Advanced balancer settings')}
          </h4>
          <p className="mb-3 text-xs text-dark-500">
            {t(
              'admin.balancer.groups.advancedHint',
              'These values are sent to PUT /admin/groups together with groups config.',
            )}
          </p>

          <div className="space-y-3">
            <details className="rounded-lg border border-dark-700 bg-dark-900/30 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-dark-100">
                {t('admin.balancer.groups.sectionAutoQuarantine', 'Auto-quarantine')}
              </summary>
              <p className="mt-2 text-xs text-dark-500">
                {t(
                  'admin.balancer.groups.sectionAutoQuarantineHint',
                  'Automatically moves unstable nodes to quarantine and returns them after successful checks.',
                )}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <label className="flex items-center gap-2 text-sm text-dark-200 md:col-span-2 xl:col-span-3">
                  <input
                    type="checkbox"
                    checked={advancedSettings.autoQuarantineEnabled}
                    onChange={(event) =>
                      updateAdvancedSetting('autoQuarantineEnabled', event.target.checked)
                    }
                  />
                  <span>
                    {t('admin.balancer.groups.autoQuarantineEnabled', 'Enable auto-quarantine')}
                    <span className="mt-1 block text-xs text-dark-500">
                      {t(
                        'admin.balancer.groups.autoQuarantineEnabledDesc',
                        'If enabled, nodes with repeated failures are moved to quarantine automatically.',
                      )}
                    </span>
                  </span>
                </label>
                <label className="text-xs text-dark-400">
                  {t('admin.balancer.groups.autoQuarantineFailures', 'Auto-quarantine failures')}
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={advancedSettings.autoQuarantineFailures}
                    onChange={(event) =>
                      updateAdvancedSetting(
                        'autoQuarantineFailures',
                        parseNumericInput(
                          event.target.value,
                          advancedSettings.autoQuarantineFailures,
                        ),
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none focus:border-accent-500"
                  />
                  <p className="mt-1 text-[11px] text-dark-500">
                    {t(
                      'admin.balancer.groups.autoQuarantineFailuresDesc',
                      'How many failed checks in a row are required before a node is quarantined.',
                    )}
                  </p>
                </label>
                <label className="text-xs text-dark-400">
                  {t(
                    'admin.balancer.groups.autoQuarantineRelease',
                    'Auto-quarantine release successes',
                  )}
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={advancedSettings.autoQuarantineReleaseSuccesses}
                    onChange={(event) =>
                      updateAdvancedSetting(
                        'autoQuarantineReleaseSuccesses',
                        parseNumericInput(
                          event.target.value,
                          advancedSettings.autoQuarantineReleaseSuccesses,
                        ),
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none focus:border-accent-500"
                  />
                  <p className="mt-1 text-[11px] text-dark-500">
                    {t(
                      'admin.balancer.groups.autoQuarantineReleaseDesc',
                      'How many successful checks are needed to release a node from quarantine.',
                    )}
                  </p>
                </label>
                <label className="text-xs text-dark-400">
                  {t('admin.balancer.groups.autoQuarantineMaxNodes', 'Auto-quarantine max nodes')}
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={advancedSettings.autoQuarantineMaxNodes}
                    onChange={(event) =>
                      updateAdvancedSetting(
                        'autoQuarantineMaxNodes',
                        parseNumericInput(
                          event.target.value,
                          advancedSettings.autoQuarantineMaxNodes,
                        ),
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none focus:border-accent-500"
                  />
                  <p className="mt-1 text-[11px] text-dark-500">
                    {t(
                      'admin.balancer.groups.autoQuarantineMaxNodesDesc',
                      'Safety cap for how many nodes can be quarantined automatically.',
                    )}
                  </p>
                </label>
              </div>
            </details>

            <details className="rounded-lg border border-dark-700 bg-dark-900/30 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-dark-100">
                {t('admin.balancer.groups.sectionAutoDrain', 'Auto-drain')}
              </summary>
              <p className="mt-2 text-xs text-dark-500">
                {t(
                  'admin.balancer.groups.sectionAutoDrainHint',
                  'Temporarily lowers node priority when load is high or health is unstable.',
                )}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <label className="flex items-center gap-2 text-sm text-dark-200 md:col-span-2 xl:col-span-3">
                  <input
                    type="checkbox"
                    checked={advancedSettings.autoDrainEnabled}
                    onChange={(event) =>
                      updateAdvancedSetting('autoDrainEnabled', event.target.checked)
                    }
                  />
                  <span>
                    {t('admin.balancer.groups.autoDrainEnabled', 'Enable auto-drain')}
                    <span className="mt-1 block text-xs text-dark-500">
                      {t(
                        'admin.balancer.groups.autoDrainEnabledDesc',
                        'If enabled, overloaded nodes get temporary score penalty instead of immediate quarantine.',
                      )}
                    </span>
                  </span>
                </label>
                <label className="text-xs text-dark-400">
                  {t('admin.balancer.groups.autoDrainFailures', 'Auto-drain failures')}
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={advancedSettings.autoDrainFailures}
                    onChange={(event) =>
                      updateAdvancedSetting(
                        'autoDrainFailures',
                        parseNumericInput(event.target.value, advancedSettings.autoDrainFailures),
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none focus:border-accent-500"
                  />
                  <p className="mt-1 text-[11px] text-dark-500">
                    {t(
                      'admin.balancer.groups.autoDrainFailuresDesc',
                      'How many degraded checks in a row are needed before drain penalty is applied.',
                    )}
                  </p>
                </label>
                <label className="text-xs text-dark-400">
                  {t('admin.balancer.groups.autoDrainRelease', 'Auto-drain release successes')}
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={advancedSettings.autoDrainReleaseSuccesses}
                    onChange={(event) =>
                      updateAdvancedSetting(
                        'autoDrainReleaseSuccesses',
                        parseNumericInput(
                          event.target.value,
                          advancedSettings.autoDrainReleaseSuccesses,
                        ),
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none focus:border-accent-500"
                  />
                  <p className="mt-1 text-[11px] text-dark-500">
                    {t(
                      'admin.balancer.groups.autoDrainReleaseDesc',
                      'How many stable checks are needed to remove drain penalty.',
                    )}
                  </p>
                </label>
                <label className="text-xs text-dark-400">
                  {t('admin.balancer.groups.autoDrainLoadThreshold', 'Auto-drain load threshold')}
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={advancedSettings.autoDrainLoadThreshold}
                    onChange={(event) =>
                      updateAdvancedSetting(
                        'autoDrainLoadThreshold',
                        parseNumericInput(
                          event.target.value,
                          advancedSettings.autoDrainLoadThreshold,
                        ),
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none focus:border-accent-500"
                  />
                  <p className="mt-1 text-[11px] text-dark-500">
                    {t(
                      'admin.balancer.groups.autoDrainLoadThresholdDesc',
                      'Load value above this threshold is considered degraded for auto-drain logic.',
                    )}
                  </p>
                </label>
                <label className="text-xs text-dark-400 md:col-span-2 xl:col-span-1">
                  {t('admin.balancer.groups.autoDrainScorePenalty', 'Auto-drain score penalty')}
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={advancedSettings.autoDrainScorePenalty}
                    onChange={(event) =>
                      updateAdvancedSetting(
                        'autoDrainScorePenalty',
                        parseNumericInput(
                          event.target.value,
                          advancedSettings.autoDrainScorePenalty,
                        ),
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none focus:border-accent-500"
                  />
                  <p className="mt-1 text-[11px] text-dark-500">
                    {t(
                      'admin.balancer.groups.autoDrainScorePenaltyDesc',
                      'How much score penalty is added while a node is in auto-drain state.',
                    )}
                  </p>
                </label>
              </div>
            </details>

            <details className="rounded-lg border border-dark-700 bg-dark-900/30 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-dark-100">
                {t('admin.balancer.groups.sectionScoreModel', 'Score model')}
              </summary>
              <p className="mt-2 text-xs text-dark-500">
                {t(
                  'admin.balancer.groups.sectionScoreModelHint',
                  'Defines how load and latency are balanced when selecting preferred nodes.',
                )}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <label className="text-xs text-dark-400">
                  {t('admin.balancer.groups.balancerLoadWeight', 'Score load weight')}
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={advancedSettings.balancerLoadWeight}
                    onChange={(event) =>
                      updateAdvancedSetting(
                        'balancerLoadWeight',
                        parseNumericInput(event.target.value, advancedSettings.balancerLoadWeight),
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none focus:border-accent-500"
                  />
                  <p className="mt-1 text-[11px] text-dark-500">
                    {t(
                      'admin.balancer.groups.balancerLoadWeightDesc',
                      'Weight of node load in final score. Higher value means stronger load-based balancing.',
                    )}
                  </p>
                </label>
                <label className="text-xs text-dark-400">
                  {t('admin.balancer.groups.balancerLatencyWeight', 'Score latency weight')}
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={advancedSettings.balancerLatencyWeight}
                    onChange={(event) =>
                      updateAdvancedSetting(
                        'balancerLatencyWeight',
                        parseNumericInput(
                          event.target.value,
                          advancedSettings.balancerLatencyWeight,
                        ),
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none focus:border-accent-500"
                  />
                  <p className="mt-1 text-[11px] text-dark-500">
                    {t(
                      'admin.balancer.groups.balancerLatencyWeightDesc',
                      'Weight of latency in final score. Higher value favors lower-ping nodes.',
                    )}
                  </p>
                </label>
                <label className="text-xs text-dark-400">
                  {t('admin.balancer.groups.balancerMaxLatencyMs', 'Score max latency (ms)')}
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={advancedSettings.balancerMaxLatencyMs}
                    onChange={(event) =>
                      updateAdvancedSetting(
                        'balancerMaxLatencyMs',
                        parseNumericInput(
                          event.target.value,
                          advancedSettings.balancerMaxLatencyMs,
                        ),
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none focus:border-accent-500"
                  />
                  <p className="mt-1 text-[11px] text-dark-500">
                    {t(
                      'admin.balancer.groups.balancerMaxLatencyMsDesc',
                      'Latency normalization cap in milliseconds for score calculation.',
                    )}
                  </p>
                </label>
                <label className="text-xs text-dark-400">
                  {t('admin.balancer.groups.balancerSmoothingAlpha', 'Score smoothing alpha')}
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={advancedSettings.balancerSmoothingAlpha}
                    onChange={(event) =>
                      updateAdvancedSetting(
                        'balancerSmoothingAlpha',
                        parseNumericInput(
                          event.target.value,
                          advancedSettings.balancerSmoothingAlpha,
                        ),
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none focus:border-accent-500"
                  />
                  <p className="mt-1 text-[11px] text-dark-500">
                    {t(
                      'admin.balancer.groups.balancerSmoothingAlphaDesc',
                      'Smoothing factor for score updates. Lower value reduces short-term jitter.',
                    )}
                  </p>
                </label>
                <label className="text-xs text-dark-400">
                  {t('admin.balancer.groups.balancerHysteresisDelta', 'Score hysteresis delta')}
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={advancedSettings.balancerHysteresisDelta}
                    onChange={(event) =>
                      updateAdvancedSetting(
                        'balancerHysteresisDelta',
                        parseNumericInput(
                          event.target.value,
                          advancedSettings.balancerHysteresisDelta,
                        ),
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-900/70 px-3 py-2 text-sm text-dark-100 outline-none focus:border-accent-500"
                  />
                  <p className="mt-1 text-[11px] text-dark-500">
                    {t(
                      'admin.balancer.groups.balancerHysteresisDeltaDesc',
                      'Minimum score improvement required before switching to another node.',
                    )}
                  </p>
                </label>
              </div>
            </details>
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

        <div className="mb-3 rounded-lg border border-dark-700 bg-dark-900/40 p-3 text-xs text-dark-300">
          <p>
            {t('admin.balancer.quarantine.title', 'Quarantine')}:{' '}
            <span className="font-semibold text-dark-100">
              {quarantineLoading
                ? t('common.loading', 'Loading...')
                : (quarantineData?.quarantine_count ?? 0)}
            </span>
          </p>
          <p className="mt-1 text-dark-400">
            {t(
              'admin.balancer.quarantine.hint',
              'Quarantined nodes are excluded from generated groups until removed from quarantine.',
            )}
          </p>
        </div>

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
            <p className="mb-2 text-xs text-dark-500">
              {t(
                'admin.balancer.cards.nodeStatsUnitsHint',
                'RAM load and CPU load are user density metrics (users per GB/core), not used memory/CPU percent.',
              )}
            </p>
            <table className="min-w-full text-left text-sm text-dark-200">
              <thead>
                <tr className="border-b border-dark-700 text-xs uppercase text-dark-400">
                  <th className="px-2 py-2">{t('admin.balancer.table.node', 'Node')}</th>
                  <th className="px-2 py-2">{t('admin.balancer.table.users', 'Users')}</th>
                  <th className="px-2 py-2">{t('admin.balancer.table.cpuCores', 'CPU Cores')}</th>
                  <th className="px-2 py-2">{t('admin.balancer.table.cpuLoad', 'CPU Load')}</th>
                  <th className="px-2 py-2">{t('admin.balancer.table.ramLoad', 'RAM Load')}</th>
                  <th className="px-2 py-2">{t('admin.balancer.table.totalRam', 'Total RAM')}</th>
                  <th className="px-2 py-2">{t('admin.balancer.table.connected', 'Connected')}</th>
                  <th className="px-2 py-2">{t('admin.balancer.table.disabled', 'Disabled')}</th>
                  <th className="px-2 py-2">
                    {t('admin.balancer.table.quarantine', 'Quarantine')}
                  </th>
                  <th className="px-2 py-2">{t('admin.balancer.table.action', 'Action')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleNodeRows.map((row) => (
                  <tr key={row.nodeName} className="border-b border-dark-800/70">
                    <td className="px-2 py-2 font-medium text-dark-100">{row.nodeName}</td>
                    <td className="px-2 py-2">{row.usersOnline}</td>
                    <td className="px-2 py-2">{row.cpuCount}</td>
                    <td className="px-2 py-2">{row.cpuLoad}</td>
                    <td className="px-2 py-2">{row.ramLoad}</td>
                    <td className="px-2 py-2">{row.totalRamGb}</td>
                    <td className="px-2 py-2">{row.connected}</td>
                    <td className="px-2 py-2">{row.disabled}</td>
                    <td className="px-2 py-2">
                      {row.quarantined ? (
                        <span className="rounded bg-warning-500/15 px-2 py-1 text-xs text-warning-300">
                          {t('common.yes', 'Yes')}
                        </span>
                      ) : (
                        <span className="rounded bg-success-500/15 px-2 py-1 text-xs text-success-300">
                          {t('common.no', 'No')}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => toggleNodeQuarantine(row.nodeName, row.quarantined)}
                        disabled={
                          addQuarantineMutation.isPending || removeQuarantineMutation.isPending
                        }
                        className={`rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-50 ${
                          row.quarantined
                            ? 'border-success-500/40 bg-success-500/10 text-success-300 hover:bg-success-500/20'
                            : 'border-warning-500/40 bg-warning-500/10 text-warning-300 hover:bg-warning-500/20'
                        }`}
                      >
                        {row.quarantined
                          ? t('admin.balancer.actions.removeQuarantine', 'Remove')
                          : t('admin.balancer.actions.addQuarantine', 'Quarantine')}
                      </button>
                    </td>
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
        <JsonDetails
          title={t('admin.balancer.quarantine.title', 'Quarantine')}
          data={quarantineLoading ? { loading: true } : (quarantineData ?? {})}
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
