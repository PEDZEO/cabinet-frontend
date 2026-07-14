const ULTIMA_TRIAL_GUIDE_ACK_KEY = 'ultima_trial_guide_ack_v1';
const ULTIMA_TRIAL_GUIDE_SIGNATURE_ACK_KEY = 'ultima_trial_guide_signature_ack_v1';

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

  if (readUltimaTrialGuideAcknowledgedSignature(userId) === signature) {
    return true;
  }

  try {
    const acknowledgedBySignature =
      localStorage.getItem(`${ULTIMA_TRIAL_GUIDE_SIGNATURE_ACK_KEY}:${signature}`) === '1';
    const acknowledgedBeforeUserLoaded =
      userId !== null &&
      userId !== undefined &&
      readUltimaTrialGuideAcknowledgedSignature(undefined) === signature;

    if (acknowledgedBySignature || acknowledgedBeforeUserLoaded) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function writeUltimaTrialGuideAcknowledged(
  userId: number | null | undefined,
  signature: string,
): void {
  try {
    localStorage.setItem(getUserScopedKey(ULTIMA_TRIAL_GUIDE_ACK_KEY, userId), signature);
    localStorage.setItem(`${ULTIMA_TRIAL_GUIDE_SIGNATURE_ACK_KEY}:${signature}`, '1');
  } catch {
    // ignore persistence errors
  }
}
