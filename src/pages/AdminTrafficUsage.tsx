import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table';
import { type UserTrafficItem } from '../api/adminTraffic';
import { usePlatform } from '../platform/hooks/usePlatform';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  RefreshIcon,
  SearchIcon,
  ServerSmallIcon,
  ShieldIcon,
  SortIcon,
  XIcon,
} from './adminTrafficUsage/components/Icons';
import {
  CountryFilter,
  NodeFilter,
  PeriodSelector,
  StatusFilter,
  TariffFilter,
} from './adminTrafficUsage/components/Filters';
import { ProgressBar } from './adminTrafficUsage/components/ProgressBar';
import { RiskBadge } from './adminTrafficUsage/components/RiskBadge';
import {
  formatBytes,
  formatCurrency,
  formatGbPerDay,
  formatShortDate,
  getFlagEmoji,
} from './adminTrafficUsage/utils/formatters';
import {
  bytesToGbPerDay,
  getCompositeRisk,
  getNodeTextColor,
  getRatio,
  getRiskLevel,
  getRowBgColor,
} from './adminTrafficUsage/utils/risk';
import { useAdminTrafficUsageData } from './adminTrafficUsage/hooks/useAdminTrafficUsageData';

// ============ TanStack Table module augmentation ============

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    sticky?: boolean;
    align?: 'left' | 'center';
    bold?: boolean;
  }
}

// ============ Main Page ============

