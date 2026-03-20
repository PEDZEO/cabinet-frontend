const ULTIMA_TRIAL_GUIDE_ACK_KEY = 'ultima_trial_guide_ack_v1';

function getUserScopedKey(baseKey: string, userId: number | null | undefined): string {
  return `${baseKey}:${userId ?? 'guest'}`;
}

export function readUltimaTrialGuideAcknowledgedSignature(
  userId: number | null | undefined,
): string | null {
  try {
    return localStorage.getItem(getUserScopedKey(ULTIMA_TRIAL_GUIDE_ACK_KEY, userId));
  } catch {
    return null;
  }
}

export function hasUltimaTrialGuideBeenAcknowledged(
  userId: number | null | undefined,
  signature: string | null,
): boolean {
  if (!signature) {
    return false;
  }
  return readUltimaTrialGuideAcknowledgedSignature(userId) === signature;
}

export function writeUltimaTrialGuideAcknowledged(
  userId: number | null | undefined,
  signature: string,
): void {
  try {
    localStorage.setItem(getUserScopedKey(ULTIMA_TRIAL_GUIDE_ACK_KEY, userId), signature);
  } catch {
    // ignore persistence errors
  }
}
