export type UltimaNextActionKind = 'buy' | 'renew' | 'setup' | 'device' | 'subscription';

export const ULTIMA_RENEWAL_NOTICE_DAYS = 7;

type UltimaNextActionInput = {
  hasAnySubscription: boolean;
  isActive: boolean;
  isExpired: boolean;
  daysLeft: number | null;
  isConnectionCompleted: boolean;
  connectedDevicesCount?: number | null;
  deviceLimit?: number | null;
};

export function getUltimaNextAction({
  hasAnySubscription,
  isActive,
  isExpired,
  daysLeft,
  isConnectionCompleted,
  connectedDevicesCount = null,
  deviceLimit = null,
}: UltimaNextActionInput): UltimaNextActionKind {
  if (!hasAnySubscription) {
    return 'buy';
  }

  if (!isActive || isExpired) {
    return 'renew';
  }

  if (
    connectedDevicesCount !== null &&
    deviceLimit !== null &&
    deviceLimit > 0 &&
    connectedDevicesCount <= 0
  ) {
    return 'device';
  }

  if (!isConnectionCompleted) {
    return 'setup';
  }

  if (daysLeft !== null && daysLeft <= ULTIMA_RENEWAL_NOTICE_DAYS) {
    return 'renew';
  }

  return 'subscription';
}
