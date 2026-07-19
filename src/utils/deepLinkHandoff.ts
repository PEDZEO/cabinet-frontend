export const buildTelegramDeepLinkHandoff = (deepLink: string): string => {
  const handoffUrl = new URL('/miniapp/redirect.html', window.location.origin);
  handoffUrl.searchParams.set('url', deepLink);
  handoffUrl.searchParams.set('lang', document.documentElement.lang || navigator.language || 'ru');
  return handoffUrl.toString();
};
