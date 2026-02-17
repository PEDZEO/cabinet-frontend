import type { Dispatch, SetStateAction } from 'react';
import type {
  UserAvailableTariff,
  UserDetailResponse,
  UserPanelInfo,
} from '../../../api/adminUsers';

export interface DeviceItem {
  hwid: string;
  platform: string;
  device_model: string;
  created_at: string | null;
}

export interface NodeUsagePeriodItem {
  node_uuid: string;
  node_name: string;
  country_code: string | null;
  total_bytes: number;
}

export interface AdminUserSubscriptionTabProps {
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
  devices: DeviceItem[];
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
  onCopyToClipboard: (value: string) => void;
  onReloadSubscriptionData: () => void;
  onReloadDevices: () => void;
  onResetDevices: () => Promise<void>;
  onDeleteDevice: (hwid: string) => Promise<void>;
}
