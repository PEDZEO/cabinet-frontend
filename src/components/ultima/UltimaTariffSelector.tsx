import type { TFunction } from 'i18next';

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
};

export function UltimaTariffSelector({
  tariffs,
  selectedTariffId,
  currentTariffId,
  t,
  formatPrice,
  applyPromoDiscount,
  onSelectTariff,
}: UltimaTariffSelectorProps) {
  return (
    <section className="mb-3 space-y-2.5">
      <div>
        <p className="text-white/52 text-[12px] font-medium uppercase tracking-[0.14em]">
          {t('dashboard.expired.tariffs')}
        </p>
      </div>

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
                'relative overflow-hidden rounded-[24px] border p-3 text-left transition-all',
                selected
                  ? 'border-white/25 bg-white/[0.08] shadow-[0_0_0_1px_color-mix(in_srgb,var(--ultima-color-primary)_28%,transparent)]'
                  : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]',
              )}
              style={selected ? ultimaAccentSurfaceStyle : ultimaPaneSurfaceStyle}
              aria-pressed={selected}
            >
              <div className="absolute inset-y-0 right-[-18%] w-[44%] rounded-full bg-white/[0.04] blur-3xl" />
              <div className="relative space-y-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[20px] font-semibold leading-none text-white">
                      {tariff.name}
                    </div>
                    {description ? (
                      <p className="text-white/68 mt-1.5 line-clamp-2 max-w-[34ch] whitespace-pre-line text-[12px] leading-[1.35]">
                        {description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {current ? (
                      <span className="border-emerald-200/28 bg-emerald-300/12 rounded-full border px-2 py-0.5 text-[10px] font-medium text-emerald-50">
                        {t('subscription.currentTariff')}
                      </span>
                    ) : null}
                    {isUnlimited ? (
                      <span className="border-white/12 text-white/78 rounded-full border bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium">
                        {t('subscription.unlimited')}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="text-white/74 grid gap-1.5 text-[12px] sm:grid-cols-2">
                  <div className="rounded-[16px] border border-white/10 bg-black/10 px-3 py-1.5">
                    <span className="text-white/44 block text-[10px] uppercase tracking-[0.12em]">
                      {t('subscription.traffic')}
                    </span>
                    <span className="text-white/92 mt-0.5 block font-medium">
                      {tariff.traffic_limit_label}
                    </span>
                  </div>
                  <div className="rounded-[16px] border border-white/10 bg-black/10 px-3 py-1.5">
                    <span className="text-white/44 block text-[10px] uppercase tracking-[0.12em]">
                      {t('subscription.devices')}
                    </span>
                    <span className="text-white/92 mt-0.5 block font-medium">
                      {t('subscription.devices', { count: tariff.device_limit })}
                    </span>
                  </div>
                </div>

                <div>
                  <div>
                    <div className="text-[24px] font-semibold leading-none text-white">
                      {priceLabel}
                    </div>
                    {pricePreview?.original && pricePreview.original > pricePreview.price ? (
                      <div className="text-white/42 mt-1 text-[12px] line-through">
                        {formatPrice(pricePreview.original)}
                      </div>
                    ) : null}
                    <div className="text-white/58 mt-1 text-[12px]">
                      {dailyPrice > 0
                        ? t('subscription.tariff.perDay')
                        : firstPeriod
                          ? `${t('subscription.from')} ${firstPeriod.label}`
                          : t('subscription.tariff.flexiblePayment')}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
