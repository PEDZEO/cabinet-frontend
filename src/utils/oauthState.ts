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

function loadState(stateKey: string, providerKey: string, returnToKey: string): SavedOAuthState | null {
  const state = sessionStorage.getItem(stateKey);
  const provider = sessionStorage.getItem(providerKey);
  const returnTo = sessionStorage.getItem(returnToKey) || undefined;
  if (!state || !provider) return null;
  return { state, provider, returnTo };
}

function clearState(stateKey: string, providerKey: string, returnToKey: string): void {
  sessionStorage.removeItem(stateKey);
  sessionStorage.removeItem(providerKey);
  sessionStorage.removeItem(returnToKey);
}

export function saveOAuthState(state: string, provider: string, options?: { returnTo?: string }): void {
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  sessionStorage.setItem(OAUTH_PROVIDER_KEY, provider);
  if (options?.returnTo) {
    sessionStorage.setItem(OAUTH_RETURN_TO_KEY, options.returnTo);
  } else {
    sessionStorage.removeItem(OAUTH_RETURN_TO_KEY);
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
  sessionStorage.setItem(LINK_OAUTH_STATE_KEY, state);
  sessionStorage.setItem(LINK_OAUTH_PROVIDER_KEY, provider);
  if (options?.returnTo) {
    sessionStorage.setItem(LINK_OAUTH_RETURN_TO_KEY, options.returnTo);
  } else {
    sessionStorage.removeItem(LINK_OAUTH_RETURN_TO_KEY);
  }
}

export function peekLinkOAuthState(): SavedOAuthState | null {
  return loadState(LINK_OAUTH_STATE_KEY, LINK_OAUTH_PROVIDER_KEY, LINK_OAUTH_RETURN_TO_KEY);
}

export function getAndClearLinkOAuthState(): SavedOAuthState | null {
  const saved = loadState(LINK_OAUTH_STATE_KEY, LINK_OAUTH_PROVIDER_KEY, LINK_OAUTH_RETURN_TO_KEY);
  clearState(LINK_OAUTH_STATE_KEY, LINK_OAUTH_PROVIDER_KEY, LINK_OAUTH_RETURN_TO_KEY);
  return saved;
}
