import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminMenuLayoutApi } from '../../api/adminMenuLayout';

const PERIOD_OPTIONS = [7, 30, 90] as const;
type StatsViewMode = 'classic' | 'charts';

function formatDateTime(value: string | null): string {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString();
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const asNumber = Number(value);
    return Number.isFinite(asNumber) ? asNumber : null;
  }
  return null;
}

type ChartDatum = {
  label: string;
  value: number;
};

function buildDaySparklinePath(points: ChartDatum[], width: number, height: number): string {
  if (points.length === 0) {
    return '';
  }
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  return points
    .map((point, index) => {
      const x = index * stepX;
      const y = height - (point.value / maxValue) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

export function MainMenuButtonsStatsTab() {
  const { t } = useTranslation();
  const [days, setDays] = useState<number>(30);
  const [viewMode, setViewMode] = useState<StatsViewMode>('classic');
  const [selectedButtonId, setSelectedButtonId] = useState<string>('');
  const [topUsersLimit, setTopUsersLimit] = useState<number>(10);
  const [compareCurrentDays, setCompareCurrentDays] = useState<number>(7);
  const [comparePreviousDays, setComparePreviousDays] = useState<number>(7);
  const [sequenceUserIdInput, setSequenceUserIdInput] = useState<string>('');
  const [sequenceUserId, setSequenceUserId] = useState<number | null>(null);

  const overviewQuery = useQuery({
    queryKey: ['admin', 'menu-layout', 'stats', 'overview', days],
    queryFn: () => adminMenuLayoutApi.getStats(days),
  });

  const byTypeQuery = useQuery({
    queryKey: ['admin', 'menu-layout', 'stats', 'by-type', days],
    queryFn: () => adminMenuLayoutApi.getStatsByType(days),
  });

  const byHourQuery = useQuery({
    queryKey: ['admin', 'menu-layout', 'stats', 'by-hour', days, selectedButtonId || 'all'],
    queryFn: () => adminMenuLayoutApi.getStatsByHour(days, selectedButtonId || undefined),
  });

  const byWeekdayQuery = useQuery({
    queryKey: ['admin', 'menu-layout', 'stats', 'by-weekday', days, selectedButtonId || 'all'],
    queryFn: () => adminMenuLayoutApi.getStatsByWeekday(days, selectedButtonId || undefined),
  });

  const buttonQuery = useQuery({
    queryKey: ['admin', 'menu-layout', 'stats', 'button', selectedButtonId, days],
    queryFn: () => adminMenuLayoutApi.getButtonStats(selectedButtonId, days),
    enabled: Boolean(selectedButtonId),
  });

  const topUsersQuery = useQuery({
    queryKey: [
      'admin',
      'menu-layout',
      'stats',
      'top-users',
      days,
      topUsersLimit,
      selectedButtonId || 'all',
    ],
    queryFn: () =>
      adminMenuLayoutApi.getTopUsers(days, topUsersLimit, selectedButtonId || undefined),
  });

  const compareQuery = useQuery({
    queryKey: [
      'admin',
      'menu-layout',
      'stats',
      'compare',
      compareCurrentDays,
      comparePreviousDays,
      selectedButtonId || 'all',
    ],
    queryFn: () =>
      adminMenuLayoutApi.getPeriodComparison(
        compareCurrentDays,
        comparePreviousDays,
        selectedButtonId || undefined,
      ),
  });

  const sequencesQuery = useQuery({
    queryKey: ['admin', 'menu-layout', 'stats', 'user-sequences', sequenceUserId],
    queryFn: () => adminMenuLayoutApi.getUserSequences(sequenceUserId ?? 0, 50),
    enabled: sequenceUserId !== null,
  });

  const maxHourCount = useMemo(() => {
    const values = byHourQuery.data?.items ?? [];
    return values.reduce((acc, item) => Math.max(acc, item.count), 0) || 1;
  }, [byHourQuery.data]);

  const maxWeekdayCount = useMemo(() => {
    const values = byWeekdayQuery.data?.items ?? [];
    return values.reduce((acc, item) => Math.max(acc, item.count), 0) || 1;
  }, [byWeekdayQuery.data]);
  const topButtonChartData = useMemo<ChartDatum[]>(
    () =>
      (overviewQuery.data?.items ?? [])
        .slice()
        .sort((a, b) => b.clicks_total - a.clicks_total)
        .slice(0, 10)
        .map((item) => ({ label: item.button_id, value: item.clicks_total })),
    [overviewQuery.data?.items],
  );
  const topTypeChartData = useMemo<ChartDatum[]>(
    () =>
      (byTypeQuery.data?.items ?? []).map((item) => ({
        label: item.button_type,
        value: item.clicks_total,
      })),
    [byTypeQuery.data?.items],
  );
  const byHourChartData = useMemo<ChartDatum[]>(
    () =>
      (byHourQuery.data?.items ?? []).map((item) => ({
        label: String(item.hour).padStart(2, '0'),
        value: item.count,
      })),
    [byHourQuery.data?.items],
  );
  const byWeekdayChartData = useMemo<ChartDatum[]>(
    () =>
      (byWeekdayQuery.data?.items ?? []).map((item) => ({
        label: item.weekday_name,
        value: item.count,
      })),
    [byWeekdayQuery.data?.items],
  );

  const compareCurrentClicks = normalizeNumber(compareQuery.data?.current_period?.clicks_total);
  const comparePreviousClicks = normalizeNumber(compareQuery.data?.previous_period?.clicks_total);
  const compareChangePercent = normalizeNumber(compareQuery.data?.change?.percentage);
  const compareTrendRaw = compareQuery.data?.change?.trend;
  const compareTrend = typeof compareTrendRaw === 'string' ? compareTrendRaw : null;

  const globalError =
    overviewQuery.error || byTypeQuery.error || byHourQuery.error || byWeekdayQuery.error;

  if (overviewQuery.isLoading || byTypeQuery.isLoading) {
    return (
      <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4 text-sm text-dark-300">
        {t('common.loading')}
      </div>
    );
  }

  if (
    globalError ||
    !overviewQuery.data ||
    !byTypeQuery.data ||
    !byHourQuery.data ||
    !byWeekdayQuery.data
  ) {
    return (
      <div className="rounded-xl border border-error-500/30 bg-error-500/10 p-4 text-sm text-error-300">
        {t('common.error')}
      </div>
    );
  }

  const overview = overviewQuery.data;
  const byType = byTypeQuery.data;
  const byHour = byHourQuery.data;
  const byWeekday = byWeekdayQuery.data;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-dark-300">{t('admin.mainMenuButtons.stats.period')}</div>
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDays(option)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  days === option
                    ? 'bg-accent-500/15 text-accent-300'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}
              >
                {option} {t('admin.mainMenuButtons.stats.days')}
              </button>
            ))}
          </div>

          <select
            value={selectedButtonId}
            onChange={(e) => setSelectedButtonId(e.target.value)}
            className="ml-auto rounded-md border border-dark-700 bg-dark-800 px-3 py-1.5 text-sm text-dark-100"
            aria-label={t('admin.mainMenuButtons.stats.selectButton')}
          >
            <option value="">{t('admin.mainMenuButtons.stats.allButtons')}</option>
            {overview.items.map((item) => (
              <option key={item.button_id} value={item.button_id}>
                {item.button_id}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 rounded-md border border-dark-700 bg-dark-800/70 p-1">
            <button
              type="button"
              onClick={() => setViewMode('classic')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'classic'
                  ? 'bg-accent-500/20 text-accent-300'
                  : 'text-dark-300 hover:bg-dark-700'
              }`}
            >
              {t('admin.mainMenuButtons.stats.viewModeClassic', { defaultValue: 'Таблицы' })}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('charts')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'charts'
                  ? 'bg-accent-500/20 text-accent-300'
                  : 'text-dark-300 hover:bg-dark-700'
              }`}
            >
              {t('admin.mainMenuButtons.stats.viewModeCharts', { defaultValue: 'Графики' })}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4">
          <div className="text-xs text-dark-500">
            {t('admin.mainMenuButtons.stats.totalClicks')}
          </div>
          <div className="mt-1 text-2xl font-semibold text-dark-100">{overview.total_clicks}</div>
        </div>
        <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4">
          <div className="text-xs text-dark-500">
            {t('admin.mainMenuButtons.stats.buttonsTracked')}
          </div>
          <div className="mt-1 text-2xl font-semibold text-dark-100">{overview.items.length}</div>
        </div>
        <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4">
          <div className="text-xs text-dark-500">
            {t('admin.mainMenuButtons.stats.periodRange')}
          </div>
          <div className="mt-1 text-sm text-dark-200">
            {formatDate(overview.period_start)} - {formatDate(overview.period_end)}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4">
        <div className="mb-2 text-sm font-semibold text-dark-100">
          {t('admin.mainMenuButtons.stats.byButton')}
        </div>
        {viewMode === 'classic' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700/60 text-dark-400">
                  <th className="px-2 py-2 text-left font-medium">
                    {t('admin.mainMenuButtons.stats.buttonId')}
                  </th>
                  <th className="px-2 py-2 text-right font-medium">
                    {t('admin.mainMenuButtons.stats.total')}
                  </th>
                  <th className="px-2 py-2 text-right font-medium">
                    {t('admin.mainMenuButtons.stats.today')}
                  </th>
                  <th className="px-2 py-2 text-right font-medium">
                    {t('admin.mainMenuButtons.stats.week')}
                  </th>
                  <th className="px-2 py-2 text-right font-medium">
                    {t('admin.mainMenuButtons.stats.month')}
                  </th>
                  <th className="px-2 py-2 text-right font-medium">
                    {t('admin.mainMenuButtons.stats.uniqueUsers')}
                  </th>
                  <th className="px-2 py-2 text-right font-medium">
                    {t('admin.mainMenuButtons.stats.lastClick')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {overview.items.map((item) => (
                  <tr key={item.button_id} className="border-b border-dark-700/40">
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedButtonId((prev) =>
                            prev === item.button_id ? '' : item.button_id,
                          )
                        }
                        className="text-left text-accent-300 hover:text-accent-200"
                      >
                        {item.button_id}
                      </button>
                    </td>
                    <td className="px-2 py-2 text-right text-dark-100">{item.clicks_total}</td>
                    <td className="px-2 py-2 text-right text-dark-200">{item.clicks_today}</td>
                    <td className="px-2 py-2 text-right text-dark-200">{item.clicks_week}</td>
                    <td className="px-2 py-2 text-right text-dark-200">{item.clicks_month}</td>
                    <td className="px-2 py-2 text-right text-dark-200">{item.unique_users}</td>
                    <td className="px-2 py-2 text-right text-dark-400">
                      {formatDateTime(item.last_click_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-2">
            {topButtonChartData.map((item) => {
              const maxValue = Math.max(topButtonChartData[0]?.value ?? 1, 1);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() =>
                    setSelectedButtonId((prev) => (prev === item.label ? '' : item.label))
                  }
                  className="w-full rounded-md border border-dark-700/60 bg-dark-800/50 p-2 text-left transition-colors hover:border-accent-500/40"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-dark-200">{item.label}</span>
                    <span className="text-xs font-semibold text-dark-100">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-dark-700/70">
                    <div
                      className="h-2 rounded-full bg-accent-500"
                      style={{ width: `${(item.value / maxValue) * 100}%` }}
                    />
                  </div>
                </button>
              );
            })}
            {topButtonChartData.length === 0 && (
              <div className="text-sm text-dark-500">{t('admin.mainMenuButtons.stats.noData')}</div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4">
          <div className="mb-2 text-sm font-semibold text-dark-100">
            {t('admin.mainMenuButtons.stats.byType')}
          </div>
          {viewMode === 'classic' ? (
            <div className="space-y-2">
              {byType.items.map((item) => (
                <div
                  key={item.button_type}
                  className="flex items-center justify-between rounded-md border border-dark-700/60 bg-dark-800/50 px-3 py-2"
                >
                  <span className="text-sm text-dark-200">{item.button_type}</span>
                  <span className="text-sm text-dark-100">
                    {item.clicks_total} / {item.unique_users}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {topTypeChartData.map((item) => {
                const maxValue = Math.max(...topTypeChartData.map((entry) => entry.value), 1);
                return (
                  <div
                    key={item.label}
                    className="rounded-md border border-dark-700/60 bg-dark-800/50 p-2"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-sm text-dark-200">{item.label}</span>
                      <span className="text-xs font-semibold text-dark-100">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-dark-700/70">
                      <div
                        className="h-2 rounded-full bg-success-500"
                        style={{ width: `${(item.value / maxValue) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {topTypeChartData.length === 0 && (
                <div className="text-sm text-dark-500">
                  {t('admin.mainMenuButtons.stats.noData')}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4">
          <div className="mb-2 text-sm font-semibold text-dark-100">
            {t('admin.mainMenuButtons.stats.byHour')}
          </div>
          {viewMode === 'classic' ? (
            <div className="space-y-1.5">
              {byHour.items.map((item) => (
                <div key={item.hour} className="flex items-center gap-2">
                  <span className="w-8 text-xs text-dark-400">
                    {String(item.hour).padStart(2, '0')}
                  </span>
                  <div className="h-2 flex-1 rounded-full bg-dark-700/60">
                    <div
                      className="h-2 rounded-full bg-accent-500"
                      style={{ width: `${(item.count / maxHourCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-dark-300">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex h-28 items-end gap-1 rounded-md border border-dark-700/60 bg-dark-800/50 p-2">
                {byHourChartData.map((item) => (
                  <div
                    key={item.label}
                    className="group flex min-w-0 flex-1 items-end justify-center"
                  >
                    <div
                      className="w-full rounded-t-sm bg-accent-500/90 transition-colors group-hover:bg-accent-400"
                      style={{
                        height: `${Math.max((item.value / maxHourCount) * 100, item.value > 0 ? 6 : 0)}%`,
                      }}
                      title={`${item.label}: ${item.value}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-2xs text-dark-500">
                <span>00</span>
                <span>12</span>
                <span>23</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4">
          <div className="mb-2 text-sm font-semibold text-dark-100">
            {t('admin.mainMenuButtons.stats.byWeekday')}
          </div>
          {viewMode === 'classic' ? (
            <div className="space-y-1.5">
              {byWeekday.items.map((item) => (
                <div
                  key={`${item.weekday}-${item.weekday_name}`}
                  className="flex items-center gap-2"
                >
                  <span className="w-24 text-xs text-dark-400">{item.weekday_name}</span>
                  <div className="h-2 flex-1 rounded-full bg-dark-700/60">
                    <div
                      className="h-2 rounded-full bg-success-500"
                      style={{ width: `${(item.count / maxWeekdayCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-dark-300">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex h-28 items-end gap-2 rounded-md border border-dark-700/60 bg-dark-800/50 p-2">
                {byWeekdayChartData.map((item) => (
                  <div
                    key={item.label}
                    className="group flex min-w-0 flex-1 items-end justify-center"
                  >
                    <div
                      className="w-full rounded-t-sm bg-success-500/90 transition-colors group-hover:bg-success-400"
                      style={{
                        height: `${Math.max((item.value / maxWeekdayCount) * 100, item.value > 0 ? 6 : 0)}%`,
                      }}
                      title={`${item.label}: ${item.value}`}
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-2xs text-dark-500">
                {byWeekdayChartData.map((item) => (
                  <span key={`${item.label}-label`} className="truncate">
                    {item.label.slice(0, 3)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-dark-100">
              {t('admin.mainMenuButtons.stats.topUsers')}
            </div>
            <input
              type="number"
              min={1}
              max={100}
              value={topUsersLimit}
              onChange={(e) =>
                setTopUsersLimit(Math.max(1, Math.min(Number(e.target.value) || 1, 100)))
              }
              className="w-20 rounded-md border border-dark-700 bg-dark-800 px-2 py-1 text-xs text-dark-100"
            />
          </div>
          {topUsersQuery.isLoading ? (
            <div className="text-sm text-dark-400">{t('common.loading')}</div>
          ) : topUsersQuery.isError ? (
            <div className="text-sm text-error-300">{t('common.error')}</div>
          ) : (
            <div className="space-y-2">
              {(topUsersQuery.data?.items || []).map((item) => {
                const maxUserClicks = Math.max(
                  ...((topUsersQuery.data?.items || []).map((entry) => entry.clicks_count) ?? [1]),
                  1,
                );
                return (
                  <div
                    key={item.user_id}
                    className="rounded-md border border-dark-700/60 bg-dark-800/50 p-2"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setSequenceUserId(item.user_id);
                          setSequenceUserIdInput(String(item.user_id));
                        }}
                        className="text-sm text-accent-300 hover:text-accent-200"
                      >
                        ID {item.user_id}
                      </button>
                      <span className="text-xs font-semibold text-dark-100">
                        {item.clicks_count}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-dark-700/70">
                      <div
                        className="h-2 rounded-full bg-accent-500"
                        style={{ width: `${(item.clicks_count / maxUserClicks) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(topUsersQuery.data?.items || []).length === 0 && (
                <div className="text-sm text-dark-500">
                  {t('admin.mainMenuButtons.stats.noData')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4">
          <div className="mb-2 text-sm font-semibold text-dark-100">
            {t('admin.mainMenuButtons.stats.periodComparison')}
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <input
              type="number"
              min={1}
              value={compareCurrentDays}
              onChange={(e) => setCompareCurrentDays(Math.max(Number(e.target.value) || 1, 1))}
              className="w-28 rounded-md border border-dark-700 bg-dark-800 px-2 py-1 text-xs text-dark-100"
              aria-label={t('admin.mainMenuButtons.stats.currentDays')}
            />
            <input
              type="number"
              min={1}
              value={comparePreviousDays}
              onChange={(e) => setComparePreviousDays(Math.max(Number(e.target.value) || 1, 1))}
              className="w-28 rounded-md border border-dark-700 bg-dark-800 px-2 py-1 text-xs text-dark-100"
              aria-label={t('admin.mainMenuButtons.stats.previousDays')}
            />
          </div>
          {compareQuery.isLoading ? (
            <div className="text-sm text-dark-400">{t('common.loading')}</div>
          ) : compareQuery.isError ? (
            <div className="text-sm text-error-300">{t('common.error')}</div>
          ) : (
            <>
              {viewMode === 'classic' ? (
                <div className="space-y-1 text-sm text-dark-200">
                  <div>
                    {t('admin.mainMenuButtons.stats.currentPeriod')}: {compareCurrentClicks ?? '—'}
                  </div>
                  <div>
                    {t('admin.mainMenuButtons.stats.previousPeriod')}:{' '}
                    {comparePreviousClicks ?? '—'}
                  </div>
                  <div>
                    {t('admin.mainMenuButtons.stats.changePercent')}: {compareChangePercent ?? '—'}
                  </div>
                  <div>
                    {t('admin.mainMenuButtons.stats.trend')}: {compareTrend || '—'}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: t('admin.mainMenuButtons.stats.currentPeriod'),
                        value: compareCurrentClicks ?? 0,
                        color: 'bg-accent-500',
                      },
                      {
                        label: t('admin.mainMenuButtons.stats.previousPeriod'),
                        value: comparePreviousClicks ?? 0,
                        color: 'bg-dark-500',
                      },
                    ].map((item) => {
                      const maxValue = Math.max(
                        compareCurrentClicks ?? 0,
                        comparePreviousClicks ?? 0,
                        1,
                      );
                      return (
                        <div
                          key={item.label}
                          className="rounded-md border border-dark-700/60 bg-dark-800/50 p-2"
                        >
                          <div className="mb-1 text-xs text-dark-400">{item.label}</div>
                          <div className="mb-1 text-sm font-semibold text-dark-100">
                            {item.value}
                          </div>
                          <div className="h-2 rounded-full bg-dark-700/70">
                            <div
                              className={`h-2 rounded-full ${item.color}`}
                              style={{ width: `${(item.value / maxValue) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-dark-300">
                    {t('admin.mainMenuButtons.stats.changePercent')}: {compareChangePercent ?? '—'}{' '}
                    | {t('admin.mainMenuButtons.stats.trend')}: {compareTrend || '—'}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4">
          <div className="mb-2 text-sm font-semibold text-dark-100">
            {t('admin.mainMenuButtons.stats.userSequence')}
          </div>
          <div className="mb-3 flex gap-2">
            <input
              type="number"
              min={1}
              value={sequenceUserIdInput}
              onChange={(e) => setSequenceUserIdInput(e.target.value)}
              className="w-full rounded-md border border-dark-700 bg-dark-800 px-2 py-1.5 text-sm text-dark-100"
              placeholder={t('admin.mainMenuButtons.stats.userIdPlaceholder')}
            />
            <button
              type="button"
              className="rounded-md bg-accent-500 px-3 py-1.5 text-sm text-white"
              onClick={() => {
                const value = Number(sequenceUserIdInput);
                if (Number.isFinite(value) && value > 0) {
                  setSequenceUserId(value);
                }
              }}
            >
              {t('common.search')}
            </button>
          </div>
          {sequenceUserId === null ? (
            <div className="text-sm text-dark-500">
              {t('admin.mainMenuButtons.stats.enterUserId')}
            </div>
          ) : sequencesQuery.isLoading ? (
            <div className="text-sm text-dark-400">{t('common.loading')}</div>
          ) : sequencesQuery.isError ? (
            <div className="text-sm text-error-300">{t('common.error')}</div>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {(sequencesQuery.data?.items || []).map((item, index) => (
                <div
                  key={`${item.button_id}-${item.clicked_at}-${index}`}
                  className="rounded-md bg-dark-800/60 p-2"
                >
                  <div className="text-xs text-dark-400">{formatDateTime(item.clicked_at)}</div>
                  <div className="text-sm text-dark-100">{item.button_id}</div>
                  {item.button_text && (
                    <div className="text-xs text-dark-500">{item.button_text}</div>
                  )}
                </div>
              ))}
              {(sequencesQuery.data?.items || []).length === 0 && (
                <div className="text-sm text-dark-500">
                  {t('admin.mainMenuButtons.stats.noData')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedButtonId && (
        <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4">
          <div className="mb-2 text-sm font-semibold text-dark-100">
            {t('admin.mainMenuButtons.stats.selectedButton')}: {selectedButtonId}
          </div>
          {buttonQuery.isLoading ? (
            <div className="text-sm text-dark-400">{t('common.loading')}</div>
          ) : buttonQuery.isError || !buttonQuery.data ? (
            <div className="text-sm text-error-300">{t('common.error')}</div>
          ) : (
            <>
              <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="rounded-md bg-dark-800/60 p-2">
                  <div className="text-xs text-dark-500">
                    {t('admin.mainMenuButtons.stats.total')}
                  </div>
                  <div className="text-sm text-dark-100">{buttonQuery.data.stats.clicks_total}</div>
                </div>
                <div className="rounded-md bg-dark-800/60 p-2">
                  <div className="text-xs text-dark-500">
                    {t('admin.mainMenuButtons.stats.today')}
                  </div>
                  <div className="text-sm text-dark-100">{buttonQuery.data.stats.clicks_today}</div>
                </div>
                <div className="rounded-md bg-dark-800/60 p-2">
                  <div className="text-xs text-dark-500">
                    {t('admin.mainMenuButtons.stats.week')}
                  </div>
                  <div className="text-sm text-dark-100">{buttonQuery.data.stats.clicks_week}</div>
                </div>
                <div className="rounded-md bg-dark-800/60 p-2">
                  <div className="text-xs text-dark-500">
                    {t('admin.mainMenuButtons.stats.uniqueUsers')}
                  </div>
                  <div className="text-sm text-dark-100">{buttonQuery.data.stats.unique_users}</div>
                </div>
              </div>

              {viewMode === 'classic' ? (
                <div className="space-y-1.5">
                  {buttonQuery.data.clicks_by_day.map((item) => (
                    <div
                      key={item.date}
                      className="flex items-center justify-between rounded-md border border-dark-700/60 bg-dark-800/50 px-3 py-2 text-sm"
                    >
                      <span className="text-dark-300">{formatDate(item.date)}</span>
                      <span className="text-dark-100">{item.count}</span>
                    </div>
                  ))}
                  {buttonQuery.data.clicks_by_day.length === 0 && (
                    <div className="text-sm text-dark-500">
                      {t('admin.mainMenuButtons.stats.noData')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {buttonQuery.data.clicks_by_day.length > 0 ? (
                    <>
                      <div className="rounded-md border border-dark-700/60 bg-dark-800/50 p-3">
                        <svg
                          viewBox="0 0 100 36"
                          className="h-28 w-full"
                          role="img"
                          aria-label={t('admin.mainMenuButtons.stats.selectedButton', {
                            defaultValue: 'Выбранная кнопка',
                          })}
                        >
                          <path
                            d={buildDaySparklinePath(
                              buttonQuery.data.clicks_by_day.map((item) => ({
                                label: item.date,
                                value: item.count,
                              })),
                              100,
                              32,
                            )}
                            fill="none"
                            stroke="rgb(59 130 246)"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <div className="grid grid-cols-1 gap-1 text-xs text-dark-400 md:grid-cols-3">
                        <span>{formatDate(buttonQuery.data.clicks_by_day[0].date)}</span>
                        <span className="text-center">
                          {buttonQuery.data.clicks_by_day.length}{' '}
                          {t('admin.mainMenuButtons.stats.days')}
                        </span>
                        <span className="text-right">
                          {formatDate(
                            buttonQuery.data.clicks_by_day[
                              buttonQuery.data.clicks_by_day.length - 1
                            ].date,
                          )}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-dark-500">
                      {t('admin.mainMenuButtons.stats.noData')}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
