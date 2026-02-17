import type { UserDetailResponse } from '../../../api/adminUsers';
import { AdminBackButton } from '../../../components/admin';
import { RefreshIcon, TelegramIcon } from './Icons';

interface AdminUserDetailHeaderProps {
  user: UserDetailResponse;
  loading: boolean;
  onRefresh: () => void;
}

export function AdminUserDetailHeader({ user, loading, onRefresh }: AdminUserDetailHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AdminBackButton to="/admin/users" />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-lg font-bold text-white">
          {user.first_name?.[0] || user.username?.[0] || '?'}
        </div>
        <div>
          <div className="font-semibold text-dark-100">{user.full_name}</div>
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <TelegramIcon />
            {user.telegram_id}
            {user.username && <span>@{user.username}</span>}
          </div>
        </div>
      </div>
      <button onClick={onRefresh} className="rounded-lg p-2 transition-colors hover:bg-dark-700">
        <RefreshIcon className={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}
