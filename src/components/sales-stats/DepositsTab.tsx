import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { SalesStatsParams } from '../../api/adminSalesStats';
import { salesStatsApi } from '../../api/adminSalesStats';
import { SALES_STATS } from '../../constants/salesStats';
import { useCurrency } from '../../hooks/useCurrency';
import { StatCard } from '../data-display/StatCard';

import { SimpleAreaChart } from './SimpleAreaChart';
import { SimpleBarChart } from './SimpleBarChart';

interface DepositsTabProps {
  params: SalesStatsParams;
}

const METHOD_LABELS: Record<string, string> = {
  telegram_stars: 'Telegram Stars',
  tribute: 'Tribute',
  yookassa: 'YooKassa',
  cryptobot: 'CryptoBot',
  heleket: 'Heleket',
  mulenpay: 'Mulenpay',
  pal24: 'Pal24',
  wata: 'Wata',
  platega: 'Platega',
  cloudpayments: 'CloudPayments',
  freekassa: 'FreeKassa',
  kassa_ai: 'Kassa AI',
};

export function DepositsTab({ params }: DepositsTabProps) {
  const { t } = useTranslation();
  const { formatWithCurrency } = useCurrency();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sales-stats', 'deposits', params],
    queryFn: () => salesStatsApi.getDeposits(params),
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

  const methodBarData = data.by_method.map((item) => ({
    name: METHOD_LABELS[item.method] || item.method,
    value: item.amount_kopeks / SALES_STATS.KOPEKS_DIVISOR,
  }));

  const dailyData = data.daily.map((item) => ({
    date: item.date,
    value: item.amount_kopeks / SALES_STATS.KOPEKS_DIVISOR,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t('admin.salesStats.deposits.totalDeposits')}
          value={data.total_deposits}
        />
        <StatCard
          label={t('admin.salesStats.deposits.totalAmount')}
          value={formatWithCurrency(data.total_amount_kopeks / SALES_STATS.KOPEKS_DIVISOR)}
          valueClassName="text-success-400"
        />
        <StatCard
          label={t('admin.salesStats.deposits.avgDeposit')}
          value={formatWithCurrency(data.avg_deposit_kopeks / SALES_STATS.KOPEKS_DIVISOR)}
        />
      </div>

      <SimpleBarChart
        data={methodBarData}
        title={t('admin.salesStats.deposits.byMethod')}
        valueFormatter={(v) => formatWithCurrency(v)}
      />

      <SimpleAreaChart
        data={dailyData}
        title={t('admin.salesStats.deposits.dailyChart')}
        chartId="deposits-daily"
        valueLabel={t('admin.salesStats.deposits.revenue')}
      />
    </div>
  );
}
