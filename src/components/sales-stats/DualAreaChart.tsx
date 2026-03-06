import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SALES_STATS } from '../../constants/salesStats';

interface DualAreaChartProps {
  data: { date: string; series1: number; series2: number }[];
  title: string;
  chartId: string;
  series1Label: string;
  series2Label: string;
  series1Color?: string;
  series2Color?: string;
  height?: number;
}

export function DualAreaChart({
  data,
  title,
  chartId,
  series1Label,
  series2Label,
  series1Color,
  series2Color,
  height = SALES_STATS.CHART.HEIGHT,
}: DualAreaChartProps) {
  const { t, i18n } = useTranslation();
  const color1 = series1Color || SALES_STATS.BAR_COLORS[0];
  const color2 = series2Color || SALES_STATS.BAR_COLORS[1];

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

  const maxValue = useMemo(
    () => Math.max(0, ...chartData.map((item) => Math.max(item.series1, item.series2))),
    [chartData],
  );

  if (chartData.length === 0) {
    return (
      <div className="bento-card" data-chart-id={chartId}>
        <h4 className="mb-3 text-sm font-semibold text-dark-200">{title}</h4>
        <div className="flex items-center justify-center text-sm text-dark-400" style={{ height }}>
          {t('common.noData')}
        </div>
      </div>
    );
  }

  return (
    <div className="bento-card" data-chart-id={chartId}>
      <h4 className="mb-3 text-sm font-semibold text-dark-200">{title}</h4>

      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-dark-300">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color1 }} />
          <span>{series1Label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color2 }} />
          <span>{series2Label}</span>
        </div>
      </div>

      <div className="space-y-2" style={{ minHeight: height }}>
        {chartData.map((item, index) => {
          const width1 = maxValue > 0 ? Math.max((item.series1 / maxValue) * 100, 2) : 0;
          const width2 = maxValue > 0 ? Math.max((item.series2 / maxValue) * 100, 2) : 0;

          return (
            <div key={`${item.date}-${index}`} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-dark-300">{item.label}</span>
                <span className="shrink-0 text-dark-400">
                  {item.series1} / {item.series2}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="h-2 rounded-full bg-dark-800/60">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${width1}%`, backgroundColor: color1 }}
                  />
                </div>
                <div className="h-2 rounded-full bg-dark-800/60">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${width2}%`, backgroundColor: color2 }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
