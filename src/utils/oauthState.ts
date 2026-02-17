const OAUTH_STATE_KEY = 'oauth_state';
const OAUTH_PROVIDER_KEY = 'oauth_provider';

export function saveOAuthState(state: string, provider: string): void {
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  sessionStorage.setItem(OAUTH_PROVIDER_KEY, provider);
}

export function getAndClearOAuthState(): { state: string; provider: string } | null {
  const state = sessionStorage.getItem(OAUTH_STATE_KEY);
  const provider = sessionStorage.getItem(OAUTH_PROVIDER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_PROVIDER_KEY);

  if (!state || !provider) return null;

  return { state, provider };
}
