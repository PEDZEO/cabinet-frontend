import { useTranslation } from 'react-i18next';
import { RefreshIcon } from './Icons';
import type { DeviceItem } from './subscriptionTypes';

interface AdminUserDevicesSectionProps {
  devices: DeviceItem[];
  devicesTotal: number;
  deviceLimit: number;
  devicesLoading: boolean;
  locale: string;
  actionLoading: boolean;
  confirmingAction: string | null;
  onInlineConfirm: (action: string, callback: () => Promise<void>) => void;
  onReloadDevices: () => void;
  onResetDevices: () => Promise<void>;
  onDeleteDevice: (hwid: string) => Promise<void>;
}

export function AdminUserDevicesSection({
  devices,
  devicesTotal,
  deviceLimit,
  devicesLoading,
  locale,
  actionLoading,
  confirmingAction,
  onInlineConfirm,
  onReloadDevices,
  onResetDevices,
  onDeleteDevice,
}: AdminUserDevicesSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl bg-dark-800/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-dark-200">
          {t('admin.users.detail.devices.title')} ({devicesTotal}/{deviceLimit})
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onReloadDevices}
            className="rounded-lg p-1 text-dark-500 transition-colors hover:text-dark-300"
            title={t('common.refresh')}
          >
            <RefreshIcon className="h-3.5 w-3.5" />
          </button>
          {devices.length > 0 && (
            <button
              onClick={() => onInlineConfirm('resetDevices', onResetDevices)}
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
                  {device.device_model && device.platform && <span>{device.device_model}</span>}
                  <span className="font-mono">{device.hwid.slice(0, 8)}...</span>
                  {device.created_at && (
                    <span>{new Date(device.created_at).toLocaleDateString(locale)}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() =>
                  onInlineConfirm(`deleteDevice_${device.hwid}`, () => onDeleteDevice(device.hwid))
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
  );
}
