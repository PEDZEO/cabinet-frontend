import type { TFunction } from 'i18next';
import { ArrowRight, Check, Gauge, Smartphone } from 'lucide-react';

import type { ApplyPromoDiscount } from '@/features/subscription/types';
import { isUltimaTariffUnlimited } from '@/features/ultima/subscription';
import {
  ultimaAccentSurfaceStyle,
  ultimaPaneClassName,
  ultimaPaneSurfaceStyle,
} from '@/features/ultima/surfaces';
import { cn } from '@/lib/utils';
import type { Tariff } from '@/types';

type UltimaTariffSelectorProps = {
  tariffs: Tariff[];
  selectedTariffId: number;
  currentTariffId: number | null;
  t: TFunction;
  formatPrice: (kopeks: number) => string;
  applyPromoDiscount: ApplyPromoDiscount;
  onSelectTariff: (tariffId: number) => void;
  showHeading?: boolean;
};

export function UltimaTariffSelector({
  tariffs,
  selectedTariffId,
  currentTariffId,
  t,
  formatPrice,
  applyPromoDiscount,
  onSelectTariff,
  showHeading = true,
}: UltimaTariffSelectorProps) {
  return (
    <section className="mb-3 space-y-2.5">
      {showHeading ? (
        <div>
          <p className="text-[11px] font-semibold uppercase text-white/[0.46]">
            {t('dashboard.expired.tariffs')}
          </p>
        </div>
      ) : null}

      <div className="grid gap-2.5 md:grid-cols-2">
        {tariffs.map((tariff) => {
          const selected = tariff.id === selectedTariffId;
          const current = tariff.id === currentTariffId || tariff.is_current;
          const isUnlimited = isUltimaTariffUnlimited(tariff);
          const dailyPrice = tariff.daily_price_kopeks ?? tariff.price_per_day_kopeks ?? 0;
          const firstPeriod = tariff.periods[0] ?? null;
          const pricePreview =
            dailyPrice > 0
              ? applyPromoDiscount(
                  dailyPrice,
                  (tariff.original_daily_price_kopeks ?? 0) > dailyPrice
                    ? (tariff.original_daily_price_kopeks ?? null)
                    : null,
                )
              : firstPeriod
                ? applyPromoDiscount(
                    firstPeriod.price_kopeks,
                    (firstPeriod.original_price_kopeks ?? 0) > firstPeriod.price_kopeks
                      ? (firstPeriod.original_price_kopeks ?? null)
                      : null,
                  )
                : null;
          const priceLabel = pricePreview
            ? formatPrice(pricePreview.price)
            : t('subscription.tariff.flexiblePayment');
          const description = tariff.description?.trim() ?? '';

          return (
            <button
              key={tariff.id}
              type="button"
              onClick={() => onSelectTariff(tariff.id)}
              className={cn(
                ultimaPaneClassName,
                'relative overflow-hidden rounded-[14px] border p-3 text-left transition-all lg:rounded-[8px]',
                selected
                  ? 'border-white/25 bg-white/[0.08] shadow-[0_0_0_1px_color-mix(in_srgb,var(--ultima-color-primary)_28%,transparent)]'
                  : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]',
              )}
              style={selected ? ultimaAccentSurfaceStyle : ultimaPaneSurfaceStyle}
              aria-pressed={selected}
            >
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="truncate text-[18px] font-semibold leading-none text-white">
                        {tariff.name}
                      </div>
                      {current ? (
                        <span className="shrink-0 rounded-full border border-emerald-200/[0.24] bg-emerald-300/[0.1] px-2 py-0.5 text-[9px] font-semibold text-emerald-50">
                          {t('subscription.currentTariff')}
                        </span>
                      ) : null}
                    </div>
                    {description ? (
                      <p className="mt-1 line-clamp-1 max-w-[42ch] whitespace-pre-line text-[11px] leading-[1.35] text-white/[0.56]">
                        {description}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[18px] font-semibold leading-none text-white">
                      {priceLabel}
                    </div>
                    <div className="mt-1 text-[9px] text-white/[0.46]">
                      {dailyPrice > 0
                        ? t('subscription.tariff.perDay')
                        : firstPeriod
                          ? `${t('subscription.from')} ${firstPeriod.label}`
                          : t('subscription.tariff.flexiblePayment')}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-white/[0.08] pt-2.5 text-[10px] text-white/[0.62]">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {isUnlimited ? t('subscription.unlimited') : tariff.traffic_limit_label}
                    </span>
                  </span>
                  <span className="h-3 w-px bg-white/[0.1]" />
                  <span className="inline-flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5" />
                    {t('subscription.devices', { count: tariff.device_limit })}
                  </span>
                  {pricePreview?.original && pricePreview.original > pricePreview.price ? (
                    <span className="ml-auto text-white/[0.34] line-through">
                      {formatPrice(pricePreview.original)}
                    </span>
                  ) : null}
                  <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-white/[0.58]">
                    {selected ? (
                      <Check className="h-3.5 w-3.5 text-emerald-100" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5" />
                    )}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
