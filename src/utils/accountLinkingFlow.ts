const ACCOUNT_LINKING_REFRESH_KEY = 'cabinet_account_linking_refresh_user';

export function markPendingAccountLinkRefresh(): void {
  try {
    sessionStorage.setItem(ACCOUNT_LINKING_REFRESH_KEY, '1');
  } catch {
    // ignore storage errors
  }
}

export function consumePendingAccountLinkRefresh(): boolean {
  try {
    const shouldRefresh = sessionStorage.getItem(ACCOUNT_LINKING_REFRESH_KEY) === '1';
    sessionStorage.removeItem(ACCOUNT_LINKING_REFRESH_KEY);
    return shouldRefresh;
  } catch {
    return false;
  }
}
