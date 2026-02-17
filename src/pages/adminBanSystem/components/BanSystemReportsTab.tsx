import type { TFunction } from 'i18next';
import type { BanReportResponse } from '../../../api/banSystem';
import { ServerIcon, UsersIcon } from './BanSystemIcons';
import { StatCard } from './StatCard';

interface BanSystemReportsTabProps {
  t: TFunction;
  report: BanReportResponse | null;
  reportHours: number;
  onReportPeriodChange: (hours: number) => void;
}

export function BanSystemReportsTab({
  t,
  report,
  reportHours,
  onReportPeriodChange,
}: BanSystemReportsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="text-dark-400">{t('banSystem.reports.period')}:</span>
        <div className="flex flex-wrap gap-2">
          {[6, 12, 24, 48, 72].map((hours) => (
            <button
              key={hours}
              onClick={() => onReportPeriodChange(hours)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                reportHours === hours
                  ? 'bg-accent-500/20 text-accent-400'
                  : 'bg-dark-800 text-dark-400 hover:text-dark-200'
              }`}
            >
              {hours}h
            </button>
          ))}
        </div>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              title={t('banSystem.reports.currentUsers')}
              value={report.current_users}
              icon={<UsersIcon />}
              color="accent"
            />
            <StatCard
              title={t('banSystem.reports.currentIps')}
              value={report.current_ips}
              icon={<ServerIcon />}
              color="info"
            />
          </div>

          {report.top_violators && report.top_violators.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-dark-700 bg-dark-800/50">
              <div className="border-b border-dark-700 p-4">
                <h3 className="text-sm font-medium text-dark-200">
                  {t('banSystem.reports.topViolators')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[460px]">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-dark-500">
                        {t('banSystem.reports.username')}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                        {t('banSystem.reports.count')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.top_violators.map((violator, index) => (
                      <tr key={index} className="border-b border-dark-700/50 hover:bg-dark-800/50">
                        <td className="px-4 py-3 text-dark-100">{violator.username}</td>
                        <td className="px-4 py-3 text-center text-warning-400">{violator.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
