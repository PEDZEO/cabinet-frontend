import type { RefObject } from 'react';
import type { TFunction } from 'i18next';

import InsufficientBalancePrompt from '@/components/InsufficientBalancePrompt';
import type { Tariff, TariffPeriod } from '@/types';

import type { ApplyPromoDiscount } from '../types';

type TariffPurchaseFormProps = {
  t: TFunction;
  formatPrice: (kopeks: number) => string;
  tariffPurchaseRef: RefObject<HTMLDivElement | null>;
  selectedTariff: Tariff;
  selectedTariffPeriod: TariffPeriod | null;
  setSelectedTariffPeriod: (period: TariffPeriod | null) => void;
  useCustomDays: boolean;
  setUseCustomDays: (value: boolean) => void;
  customDays: number;
  setCustomDays: (value: number) => void;
  useCustomTraffic: boolean;
  setUseCustomTraffic: (value: boolean) => void;
  customTrafficGb: number;
  setCustomTrafficGb: (value: number) => void;
  applyPromoDiscount: ApplyPromoDiscount;
  purchaseBalanceKopeks?: number;
  isPurchasePending: boolean;
  purchaseErrorMessage: string | null;
  purchaseInsufficientBalanceMissingKopeks: number | null;
  onBack: () => void;
  onPurchase: () => void;
};

