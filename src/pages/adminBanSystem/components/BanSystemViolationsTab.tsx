import type { TFunction } from 'i18next';
import type { BanTrafficViolationsResponse } from '../../../api/banSystem';

interface BanSystemViolationsTabProps {
  t: TFunction;
  violations: BanTrafficViolationsResponse | null;
  formatDate: (value: string | null) => string;
}

export function BanSystemViolationsTab({ t, violations, formatDate }: BanSystemViolationsTabProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-dark-700 bg-dark-800/50">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-500">
                {t('banSystem.violations.user')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-500">
                {t('banSystem.violations.type')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-500">
                {t('banSystem.violations.description')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                {t('banSystem.violations.detectedAt')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                {t('banSystem.violations.status')}
              </th>
            </tr>
          </thead>
          <tbody>
            {violations?.violations.map((violation, index) => (
              <tr key={index} className="border-b border-dark-700/50 hover:bg-dark-800/50">
                <td className="px-4 py-3">
                  <div className="text-dark-100">{violation.username}</div>
                  <div className="text-xs text-dark-500">{violation.email || '-'}</div>
                </td>
                <td className="px-4 py-3 text-warning-400">{violation.violation_type}</td>
                <td className="px-4 py-3 text-sm text-dark-300">{violation.description || '-'}</td>
                <td className="px-4 py-3 text-center text-sm text-dark-300">
                  {formatDate(violation.detected_at)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      violation.resolved
                        ? 'bg-success-500/20 text-success-400'
                        : 'bg-warning-500/20 text-warning-400'
                    }`}
                  >
                    {violation.resolved
                      ? t('banSystem.violations.resolved')
                      : t('banSystem.violations.active')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(!violations?.violations || violations.violations.length === 0) && (
        <div className="py-8 text-center text-dark-500">
          {t('banSystem.violations.noViolations')}
        </div>
      )}
    </div>
  );
}
