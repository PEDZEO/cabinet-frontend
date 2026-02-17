export const PERIODS = [1, 3, 7, 14, 30] as const;

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-success-500',
  trial: 'bg-warning-500',
  expired: 'bg-error-500',
  disabled: 'bg-dark-500',
};
