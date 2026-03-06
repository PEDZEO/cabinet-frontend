import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SALES_STATS } from '../../constants/salesStats';

interface DonutChartProps {
  data: { name: string; value: number; color?: string }[];
  title: string;
  height?: number;
}

export function DonutChart({
  data,
  title,
  height = SALES_STATS.CHART.PIE_HEIGHT,
}: DonutChartProps) {
  const { t } = useTranslation();
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  if (data.length === 0) {
    return (
      <div className="bento-card">
        <h4 className="mb-3 text-sm font-semibold text-dark-200">{title}</h4>
        <div className="flex items-center justify-center text-sm text-dark-400" style={{ height }}>
          {t('common.noData')}
        </div>
      </div>
    );
  }

  return (
    <div className="bento-card">
      <h4 className="mb-3 text-sm font-semibold text-dark-200">{title}</h4>
      <div className="space-y-2" style={{ minHeight: height }}>
        {data.map((entry, index) => {
          const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0';
          const color =
            entry.color || SALES_STATS.BAR_COLORS[index % SALES_STATS.BAR_COLORS.length];
          return (
            <div key={entry.name} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate text-dark-300">{entry.name}</span>
                </div>
                <span className="shrink-0 text-dark-400">
                  {entry.value} ({percent}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-dark-800/60">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${percent}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
