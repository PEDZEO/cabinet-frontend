import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { SalesStatsParams } from '../../api/adminSalesStats';
import { salesStatsApi } from '../../api/adminSalesStats';
import { SALES_STATS } from '../../constants/salesStats';
import { StatCard } from '../data-display/StatCard';

import { DonutChart } from './DonutChart';
import { SimpleAreaChart } from './SimpleAreaChart';

interface TrialsTabProps {
  params: SalesStatsParams;
}

const PROVIDER_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  email: 'Email',
  vk: 'VK',
  yandex: 'Yandex',
  google: 'Google',
  discord: 'Discord',
};

export function TrialsTab({ params }: TrialsTabProps) {
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sales-stats', 'trials', params],
    queryFn: () => salesStatsApi.getTrials(params),
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

  const pieData = data.by_provider.map((item) => ({
    name: PROVIDER_LABELS[item.provider] || item.provider,
    value: item.count,
    color: SALES_STATS.PROVIDER_COLORS[item.provider as keyof typeof SALES_STATS.PROVIDER_COLORS],
  }));

  const areaData = data.daily.map((item) => ({
    date: item.date,
    value: item.count,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={t('admin.salesStats.trials.total')} value={data.total_trials} />
        <StatCard
          label={t('admin.salesStats.trials.conversion')}
          value={`${data.conversion_rate}%`}
          valueClassName="text-success-400"
        />
        <StatCard
          label={t('admin.salesStats.trials.avgDuration')}
          value={`${data.avg_trial_duration_days} ${t('admin.trafficUsage.days')}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutChart data={pieData} title={t('admin.salesStats.trials.byProvider')} />
        <SimpleAreaChart
          data={areaData}
          title={t('admin.salesStats.trials.dailyChart')}
          chartId="trials-daily"
          valueLabel={t('admin.salesStats.trials.registrations')}
          color={SALES_STATS.PROVIDER_COLORS.telegram}
        />
      </div>
    </div>
  );
}
