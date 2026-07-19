export function isHappCryptolinkMode(mode: string | null | undefined): boolean {
  const normalized = String(mode ?? '').toUpperCase();
  if (!normalized) return false;
  return normalized.includes('HAPP') && normalized.includes('CRYPT');
}

function isHappCryptDeepLink(url: string | null | undefined): url is string {
  return typeof url === 'string' && /^happ:\/\/crypt[2-9]?\//i.test(url);
}

interface ResolveConnectionUrlInput {
  mode?: string | null;
  subscriptionUrl?: string | null;
  displayLink?: string | null;
  happSchemeLink?: string | null;
  happCryptLink?: string | null;
  happCryptoLink?: string | null;
  happLink?: string | null;
  fallbackUrl?: string | null;
}

export function resolveConnectionUrlForUi(input: ResolveConnectionUrlInput): string | null {
  const defaultUrl =
    input.fallbackUrl ?? input.subscriptionUrl ?? input.displayLink ?? input.happSchemeLink ?? null;

  if (!isHappCryptolinkMode(input.mode)) return defaultUrl;

  const backendCryptLink =
    [
      input.happCryptLink,
      input.happCryptoLink,
      input.happLink,
      input.happSchemeLink,
      input.displayLink,
      input.subscriptionUrl,
    ].find((value) => isHappCryptDeepLink(value)) ?? null;
  if (backendCryptLink) return backendCryptLink;

  // crypt5 cannot be generated with the former client-side crypt4 key.
  // The cabinet API returns the current panel/official Happ link when available.
  return defaultUrl;
}
