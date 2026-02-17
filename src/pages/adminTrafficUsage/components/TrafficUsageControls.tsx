import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { TrafficNodeInfo } from '../../../api/adminTraffic';
import { CountryFilter, NodeFilter, PeriodSelector, StatusFilter, TariffFilter } from './Filters';
import { DownloadIcon, SearchIcon, ServerSmallIcon, ShieldIcon, XIcon } from './Icons';

interface CountryOption {
  code: string;
  count: number;
}

interface TrafficUsageControlsProps {
  period: number;
  dateMode: boolean;
  customStart: string;
  customEnd: string;
  onPeriodChange: (value: number) => void;
  onToggleDateMode: () => void;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  availableTariffs: string[];
  selectedTariffs: Set<string>;
  onTariffChange: (next: Set<string>) => void;
  nodes: TrafficNodeInfo[];
  selectedNodes: Set<string>;
  onNodeChange: (next: Set<string>) => void;
  availableCountries: CountryOption[];
  selectedCountries: Set<string>;
  onCountryChange: (next: Set<string>) => void;
  availableStatuses: string[];
  selectedStatuses: Set<string>;
  onStatusChange: (next: Set<string>) => void;
  totalThreshold: string;
  setTotalThreshold: (value: string) => void;
  nodeThreshold: string;
  setNodeThreshold: (value: string) => void;
  exporting: boolean;
  onExport: () => void;
  searchInput: string;
  setSearchInput: (value: string) => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
}

export function TrafficUsageControls({
  period,
  dateMode,
  customStart,
  customEnd,
  onPeriodChange,
  onToggleDateMode,
  onCustomStartChange,
  onCustomEndChange,
  availableTariffs,
  selectedTariffs,
  onTariffChange,
  nodes,
  selectedNodes,
  onNodeChange,
  availableCountries,
  selectedCountries,
  onCountryChange,
  availableStatuses,
  selectedStatuses,
  onStatusChange,
  totalThreshold,
  setTotalThreshold,
  nodeThreshold,
  setNodeThreshold,
  exporting,
  onExport,
  searchInput,
  setSearchInput,
  onSearch,
}: TrafficUsageControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <PeriodSelector
          value={period}
          onChange={onPeriodChange}
          label={t('admin.trafficUsage.period')}
          dateMode={dateMode}
          customStart={customStart}
          customEnd={customEnd}
          onToggleDateMode={onToggleDateMode}
          onCustomStartChange={onCustomStartChange}
          onCustomEndChange={onCustomEndChange}
        />
        <TariffFilter
          available={availableTariffs}
          selected={selectedTariffs}
          onChange={onTariffChange}
        />
        <NodeFilter available={nodes} selected={selectedNodes} onChange={onNodeChange} />
        <CountryFilter
          available={availableCountries}
          selected={selectedCountries}
          onChange={onCountryChange}
        />
        <StatusFilter
          available={availableStatuses}
          selected={selectedStatuses}
          onChange={onStatusChange}
        />

        <div className="flex items-center gap-1.5 rounded-lg border border-dark-700 bg-dark-800 px-2 py-1">
          <ShieldIcon />
          <input
            type="number"
            value={totalThreshold}
            onChange={(event) => setTotalThreshold(event.target.value)}
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
            onChange={(event) => setNodeThreshold(event.target.value)}
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
          onClick={onExport}
          disabled={exporting}
          className="flex items-center gap-1.5 rounded-lg border border-dark-700 bg-dark-800 px-3 py-1.5 text-xs font-medium text-dark-200 transition-colors hover:border-dark-600 hover:bg-dark-700 disabled:opacity-50"
        >
          <DownloadIcon />
          {t('admin.trafficUsage.exportCsv')}
        </button>
      </div>

      <form onSubmit={onSearch}>
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('admin.trafficUsage.search')}
            className="w-full rounded-xl border border-dark-700 bg-dark-800 py-2 pl-10 pr-4 text-dark-100 placeholder-dark-500 focus:border-dark-600 focus:outline-none"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500">
            <SearchIcon />
          </div>
        </div>
      </form>
    </div>
  );
}
