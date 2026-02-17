import type { Dispatch, RefObject, SetStateAction } from 'react';
import type {
  BalanceTabContentProps,
  InfoTabContentProps,
  SubscriptionTabContentProps,
  SyncTabContentProps,
  TicketsTabContentProps,
} from '../components/AdminUserDetailContent';
import type {
  PanelSyncStatusResponse,
  UserAvailableTariff,
  UserDetailResponse,
  UserListItem,
  UserPanelInfo,
} from '../../../api/adminUsers';
import type { AdminTicket, AdminTicketDetail } from '../../../api/admin';
import type { PromoGroup } from '../../../api/promocodes';
import type { NodeUsagePeriodItem } from '../components/subscriptionTypes';

interface BuildAdminUserDetailContentPropsParams {
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

interface AdminUserDetailTabProps {
  infoTab: InfoTabContentProps;
  subscriptionTab: SubscriptionTabContentProps;
  balanceTab: BalanceTabContentProps;
  syncTab: SyncTabContentProps;
  ticketsTab: TicketsTabContentProps;
}

export function buildAdminUserDetailContentProps({
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
}: BuildAdminUserDetailContentPropsParams): AdminUserDetailTabProps {
  return {
    infoTab: {
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
    },
    subscriptionTab: {
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
      onInlineConfirm,
      onUpdateSubscription,
      onSetDeviceLimit,
      onRemoveTraffic,
      onAddTraffic,
      onCopyToClipboard,
      onReloadSubscriptionData,
      onReloadDevices,
      onResetDevices,
      onDeleteDevice,
    },
    balanceTab: {
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
      onInlineConfirm,
      onUpdateBalance,
      onDeactivateOffer,
      onSendOffer,
    },
    syncTab: {
      syncStatus,
      userRemnawaveUuid,
      locale,
      actionLoading,
      onSyncFromPanel,
      onSyncToPanel,
    },
    ticketsTab: {
      selectedTicketId,
      selectedTicket,
      ticketDetailLoading,
      actionLoading,
      onBackToTickets,
      onTicketStatusChange,
      formatDate,
      replyText,
      setReplyText,
      onTicketReply,
      replySending,
      messagesEndRef,
      ticketsLoading,
      tickets,
      ticketsTotal,
      onOpenTicket,
    },
  };
}
