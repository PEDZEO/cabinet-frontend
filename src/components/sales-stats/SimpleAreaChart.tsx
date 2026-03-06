import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SALES_STATS } from '../../constants/salesStats';

interface SimpleAreaChartProps {
  data: { date: string; value: number }[];
  title: string;
  color?: string;
  chartId: string;
  valueLabel?: string;
  height?: number;
}

export function SimpleAreaChart({
  data,
  title,
  color,
  valueLabel,
  height = SALES_STATS.CHART.HEIGHT,
}: SimpleAreaChartProps) {
  const { t, i18n } = useTranslation();
  const maxValue = useMemo(() => Math.max(...data.map((item) => item.value), 0), [data]);
  const lineColor = color || SALES_STATS.BAR_COLORS[0];

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        label: new Date(`${item.date}T00:00:00`).toLocaleDateString(i18n.language, {
          month: 'short',
          day: 'numeric',
        }),
      })),
    [data, i18n.language],
  );

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
        {chartData.map((item, index) => {
          const widthPercent = maxValue > 0 ? Math.max((item.value / maxValue) * 100, 2) : 0;
          return (
            <div key={`${item.date}-${index}`} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-dark-300">{item.label}</span>
                <span className="shrink-0 text-dark-400">
                  {item.value} {valueLabel ? ` ${valueLabel}` : ''}
                </span>
              </div>
              <div className="h-2 rounded-full bg-dark-800/60">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${widthPercent}%`, backgroundColor: lineColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
