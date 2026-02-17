import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowData,
} from '@tanstack/react-table';
import {
  adminTrafficApi,
  type UserTrafficItem,
  type TrafficNodeInfo,
  type TrafficUsageResponse,
  type TrafficParams,
  type TrafficEnrichmentData,
} from '../api/adminTraffic';
import { usePlatform } from '../platform/hooks/usePlatform';
import { PERIODS, STATUS_COLORS } from './adminTrafficUsage/constants';
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FilterIcon,
  GlobeIcon,
  RefreshIcon,
  SearchIcon,
  ServerIcon,
  ServerSmallIcon,
  ShieldIcon,
  SortIcon,
  StatusIcon,
  XIcon,
} from './adminTrafficUsage/components/Icons';
import {
  formatBytes,
  formatCurrency,
  formatGbPerDay,
  formatShortDate,
  getFlagEmoji,
  toBackendSortField,
} from './adminTrafficUsage/utils/formatters';
import {
  RISK_STYLES,
  bytesToGbPerDay,
  getCompositeRisk,
  getNodeTextColor,
  getRatio,
  getRiskLevel,
  getRowBgColor,
  type RiskLevel,
} from './adminTrafficUsage/utils/risk';

// ============ TanStack Table module augmentation ============

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    sticky?: boolean;
    align?: 'left' | 'center';
    bold?: boolean;
  }
}

// ============ Progress Bar ============

