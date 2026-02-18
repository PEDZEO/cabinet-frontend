const REFERRAL_KEY = 'referral_code';
const REFERRAL_TTL_KEY = 'referral_code_ttl';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CODE_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

/**
 * Get valid referral code from localStorage, clearing expired entries.
 */
function getValidCode(): string | null {
  try {
    const code = localStorage.getItem(REFERRAL_KEY);
    if (!code) return null;

    const ttl = localStorage.getItem(REFERRAL_TTL_KEY);
    if (!ttl || Number.isNaN(Number(ttl)) || Date.now() > Number(ttl)) {
      localStorage.removeItem(REFERRAL_KEY);
      localStorage.removeItem(REFERRAL_TTL_KEY);
      return null;
    }

    return code;
  } catch {
    return null;
  }
}

function clearCode(): void {
  try {
    localStorage.removeItem(REFERRAL_KEY);
    localStorage.removeItem(REFERRAL_TTL_KEY);
  } catch {
    // localStorage unavailable
  }
}

/**
 * Capture referral code from URL query param (?ref=), store in localStorage with TTL,
 * and clean the URL.
 */
export function captureReferralFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('ref');
    if (!code || !CODE_PATTERN.test(code)) return;

    localStorage.setItem(REFERRAL_KEY, code);
    localStorage.setItem(REFERRAL_TTL_KEY, String(Date.now() + TTL_MS));

    // Clean URL
    params.delete('ref');
    const newSearch = params.toString();
    const newUrl =
      window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
    window.history.replaceState(null, '', newUrl);
  } catch {
    // localStorage or history API unavailable
  }
}

/**
 * Consume (get + clear) the stored referral code. One-time use during auth.
 */
export function consumeReferralCode(): string | null {
  const code = getValidCode();
  if (code) clearCode();
  return code;
}

/**
 * Read stored referral code without clearing it (for UI display).
 */
export function getPendingReferralCode(): string | null {
  return getValidCode();
}
