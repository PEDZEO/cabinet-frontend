export type PendingTopUpFollowUp = {
  amountKopeks: number;
  balanceBeforeKopeks: number;
  paymentUrl?: string;
  paymentMethodId?: string;
  paymentMethodName?: string;
  returnTo?: string;
  createdAt: number;
  remindedAt?: number;
};

const PENDING_TOP_UP_FOLLOW_UP_KEY = 'pending_topup_followup_v1';
const DISMISSED_TOP_UP_FOLLOW_UP_KEY = 'dismissed_topup_followup_v1';
const PENDING_TOP_UP_TTL_MS = 30 * 60 * 1000;
export const PENDING_TOP_UP_FOLLOW_UP_EVENT = 'pending-topup-followup:changed';

const getScopedKey = (baseKey: string, userId?: number | null) => `${baseKey}:${userId ?? 'guest'}`;

const emitPendingTopUpFollowUpChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PENDING_TOP_UP_FOLLOW_UP_EVENT));
  }
};

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
    emitPendingTopUpFollowUpChanged();
  } catch {
    // localStorage not available
  }
};

export const clearPendingTopUpFollowUp = (userId?: number | null) => {
  try {
    localStorage.removeItem(getScopedKey(PENDING_TOP_UP_FOLLOW_UP_KEY, userId));
    emitPendingTopUpFollowUpChanged();
  } catch {
    // localStorage not available
  }
};

export const markTopUpFollowUpReminderShown = (userId?: number | null) => {
  try {
    const pending = readPendingTopUpFollowUp(userId);
    if (!pending) return;

    localStorage.setItem(
      getScopedKey(PENDING_TOP_UP_FOLLOW_UP_KEY, userId),
      JSON.stringify({
        ...pending,
        remindedAt: Date.now(),
      } satisfies PendingTopUpFollowUp),
    );
    emitPendingTopUpFollowUpChanged();
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
