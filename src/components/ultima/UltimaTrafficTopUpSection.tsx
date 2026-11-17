import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { type TFunction } from 'i18next';
import { Check, ChevronDown, Clock3, CloudDownload, Gauge, WalletCards } from 'lucide-react';

import { TrafficPurchaseTimer } from '@/components/subscription/TrafficPurchaseTimer';
import { UltimaMeteredTrafficPeriodNotice } from './UltimaMeteredTrafficPeriodNotice';
import { ultimaPanelClassName, ultimaSurfaceStyle } from '@/features/ultima/surfaces';
import { cn } from '@/lib/utils';
import type { Subscription, TrafficPackage, TrafficPurchase } from '@/types';
import { trackAnalyticsEvent } from '@/utils/analyticsEvents';

type UltimaTrafficTopUpSectionProps = {
  t: TFunction;
  formatPrice: (kopeks: number) => string;
  subscription?: Subscription | null;
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
  showTrafficSummary?: boolean;
  onPurchaseTraffic: (gb: number) => void;
  onTopUpBalance: (gb: number) => void;
};

const TRAFFIC_VALIDITY_DAYS = 30;

export function UltimaTrafficTopUpSection({
  t,
  formatPrice,
  subscription,
  trafficLimitGb: fallbackTrafficLimitGb,
  trafficUsedGb: fallbackTrafficUsedGb,
  trafficPurchases: fallbackTrafficPurchases,
  trafficPackages,
  selectedTrafficPackage,
  setSelectedTrafficPackage,
  purchaseBalanceKopeks,
  isPending,
  error,
  initiallyExpanded = false,
  showTrafficSummary = true,
  onPurchaseTraffic,
  onTopUpBalance,
}: UltimaTrafficTopUpSectionProps) {
  const trafficLimitGb = subscription?.traffic_limit_gb ?? fallbackTrafficLimitGb;
  const trafficUsedGb = subscription?.traffic_used_gb ?? fallbackTrafficUsedGb;
  const trafficPurchases = subscription ? subscription.traffic_purchases : fallbackTrafficPurchases;
  const hasMonthlyMeteredTraffic =
    subscription?.metered_traffic_enabled &&
    subscription.traffic_reset_mode === 'MONTH' &&
    trafficLimitGb > 0;
  const [isExpanded, setIsExpanded] = useState(
    () => initiallyExpanded || selectedTrafficPackage !== null,
  );
  const didSelectInitialPackage = useRef(false);
  const disclosureId = useId();
  const reduceMotion = useReducedMotion();
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
    subscription?.purchased_traffic_gb ??
    trafficPurchases?.reduce((sum, item) => sum + item.traffic_gb, 0) ??
    0;
  const trafficRemainingGb = Math.max(
    0,
    subscription?.metered_traffic_enabled
      ? (subscription.metered_traffic_remaining_gb ?? trafficLimitGb - trafficUsedGb)
      : trafficLimitGb - trafficUsedGb,
  );
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
  }, [cheapestPackage, initiallyExpanded, selectedTrafficPackage, setSelectedTrafficPackage]);

  useEffect(() => {
    if (!initiallyExpanded) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('ultima-traffic-top-up')?.scrollIntoView({
        behavior: reduceMotion ? 'instant' : 'smooth',
        block: 'start',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initiallyExpanded, reduceMotion]);

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
      className={cn(ultimaPanelClassName, 'ultima-traffic-topup scroll-mt-4')}
      data-expanded={isExpanded}
      style={ultimaSurfaceStyle}
    >
      <button
        type="button"
        data-testid="ultima-traffic-top-up-toggle"
        aria-expanded={isExpanded}
        aria-controls={disclosureId}
        onClick={toggleExpanded}
        className="ultima-traffic-topup-toggle"
      >
        <span className="ultima-traffic-topup-icon" aria-hidden="true">
          <CloudDownload size={19} strokeWidth={1.8} />
        </span>
        <span className="ultima-traffic-topup-label">
          <strong>{t('ultima.trafficTopUp.title')}</strong>
          {cheapestPackage ? (
            <span>
              {t('ultima.trafficTopUp.priceFrom', {
                price: formatPrice(cheapestPackage.price_kopeks),
              })}
            </span>
          ) : null}
        </span>
        <ChevronDown className="ultima-traffic-topup-chevron" size={18} aria-hidden="true" />
      </button>

      {showTrafficSummary && (
        <div className="ultima-traffic-topup-quota">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="ultima-traffic-topup-muted">{t('ultima.trafficTopUp.remaining')}</p>
              <p className="mt-1 text-[17px] font-semibold leading-none">
                {formatTraffic(trafficRemainingGb)} {t('common.units.gb')}
              </p>
            </div>
            <div className="flex min-w-0 flex-wrap justify-end gap-1.5">
              {purchasedTrafficTotal > 0 ? (
                <span className="ultima-traffic-topup-bonus">
                  {t('ultima.trafficTopUp.activeBonus', {
                    traffic: formatTraffic(purchasedTrafficTotal),
                  })}
                </span>
              ) : null}
              <span className="ultima-traffic-topup-muted">
                {t('ultima.trafficTopUp.ofLimit', { limit: formatTraffic(trafficLimitGb) })}
              </span>
            </div>
          </div>
          <div className="ultima-traffic-topup-meter" aria-hidden="true">
            <div
              data-low={trafficRemainingPercent <= 10 || undefined}
              style={{ width: `${trafficRemainingPercent}%` }}
            />
          </div>
        </div>
      )}

      <div id={disclosureId} inert={!isExpanded}>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="traffic-options"
              className="overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.29, ease: [0.22, 0.8, 0.24, 1] }}
            >
              <div className="ultima-traffic-topup-body">
                {trafficPurchases && trafficPurchases.length > 0 ? (
                  <section data-testid="ultima-traffic-active-packages">
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Clock3 className="h-4 w-4 shrink-0 text-emerald-100/[0.72]" />
                        <h3 className="break-words text-[13px] font-semibold text-white">
                          {t('ultima.trafficTopUp.activePackages')}
                        </h3>
                      </div>
                      <span className="shrink-0 text-[13px] font-semibold text-emerald-100">
                        +{formatTraffic(purchasedTrafficTotal)} {t('common.units.gb')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {trafficPurchases.map((purchase) => (
                        <TrafficPurchaseTimer
                          key={purchase.id}
                          purchase={purchase}
                          variant="ultima"
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                {!trafficPackages || trafficPackages.length === 0 ? (
                  <div className="border-t border-white/[0.07] py-4 text-[13px] leading-relaxed text-white/[0.72]">
                    {t('ultima.trafficTopUp.unavailable')}
                  </div>
                ) : (
                  <>
                    <section
                      className={cn(
                        trafficPurchases?.length && 'mt-4 border-t border-white/[0.07] pt-4',
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-emerald-100/[0.72]" />
                        <div>
                          <h3 className="text-[13px] font-semibold text-white">
                            {t('ultima.trafficTopUp.selectTitle')}
                          </h3>
                          {hasMonthlyMeteredTraffic ? (
                            <UltimaMeteredTrafficPeriodNotice
                              subscription={subscription}
                              variant="topUp"
                              className="mt-1"
                            />
                          ) : (
                            <p className="mt-1 text-[13px] leading-relaxed text-white/[0.72]">
                              {t('ultima.trafficTopUp.selectHint', { days: TRAFFIC_VALIDITY_DAYS })}
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        role="radiogroup"
                        aria-label={t('ultima.trafficTopUp.selectTitle')}
                        className="ultima-traffic-topup-options"
                      >
                        {trafficPackages.map((pkg, index) => {
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
                              tabIndex={active || (!selectedPackage && index === 0) ? 0 : -1}
                              data-testid={`ultima-traffic-package-${pkg.gb}`}
                              onClick={() => selectPackage(pkg)}
                              onKeyDown={(event) => {
                                const forward = ['ArrowRight', 'ArrowDown'].includes(event.key);
                                const backward = ['ArrowLeft', 'ArrowUp'].includes(event.key);
                                if (!forward && !backward) return;
                                event.preventDefault();
                                const count = trafficPackages.length;
                                const next = (index + (forward ? 1 : -1) + count) % count;
                                selectPackage(trafficPackages[next]);
                                event.currentTarget.parentElement
                                  ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
                                  [next]?.focus();
                              }}
                              className="ultima-traffic-topup-option"
                            >
                              <span className="ultima-traffic-topup-option-size">
                                <span>{packageLabel}</span>
                                {pkg.discount_percent && pkg.discount_percent > 0 ? (
                                  <small className="ultima-traffic-topup-bonus">
                                    -{pkg.discount_percent}%
                                  </small>
                                ) : null}
                              </span>
                              <span className="ultima-traffic-topup-option-price">
                                <strong>{formatPrice(pkg.price_kopeks)}</strong>
                                {pkg.base_price_kopeks &&
                                pkg.base_price_kopeks > pkg.price_kopeks ? (
                                  <s>{formatPrice(pkg.base_price_kopeks)}</s>
                                ) : null}
                              </span>
                              <span className="ultima-traffic-topup-check" aria-hidden="true">
                                {active && <Check size={12} strokeWidth={2.5} />}
                              </span>
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
                        <dl className="ultima-traffic-topup-order">
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
                              <dt>{item.label}</dt>
                              <dd>{item.value}</dd>
                            </div>
                          ))}
                        </dl>

                        <div className="mt-4 flex items-start gap-2 border-t border-white/[0.06] pt-3 text-[13px] leading-relaxed text-white/[0.72]">
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
                        {error ? <p className="mt-3 text-[13px] text-rose-200">{error}</p> : null}
                      </section>
                    ) : null}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
