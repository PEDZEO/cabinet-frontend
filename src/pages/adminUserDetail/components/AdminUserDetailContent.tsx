import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { UserDetailResponse } from '../../../api/adminUsers';
import type { PanelSyncStatusResponse } from '../../../api/adminUsers';
import type { UserAvailableTariff, UserListItem, UserPanelInfo } from '../../../api/adminUsers';
import type { AdminTicket, AdminTicketDetail } from '../../../api/admin';
import type { PromoGroup } from '../../../api/promocodes';
import type { NodeUsagePeriodItem } from './subscriptionTypes';
import { AdminUserBalanceTab } from './AdminUserBalanceTab';
import { AdminUserInfoTab } from './AdminUserInfoTab';
import { AdminUserSubscriptionTab } from './AdminUserSubscriptionTab';
import { AdminUserSyncTab } from './AdminUserSyncTab';
import { AdminUserTicketsTab } from './AdminUserTicketsTab';

export type AdminUserDetailTab = 'info' | 'subscription' | 'balance' | 'sync' | 'tickets';

interface InfoTabContentProps {
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
}

interface SubscriptionTabContentProps {
  user: UserDetailResponse;
  actionLoading: boolean;
  confirmingAction: string | null;
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
  formatDate: (date: string | null) => string;
  formatBytes: (bytes: number) => string;
  onInlineConfirm: (action: string, callback: () => Promise<void>) => void;
  onUpdateSubscription: (overrideAction?: string) => void;
  onSetDeviceLimit: (newLimit: number) => void;
  onRemoveTraffic: (purchaseId: number) => Promise<void>;
  onAddTraffic: (gb: number) => void;
  onCopyToClipboard: (text: string) => Promise<void>;
  onReloadSubscriptionData: () => Promise<void>;
  onReloadDevices: () => Promise<void>;
  onResetDevices: () => Promise<void>;
  onDeleteDevice: (hwid: string) => Promise<void>;
}

interface BalanceTabContentProps {
  user: UserDetailResponse;
  balanceAmount: number | '';
  setBalanceAmount: Dispatch<SetStateAction<number | ''>>;
  balanceDescription: string;
  setBalanceDescription: Dispatch<SetStateAction<string>>;
  offerDiscountPercent: number | '';
  setOfferDiscountPercent: Dispatch<SetStateAction<number | ''>>;
  offerValidHours: number | '';
  setOfferValidHours: Dispatch<SetStateAction<number | ''>>;
  offerSending: boolean;
  actionLoading: boolean;
  confirmingAction: string | null;
  formatDate: (date: string | null) => string;
  formatWithCurrency: (value: number) => string;
  onInlineConfirm: (action: string, callback: () => Promise<void>) => void;
  onUpdateBalance: (isAdd: boolean) => Promise<void>;
  onDeactivateOffer: () => Promise<void>;
  onSendOffer: () => Promise<void>;
}

interface SyncTabContentProps {
  syncStatus: PanelSyncStatusResponse | null;
  userRemnawaveUuid: string | null;
  locale: string;
  actionLoading: boolean;
  onSyncFromPanel: () => Promise<void>;
  onSyncToPanel: () => Promise<void>;
}

