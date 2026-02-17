import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useCurrency } from '../hooks/useCurrency';
import { useNotify } from '../platform/hooks/useNotify';
import {
  adminUsersApi,
  type UserDetailResponse,
  type UserAvailableTariff,
  type UserListItem,
  type UserPanelInfo,
  type UserNodeUsageResponse,
  type PanelSyncStatusResponse,
  type UpdateSubscriptionRequest,
} from '../api/adminUsers';
import { adminApi, type AdminTicket, type AdminTicketDetail } from '../api/admin';
import { promocodesApi, type PromoGroup } from '../api/promocodes';
import { promoOffersApi } from '../api/promoOffers';
import { AdminBackButton } from '../components/admin';
import { createNumberInputHandler, toNumber } from '../utils/inputHelpers';
import { AdminUserTicketsTab } from './adminUserDetail/components/AdminUserTicketsTab';
import { AdminUserBalanceTab } from './adminUserDetail/components/AdminUserBalanceTab';
import { AdminUserInfoTab } from './adminUserDetail/components/AdminUserInfoTab';
import { AdminUserSyncTab } from './adminUserDetail/components/AdminUserSyncTab';
import { MinusIcon, PlusIcon, RefreshIcon, TelegramIcon } from './adminUserDetail/components/Icons';
import { StatusBadge } from './adminUserDetail/components/StatusBadge';
import { getCountryFlag } from './adminUserDetail/utils/countryFlags';
import {
  formatBytes,
  formatDateTime,
  getUserDetailLocale,
} from './adminUserDetail/utils/formatters';

