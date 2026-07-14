import { useEffect, useState } from 'react';
import { type TFunction } from 'i18next';

import {
  ultimaPaneClassName,
  ultimaPaneSurfaceStyle,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';
import { cn } from '@/lib/utils';
import { TrafficPurchaseTimer } from '@/components/subscription/TrafficPurchaseTimer';
import type { TrafficPackage, TrafficPurchase } from '@/types';
import { trackAnalyticsEvent } from '@/utils/analyticsEvents';

type UltimaTrafficTopUpSectionProps = {
  t: TFunction;
  formatPrice: (kopeks: number) => string;
  trafficLimitGb: number;
  trafficUsedGb: number;
  trafficPurchases?: TrafficPurchase[];
  trafficPackages: TrafficPackage[] | undefined;
  selectedTrafficPackage: number | null;
  setSelectedTrafficPackage: (value: number | null) => void;
  purchaseBalanceKopeks: number;
  isPending: boolean;
  error: string | null;
  initiallyExpanded?: boolean;
  onPurchaseTraffic: (gb: number) => void;
  onTopUpBalance: (gb: number) => void;
};

export function UltimaTrafficTopUpSection({
  t,
  formatPrice,
  trafficLimitGb,
  trafficUsedGb,
  trafficPurchases,
  trafficPackages,
  selectedTrafficPackage,
  setSelectedTrafficPackage,
  purchaseBalanceKopeks,
  isPending,
  error,
  initiallyExpanded = false,
  onPurchaseTraffic,
  onTopUpBalance,
}: UltimaTrafficTopUpSectionProps) {
  const [isExpanded, setIsExpanded] = useState(
    () => initiallyExpanded || selectedTrafficPackage !== null,
  );
  const selectedPackage =
    selectedTrafficPackage !== null
      ? (trafficPackages?.find((entry) => entry.gb === selectedTrafficPackage) ?? null)
      : null;
  const missingAmountKopeks = selectedPackage
    ? Math.max(0, selectedPackage.price_kopeks - purchaseBalanceKopeks)
    : 0;
  const hasEnoughBalance = !selectedPackage || missingAmountKopeks <= 0;
  const purchasedTrafficTotal =
    trafficPurchases?.reduce((sum, item) => sum + item.traffic_gb, 0) ?? 0;
  const cheapestPackage = trafficPackages?.reduce<TrafficPackage | null>((cheapest, item) => {
    if (!cheapest || item.price_kopeks < cheapest.price_kopeks) return item;
    return cheapest;
  }, null);

  useEffect(() => {
    if (selectedTrafficPackage !== null || error || isPending) {
      setIsExpanded(true);
    }
  }, [error, isPending, selectedTrafficPackage]);

  useEffect(() => {
    if (!initiallyExpanded) return;
    setIsExpanded(true);
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('ultima-traffic-top-up')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initiallyExpanded]);

  return (
    <section
      id="ultima-traffic-top-up"
      className={cn(ultimaPaneClassName, 'scroll-mt-4 p-3.5')}
      style={ultimaSurfaceStyle}
    >
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => {
          setIsExpanded((value) => {
            const next = !value;
            trackAnalyticsEvent('ultima_traffic_topup_toggle', {
              expanded: next,
              active_traffic_gb: purchasedTrafficTotal,
            });
            return next;
          });
        }}
        className="group w-full rounded-[22px] border border-white/[0.08] bg-black/[0.1] p-3 text-left transition-[border-color,background-color,box-shadow] hover:border-white/[0.16] hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-emerald-200/[0.22] bg-emerald-300/[0.12] text-emerald-50 shadow-[0_0_28px_rgba(45,212,191,0.14)]">
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-200" />
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M7 16a4 4 0 0 1-.88-7.9A5 5 0 0 1 16 6a5 5 0 0 1 1 9.9M12 10v8M9 13l3-3 3 3"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/[0.52]">
                {t('subscription.additionalOptions.buyTraffic')}
              </p>
              <h2 className="mt-0.5 truncate text-[19px] font-semibold leading-tight text-white">
                {t('subscription.additionalOptions.buyTrafficTitle')}
              </h2>
              <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-white/[0.62]">
                {t('subscription.additionalOptions.currentTrafficLimit', {
                  limit: trafficLimitGb,
                  used: trafficUsedGb.toFixed(1),
                })}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium text-white/[0.72]">
              {isExpanded
                ? t('common.collapse', { defaultValue: 'Collapse' })
                : t('subscription.trafficTimerDetails', { defaultValue: 'Details' })}
            </span>
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/[0.72] transition-transform duration-200',
                isExpanded && 'rotate-180',
              )}
              aria-hidden
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="m6 9 6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.035] px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-[0.1em] text-white/[0.38]">
              {t('subscription.additionalOptions.trafficLimitShort', { defaultValue: 'Limit' })}
            </div>
            <div className="mt-1 truncate text-[13px] font-semibold text-white">
              {trafficLimitGb} {t('common.units.gb')}
            </div>
          </div>
          <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.035] px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-[0.1em] text-white/[0.38]">
              {t('subscription.additionalOptions.trafficTopupActiveShort', {
                defaultValue: 'Active',
              })}
            </div>
            <div className="mt-1 truncate text-[13px] font-semibold text-emerald-50">
              {purchasedTrafficTotal > 0 ? '+' : ''}
              {purchasedTrafficTotal} {t('common.units.gb')}
            </div>
          </div>
          <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.035] px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-[0.1em] text-white/[0.38]">
              {t('subscription.additionalOptions.trafficPriceFromShort', { defaultValue: 'From' })}
            </div>
            <div className="mt-1 truncate text-[13px] font-semibold text-white">
              {cheapestPackage ? formatPrice(cheapestPackage.price_kopeks) : '-'}
            </div>
          </div>
        </div>
      </button>

      {isExpanded ? (
        <div className="mt-3">
          {trafficPurchases && trafficPurchases.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/[0.48]">
                  {t('subscription.purchasedTraffic')}
                </p>
                <span className="rounded-full border border-emerald-200/[0.18] bg-emerald-300/[0.1] px-2 py-0.5 text-[11px] font-medium text-emerald-50">
                  +{purchasedTrafficTotal} {t('common.units.gb')}
                </span>
              </div>
              <div className="space-y-2">
                {trafficPurchases.map((purchase) => (
                  <TrafficPurchaseTimer key={purchase.id} purchase={purchase} variant="ultima" />
                ))}
              </div>
            </div>
          ) : null}

          {!trafficPackages || trafficPackages.length === 0 ? (
            <div className="mt-3 rounded-[20px] border border-white/10 bg-black/10 px-4 py-3 text-[13px] text-white/[0.64]">
              {t('subscription.additionalOptions.trafficUnavailable')}
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                {trafficPackages.map((pkg) => {
                  const active = selectedTrafficPackage === pkg.gb;
                  return (
                    <button
                      key={pkg.gb}
                      type="button"
                      onClick={() => {
                        setSelectedTrafficPackage(pkg.gb);
                        trackAnalyticsEvent('ultima_traffic_package_select', {
                          gb: pkg.gb,
                          price_kopeks: pkg.price_kopeks,
                          is_unlimited: pkg.is_unlimited,
                        });
                      }}
                      className={cn(
                        'rounded-[22px] border px-4 py-3 text-left transition-colors',
                        active
                          ? 'border-white/25 bg-white/[0.08]'
                          : 'border-white/10 bg-black/10 hover:border-white/[0.18] hover:bg-white/[0.04]',
                      )}
                      style={active ? ultimaPaneSurfaceStyle : undefined}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[16px] font-medium text-white">
                            {pkg.is_unlimited
                              ? t('subscription.additionalOptions.unlimited')
                              : `${pkg.gb} ${t('common.units.gb')}`}
                          </div>
                          <div className="mt-1 text-[13px] text-white/[0.66]">
                            {formatPrice(pkg.price_kopeks)}
                          </div>
                        </div>
                        {pkg.discount_percent && pkg.discount_percent > 0 ? (
                          <span className="rounded-full border border-emerald-200/[0.24] bg-emerald-300/[0.12] px-2 py-1 text-[11px] font-medium text-emerald-50">
                            -{pkg.discount_percent}%
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedPackage ? (
                <div className="mt-3 rounded-[22px] border border-white/10 bg-black/10 px-4 py-3">
                  <div className="flex items-center justify-between gap-3 text-[14px] text-white/[0.78]">
                    <span>{t('subscription.total')}</span>
                    <span className="font-medium text-white">
                      {formatPrice(selectedPackage.price_kopeks)}
                    </span>
                  </div>
                  {missingAmountKopeks > 0 ? (
                    <div className="mt-3 space-y-3">
                      <p className="text-[13px] leading-snug text-amber-100/[0.88]">
                        {t('subscription.insufficientBalance', {
                          missing: formatPrice(missingAmountKopeks),
                        })}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          trackAnalyticsEvent('ultima_traffic_topup_balance_click', {
                            gb: selectedPackage.gb,
                            price_kopeks: selectedPackage.price_kopeks,
                            missing_kopeks: missingAmountKopeks,
                          });
                          onTopUpBalance(selectedPackage.gb);
                        }}
                        className="ultima-btn-pill ultima-btn-secondary w-full px-4 py-3 text-sm"
                      >
                        {t('balance.topUp')}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        trackAnalyticsEvent('ultima_traffic_purchase_click', {
                          gb: selectedPackage.gb,
                          price_kopeks: selectedPackage.price_kopeks,
                        });
                        onPurchaseTraffic(selectedPackage.gb);
                      }}
                      disabled={isPending || !hasEnoughBalance}
                      className="ultima-btn-pill ultima-btn-primary mt-3 w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-75"
                    >
                      {isPending
                        ? t('common.loading')
                        : selectedPackage.is_unlimited
                          ? t('subscription.additionalOptions.buyUnlimited')
                          : t('subscription.additionalOptions.buyTrafficGb', {
                              gb: selectedPackage.gb,
                            })}
                    </button>
                  )}
                  {error ? <p className="mt-3 text-[13px] text-rose-200">{error}</p> : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
