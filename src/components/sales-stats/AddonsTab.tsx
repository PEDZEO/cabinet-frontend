import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { SalesStatsParams } from '../../api/adminSalesStats';
import { salesStatsApi } from '../../api/adminSalesStats';
import { SALES_STATS } from '../../constants/salesStats';
import { useCurrency } from '../../hooks/useCurrency';
import { StatCard } from '../data-display/StatCard';

import { SimpleAreaChart } from './SimpleAreaChart';
import { SimpleBarChart } from './SimpleBarChart';

interface AddonsTabProps {
  params: SalesStatsParams;
}

export function AddonsTab({ params }: AddonsTabProps) {
  const { t } = useTranslation();
  const { formatWithCurrency } = useCurrency();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sales-stats', 'addons', params],
    queryFn: () => salesStatsApi.getAddons(params),
    staleTime: SALES_STATS.STALE_TIME,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-24 rounded-xl bg-dark-800/30" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <div className="py-8 text-center text-red-400">{t('admin.salesStats.loadError')}</div>;
  }

  const packageBarData = data.by_package.map((item) => ({
    name: `${item.traffic_gb} GB`,
    value: item.count,
  }));

  const dailyData = data.daily.map((item) => ({
    date: item.date,
    value: item.count,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t('admin.salesStats.addons.totalPurchases')}
          value={data.total_purchases}
        />
        <StatCard
          label={t('admin.salesStats.addons.totalGb')}
          value={`${data.total_gb_purchased} GB`}
        />
        <StatCard
          label={t('admin.salesStats.addons.revenue')}
          value={formatWithCurrency(data.addon_revenue_kopeks / SALES_STATS.KOPEKS_DIVISOR)}
          valueClassName="text-success-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SimpleBarChart data={packageBarData} title={t('admin.salesStats.addons.byPackage')} />
        <SimpleAreaChart
          data={dailyData}
          title={t('admin.salesStats.addons.dailyChart')}
          chartId="addons-daily"
          valueLabel={t('admin.salesStats.addons.purchases')}
          color={SALES_STATS.BAR_COLORS[5]}
        />
      </div>
    </div>
  );
}