interface TicketsTabContentProps {
  selectedTicketId: number | null;
  selectedTicket: AdminTicketDetail | null;
  ticketDetailLoading: boolean;
  actionLoading: boolean;
  onBackToTickets: () => void;
  onTicketStatusChange: (status: string) => Promise<void>;
  formatDate: (date: string | null) => string;
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

interface AdminUserDetailContentProps {
  activeTab: AdminUserDetailTab;
  infoTab: InfoTabContentProps;
  subscriptionTab: SubscriptionTabContentProps;
  balanceTab: BalanceTabContentProps;
  syncTab: SyncTabContentProps;
  ticketsTab: TicketsTabContentProps;
}

export function AdminUserDetailContent({
  activeTab,
  infoTab,
  subscriptionTab,
  balanceTab,
  syncTab,
  ticketsTab,
}: AdminUserDetailContentProps) {
  return (
    <div className="space-y-4">
      {activeTab === 'info' && (
        <AdminUserInfoTab
          user={infoTab.user}
          actionLoading={infoTab.actionLoading}
          formatDate={infoTab.formatDate}
          formatWithCurrency={infoTab.formatWithCurrency}
          promoGroups={infoTab.promoGroups}
          editingPromoGroup={infoTab.editingPromoGroup}
          setEditingPromoGroup={infoTab.setEditingPromoGroup}
          onChangePromoGroup={infoTab.onChangePromoGroup}
          editingReferralCommission={infoTab.editingReferralCommission}
          setEditingReferralCommission={infoTab.setEditingReferralCommission}
          referralCommissionValue={infoTab.referralCommissionValue}
          setReferralCommissionValue={infoTab.setReferralCommissionValue}
          onUpdateReferralCommission={infoTab.onUpdateReferralCommission}
          referralsLoading={infoTab.referralsLoading}
          referrals={infoTab.referrals}
          onOpenUser={infoTab.onOpenUser}
          onBlockUser={infoTab.onBlockUser}
          onUnblockUser={infoTab.onUnblockUser}
          confirmingAction={infoTab.confirmingAction}
          onConfirmResetTrial={() => infoTab.onInlineConfirm('resetTrial', infoTab.onResetTrial)}
          onConfirmResetSubscription={() =>
            infoTab.onInlineConfirm('resetSubscription', infoTab.onResetSubscription)
          }
          onConfirmDisable={() => infoTab.onInlineConfirm('disable', infoTab.onDisableUser)}
          onConfirmFullDelete={() =>
            infoTab.onInlineConfirm('fullDelete', infoTab.onFullDeleteUser)
          }
        />
      )}

      {activeTab === 'subscription' && (
        <AdminUserSubscriptionTab
          user={subscriptionTab.user}
          actionLoading={subscriptionTab.actionLoading}
          confirmingAction={subscriptionTab.confirmingAction}
          subAction={subscriptionTab.subAction}
          setSubAction={subscriptionTab.setSubAction}
          subDays={subscriptionTab.subDays}
          setSubDays={subscriptionTab.setSubDays}
          selectedTariffId={subscriptionTab.selectedTariffId}
          setSelectedTariffId={subscriptionTab.setSelectedTariffId}
          tariffs={subscriptionTab.tariffs}
          currentTariff={subscriptionTab.currentTariff}
          selectedTrafficGb={subscriptionTab.selectedTrafficGb}
          setSelectedTrafficGb={subscriptionTab.setSelectedTrafficGb}
          panelInfoLoading={subscriptionTab.panelInfoLoading}
          panelInfo={subscriptionTab.panelInfo}
          nodeUsageForPeriod={subscriptionTab.nodeUsageForPeriod}
          nodeUsageDays={subscriptionTab.nodeUsageDays}
          setNodeUsageDays={subscriptionTab.setNodeUsageDays}
          devices={subscriptionTab.devices}
          devicesTotal={subscriptionTab.devicesTotal}
          deviceLimit={subscriptionTab.deviceLimit}
          devicesLoading={subscriptionTab.devicesLoading}
          locale={subscriptionTab.locale}
          formatDate={subscriptionTab.formatDate}
          formatBytes={subscriptionTab.formatBytes}
          onInlineConfirm={subscriptionTab.onInlineConfirm}
          onUpdateSubscription={subscriptionTab.onUpdateSubscription}
          onSetDeviceLimit={subscriptionTab.onSetDeviceLimit}
          onRemoveTraffic={subscriptionTab.onRemoveTraffic}
          onAddTraffic={subscriptionTab.onAddTraffic}
          onCopyToClipboard={subscriptionTab.onCopyToClipboard}
          onReloadSubscriptionData={subscriptionTab.onReloadSubscriptionData}
          onReloadDevices={subscriptionTab.onReloadDevices}
          onResetDevices={subscriptionTab.onResetDevices}
          onDeleteDevice={subscriptionTab.onDeleteDevice}
        />
      )}

      {activeTab === 'balance' && (
        <AdminUserBalanceTab
          user={balanceTab.user}
          balanceAmount={balanceTab.balanceAmount}
          setBalanceAmount={balanceTab.setBalanceAmount}
          balanceDescription={balanceTab.balanceDescription}
          setBalanceDescription={balanceTab.setBalanceDescription}
          offerDiscountPercent={balanceTab.offerDiscountPercent}
          setOfferDiscountPercent={balanceTab.setOfferDiscountPercent}
          offerValidHours={balanceTab.offerValidHours}
          setOfferValidHours={balanceTab.setOfferValidHours}
          offerSending={balanceTab.offerSending}
          actionLoading={balanceTab.actionLoading}
          confirmingAction={balanceTab.confirmingAction}
          formatDate={balanceTab.formatDate}
          formatWithCurrency={balanceTab.formatWithCurrency}
          onUpdateBalance={balanceTab.onUpdateBalance}
          onConfirmDeactivateOffer={() =>
            balanceTab.onInlineConfirm('deactivateOffer', balanceTab.onDeactivateOffer)
          }
          onSendOffer={balanceTab.onSendOffer}
        />
      )}

      {activeTab === 'sync' && (
        <AdminUserSyncTab
          syncStatus={syncTab.syncStatus}
          userRemnawaveUuid={syncTab.userRemnawaveUuid}
          locale={syncTab.locale}
          actionLoading={syncTab.actionLoading}
          onSyncFromPanel={syncTab.onSyncFromPanel}
          onSyncToPanel={syncTab.onSyncToPanel}
        />
      )}

      {activeTab === 'tickets' && (
        <AdminUserTicketsTab
          selectedTicketId={ticketsTab.selectedTicketId}
          selectedTicket={ticketsTab.selectedTicket}
          ticketDetailLoading={ticketsTab.ticketDetailLoading}
          actionLoading={ticketsTab.actionLoading}
          onBackToTickets={ticketsTab.onBackToTickets}
          onTicketStatusChange={ticketsTab.onTicketStatusChange}
          formatDate={ticketsTab.formatDate}
          replyText={ticketsTab.replyText}
          setReplyText={ticketsTab.setReplyText}
          onTicketReply={ticketsTab.onTicketReply}
          replySending={ticketsTab.replySending}
          messagesEndRef={ticketsTab.messagesEndRef}
          ticketsLoading={ticketsTab.ticketsLoading}
          tickets={ticketsTab.tickets}
          ticketsTotal={ticketsTab.ticketsTotal}
          onOpenTicket={ticketsTab.onOpenTicket}
        />
      )}
    </div>
  );
}
