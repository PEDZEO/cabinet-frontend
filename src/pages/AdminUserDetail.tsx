import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useCurrency } from '../hooks/useCurrency';
import { useNotify } from '../platform/hooks/useNotify';
import { AdminUserTicketsTab } from './adminUserDetail/components/AdminUserTicketsTab';
import { AdminUserBalanceTab } from './adminUserDetail/components/AdminUserBalanceTab';
import { AdminUserInfoTab } from './adminUserDetail/components/AdminUserInfoTab';
import { AdminUserSubscriptionTab } from './adminUserDetail/components/AdminUserSubscriptionTab';
import { AdminUserSyncTab } from './adminUserDetail/components/AdminUserSyncTab';
import { AdminUserDetailHeader } from './adminUserDetail/components/AdminUserDetailHeader';
import { AdminUserDetailTabs } from './adminUserDetail/components/AdminUserDetailTabs';
import { useAdminUserActions } from './adminUserDetail/hooks/useAdminUserActions';
import { useAdminUserCoreData } from './adminUserDetail/hooks/useAdminUserCoreData';
import { useAdminUserFormState } from './adminUserDetail/hooks/useAdminUserFormState';
import { useAdminUserInfoData } from './adminUserDetail/hooks/useAdminUserInfoData';
import { useAdminUserSubscriptionData } from './adminUserDetail/hooks/useAdminUserSubscriptionData';
import { useAdminUserTabDataLoader } from './adminUserDetail/hooks/useAdminUserTabDataLoader';
import { useAdminUserTickets } from './adminUserDetail/hooks/useAdminUserTickets';
import { useAdminUserViewHelpers } from './adminUserDetail/hooks/useAdminUserViewHelpers';
import { useInlineConfirm } from './adminUserDetail/hooks/useInlineConfirm';
import { formatBytes, getUserDetailLocale } from './adminUserDetail/utils/formatters';

export default function AdminUserDetail() {
  const { t } = useTranslation();
  const { formatWithCurrency } = useCurrency();
  const navigate = useNavigate();
  const notify = useNotify();
  const { id } = useParams<{ id: string }>();
  const navigateToUsers = useCallback(() => navigate('/admin/users'), [navigate]);

  const locale = getUserDetailLocale(i18n.language);

  const [activeTab, setActiveTab] = useState<
    'info' | 'subscription' | 'balance' | 'sync' | 'tickets'
  >('info');
  const [actionLoading, setActionLoading] = useState(false);

  const { confirmingAction, handleInlineConfirm } = useInlineConfirm();
  const {
    balanceAmount,
    setBalanceAmount,
    balanceDescription,
    setBalanceDescription,
    subAction,
    setSubAction,
    subDays,
    setSubDays,
    selectedTariffId,
    setSelectedTariffId,
    editingPromoGroup,
    setEditingPromoGroup,
    editingReferralCommission,
    setEditingReferralCommission,
    referralCommissionValue,
    setReferralCommissionValue,
    offerDiscountPercent,
    setOfferDiscountPercent,
    offerValidHours,
    setOfferValidHours,
    offerSending,
    setOfferSending,
    selectedTrafficGb,
    setSelectedTrafficGb,
  } = useAdminUserFormState();

  const userId = id ? parseInt(id, 10) : null;
  const { user, loading, syncStatus, loadUser, loadSyncStatus } = useAdminUserCoreData({
    userId,
    navigateToUsers,
  });
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
  const {
    handleUpdateBalance,
    handleUpdateSubscription,
    handleBlockUser,
    handleUnblockUser,
    handleSyncFromPanel,
    handleSyncToPanel,
    handleDeleteDevice,
    handleResetDevices,
    handleAddTraffic,
    handleRemoveTraffic,
    handleSetDeviceLimit,
    handleChangePromoGroup,
    handleUpdateReferralCommission,
    handleDeactivateOffer,
    handleSendOffer,
    handleResetTrial,
    handleResetSubscription,
    handleDisableUser,
    handleFullDeleteUser,
  } = useAdminUserActions({
    userId,
    subAction,
    subDays,
    selectedTariffId,
    balanceAmount,
    balanceDescription,
    referralCommissionValue,
    offerDiscountPercent,
    offerValidHours,
    setActionLoading,
    setOfferSending,
    setBalanceAmount,
    setBalanceDescription,
    setEditingPromoGroup,
    setEditingReferralCommission,
    setOfferDiscountPercent,
    setOfferValidHours,
    setSelectedTrafficGb,
    loadUser,
    loadSyncStatus,
    loadDevices,
    navigateToUsers,
    confirmAction: (message) => confirm(message),
    t,
    notify,
  });

  useAdminUserTabDataLoader({
    activeTab,
    loadReferrals,
    loadPromoGroups,
    loadSyncStatus,
    loadTariffs,
    loadSubscriptionData,
    loadTickets,
  });
  const { formatDate, nodeUsageForPeriod, copyToClipboard, openAdminUser } =
    useAdminUserViewHelpers({
      locale,
      nodeUsage,
      nodeUsageDays,
      notify,
      t,
      navigate,
    });

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
            onOpenUser={openAdminUser}
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
