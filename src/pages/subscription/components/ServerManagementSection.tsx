import type { Dispatch, SetStateAction } from 'react';
import type { TFunction } from 'i18next';

import { subscriptionApi } from '@/api/subscription';
import InsufficientBalancePrompt from '@/components/InsufficientBalancePrompt';

import { getFlagEmoji } from '../utils/flags';

type CountriesData = Awaited<ReturnType<typeof subscriptionApi.getCountries>>;

type ServerManagementSectionProps = {
  t: TFunction;
  formatPrice: (kopeks: number) => string;
  showServerManagement: boolean;
  setShowServerManagement: (value: boolean) => void;
  selectedServersToUpdate: string[];
  setSelectedServersToUpdate: Dispatch<SetStateAction<string[]>>;
  serversCount: number;
  countriesLoading: boolean;
  countriesData: CountriesData | undefined;
  purchaseBalanceKopeks?: number;
  isUpdatePending: boolean;
  updateErrorMessage: string | null;
  onApplyChanges: (selected: string[]) => void;
};

export const ServerManagementSection = ({
  t,
  formatPrice,
  showServerManagement,
  setShowServerManagement,
  selectedServersToUpdate,
  setSelectedServersToUpdate,
  serversCount,
  countriesLoading,
  countriesData,
  purchaseBalanceKopeks,
  isUpdatePending,
  updateErrorMessage,
  onApplyChanges,
}: ServerManagementSectionProps) => {
  return (
    <div className="mt-4">
      {!showServerManagement ? (
        <button
          onClick={() => setShowServerManagement(true)}
          className="w-full rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 text-left transition-colors hover:border-dark-600"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-dark-100">
                {t('subscription.additionalOptions.manageServers')}
              </div>
              <div className="mt-1 text-sm text-dark-400">
                {t('subscription.servers', { count: serversCount })}
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
              {t('subscription.additionalOptions.manageServersTitle')}
            </h3>
            <button
              onClick={() => {
                setShowServerManagement(false);
                setSelectedServersToUpdate([]);
              }}
              className="text-sm text-dark-400 hover:text-dark-200"
            >
              ✕
            </button>
          </div>

          {countriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
            </div>
          ) : countriesData && countriesData.countries.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-dark-700/30 p-2 text-xs text-dark-500">
                {t('subscription.serverManagement.statusLegend')}
              </div>

              {countriesData.discount_percent > 0 && (
                <div className="rounded-lg border border-success-500/30 bg-success-500/10 p-2 text-xs text-success-400">
                  🎁{' '}
                  {t('subscription.serverManagement.discountBanner', {
                    percent: countriesData.discount_percent,
                  })}
                </div>
              )}

              <div className="max-h-64 space-y-2 overflow-y-auto">
                {countriesData.countries
                  .filter((country) => country.is_available || country.is_connected)
                  .map((country) => {
                    const isCurrentlyConnected = country.is_connected;
                    const isSelected = selectedServersToUpdate.includes(country.uuid);
                    const willBeAdded = !isCurrentlyConnected && isSelected;
                    const willBeRemoved = isCurrentlyConnected && !isSelected;

                    return (
                      <button
                        key={country.uuid}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedServersToUpdate((prev) =>
                              prev.filter((u) => u !== country.uuid),
                            );
                          } else {
                            setSelectedServersToUpdate((prev) => [...prev, country.uuid]);
                          }
                        }}
                        disabled={!country.is_available && !isCurrentlyConnected}
                        className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? willBeAdded
                              ? 'border-success-500 bg-success-500/10'
                              : 'border-accent-500 bg-accent-500/10'
                            : willBeRemoved
                              ? 'border-error-500/50 bg-error-500/5'
                              : 'border-dark-700/50 bg-dark-800/50 hover:border-dark-600'
                        } ${!country.is_available && !isCurrentlyConnected ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {willBeAdded ? '➕' : willBeRemoved ? '➖' : isSelected ? '✅' : '⚪'}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 font-medium text-dark-100">
                              {country.name}
                              {country.has_discount && !isCurrentlyConnected && (
                                <span className="rounded bg-success-500/20 px-1.5 py-0.5 text-xs text-success-400">
                                  -{country.discount_percent}%
                                </span>
                              )}
                            </div>
                            {willBeAdded && (
                              <div className="text-xs text-success-400">
                                +{formatPrice(country.price_kopeks)}{' '}
                                {t('subscription.serverManagement.forDays', {
                                  days: countriesData.days_left,
                                })}
                                {country.has_discount && (
                                  <span className="ml-1 text-dark-500 line-through">
                                    {formatPrice(
                                      Math.round(
                                        (country.base_price_kopeks * countriesData.days_left) / 30,
                                      ),
                                    )}
                                  </span>
                                )}
                              </div>
                            )}
                            {!willBeAdded && !isCurrentlyConnected && (
                              <div className="text-xs text-dark-500">
                                {formatPrice(country.price_per_month_kopeks)}
                                {t('subscription.serverManagement.perMonth')}
                                {country.has_discount && (
                                  <span className="ml-1 text-dark-600 line-through">
                                    {formatPrice(country.base_price_kopeks)}
                                  </span>
                                )}
                              </div>
                            )}
                            {!country.is_available && !isCurrentlyConnected && (
                              <div className="text-xs text-dark-500">
                                {t('subscription.serverManagement.unavailable')}
                              </div>
                            )}
                          </div>
                        </div>
                        {country.country_code && (
                          <span className="text-xl">{getFlagEmoji(country.country_code)}</span>
                        )}
                      </button>
                    );
                  })}
              </div>

              {(() => {
                const currentConnected = countriesData.countries
                  .filter((c) => c.is_connected)
                  .map((c) => c.uuid);
                const added = selectedServersToUpdate.filter((u) => !currentConnected.includes(u));
                const removed = currentConnected.filter(
                  (u) => !selectedServersToUpdate.includes(u),
                );
                const hasChanges = added.length > 0 || removed.length > 0;

                const addedServers = countriesData.countries.filter((c) => added.includes(c.uuid));
                const totalCost = addedServers.reduce((sum, s) => sum + s.price_kopeks, 0);
                const hasEnoughBalance =
                  purchaseBalanceKopeks === undefined || totalCost <= purchaseBalanceKopeks;
                const missingAmount =
                  purchaseBalanceKopeks !== undefined ? totalCost - purchaseBalanceKopeks : 0;

                return hasChanges ? (
                  <div className="space-y-3 border-t border-dark-700/50 pt-3">
                    {added.length > 0 && (
                      <div className="text-sm">
                        <span className="text-success-400">
                          {t('subscription.serverManagement.toAdd')}
                        </span>{' '}
                        <span className="text-dark-300">
                          {addedServers.map((s) => s.name).join(', ')}
                        </span>
                      </div>
                    )}
                    {removed.length > 0 && (
                      <div className="text-sm">
                        <span className="text-error-400">
                          {t('subscription.serverManagement.toDisconnect')}
                        </span>{' '}
                        <span className="text-dark-300">
                          {countriesData.countries
                            .filter((c) => removed.includes(c.uuid))
                            .map((s) => s.name)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                    {totalCost > 0 && (
                      <div className="text-center">
                        <div className="text-sm text-dark-400">
                          {t('subscription.serverManagement.paymentProrated')}
                        </div>
                        <div className="text-xl font-bold text-accent-400">
                          {formatPrice(totalCost)}
                        </div>
                      </div>
                    )}

                    {totalCost > 0 && !hasEnoughBalance && missingAmount > 0 && (
                      <InsufficientBalancePrompt missingAmountKopeks={missingAmount} compact />
                    )}

                    <button
                      onClick={() => onApplyChanges(selectedServersToUpdate)}
                      disabled={
                        isUpdatePending ||
                        selectedServersToUpdate.length === 0 ||
                        (totalCost > 0 && !hasEnoughBalance)
                      }
                      className="btn-primary w-full py-3"
                    >
                      {isUpdatePending ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        </span>
                      ) : (
                        t('subscription.serverManagement.applyChanges')
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="py-2 text-center text-sm text-dark-500">
                    {t('subscription.serverManagement.selectServersHint')}
                  </div>
                );
              })()}

              {updateErrorMessage && (
                <div className="text-center text-sm text-error-400">{updateErrorMessage}</div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-dark-400">
              {t('subscription.serverManagement.noServersAvailable')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
