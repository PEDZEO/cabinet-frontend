import type { TFunction } from 'i18next';

import type { Subscription, Tariff } from '@/types';

import type { ApplyPromoDiscount } from '../types';

type TariffCardsGridProps = {
  t: TFunction;
  formatPrice: (kopeks: number) => string;
  tariffs: Tariff[];
  subscription: Subscription | null;
  isSubscriptionExpired: boolean;
  applyPromoDiscount: ApplyPromoDiscount;
  onSelectTariff: (tariff: Tariff) => void;
  onSwitchTariff: (tariffId: number) => void;
};

export const TariffCardsGrid = ({
  t,
  formatPrice,
  tariffs,
  subscription,
  isSubscriptionExpired,
  applyPromoDiscount,
  onSelectTariff,
  onSwitchTariff,
}: TariffCardsGridProps) => {
  return (
    <>
      {tariffs.some((tariff) => tariff.promo_group_name) && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-success-500/30 bg-success-500/10 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-500/20 text-success-400">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-success-400">
              {t('subscription.promoGroup.yourGroup', {
                name: tariffs.find((tariff) => tariff.promo_group_name)?.promo_group_name,
              })}
            </div>
            <div className="text-xs text-dark-400">
              {t('subscription.promoGroup.personalDiscountsApplied')}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[...tariffs]
          .filter(
            (tariff) => !(subscription?.is_trial && tariff.name.toLowerCase().includes('trial')),
          )
          .sort((a, b) => {
            const aIsCurrent = a.is_current || a.id === subscription?.tariff_id;
            const bIsCurrent = b.is_current || b.id === subscription?.tariff_id;
            if (aIsCurrent && !bIsCurrent) return -1;
            if (!aIsCurrent && bIsCurrent) return 1;
            return 0;
          })
          .map((tariff) => {
            const isCurrentTariff = tariff.is_current || tariff.id === subscription?.tariff_id;
            const canSwitch =
              !!subscription &&
              !!subscription.tariff_id &&
              !isCurrentTariff &&
              !subscription.is_trial &&
              !isSubscriptionExpired &&
              subscription.is_active;
            const isLegacySubscription =
              !!subscription && !subscription.is_trial && !subscription.tariff_id;
            const handleSelectTariff = () => onSelectTariff(tariff);

            const actionConfig = canSwitch
              ? {
                  label: t('subscription.switchTariff.switch'),
                  className: 'btn-secondary flex-1 py-2 text-sm',
                  onClick: () => onSwitchTariff(tariff.id),
                }
              : {
                  label: isCurrentTariff
                    ? t('subscription.extend')
                    : isLegacySubscription
                      ? t('subscription.tariff.selectForRenewal')
                      : t('subscription.purchase'),
                  className: 'btn-primary flex-1 py-2 text-sm',
                  onClick: handleSelectTariff,
                };

            return (
              <div
                key={tariff.id}
                className={`bento-card-hover p-5 text-left transition-all ${
                  isCurrentTariff ? 'bento-card-glow border-accent-500' : ''
                }`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold text-dark-100">{tariff.name}</div>
                    {tariff.description && (
                      <div className="mt-1 text-sm text-dark-400">{tariff.description}</div>
                    )}
                  </div>
                  {isCurrentTariff && (
                    <span className="badge-success text-xs">{t('subscription.currentTariff')}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4 text-accent-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                      />
                    </svg>
                    <span className="font-medium text-dark-200">{tariff.traffic_limit_label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4 text-dark-400"
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
                    <span className="text-dark-300">
                      {t('subscription.devices', { count: tariff.device_limit })}
                    </span>
                  </div>
                  {tariff.traffic_reset_mode && tariff.traffic_reset_mode !== 'NO_RESET' && (
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="h-4 w-4 text-dark-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182"
                        />
                      </svg>
                      <span className="text-dark-300">
                        {t(`subscription.trafficReset.${tariff.traffic_reset_mode}`)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 border-t border-dark-700/50 pt-3 text-sm text-dark-400">
                  {(() => {
                    const dailyPrice =
                      tariff.daily_price_kopeks ?? tariff.price_per_day_kopeks ?? 0;
                    const originalDailyPrice = tariff.original_daily_price_kopeks || 0;
                    const hasExistingDailyDiscount = originalDailyPrice > dailyPrice;
                    if (dailyPrice > 0) {
                      const promoDaily = applyPromoDiscount(dailyPrice, hasExistingDailyDiscount);
                      return (
                        <span className="flex items-center gap-2">
                          <span className="font-medium text-accent-400">
                            {formatPrice(promoDaily.price)}
                          </span>
                          {(hasExistingDailyDiscount || promoDaily.original) && (
                            <span className="text-xs text-dark-500 line-through">
                              {formatPrice(
                                hasExistingDailyDiscount
                                  ? originalDailyPrice
                                  : (promoDaily.original ?? 0),
                              )}
                            </span>
                          )}
                          <span>{t('subscription.tariff.perDay')}</span>
                          {tariff.daily_discount_percent && tariff.daily_discount_percent > 0 ? (
                            <span className="rounded bg-success-500/20 px-1.5 py-0.5 text-xs text-success-400">
                              -{tariff.daily_discount_percent}%
                            </span>
                          ) : (
                            promoDaily.percent && (
                              <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-xs text-orange-400">
                                -{promoDaily.percent}%
                              </span>
                            )
                          )}
                        </span>
                      );
                    }

                    if (tariff.periods.length > 0) {
                      const firstPeriod = tariff.periods[0];
                      const hasExistingDiscount = !!(
                        firstPeriod?.original_price_kopeks &&
                        firstPeriod.original_price_kopeks > firstPeriod.price_kopeks
                      );
                      const promoPeriod = applyPromoDiscount(
                        firstPeriod?.price_kopeks || 0,
                        hasExistingDiscount,
                      );
                      return (
                        <span className="flex flex-wrap items-center gap-2">
                          <span>{t('subscription.from')}</span>
                          <span className="font-medium text-accent-400">
                            {formatPrice(promoPeriod.price)}
                          </span>
                          {(hasExistingDiscount || promoPeriod.original) && (
                            <span className="text-xs text-dark-500 line-through">
                              {formatPrice(
                                hasExistingDiscount
                                  ? (firstPeriod?.original_price_kopeks ?? 0)
                                  : (promoPeriod.original ?? 0),
                              )}
                            </span>
                          )}
                          {hasExistingDiscount && firstPeriod.discount_percent ? (
                            <span className="rounded bg-success-500/20 px-1.5 py-0.5 text-xs text-success-400">
                              -{firstPeriod.discount_percent}%
                            </span>
                          ) : (
                            promoPeriod.percent && (
                              <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-xs text-orange-400">
                                -{promoPeriod.percent}%
                              </span>
                            )
                          )}
                        </span>
                      );
                    }

                    return (
                      <span className="font-medium text-accent-400">
                        {t('subscription.tariff.flexiblePayment')}
                      </span>
                    );
                  })()}
                </div>

                <div className="mt-4 flex gap-2">
                  {isCurrentTariff && subscription?.is_daily ? (
                    <div className="flex-1 py-2 text-center text-sm text-dark-500">
                      {t('subscription.currentTariff')}
                    </div>
                  ) : (
                    <button onClick={actionConfig.onClick} className={actionConfig.className}>
                      {actionConfig.label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
};
