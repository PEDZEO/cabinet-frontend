import type { TFunction } from 'i18next';
import type { BanUserDetailResponse } from '@/api/banSystem';

interface BanSystemUserDetailModalProps {
  t: TFunction;
  user: BanUserDetailResponse;
  onClose: () => void;
}

export function BanSystemUserDetailModal({ t, user, onClose }: BanSystemUserDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-dark-700 bg-dark-800"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-dark-700 p-4">
          <h3 className="text-lg font-semibold text-dark-100">{t('banSystem.userDetail.title')}</h3>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200"
            aria-label={t('common.close')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-dark-500">{t('banSystem.users.email')}</div>
              <div className="text-dark-100">{user.email}</div>
            </div>
            <div>
              <div className="text-xs text-dark-500">{t('banSystem.users.limit')}</div>
              <div className="text-dark-100">{user.limit ?? '-'}</div>
            </div>
            <div>
              <div className="text-xs text-dark-500">{t('banSystem.users.ipCount')}</div>
              <div className="text-dark-100">{user.unique_ip_count}</div>
            </div>
            <div>
              <div className="text-xs text-dark-500">{t('banSystem.users.networkType')}</div>
              <div className="text-dark-100">{user.network_type || '-'}</div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-dark-200">
              {t('banSystem.userDetail.ipHistory')}
            </h4>
            <div className="overflow-hidden rounded-lg bg-dark-900/50">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="px-3 py-2 text-left text-xs text-dark-500">
                        {t('banSystem.userDetail.ip')}
                      </th>
                      <th className="px-3 py-2 text-left text-xs text-dark-500">
                        {t('banSystem.userDetail.country')}
                      </th>
                      <th className="px-3 py-2 text-left text-xs text-dark-500">
                        {t('banSystem.userDetail.node')}
                      </th>
                      <th className="px-3 py-2 text-center text-xs text-dark-500">
                        {t('banSystem.userDetail.requests')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.ips.map((ip, index) => (
                      <tr key={index} className="border-b border-dark-700/50">
                        <td className="px-3 py-2 text-dark-100">{ip.ip}</td>
                        <td className="px-3 py-2 text-dark-300">
                          {ip.country_name || ip.country_code || '-'}
                        </td>
                        <td className="px-3 py-2 text-dark-300">{ip.node || '-'}</td>
                        <td className="px-3 py-2 text-center text-dark-300">{ip.request_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {user.ips.length === 0 && (
                <div className="py-4 text-center text-dark-500">{t('common.noData')}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
