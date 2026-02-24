export type PromoDiscountResult = {
  price: number;
  original: number | null;
  percent: number | null;
};

export type ApplyPromoDiscount = (
  priceKopeks: number,
  existingOriginalPrice?: number | boolean | null,
) => PromoDiscountResult;
