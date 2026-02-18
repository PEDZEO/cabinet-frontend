import type { TFunction } from 'i18next';
import type { BanTrafficResponse } from '@/api/banSystem';
import { formatBytes, formatDate } from '../utils/formatters';
import { getOverLimitBadgeClass } from '../utils/statusStyles';
import { TrafficIcon } from './BanSystemIcons';
import { StatCard } from './StatCard';

interface BanSystemTrafficTabProps {
  t: TFunction;
  traffic: BanTrafficResponse;
}

export function BanSystemTrafficTab({ t, traffic }: BanSystemTrafficTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title={t('banSystem.traffic.enabled')}
          value={traffic.enabled ? t('common.yes') : t('common.no')}
          icon={<TrafficIcon />}
          color={traffic.enabled ? 'success' : 'warning'}
        />
      </div>

      {traffic.top_users && traffic.top_users.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-dark-700 bg-dark-800/50">
          <div className="border-b border-dark-700 p-4">
            <h3 className="text-sm font-medium text-dark-200">{t('banSystem.traffic.topUsers')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-500">
                    {t('banSystem.traffic.username')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                    {t('banSystem.traffic.bytesTotal')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                    {t('banSystem.traffic.bytesLimit')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                    {t('banSystem.traffic.status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {traffic.top_users.map((user, index) => (
                  <tr key={index} className="border-b border-dark-700/50 hover:bg-dark-800/50">
                    <td className="px-4 py-3 text-dark-100">{user.username}</td>
                    <td className="px-4 py-3 text-center text-dark-300">
                      {formatBytes(user.bytes_total)}
                    </td>
                    <td className="px-4 py-3 text-center text-dark-300">
                      {user.bytes_limit ? formatBytes(user.bytes_limit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${getOverLimitBadgeClass(user.over_limit)}`}
                      >
                        {user.over_limit
                          ? t('banSystem.traffic.overLimit')
                          : t('banSystem.traffic.ok')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {traffic.recent_violations && traffic.recent_violations.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-dark-700 bg-dark-800/50">
          <div className="border-b border-dark-700 p-4">
            <h3 className="text-sm font-medium text-dark-200">
              {t('banSystem.traffic.recentViolations')}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-500">
                    {t('banSystem.violations.user')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-500">
                    {t('banSystem.violations.type')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                    {t('banSystem.violations.detectedAt')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {traffic.recent_violations.map((violation, index) => (
                  <tr key={index} className="border-b border-dark-700/50 hover:bg-dark-800/50">
                    <td className="px-4 py-3 text-dark-100">{violation.username}</td>
                    <td className="px-4 py-3 text-warning-400">{violation.violation_type}</td>
                    <td className="px-4 py-3 text-center text-sm text-dark-300">
                      {formatDate(violation.detected_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!traffic.top_users || traffic.top_users.length === 0) &&
        (!traffic.recent_violations || traffic.recent_violations.length === 0) && (
          <div className="py-8 text-center text-dark-500">{t('common.noData')}</div>
        )}
    </div>
  );
}
