import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { UserDetailResponse } from '../../../api/adminUsers';
import type { PanelSyncStatusResponse } from '../../../api/adminUsers';
import type { AdminTicketDetail, AdminTicket } from '../../../api/admin';
import { AdminUserInfoTab } from './AdminUserInfoTab';
import { AdminUserSubscriptionTab } from './AdminUserSubscriptionTab';
import { AdminUserBalanceTab } from './AdminUserBalanceTab';
import { AdminUserSyncTab } from './AdminUserSyncTab';
import { AdminUserTicketsTab } from './AdminUserTicketsTab';
import type { PromoGroup } from '../../../api/promocodes';
import type { UserListItem } from '../../../api/adminUsers';
import type { UserAvailableTariff, UserPanelInfo } from '../../../api/adminUsers';
import type { NodeUsagePeriodItem } from './subscriptionTypes';

type AdminUserDetailTab = 'info' | 'subscription' | 'balance' | 'sync' | 'tickets';

interface AdminUserDetailContentProps {
  activeTab: AdminUserDetailTab;
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
  onInlineConfirm: (action: string, callback: () => Promise<void>) => void;
  onResetTrial: () => Promise<void>;
  onResetSubscription: () => Promise<void>;
  onDisableUser: () => Promise<void>;
  onFullDeleteUser: () => Promise<void>;
  subAction: string;
  setSubAction: Dispatch<SetStateAction<string>>;
  subDays: number | '';
  setSubDays: Dispatch<SetStateAction<number | ''>>;
  selectedTariffId: number | null;
  setSelectedTariffId: Dispatch<SetStateAction<number | null>>;
  tariffs: UserAvailableTariff[];
  currentTariff: UserAvailableTariff | null;
  selectedTrafficGb: string;
  setSelectedTrafficGb: Dispatch<SetStateAction<string>>;
  panelInfoLoading: boolean;
  panelInfo: UserPanelInfo | null;
  nodeUsageForPeriod: NodeUsagePeriodItem[];
  nodeUsageDays: number;
  setNodeUsageDays: Dispatch<SetStateAction<number>>;
  devices: { hwid: string; platform: string; device_model: string; created_at: string | null }[];
  devicesTotal: number;
  deviceLimit: number;
  devicesLoading: boolean;
  locale: string;
  formatBytes: (bytes: number) => string;
  onUpdateSubscription: (overrideAction?: string) => void;
  onSetDeviceLimit: (newLimit: number) => void;
  onRemoveTraffic: (purchaseId: number) => Promise<void>;
  onAddTraffic: (gb: number) => void;
  onCopyToClipboard: (text: string) => Promise<void>;
  onReloadSubscriptionData: () => Promise<void>;
  onReloadDevices: () => Promise<void>;
  onResetDevices: () => Promise<void>;
  onDeleteDevice: (hwid: string) => Promise<void>;
  balanceAmount: number | '';
  setBalanceAmount: Dispatch<SetStateAction<number | ''>>;
  balanceDescription: string;
  setBalanceDescription: Dispatch<SetStateAction<string>>;
  offerDiscountPercent: number | '';
  setOfferDiscountPercent: Dispatch<SetStateAction<number | ''>>;
  offerValidHours: number | '';
  setOfferValidHours: Dispatch<SetStateAction<number | ''>>;
  offerSending: boolean;
  onUpdateBalance: (isAdd: boolean) => Promise<void>;
  onDeactivateOffer: () => Promise<void>;
  onSendOffer: () => Promise<void>;
  syncStatus: PanelSyncStatusResponse | null;
  userRemnawaveUuid: string | null;
  onSyncFromPanel: () => Promise<void>;
  onSyncToPanel: () => Promise<void>;
  selectedTicketId: number | null;
  selectedTicket: AdminTicketDetail | null;
  ticketDetailLoading: boolean;
  onBackToTickets: () => void;
  onTicketStatusChange: (status: string) => Promise<void>;
  replyText: string;
  setReplyText: Dispatch<SetStateAction<string>>;
  onTicketReply: () => Promise<void>;
  replySending: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  ticketsLoading: boolean;
  tickets: AdminTicket[];
  ticketsTotal: number;
  onOpenTicket: (ticketId: number) => void;
}

