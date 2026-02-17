import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useReactTable, getCoreRowModel, type RowData } from '@tanstack/react-table';
import { usePlatform } from '../platform/hooks/usePlatform';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshIcon,
} from './adminTrafficUsage/components/Icons';
import { ProgressBar } from './adminTrafficUsage/components/ProgressBar';
import { TrafficUsageControls } from './adminTrafficUsage/components/TrafficUsageControls';
import { TrafficUsageTable } from './adminTrafficUsage/components/TrafficUsageTable';
import { useAdminTrafficUsageData } from './adminTrafficUsage/hooks/useAdminTrafficUsageData';
import { useTrafficColumns } from './adminTrafficUsage/hooks/useTrafficColumns';

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

  const columns = useTrafficColumns({
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
  });

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

      <TrafficUsageControls
        period={period}
        dateMode={dateMode}
        customStart={customStart}
        customEnd={customEnd}
        onPeriodChange={handlePeriodChange}
        onToggleDateMode={handleToggleDateMode}
        onCustomStartChange={handleCustomStartChange}
        onCustomEndChange={handleCustomEndChange}
        availableTariffs={availableTariffs}
        selectedTariffs={selectedTariffs}
        onTariffChange={handleTariffChange}
        nodes={nodes}
        selectedNodes={selectedNodes}
        onNodeChange={handleNodeChange}
        availableCountries={availableCountries}
        selectedCountries={selectedCountries}
        onCountryChange={handleCountryChange}
        availableStatuses={availableStatuses}
        selectedStatuses={selectedStatuses}
        onStatusChange={handleStatusChange}
        totalThreshold={totalThreshold}
        setTotalThreshold={setTotalThreshold}
        nodeThreshold={nodeThreshold}
        setNodeThreshold={setNodeThreshold}
        exporting={exporting}
        onExport={handleExport}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onSearch={handleSearch}
      />

      <TrafficUsageTable
        table={table}
        initialLoading={initialLoading}
        hasData={hasData}
        loading={loading}
        hasAnyThreshold={hasAnyThreshold}
        totalThresholdNum={totalThresholdNum}
        nodeThresholdNum={nodeThresholdNum}
        periodDays={periodDays}
        noDataText={t('admin.trafficUsage.noData')}
        onUserClick={(userId) => navigate(`/admin/users/${userId}`)}
      />

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