const clampValue = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const TariffPurchaseForm = ({
  t,
  formatPrice,
  tariffPurchaseRef,
  selectedTariff,
  selectedTariffPeriod,
  setSelectedTariffPeriod,
  useCustomDays,
  setUseCustomDays,
  customDays,
  setCustomDays,
  useCustomTraffic,
  setUseCustomTraffic,
  customTrafficGb,
  setCustomTrafficGb,
  applyPromoDiscount,
  purchaseBalanceKopeks,
  isPurchasePending,
  purchaseErrorMessage,
  purchaseInsufficientBalanceMissingKopeks,
  onBack,
  onPurchase,
}: TariffPurchaseFormProps) => {
  const dailyPrice = selectedTariff.daily_price_kopeks || 0;
  const isDailyTariff =
    selectedTariff.is_daily ||
    (selectedTariff.daily_price_kopeks && selectedTariff.daily_price_kopeks > 0);
  const hasEnoughBalance =
    purchaseBalanceKopeks === undefined || dailyPrice <= purchaseBalanceKopeks;

  return (
    <div ref={tariffPurchaseRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-dark-100">{selectedTariff.name}</h3>
        <button onClick={onBack} className="text-dark-400 hover:text-dark-200">
          ← {t('common.back')}
        </button>
      </div>

      <div className="rounded-xl bg-dark-800/50 p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-dark-500">{t('subscription.traffic')}:</span>
            <span className="ml-2 text-dark-200">{selectedTariff.traffic_limit_label}</span>
          </div>
          <div>
            <span className="text-dark-500">{t('subscription.devices')}:</span>
            <span className="ml-2 text-dark-200">
              {selectedTariff.device_limit}
              {selectedTariff.extra_devices_count > 0 && (
                <span className="ml-1 text-xs text-accent-400">
                  (+{selectedTariff.extra_devices_count})
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {isDailyTariff ? (
        <div className="rounded-xl border border-accent-500/30 bg-accent-500/10 p-5">
          <div className="mb-4 text-center">
            <div className="mb-2 text-sm text-dark-400">
              {t('subscription.dailyPurchase.costPerDay')}
            </div>
            <div className="text-3xl font-bold text-accent-400">{formatPrice(dailyPrice)}</div>
          </div>

          <div className="space-y-2 text-sm text-dark-400">
            <div className="flex items-start gap-2">
              <span className="text-accent-400">•</span>
              <span>{t('subscription.dailyPurchase.chargedDaily')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent-400">•</span>
              <span>{t('subscription.dailyPurchase.canPause')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent-400">•</span>
              <span>{t('subscription.dailyPurchase.pausedOnLowBalance')}</span>
            </div>
          </div>

          <div className="mt-6">
            {!hasEnoughBalance && purchaseBalanceKopeks !== undefined && (
              <InsufficientBalancePrompt
                missingAmountKopeks={dailyPrice - purchaseBalanceKopeks}
                compact
                className="mb-4"
              />
            )}

            <button
              onClick={onPurchase}
              disabled={isPurchasePending}
              className="btn-primary w-full py-3"
            >
              {isPurchasePending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t('common.loading')}
                </span>
              ) : (
                t('subscription.dailyPurchase.activate', { price: formatPrice(dailyPrice) })
              )}
            </button>

            {purchaseErrorMessage && (
              <div className="mt-3 text-center text-sm text-error-400">{purchaseErrorMessage}</div>
            )}
            {purchaseInsufficientBalanceMissingKopeks !== null && (
              <div className="mt-3">
                <InsufficientBalancePrompt
                  missingAmountKopeks={
                    purchaseInsufficientBalanceMissingKopeks ||
                    Math.max(0, dailyPrice - (purchaseBalanceKopeks || 0))
                  }
                  compact
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div>
            <div className="mb-3 text-sm text-dark-400">{t('subscription.selectPeriod')}</div>

            {selectedTariff.periods.length > 0 && !useCustomDays && (
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selectedTariff.periods.map((period) => {
                  const hasExistingDiscount = !!(
                    period.original_price_kopeks &&
                    period.original_price_kopeks > period.price_kopeks
                  );
                  const promoPeriod = applyPromoDiscount(period.price_kopeks, hasExistingDiscount);
                  const displayDiscount = hasExistingDiscount
                    ? period.discount_percent
                    : promoPeriod.percent;
                  const displayOriginal = hasExistingDiscount
                    ? period.original_price_kopeks
                    : promoPeriod.original;
                  const displayPrice = promoPeriod.price;
                  const displayPerMonth = hasExistingDiscount
                    ? period.price_per_month_kopeks
                    : Math.round(promoPeriod.price / (period.days / 30));

                  return (
                    <button
                      key={period.days}
                      onClick={() => {
                        setSelectedTariffPeriod(period);
                        setUseCustomDays(false);
                      }}
                      className={`relative rounded-xl border p-4 text-left transition-all ${
                        selectedTariffPeriod?.days === period.days && !useCustomDays
                          ? 'border-accent-500 bg-accent-500/10'
                          : 'border-dark-700/50 bg-dark-800/50 hover:border-dark-600'
                      }`}
                    >
                      {displayDiscount && displayDiscount > 0 && (
                        <div
                          className={`absolute -right-2 -top-2 rounded-full px-2 py-0.5 text-xs font-medium text-white ${
                            hasExistingDiscount ? 'bg-success-500' : 'bg-orange-500'
                          }`}
                        >
                          -{displayDiscount}%
                        </div>
                      )}
                      <div className="text-lg font-semibold text-dark-100">{period.label}</div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-accent-400">
                          {formatPrice(displayPrice)}
                        </span>
                        {displayOriginal && displayOriginal > displayPrice && (
                          <span className="text-sm text-dark-500 line-through">
                            {formatPrice(displayOriginal)}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-dark-500">
                        {formatPrice(displayPerMonth)}/{t('subscription.month')}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedTariff.custom_days_enabled &&
              (selectedTariff.price_per_day_kopeks ?? 0) > 0 && (
                <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium text-dark-200">
                      {t('subscription.customDays.title')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setUseCustomDays(!useCustomDays)}
                      aria-label={t('subscription.customDays.title')}
                      className={`relative h-6 w-10 rounded-full transition-colors ${
                        useCustomDays ? 'bg-accent-500' : 'bg-dark-600'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          useCustomDays ? 'left-5' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {useCustomDays && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min={selectedTariff.min_days ?? 1}
                          max={selectedTariff.max_days ?? 365}
                          value={customDays}
                          onChange={(e) => setCustomDays(parseInt(e.target.value, 10))}
                          className="flex-1 accent-accent-500"
                        />
                        <input
                          type="number"
                          value={customDays}
                          min={selectedTariff.min_days ?? 1}
                          max={selectedTariff.max_days ?? 365}
                          onChange={(e) =>
                            setCustomDays(
                              clampValue(
                                parseInt(e.target.value, 10) || (selectedTariff.min_days ?? 1),
                                selectedTariff.min_days ?? 1,
                                selectedTariff.max_days ?? 365,
                              ),
                            )
                          }
                          className="w-20 rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-center text-dark-100"
                        />
                      </div>
                      {(() => {
                        const basePrice = customDays * (selectedTariff.price_per_day_kopeks ?? 0);
                        const hasExistingDiscount = !!(
                          selectedTariff.original_price_per_day_kopeks &&
                          selectedTariff.original_price_per_day_kopeks >
                            (selectedTariff.price_per_day_kopeks ?? 0)
                        );
                        const promoCustom = applyPromoDiscount(basePrice, hasExistingDiscount);
                        return (
                          <div className="flex justify-between text-sm">
                            <span className="text-dark-400">
                              {t('subscription.days', { count: customDays })} ×{' '}
                              {formatPrice(selectedTariff.price_per_day_kopeks ?? 0)}/
                              {t('subscription.customDays.perDay')}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-accent-400">
                                {formatPrice(promoCustom.price)}
                              </span>
                              {promoCustom.original && (
                                <>
                                  <span className="text-xs text-dark-500 line-through">
                                    {formatPrice(promoCustom.original)}
                                  </span>
                                  <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-xs text-orange-400">
                                    -{promoCustom.percent}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
          </div>

          {selectedTariff.custom_traffic_enabled &&
            (selectedTariff.traffic_price_per_gb_kopeks ?? 0) > 0 && (
              <div>
                <div className="mb-3 text-sm text-dark-400">
                  {t('subscription.customTraffic.label')}
                </div>
                <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium text-dark-200">
                      {t('subscription.customTraffic.selectVolume')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setUseCustomTraffic(!useCustomTraffic)}
                      aria-label={t('subscription.customTraffic.selectVolume')}
                      className={`relative h-6 w-10 rounded-full transition-colors ${
                        useCustomTraffic ? 'bg-accent-500' : 'bg-dark-600'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          useCustomTraffic ? 'left-5' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                  {!useCustomTraffic && (
                    <div className="text-sm text-dark-400">
                      {t('subscription.customTraffic.default', {
                        label: selectedTariff.traffic_limit_label,
                      })}
                    </div>
                  )}
                  {useCustomTraffic && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min={selectedTariff.min_traffic_gb ?? 1}
                          max={selectedTariff.max_traffic_gb ?? 1000}
                          value={customTrafficGb}
                          onChange={(e) => setCustomTrafficGb(parseInt(e.target.value, 10))}
                          className="flex-1 accent-accent-500"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={customTrafficGb}
                            min={selectedTariff.min_traffic_gb ?? 1}
                            max={selectedTariff.max_traffic_gb ?? 1000}
                            onChange={(e) =>
                              setCustomTrafficGb(
                                clampValue(
                                  parseInt(e.target.value, 10) ||
                                    (selectedTariff.min_traffic_gb ?? 1),
                                  selectedTariff.min_traffic_gb ?? 1,
                                  selectedTariff.max_traffic_gb ?? 1000,
                                ),
                              )
                            }
                            className="w-20 rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-center text-dark-100"
                          />
                          <span className="text-dark-400">{t('common.units.gb')}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-400">
                          {customTrafficGb} {t('common.units.gb')} ×{' '}
                          {formatPrice(selectedTariff.traffic_price_per_gb_kopeks ?? 0)}/
                          {t('common.units.gb')}
                        </span>
                        <span className="font-medium text-accent-400">
                          +
                          {formatPrice(
                            customTrafficGb * (selectedTariff.traffic_price_per_gb_kopeks ?? 0),
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {(selectedTariffPeriod || useCustomDays) && (
            <div className="rounded-xl bg-dark-800/50 p-5">
              {(() => {
                const basePeriodPrice = useCustomDays
                  ? customDays * (selectedTariff.price_per_day_kopeks ?? 0)
                  : selectedTariffPeriod?.price_kopeks || 0;
                const hasExistingPeriodDiscount =
                  !useCustomDays && selectedTariffPeriod?.original_price_kopeks
                    ? selectedTariffPeriod.original_price_kopeks > selectedTariffPeriod.price_kopeks
                    : false;
                const promoPeriod = applyPromoDiscount(basePeriodPrice, hasExistingPeriodDiscount);

                const trafficPrice =
                  useCustomTraffic && selectedTariff.custom_traffic_enabled
                    ? customTrafficGb * (selectedTariff.traffic_price_per_gb_kopeks ?? 0)
                    : 0;

                const totalPrice = promoPeriod.price + trafficPrice;
                const originalTotal = promoPeriod.original
                  ? promoPeriod.original + trafficPrice
                  : null;

                return (
                  <>
                    <div className="mb-4 space-y-2">
                      {useCustomDays ? (
                        <div className="flex justify-between text-sm text-dark-300">
                          <span>
                            {t('subscription.stepPeriod')}:{' '}
                            {t('subscription.days', { count: customDays })}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>{formatPrice(promoPeriod.price)}</span>
                            {promoPeriod.original && (
                              <span className="text-xs text-dark-500 line-through">
                                {formatPrice(promoPeriod.original)}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        selectedTariffPeriod && (
                          <>
                            {(selectedTariffPeriod.extra_devices_count ?? 0) > 0 &&
                            selectedTariffPeriod.base_tariff_price_kopeks ? (
                              <>
                                <div className="flex justify-between text-sm text-dark-300">
                                  <span>
                                    {t('subscription.baseTariff')}: {selectedTariffPeriod.label}
                                  </span>
                                  <span>
                                    {formatPrice(selectedTariffPeriod.base_tariff_price_kopeks)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm text-dark-300">
                                  <span>
                                    {t('subscription.extraDevices')} (
                                    {selectedTariffPeriod.extra_devices_count})
                                  </span>
                                  <span>
                                    +
                                    {formatPrice(
                                      selectedTariffPeriod.extra_devices_cost_kopeks ?? 0,
                                    )}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between text-sm text-dark-300">
                                <span>
                                  {t('subscription.summary.period', {
                                    label: selectedTariffPeriod.label,
                                  })}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span>{formatPrice(promoPeriod.price)}</span>
                                  {(hasExistingPeriodDiscount || promoPeriod.original) && (
                                    <span className="text-xs text-dark-500 line-through">
                                      {formatPrice(
                                        hasExistingPeriodDiscount
                                          ? (selectedTariffPeriod.original_price_kopeks ?? 0)
                                          : (promoPeriod.original ?? 0),
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )
                      )}

                      {useCustomTraffic && selectedTariff.custom_traffic_enabled && (
                        <div className="flex justify-between text-sm text-dark-300">
                          <span>{t('subscription.summary.traffic', { gb: customTrafficGb })}</span>
                          <span>+{formatPrice(trafficPrice)}</span>
                        </div>
                      )}
                    </div>

                    {promoPeriod.percent && (
                      <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 p-2">
                        <span className="text-sm font-medium text-orange-400">
                          {t('promo.discountApplied')} -{promoPeriod.percent}%
                        </span>
                      </div>
                    )}

                    <div className="mb-4 flex items-center justify-between border-t border-dark-700/50 pt-2">
                      <span className="font-medium text-dark-100">{t('subscription.total')}</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-accent-400">
                          {formatPrice(totalPrice)}
                        </span>
                        {originalTotal && (
                          <div className="text-sm text-dark-500 line-through">
                            {formatPrice(originalTotal)}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={onPurchase}
                      disabled={isPurchasePending}
                      className="btn-primary w-full py-3"
                    >
                      {isPurchasePending ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          {t('common.loading')}
                        </span>
                      ) : (
                        t('subscription.purchase')
                      )}
                    </button>
                  </>
                );
              })()}

              {purchaseErrorMessage && (
                <div className="mt-3 text-center text-sm text-error-400">
                  {purchaseErrorMessage}
                </div>
              )}
              {purchaseInsufficientBalanceMissingKopeks !== null && (
                <div className="mt-3">
                  <InsufficientBalancePrompt
                    missingAmountKopeks={purchaseInsufficientBalanceMissingKopeks}
                    compact
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
