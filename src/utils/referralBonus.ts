type ReferralBonusPartsOptions = {
  rubles?: number | null;
  days?: number | null;
  formatPositive: (rubles: number) => string;
  formatDays: (days: number) => string;
};

export type ReferralBonusParts = {
  primary: string;
  secondary: string | null;
};

export function getReferralBonusParts({
  rubles,
  days,
  formatPositive,
  formatDays,
}: ReferralBonusPartsOptions): ReferralBonusParts {
  const amount = Math.max(0, Number(rubles) || 0);
  const daysCount = Math.max(0, Math.trunc(Number(days) || 0));
  const amountLabel = amount > 0 ? formatPositive(amount) : null;
  const daysLabel = daysCount > 0 ? formatDays(daysCount) : null;

  if (amountLabel) {
    return {
      primary: amountLabel,
      secondary: daysLabel,
    };
  }

  return {
    primary: daysLabel ?? formatPositive(0),
    secondary: null,
  };
}
