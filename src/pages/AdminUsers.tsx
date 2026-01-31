import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useCurrency } from '../hooks/useCurrency';
import {
  adminUsersApi,
  type UserListItem,
  type UserDetailResponse,
  type UsersStatsResponse,
  type UserAvailableTariff,
  type PanelSyncStatusResponse,
  type UpdateSubscriptionRequest,
} from '../api/adminUsers';

// ============ Icons ============

const SearchIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const XMarkIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const RefreshIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const MinusIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
  </svg>
);

const SyncIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
    />
  </svg>
);

const TelegramIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

// ============ Components ============

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

function StatCard({ title, value, subtitle, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="mb-1 text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{title}</div>
      {subtitle && <div className="mt-1 text-xs opacity-60">{subtitle}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    blocked: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    deleted: 'bg-dark-600 text-dark-400 border-dark-500',
    trial: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    expired: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    disabled: 'bg-dark-600 text-dark-400 border-dark-500',
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${styles[status] || styles.active}`}>
      {status}
    </span>
  );
}

// ============ User List Component ============

interface UserRowProps {
  user: UserListItem;
  onSelect: (user: UserListItem) => void;
  formatAmount: (rubAmount: number) => string;
}

function UserRow({ user, onSelect, formatAmount }: UserRowProps) {
  const { t } = useTranslation();
  return (
    <div
      onClick={() => onSelect(user)}
      className="flex cursor-pointer items-center gap-4 rounded-xl border border-dark-700 bg-dark-800/50 p-4 transition-all hover:border-dark-600 hover:bg-dark-800"
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-medium text-white">
        {user.first_name?.[0] || user.username?.[0] || '?'}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="truncate font-medium text-dark-100">{user.full_name}</span>
          {user.username && <span className="text-xs text-dark-500">@{user.username}</span>}
        </div>
        <div className="flex items-center gap-3 text-xs text-dark-400">
          <span className="flex items-center gap-1">
            <TelegramIcon />
            {user.telegram_id}
          </span>
          {user.status !== 'active' && <StatusBadge status={user.status} />}
          {user.has_subscription && user.subscription_status && (
            <span
              className={`rounded-full border px-2 py-0.5 text-xs ${
                user.subscription_status === 'active'
                  ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                  : user.subscription_status === 'trial'
                    ? 'border-blue-500/30 bg-blue-500/20 text-blue-400'
                    : 'border-amber-500/30 bg-amber-500/20 text-amber-400'
              }`}
            >
              {user.subscription_status === 'active'
                ? t('admin.users.status.subscription')
                : user.subscription_status === 'trial'
                  ? t('admin.users.status.trial')
                  : t('admin.users.status.expired')}
            </span>
          )}
        </div>
      </div>

      {/* Balance */}
      <div className="shrink-0 text-right">
        <div className="font-medium text-dark-100">{formatAmount(user.balance_rubles)}</div>
        <div className="text-xs text-dark-500">
          {user.purchase_count > 0
            ? t('admin.users.purchaseCount', { count: user.purchase_count })
            : t('admin.users.noPurchases')}
        </div>
      </div>

      <ChevronRightIcon />
    </div>
  );
}

// ============ User Detail Modal ============

interface UserDetailModalProps {
  userId: number;
  onClose: () => void;
  onUpdate: () => void;
}

function UserDetailModal({ userId, onClose, onUpdate }: UserDetailModalProps) {
  const { t } = useTranslation();
  const { formatWithCurrency } = useCurrency();
  const localeMap: Record<string, string> = { ru: 'ru-RU', en: 'en-US', zh: 'zh-CN', fa: 'fa-IR' };
  const locale = localeMap[i18n.language] || 'ru-RU';
  const [user, setUser] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'subscription' | 'balance' | 'sync'>('info');
  const [syncStatus, setSyncStatus] = useState<PanelSyncStatusResponse | null>(null);
  const [tariffs, setTariffs] = useState<UserAvailableTariff[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Balance form
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceDescription, setBalanceDescription] = useState('');

  // Subscription form
  const [subAction, setSubAction] = useState<string>('extend');
  const [subDays, setSubDays] = useState('30');
  const [selectedTariffId, setSelectedTariffId] = useState<number | null>(null);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminUsersApi.getUser(userId);
      setUser(data);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadSyncStatus = useCallback(async () => {
    try {
      const data = await adminUsersApi.getSyncStatus(userId);
      setSyncStatus(data);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }, [userId]);

  const loadTariffs = useCallback(async () => {
    try {
      const data = await adminUsersApi.getAvailableTariffs(userId, true);
      setTariffs(data.tariffs);
    } catch (error) {
      console.error('Failed to load tariffs:', error);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (activeTab === 'sync') loadSyncStatus();
    if (activeTab === 'subscription') loadTariffs();
  }, [activeTab, loadSyncStatus, loadTariffs]);

  const handleUpdateBalance = async (isAdd: boolean) => {
    if (!balanceAmount) return;
    setActionLoading(true);
    try {
      const amount = Math.abs(parseFloat(balanceAmount) * 100);
      await adminUsersApi.updateBalance(userId, {
        amount_kopeks: isAdd ? amount : -amount,
        description:
          balanceDescription ||
          (isAdd
            ? t('admin.users.detail.balance.addByAdmin')
            : t('admin.users.detail.balance.subtractByAdmin')),
      });
      await loadUser();
      setBalanceAmount('');
      setBalanceDescription('');
      onUpdate();
    } catch (error) {
      console.error('Failed to update balance:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSubscription = async () => {
    setActionLoading(true);
    try {
      const data: UpdateSubscriptionRequest = {
        action: subAction as UpdateSubscriptionRequest['action'],
        ...(subAction === 'extend' ? { days: parseInt(subDays) } : {}),
        ...(subAction === 'change_tariff' && selectedTariffId
          ? { tariff_id: selectedTariffId }
          : {}),
        ...(subAction === 'create'
          ? {
              days: parseInt(subDays),
              ...(selectedTariffId ? { tariff_id: selectedTariffId } : {}),
            }
          : {}),
      };
      await adminUsersApi.updateSubscription(userId, data);
      await loadUser();
      onUpdate();
    } catch (error) {
      console.error('Failed to update subscription:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!confirm(t('admin.users.confirm.block'))) return;
    setActionLoading(true);
    try {
      await adminUsersApi.blockUser(userId);
      await loadUser();
      onUpdate();
    } catch (error) {
      console.error('Failed to block user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async () => {
    setActionLoading(true);
    try {
      await adminUsersApi.unblockUser(userId);
      await loadUser();
      onUpdate();
    } catch (error) {
      console.error('Failed to unblock user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncFromPanel = async () => {
    setActionLoading(true);
    try {
      await adminUsersApi.syncFromPanel(userId, {
        update_subscription: true,
        update_traffic: true,
      });
      await loadUser();
      await loadSyncStatus();
      onUpdate();
    } catch (error) {
      console.error('Failed to sync from panel:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncToPanel = async () => {
    setActionLoading(true);
    try {
      await adminUsersApi.syncToPanel(userId, { create_if_missing: true });
      await loadUser();
      await loadSyncStatus();
      onUpdate();
    } catch (error) {
      console.error('Failed to sync to panel:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
        <div className="rounded-2xl bg-dark-800 p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-dark-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white">
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
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-dark-700">
            <XMarkIcon />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-700">
          {(['info', 'subscription', 'balance', 'sync'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-400 text-blue-400'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              {tab === 'info' && t('admin.users.detail.tabs.info')}
              {tab === 'subscription' && t('admin.users.detail.tabs.subscription')}
              {tab === 'balance' && t('admin.users.detail.tabs.balance')}
              {tab === 'sync' && t('admin.users.detail.tabs.sync')}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between rounded-xl bg-dark-900/50 p-3">
                <span className="text-dark-400">{t('admin.users.detail.status')}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={user.status} />
                  {user.status === 'active' ? (
                    <button
                      onClick={handleBlockUser}
                      disabled={actionLoading}
                      className="rounded-lg bg-rose-500/20 px-3 py-1 text-xs text-rose-400 transition-colors hover:bg-rose-500/30"
                    >
                      {t('admin.users.actions.block')}
                    </button>
                  ) : user.status === 'blocked' ? (
                    <button
                      onClick={handleUnblockUser}
                      disabled={actionLoading}
                      className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/30"
                    >
                      {t('admin.users.actions.unblock')}
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-dark-900/50 p-3">
                  <div className="mb-1 text-xs text-dark-500">Email</div>
                  <div className="text-dark-100">{user.email || '-'}</div>
                </div>
                <div className="rounded-xl bg-dark-900/50 p-3">
                  <div className="mb-1 text-xs text-dark-500">
                    {t('admin.users.detail.language')}
                  </div>
                  <div className="text-dark-100">{user.language}</div>
                </div>
                <div className="rounded-xl bg-dark-900/50 p-3">
                  <div className="mb-1 text-xs text-dark-500">
                    {t('admin.users.detail.registration')}
                  </div>
                  <div className="text-dark-100">{formatDate(user.created_at)}</div>
                </div>
                <div className="rounded-xl bg-dark-900/50 p-3">
                  <div className="mb-1 text-xs text-dark-500">
                    {t('admin.users.detail.lastActivity')}
                  </div>
                  <div className="text-dark-100">{formatDate(user.last_activity)}</div>
                </div>
                <div className="rounded-xl bg-dark-900/50 p-3">
                  <div className="mb-1 text-xs text-dark-500">
                    {t('admin.users.detail.totalSpent')}
                  </div>
                  <div className="text-dark-100">
                    {formatWithCurrency(user.total_spent_kopeks / 100)}
                  </div>
                </div>
                <div className="rounded-xl bg-dark-900/50 p-3">
                  <div className="mb-1 text-xs text-dark-500">
                    {t('admin.users.detail.purchases')}
                  </div>
                  <div className="text-dark-100">{user.purchase_count}</div>
                </div>
              </div>

              {/* Referral */}
              <div className="rounded-xl bg-dark-900/50 p-3">
                <div className="mb-2 text-sm font-medium text-dark-200">
                  {t('admin.users.detail.referral.title')}
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-dark-100">
                      {user.referral.referrals_count}
                    </div>
                    <div className="text-xs text-dark-500">
                      {t('admin.users.detail.referral.referrals')}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-dark-100">
                      {formatWithCurrency(user.referral.total_earnings_kopeks / 100)}
                    </div>
                    <div className="text-xs text-dark-500">
                      {t('admin.users.detail.referral.earned')}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-dark-100">
                      {user.referral.commission_percent || 0}%
                    </div>
                    <div className="text-xs text-dark-500">
                      {t('admin.users.detail.referral.commission')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Restrictions */}
              {(user.restriction_topup || user.restriction_subscription) && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                  <div className="mb-2 text-sm font-medium text-rose-400">
                    {t('admin.users.detail.restrictions.title')}
                  </div>
                  {user.restriction_topup && (
                    <div className="text-xs text-rose-300">
                      {t('admin.users.detail.restrictions.topup')}
                    </div>
                  )}
                  {user.restriction_subscription && (
                    <div className="text-xs text-rose-300">
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
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-4">
              {user.subscription ? (
                <>
                  {/* Current subscription */}
                  <div className="rounded-xl bg-dark-900/50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-medium text-dark-200">
                        {t('admin.users.detail.subscription.current')}
                      </span>
                      <StatusBadge status={user.subscription.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-dark-500">
                          {t('admin.users.detail.subscription.tariff')}
                        </div>
                        <div className="text-dark-100">
                          {user.subscription.tariff_name ||
                            t('admin.users.detail.subscription.notSpecified')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500">
                          {t('admin.users.detail.subscription.validUntil')}
                        </div>
                        <div className="text-dark-100">
                          {formatDate(user.subscription.end_date)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500">
                          {t('admin.users.detail.subscription.traffic')}
                        </div>
                        <div className="text-dark-100">
                          {user.subscription.traffic_used_gb.toFixed(1)} /{' '}
                          {user.subscription.traffic_limit_gb} {t('common.units.gb')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500">
                          {t('admin.users.detail.subscription.devices')}
                        </div>
                        <div className="text-dark-100">{user.subscription.device_limit}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="rounded-xl bg-dark-900/50 p-4">
                    <div className="mb-3 font-medium text-dark-200">
                      {t('admin.users.detail.subscription.actions')}
                    </div>
                    <div className="space-y-3">
                      <select
                        value={subAction}
                        onChange={(e) => setSubAction(e.target.value)}
                        className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-dark-100"
                      >
                        <option value="extend">
                          {t('admin.users.detail.subscription.extend')}
                        </option>
                        <option value="change_tariff">
                          {t('admin.users.detail.subscription.changeTariff')}
                        </option>
                        <option value="cancel">
                          {t('admin.users.detail.subscription.cancel')}
                        </option>
                        <option value="activate">
                          {t('admin.users.detail.subscription.activate')}
                        </option>
                      </select>

                      {subAction === 'extend' && (
                        <input
                          type="number"
                          value={subDays}
                          onChange={(e) => setSubDays(e.target.value)}
                          placeholder={t('admin.users.detail.subscription.days')}
                          className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-dark-100"
                        />
                      )}

                      {subAction === 'change_tariff' && (
                        <select
                          value={selectedTariffId || ''}
                          onChange={(e) =>
                            setSelectedTariffId(e.target.value ? parseInt(e.target.value) : null)
                          }
                          className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-dark-100"
                        >
                          <option value="">
                            {t('admin.users.detail.subscription.selectTariff')}
                          </option>
                          {tariffs.map((tariffItem) => (
                            <option key={tariffItem.id} value={tariffItem.id}>
                              {tariffItem.name}{' '}
                              {!tariffItem.is_available &&
                                t('admin.users.detail.subscription.unavailable')}
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        onClick={handleUpdateSubscription}
                        disabled={actionLoading}
                        className="w-full rounded-lg bg-blue-500 py-2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                      >
                        {actionLoading
                          ? t('admin.users.actions.applying')
                          : t('admin.users.actions.apply')}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl bg-dark-900/50 p-4">
                  <div className="mb-4 text-center text-dark-400">
                    {t('admin.users.detail.subscription.noActive')}
                  </div>
                  <div className="space-y-3">
                    <select
                      value={selectedTariffId || ''}
                      onChange={(e) =>
                        setSelectedTariffId(e.target.value ? parseInt(e.target.value) : null)
                      }
                      className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-dark-100"
                    >
                      <option value="">{t('admin.users.detail.subscription.selectTariff')}</option>
                      {tariffs.map((tariffItem) => (
                        <option key={tariffItem.id} value={tariffItem.id}>
                          {tariffItem.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={subDays}
                      onChange={(e) => setSubDays(e.target.value)}
                      placeholder={t('admin.users.detail.subscription.days')}
                      className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-dark-100"
                    />
                    <button
                      onClick={() => {
                        setSubAction('create');
                        handleUpdateSubscription();
                      }}
                      disabled={actionLoading}
                      className="w-full rounded-lg bg-emerald-500 py-2 text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {actionLoading
                        ? t('admin.users.detail.subscription.creating')
                        : t('admin.users.detail.subscription.create')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Balance Tab */}
          {activeTab === 'balance' && (
            <div className="space-y-4">
              {/* Current balance */}
              <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4">
                <div className="mb-1 text-sm text-dark-400">
                  {t('admin.users.detail.balance.current')}
                </div>
                <div className="text-3xl font-bold text-dark-100">
                  {formatWithCurrency(user.balance_rubles)}
                </div>
              </div>

              {/* Add/subtract form */}
              <div className="space-y-3 rounded-xl bg-dark-900/50 p-4">
                <input
                  type="number"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder={t('admin.users.detail.balance.amountPlaceholder')}
                  className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-dark-100"
                />
                <input
                  type="text"
                  value={balanceDescription}
                  onChange={(e) => setBalanceDescription(e.target.value)}
                  placeholder={t('admin.users.detail.balance.descriptionPlaceholder')}
                  className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-dark-100"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateBalance(true)}
                    disabled={actionLoading || !balanceAmount}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2 text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                  >
                    <PlusIcon /> {t('admin.users.detail.balance.add')}
                  </button>
                  <button
                    onClick={() => handleUpdateBalance(false)}
                    disabled={actionLoading || !balanceAmount}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-500 py-2 text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
                  >
                    <MinusIcon /> {t('admin.users.detail.balance.subtract')}
                  </button>
                </div>
              </div>

              {/* Recent transactions */}
              {user.recent_transactions.length > 0 && (
                <div className="rounded-xl bg-dark-900/50 p-4">
                  <div className="mb-3 font-medium text-dark-200">
                    {t('admin.users.detail.balance.recentTransactions')}
                  </div>
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {user.recent_transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between border-b border-dark-700 py-2 last:border-0"
                      >
                        <div>
                          <div className="text-sm text-dark-200">{tx.description || tx.type}</div>
                          <div className="text-xs text-dark-500">{formatDate(tx.created_at)}</div>
                        </div>
                        <div
                          className={tx.amount_kopeks >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                        >
                          {tx.amount_kopeks >= 0 ? '+' : ''}
                          {formatWithCurrency(tx.amount_rubles)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sync Tab */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              {/* Sync status */}
              {syncStatus && (
                <div
                  className={`rounded-xl border p-4 ${syncStatus.has_differences ? 'border-amber-500/30 bg-amber-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}
                >
                  <div className="mb-3 flex items-center gap-2">
                    {syncStatus.has_differences ? (
                      <span className="font-medium text-amber-400">
                        {t('admin.users.detail.sync.hasDifferences')}
                      </span>
                    ) : (
                      <span className="font-medium text-emerald-400">
                        {t('admin.users.detail.sync.synced')}
                      </span>
                    )}
                  </div>

                  {syncStatus.differences.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {syncStatus.differences.map((diff, i) => (
                        <div key={i} className="text-xs text-dark-300">
                          • {diff}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="mb-2 text-xs text-dark-500">
                        {t('admin.users.detail.sync.bot')}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-dark-400">
                            {t('admin.users.detail.sync.statusLabel')}:
                          </span>
                          <span className="text-dark-200">
                            {syncStatus.bot_subscription_status || '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-400">
                            {t('admin.users.detail.sync.until')}:
                          </span>
                          <span className="text-dark-200">
                            {syncStatus.bot_subscription_end_date
                              ? new Date(syncStatus.bot_subscription_end_date).toLocaleDateString(
                                  locale,
                                )
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-400">
                            {t('admin.users.detail.sync.traffic')}:
                          </span>
                          <span className="text-dark-200">
                            {syncStatus.bot_traffic_used_gb.toFixed(2)} {t('common.units.gb')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-400">
                            {t('admin.users.detail.sync.devices')}:
                          </span>
                          <span className="text-dark-200">{syncStatus.bot_device_limit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-400">
                            {t('admin.users.detail.sync.squads')}:
                          </span>
                          <span className="text-dark-200">
                            {syncStatus.bot_squads?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 text-xs text-dark-500">
                        {t('admin.users.detail.sync.panel')}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-dark-400">
                            {t('admin.users.detail.sync.statusLabel')}:
                          </span>
                          <span className="text-dark-200">{syncStatus.panel_status || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-400">
                            {t('admin.users.detail.sync.until')}:
                          </span>
                          <span className="text-dark-200">
                            {syncStatus.panel_expire_at
                              ? new Date(syncStatus.panel_expire_at).toLocaleDateString(locale)
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-400">
                            {t('admin.users.detail.sync.traffic')}:
                          </span>
                          <span className="text-dark-200">
                            {syncStatus.panel_traffic_used_gb.toFixed(2)} {t('common.units.gb')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-400">
                            {t('admin.users.detail.sync.devices')}:
                          </span>
                          <span className="text-dark-200">{syncStatus.panel_device_limit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-400">
                            {t('admin.users.detail.sync.squads')}:
                          </span>
                          <span className="text-dark-200">
                            {syncStatus.panel_squads?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* UUID info */}
              <div className="rounded-xl bg-dark-900/50 p-4">
                <div className="mb-1 text-sm text-dark-400">Remnawave UUID</div>
                <div className="break-all font-mono text-sm text-dark-100">
                  {syncStatus?.remnawave_uuid ||
                    user.remnawave_uuid ||
                    t('admin.users.detail.sync.notLinked')}
                </div>
              </div>

              {/* Sync buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSyncFromPanel}
                  disabled={actionLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/20 py-3 text-blue-400 transition-colors hover:bg-blue-500/30 disabled:opacity-50"
                >
                  <SyncIcon className={actionLoading ? 'animate-spin' : ''} />
                  {t('admin.users.detail.sync.fromPanel')}
                </button>
                <button
                  onClick={handleSyncToPanel}
                  disabled={actionLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/20 py-3 text-purple-400 transition-colors hover:bg-purple-500/30 disabled:opacity-50"
                >
                  <SyncIcon className={actionLoading ? 'animate-spin' : ''} />
                  {t('admin.users.detail.sync.toPanel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Main Page ============

export default function AdminUsers() {
  const { t } = useTranslation();
  const { formatWithCurrency } = useCurrency();

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [stats, setStats] = useState<UsersStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const limit = 20;

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { offset, limit, sort_by: sortBy };
      if (search) params.search = search;
      if (emailSearch) params.email = emailSearch;
      if (statusFilter) params.status = statusFilter;

      const data = await adminUsersApi.getUsers(
        params as Parameters<typeof adminUsersApi.getUsers>[0],
      );
      setUsers(data.users);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }, [offset, search, emailSearch, statusFilter, sortBy]);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminUsersApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    loadUsers();
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-700 bg-dark-800 transition-colors hover:border-dark-600"
          >
            <ChevronLeftIcon />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-dark-100">{t('admin.users.title')}</h1>
            <p className="text-sm text-dark-400">{t('admin.users.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => {
            loadUsers();
            loadStats();
          }}
          className="rounded-lg p-2 transition-colors hover:bg-dark-700"
        >
          <RefreshIcon className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard title={t('admin.users.stats.total')} value={stats.total_users} color="blue" />
          <StatCard
            title={t('admin.users.stats.active')}
            value={stats.active_users}
            color="green"
          />
          <StatCard
            title={t('admin.users.stats.withSubscription')}
            value={stats.users_with_active_subscription}
            color="purple"
          />
          <StatCard
            title={t('admin.users.stats.newToday')}
            value={stats.new_today}
            color="yellow"
          />
          <StatCard
            title={t('admin.users.stats.blocked')}
            value={stats.blocked_users}
            color="red"
          />
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3">
        {/* Search fields row */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.users.search')}
                className="w-full rounded-xl border border-dark-700 bg-dark-800 py-2 pl-10 pr-4 text-dark-100 placeholder-dark-500 focus:border-dark-600 focus:outline-none"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500">
                <SearchIcon />
              </div>
            </div>
          </form>
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="email"
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                placeholder={t('admin.users.searchEmail')}
                className="w-full rounded-xl border border-dark-700 bg-dark-800 py-2 pl-10 pr-4 text-dark-100 placeholder-dark-500 focus:border-dark-600 focus:outline-none"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500">
                <SearchIcon />
              </div>
            </div>
          </form>
        </div>
        {/* Filters row */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setOffset(0);
            }}
            className="rounded-xl border border-dark-700 bg-dark-800 px-3 py-2 text-dark-100"
          >
            <option value="">{t('admin.users.filters.allStatuses')}</option>
            <option value="active">{t('admin.users.status.active')}</option>
            <option value="blocked">{t('admin.users.status.blocked')}</option>
            <option value="deleted">{t('admin.users.status.deleted')}</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setOffset(0);
            }}
            className="rounded-xl border border-dark-700 bg-dark-800 px-3 py-2 text-dark-100"
          >
            <option value="created_at">{t('admin.users.filters.byDate')}</option>
            <option value="balance">{t('admin.users.filters.byBalance')}</option>
            <option value="last_activity">{t('admin.users.filters.byActivity')}</option>
            <option value="total_spent">{t('admin.users.filters.bySpent')}</option>
          </select>
        </div>
      </div>

      {/* Users list */}
      <div className="mb-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-dark-400">{t('admin.users.noData')}</div>
        ) : (
          users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onSelect={(u) => setSelectedUserId(u.id)}
              formatAmount={(amount) => formatWithCurrency(amount)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-dark-400">
            {t('admin.users.pagination.showing', {
              from: offset + 1,
              to: Math.min(offset + limit, total),
              total,
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="rounded-lg border border-dark-700 bg-dark-800 p-2 transition-colors hover:bg-dark-700 disabled:opacity-50"
            >
              <ChevronLeftIcon />
            </button>
            <span className="px-3 py-2 text-dark-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="rounded-lg border border-dark-700 bg-dark-800 p-2 transition-colors hover:bg-dark-700 disabled:opacity-50"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      )}

      {/* User detail modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUpdate={() => {
            loadUsers();
            loadStats();
          }}
        />
      )}
    </div>
  );
}
