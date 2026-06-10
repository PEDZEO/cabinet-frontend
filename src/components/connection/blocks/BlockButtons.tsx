import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, CopyIcon } from '@/components/icons';
import type { RemnawaveButtonClient, LocalizedText } from '@/types';
import { copyToClipboard } from '@/utils/clipboard';

// eslint-disable-next-line no-script-url
const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];

function isValidDeepLink(url: string | undefined): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase().trim();
  if (dangerousSchemes.some((s) => lowerUrl.startsWith(s))) return false;
  return lowerUrl.includes('://');
}

function isValidExternalUrl(url: string | undefined): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase().trim();
  if (dangerousSchemes.some((s) => lowerUrl.startsWith(s))) return false;
  return lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://');
}

interface BlockButtonsProps {
  buttons: RemnawaveButtonClient[] | undefined;
  variant: 'light' | 'subtle';
  isLight?: boolean;
  platformKey?: string | null;
  subscriptionUrl: string | null;
  hideLink?: boolean;
  deepLink?: string | null;
  getLocalizedText: (text: LocalizedText | undefined) => string;
  getBaseTranslation: (key: string, i18nKey: string) => string;
  getSvgHtml: (key: string | undefined) => string;
  onOpenDeepLink: (url: string) => void;
}

export function BlockButtons({
  buttons,
  variant,
  isLight,
  subscriptionUrl,
  hideLink,
  deepLink,
  getLocalizedText,
  getBaseTranslation,
  getSvgHtml,
  onOpenDeepLink,
}: BlockButtonsProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (url: string) => {
    await copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  if (!buttons || buttons.length === 0) return null;

  const getButtonClass = () => {
    const sharedLight =
      'min-h-9 w-full justify-center rounded-2xl border border-accent-500 px-3 py-2 text-center text-[11px] font-bold leading-tight transition-all active:scale-[0.98] sm:min-h-10 sm:text-xs lg:min-h-11 lg:text-sm';

    if (variant === 'light') {
      return isLight
        ? `${sharedLight} bg-accent-950/20 text-accent-600 shadow-[0_8px_20px_rgba(var(--color-accent-500),0.16)]`
        : `${sharedLight} bg-accent-500/12 text-accent-400 shadow-[0_8px_20px_rgba(var(--color-accent-500),0.12)]`;
    }

    return isLight
      ? 'rounded-xl px-3 py-1.5 text-sm font-medium text-dark-300 transition-all hover:bg-dark-700/30'
      : 'rounded-xl px-3 py-1.5 text-sm font-medium text-dark-300 transition-all hover:bg-dark-700/50';
  };

  const getExternalFallbackText = (btn: RemnawaveButtonClient) => {
    const url = (btn.link || btn.url || btn.resolvedUrl || '').toLowerCase();
    if (!url) return '';

    if (url.includes('github.com')) return 'GitHub';
    if (url.includes('apps.apple.com') || url.includes('itunes.apple.com')) return 'App Store';
    if (url.includes('testflight.apple.com')) return 'TestFlight';
    if (url.includes('play.google.com')) return 'Google Play';
    if (url.includes('microsoft.com') || url.includes('apps.microsoft.com'))
      return 'Microsoft Store';
    if (url.includes('.apk')) return 'Скачать APK';
    if (url.includes('.appimage') || url.includes('.deb') || url.includes('.rpm'))
      return 'Скачать Linux';
    if (url.includes('.exe') || url.includes('.msi')) return 'Скачать Windows';
    if (url.includes('.dmg') || url.includes('.pkg')) return 'Скачать macOS';

    try {
      const hostname = new URL(btn.link || btn.url || btn.resolvedUrl || '').hostname.replace(
        /^www\./,
        '',
      );
      return hostname || '';
    } catch {
      return '';
    }
  };

  const getButtonText = (btn: RemnawaveButtonClient) => {
    const rawText = getLocalizedText(btn.text).trim();

    if (variant === 'light' && (btn.type === 'subscriptionLink' || btn.type === 'copyButton')) {
      return 'Добавить подписку';
    }

    return rawText || getExternalFallbackText(btn);
  };

  return (
    <div
      className={
        variant === 'light' ? 'mt-3 grid grid-cols-2 gap-2 sm:gap-3' : 'mt-2 flex flex-wrap gap-2'
      }
    >
      {buttons.map((btn, idx) => {
        const btnText = getButtonText(btn);
        const btnSvg = getSvgHtml(btn.svgIconKey);
        const btnIcon = btnSvg ? (
          <div
            className="h-4 w-4 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: btnSvg }}
          />
        ) : null;

        if (btn.type === 'subscriptionLink') {
          const url = btn.resolvedUrl || btn.url || btn.link || deepLink || subscriptionUrl;
          if (!url || !isValidDeepLink(url)) return null;
          return (
            <button
              key={idx}
              onClick={() => onOpenDeepLink(url)}
              className={`flex items-center gap-1.5 only:col-span-2 ${getButtonClass()}`}
            >
              {btnIcon}
              {btnText || getBaseTranslation('openApp', 'subscription.connection.openLink')}
            </button>
          );
        }

        if (btn.type === 'copyButton') {
          if (hideLink) return null;
          const url = btn.resolvedUrl || subscriptionUrl;
          if (!url) return null;
          return (
            <button
              key={idx}
              onClick={() => handleCopy(url)}
              className={`flex items-center gap-1.5 only:col-span-2 ${
                copied
                  ? `min-h-9 w-full justify-center rounded-2xl border border-success-500 bg-success-500/10 px-3 py-2 text-center text-[11px] font-bold leading-tight transition-all sm:min-h-10 sm:text-xs lg:min-h-11 lg:text-sm ${isLight ? 'text-success-600' : 'text-success-400'}`
                  : getButtonClass()
              }`}
            >
              {copied ? <CheckIcon /> : btnIcon || <CopyIcon />}
              {copied
                ? t('subscription.connection.copied')
                : btnText || getBaseTranslation('copyLink', 'subscription.connection.copyLink')}
            </button>
          );
        }

        // external
        const href = btn.link || btn.url || '';
        if (!isValidExternalUrl(href)) return null;
        return (
          <a
            key={idx}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 only:col-span-2 ${getButtonClass()}`}
          >
            {btnIcon}
            {btnText}
          </a>
        );
      })}
    </div>
  );
}
