import type { TFunction } from 'i18next';

import { subscriptionApi } from '@/api/subscription';
import InsufficientBalancePrompt from '@/components/InsufficientBalancePrompt';

type DevicePriceData = Awaited<ReturnType<typeof subscriptionApi.getDevicePrice>>;

type BuyDevicesSectionProps = {
  t: TFunction;
  formatPrice: (kopeks: number) => string;
  showDeviceTopup: boolean;
  setShowDeviceTopup: (value: boolean) => void;
  devicesToAdd: number;
  setDevicesToAdd: (value: number) => void;
  currentDeviceLimit: number;
  devicePriceData: DevicePriceData | undefined;
  purchaseBalanceKopeks?: number;
  isDevicePurchasePending: boolean;
  devicePurchaseErrorMessage: string | null;
  onPurchaseDevices: () => void;
  onBeforeTopUp: (devices: number) => Promise<void>;
};

export const BuyDevicesSection = ({
  t,
  formatPrice,
  showDeviceTopup,
  setShowDeviceTopup,
  devicesToAdd,
  setDevicesToAdd,
  currentDeviceLimit,
  devicePriceData,
  purchaseBalanceKopeks,
  isDevicePurchasePending,
  devicePurchaseErrorMessage,
  onPurchaseDevices,
  onBeforeTopUp,
}: BuyDevicesSectionProps) => {
  if (!showDeviceTopup) {
    return (
      <button
        onClick={() => setShowDeviceTopup(true)}
        className="w-full rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 text-left transition-colors hover:border-dark-600"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-dark-100">
              {t('subscription.additionalOptions.buyDevices')}
            </div>
            <div className="mt-1 text-sm text-dark-400">
              {t('subscription.additionalOptions.currentDeviceLimit', {
                count: currentDeviceLimit,
              })}
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
    );
  }

  return (
    <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-dark-100">{t('subscription.buyDevices')}</h3>
        <button
          onClick={() => setShowDeviceTopup(false)}
          className="text-sm text-dark-400 hover:text-dark-200"
        >
          ✕
        </button>
      </div>

      {devicePriceData?.available === false && !devicePriceData?.max_device_limit ? (
        <div className="py-4 text-center text-sm text-dark-400">
          {devicePriceData.reason || t('subscription.additionalOptions.devicesUnavailable')}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setDevicesToAdd(Math.max(1, devicesToAdd - 1))}
              disabled={devicesToAdd <= 1}
              className="btn-secondary flex h-12 w-12 items-center justify-center !p-0 text-2xl"
            >
              -
            </button>
            <div className="text-center">
              <div className="text-4xl font-bold text-dark-100">{devicesToAdd}</div>
              <div className="text-sm text-dark-500">
                {t('subscription.additionalOptions.devicesUnit')}
              </div>
            </div>
            <button
              onClick={() => setDevicesToAdd(devicesToAdd + 1)}
              disabled={
                devicePriceData?.max_device_limit
                  ? (devicePriceData.current_device_limit || 0) + devicesToAdd >=
                    devicePriceData.max_device_limit
                  : false
              }
              className="btn-secondary flex h-12 w-12 items-center justify-center !p-0 text-2xl"
            >
              +
            </button>
          </div>

          {devicePriceData?.max_device_limit && (
            <div className="text-center text-sm text-dark-400">
              {t('subscription.additionalOptions.currentDeviceLimit', {
                count: devicePriceData.current_device_limit || currentDeviceLimit,
              })}{' '}
              /{' '}
              {t('subscription.additionalOptions.maxDevices', {
                count: devicePriceData.max_device_limit,
              })}
            </div>
          )}

          {devicePriceData?.available === false && devicePriceData?.reason && (
            <div className="rounded-lg bg-warning-500/10 p-3 text-center text-sm text-warning-400">
              {devicePriceData.reason}
            </div>
          )}

          {devicePriceData?.available && devicePriceData.price_per_device_label && (
            <div className="text-center">
              <div className="mb-2 text-sm text-dark-400">
                {devicePriceData.discount_percent && devicePriceData.discount_percent > 0 ? (
                  <span>
                    <span className="text-dark-500 line-through">
                      {formatPrice(devicePriceData.original_price_per_device_kopeks || 0)}
                    </span>
                    <span className="mx-1">{devicePriceData.price_per_device_label}</span>
                  </span>
                ) : (
                  devicePriceData.price_per_device_label
                )}
                /{t('subscription.perDevice').replace('/ ', '')} (
                {t('subscription.days', { count: devicePriceData.days_left })})
              </div>
              {devicePriceData.discount_percent && devicePriceData.discount_percent > 0 && (
                <div className="mb-2">
                  <span className="inline-block rounded-full bg-green-500/20 px-2.5 py-0.5 text-sm font-medium text-green-400">
                    -{devicePriceData.discount_percent}%
                  </span>
                </div>
              )}
              {devicePriceData.total_price_kopeks === 0 ? (
                <div className="text-2xl font-bold text-green-400">
                  {t('subscription.switchTariff.free')}
                </div>
              ) : (
                <div className="text-2xl font-bold text-accent-400">
                  {devicePriceData.discount_percent &&
                    devicePriceData.discount_percent > 0 &&
                    devicePriceData.base_total_price_kopeks && (
                      <span className="mr-2 text-lg text-dark-500 line-through">
                        {formatPrice(devicePriceData.base_total_price_kopeks)}
                      </span>
                    )}
                  {devicePriceData.total_price_label}
                </div>
              )}
            </div>
          )}

          {devicePriceData?.available &&
            devicePriceData.total_price_kopeks &&
            purchaseBalanceKopeks !== undefined &&
            devicePriceData.total_price_kopeks > purchaseBalanceKopeks && (
              <InsufficientBalancePrompt
                missingAmountKopeks={devicePriceData.total_price_kopeks - purchaseBalanceKopeks}
                compact
                onBeforeTopUp={async () => {
                  await onBeforeTopUp(devicesToAdd);
                }}
              />
            )}

          <button
            onClick={onPurchaseDevices}
            disabled={
              isDevicePurchasePending ||
              !devicePriceData?.available ||
              !!(
                devicePriceData?.total_price_kopeks &&
                purchaseBalanceKopeks !== undefined &&
                devicePriceData.total_price_kopeks > purchaseBalanceKopeks
              )
            }
            className="btn-primary w-full py-3"
          >
            {isDevicePurchasePending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </span>
            ) : (
              t('subscription.additionalOptions.buy')
            )}
          </button>

          {devicePurchaseErrorMessage && (
            <div className="text-center text-sm text-error-400">{devicePurchaseErrorMessage}</div>
          )}
        </div>
      )}
    </div>
  );
};
