import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SALES_STATS } from '../../constants/salesStats';

interface SimpleBarChartProps {
  data: { name: string; value: number; color?: string }[];
  title: string;
  height?: number;
  valueFormatter?: (value: number) => string;
}

export function SimpleBarChart({
  data,
  title,
  height = SALES_STATS.CHART.HEIGHT,
  valueFormatter,
}: SimpleBarChartProps) {
  const { t } = useTranslation();
  const maxValue = useMemo(() => Math.max(...data.map((item) => item.value), 0), [data]);

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
          const widthPercent = maxValue > 0 ? Math.max((entry.value / maxValue) * 100, 2) : 0;
          const barColor =
            entry.color || SALES_STATS.BAR_COLORS[index % SALES_STATS.BAR_COLORS.length];
          return (
            <div key={entry.name} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-dark-300">{entry.name}</span>
                <span className="shrink-0 text-dark-400">
                  {valueFormatter ? valueFormatter(entry.value) : entry.value}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-dark-800/60">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${widthPercent}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
