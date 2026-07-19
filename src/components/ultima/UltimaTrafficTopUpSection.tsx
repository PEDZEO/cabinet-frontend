import { useEffect, useRef, useState } from 'react';
import { type TFunction } from 'i18next';
import { Check, ChevronDown, Clock3, CloudDownload, Gauge, WalletCards } from 'lucide-react';

import { TrafficPurchaseTimer } from '@/components/subscription/TrafficPurchaseTimer';
import {
  ultimaAccentSurfaceStyle,
  ultimaPanelClassName,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';
import { cn } from '@/lib/utils';
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

const TRAFFIC_VALIDITY_DAYS = 30;

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
  const didSelectInitialPackage = useRef(false);
  const selectedPackage =
    selectedTrafficPackage !== null
      ? (trafficPackages?.find((entry) => entry.gb === selectedTrafficPackage) ?? null)
      : null;
  const cheapestPackage = trafficPackages?.reduce<TrafficPackage | null>((cheapest, item) => {
    if (!cheapest || item.price_kopeks < cheapest.price_kopeks) return item;
    return cheapest;
  }, null);
  const missingAmountKopeks = selectedPackage
    ? Math.max(0, selectedPackage.price_kopeks - purchaseBalanceKopeks)
    : 0;
  const purchasedTrafficTotal =
    trafficPurchases?.reduce((sum, item) => sum + item.traffic_gb, 0) ?? 0;
  const trafficRemainingGb = Math.max(0, trafficLimitGb - trafficUsedGb);
  const trafficRemainingPercent = Math.min(
    100,
    Math.max(0, trafficLimitGb > 0 ? (trafficRemainingGb / trafficLimitGb) * 100 : 0),
  );
  const formatTraffic = (value: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);

  useEffect(() => {
    if (selectedTrafficPackage !== null || error || isPending) {
      setIsExpanded(true);
    }
  }, [error, isPending, selectedTrafficPackage]);

  useEffect(() => {
    if (!initiallyExpanded) return;
    setIsExpanded(true);
    if (!didSelectInitialPackage.current && selectedTrafficPackage === null && cheapestPackage) {
      didSelectInitialPackage.current = true;
      setSelectedTrafficPackage(cheapestPackage.gb);
    }
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('ultima-traffic-top-up')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [cheapestPackage, initiallyExpanded, selectedTrafficPackage, setSelectedTrafficPackage]);

  const toggleExpanded = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    if (next && selectedTrafficPackage === null && cheapestPackage) {
      setSelectedTrafficPackage(cheapestPackage.gb);
    }
    trackAnalyticsEvent('ultima_traffic_topup_toggle', {
      expanded: next,
      active_traffic_gb: purchasedTrafficTotal,
    });
  };

  const selectPackage = (pkg: TrafficPackage) => {
    setSelectedTrafficPackage(pkg.gb);
    trackAnalyticsEvent('ultima_traffic_package_select', {
      gb: pkg.gb,
      price_kopeks: pkg.price_kopeks,
      is_unlimited: pkg.is_unlimited,
    });
  };

  return (
    <section
      id="ultima-traffic-top-up"
      data-testid="ultima-traffic-top-up"
      className={cn(ultimaPanelClassName, 'scroll-mt-4 overflow-hidden')}
      style={ultimaSurfaceStyle}
    >
      <button
        type="button"
        data-testid="ultima-traffic-top-up-toggle"
        aria-expanded={isExpanded}
        onClick={toggleExpanded}
        className="group w-full p-4 text-left transition-colors hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/25 lg:p-5"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-emerald-200/[0.2] bg-emerald-300/[0.1] text-emerald-50 shadow-[0_0_26px_rgba(45,212,191,0.12)] lg:rounded-[7px]">
              <CloudDownload className="h-5 w-5" />
              {purchasedTrafficTotal > 0 ? (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#102623] bg-emerald-200" />
              ) : null}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase text-white/[0.42]">
                {t('ultima.trafficTopUp.eyebrow')}
              </p>
              <h2 className="mt-0.5 break-words text-[18px] font-semibold leading-tight text-white">
                {t('ultima.trafficTopUp.title')}
              </h2>
              <p className="mt-1 break-words text-[11px] leading-snug text-white/[0.5]">
                {t('ultima.trafficTopUp.hint')}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {cheapestPackage ? (
              <span className="hidden rounded-full border border-white/[0.09] bg-white/[0.045] px-2.5 py-1 text-[10px] font-medium text-white/[0.64] min-[360px]:inline-flex">
                {t('ultima.trafficTopUp.priceFrom', {
                  price: formatPrice(cheapestPackage.price_kopeks),
                })}
              </span>
            ) : null}
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.04] text-white/[0.66] transition-transform duration-200',
                isExpanded && 'rotate-180',
              )}
              aria-hidden
            >
              <ChevronDown className="h-4 w-4" />
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase text-white/[0.36]">
              {t('ultima.trafficTopUp.remaining')}
            </p>
            <p className="mt-1 text-[17px] font-semibold leading-none text-white">
              {formatTraffic(trafficRemainingGb)} {t('common.units.gb')}
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap justify-end gap-1.5">
            {purchasedTrafficTotal > 0 ? (
              <span className="rounded-full border border-emerald-200/[0.18] bg-emerald-300/[0.09] px-2.5 py-1 text-[10px] font-medium text-emerald-50">
                {t('ultima.trafficTopUp.activeBonus', {
                  traffic: formatTraffic(purchasedTrafficTotal),
                })}
              </span>
            ) : null}
            <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] text-white/[0.5]">
              {t('ultima.trafficTopUp.ofLimit', { limit: formatTraffic(trafficLimitGb) })}
            </span>
          </div>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-black/[0.24]">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${
              trafficRemainingPercent <= 10 ? 'bg-amber-300' : 'bg-emerald-300'
            }`}
            style={{ width: `${trafficRemainingPercent}%` }}
          />
        </div>
      </button>

      {isExpanded ? (
        <div className="border-t border-white/[0.08] px-4 pb-4 pt-4 lg:px-5 lg:pb-5">
          {trafficPurchases && trafficPurchases.length > 0 ? (
            <section data-testid="ultima-traffic-active-packages">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Clock3 className="h-4 w-4 shrink-0 text-emerald-100/[0.72]" />
                  <h3 className="break-words text-[12px] font-semibold text-white">
                    {t('ultima.trafficTopUp.activePackages')}
                  </h3>
                </div>
                <span className="shrink-0 text-[11px] font-semibold text-emerald-100">
                  +{formatTraffic(purchasedTrafficTotal)} {t('common.units.gb')}
                </span>
              </div>
              <div className="space-y-2">
                {trafficPurchases.map((purchase) => (
                  <TrafficPurchaseTimer key={purchase.id} purchase={purchase} variant="ultima" />
                ))}
              </div>
            </section>
          ) : null}

          {!trafficPackages || trafficPackages.length === 0 ? (
            <div className="border-t border-white/[0.07] py-4 text-[13px] leading-relaxed text-white/[0.58]">
              {t('ultima.trafficTopUp.unavailable')}
            </div>
          ) : (
            <>
              <section
                className={cn(trafficPurchases?.length && 'mt-4 border-t border-white/[0.07] pt-4')}
              >
                <div className="flex items-start gap-2.5">
                  <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-emerald-100/[0.72]" />
                  <div>
                    <h3 className="text-[13px] font-semibold text-white">
                      {t('ultima.trafficTopUp.selectTitle')}
                    </h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/[0.48]">
                      {t('ultima.trafficTopUp.selectHint', { days: TRAFFIC_VALIDITY_DAYS })}
                    </p>
                  </div>
                </div>

                <div
                  role="radiogroup"
                  aria-label={t('ultima.trafficTopUp.selectTitle')}
                  className="mt-3 grid grid-cols-2 gap-2"
                >
                  {trafficPackages.map((pkg) => {
                    const active = selectedTrafficPackage === pkg.gb;
                    const packageLabel = pkg.is_unlimited
                      ? t('subscription.additionalOptions.unlimited')
                      : `+${formatTraffic(pkg.gb)} ${t('common.units.gb')}`;
                    return (
                      <button
                        key={pkg.gb}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        data-testid={`ultima-traffic-package-${pkg.gb}`}
                        onClick={() => selectPackage(pkg)}
                        className={cn(
                          'relative min-h-[104px] rounded-[18px] border p-3 text-left transition-colors lg:rounded-[8px]',
                          active
                            ? 'border-emerald-200/[0.32] bg-emerald-300/[0.09]'
                            : 'border-white/[0.09] bg-white/[0.025] hover:bg-white/[0.05]',
                        )}
                        style={active ? ultimaAccentSurfaceStyle : undefined}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="break-words text-[16px] font-semibold leading-tight text-white">
                            {packageLabel}
                          </span>
                          {active ? (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-emerald-950">
                              <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                            </span>
                          ) : pkg.discount_percent && pkg.discount_percent > 0 ? (
                            <span className="shrink-0 rounded-full border border-emerald-200/[0.2] bg-emerald-300/[0.09] px-1.5 py-0.5 text-[9px] font-semibold text-emerald-50">
                              -{pkg.discount_percent}%
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-[10px] text-white/[0.42]">
                          {t('ultima.trafficTopUp.validFor', { days: TRAFFIC_VALIDITY_DAYS })}
                        </p>
                        <div className="mt-2 flex items-end gap-2">
                          <span className="text-[14px] font-semibold text-white">
                            {formatPrice(pkg.price_kopeks)}
                          </span>
                          {pkg.base_price_kopeks && pkg.base_price_kopeks > pkg.price_kopeks ? (
                            <span className="text-[10px] text-white/[0.34] line-through">
                              {formatPrice(pkg.base_price_kopeks)}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {selectedPackage ? (
                <section
                  data-testid="ultima-traffic-order"
                  className="mt-4 border-t border-white/[0.08] pt-4"
                >
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 min-[560px]:grid-cols-4">
                    {[
                      {
                        label: t('ultima.trafficTopUp.package'),
                        value: selectedPackage.is_unlimited
                          ? t('subscription.additionalOptions.unlimited')
                          : `+${formatTraffic(selectedPackage.gb)} ${t('common.units.gb')}`,
                      },
                      {
                        label: t('ultima.trafficTopUp.validity'),
                        value: t('ultima.trafficTopUp.validFor', {
                          days: TRAFFIC_VALIDITY_DAYS,
                        }),
                      },
                      {
                        label: t('ultima.trafficTopUp.balance'),
                        value: formatPrice(purchaseBalanceKopeks),
                      },
                      {
                        label: t('ultima.trafficTopUp.payment'),
                        value: formatPrice(selectedPackage.price_kopeks),
                      },
                    ].map((item) => (
                      <div key={item.label} className="min-w-0">
                        <p className="text-[9px] font-medium uppercase text-white/[0.36]">
                          {item.label}
                        </p>
                        <p className="mt-1 break-words text-[12px] font-semibold leading-tight text-white">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-start gap-2 border-t border-white/[0.06] pt-3 text-[11px] leading-relaxed text-white/[0.46]">
                    <WalletCards className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      {missingAmountKopeks > 0
                        ? t('ultima.trafficTopUp.insufficientHint', {
                            price: formatPrice(missingAmountKopeks),
                          })
                        : t('ultima.trafficTopUp.addedToLimit')}
                    </p>
                  </div>

                  {missingAmountKopeks > 0 ? (
                    <button
                      type="button"
                      data-testid="ultima-traffic-top-up-balance"
                      onClick={() => {
                        trackAnalyticsEvent('ultima_traffic_topup_balance_click', {
                          gb: selectedPackage.gb,
                          price_kopeks: selectedPackage.price_kopeks,
                          missing_kopeks: missingAmountKopeks,
                        });
                        onTopUpBalance(selectedPackage.gb);
                      }}
                      className="ultima-btn-pill ultima-btn-primary mt-3 w-full px-4 py-3 text-[13px] font-semibold"
                    >
                      {t('ultima.trafficTopUp.topUp', {
                        price: formatPrice(missingAmountKopeks),
                      })}
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid="ultima-traffic-purchase"
                      onClick={() => {
                        trackAnalyticsEvent('ultima_traffic_purchase_click', {
                          gb: selectedPackage.gb,
                          price_kopeks: selectedPackage.price_kopeks,
                        });
                        onPurchaseTraffic(selectedPackage.gb);
                      }}
                      disabled={isPending}
                      className="ultima-btn-pill ultima-btn-primary mt-3 w-full px-4 py-3 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isPending
                        ? t('common.loading')
                        : selectedPackage.is_unlimited
                          ? t('ultima.trafficTopUp.buyUnlimited', {
                              price: formatPrice(selectedPackage.price_kopeks),
                            })
                          : t('ultima.trafficTopUp.buy', {
                              traffic: formatTraffic(selectedPackage.gb),
                              price: formatPrice(selectedPackage.price_kopeks),
                            })}
                    </button>
                  )}
                  {error ? <p className="mt-3 text-[12px] text-rose-200">{error}</p> : null}
                </section>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
