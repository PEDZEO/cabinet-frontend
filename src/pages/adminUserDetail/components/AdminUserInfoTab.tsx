import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type { PromoGroup } from '../../../api/promocodes';
import type { UserDetailResponse, UserListItem } from '../../../api/adminUsers';
import { createNumberInputHandler } from '../../../utils/inputHelpers';
import { StatusBadge } from './StatusBadge';
import { AdminUserDangerZone } from './AdminUserDangerZone';

interface AdminUserInfoTabProps {
  user: UserDetailResponse;
  actionLoading: boolean;
  formatDate: (date: string | null) => string;
  formatWithCurrency: (value: number) => string;
  promoGroups: PromoGroup[];
  editingPromoGroup: boolean;
  setEditingPromoGroup: Dispatch<SetStateAction<boolean>>;
  onChangePromoGroup: (groupId: number | null) => void;
  editingReferralCommission: boolean;
  setEditingReferralCommission: Dispatch<SetStateAction<boolean>>;
  referralCommissionValue: number | '';
  setReferralCommissionValue: Dispatch<SetStateAction<number | ''>>;
  onUpdateReferralCommission: () => void;
  referralsLoading: boolean;
  referrals: UserListItem[];
  onOpenUser: (userId: number) => void;
  onBlockUser: () => void;
  onUnblockUser: () => void;
  confirmingAction: string | null;
  onConfirmResetTrial: () => void;
  onConfirmResetSubscription: () => void;
  onConfirmDisable: () => void;
  onConfirmFullDelete: () => void;
}

