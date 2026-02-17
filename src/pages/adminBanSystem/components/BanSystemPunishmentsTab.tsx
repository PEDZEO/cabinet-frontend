import type { TFunction } from 'i18next';
import type { BanPunishmentsListResponse } from '../../../api/banSystem';

interface BanSystemPunishmentsTabProps {
  t: TFunction;
  punishments: BanPunishmentsListResponse | null;
  actionLoading: string | null;
  formatDate: (value: string | null) => string;
  onUnban: (userId: string) => Promise<void>;
}

export function BanSystemPunishmentsTab({
  t,
  punishments,
  actionLoading,
  formatDate,
  onUnban,
}: BanSystemPunishmentsTabProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-dark-700 bg-dark-800/50">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-500">
                {t('banSystem.punishments.user')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-500">
                {t('banSystem.punishments.reason')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                {t('banSystem.punishments.ipCount')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                {t('banSystem.punishments.limit')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                {t('banSystem.punishments.bannedAt')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                {t('banSystem.punishments.enableAt')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-dark-500">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {punishments?.punishments.map((punishment) => (
              <tr
                key={punishment.user_id}
                className="border-b border-dark-700/50 hover:bg-dark-800/50"
              >
                <td className="px-4 py-3">
                  <div className="text-dark-100">{punishment.username}</div>
                  <div className="text-xs text-dark-500">{punishment.user_id}</div>
                </td>
                <td className="px-4 py-3 text-sm text-dark-300">{punishment.reason || '-'}</td>
                <td className="px-4 py-3 text-center text-error-400">{punishment.ip_count}</td>
                <td className="px-4 py-3 text-center text-dark-300">{punishment.limit}</td>
                <td className="px-4 py-3 text-center text-sm text-dark-300">
                  {formatDate(punishment.punished_at)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-dark-300">
                  {formatDate(punishment.enable_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => void onUnban(punishment.user_id)}
                    disabled={actionLoading === punishment.user_id}
                    className="rounded-lg bg-success-500/20 px-3 py-1 text-sm text-success-400 transition-colors hover:bg-success-500/30 disabled:opacity-50"
                  >
                    {t('banSystem.punishments.unban')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(!punishments?.punishments || punishments.punishments.length === 0) && (
        <div className="py-8 text-center text-dark-500">{t('banSystem.punishments.noBans')}</div>
      )}
    </div>
  );
}
