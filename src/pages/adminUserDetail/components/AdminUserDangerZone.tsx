import { useTranslation } from 'react-i18next';
import type { UserDetailResponse } from '../../../api/adminUsers';

interface AdminUserDangerZoneProps {
  user: UserDetailResponse;
  actionLoading: boolean;
  confirmingAction: string | null;
  onConfirmResetTrial: () => void;
  onConfirmResetSubscription: () => void;
  onConfirmDisable: () => void;
  onConfirmFullDelete: () => void;
}

export function AdminUserDangerZone({
  user,
  actionLoading,
  confirmingAction,
  onConfirmResetTrial,
  onConfirmResetSubscription,
  onConfirmDisable,
  onConfirmFullDelete,
}: AdminUserDangerZoneProps) {
  const { t } = useTranslation();

  return (
    <>
      {(user.restriction_topup || user.restriction_subscription) && (
        <div className="rounded-xl border border-error-500/30 bg-error-500/10 p-3">
          <div className="mb-2 text-sm font-medium text-error-400">
            {t('admin.users.detail.restrictions.title')}
          </div>
          {user.restriction_topup && (
            <div className="text-xs text-error-300">
              {t('admin.users.detail.restrictions.topup')}
            </div>
          )}
          {user.restriction_subscription && (
            <div className="text-xs text-error-300">
              {t('admin.users.detail.restrictions.subscription')}
            </div>
          )}
          {user.restriction_reason && (
            <div className="mt-1 text-xs text-dark-400">
              {t('admin.users.detail.restrictions.reason')}: {user.restriction_reason}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl bg-dark-800/50 p-4">
        <div className="mb-3 text-sm font-medium text-dark-200">
          {t('admin.users.detail.actions.title')}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onConfirmResetTrial}
            disabled={actionLoading}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
              confirmingAction === 'resetTrial'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'
            }`}
          >
            {confirmingAction === 'resetTrial'
              ? t('admin.users.detail.actions.areYouSure')
              : t('admin.users.userActions.resetTrial')}
          </button>
          <button
            onClick={onConfirmResetSubscription}
            disabled={actionLoading}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
              confirmingAction === 'resetSubscription'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
            }`}
          >
            {confirmingAction === 'resetSubscription'
              ? t('admin.users.detail.actions.areYouSure')
              : t('admin.users.userActions.resetSubscription')}
          </button>
          <button
            onClick={onConfirmDisable}
            disabled={actionLoading}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
              confirmingAction === 'disable'
                ? 'bg-dark-500 text-white'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            }`}
          >
            {confirmingAction === 'disable'
              ? t('admin.users.detail.actions.areYouSure')
              : t('admin.users.userActions.disable')}
          </button>
          <button
            onClick={onConfirmFullDelete}
            disabled={actionLoading}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
              confirmingAction === 'fullDelete'
                ? 'bg-rose-500 text-white'
                : 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
            }`}
          >
            {confirmingAction === 'fullDelete'
              ? t('admin.users.detail.actions.areYouSure')
              : t('admin.users.userActions.delete')}
          </button>
        </div>
      </div>
    </>
  );
}
