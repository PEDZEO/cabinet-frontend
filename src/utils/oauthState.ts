type SavedOAuthState = {
  state: string;
  provider: string;
  returnTo?: string;
};

const OAUTH_STATE_KEY = 'oauth_state';
const OAUTH_PROVIDER_KEY = 'oauth_provider';
const OAUTH_RETURN_TO_KEY = 'oauth_return_to';

const LINK_OAUTH_STATE_KEY = 'link_oauth_state';
const LINK_OAUTH_PROVIDER_KEY = 'link_oauth_provider';
const LINK_OAUTH_RETURN_TO_KEY = 'link_oauth_return_to';

function readStorageValue(key: string): string | null {
  try {
    const sessionValue = sessionStorage.getItem(key);
    if (sessionValue !== null) return sessionValue;
  } catch {
    // ignore session storage errors
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
    // ignore session storage errors
  }

  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore local storage errors
  }
}

function removeStorageValue(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore session storage errors
  }

  try {
    localStorage.removeItem(key);
  } catch {
    // ignore local storage errors
  }
}

function loadState(
  stateKey: string,
  providerKey: string,
  returnToKey: string,
): SavedOAuthState | null {
  const state = readStorageValue(stateKey);
  const provider = readStorageValue(providerKey);
  const returnTo = readStorageValue(returnToKey) || undefined;
  if (!state || !provider) return null;
  return { state, provider, returnTo };
}

function clearState(stateKey: string, providerKey: string, returnToKey: string): void {
  removeStorageValue(stateKey);
  removeStorageValue(providerKey);
  removeStorageValue(returnToKey);
}

export function saveOAuthState(
  state: string,
  provider: string,
  options?: { returnTo?: string },
): void {
  writeStorageValue(OAUTH_STATE_KEY, state);
  writeStorageValue(OAUTH_PROVIDER_KEY, provider);
  if (options?.returnTo) {
    writeStorageValue(OAUTH_RETURN_TO_KEY, options.returnTo);
  } else {
    removeStorageValue(OAUTH_RETURN_TO_KEY);
  }
}

export function getAndClearOAuthState(): SavedOAuthState | null {
  const saved = loadState(OAUTH_STATE_KEY, OAUTH_PROVIDER_KEY, OAUTH_RETURN_TO_KEY);
  clearState(OAUTH_STATE_KEY, OAUTH_PROVIDER_KEY, OAUTH_RETURN_TO_KEY);
  return saved;
}

export function saveLinkOAuthState(
  state: string,
  provider: string,
  options?: { returnTo?: string },
): void {
  writeStorageValue(LINK_OAUTH_STATE_KEY, state);
  writeStorageValue(LINK_OAUTH_PROVIDER_KEY, provider);
  if (options?.returnTo) {
    writeStorageValue(LINK_OAUTH_RETURN_TO_KEY, options.returnTo);
  } else {
    removeStorageValue(LINK_OAUTH_RETURN_TO_KEY);
  }
}

export function peekLinkOAuthState(): SavedOAuthState | null {
  return loadState(LINK_OAUTH_STATE_KEY, LINK_OAUTH_PROVIDER_KEY, LINK_OAUTH_RETURN_TO_KEY);
}

export function clearLinkOAuthState(): void {
  clearState(LINK_OAUTH_STATE_KEY, LINK_OAUTH_PROVIDER_KEY, LINK_OAUTH_RETURN_TO_KEY);
}

export function getAndClearLinkOAuthState(): SavedOAuthState | null {
  const saved = loadState(LINK_OAUTH_STATE_KEY, LINK_OAUTH_PROVIDER_KEY, LINK_OAUTH_RETURN_TO_KEY);
  clearState(LINK_OAUTH_STATE_KEY, LINK_OAUTH_PROVIDER_KEY, LINK_OAUTH_RETURN_TO_KEY);
  return saved;
}
