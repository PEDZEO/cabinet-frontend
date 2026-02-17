import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useReactTable, getCoreRowModel, type RowData } from '@tanstack/react-table';
import { usePlatform } from '../platform/hooks/usePlatform';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  RefreshIcon,
  SearchIcon,
  ServerSmallIcon,
  ShieldIcon,
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
