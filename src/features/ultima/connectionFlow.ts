export const ULTIMA_CONNECTION_STATE_KEY = 'ultima_connection_flow_v1';
export const ULTIMA_CONNECTION_PENDING_STEP2_KEY = 'ultima_connection_pending_step2_v1';
export const ULTIMA_CONNECTION_PENDING_STEP3_KEY = 'ultima_connection_pending_step3_v1';
export const ULTIMA_CONNECTION_REMINDER_HIDDEN_KEY = 'ultima_connection_reminder_hidden_v1';
export const ULTIMA_CONNECTION_COMPLETED_KEY = 'ultima_connection_completed_v1';

function getUserScopedKey(baseKey: string, userId: number | null | undefined): string {
  return `${baseKey}:${userId ?? 'guest'}`;
}

export function readUltimaConnectionStep(userId: number | null | undefined): 1 | 2 | 3 {
  try {
    const raw = localStorage.getItem(getUserScopedKey(ULTIMA_CONNECTION_STATE_KEY, userId));
    const parsed = raw ? Number(raw) : 1;
    return parsed === 3 ? 3 : parsed === 2 ? 2 : 1;
  } catch {
    return 1;
  }
}

export function writeUltimaConnectionStep(
  userId: number | null | undefined,
  step: 1 | 2 | 3,
): void {
  try {
    localStorage.setItem(getUserScopedKey(ULTIMA_CONNECTION_STATE_KEY, userId), String(step));
  } catch {
    // ignore persistence errors
  }
}

export function readUltimaConnectionReminderHidden(userId: number | null | undefined): boolean {
  try {
    return (
      localStorage.getItem(getUserScopedKey(ULTIMA_CONNECTION_REMINDER_HIDDEN_KEY, userId)) === '1'
    );
  } catch {
    return false;
  }
}

export function writeUltimaConnectionReminderHidden(
  userId: number | null | undefined,
  hidden: boolean,
): void {
  try {
    const key = getUserScopedKey(ULTIMA_CONNECTION_REMINDER_HIDDEN_KEY, userId);
    if (hidden) {
      localStorage.setItem(key, '1');
      return;
    }
    localStorage.removeItem(key);
  } catch {
    // ignore persistence errors
  }
}

export function readUltimaConnectionCompleted(userId: number | null | undefined): boolean {
  try {
    return localStorage.getItem(getUserScopedKey(ULTIMA_CONNECTION_COMPLETED_KEY, userId)) === '1';
  } catch {
    return false;
  }
}

export function writeUltimaConnectionCompleted(
  userId: number | null | undefined,
  completed: boolean,
): void {
  try {
    const key = getUserScopedKey(ULTIMA_CONNECTION_COMPLETED_KEY, userId);
    if (completed) {
      localStorage.setItem(key, '1');
      return;
    }
    localStorage.removeItem(key);
  } catch {
    // ignore persistence errors
  }
}