export default function AdminTrafficUsage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { capabilities } = usePlatform();

  const [columnSizing, setColumnSizing] = useState<Record<string, number>>({});
  const {
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
  } = useAdminTrafficUsageData({ t });

  const columns = useMemo<ColumnDef<UserTrafficItem>[]>(() => {
    const cols: ColumnDef<UserTrafficItem>[] = [
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
      // ---- Enrichment columns ----
      {
        id: 'connected',
        header: t('admin.trafficUsage.connected'),
        size: 65,
        minSize: 50,
        enableSorting: true,
        meta: { align: 'center' as const },
        cell: ({ row }) => {
          const e = enrichment?.[row.original.user_id];
          if (enrichmentLoading && !enrichment)
            return <div className="mx-auto h-4 w-8 animate-pulse rounded bg-dark-700" />;
          return <span className="text-xs text-dark-300">{e?.devices_connected ?? '\u2014'}</span>;
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
          const e = enrichment?.[row.original.user_id];
          if (enrichmentLoading && !enrichment)
            return <div className="mx-auto h-4 w-12 animate-pulse rounded bg-dark-700" />;
          if (!e || e.total_spent_kopeks === 0)
            return <span className="text-xs text-dark-300">{'\u2014'}</span>;
          return (
            <span className="text-xs text-dark-300">{formatCurrency(e.total_spent_kopeks)}</span>
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
          const e = enrichment?.[row.original.user_id];
          if (enrichmentLoading && !enrichment)
            return <div className="mx-auto h-4 w-14 animate-pulse rounded bg-dark-700" />;
          return (
            <span className="text-xs text-dark-300">
              {formatShortDate(e?.subscription_start_date ?? null)}
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
          const e = enrichment?.[row.original.user_id];
          if (enrichmentLoading && !enrichment)
            return <div className="mx-auto h-4 w-14 animate-pulse rounded bg-dark-700" />;
          return (
            <span className="text-xs text-dark-300">
              {formatShortDate(e?.subscription_end_date ?? null)}
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
          const e = enrichment?.[row.original.user_id];
          if (enrichmentLoading && !enrichment)
            return <div className="mx-auto h-4 w-16 animate-pulse rounded bg-dark-700" />;
          return <span className="text-xs text-dark-300">{e?.last_node_name ?? '\u2014'}</span>;
        },
      },
      // ---- Dynamic node columns ----
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

    // Risk column — insert before total when any threshold is set
    if (hasAnyThreshold) {
      cols.push({
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

    cols.push({
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

    return cols;
  }, [
    displayNodes,
    t,
    hasAnyThreshold,
    hasTotalThreshold,
    hasNodeThreshold,
    totalThresholdNum,
    nodeThresholdNum,
    periodDays,
    enrichment,
    enrichmentLoading,
  ]);

  // TanStack Table returns non-memoizable functions; this is expected for table instance creation.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: items,
    columns,
    state: { sorting, columnSizing },
    onSortingChange: handleSortingChange,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableSortingRemoval: false,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
  });

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="relative animate-fade-in">
      {/* Progress bar — shown during background refresh */}
      <ProgressBar loading={loading} />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl border px-4 py-2 text-sm shadow-lg ${
            toast.type === 'success'
              ? 'border-success-500/30 bg-success-500/20 text-success-400'
              : 'border-error-500/30 bg-error-500/20 text-error-400'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!capabilities.hasBackButton && (
            <button
              onClick={() => navigate('/admin')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-700 bg-dark-800 transition-colors hover:border-dark-600"
            >
              <ChevronLeftIcon />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-dark-100">{t('admin.trafficUsage.title')}</h1>
            <p className="text-sm text-dark-400">{t('admin.trafficUsage.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="rounded-lg p-2 transition-colors hover:bg-dark-700 disabled:opacity-50"
        >
          <RefreshIcon className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <PeriodSelector
            value={period}
            onChange={handlePeriodChange}
            label={t('admin.trafficUsage.period')}
            dateMode={dateMode}
            customStart={customStart}
            customEnd={customEnd}
            onToggleDateMode={handleToggleDateMode}
            onCustomStartChange={handleCustomStartChange}
            onCustomEndChange={handleCustomEndChange}
          />
          <TariffFilter
            available={availableTariffs}
            selected={selectedTariffs}
            onChange={handleTariffChange}
          />
          <NodeFilter available={nodes} selected={selectedNodes} onChange={handleNodeChange} />
          <CountryFilter
            available={availableCountries}
            selected={selectedCountries}
            onChange={handleCountryChange}
          />
          <StatusFilter
            available={availableStatuses}
            selected={selectedStatuses}
            onChange={handleStatusChange}
          />

          {/* Threshold inputs */}
          <div className="flex items-center gap-1.5 rounded-lg border border-dark-700 bg-dark-800 px-2 py-1">
            <ShieldIcon />
            <input
              type="number"
              value={totalThreshold}
              onChange={(e) => setTotalThreshold(e.target.value)}
              placeholder={t('admin.trafficUsage.totalThreshold')}
              step="0.1"
              min="0"
              max="9999"
              className="w-20 bg-transparent text-xs text-dark-200 placeholder-dark-500 [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            {totalThreshold && (
              <button
                onClick={() => setTotalThreshold('')}
                className="text-dark-500 hover:text-dark-300"
              >
                <XIcon />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-dark-700 bg-dark-800 px-2 py-1">
            <ServerSmallIcon />
            <input
              type="number"
              value={nodeThreshold}
              onChange={(e) => setNodeThreshold(e.target.value)}
              placeholder={t('admin.trafficUsage.nodeThreshold')}
              step="0.1"
              min="0"
              max="9999"
              className="w-20 bg-transparent text-xs text-dark-200 placeholder-dark-500 [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            {nodeThreshold && (
              <button
                onClick={() => setNodeThreshold('')}
                className="text-dark-500 hover:text-dark-300"
              >
                <XIcon />
              </button>
            )}
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-dark-700 bg-dark-800 px-3 py-1.5 text-xs font-medium text-dark-200 transition-colors hover:border-dark-600 hover:bg-dark-700 disabled:opacity-50"
          >
            <DownloadIcon />
            {t('admin.trafficUsage.exportCsv')}
          </button>
        </div>

        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('admin.trafficUsage.search')}
              className="w-full rounded-xl border border-dark-700 bg-dark-800 py-2 pl-10 pr-4 text-dark-100 placeholder-dark-500 focus:border-dark-600 focus:outline-none"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500">
              <SearchIcon />
            </div>
          </div>
        </form>
      </div>

      {/* Table */}
      {initialLoading && !hasData ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        </div>
      ) : !hasData && !loading ? (
        <div className="py-12 text-center text-dark-400">{t('admin.trafficUsage.noData')}</div>
      ) : (
        <div
          className={`transition-opacity duration-200 ${loading && hasData ? 'opacity-70' : 'opacity-100'}`}
        >
          <div className="overflow-x-auto rounded-xl border border-dark-700">
            <table className="text-left text-sm" style={{ width: table.getCenterTotalSize() }}>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-dark-700 bg-dark-800/80">
                    {headerGroup.headers.map((header) => {
                      const meta = header.column.columnDef.meta;
                      const isSticky = meta?.sticky;
                      const align = meta?.align === 'center' ? 'text-center' : 'text-left';
                      const isBold = meta?.bold;

                      return (
                        <th
                          key={header.id}
                          className={`relative overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2 text-xs font-medium ${
                            isBold ? 'font-semibold text-dark-200' : 'text-dark-400'
                          } ${align} ${
                            isSticky ? 'sticky left-0 z-10 bg-dark-800' : ''
                          } ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-dark-200' : ''}`}
                          style={{ width: header.getSize(), maxWidth: header.getSize() }}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <SortIcon direction={header.column.getIsSorted()} />
                          )}
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute -right-2 top-0 z-20 h-full w-5 cursor-col-resize select-none"
                            style={{ touchAction: 'none' }}
                          >
                            <div
                              className={`absolute right-2 top-0 h-full w-1 ${
                                header.column.getIsResizing()
                                  ? 'bg-accent-500'
                                  : 'bg-transparent hover:bg-dark-500'
                              }`}
                            />
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => {
                  const compositeRatio = hasAnyThreshold
                    ? getCompositeRisk(
                        row.original,
                        totalThresholdNum,
                        nodeThresholdNum,
                        periodDays,
                      ).ratio
                    : 0;
                  const rowBg = hasAnyThreshold ? getRowBgColor(compositeRatio) : undefined;

                  return (
                    <tr
                      key={row.id}
                      className="cursor-pointer border-b border-dark-700/50 transition-colors hover:bg-dark-800/50"
                      style={{ backgroundColor: rowBg }}
                      onClick={() => navigate(`/admin/users/${row.original.user_id}`)}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta;
                        const isSticky = meta?.sticky;
                        const align = meta?.align === 'center' ? 'text-center' : 'text-left';

                        return (
                          <td
                            key={cell.id}
                            className={`overflow-hidden px-3 py-2 ${align} ${
                              isSticky ? 'sticky left-0 z-10 bg-dark-900' : ''
                            }`}
                            style={{
                              width: cell.column.getSize(),
                              maxWidth: cell.column.getSize(),
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-dark-400">
            {offset + 1}
            {'\u2013'}
            {Math.min(offset + limit, total)} / {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="rounded-lg border border-dark-700 bg-dark-800 p-2 transition-colors hover:bg-dark-700 disabled:opacity-50"
            >
              <ChevronLeftIcon />
            </button>
            <span className="px-3 py-2 text-dark-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="rounded-lg border border-dark-700 bg-dark-800 p-2 transition-colors hover:bg-dark-700 disabled:opacity-50"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
