export function normalizeSupportUsername(username: string | null | undefined): string | null {
  const normalized = username?.trim().replace(/^@+/, '') ?? '';
  return normalized.length > 0 ? normalized : null;
}

export function formatSupportUsername(username: string | null | undefined): string | null {
  const normalized = normalizeSupportUsername(username);
  return normalized ? `@${normalized}` : null;
}

export function buildSupportTelegramUrl(username: string | null | undefined): string | null {
  const normalized = normalizeSupportUsername(username);
  return normalized ? `https://t.me/${normalized}` : null;
}