export function AdminUserDetailContent({
  activeTab,
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
  onInlineConfirm,
  onResetTrial,
  onResetSubscription,
  onDisableUser,
  onFullDeleteUser,
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
  formatBytes,
  onUpdateSubscription,
  onSetDeviceLimit,
  onRemoveTraffic,
  onAddTraffic,
  onCopyToClipboard,
  onReloadSubscriptionData,
  onReloadDevices,
  onResetDevices,
  onDeleteDevice,
  balanceAmount,
  setBalanceAmount,
  balanceDescription,
  setBalanceDescription,
  offerDiscountPercent,
  setOfferDiscountPercent,
  offerValidHours,
  setOfferValidHours,
  offerSending,
  onUpdateBalance,
  onDeactivateOffer,
  onSendOffer,
  syncStatus,
  userRemnawaveUuid,
  onSyncFromPanel,
  onSyncToPanel,
  selectedTicketId,
  selectedTicket,
  ticketDetailLoading,
  onBackToTickets,
  onTicketStatusChange,
  replyText,
  setReplyText,
  onTicketReply,
  replySending,
  messagesEndRef,
  ticketsLoading,
  tickets,
  ticketsTotal,
  onOpenTicket,
}: AdminUserDetailContentProps) {
  return (
    <div className="space-y-4">
      {activeTab === 'info' && (
        <AdminUserInfoTab
          user={user}
          actionLoading={actionLoading}
          formatDate={formatDate}
          formatWithCurrency={formatWithCurrency}
          promoGroups={promoGroups}
          editingPromoGroup={editingPromoGroup}
          setEditingPromoGroup={setEditingPromoGroup}
          onChangePromoGroup={onChangePromoGroup}
          editingReferralCommission={editingReferralCommission}
          setEditingReferralCommission={setEditingReferralCommission}
          referralCommissionValue={referralCommissionValue}
          setReferralCommissionValue={setReferralCommissionValue}
          onUpdateReferralCommission={onUpdateReferralCommission}
          referralsLoading={referralsLoading}
          referrals={referrals}
          onOpenUser={onOpenUser}
          onBlockUser={onBlockUser}
          onUnblockUser={onUnblockUser}
          confirmingAction={confirmingAction}
          onConfirmResetTrial={() => onInlineConfirm('resetTrial', onResetTrial)}
          onConfirmResetSubscription={() =>
            onInlineConfirm('resetSubscription', onResetSubscription)
          }
          onConfirmDisable={() => onInlineConfirm('disable', onDisableUser)}
          onConfirmFullDelete={() => onInlineConfirm('fullDelete', onFullDeleteUser)}
        />
      )}

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
          onInlineConfirm={onInlineConfirm}
          onUpdateSubscription={onUpdateSubscription}
          onSetDeviceLimit={onSetDeviceLimit}
          onRemoveTraffic={onRemoveTraffic}
          onAddTraffic={onAddTraffic}
          onCopyToClipboard={onCopyToClipboard}
          onReloadSubscriptionData={onReloadSubscriptionData}
          onReloadDevices={onReloadDevices}
          onResetDevices={onResetDevices}
          onDeleteDevice={onDeleteDevice}
        />
      )}

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
          onUpdateBalance={onUpdateBalance}
          onConfirmDeactivateOffer={() => onInlineConfirm('deactivateOffer', onDeactivateOffer)}
          onSendOffer={onSendOffer}
        />
      )}

      {activeTab === 'sync' && (
        <AdminUserSyncTab
          syncStatus={syncStatus}
          userRemnawaveUuid={userRemnawaveUuid}
          locale={locale}
          actionLoading={actionLoading}
          onSyncFromPanel={onSyncFromPanel}
          onSyncToPanel={onSyncToPanel}
        />
      )}

      {activeTab === 'tickets' && (
        <AdminUserTicketsTab
          selectedTicketId={selectedTicketId}
          selectedTicket={selectedTicket}
          ticketDetailLoading={ticketDetailLoading}
          actionLoading={actionLoading}
          onBackToTickets={onBackToTickets}
          onTicketStatusChange={onTicketStatusChange}
          formatDate={formatDate}
          replyText={replyText}
          setReplyText={setReplyText}
          onTicketReply={onTicketReply}
          replySending={replySending}
          messagesEndRef={messagesEndRef}
          ticketsLoading={ticketsLoading}
          tickets={tickets}
          ticketsTotal={ticketsTotal}
          onOpenTicket={onOpenTicket}
        />
      )}
    </div>
  );
}