export default function AdminUserDetail() {
  const { t } = useTranslation();
  const { formatWithCurrency } = useCurrency();
  const navigate = useNavigate();
  const notify = useNotify();
  const { id } = useParams<{ id: string }>();

  const locale = getUserDetailLocale(i18n.language);

  const [user, setUser] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'info' | 'subscription' | 'balance' | 'sync' | 'tickets'
  >('info');
  const [syncStatus, setSyncStatus] = useState<PanelSyncStatusResponse | null>(null);
  const [tariffs, setTariffs] = useState<UserAvailableTariff[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Referrals
  const [referrals, setReferrals] = useState<UserListItem[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(false);

  // Panel info & node usage
  const [panelInfo, setPanelInfo] = useState<UserPanelInfo | null>(null);
  const [panelInfoLoading, setPanelInfoLoading] = useState(false);
  const [nodeUsage, setNodeUsage] = useState<UserNodeUsageResponse | null>(null);
  const [nodeUsageDays, setNodeUsageDays] = useState(7);

  // Inline confirm state
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Balance form
  const [balanceAmount, setBalanceAmount] = useState<number | ''>('');
  const [balanceDescription, setBalanceDescription] = useState('');

  // Tickets
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsTotal, setTicketsTotal] = useState(0);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<AdminTicketDetail | null>(null);
  const [ticketDetailLoading, setTicketDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Subscription form
  const [subAction, setSubAction] = useState<string>('extend');
  const [subDays, setSubDays] = useState<number | ''>(30);
  const [selectedTariffId, setSelectedTariffId] = useState<number | null>(null);

  // Promo group
  const [promoGroups, setPromoGroups] = useState<PromoGroup[]>([]);
  const [editingPromoGroup, setEditingPromoGroup] = useState(false);

  // Referral commission
  const [editingReferralCommission, setEditingReferralCommission] = useState(false);
  const [referralCommissionValue, setReferralCommissionValue] = useState<number | ''>('');

  // Send promo offer
  const [offerDiscountPercent, setOfferDiscountPercent] = useState<number | ''>('');
  const [offerValidHours, setOfferValidHours] = useState<number | ''>(24);
  const [offerSending, setOfferSending] = useState(false);

  // Traffic packages
  const [selectedTrafficGb, setSelectedTrafficGb] = useState<string>('');

  // Devices
  const [devices, setDevices] = useState<
    { hwid: string; platform: string; device_model: string; created_at: string | null }[]
  >([]);
  const [devicesTotal, setDevicesTotal] = useState(0);
  const [deviceLimit, setDeviceLimit] = useState(0);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const userId = id ? parseInt(id, 10) : null;

  const loadUser = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await adminUsersApi.getUser(userId);
      setUser(data);
    } catch (error) {
      console.error('Failed to load user:', error);
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  }, [userId, navigate]);

  const loadSyncStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await adminUsersApi.getSyncStatus(userId);
      setSyncStatus(data);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }, [userId]);

  const loadTariffs = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await adminUsersApi.getAvailableTariffs(userId, true);
      setTariffs(data.tariffs);
    } catch (error) {
      console.error('Failed to load tariffs:', error);
    }
  }, [userId]);

  const loadTickets = useCallback(async () => {
    if (!userId) return;
    try {
      setTicketsLoading(true);
      const data = await adminApi.getTickets({ user_id: userId, per_page: 50 });
      setTickets(data.items);
      setTicketsTotal(data.total);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setTicketsLoading(false);
    }
  }, [userId]);

  const loadTicketDetail = useCallback(async (ticketId: number) => {
    try {
      setTicketDetailLoading(true);
      const data = await adminApi.getTicket(ticketId);
      setSelectedTicket(data);
    } catch (error) {
      console.error('Failed to load ticket detail:', error);
    } finally {
      setTicketDetailLoading(false);
    }
  }, []);

  const loadReferrals = useCallback(async () => {
    if (!userId) return;
    try {
      setReferralsLoading(true);
      const data = await adminUsersApi.getReferrals(userId, 0, 50);
      setReferrals(data.users);
    } catch {
      // ignore
    } finally {
      setReferralsLoading(false);
    }
  }, [userId]);

  const loadPanelInfo = useCallback(async () => {
    if (!userId) return;
    try {
      setPanelInfoLoading(true);
      const data = await adminUsersApi.getPanelInfo(userId);
      setPanelInfo(data);
    } catch {
      // ignore
    } finally {
      setPanelInfoLoading(false);
    }
  }, [userId]);

  const loadNodeUsage = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await adminUsersApi.getNodeUsage(userId);
      setNodeUsage(data);
    } catch {
      // ignore
    }
  }, [userId]);

  const loadDevices = useCallback(async () => {
    if (!userId) return;
    try {
      setDevicesLoading(true);
      const data = await adminUsersApi.getUserDevices(userId);
      setDevices(data.devices);
      setDevicesTotal(data.total);
      setDeviceLimit(data.device_limit);
    } catch {
      // ignore
    } finally {
      setDevicesLoading(false);
    }
  }, [userId]);

  const loadSubscriptionData = useCallback(async () => {
    await Promise.all([loadPanelInfo(), loadNodeUsage(), loadDevices()]);
  }, [loadPanelInfo, loadNodeUsage, loadDevices]);

  const loadPromoGroups = useCallback(async () => {
    try {
      const data = await promocodesApi.getPromoGroups({ limit: 100 });
      setPromoGroups(data.items);
    } catch {
      // ignore
    }
  }, []);

  const handleTicketReply = async () => {
    if (!selectedTicketId || !replyText.trim()) return;
    setReplySending(true);
    try {
      await adminApi.replyToTicket(selectedTicketId, replyText);
      setReplyText('');
      await loadTicketDetail(selectedTicketId);
      await loadTickets();
    } catch (error) {
      console.error('Failed to reply:', error);
    } finally {
      setReplySending(false);
    }
  };

  const handleTicketStatusChange = async (newStatus: string) => {
    if (!selectedTicketId) return;
    setActionLoading(true);
    try {
      await adminApi.updateTicketStatus(selectedTicketId, newStatus);
      await loadTicketDetail(selectedTicketId);
      await loadTickets();
    } catch (error) {
      console.error('Failed to update ticket status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTicketId) {
      loadTicketDetail(selectedTicketId);
    }
  }, [selectedTicketId, loadTicketDetail]);

  useEffect(() => {
    if (selectedTicket && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (!userId || isNaN(userId)) {
      navigate('/admin/users');
      return;
    }
    loadUser();
  }, [userId, loadUser, navigate]);

  useEffect(() => {
    if (activeTab === 'info') {
      loadReferrals();
      loadPromoGroups();
    }
    if (activeTab === 'sync') loadSyncStatus();
    if (activeTab === 'subscription') {
      loadTariffs();
      loadSubscriptionData();
    }
    if (activeTab === 'tickets') loadTickets();
  }, [
    activeTab,
    loadSyncStatus,
    loadTariffs,
    loadTickets,
    loadReferrals,
    loadSubscriptionData,
    loadPromoGroups,
  ]);

  const handleUpdateBalance = async (isAdd: boolean) => {
    if (balanceAmount === '' || !userId) return;
    setActionLoading(true);
    try {
      const amount = Math.abs(toNumber(balanceAmount) * 100);
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
    } catch (error) {
      console.error('Failed to update balance:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSubscription = async (overrideAction?: string) => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const action = overrideAction || subAction;
      const data: UpdateSubscriptionRequest = {
        action: action as UpdateSubscriptionRequest['action'],
        ...(action === 'extend' ? { days: toNumber(subDays, 30) } : {}),
        ...(action === 'change_tariff' && selectedTariffId ? { tariff_id: selectedTariffId } : {}),
        ...(action === 'create'
          ? {
              days: toNumber(subDays, 30),
              ...(selectedTariffId ? { tariff_id: selectedTariffId } : {}),
            }
          : {}),
      };
      await adminUsersApi.updateSubscription(userId, data);
      await loadUser();
    } catch (error) {
      console.error('Failed to update subscription:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!userId || !confirm(t('admin.users.confirm.block'))) return;
    setActionLoading(true);
    try {
      await adminUsersApi.blockUser(userId);
      await loadUser();
    } catch (error) {
      console.error('Failed to block user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await adminUsersApi.unblockUser(userId);
      await loadUser();
    } catch (error) {
      console.error('Failed to unblock user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncFromPanel = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await adminUsersApi.syncFromPanel(userId, {
        update_subscription: true,
        update_traffic: true,
      });
      await loadUser();
      await loadSyncStatus();
    } catch (error) {
      console.error('Failed to sync from panel:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncToPanel = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await adminUsersApi.syncToPanel(userId, { create_if_missing: true });
      await loadUser();
      await loadSyncStatus();
    } catch (error) {
      console.error('Failed to sync to panel:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInlineConfirm = (actionKey: string, executeFn: () => Promise<void>) => {
    if (confirmingAction === actionKey) {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      setConfirmingAction(null);
      executeFn().catch(() => {});
    } else {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      setConfirmingAction(actionKey);
      confirmTimerRef.current = setTimeout(() => setConfirmingAction(null), 3000);
    }
  };

  const handleDeleteDevice = async (hwid: string) => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await adminUsersApi.deleteUserDevice(userId, hwid);
      notify.success(t('admin.users.detail.devices.deleted'));
      await loadDevices();
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetDevices = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await adminUsersApi.resetUserDevices(userId);
      notify.success(t('admin.users.detail.devices.allDeleted'));
      await loadDevices();
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddTraffic = async (gb: number) => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await adminUsersApi.updateSubscription(userId, { action: 'add_traffic', traffic_gb: gb });
      notify.success(t('admin.users.detail.subscription.trafficAdded'));
      setSelectedTrafficGb('');
      await loadUser();
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveTraffic = async (purchaseId: number) => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await adminUsersApi.updateSubscription(userId, {
        action: 'remove_traffic',
        traffic_purchase_id: purchaseId,
      });
      notify.success(t('admin.users.detail.subscription.trafficRemoved'));
      await loadUser();
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDeviceLimit = async (newLimit: number) => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await adminUsersApi.updateSubscription(userId, {
        action: 'set_device_limit',
        device_limit: newLimit,
      });
      notify.success(t('admin.users.detail.subscription.deviceLimitUpdated'));
      await loadUser();
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const currentTariff = tariffs.find((t) => t.id === user?.subscription?.tariff_id) || null;

  const handleChangePromoGroup = async (groupId: number | null) => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await adminUsersApi.updatePromoGroup(userId, groupId);
      await loadUser();
      setEditingPromoGroup(false);
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateReferralCommission = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const value = referralCommissionValue === '' ? null : toNumber(referralCommissionValue);
      if (value !== null && (value < 0 || value > 100)) {
        notify.error(t('admin.users.detail.referral.invalidPercent'), t('common.error'));
        return;
      }
      await adminUsersApi.updateReferralCommission(userId, value);
      await loadUser();
      setEditingReferralCommission(false);
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateOffer = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await promocodesApi.deactivateDiscount(userId);
      notify.success(t('admin.users.detail.offerDeactivated'), t('common.success'));
      await loadUser();
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendOffer = async () => {
    if (!userId || offerDiscountPercent === '' || offerValidHours === '') return;
    setOfferSending(true);
    try {
      await promoOffersApi.broadcastOffer({
        user_id: userId,
        notification_type: 'admin_personal',
        discount_percent: toNumber(offerDiscountPercent),
        valid_hours: toNumber(offerValidHours, 24),
        effect_type: 'percent_discount',
        send_notification: true,
      });
      notify.success(t('admin.users.detail.offerSent'), t('common.success'));
      setOfferDiscountPercent('');
      setOfferValidHours(24);
      await loadUser();
    } catch {
      notify.error(t('admin.users.detail.offerSendError'), t('common.error'));
    } finally {
      setOfferSending(false);
    }
  };

  const handleResetTrial = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const result = await adminUsersApi.resetTrial(userId);
      if (result.success) {
        notify.success(t('admin.users.userActions.success.resetTrial'), t('common.success'));
        await loadUser();
      } else {
        notify.error(result.message || t('admin.users.userActions.error'), t('common.error'));
      }
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetSubscription = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const result = await adminUsersApi.resetSubscription(userId);
      if (result.success) {
        notify.success(t('admin.users.userActions.success.resetSubscription'), t('common.success'));
        await loadUser();
      } else {
        notify.error(result.message || t('admin.users.userActions.error'), t('common.error'));
      }
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableUser = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const result = await adminUsersApi.disableUser(userId);
      if (result.success) {
        notify.success(t('admin.users.userActions.success.disable'), t('common.success'));
        await loadUser();
      } else {
        notify.error(result.message || t('admin.users.userActions.error'), t('common.error'));
      }
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleFullDeleteUser = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const result = await adminUsersApi.fullDeleteUser(userId);
      if (result.success) {
        notify.success(t('admin.users.userActions.success.delete'), t('common.success'));
        navigate('/admin/users');
      } else {
        notify.error(result.message || t('admin.users.userActions.error'), t('common.error'));
      }
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date: string | null) => formatDateTime(date, locale);

  // Compute node usage for selected period from cached 30-day data
  const nodeUsageForPeriod = (() => {
    if (!nodeUsage || nodeUsage.items.length === 0) return [];
    return nodeUsage.items
      .map((item) => {
        const daily = item.daily_bytes || [];
        const sliced = daily.slice(-nodeUsageDays);
        const total = sliced.reduce((sum, v) => sum + v, 0);
        return { ...item, total_bytes: total };
      })
      .sort((a, b) => b.total_bytes - a.total_bytes);
  })();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify.success(t('admin.users.detail.copied'));
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-dark-400">{t('admin.users.notFound')}</p>
        <button
          onClick={() => navigate('/admin/users')}
          className="rounded-lg bg-accent-500 px-4 py-2 text-white transition-colors hover:bg-accent-600"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
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
        <button onClick={loadUser} className="rounded-lg p-2 transition-colors hover:bg-dark-700">
          <RefreshIcon className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div
        className="scrollbar-hide -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 py-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {(['info', 'subscription', 'balance', 'sync', 'tickets'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/30'
                : 'bg-dark-800/50 text-dark-400 active:bg-dark-700'
            }`}
          >
            {tab === 'info' && t('admin.users.detail.tabs.info')}
            {tab === 'subscription' && t('admin.users.detail.tabs.subscription')}
            {tab === 'balance' && t('admin.users.detail.tabs.balance')}
            {tab === 'sync' && t('admin.users.detail.tabs.sync')}
            {tab === 'tickets' && t('admin.users.detail.tabs.tickets')}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Info Tab */}
        {activeTab === 'info' && (
          <AdminUserInfoTab
            user={user}
            actionLoading={actionLoading}
            formatDate={formatDate}
            formatWithCurrency={formatWithCurrency}
            promoGroups={promoGroups}
            editingPromoGroup={editingPromoGroup}
            setEditingPromoGroup={setEditingPromoGroup}
            onChangePromoGroup={handleChangePromoGroup}
            editingReferralCommission={editingReferralCommission}
            setEditingReferralCommission={setEditingReferralCommission}
            referralCommissionValue={referralCommissionValue}
            setReferralCommissionValue={setReferralCommissionValue}
            onUpdateReferralCommission={handleUpdateReferralCommission}
            referralsLoading={referralsLoading}
            referrals={referrals}
            onOpenUser={(userId) => navigate(`/admin/users/${userId}`)}
            onBlockUser={handleBlockUser}
            onUnblockUser={handleUnblockUser}
            confirmingAction={confirmingAction}
            onConfirmResetTrial={() => handleInlineConfirm('resetTrial', handleResetTrial)}
            onConfirmResetSubscription={() =>
              handleInlineConfirm('resetSubscription', handleResetSubscription)
            }
            onConfirmDisable={() => handleInlineConfirm('disable', handleDisableUser)}
            onConfirmFullDelete={() => handleInlineConfirm('fullDelete', handleFullDeleteUser)}
          />
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-4">
            {user.subscription ? (
              <>
                {/* Current subscription */}
                <div className="rounded-xl bg-dark-800/50 p-4">
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
                      <div className="text-dark-100">{formatDate(user.subscription.end_date)}</div>
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSetDeviceLimit(user.subscription!.device_limit - 1)}
                          disabled={actionLoading || user.subscription.device_limit <= 1}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-dark-700 text-dark-300 transition-colors hover:bg-dark-600 disabled:opacity-30"
                        >
                          <MinusIcon />
                        </button>
                        <span className="min-w-[2ch] text-center text-dark-100">
                          {user.subscription.device_limit}
                        </span>
                        <button
                          onClick={() => handleSetDeviceLimit(user.subscription!.device_limit + 1)}
                          disabled={
                            actionLoading ||
                            (currentTariff?.max_device_limit != null &&
                              user.subscription.device_limit >= currentTariff.max_device_limit)
                          }
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-dark-700 text-dark-300 transition-colors hover:bg-dark-600 disabled:opacity-30"
                        >
                          <PlusIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Traffic Packages */}
                {user.subscription.traffic_purchases &&
                  user.subscription.traffic_purchases.length > 0 && (
                    <div className="rounded-xl bg-dark-800/50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-dark-200">
                          {t('admin.users.detail.subscription.trafficPackages')}
                          {user.subscription.purchased_traffic_gb > 0 && (
                            <span className="ml-2 text-xs text-dark-400">
                              ({user.subscription.purchased_traffic_gb} {t('common.units.gb')})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {user.subscription.traffic_purchases.map((tp) => (
                          <div
                            key={tp.id}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                              tp.is_expired ? 'bg-dark-700/30 opacity-60' : 'bg-dark-700/50'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-sm text-dark-200">
                                <span className="font-medium">
                                  {tp.traffic_gb} {t('common.units.gb')}
                                </span>
                                {tp.is_expired ? (
                                  <span className="rounded-full bg-error-500/20 px-1.5 py-0.5 text-[10px] text-error-400">
                                    {t('admin.users.detail.subscription.expired')}
                                  </span>
                                ) : (
                                  <span className="text-xs text-dark-400">
                                    {tp.days_remaining}{' '}
                                    {t('admin.users.detail.subscription.daysLeft')}
                                  </span>
                                )}
                              </div>
                            </div>
                            {!tp.is_expired && (
                              <button
                                onClick={() =>
                                  handleInlineConfirm(`removeTraffic_${tp.id}`, () =>
                                    handleRemoveTraffic(tp.id),
                                  )
                                }
                                disabled={actionLoading}
                                className={`ml-2 shrink-0 rounded-lg px-2 py-1 text-xs transition-all disabled:opacity-50 ${
                                  confirmingAction === `removeTraffic_${tp.id}`
                                    ? 'bg-error-500 text-white'
                                    : 'text-dark-500 hover:bg-error-500/15 hover:text-error-400'
                                }`}
                              >
                                {confirmingAction === `removeTraffic_${tp.id}` ? '?' : '\u00D7'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Add Traffic */}
                {currentTariff &&
                  currentTariff.traffic_topup_enabled &&
                  Object.keys(currentTariff.traffic_topup_packages).length > 0 && (
                    <div className="rounded-xl bg-dark-800/50 p-4">
                      <div className="mb-3 text-sm font-medium text-dark-200">
                        {t('admin.users.detail.subscription.addTraffic')}
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={selectedTrafficGb}
                          onChange={(e) => setSelectedTrafficGb(e.target.value)}
                          className="input flex-1"
                        >
                          <option value="">
                            {t('admin.users.detail.subscription.selectPackage')}
                          </option>
                          {Object.entries(currentTariff.traffic_topup_packages)
                            .sort(([a], [b]) => Number(a) - Number(b))
                            .map(([gb]) => (
                              <option key={gb} value={gb}>
                                {gb} {t('common.units.gb')}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() =>
                            selectedTrafficGb && handleAddTraffic(Number(selectedTrafficGb))
                          }
                          disabled={actionLoading || !selectedTrafficGb}
                          className="shrink-0 rounded-lg bg-accent-500 px-4 py-2 text-sm text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
                        >
                          {t('admin.users.detail.subscription.addButton')}
                        </button>
                      </div>
                      <div className="mt-2 text-xs text-dark-500">
                        {t('admin.users.detail.subscription.addTrafficNote')}
                      </div>
                    </div>
                  )}

                {/* Actions */}
                <div className="rounded-xl bg-dark-800/50 p-4">
                  <div className="mb-3 font-medium text-dark-200">
                    {t('admin.users.detail.subscription.actions')}
                  </div>
                  <div className="space-y-3">
                    <select
                      value={subAction}
                      onChange={(e) => setSubAction(e.target.value)}
                      className="input"
                    >
                      <option value="extend">{t('admin.users.detail.subscription.extend')}</option>
                      <option value="change_tariff">
                        {t('admin.users.detail.subscription.changeTariff')}
                      </option>
                      <option value="cancel">{t('admin.users.detail.subscription.cancel')}</option>
                      <option value="activate">
                        {t('admin.users.detail.subscription.activate')}
                      </option>
                    </select>

                    {subAction === 'extend' && (
                      <input
                        type="number"
                        value={subDays}
                        onChange={createNumberInputHandler(setSubDays, 1)}
                        placeholder={t('admin.users.detail.subscription.days')}
                        className="input"
                        min={1}
                        max={3650}
                      />
                    )}

                    {subAction === 'change_tariff' && (
                      <select
                        value={selectedTariffId || ''}
                        onChange={(e) =>
                          setSelectedTariffId(e.target.value ? parseInt(e.target.value) : null)
                        }
                        className="input"
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
                      onClick={() => handleUpdateSubscription()}
                      disabled={actionLoading}
                      className="btn-primary w-full"
                    >
                      {actionLoading
                        ? t('admin.users.actions.applying')
                        : t('admin.users.actions.apply')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl bg-dark-800/50 p-4">
                <div className="mb-4 text-center text-dark-400">
                  {t('admin.users.detail.subscription.noActive')}
                </div>
                <div className="space-y-3">
                  <select
                    value={selectedTariffId || ''}
                    onChange={(e) =>
                      setSelectedTariffId(e.target.value ? parseInt(e.target.value) : null)
                    }
                    className="input"
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
                    onChange={createNumberInputHandler(setSubDays, 1)}
                    placeholder={t('admin.users.detail.subscription.days')}
                    className="input"
                    min={1}
                    max={3650}
                  />
                  <button
                    onClick={() => handleUpdateSubscription('create')}
                    disabled={actionLoading}
                    className="btn-primary w-full"
                  >
                    {actionLoading
                      ? t('admin.users.detail.subscription.creating')
                      : t('admin.users.detail.subscription.create')}
                  </button>
                </div>
              </div>
            )}

            {/* Panel Info */}
            {panelInfoLoading ? (
              <div className="flex justify-center rounded-xl bg-dark-800/50 py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
              </div>
            ) : panelInfo && !panelInfo.found ? (
              <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-4 text-center text-sm text-dark-400">
                {t('admin.users.detail.panelNotFound')}
              </div>
            ) : panelInfo && panelInfo.found ? (
              <>
                {/* Links */}
                {(panelInfo.subscription_url || panelInfo.happ_link) && (
                  <div className="rounded-xl bg-dark-800/50 p-4">
                    <div className="mb-3 text-sm font-medium text-dark-200">
                      {t('admin.users.detail.subscriptionUrl')} / {t('admin.users.detail.happLink')}
                    </div>
                    <div className="space-y-2">
                      {panelInfo.subscription_url && (
                        <button
                          onClick={() => copyToClipboard(panelInfo.subscription_url!)}
                          className="w-full rounded-lg bg-dark-700/50 p-2 text-left transition-colors hover:bg-dark-700"
                        >
                          <div className="mb-0.5 text-xs text-dark-500">
                            {t('admin.users.detail.subscriptionUrl')}
                          </div>
                          <div className="truncate font-mono text-xs text-dark-200">
                            {panelInfo.subscription_url}
                          </div>
                        </button>
                      )}
                      {panelInfo.happ_link && (
                        <button
                          onClick={() => copyToClipboard(panelInfo.happ_link!)}
                          className="w-full rounded-lg bg-dark-700/50 p-2 text-left transition-colors hover:bg-dark-700"
                        >
                          <div className="mb-0.5 text-xs text-dark-500">
                            {t('admin.users.detail.happLink')}
                          </div>
                          <div className="truncate font-mono text-xs text-dark-200">
                            {panelInfo.happ_link}
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Config */}
                {(panelInfo.trojan_password || panelInfo.vless_uuid || panelInfo.ss_password) && (
                  <div className="rounded-xl bg-dark-800/50 p-4">
                    <div className="mb-3 text-sm font-medium text-dark-200">
                      {t('admin.users.detail.panelConfig')}
                    </div>
                    <div className="space-y-2">
                      {panelInfo.trojan_password && (
                        <button
                          onClick={() => copyToClipboard(panelInfo.trojan_password!)}
                          className="w-full rounded-lg bg-dark-700/50 p-2 text-left transition-colors hover:bg-dark-700"
                        >
                          <div className="mb-0.5 text-xs text-dark-500">
                            {t('admin.users.detail.trojanPassword')}
                          </div>
                          <div className="truncate font-mono text-xs text-dark-200">
                            {panelInfo.trojan_password}
                          </div>
                        </button>
                      )}
                      {panelInfo.vless_uuid && (
                        <button
                          onClick={() => copyToClipboard(panelInfo.vless_uuid!)}
                          className="w-full rounded-lg bg-dark-700/50 p-2 text-left transition-colors hover:bg-dark-700"
                        >
                          <div className="mb-0.5 text-xs text-dark-500">
                            {t('admin.users.detail.vlessUuid')}
                          </div>
                          <div className="truncate font-mono text-xs text-dark-200">
                            {panelInfo.vless_uuid}
                          </div>
                        </button>
                      )}
                      {panelInfo.ss_password && (
                        <button
                          onClick={() => copyToClipboard(panelInfo.ss_password!)}
                          className="w-full rounded-lg bg-dark-700/50 p-2 text-left transition-colors hover:bg-dark-700"
                        >
                          <div className="mb-0.5 text-xs text-dark-500">
                            {t('admin.users.detail.ssPassword')}
                          </div>
                          <div className="truncate font-mono text-xs text-dark-200">
                            {panelInfo.ss_password}
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Connection info */}
                <div className="rounded-xl bg-dark-800/50 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-dark-500">
                        {t('admin.users.detail.firstConnected')}
                      </div>
                      <div className="text-sm text-dark-100">
                        {formatDate(panelInfo.first_connected_at)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-dark-500">
                        {t('admin.users.detail.lastOnline')}
                      </div>
                      <div className="text-sm text-dark-100">{formatDate(panelInfo.online_at)}</div>
                    </div>
                    {panelInfo.last_connected_node_name && (
                      <div className="col-span-2">
                        <div className="text-xs text-dark-500">
                          {t('admin.users.detail.lastNode')}
                        </div>
                        <div className="text-sm text-dark-100">
                          {panelInfo.last_connected_node_name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live traffic */}
                <div className="rounded-xl bg-dark-800/50 p-4">
                  <div className="mb-3 text-sm font-medium text-dark-200">
                    {t('admin.users.detail.liveTraffic')}
                  </div>
                  <div className="mb-2">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-dark-400">
                        {formatBytes(panelInfo.used_traffic_bytes)}
                      </span>
                      <span className="text-dark-500">
                        {panelInfo.traffic_limit_bytes > 0
                          ? formatBytes(panelInfo.traffic_limit_bytes)
                          : '∞'}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-dark-700">
                      <div
                        className="h-full rounded-full bg-accent-500 transition-all"
                        style={{
                          width:
                            panelInfo.traffic_limit_bytes > 0
                              ? `${Math.min(100, (panelInfo.used_traffic_bytes / panelInfo.traffic_limit_bytes) * 100)}%`
                              : '0%',
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-dark-500">
                    {t('admin.users.detail.lifetime')}:{' '}
                    {formatBytes(panelInfo.lifetime_used_traffic_bytes)}
                  </div>
                </div>

                {/* Node usage */}
                <div className="rounded-xl bg-dark-800/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-dark-200">
                      {t('admin.users.detail.nodeUsage')}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 3, 7, 14, 30].map((d) => (
                          <button
                            key={d}
                            onClick={() => setNodeUsageDays(d)}
                            className={`rounded-lg px-2 py-1 text-xs transition-colors ${
                              nodeUsageDays === d
                                ? 'bg-accent-500/20 text-accent-400'
                                : 'text-dark-500 hover:text-dark-300'
                            }`}
                          >
                            {d}d
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => loadSubscriptionData()}
                        className="rounded-lg p-1 text-dark-500 transition-colors hover:text-dark-300"
                        title={t('common.refresh')}
                      >
                        <RefreshIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {nodeUsageForPeriod.length > 0 ? (
                    <div className="space-y-2">
                      {nodeUsageForPeriod.map((item) => {
                        const maxBytes = nodeUsageForPeriod[0].total_bytes;
                        const pct = maxBytes > 0 ? (item.total_bytes / maxBytes) * 100 : 0;
                        return (
                          <div key={item.node_uuid}>
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-dark-300">
                                {item.country_code && (
                                  <span className="mr-1">{getCountryFlag(item.country_code)}</span>
                                )}
                                {item.node_name}
                              </span>
                              <span className="text-dark-400">{formatBytes(item.total_bytes)}</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-dark-700">
                              <div
                                className="h-full rounded-full bg-accent-500/60"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-dark-500">-</div>
                  )}
                </div>
              </>
            ) : null}

            {/* Devices */}
            <div className="rounded-xl bg-dark-800/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-dark-200">
                  {t('admin.users.detail.devices.title')} ({devicesTotal}/{deviceLimit})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadDevices()}
                    className="rounded-lg p-1 text-dark-500 transition-colors hover:text-dark-300"
                    title={t('common.refresh')}
                  >
                    <RefreshIcon className="h-3.5 w-3.5" />
                  </button>
                  {devices.length > 0 && (
                    <button
                      onClick={() => handleInlineConfirm('resetDevices', handleResetDevices)}
                      disabled={actionLoading}
                      className={`rounded-lg px-2 py-1 text-xs font-medium transition-all disabled:opacity-50 ${
                        confirmingAction === 'resetDevices'
                          ? 'bg-error-500 text-white'
                          : 'bg-error-500/15 text-error-400 hover:bg-error-500/25'
                      }`}
                    >
                      {confirmingAction === 'resetDevices'
                        ? t('admin.users.detail.actions.areYouSure')
                        : t('admin.users.detail.devices.resetAll')}
                    </button>
                  )}
                </div>
              </div>
              {devicesLoading ? (
                <div className="flex justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
                </div>
              ) : devices.length > 0 ? (
                <div className="space-y-2">
                  {devices.map((device) => (
                    <div
                      key={device.hwid}
                      className="flex items-center justify-between rounded-lg bg-dark-700/50 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-dark-200">
                          {device.platform || device.device_model || device.hwid.slice(0, 12)}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-dark-500">
                          {device.device_model && device.platform && (
                            <span>{device.device_model}</span>
                          )}
                          <span className="font-mono">{device.hwid.slice(0, 8)}...</span>
                          {device.created_at && (
                            <span>{new Date(device.created_at).toLocaleDateString(locale)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleInlineConfirm(`deleteDevice_${device.hwid}`, () =>
                            handleDeleteDevice(device.hwid),
                          )
                        }
                        disabled={actionLoading}
                        className={`ml-2 shrink-0 rounded-lg px-2 py-1 text-xs transition-all disabled:opacity-50 ${
                          confirmingAction === `deleteDevice_${device.hwid}`
                            ? 'bg-error-500 text-white'
                            : 'text-dark-500 hover:bg-error-500/15 hover:text-error-400'
                        }`}
                      >
                        {confirmingAction === `deleteDevice_${device.hwid}` ? '?' : '\u00D7'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-2 text-center text-xs text-dark-500">
                  {t('admin.users.detail.devices.none')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Balance Tab */}
        {activeTab === 'balance' && (
          <AdminUserBalanceTab
            user={user}
            balanceAmount={balanceAmount}
            setBalanceAmount={setBalanceAmount}
            balanceDescription={balanceDescription}
            setBalanceDescription={setBalanceDescription}
            offerDiscountPercent={offerDiscountPercent}
            setOfferDiscountPercent={setOfferDiscountPercent}
            offerValidHours={offerValidHours}
            setOfferValidHours={setOfferValidHours}
            offerSending={offerSending}
            actionLoading={actionLoading}
            confirmingAction={confirmingAction}
            formatDate={formatDate}
            formatWithCurrency={formatWithCurrency}
            onUpdateBalance={handleUpdateBalance}
            onConfirmDeactivateOffer={() =>
              handleInlineConfirm('deactivateOffer', handleDeactivateOffer)
            }
            onSendOffer={handleSendOffer}
          />
        )}

        {/* Sync Tab */}
        {activeTab === 'sync' && (
          <AdminUserSyncTab
            syncStatus={syncStatus}
            userRemnawaveUuid={user.remnawave_uuid}
            locale={locale}
            actionLoading={actionLoading}
            onSyncFromPanel={handleSyncFromPanel}
            onSyncToPanel={handleSyncToPanel}
          />
        )}

        {activeTab === 'tickets' && (
          <AdminUserTicketsTab
            selectedTicketId={selectedTicketId}
            selectedTicket={selectedTicket}
            ticketDetailLoading={ticketDetailLoading}
            actionLoading={actionLoading}
            onBackToTickets={() => {
              setSelectedTicketId(null);
              setSelectedTicket(null);
            }}
            onTicketStatusChange={handleTicketStatusChange}
            formatDate={formatDate}
            replyText={replyText}
            setReplyText={setReplyText}
            onTicketReply={handleTicketReply}
            replySending={replySending}
            messagesEndRef={messagesEndRef}
            ticketsLoading={ticketsLoading}
            tickets={tickets}
            ticketsTotal={ticketsTotal}
            onOpenTicket={setSelectedTicketId}
          />
        )}
      </div>
    </div>
  );
}
