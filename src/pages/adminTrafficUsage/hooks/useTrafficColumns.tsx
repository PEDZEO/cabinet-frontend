import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import type { ColumnDef } from '@tanstack/react-table';
import type {
  TrafficEnrichmentData,
  TrafficNodeInfo,
  UserTrafficItem,
} from '../../../api/adminTraffic';
import { RiskBadge } from '../components/RiskBadge';
import {
  formatBytes,
  formatCurrency,
  formatGbPerDay,
  formatShortDate,
  getFlagEmoji,
} from '../utils/formatters';
import {
  bytesToGbPerDay,
  getCompositeRisk,
  getNodeTextColor,
  getRatio,
  getRiskLevel,
} from '../utils/risk';

interface UseTrafficColumnsParams {
  t: TFunction;
  displayNodes: TrafficNodeInfo[];
  enrichment: Record<number, TrafficEnrichmentData> | null;
  enrichmentLoading: boolean;
  hasAnyThreshold: boolean;
  hasTotalThreshold: boolean;
  hasNodeThreshold: boolean;
  totalThresholdNum: number;
  nodeThresholdNum: number;
  periodDays: number;
}

export function useTrafficColumns({
  t,
  displayNodes,
  enrichment,
  enrichmentLoading,
  hasAnyThreshold,
  hasTotalThreshold,
  hasNodeThreshold,
  totalThresholdNum,
  nodeThresholdNum,
  periodDays,
}: UseTrafficColumnsParams) {
  return useMemo<ColumnDef<UserTrafficItem>[]>(() => {
    const columns: ColumnDef<UserTrafficItem>[] = [
      {
        id: 'user',
        accessorFn: (row) => row.full_name,
        header: t('admin.trafficUsage.user'),
        enableSorting: true,
        size: 120,
        minSize: 40,
        maxSize: 200,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-[10px] font-medium text-white">
                {item.full_name?.[0] || '?'}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-dark-100">{item.full_name}</div>
                {item.username ? (
                  <div className="truncate text-[10px] leading-tight text-dark-500">
                    @{item.username}
                  </div>
                ) : item.email ? (
                  <div className="truncate text-[10px] leading-tight text-dark-500">
                    {item.email}
                  </div>
                ) : null}
              </div>
            </div>
          );
        },
        meta: { sticky: true },
      },
      {
        accessorKey: 'tariff_name',
        header: t('admin.trafficUsage.tariff'),
        enableSorting: true,
        size: 120,
        minSize: 80,
        cell: ({ getValue }) => (
          <span className="text-xs text-dark-300">
            {(getValue() as string | null) || t('admin.trafficUsage.noTariff')}
          </span>
        ),
      },
      {
        accessorKey: 'device_limit',
        header: t('admin.trafficUsage.devices'),
        enableSorting: true,
        size: 80,
        minSize: 60,
        meta: { align: 'center' as const },
        cell: ({ getValue }) => (
          <span className="text-xs text-dark-300">{getValue() as number}</span>
        ),
      },
      {
        accessorKey: 'traffic_limit_gb',
        header: t('admin.trafficUsage.trafficLimit'),
        enableSorting: true,
        size: 80,
        minSize: 60,
        meta: { align: 'center' as const },
        cell: ({ getValue }) => {
          const gb = getValue() as number;
          return <span className="text-xs text-dark-300">{gb > 0 ? `${gb} GB` : '\u221E'}</span>;
        },
      },
      {
        id: 'connected',
        header: t('admin.trafficUsage.connected'),
        size: 65,
        minSize: 50,
        enableSorting: true,
        meta: { align: 'center' as const },
        cell: ({ row }) => {
          const enriched = enrichment?.[row.original.user_id];
          if (enrichmentLoading && !enrichment) {
            return <div className="mx-auto h-4 w-8 animate-pulse rounded bg-dark-700" />;
          }
          return (
            <span className="text-xs text-dark-300">{enriched?.devices_connected ?? '\u2014'}</span>
          );
        },
      },
      {
        id: 'total_spent',
        header: t('admin.trafficUsage.totalSpent'),
        size: 75,
        minSize: 55,
        enableSorting: true,
        meta: { align: 'center' as const },
        cell: ({ row }) => {
          const enriched = enrichment?.[row.original.user_id];
          if (enrichmentLoading && !enrichment) {
            return <div className="mx-auto h-4 w-12 animate-pulse rounded bg-dark-700" />;
          }
          if (!enriched || enriched.total_spent_kopeks === 0) {
            return <span className="text-xs text-dark-300">{'\u2014'}</span>;
          }
          return (
            <span className="text-xs text-dark-300">
              {formatCurrency(enriched.total_spent_kopeks)}
            </span>
          );
        },
      },
      {
        id: 'sub_start',
        header: t('admin.trafficUsage.subStart'),
        size: 80,
        minSize: 65,
        enableSorting: true,
        meta: { align: 'center' as const },
        cell: ({ row }) => {
          const enriched = enrichment?.[row.original.user_id];
          if (enrichmentLoading && !enrichment) {
            return <div className="mx-auto h-4 w-14 animate-pulse rounded bg-dark-700" />;
          }
          return (
            <span className="text-xs text-dark-300">
              {formatShortDate(enriched?.subscription_start_date ?? null)}
            </span>
          );
        },
      },
      {
        id: 'sub_end',
        header: t('admin.trafficUsage.subEnd'),
        size: 80,
        minSize: 65,
        enableSorting: true,
        meta: { align: 'center' as const },
        cell: ({ row }) => {
          const enriched = enrichment?.[row.original.user_id];
          if (enrichmentLoading && !enrichment) {
            return <div className="mx-auto h-4 w-14 animate-pulse rounded bg-dark-700" />;
          }
          return (
            <span className="text-xs text-dark-300">
              {formatShortDate(enriched?.subscription_end_date ?? null)}
            </span>
          );
        },
      },
      {
        id: 'last_node',
        header: t('admin.trafficUsage.lastNode'),
        size: 100,
        minSize: 70,
        enableSorting: true,
        meta: { align: 'center' as const },
        cell: ({ row }) => {
          const enriched = enrichment?.[row.original.user_id];
          if (enrichmentLoading && !enrichment) {
            return <div className="mx-auto h-4 w-16 animate-pulse rounded bg-dark-700" />;
          }
          return (
            <span className="text-xs text-dark-300">{enriched?.last_node_name ?? '\u2014'}</span>
          );
        },
      },
      ...displayNodes.map(
        (node): ColumnDef<UserTrafficItem> => ({
          id: `node_${node.node_uuid}`,
          accessorFn: (row) => row.node_traffic[node.node_uuid] || 0,
          header: `${getFlagEmoji(node.country_code)} ${node.node_name}`,
          enableSorting: true,
          size: 110,
          minSize: 80,
          meta: { align: 'center' as const },
          cell: ({ getValue }) => {
            const bytes = getValue() as number;
            if (bytes <= 0) {
              return <span className="text-xs text-dark-300">{'\u2014'}</span>;
            }
            const dailyNode = bytesToGbPerDay(bytes, periodDays);
            const nodeRatio = hasNodeThreshold ? getRatio(dailyNode, nodeThresholdNum) : 0;
            const textColor = hasNodeThreshold ? getNodeTextColor(nodeRatio) : undefined;

            return (
              <div className="flex flex-col items-center">
                <span
                  className="text-xs text-dark-300"
                  style={{
                    color: textColor,
                    fontWeight: nodeRatio > 0.8 ? 600 : undefined,
                  }}
                >
                  {formatBytes(bytes)}
                </span>
                {hasNodeThreshold && (
                  <span
                    className="text-[9px] leading-tight opacity-60"
                    style={{ color: textColor }}
                  >
                    {formatGbPerDay(dailyNode)} GB/d
                  </span>
                )}
              </div>
            );
          },
        }),
      ),
    ];

    if (hasAnyThreshold) {
      columns.push({
        id: 'risk',
        header: t('admin.trafficUsage.risk'),
        size: 100,
        minSize: 80,
        meta: { align: 'center' as const },
        accessorFn: (row) => {
          const result = getCompositeRisk(row, totalThresholdNum, nodeThresholdNum, periodDays);
          return result.ratio;
        },
        enableSorting: false,
        cell: ({ row }) => {
          const result = getCompositeRisk(
            row.original,
            totalThresholdNum,
            nodeThresholdNum,
            periodDays,
          );
          const level = getRiskLevel(result.ratio);
          return <RiskBadge level={level} ratio={result.ratio} gbPerDay={result.gbPerDay} />;
        },
      });
    }

    columns.push({
      accessorKey: 'total_bytes',
      header: t('admin.trafficUsage.total'),
      enableSorting: true,
      size: 110,
      minSize: 80,
      meta: { align: 'center' as const, bold: true },
      cell: ({ getValue }) => {
        const bytes = getValue() as number;
        if (bytes <= 0) {
          return <span className="text-xs font-semibold text-dark-100">{'\u2014'}</span>;
        }
        const dailyTotal = bytesToGbPerDay(bytes, periodDays);
        return (
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-dark-100">{formatBytes(bytes)}</span>
            {hasTotalThreshold && (
              <span className="text-[9px] leading-tight text-dark-400">
                {formatGbPerDay(dailyTotal)} GB/d
              </span>
            )}
          </div>
        );
      },
    });

    return columns;
  }, [
    displayNodes,
    enrichment,
    enrichmentLoading,
    hasAnyThreshold,
    hasNodeThreshold,
    hasTotalThreshold,
    nodeThresholdNum,
    periodDays,
    t,
    totalThresholdNum,
  ]);
}
