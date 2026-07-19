const TEMPLATE_RE = /\{\{[A-Z0-9_]+\}\}/;

export function hasTemplates(url: string): boolean {
  return TEMPLATE_RE.test(url);
}

interface ResolveContext {
  subscriptionUrl: string;
  happCryptoLink?: string | null;
  incyCryptoLink?: string | null;
  username?: string;
}

export function resolveTemplate(template: string, ctx: ResolveContext): string {
  let result = template;

  result = result.replace(/\{\{SUBSCRIPTION_LINK\}\}/g, ctx.subscriptionUrl);

  if (ctx.username) {
    result = result.replace(/\{\{USERNAME\}\}/g, ctx.username);
  }

  const happLink = ctx.happCryptoLink ?? ctx.subscriptionUrl;
  result = result.replace(/\{\{HAPP_CRYPT[345]_LINK\}\}/g, happLink);
  result = result.replace(/\{\{INCY_CRYPT1_LINK\}\}/g, ctx.incyCryptoLink ?? ctx.subscriptionUrl);

  return result;
}
