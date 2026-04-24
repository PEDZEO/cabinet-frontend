import { type TFunction } from 'i18next';

import {
  ultimaPaneClassName,
  ultimaPaneSurfaceStyle,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';
import { cn } from '@/lib/utils';
import type { TrafficPackage } from '@/types';

type UltimaTrafficTopUpSectionProps = {
  t: TFunction;
  formatPrice: (kopeks: number) => string;
  trafficLimitGb: number;
  trafficUsedGb: number;
  trafficPackages: TrafficPackage[] | undefined;
  selectedTrafficPackage: number | null;
  setSelectedTrafficPackage: (value: number | null) => void;
  purchaseBalanceKopeks: number;
  isPending: boolean;
  error: string | null;
  onPurchaseTraffic: (gb: number) => void;
  onTopUpBalance: (gb: number) => void;
};

export function UltimaTrafficTopUpSection({
  t,
  formatPrice,
  trafficLimitGb,
  trafficUsedGb,
  trafficPackages,
  selectedTrafficPackage,
  setSelectedTrafficPackage,
  purchaseBalanceKopeks,
  isPending,
  error,
  onPurchaseTraffic,
  onTopUpBalance,
}: UltimaTrafficTopUpSectionProps) {
  const selectedPackage =
    selectedTrafficPackage !== null
      ? (trafficPackages?.find((entry) => entry.gb === selectedTrafficPackage) ?? null)
      : null;
  const missingAmountKopeks = selectedPackage
    ? Math.max(0, selectedPackage.price_kopeks - purchaseBalanceKopeks)
    : 0;
  const hasEnoughBalance = !selectedPackage || missingAmountKopeks <= 0;

  return (
    <section className={cn(ultimaPaneClassName, 'p-3.5')} style={ultimaSurfaceStyle}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-white/56 text-[12px] font-medium uppercase tracking-[0.14em]">
            {t('subscription.additionalOptions.buyTraffic')}
          </p>
          <h2 className="mt-1 text-[20px] font-semibold leading-tight text-white">
            {t('subscription.additionalOptions.buyTrafficTitle')}
          </h2>
          <p className="text-white/66 mt-1.5 text-[13px] leading-snug">
            {t('subscription.additionalOptions.currentTrafficLimit', {
              limit: trafficLimitGb,
              used: trafficUsedGb.toFixed(1),
            })}
          </p>
        </div>
      </div>

      {!trafficPackages || trafficPackages.length === 0 ? (
        <div className="text-white/64 mt-3 rounded-[20px] border border-white/10 bg-black/10 px-4 py-3 text-[13px]">
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
                  onClick={() => setSelectedTrafficPackage(pkg.gb)}
                  className={cn(
                    'rounded-[22px] border px-4 py-3 text-left transition-colors',
                    active
                      ? 'border-white/25 bg-white/[0.08]'
                      : 'hover:border-white/18 border-white/10 bg-black/10 hover:bg-white/[0.04]',
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
                      <div className="text-white/66 mt-1 text-[13px]">
                        {formatPrice(pkg.price_kopeks)}
                      </div>
                    </div>
                    {pkg.discount_percent && pkg.discount_percent > 0 ? (
                      <span className="border-emerald-200/24 bg-emerald-300/12 rounded-full border px-2 py-1 text-[11px] font-medium text-emerald-50">
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
              <div className="text-white/78 flex items-center justify-between gap-3 text-[14px]">
                <span>{t('subscription.total')}</span>
                <span className="font-medium text-white">
                  {formatPrice(selectedPackage.price_kopeks)}
                </span>
              </div>
              {missingAmountKopeks > 0 ? (
                <div className="mt-3 space-y-3">
                  <p className="text-amber-100/88 text-[13px] leading-snug">
                    {t('subscription.insufficientBalance', {
                      missing: formatPrice(missingAmountKopeks),
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() => onTopUpBalance(selectedPackage.gb)}
                    className="ultima-btn-pill ultima-btn-secondary w-full px-4 py-3 text-sm"
                  >
                    {t('balance.topUp')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onPurchaseTraffic(selectedPackage.gb)}
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
    </section>
  );
}