export function AdminUserInfoTab({
  user,
  actionLoading,
  formatDate,
  formatWithCurrency,
  promoGroups,
  editingPromoGroup,
  setEditingPromoGroup,
  onChangePromoGroup,
  editingReferralCommission,
  setEditingReferralCommission,
  referralCommissionValue,
  setReferralCommissionValue,
  onUpdateReferralCommission,
  referralsLoading,
  referrals,
  onOpenUser,
  onBlockUser,
  onUnblockUser,
  confirmingAction,
  onConfirmResetTrial,
  onConfirmResetSubscription,
  onConfirmDisable,
  onConfirmFullDelete,
}: AdminUserInfoTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-dark-800/50 p-3">
        <span className="text-dark-400">{t('admin.users.detail.status')}</span>
        <div className="flex items-center gap-2">
          <StatusBadge status={user.status} />
          {user.status === 'active' ? (
            <button
              onClick={onBlockUser}
              disabled={actionLoading}
              className="rounded-lg bg-error-500/20 px-3 py-1 text-xs text-error-400 transition-colors hover:bg-error-500/30"
            >
              {t('admin.users.actions.block')}
            </button>
          ) : user.status === 'blocked' ? (
            <button
              onClick={onUnblockUser}
              disabled={actionLoading}
              className="rounded-lg bg-success-500/20 px-3 py-1 text-xs text-success-400 transition-colors hover:bg-success-500/30"
            >
              {t('admin.users.actions.unblock')}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-dark-800/50 p-3">
          <div className="mb-1 text-xs text-dark-500">Email</div>
          <div className="text-dark-100">{user.email || '-'}</div>
        </div>
        <div className="rounded-xl bg-dark-800/50 p-3">
          <div className="mb-1 text-xs text-dark-500">{t('admin.users.detail.language')}</div>
          <div className="text-dark-100">{user.language}</div>
        </div>
        <div className="rounded-xl bg-dark-800/50 p-3">
          <div className="mb-1 text-xs text-dark-500">{t('admin.users.detail.registration')}</div>
          <div className="text-dark-100">{formatDate(user.created_at)}</div>
        </div>
        <div className="rounded-xl bg-dark-800/50 p-3">
          <div className="mb-1 text-xs text-dark-500">{t('admin.users.detail.lastActivity')}</div>
          <div className="text-dark-100">{formatDate(user.last_activity)}</div>
        </div>
        <div className="rounded-xl bg-dark-800/50 p-3">
          <div className="mb-1 text-xs text-dark-500">{t('admin.users.detail.totalSpent')}</div>
          <div className="text-dark-100">{formatWithCurrency(user.total_spent_kopeks / 100)}</div>
        </div>
        <div className="rounded-xl bg-dark-800/50 p-3">
          <div className="mb-1 text-xs text-dark-500">{t('admin.users.detail.purchases')}</div>
          <div className="text-dark-100">{user.purchase_count}</div>
        </div>
      </div>

      {user.campaign_name && (
        <div className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-3">
          <div className="mb-1 text-xs text-dark-500">{t('admin.users.detail.campaign')}</div>
          <div className="text-sm font-medium text-accent-400">{user.campaign_name}</div>
        </div>
      )}

      <div className="rounded-xl bg-dark-800/50 p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-dark-500">{t('admin.users.detail.promoGroup')}</span>
          <button
            onClick={() => setEditingPromoGroup(!editingPromoGroup)}
            className="text-xs text-accent-400 transition-colors hover:text-accent-300"
          >
            {editingPromoGroup ? t('common.cancel') : t('admin.users.detail.changePromoGroup')}
          </button>
        </div>
        {editingPromoGroup ? (
          <div className="mt-2 space-y-2">
            <select
              value={user.promo_group?.id ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                onChangePromoGroup(value ? parseInt(value, 10) : null);
              }}
              disabled={actionLoading}
              className="input text-sm"
            >
              <option value="">{t('admin.users.detail.selectPromoGroup')}</option>
              {promoGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            {user.promo_group && (
              <button
                onClick={() => onChangePromoGroup(null)}
                disabled={actionLoading}
                className="w-full rounded-lg bg-dark-700 py-1.5 text-xs text-dark-300 transition-colors hover:bg-dark-600"
              >
                {t('admin.users.detail.removePromoGroup')}
              </button>
            )}
          </div>
        ) : (
          <div className="text-sm font-medium text-dark-100">
            {user.promo_group?.name || (
              <span className="text-dark-500">{t('admin.users.detail.noPromoGroup')}</span>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-dark-800/50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-dark-200">
            {t('admin.users.detail.referral.title')}
          </span>
          <button
            onClick={() => {
              if (!editingReferralCommission) {
                setReferralCommissionValue(user.referral.commission_percent ?? '');
              }
              setEditingReferralCommission(!editingReferralCommission);
            }}
            className="text-xs text-accent-400 transition-colors hover:text-accent-300"
          >
            {editingReferralCommission ? t('common.cancel') : t('common.edit')}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-dark-100">{user.referral.referrals_count}</div>
            <div className="text-xs text-dark-500">
              {t('admin.users.detail.referral.referrals')}
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-dark-100">
              {formatWithCurrency(user.referral.total_earnings_kopeks / 100)}
            </div>
            <div className="text-xs text-dark-500">{t('admin.users.detail.referral.earned')}</div>
          </div>
          <div>
            {editingReferralCommission ? (
              <div className="space-y-1">
                <input
                  type="number"
                  value={referralCommissionValue}
                  onChange={createNumberInputHandler(setReferralCommissionValue, 0)}
                  placeholder="0-100"
                  className="input w-full text-center text-sm"
                  min={0}
                  max={100}
                  disabled={actionLoading}
                />
                <button
                  onClick={onUpdateReferralCommission}
                  disabled={actionLoading}
                  className="w-full rounded-lg bg-accent-500 px-2 py-1 text-xs text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
                >
                  {actionLoading ? t('common.loading') : t('common.save')}
                </button>
              </div>
            ) : (
              <>
                <div className="text-lg font-bold text-dark-100">
                  {user.referral.commission_percent != null
                    ? `${user.referral.commission_percent}%`
                    : t('admin.users.detail.referral.default')}
                </div>
                <div className="text-xs text-dark-500">
                  {t('admin.users.detail.referral.commission')}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {user.referral.referrals_count > 0 && (
        <div className="rounded-xl bg-dark-800/50 p-3">
          <div className="mb-2 text-sm font-medium text-dark-200">
            {t('admin.users.detail.referralsList')}
          </div>
          {referralsLoading ? (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="py-2 text-center text-xs text-dark-500">
              {t('admin.users.detail.noReferrals')}
            </div>
          ) : (
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {referrals.map((referralUser) => (
                <button
                  key={referralUser.id}
                  onClick={() => onOpenUser(referralUser.id)}
                  className="flex w-full items-center justify-between rounded-lg bg-dark-700/50 p-2 text-left transition-colors hover:bg-dark-700"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-dark-600 text-xs font-bold text-dark-300">
                      {referralUser.first_name?.[0] || referralUser.username?.[0] || '?'}
                    </div>
                    <div>
                      <div className="text-sm text-dark-100">{referralUser.full_name}</div>
                      <div className="text-xs text-dark-500">
                        {formatDate(referralUser.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-dark-400">
                    {formatWithCurrency(referralUser.total_spent_kopeks / 100)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <AdminUserDangerZone
        user={user}
        actionLoading={actionLoading}
        confirmingAction={confirmingAction}
        onConfirmResetTrial={onConfirmResetTrial}
        onConfirmResetSubscription={onConfirmResetSubscription}
        onConfirmDisable={onConfirmDisable}
        onConfirmFullDelete={onConfirmFullDelete}
      />
    </div>
  );
}
