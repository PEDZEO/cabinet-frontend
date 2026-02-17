import type { TFunction } from 'i18next';
import type { BanUsersListResponse } from '../../../api/banSystem';
import { getOverLimitBadgeClass } from '../utils/statusStyles';
import { SearchIcon } from './BanSystemIcons';

interface BanSystemUsersTabProps {
  t: TFunction;
  users: BanUsersListResponse | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  actionLoading: string | null;
  handleSearch: () => Promise<void>;
  handleViewUser: (email: string) => Promise<void>;
}

export function BanSystemUsersTab({
  t,
  users,
  searchQuery,
  setSearchQuery,
  actionLoading,
  handleSearch,
  handleViewUser,
}: BanSystemUsersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-dark-500">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && void handleSearch()}
            placeholder={t('banSystem.users.searchPlaceholder')}
            className="input pl-10"
          />
        </div>
        <button
          onClick={() => void handleSearch()}
          className="rounded-lg bg-accent-500/20 px-4 py-2 text-accent-400 transition-colors hover:bg-accent-500/30 sm:w-auto"
        >
          {t('common.search')}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-dark-700 bg-dark-800/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-500">
                  {t('banSystem.users.email')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                  {t('banSystem.users.ipCount')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                  {t('banSystem.users.limit')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                  {t('banSystem.users.status')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-dark-500">
                  {t('banSystem.users.bans')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-dark-500">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {users?.users.map((user) => (
                <tr key={user.email} className="border-b border-dark-700/50 hover:bg-dark-800/50">
                  <td className="px-4 py-3 text-dark-100">{user.email}</td>
                  <td className="px-4 py-3 text-center text-dark-300">{user.unique_ip_count}</td>
                  <td className="px-4 py-3 text-center text-dark-300">{user.limit ?? '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${getOverLimitBadgeClass(user.is_over_limit)}`}
                    >
                      {user.is_over_limit
                        ? t('banSystem.users.overLimit')
                        : t('banSystem.users.ok')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-dark-300">{user.blocked_count}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => void handleViewUser(user.email)}
                      disabled={actionLoading === user.email}
                      className="text-sm text-accent-400 hover:text-accent-300 disabled:opacity-50"
                    >
                      {t('banSystem.users.viewDetails')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!users?.users || users.users.length === 0) && (
          <div className="py-8 text-center text-dark-500">{t('common.noData')}</div>
        )}
      </div>
    </div>
  );
}
