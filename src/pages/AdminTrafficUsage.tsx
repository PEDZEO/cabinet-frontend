import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useReactTable, getCoreRowModel, type RowData } from '@tanstack/react-table';
import { usePlatform } from '../platform/hooks/usePlatform';
import { ProgressBar } from './adminTrafficUsage/components/ProgressBar';
import { TrafficUsageControls } from './adminTrafficUsage/components/TrafficUsageControls';
import { TrafficUsageHeader } from './adminTrafficUsage/components/TrafficUsageHeader';
import { TrafficUsagePagination } from './adminTrafficUsage/components/TrafficUsagePagination';
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

      <TrafficUsageHeader
        title={t('admin.trafficUsage.title')}
        subtitle={t('admin.trafficUsage.subtitle')}
        showBackButton={!capabilities.hasBackButton}
        loading={loading}
        onBack={() => navigate('/admin')}
        onRefresh={handleRefresh}
      />

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

      <TrafficUsagePagination
        offset={offset}
        limit={limit}
        total={total}
        onOffsetChange={setOffset}
      />
    </div>
  );
}
