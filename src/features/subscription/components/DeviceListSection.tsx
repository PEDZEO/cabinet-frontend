import type { TFunction } from 'i18next';

import type { DevicesResponse } from '@/types';

type DeviceListSectionProps = {
  t: TFunction;
  devicesData: DevicesResponse | undefined;
  devicesLoading: boolean;
  isDeleteDevicePending: boolean;
  isDeleteAllDevicesPending: boolean;
  onDeleteAllDevices: () => void;
  onDeleteDevice: (hwid: string) => void;
};

export const DeviceListSection = ({
  t,
  devicesData,
  devicesLoading,
  isDeleteDevicePending,
  isDeleteAllDevicesPending,
  onDeleteAllDevices,
  onDeleteDevice,
}: DeviceListSectionProps) => {
  return (
    <div className="bento-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark-100">{t('subscription.myDevices')}</h2>
        {devicesData && devicesData.devices.length > 0 && (
          <button
            onClick={onDeleteAllDevices}
            disabled={isDeleteAllDevicesPending}
            className="text-sm text-error-400 hover:text-error-300"
          >
            {t('subscription.deleteAllDevices')}
          </button>
        )}
      </div>

      {devicesLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        </div>
      ) : devicesData && devicesData.devices.length > 0 ? (
        <div className="space-y-3">
          <div className="mb-2 text-sm text-dark-400">
            {devicesData.total} / {t('subscription.devices', { count: devicesData.device_limit })}
          </div>
          {devicesData.devices.map((device) => (
            <div
              key={device.hwid}
              className="flex items-center justify-between rounded-xl border border-dark-700/50 bg-dark-800/50 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-700">
                  <svg
                    className="h-5 w-5 text-dark-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-dark-100">
                    {device.device_model || device.platform}
                  </div>
                  <div className="text-sm text-dark-500">{device.platform}</div>
                </div>
              </div>
              <button
                onClick={() => onDeleteDevice(device.hwid)}
                disabled={isDeleteDevicePending}
                className="p-2 text-dark-400 transition-colors hover:text-error-400"
                title={t('subscription.deleteDevice')}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-dark-400">{t('subscription.noDevices')}</div>
      )}
    </div>
  );
};
