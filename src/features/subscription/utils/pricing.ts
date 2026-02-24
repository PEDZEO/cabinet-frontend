import type { ApplyPromoDiscount } from '../types';

interface ActiveDiscountSnapshot {
  is_active?: boolean;
  discount_percent?: number;
}

export function createPriceFormatter(
  formatAmount: (amount: number) => string,
  currencySymbol: string,
): (kopeks: number) => string {
  return (kopeks: number) => `${formatAmount(kopeks / 100)} ${currencySymbol}`;
}

export function createApplyPromoDiscount(
  activeDiscount: ActiveDiscountSnapshot | null | undefined,
): ApplyPromoDiscount {
  return (
    priceKopeks: number,
    existingOriginalPrice: number | boolean | null = null,
  ): { price: number; original: number | null; percent: number | null } => {
    const discountPercent = activeDiscount?.discount_percent ?? null;
    const hasPromo = !!activeDiscount?.is_active && discountPercent !== null;
    const normalizedOriginal =
      typeof existingOriginalPrice === 'number' && existingOriginalPrice > priceKopeks
        ? existingOriginalPrice
        : null;

    if (!hasPromo) {
      return { price: priceKopeks, original: null, percent: null };
    }

    const discountedPrice = Math.round(priceKopeks * (1 - discountPercent / 100));
    const combinedPercent = normalizedOriginal
      ? Math.round((1 - discountedPrice / normalizedOriginal) * 100)
      : discountPercent;

    return {
      price: discountedPrice,
      original: normalizedOriginal ?? priceKopeks,
      percent: combinedPercent,
    };
  };
}
