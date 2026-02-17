import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TrafficNodeInfo } from '../../../api/adminTraffic';
import { PERIODS, STATUS_COLORS } from '../constants';
import {
  CalendarIcon,
  ChevronDownIcon,
  FilterIcon,
  GlobeIcon,
  ServerIcon,
  StatusIcon,
  XIcon,
} from './Icons';
import { getFlagEmoji } from '../utils/formatters';

interface PeriodSelectorProps {
  value: number;
  onChange: (v: number) => void;
  label: string;
  dateMode: boolean;
  customStart: string;
  customEnd: string;
  onToggleDateMode: () => void;
  onCustomStartChange: (v: string) => void;
  onCustomEndChange: (v: string) => void;
}

export function PeriodSelector({
  value,
  onChange,
  label,
  dateMode,
  customStart,
  customEnd,
  onToggleDateMode,
  onCustomStartChange,
  onCustomEndChange,
}: PeriodSelectorProps) {
  const { t } = useTranslation();

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
          onChange={(event) => onCustomStartChange(event.target.value)}
          className="rounded-lg border border-dark-700 bg-dark-800 px-2 py-1 text-xs text-dark-200 focus:border-dark-600 focus:outline-none"
        />
        <span className="text-xs text-dark-400">{t('admin.trafficUsage.dateTo')}</span>
        <input
          type="date"
          value={customEnd}
          min={customStart || minDate}
          max={today}
          onChange={(event) => onCustomEndChange(event.target.value)}
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
        {PERIODS.map((period) => (
          <button
            key={period}
            onClick={() => onChange(period)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              value === period
                ? 'bg-accent-500 text-white'
                : 'bg-dark-800 text-dark-400 hover:bg-dark-700 hover:text-dark-200'
            }`}
          >
            {period}
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

interface BaseFilterProps {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

export function TariffFilter({
  available,
  selected,
  onChange,
}: BaseFilterProps & { available: string[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (available.length === 0) return null;

  const allSelected = selected.size === 0;
  const activeCount = selected.size;

  const toggle = (tariff: string) => {
    const next = new Set(selected);
    if (next.has(tariff)) next.delete(tariff);
    else next.add(tariff);
    onChange(next);
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
            onClick={() => onChange(new Set())}
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

export function StatusFilter({
  available,
  selected,
  onChange,
}: BaseFilterProps & { available: string[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (available.length === 0) return null;

  const allSelected = selected.size === 0;
  const activeCount = selected.size;

  const toggle = (status: string) => {
    const next = new Set(selected);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    onChange(next);
  };

  const statusLabel = (status: string) => {
    const key = `admin.trafficUsage.status${status.charAt(0).toUpperCase() + status.slice(1)}`;
    return t(key, status);
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
            onClick={() => onChange(new Set())}
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
            {available.map((status) => {
              const checked = selected.has(status);
              return (
                <button
                  key={status}
                  onClick={() => toggle(status)}
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
                  <span
                    className={`h-2 w-2 rounded-full ${STATUS_COLORS[status] || 'bg-dark-500'}`}
                  />
                  {statusLabel(status)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function NodeFilter({
  available,
  selected,
  onChange,
}: BaseFilterProps & { available: TrafficNodeInfo[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (available.length === 0) return null;

  const allSelected = selected.size === 0;
  const activeCount = selected.size;

  const toggle = (uuid: string) => {
    const next = new Set(selected);
    if (next.has(uuid)) next.delete(uuid);
    else next.add(uuid);
    onChange(next);
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
            onClick={() => onChange(new Set())}
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

export function CountryFilter({
  available,
  selected,
  onChange,
}: BaseFilterProps & { available: { code: string; count: number }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (available.length === 0) return null;

  const allSelected = selected.size === 0;
  const activeCount = selected.size;

  const toggle = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(next);
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
            onClick={() => onChange(new Set())}
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