function ProgressBar({ loading }: { loading: boolean }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (loading) {
      setProgress(0);
      setVisible(true);
      // Fast initial progress, then slow down
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 30) return prev + 8;
          if (prev < 60) return prev + 3;
          if (prev < 85) return prev + 1;
          if (prev < 95) return prev + 0.3;
          return prev;
        });
      }, 100);
    } else {
      if (visible) {
        setProgress(100);
        clearInterval(intervalRef.current);
        const timer = setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [loading, visible]);

  if (!visible) return null;

  return (
    <div className="absolute left-0 right-0 top-0 z-50 h-0.5 overflow-hidden rounded-full bg-dark-700/50">
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400 transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ============ Components ============

function PeriodSelector({
  value,
  onChange,
  label,
  dateMode,
  customStart,
  customEnd,
  onToggleDateMode,
  onCustomStartChange,
  onCustomEndChange,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  dateMode: boolean;
  customStart: string;
  customEnd: string;
  onToggleDateMode: () => void;
  onCustomStartChange: (v: string) => void;
  onCustomEndChange: (v: string) => void;
}) {
  const { t } = useTranslation();

  // Limit: last 31 days
  const today = new Date().toISOString().split('T')[0];
  const minDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  if (dateMode) {
    return (
      <div className="flex items-center gap-2">
        <CalendarIcon />
        <span className="text-xs text-dark-400">{t('admin.trafficUsage.dateFrom')}</span>
        <input
          type="date"
          value={customStart}
          min={minDate}
          max={customEnd || today}
          onChange={(e) => onCustomStartChange(e.target.value)}
          className="rounded-lg border border-dark-700 bg-dark-800 px-2 py-1 text-xs text-dark-200 focus:border-dark-600 focus:outline-none"
        />
        <span className="text-xs text-dark-400">{t('admin.trafficUsage.dateTo')}</span>
        <input
          type="date"
          value={customEnd}
          min={customStart || minDate}
          max={today}
          onChange={(e) => onCustomEndChange(e.target.value)}
          className="rounded-lg border border-dark-700 bg-dark-800 px-2 py-1 text-xs text-dark-200 focus:border-dark-600 focus:outline-none"
        />
        <button
          onClick={onToggleDateMode}
          className="rounded-lg p-1 text-dark-400 transition-colors hover:bg-dark-700 hover:text-dark-200"
          title={t('admin.trafficUsage.period')}
        >
          <XIcon />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-dark-400">{label}</span>
      <div className="flex gap-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              value === p
                ? 'bg-accent-500 text-white'
                : 'bg-dark-800 text-dark-400 hover:bg-dark-700 hover:text-dark-200'
            }`}
          >
            {p}
            {t('admin.trafficUsage.days')}
          </button>
        ))}
      </div>
      <button
        onClick={onToggleDateMode}
        className="rounded-lg border border-dark-700 bg-dark-800 p-1.5 text-dark-400 transition-colors hover:border-dark-600 hover:bg-dark-700 hover:text-dark-200"
        title={t('admin.trafficUsage.customDates')}
      >
        <CalendarIcon />
      </button>
    </div>
  );
}

function TariffFilter({
  available,
  selected,
  onChange,
}: {
  available: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (available.length === 0) return null;

  const allSelected = selected.size === 0;
  const activeCount = selected.size;

  const toggle = (tariff: string) => {
    const next = new Set(selected);
    if (next.has(tariff)) {
      next.delete(tariff);
    } else {
      next.add(tariff);
    }
    onChange(next);
  };

  const selectAll = () => onChange(new Set());

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          activeCount > 0
            ? 'border-accent-500/50 bg-accent-500/10 text-accent-400'
            : 'border-dark-700 bg-dark-800 text-dark-200 hover:border-dark-600 hover:bg-dark-700'
        }`}
      >
        <FilterIcon />
        {t('admin.trafficUsage.tariff')}
        {activeCount > 0 && (
          <span className="rounded-full bg-accent-500 px-1.5 text-[10px] text-white">
            {activeCount}
          </span>
        )}
        <ChevronDownIcon />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-dark-700 bg-dark-800 py-1 shadow-xl">
          <button
            onClick={selectAll}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-dark-700 ${
              allSelected ? 'text-accent-400' : 'text-dark-300'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                allSelected ? 'border-accent-500 bg-accent-500' : 'border-dark-600'
              }`}
            >
              {allSelected && (
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </span>
            {t('admin.trafficUsage.allTariffs')}
          </button>

          <div className="mx-2 border-t border-dark-700" />

          <div className="max-h-48 overflow-y-auto">
            {available.map((tariff) => {
              const checked = selected.has(tariff);
              return (
                <button
                  key={tariff}
                  onClick={() => toggle(tariff)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-dark-300 transition-colors hover:bg-dark-700"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked ? 'border-accent-500 bg-accent-500' : 'border-dark-600'
                    }`}
                  >
                    {checked && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </span>
                  {tariff}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusFilter({
  available,
  selected,
  onChange,
}: {
  available: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (available.length === 0) return null;

  const allSelected = selected.size === 0;
  const activeCount = selected.size;

  const toggle = (status: string) => {
    const next = new Set(selected);
    if (next.has(status)) {
      next.delete(status);
    } else {
      next.add(status);
    }
    onChange(next);
  };

  const selectAll = () => onChange(new Set());

  const statusLabel = (s: string) => {
    const key = `admin.trafficUsage.status${s.charAt(0).toUpperCase() + s.slice(1)}`;
    return t(key, s);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          activeCount > 0
            ? 'border-accent-500/50 bg-accent-500/10 text-accent-400'
            : 'border-dark-700 bg-dark-800 text-dark-200 hover:border-dark-600 hover:bg-dark-700'
        }`}
      >
        <StatusIcon />
        {t('admin.trafficUsage.status')}
        {activeCount > 0 && (
          <span className="rounded-full bg-accent-500 px-1.5 text-[10px] text-white">
            {activeCount}
          </span>
        )}
        <ChevronDownIcon />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-dark-700 bg-dark-800 py-1 shadow-xl">
          <button
            onClick={selectAll}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-dark-700 ${
              allSelected ? 'text-accent-400' : 'text-dark-300'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                allSelected ? 'border-accent-500 bg-accent-500' : 'border-dark-600'
              }`}
            >
              {allSelected && (
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </span>
            {t('admin.trafficUsage.allStatuses')}
          </button>

          <div className="mx-2 border-t border-dark-700" />

          <div className="max-h-48 overflow-y-auto">
            {available.map((s) => {
              const checked = selected.has(s);
              return (
                <button
                  key={s}
                  onClick={() => toggle(s)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-dark-300 transition-colors hover:bg-dark-700"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked ? 'border-accent-500 bg-accent-500' : 'border-dark-600'
                    }`}
                  >
                    {checked && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </span>
                  <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[s] || 'bg-dark-500'}`} />
                  {statusLabel(s)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NodeFilter({
  available,
  selected,
  onChange,
}: {
  available: TrafficNodeInfo[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (available.length === 0) return null;

  const allSelected = selected.size === 0;
  const activeCount = selected.size;

  const toggle = (uuid: string) => {
    const next = new Set(selected);
    if (next.has(uuid)) {
      next.delete(uuid);
    } else {
      next.add(uuid);
    }
    onChange(next);
  };

  const selectAll = () => onChange(new Set());

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          activeCount > 0
            ? 'border-accent-500/50 bg-accent-500/10 text-accent-400'
            : 'border-dark-700 bg-dark-800 text-dark-200 hover:border-dark-600 hover:bg-dark-700'
        }`}
      >
        <ServerIcon />
        {t('admin.trafficUsage.nodes')}
        {activeCount > 0 && (
          <span className="rounded-full bg-accent-500 px-1.5 text-[10px] text-white">
            {activeCount}
          </span>
        )}
        <ChevronDownIcon />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-xl border border-dark-700 bg-dark-800 py-1 shadow-xl">
          <button
            onClick={selectAll}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-dark-700 ${
              allSelected ? 'text-accent-400' : 'text-dark-300'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                allSelected ? 'border-accent-500 bg-accent-500' : 'border-dark-600'
              }`}
            >
              {allSelected && (
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </span>
            {t('admin.trafficUsage.allNodes')}
          </button>

          <div className="mx-2 border-t border-dark-700" />

          <div className="max-h-48 overflow-y-auto">
            {available.map((node) => {
              const checked = selected.has(node.node_uuid);
              return (
                <button
                  key={node.node_uuid}
                  onClick={() => toggle(node.node_uuid)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-dark-300 transition-colors hover:bg-dark-700"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked ? 'border-accent-500 bg-accent-500' : 'border-dark-600'
                    }`}
                  >
                    {checked && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </span>
                  {getFlagEmoji(node.country_code)} {node.node_name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CountryFilter({
  available,
  selected,
  onChange,
}: {
  available: { code: string; count: number }[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (available.length === 0) return null;

  const allSelected = selected.size === 0;
  const activeCount = selected.size;

  const toggle = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    onChange(next);
  };

  const selectAll = () => onChange(new Set());

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          activeCount > 0
            ? 'border-accent-500/50 bg-accent-500/10 text-accent-400'
            : 'border-dark-700 bg-dark-800 text-dark-200 hover:border-dark-600 hover:bg-dark-700'
        }`}
      >
        <GlobeIcon />
        {activeCount > 0 && (
          <span className="rounded-full bg-accent-500 px-1.5 text-[10px] text-white">
            {activeCount}
          </span>
        )}
        <ChevronDownIcon />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-dark-700 bg-dark-800 py-1 shadow-xl sm:left-0 sm:right-auto">
          <button
            onClick={selectAll}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-dark-700 ${
              allSelected ? 'text-accent-400' : 'text-dark-300'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                allSelected ? 'border-accent-500 bg-accent-500' : 'border-dark-600'
              }`}
            >
              {allSelected && (
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </span>
            All
          </button>

          <div className="mx-2 border-t border-dark-700" />

          <div className="max-h-48 overflow-y-auto">
            {available.map(({ code, count }) => {
              const checked = selected.has(code);
              return (
                <button
                  key={code}
                  onClick={() => toggle(code)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-dark-300 transition-colors hover:bg-dark-700"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked ? 'border-accent-500 bg-accent-500' : 'border-dark-600'
                    }`}
                  >
                    {checked && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </span>
                  {getFlagEmoji(code)} {code.toUpperCase()}
                  <span className="ml-auto text-dark-500">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Risk Badge ============

function RiskBadge({
  level,
  ratio,
  gbPerDay,
}: {
  level: RiskLevel;
  ratio: number;
  gbPerDay: number;
}) {
  const style = RISK_STYLES[level];
  const barWidth = Math.min(ratio * 100, 100);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`} />
        <span className={`text-[11px] font-semibold tabular-nums ${style.text}`}>
          {formatGbPerDay(gbPerDay)}
        </span>
        <span className={`text-[10px] ${style.text} opacity-60`}>GB/d</span>
      </div>
      {/* Mini progress bar showing ratio to threshold */}
      <div className={`h-1 w-full max-w-[60px] rounded-full ${style.bg}`}>
        <div
          className={`h-full rounded-full ${style.bar} transition-all`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

// ============ Main Page ============

export default function AdminTrafficUsage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { capabilities } = usePlatform();

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
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>({});
  const [totalThreshold, setTotalThreshold] = useState('');
  const [nodeThreshold, setNodeThreshold] = useState('');
  const [periodDays, setPeriodDays] = useState(30);

  const limit = 50;
  const hasData = items.length > 0 || nodes.length > 0;

  const sortBy = sorting[0] ? toBackendSortField(sorting[0].id) : 'total_bytes';
  const sortDesc = sorting[0]?.desc ?? true;
  const tariffsParam = selectedTariffs.size > 0 ? [...selectedTariffs].join(',') : undefined;
  const statusesParam = selectedStatuses.size > 0 ? [...selectedStatuses].join(',') : undefined;

  // Merge country filter into node UUIDs so backend filters data consistently
  const mergedNodesParam = useMemo(() => {
    const countryUuids =
      selectedCountries.size > 0
        ? new Set(
            nodes.filter((n) => selectedCountries.has(n.country_code)).map((n) => n.node_uuid),
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

      // Check cache first — apply instantly without any loading state
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
        // silently fail — keep stale data visible
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [buildParams, applyData],
  );

  // Load on param change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load enrichment after main data arrives
  useEffect(() => {
    if (initialLoading || items.length === 0) return;
    let cancelled = false;
    const load = async () => {
      setEnrichmentLoading(true);
      try {
        const res = await adminTrafficApi.getEnrichment();
        if (!cancelled) setEnrichment(res.data);
      } catch {
        // silently fail — enrichment is optional
      } finally {
        if (!cancelled) setEnrichmentLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [initialLoading, items.length]);

  // Prefetch adjacent periods in background (only in period mode)
  useEffect(() => {
    if (dateMode) return;
    const prefetchPeriods = PERIODS.filter((p) => p !== period);
    const timer = setTimeout(() => {
      prefetchPeriods.forEach((p) => {
        const params: TrafficParams = {
          period: p,
          limit,
          offset: 0,
          sort_by: 'total_bytes',
          sort_desc: true,
        };
        if (!adminTrafficApi.getCached(params)) {
          adminTrafficApi.getTrafficUsage(params).catch(() => {});
        }
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [period, dateMode]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setCommittedSearch(searchInput);
  };

  const handleExport = async () => {
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
  };

  const handlePeriodChange = (p: number) => {
    setPeriod(p);
    setOffset(0);
  };

  const handleToggleDateMode = () => {
    if (dateMode) {
      // Switch back to period mode
      setDateMode(false);
      setCustomStart('');
      setCustomEnd('');
      setOffset(0);
    } else {
      // Switch to date mode — pre-fill with last N days
      const end = new Date();
      const start = new Date(end.getTime() - period * 24 * 60 * 60 * 1000);
      setCustomStart(start.toISOString().split('T')[0]);
      setCustomEnd(end.toISOString().split('T')[0]);
      setDateMode(true);
      setOffset(0);
    }
  };

  const handleCustomStartChange = (v: string) => {
    setCustomStart(v);
    setOffset(0);
  };

  const handleCustomEndChange = (v: string) => {
    setCustomEnd(v);
    setOffset(0);
  };

  const handleSortingChange = (updater: SortingState | ((old: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    setSorting(next);
    setOffset(0);
  };

  const handleTariffChange = (next: Set<string>) => {
    setSelectedTariffs(next);
    setOffset(0);
  };

  const handleStatusChange = (next: Set<string>) => {
    setSelectedStatuses(next);
    setOffset(0);
  };

  const handleNodeChange = (next: Set<string>) => {
    setSelectedNodes(next);
    setOffset(0);
  };

  const handleCountryChange = (next: Set<string>) => {
    setSelectedCountries(next);
    setOffset(0);
  };

  const handleRefresh = () => {
    loadData(true);
    setEnrichment(null);
    setEnrichmentLoading(true);
    adminTrafficApi
      .getEnrichment({ skipCache: true })
      .then((res) => setEnrichment(res.data))
      .catch(() => {})
      .finally(() => setEnrichmentLoading(false));
  };

  const availableCountries = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of nodes) {
      if (n.country_code) map.set(n.country_code, (map.get(n.country_code) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, count]) => ({ code, count }));
  }, [nodes]);

  // When country/node filter is active, show only matching node columns
  const displayNodes = useMemo(() => {
    let filtered = nodes;
    if (selectedCountries.size > 0) {
      filtered = filtered.filter((n) => selectedCountries.has(n.country_code));
    }
    if (selectedNodes.size > 0) {
      filtered = filtered.filter((n) => selectedNodes.has(n.node_uuid));
    }
    return filtered;
  }, [nodes, selectedCountries, selectedNodes]);

  const totalThresholdNum = Math.max(0, parseFloat(totalThreshold) || 0);
  const hasTotalThreshold = totalThresholdNum > 0;
  const nodeThresholdNum = Math.max(0, parseFloat(nodeThreshold) || 0);
  const hasNodeThreshold = nodeThresholdNum > 0;
  const hasAnyThreshold = hasTotalThreshold || hasNodeThreshold;

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
