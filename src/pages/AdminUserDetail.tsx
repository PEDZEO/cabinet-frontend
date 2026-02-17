import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useCurrency } from '../hooks/useCurrency';
import { useNotify } from '../platform/hooks/useNotify';
import {
  adminUsersApi,
  type UserDetailResponse,
  type PanelSyncStatusResponse,
  type UpdateSubscriptionRequest,
} from '../api/adminUsers';
import { promocodesApi } from '../api/promocodes';
import { promoOffersApi } from '../api/promoOffers';
import { toNumber } from '../utils/inputHelpers';
import { AdminUserTicketsTab } from './adminUserDetail/components/AdminUserTicketsTab';
import { AdminUserBalanceTab } from './adminUserDetail/components/AdminUserBalanceTab';
import { AdminUserInfoTab } from './adminUserDetail/components/AdminUserInfoTab';
import { AdminUserSubscriptionTab } from './adminUserDetail/components/AdminUserSubscriptionTab';
import { AdminUserSyncTab } from './adminUserDetail/components/AdminUserSyncTab';
import { AdminUserDetailHeader } from './adminUserDetail/components/AdminUserDetailHeader';
import { AdminUserDetailTabs } from './adminUserDetail/components/AdminUserDetailTabs';
import { useAdminUserInfoData } from './adminUserDetail/hooks/useAdminUserInfoData';
import { useAdminUserSubscriptionData } from './adminUserDetail/hooks/useAdminUserSubscriptionData';
import { useAdminUserTickets } from './adminUserDetail/hooks/useAdminUserTickets';
import { useInlineConfirm } from './adminUserDetail/hooks/useInlineConfirm';
import { buildNodeUsageForPeriod } from './adminUserDetail/utils/nodeUsage';
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
  const [actionLoading, setActionLoading] = useState(false);

  const { confirmingAction, handleInlineConfirm } = useInlineConfirm();

  // Balance form
  const [balanceAmount, setBalanceAmount] = useState<number | ''>('');
  const [balanceDescription, setBalanceDescription] = useState('');

  // Subscription form
  const [subAction, setSubAction] = useState<string>('extend');
  const [subDays, setSubDays] = useState<number | ''>(30);
  const [selectedTariffId, setSelectedTariffId] = useState<number | null>(null);

  // Promo group
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

  const userId = id ? parseInt(id, 10) : null;
  const { referrals, referralsLoading, promoGroups, loadReferrals, loadPromoGroups } =
    useAdminUserInfoData({
      userId,
    });
  const {
    tariffs,
    panelInfo,
    panelInfoLoading,
    nodeUsage,
    nodeUsageDays,
    setNodeUsageDays,
    devices,
    devicesTotal,
    deviceLimit,
    devicesLoading,
    loadTariffs,
    loadSubscriptionData,
    loadDevices,
    currentTariff,
  } = useAdminUserSubscriptionData({
    userId,
    subscriptionTariffId: user?.subscription?.tariff_id ?? null,
  });
  const {
    tickets,
    ticketsLoading,
    ticketsTotal,
    selectedTicketId,
    setSelectedTicketId,
    selectedTicket,
    setSelectedTicket,
    ticketDetailLoading,
    replyText,
    setReplyText,
    replySending,
    messagesEndRef,
    loadTickets,
    handleTicketReply,
    handleTicketStatusChange,
  } = useAdminUserTickets({ userId, setActionLoading });

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

  const nodeUsageForPeriod = useMemo(
    () => buildNodeUsageForPeriod(nodeUsage, nodeUsageDays),
    [nodeUsage, nodeUsageDays],
  );

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
      <AdminUserDetailHeader user={user} loading={loading} onRefresh={loadUser} />
      <AdminUserDetailTabs activeTab={activeTab} onSelectTab={setActiveTab} />

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
          <AdminUserSubscriptionTab
            user={user}
            actionLoading={actionLoading}
            confirmingAction={confirmingAction}
            subAction={subAction}
            setSubAction={setSubAction}
            subDays={subDays}
            setSubDays={setSubDays}
            selectedTariffId={selectedTariffId}
            setSelectedTariffId={setSelectedTariffId}
            tariffs={tariffs}
            currentTariff={currentTariff}
            selectedTrafficGb={selectedTrafficGb}
            setSelectedTrafficGb={setSelectedTrafficGb}
            panelInfoLoading={panelInfoLoading}
            panelInfo={panelInfo}
            nodeUsageForPeriod={nodeUsageForPeriod}
            nodeUsageDays={nodeUsageDays}
            setNodeUsageDays={setNodeUsageDays}
            devices={devices}
            devicesTotal={devicesTotal}
            deviceLimit={deviceLimit}
            devicesLoading={devicesLoading}
            locale={locale}
            formatDate={formatDate}
            formatBytes={formatBytes}
            onInlineConfirm={handleInlineConfirm}
            onUpdateSubscription={handleUpdateSubscription}
            onSetDeviceLimit={handleSetDeviceLimit}
            onRemoveTraffic={handleRemoveTraffic}
            onAddTraffic={handleAddTraffic}
            onCopyToClipboard={copyToClipboard}
            onReloadSubscriptionData={loadSubscriptionData}
            onReloadDevices={loadDevices}
            onResetDevices={handleResetDevices}
            onDeleteDevice={handleDeleteDevice}
          />
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
