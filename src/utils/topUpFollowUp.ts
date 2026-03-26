export type PendingTopUpFollowUp = {
  amountKopeks: number;
  balanceBeforeKopeks: number;
  createdAt: number;
};

const PENDING_TOP_UP_FOLLOW_UP_KEY = 'pending_topup_followup_v1';
const DISMISSED_TOP_UP_FOLLOW_UP_KEY = 'dismissed_topup_followup_v1';
const PENDING_TOP_UP_TTL_MS = 30 * 60 * 1000;

const getScopedKey = (baseKey: string, userId?: number | null) => `${baseKey}:${userId ?? 'guest'}`;

export const readPendingTopUpFollowUp = (userId?: number | null): PendingTopUpFollowUp | null => {
  try {
    const raw = localStorage.getItem(getScopedKey(PENDING_TOP_UP_FOLLOW_UP_KEY, userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PendingTopUpFollowUp;
    if (
      !Number.isFinite(parsed.amountKopeks) ||
      !Number.isFinite(parsed.balanceBeforeKopeks) ||
      !Number.isFinite(parsed.createdAt)
    ) {
      localStorage.removeItem(getScopedKey(PENDING_TOP_UP_FOLLOW_UP_KEY, userId));
      return null;
    }

    if (Date.now() - parsed.createdAt > PENDING_TOP_UP_TTL_MS) {
      localStorage.removeItem(getScopedKey(PENDING_TOP_UP_FOLLOW_UP_KEY, userId));
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const writePendingTopUpFollowUp = (
  userId: number | null | undefined,
  payload: Omit<PendingTopUpFollowUp, 'createdAt'>,
) => {
  try {
    resetTopUpFollowUpDismissed(userId);
    localStorage.setItem(
      getScopedKey(PENDING_TOP_UP_FOLLOW_UP_KEY, userId),
      JSON.stringify({
        ...payload,
        createdAt: Date.now(),
      } satisfies PendingTopUpFollowUp),
    );
  } catch {
    // localStorage not available
  }
};

export const clearPendingTopUpFollowUp = (userId?: number | null) => {
  try {
    localStorage.removeItem(getScopedKey(PENDING_TOP_UP_FOLLOW_UP_KEY, userId));
  } catch {
    // localStorage not available
  }
};

export const isTopUpFollowUpDismissed = (userId?: number | null) => {
  try {
    return localStorage.getItem(getScopedKey(DISMISSED_TOP_UP_FOLLOW_UP_KEY, userId)) === '1';
  } catch {
    return false;
  }
};

export const dismissTopUpFollowUp = (userId?: number | null) => {
  try {
    localStorage.setItem(getScopedKey(DISMISSED_TOP_UP_FOLLOW_UP_KEY, userId), '1');
  } catch {
    // localStorage not available
  }
};

export const resetTopUpFollowUpDismissed = (userId?: number | null) => {
  try {
    localStorage.removeItem(getScopedKey(DISMISSED_TOP_UP_FOLLOW_UP_KEY, userId));
  } catch {
    // localStorage not available
  }
};
