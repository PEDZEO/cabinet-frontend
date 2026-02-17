import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import type { SortingState } from '@tanstack/react-table';
import {
  adminTrafficApi,
  type TrafficEnrichmentData,
  type TrafficNodeInfo,
  type TrafficParams,
  type TrafficUsageResponse,
  type UserTrafficItem,
} from '../../../api/adminTraffic';
import { PERIODS } from '../constants';
import { toBackendSortField } from '../utils/formatters';

interface UseAdminTrafficUsageDataParams {
  t: TFunction;
}

export function useAdminTrafficUsageData({ t }: UseAdminTrafficUsageDataParams) {
  const [items, setItems] = useState<UserTrafficItem[]>([]);
  const [nodes, setNodes] = useState<TrafficNodeInfo[]>([]);
  const [availableTariffs, setAvailableTariffs] = useState<string[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [dateMode, setDateMode] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [selectedTariffs, setSelectedTariffs] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [enrichment, setEnrichment] = useState<Record<number, TrafficEnrichmentData> | null>(null);
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'total_bytes', desc: true }]);
  const [totalThreshold, setTotalThreshold] = useState('');
  const [nodeThreshold, setNodeThreshold] = useState('');
  const [periodDays, setPeriodDays] = useState(30);

  const limit = 50;
  const hasData = items.length > 0 || nodes.length > 0;

  const sortBy = sorting[0] ? toBackendSortField(sorting[0].id) : 'total_bytes';
  const sortDesc = sorting[0]?.desc ?? true;
  const tariffsParam = selectedTariffs.size > 0 ? [...selectedTariffs].join(',') : undefined;
  const statusesParam = selectedStatuses.size > 0 ? [...selectedStatuses].join(',') : undefined;

  const mergedNodesParam = useMemo(() => {
    const countryUuids =
      selectedCountries.size > 0
        ? new Set(
            nodes
              .filter((node) => selectedCountries.has(node.country_code))
              .map((node) => node.node_uuid),
          )
        : null;
    const nodeUuids = selectedNodes.size > 0 ? new Set(selectedNodes) : null;

    let merged: Set<string> | null = null;
    if (countryUuids && nodeUuids) {
      merged = new Set([...countryUuids].filter((id) => nodeUuids.has(id)));
    } else {
      merged = countryUuids || nodeUuids;
    }

    return merged && merged.size > 0 ? [...merged].join(',') : undefined;
  }, [nodes, selectedCountries, selectedNodes]);

  const buildParams = useCallback((): TrafficParams => {
    const params: TrafficParams = {
      limit,
      offset,
      search: committedSearch || undefined,
      sort_by: sortBy,
      sort_desc: sortDesc,
      tariffs: tariffsParam,
      statuses: statusesParam,
      nodes: mergedNodesParam,
    };

    if (dateMode && customStart && customEnd) {
      params.start_date = customStart;
      params.end_date = customEnd;
    } else {
      params.period = period;
    }

    return params;
  }, [
    period,
    offset,
    committedSearch,
    sortBy,
    sortDesc,
    tariffsParam,
    statusesParam,
    mergedNodesParam,
    dateMode,
    customStart,
    customEnd,
  ]);

  const applyData = useCallback((data: TrafficUsageResponse) => {
    setItems(data.items);
    setNodes(data.nodes);
    setTotal(data.total);
    setAvailableTariffs(data.available_tariffs);
    setAvailableStatuses(data.available_statuses);
    setPeriodDays(data.period_days);
  }, []);

  const loadData = useCallback(
    async (skipCache = false) => {
      const params = buildParams();

      if (!skipCache) {
        const cached = adminTrafficApi.getCached(params);
        if (cached) {
          applyData(cached);
          setInitialLoading(false);
          return;
        }
      }

      try {
        setLoading(true);
        const data = await adminTrafficApi.getTrafficUsage(params, { skipCache });
        applyData(data);
      } catch {
        // Keep stale data visible
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [buildParams, applyData],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (initialLoading || items.length === 0) return;

    let cancelled = false;
    const load = async () => {
      setEnrichmentLoading(true);
      try {
        const response = await adminTrafficApi.getEnrichment();
        if (!cancelled) setEnrichment(response.data);
      } catch {
        // enrichment is optional
      } finally {
        if (!cancelled) setEnrichmentLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [initialLoading, items.length]);

  useEffect(() => {
    if (dateMode) return;

    const prefetchPeriods = PERIODS.filter((value) => value !== period);
    const timer = setTimeout(() => {
      prefetchPeriods.forEach((value) => {
        const params: TrafficParams = {
          period: value,
          limit,
          offset: 0,
          sort_by: 'total_bytes',
          sort_desc: true,
        };
        if (!adminTrafficApi.getCached(params)) {
          void adminTrafficApi.getTrafficUsage(params).catch(() => {});
        }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [period, dateMode]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSearch = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      setOffset(0);
      setCommittedSearch(searchInput);
    },
    [searchInput],
  );

  const totalThresholdNum = Math.max(0, parseFloat(totalThreshold) || 0);
  const hasTotalThreshold = totalThresholdNum > 0;
  const nodeThresholdNum = Math.max(0, parseFloat(nodeThreshold) || 0);
  const hasNodeThreshold = nodeThresholdNum > 0;
  const hasAnyThreshold = hasTotalThreshold || hasNodeThreshold;

  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      const exportData: {
        period: number;
        start_date?: string;
        end_date?: string;
        tariffs?: string;
        statuses?: string;
        nodes?: string;
        total_threshold_gb?: number;
        node_threshold_gb?: number;
      } = { period };

      if (dateMode && customStart && customEnd) {
        exportData.start_date = customStart;
        exportData.end_date = customEnd;
      }
      if (tariffsParam) exportData.tariffs = tariffsParam;
      if (statusesParam) exportData.statuses = statusesParam;
      if (mergedNodesParam) exportData.nodes = mergedNodesParam;
      if (totalThresholdNum > 0) exportData.total_threshold_gb = totalThresholdNum;
      if (nodeThresholdNum > 0) exportData.node_threshold_gb = nodeThresholdNum;

      await adminTrafficApi.exportCsv(exportData);
      setToast({ message: t('admin.trafficUsage.exportSuccess'), type: 'success' });
    } catch {
      setToast({ message: t('admin.trafficUsage.exportError'), type: 'error' });
    } finally {
      setExporting(false);
    }
  }, [
    period,
    dateMode,
    customStart,
    customEnd,
    tariffsParam,
    statusesParam,
    mergedNodesParam,
    totalThresholdNum,
    nodeThresholdNum,
    t,
  ]);

  const handlePeriodChange = useCallback((value: number) => {
    setPeriod(value);
    setOffset(0);
  }, []);

  const handleToggleDateMode = useCallback(() => {
    if (dateMode) {
      setDateMode(false);
      setCustomStart('');
      setCustomEnd('');
      setOffset(0);
    } else {
      const end = new Date();
      const start = new Date(end.getTime() - period * 24 * 60 * 60 * 1000);
      setCustomStart(start.toISOString().split('T')[0]);
      setCustomEnd(end.toISOString().split('T')[0]);
      setDateMode(true);
      setOffset(0);
    }
  }, [dateMode, period]);

  const handleCustomStartChange = useCallback((value: string) => {
    setCustomStart(value);
    setOffset(0);
  }, []);

  const handleCustomEndChange = useCallback((value: string) => {
    setCustomEnd(value);
    setOffset(0);
  }, []);

  const handleSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(next);
      setOffset(0);
    },
    [sorting],
  );

  const handleTariffChange = useCallback((next: Set<string>) => {
    setSelectedTariffs(next);
    setOffset(0);
  }, []);

  const handleStatusChange = useCallback((next: Set<string>) => {
    setSelectedStatuses(next);
    setOffset(0);
  }, []);

  const handleNodeChange = useCallback((next: Set<string>) => {
    setSelectedNodes(next);
    setOffset(0);
  }, []);

  const handleCountryChange = useCallback((next: Set<string>) => {
    setSelectedCountries(next);
    setOffset(0);
  }, []);

  const handleRefresh = useCallback(() => {
    void loadData(true);
    setEnrichment(null);
    setEnrichmentLoading(true);
    void adminTrafficApi
      .getEnrichment({ skipCache: true })
      .then((response) => setEnrichment(response.data))
      .catch(() => {})
      .finally(() => setEnrichmentLoading(false));
  }, [loadData]);

  const availableCountries = useMemo(() => {
    const map = new Map<string, number>();
    for (const node of nodes) {
      if (node.country_code) {
        map.set(node.country_code, (map.get(node.country_code) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([code, count]) => ({ code, count }));
  }, [nodes]);

  const displayNodes = useMemo(() => {
    let filtered = nodes;
    if (selectedCountries.size > 0) {
      filtered = filtered.filter((node) => selectedCountries.has(node.country_code));
    }
    if (selectedNodes.size > 0) {
      filtered = filtered.filter((node) => selectedNodes.has(node.node_uuid));
    }
    return filtered;
  }, [nodes, selectedCountries, selectedNodes]);

  return {
    items,
    nodes,
    availableTariffs,
    availableStatuses,
    loading,
    initialLoading,
    period,
    dateMode,
    customStart,
    customEnd,
    searchInput,
    setSearchInput,
    selectedTariffs,
    selectedStatuses,
    selectedNodes,
    selectedCountries,
    offset,
    setOffset,
    total,
    enrichment,
    enrichmentLoading,
    exporting,
    toast,
    sorting,
    totalThreshold,
    setTotalThreshold,
    nodeThreshold,
    setNodeThreshold,
    periodDays,
    limit,
    hasData,
    availableCountries,
    displayNodes,
    totalThresholdNum,
    hasTotalThreshold,
    nodeThresholdNum,
    hasNodeThreshold,
    hasAnyThreshold,
    handleSearch,
    handleExport,
    handlePeriodChange,
    handleToggleDateMode,
    handleCustomStartChange,
    handleCustomEndChange,
    handleSortingChange,
    handleTariffChange,
    handleStatusChange,
    handleNodeChange,
    handleCountryChange,
    handleRefresh,
  };
}
