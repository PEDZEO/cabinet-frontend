import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type { PromoGroup } from '../../../api/promocodes';
import {
  adminUsersApi,
  type UpdateUserReferralsAction,
  type UserDetailResponse,
  type UserListItem,
} from '../../../api/adminUsers';
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
  onUpdateReferrals: (
    referralUserIds: number[],
    action: UpdateUserReferralsAction,
  ) => Promise<void>;
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
  onUpdateReferrals,
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
  const [referralSearch, setReferralSearch] = useState('');
  const [referralSearchResults, setReferralSearchResults] = useState<UserListItem[]>([]);
  const [referralSearchLoading, setReferralSearchLoading] = useState(false);
  const [referralSearchError, setReferralSearchError] = useState('');
  const referralIdSet = useMemo(() => new Set(referrals.map((item) => item.id)), [referrals]);

  const getReferralUserMeta = (referralUser: UserListItem) => {
    const parts = [];
    if (referralUser.username) {
      parts.push(`@${referralUser.username}`);
    }
    if (referralUser.telegram_id) {
      parts.push(`TG ${referralUser.telegram_id}`);
    }
    parts.push(`#${referralUser.id}`);
    return parts.join(' · ');
  };

  const handleReferralSearch = async () => {
    const query = referralSearch.trim();
    if (query.length < 2) {
      setReferralSearchResults([]);
      setReferralSearchError(t('admin.users.detail.referral.searchMinLength'));
      return;
    }

    setReferralSearchLoading(true);
    setReferralSearchError('');
    try {
      const data = await adminUsersApi.getUsers({ search: query, limit: 8 });
      const foundUsers = data.users.filter(
        (item) => item.id !== user.id && !referralIdSet.has(item.id),
      );
      setReferralSearchResults(foundUsers);
      setReferralSearchError(
        foundUsers.length === 0 ? t('admin.users.detail.referral.noSearchResults') : '',
      );
    } catch (error) {
      console.error('Failed to search referral users:', error);
      setReferralSearchError(t('admin.users.detail.referral.searchError'));
    } finally {
      setReferralSearchLoading(false);
    }
  };

  const handleAttachReferral = async (referralUser: UserListItem) => {
    try {
      await onUpdateReferrals([referralUser.id], 'add');
      setReferralSearchResults((current) => current.filter((item) => item.id !== referralUser.id));
      setReferralSearch('');
      setReferralSearchError('');
    } catch {
      // Parent handler already shows the notification.
    }
  };

  const handleDetachReferral = async (referralUserId: number) => {
    try {
      await onUpdateReferrals([referralUserId], 'remove');
    } catch {
      // Parent handler already shows the notification.
    }
  };

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

      <div className="rounded-xl bg-dark-800/50 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-dark-200">
              {t('admin.users.detail.referralsList')}
            </div>
            <div className="text-xs text-dark-500">
              {t('admin.users.detail.referral.attachHint')}
            </div>
          </div>
          <span className="rounded-full bg-accent-500/10 px-2.5 py-1 text-xs font-medium text-accent-300">
            {user.referral.referrals_count}
          </span>
        </div>

        <div className="rounded-lg border border-dark-700/80 bg-dark-900/40 p-2">
          <div className="flex gap-2">
            <input
              value={referralSearch}
              onChange={(event) => {
                setReferralSearch(event.target.value);
                if (referralSearchError) {
                  setReferralSearchError('');
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleReferralSearch();
                }
              }}
              placeholder={t('admin.users.detail.referral.searchPlaceholder')}
              disabled={actionLoading || referralSearchLoading}
              className="input min-w-0 flex-1 text-sm"
            />
            <button
              type="button"
              onClick={() => void handleReferralSearch()}
              disabled={actionLoading || referralSearchLoading}
              className="shrink-0 rounded-lg bg-accent-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {referralSearchLoading
                ? t('common.loading')
                : t('admin.users.detail.referral.search')}
            </button>
          </div>

          {referralSearchError && (
            <div className="mt-2 text-xs text-dark-500">{referralSearchError}</div>
          )}

          {referralSearchResults.length > 0 && (
            <div className="mt-2 space-y-1">
              {referralSearchResults.map((referralUser) => (
                <div
                  key={referralUser.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-dark-800/80 p-2"
                >
                  <button
                    type="button"
                    onClick={() => onOpenUser(referralUser.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate text-sm text-dark-100">{referralUser.full_name}</div>
                    <div className="truncate text-xs text-dark-500">
                      {getReferralUserMeta(referralUser)}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleAttachReferral(referralUser)}
                    disabled={actionLoading}
                    className="shrink-0 rounded-lg bg-success-500/15 px-2.5 py-1.5 text-xs font-medium text-success-300 transition-colors hover:bg-success-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('admin.users.detail.referral.attach')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {referralsLoading ? (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="py-4 text-center text-xs text-dark-500">
            {t('admin.users.detail.noReferrals')}
          </div>
        ) : (
          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
            {referrals.map((referralUser) => (
              <div
                key={referralUser.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-dark-700/50 p-2 transition-colors hover:bg-dark-700"
              >
                <button
                  type="button"
                  onClick={() => onOpenUser(referralUser.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dark-600 text-xs font-bold text-dark-300">
                    {referralUser.first_name?.[0] || referralUser.username?.[0] || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm text-dark-100">{referralUser.full_name}</div>
                    <div className="truncate text-xs text-dark-500">
                      {formatDate(referralUser.created_at)} ·{' '}
                      {formatWithCurrency(referralUser.total_spent_kopeks / 100)}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => void handleDetachReferral(referralUser.id)}
                  disabled={actionLoading}
                  className="shrink-0 rounded-lg bg-error-500/10 px-2.5 py-1.5 text-xs font-medium text-error-300 transition-colors hover:bg-error-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('admin.users.detail.referral.detach')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
