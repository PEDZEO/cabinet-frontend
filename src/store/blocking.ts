import { create } from 'zustand';

export type BlockingType = 'maintenance' | 'channel_subscription' | 'blacklisted' | null;

interface MaintenanceInfo {
  message: string;
  reason?: string;
}

/**
 * User-facing channel subscription status returned by the blocking 403 response.
 * Intentionally separate from `RequiredChannel` (api/adminChannels.ts) which
 * represents the admin CRUD entity with `is_active` / `sort_order` fields.
 */
interface ChannelInfo {
  channel_id: string;
  channel_link?: string;
  title?: string;
  is_subscribed: boolean;
}

interface ChannelSubscriptionInfo {
  message: string;
  channel_link?: string;
  channels?: ChannelInfo[];
}

interface BlacklistedInfo {
  message: string;
}

interface BlockingState {
  blockingType: BlockingType;
  maintenanceInfo: MaintenanceInfo | null;
  channelInfo: ChannelSubscriptionInfo | null;
  blacklistedInfo: BlacklistedInfo | null;

  setMaintenance: (info: MaintenanceInfo) => void;
  setChannelSubscription: (info: ChannelSubscriptionInfo) => void;
  setBlacklisted: (info: BlacklistedInfo) => void;
  clearBlocking: () => void;
}

export const useBlockingStore = create<BlockingState>((set) => ({
  blockingType: null,
  maintenanceInfo: null,
  channelInfo: null,
  blacklistedInfo: null,

  setMaintenance: (info) =>
    set({
      blockingType: 'maintenance',
      maintenanceInfo: info,
      channelInfo: null,
      blacklistedInfo: null,
    }),

  setChannelSubscription: (info) =>
    set({
      blockingType: 'channel_subscription',
      channelInfo: info,
      maintenanceInfo: null,
      blacklistedInfo: null,
    }),

  setBlacklisted: (info) =>
    set({
      blockingType: 'blacklisted',
      blacklistedInfo: info,
      maintenanceInfo: null,
      channelInfo: null,
    }),

  clearBlocking: () =>
    set({
      blockingType: null,
      maintenanceInfo: null,
      channelInfo: null,
      blacklistedInfo: null,
    }),
}));
