import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useCurrency } from '../hooks/useCurrency';
import { useNotify } from '../platform/hooks/useNotify';
import {
  AdminUserDetailContent,
  type AdminUserDetailTab,
} from './adminUserDetail/components/AdminUserDetailContent';
import { AdminUserDetailHeader } from './adminUserDetail/components/AdminUserDetailHeader';
import { AdminUserDetailLoadingState } from './adminUserDetail/components/AdminUserDetailLoadingState';
import { AdminUserDetailNotFoundState } from './adminUserDetail/components/AdminUserDetailNotFoundState';
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

  const [activeTab, setActiveTab] = useState<AdminUserDetailTab>('info');
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
    return <AdminUserDetailLoadingState />;
  }

  if (!user) {
    return <AdminUserDetailNotFoundState onBack={navigateToUsers} />;
  }

  return (
    <div className="animate-fade-in">
      <AdminUserDetailHeader user={user} loading={loading} onRefresh={loadUser} />
      <AdminUserDetailTabs activeTab={activeTab} onSelectTab={setActiveTab} />
      <AdminUserDetailContent
        activeTab={activeTab}
        infoTab={{
          user,
          actionLoading,
          formatDate,
          formatWithCurrency,
          promoGroups,
          editingPromoGroup,
          setEditingPromoGroup,
          onChangePromoGroup: handleChangePromoGroup,
          editingReferralCommission,
          setEditingReferralCommission,
          referralCommissionValue,
          setReferralCommissionValue,
          onUpdateReferralCommission: handleUpdateReferralCommission,
          referralsLoading,
          referrals,
          onOpenUser: openAdminUser,
          onBlockUser: handleBlockUser,
          onUnblockUser: handleUnblockUser,
          confirmingAction,
          onInlineConfirm: handleInlineConfirm,
          onResetTrial: handleResetTrial,
          onResetSubscription: handleResetSubscription,
          onDisableUser: handleDisableUser,
          onFullDeleteUser: handleFullDeleteUser,
        }}
        subscriptionTab={{
          user,
          actionLoading,
          confirmingAction,
          subAction,
          setSubAction,
          subDays,
          setSubDays,
          selectedTariffId,
          setSelectedTariffId,
          tariffs,
          currentTariff,
          selectedTrafficGb,
          setSelectedTrafficGb,
          panelInfoLoading,
          panelInfo,
          nodeUsageForPeriod,
          nodeUsageDays,
          setNodeUsageDays,
          devices,
          devicesTotal,
          deviceLimit,
          devicesLoading,
          locale,
          formatDate,
          formatBytes,
          onInlineConfirm: handleInlineConfirm,
          onUpdateSubscription: handleUpdateSubscription,
          onSetDeviceLimit: handleSetDeviceLimit,
          onRemoveTraffic: handleRemoveTraffic,
          onAddTraffic: handleAddTraffic,
          onCopyToClipboard: copyToClipboard,
          onReloadSubscriptionData: loadSubscriptionData,
          onReloadDevices: loadDevices,
          onResetDevices: handleResetDevices,
          onDeleteDevice: handleDeleteDevice,
        }}
        balanceTab={{
          user,
          balanceAmount,
          setBalanceAmount,
          balanceDescription,
          setBalanceDescription,
          offerDiscountPercent,
          setOfferDiscountPercent,
          offerValidHours,
          setOfferValidHours,
          offerSending,
          actionLoading,
          confirmingAction,
          formatDate,
          formatWithCurrency,
          onInlineConfirm: handleInlineConfirm,
          onUpdateBalance: handleUpdateBalance,
          onDeactivateOffer: handleDeactivateOffer,
          onSendOffer: handleSendOffer,
        }}
        syncTab={{
          syncStatus,
          userRemnawaveUuid: user.remnawave_uuid,
          locale,
          actionLoading,
          onSyncFromPanel: handleSyncFromPanel,
          onSyncToPanel: handleSyncToPanel,
        }}
        ticketsTab={{
          selectedTicketId,
          selectedTicket,
          ticketDetailLoading,
          actionLoading,
          onBackToTickets: () => {
            setSelectedTicketId(null);
            setSelectedTicket(null);
          },
          onTicketStatusChange: handleTicketStatusChange,
          formatDate,
          replyText,
          setReplyText,
          onTicketReply: handleTicketReply,
          replySending,
          messagesEndRef,
          ticketsLoading,
          tickets,
          ticketsTotal,
          onOpenTicket: setSelectedTicketId,
        }}
      />
    </div>
  );
}
