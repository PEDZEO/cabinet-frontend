export type PendingAccountLinkOutcome = {
  status: 'success' | 'manual' | 'error';
  code?: string | null;
  message?: string | null;
  provider?: string | null;
};

const ACCOUNT_LINKING_REFRESH_KEY = 'cabinet_account_linking_refresh_user';
const ACCOUNT_LINKING_OUTCOME_KEY = 'cabinet_account_linking_outcome';

function readStorageValue(key: string): string | null {
  try {
    const sessionValue = sessionStorage.getItem(key);
    if (sessionValue !== null) return sessionValue;
  } catch {
    // ignore storage errors
  }

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }

  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
}

function clearStorageValue(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore storage errors
  }

  try {
    localStorage.removeItem(key);
  } catch {
    // ignore storage errors
  }
}

export function markPendingAccountLinkRefresh(): void {
  writeStorageValue(ACCOUNT_LINKING_REFRESH_KEY, '1');
}

export function consumePendingAccountLinkRefresh(): boolean {
  const shouldRefresh = readStorageValue(ACCOUNT_LINKING_REFRESH_KEY) === '1';
  clearStorageValue(ACCOUNT_LINKING_REFRESH_KEY);
  return shouldRefresh;
}

export function stashPendingAccountLinkOutcome(outcome: PendingAccountLinkOutcome): void {
  try {
    writeStorageValue(ACCOUNT_LINKING_OUTCOME_KEY, JSON.stringify(outcome));
  } catch {
    // ignore storage errors
  }
}

export function consumePendingAccountLinkOutcome(): PendingAccountLinkOutcome | null {
  const rawValue = readStorageValue(ACCOUNT_LINKING_OUTCOME_KEY);
  clearStorageValue(ACCOUNT_LINKING_OUTCOME_KEY);

  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as PendingAccountLinkOutcome;
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.status !== 'success' && parsed.status !== 'manual' && parsed.status !== 'error') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
