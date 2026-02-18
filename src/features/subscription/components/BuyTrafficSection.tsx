import type { TFunction } from 'i18next';

import { subscriptionApi } from '@/api/subscription';
import InsufficientBalancePrompt from '@/components/InsufficientBalancePrompt';

type TrafficPackage = Awaited<ReturnType<typeof subscriptionApi.getTrafficPackages>>[number];

type BuyTrafficSectionProps = {
  t: TFunction;
  formatPrice: (kopeks: number) => string;
  showTrafficTopup: boolean;
  setShowTrafficTopup: (value: boolean) => void;
  selectedTrafficPackage: number | null;
  setSelectedTrafficPackage: (value: number | null) => void;
  trafficLimitGb: number;
  trafficUsedGb: number;
  trafficPackages: TrafficPackage[] | undefined;
  purchaseBalanceKopeks?: number;
  isTrafficPurchasePending: boolean;
  trafficPurchaseErrorMessage: string | null;
  onPurchaseTraffic: (gb: number) => void;
  onBeforeTopUp: (gb: number) => Promise<void>;
};

export const BuyTrafficSection = ({
  t,
  formatPrice,
  showTrafficTopup,
  setShowTrafficTopup,
  selectedTrafficPackage,
  setSelectedTrafficPackage,
  trafficLimitGb,
  trafficUsedGb,
  trafficPackages,
  purchaseBalanceKopeks,
  isTrafficPurchasePending,
  trafficPurchaseErrorMessage,
  onPurchaseTraffic,
  onBeforeTopUp,
}: BuyTrafficSectionProps) => {
  return (
    <div className="mt-4">
      {!showTrafficTopup ? (
        <button
          onClick={() => setShowTrafficTopup(true)}
          className="w-full rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 text-left transition-colors hover:border-dark-600"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-dark-100">
                {t('subscription.additionalOptions.buyTraffic')}
              </div>
              <div className="mt-1 text-sm text-dark-400">
                {t('subscription.additionalOptions.currentTrafficLimit', {
                  limit: trafficLimitGb,
                  used: trafficUsedGb.toFixed(1),
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
      ) : (
        <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-dark-100">
              {t('subscription.additionalOptions.buyTrafficTitle')}
            </h3>
            <button
              onClick={() => {
                setShowTrafficTopup(false);
                setSelectedTrafficPackage(null);
              }}
              className="text-sm text-dark-400 hover:text-dark-200"
            >
              ✕
            </button>
          </div>

          <div className="mb-4 rounded-lg bg-dark-700/30 p-2 text-xs text-dark-500">
            ⚠️ {t('subscription.additionalOptions.trafficWarning')}
          </div>

          {!trafficPackages || trafficPackages.length === 0 ? (
            <div className="py-4 text-center text-sm text-dark-400">
              {t('subscription.additionalOptions.trafficUnavailable')}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {trafficPackages.map((pkg) => (
                  <button
                    key={pkg.gb}
                    onClick={() => setSelectedTrafficPackage(pkg.gb)}
                    className={`rounded-xl border p-4 text-center transition-all ${
                      selectedTrafficPackage === pkg.gb
                        ? 'border-accent-500 bg-accent-500/10'
                        : 'border-dark-700/50 bg-dark-800/50 hover:border-dark-600'
                    }`}
                  >
                    <div className="text-lg font-semibold text-dark-100">
                      {pkg.is_unlimited
                        ? '♾️ ' + t('subscription.additionalOptions.unlimited')
                        : `${pkg.gb} ${t('common.units.gb')}`}
                    </div>
                    {pkg.discount_percent && pkg.discount_percent > 0 && (
                      <div className="mb-1">
                        <span className="inline-block rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                          -{pkg.discount_percent}%
                        </span>
                      </div>
                    )}
                    <div className="font-medium text-accent-400">
                      {pkg.discount_percent && pkg.discount_percent > 0 && pkg.base_price_kopeks ? (
                        <>
                          <span className="mr-1 text-sm text-dark-500 line-through">
                            {formatPrice(pkg.base_price_kopeks)}
                          </span>
                          {formatPrice(pkg.price_kopeks)}
                        </>
                      ) : (
                        formatPrice(pkg.price_kopeks)
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {selectedTrafficPackage !== null &&
                (() => {
                  const selectedPkg = trafficPackages.find((p) => p.gb === selectedTrafficPackage);
                  const hasEnoughBalance =
                    !selectedPkg ||
                    purchaseBalanceKopeks === undefined ||
                    selectedPkg.price_kopeks <= purchaseBalanceKopeks;
                  const missingAmount =
                    selectedPkg && purchaseBalanceKopeks !== undefined
                      ? selectedPkg.price_kopeks - purchaseBalanceKopeks
                      : 0;

                  return (
                    <>
                      {!hasEnoughBalance && missingAmount > 0 && (
                        <InsufficientBalancePrompt
                          missingAmountKopeks={missingAmount}
                          compact
                          className="mb-3"
                          onBeforeTopUp={async () => {
                            await onBeforeTopUp(selectedTrafficPackage);
                          }}
                        />
                      )}
                      <button
                        onClick={() => onPurchaseTraffic(selectedTrafficPackage)}
                        disabled={isTrafficPurchasePending || !hasEnoughBalance}
                        className="btn-primary w-full py-3"
                      >
                        {isTrafficPurchasePending ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          </span>
                        ) : selectedPkg?.is_unlimited ? (
                          t('subscription.additionalOptions.buyUnlimited')
                        ) : (
                          t('subscription.additionalOptions.buyTrafficGb', {
                            gb: selectedTrafficPackage,
                          })
                        )}
                      </button>
                    </>
                  );
                })()}

              {trafficPurchaseErrorMessage && (
                <div className="text-center text-sm text-error-400">
                  {trafficPurchaseErrorMessage}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
