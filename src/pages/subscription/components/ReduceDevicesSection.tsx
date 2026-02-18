import type { TFunction } from 'i18next';

import { subscriptionApi } from '@/api/subscription';

type DeviceReductionInfo = Awaited<ReturnType<typeof subscriptionApi.getDeviceReductionInfo>>;

type ReduceDevicesSectionProps = {
  t: TFunction;
  showDeviceReduction: boolean;
  setShowDeviceReduction: (value: boolean) => void;
  deviceReductionInfo: DeviceReductionInfo | undefined;
  targetDeviceLimit: number;
  setTargetDeviceLimit: (value: number) => void;
  isReducing: boolean;
  reduceErrorMessage: string | null;
  onReduce: () => void;
};

export const ReduceDevicesSection = ({
  t,
  showDeviceReduction,
  setShowDeviceReduction,
  deviceReductionInfo,
  targetDeviceLimit,
  setTargetDeviceLimit,
  isReducing,
  reduceErrorMessage,
  onReduce,
}: ReduceDevicesSectionProps) => {
  return (
    <div className="mt-4">
      {!showDeviceReduction ? (
        <button
          onClick={() => setShowDeviceReduction(true)}
          className="w-full rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 text-left transition-colors hover:border-dark-600"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-dark-100">
                {t('subscription.additionalOptions.reduceDevices')}
              </div>
              <div className="mt-1 text-sm text-dark-400">
                {t('subscription.additionalOptions.reduceDevicesDescription')}
              </div>
            </div>
            <svg
              className="h-5 w-5 text-dark-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      ) : (
        <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-dark-100">
              {t('subscription.additionalOptions.reduceDevicesTitle')}
            </h3>
            <button
              onClick={() => setShowDeviceReduction(false)}
              className="text-sm text-dark-400 hover:text-dark-200"
            >
              ✕
            </button>
          </div>

          {deviceReductionInfo?.available === false ? (
            <div className="py-4 text-center text-sm text-dark-400">
              {deviceReductionInfo.reason || t('subscription.additionalOptions.reduceUnavailable')}
            </div>
          ) : deviceReductionInfo ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() =>
                    setTargetDeviceLimit(
                      Math.max(
                        Math.max(
                          deviceReductionInfo.min_device_limit,
                          deviceReductionInfo.connected_devices_count,
                        ),
                        targetDeviceLimit - 1,
                      ),
                    )
                  }
                  disabled={
                    targetDeviceLimit <=
                    Math.max(
                      deviceReductionInfo.min_device_limit,
                      deviceReductionInfo.connected_devices_count,
                    )
                  }
                  className="btn-secondary flex h-12 w-12 items-center justify-center !p-0 text-2xl"
                >
                  -
                </button>
                <div className="text-center">
                  <div className="text-4xl font-bold text-dark-100">{targetDeviceLimit}</div>
                  <div className="text-sm text-dark-500">
                    {t('subscription.additionalOptions.devicesUnit')}
                  </div>
                </div>
                <button
                  onClick={() =>
                    setTargetDeviceLimit(
                      Math.min(deviceReductionInfo.current_device_limit - 1, targetDeviceLimit + 1),
                    )
                  }
                  disabled={targetDeviceLimit >= deviceReductionInfo.current_device_limit - 1}
                  className="btn-secondary flex h-12 w-12 items-center justify-center !p-0 text-2xl"
                >
                  +
                </button>
              </div>

              <div className="space-y-1 text-center text-sm text-dark-400">
                <div>
                  {t('subscription.additionalOptions.currentDeviceLimit', {
                    count: deviceReductionInfo.current_device_limit,
                  })}
                </div>
                <div>
                  {t('subscription.additionalOptions.minDeviceLimit', {
                    count: deviceReductionInfo.min_device_limit,
                  })}
                </div>
                <div>
                  {t('subscription.additionalOptions.connectedDevices', {
                    count: deviceReductionInfo.connected_devices_count,
                  })}
                </div>
              </div>

              {deviceReductionInfo.connected_devices_count >
                deviceReductionInfo.min_device_limit && (
                <div className="rounded-lg bg-warning-500/10 p-3 text-center text-sm text-warning-400">
                  {t('subscription.additionalOptions.disconnectDevicesFirst', {
                    count: deviceReductionInfo.connected_devices_count,
                  })}
                </div>
              )}

              <div className="text-center">
                <div className="text-sm text-dark-400">
                  {t('subscription.additionalOptions.newDeviceLimit', { count: targetDeviceLimit })}
                </div>
              </div>

              <button
                onClick={onReduce}
                disabled={
                  isReducing ||
                  targetDeviceLimit >= deviceReductionInfo.current_device_limit ||
                  targetDeviceLimit < deviceReductionInfo.min_device_limit ||
                  targetDeviceLimit < deviceReductionInfo.connected_devices_count
                }
                className="btn-primary w-full py-3"
              >
                {isReducing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t('subscription.additionalOptions.reducing')}
                  </span>
                ) : (
                  t('subscription.additionalOptions.reduce')
                )}
              </button>

              {reduceErrorMessage && (
                <div className="text-center text-sm text-error-400">{reduceErrorMessage}</div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent-400/30 border-t-accent-400" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
