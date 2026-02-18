export type PromoDiscountResult = {
  price: number;
  original: number | null;
  percent: number | null;
};

export type ApplyPromoDiscount = (
  priceKopeks: number,
  hasExistingDiscount?: boolean,
) => PromoDiscountResult;
