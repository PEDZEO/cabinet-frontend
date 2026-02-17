import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { type RowData } from '@tanstack/react-table';
import { usePlatform } from '../platform/hooks/usePlatform';
import { ProgressBar } from './adminTrafficUsage/components/ProgressBar';
import { TrafficUsageControls } from './adminTrafficUsage/components/TrafficUsageControls';
import { TrafficUsageHeader } from './adminTrafficUsage/components/TrafficUsageHeader';
import { TrafficUsagePagination } from './adminTrafficUsage/components/TrafficUsagePagination';
import { TrafficUsageTable } from './adminTrafficUsage/components/TrafficUsageTable';
import { TrafficUsageToast } from './adminTrafficUsage/components/TrafficUsageToast';
import { useAdminTrafficUsageData } from './adminTrafficUsage/hooks/useAdminTrafficUsageData';
import { useTrafficColumns } from './adminTrafficUsage/hooks/useTrafficColumns';
import { useTrafficTable } from './adminTrafficUsage/hooks/useTrafficTable';

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

  const { table } = useTrafficTable({
    items,
    columns,
    sorting,
    onSortingChange: handleSortingChange,
  });

  return (
    <div className="relative animate-fade-in">
      {/* Progress bar — shown during background refresh */}
      <ProgressBar loading={loading} />

      <TrafficUsageToast toast={toast} />

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
