export type UltimaNextActionKind = 'buy' | 'renew' | 'setup' | 'subscription';

type UltimaNextActionInput = {
  hasAnySubscription: boolean;
  isActive: boolean;
  isExpired: boolean;
  daysLeft: number | null;
  isConnectionCompleted: boolean;
};

export function getUltimaNextAction({
  hasAnySubscription,
  isActive,
  isExpired,
  daysLeft,
  isConnectionCompleted,
}: UltimaNextActionInput): UltimaNextActionKind {
  if (!hasAnySubscription) {
    return 'buy';
  }

  if (!isActive || isExpired) {
    return 'renew';
  }

  if (!isConnectionCompleted) {
    return 'setup';
  }

  if (daysLeft !== null && daysLeft <= 3) {
    return 'renew';
  }

  return 'subscription';
}
