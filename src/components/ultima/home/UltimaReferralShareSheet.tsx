import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Globe2, Send, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/primitives/Sheet';
import { cn } from '@/lib/utils';
import { usePlatform } from '@/platform';
import { copyToClipboard } from '@/utils/clipboard';

type ReferralLinkKind = 'telegram' | 'web';

type UltimaReferralShareSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  telegramLink: string;
  webLink: string;
  shareText: string;
  bonusLabel?: string | null;
  onOpenReferralPage: () => void;
};

export function UltimaReferralShareSheet({
  open,
  onOpenChange,
  telegramLink,
  webLink,
  shareText,
  bonusLabel,
  onOpenReferralPage,
}: UltimaReferralShareSheetProps) {
  const { t } = useTranslation();
  const { haptic, openTelegramLink, share } = usePlatform();
  const [selectedKind, setSelectedKind] = useState<ReferralLinkKind>(
    telegramLink ? 'telegram' : 'web',
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedKind(telegramLink ? 'telegram' : 'web');
    setCopied(false);
  }, [open, telegramLink]);

  const selectedLink = useMemo(
    () => (selectedKind === 'telegram' ? telegramLink : webLink),
    [selectedKind, telegramLink, webLink],
  );
  const selectedShareUrl = useMemo(() => {
    if (!selectedLink || selectedKind !== 'telegram') return selectedLink;

    const telegramShareUrl = new URL('https://t.me/share/url');
    telegramShareUrl.searchParams.set('url', selectedLink);
    telegramShareUrl.searchParams.set('text', shareText);
    return telegramShareUrl.toString();
  }, [selectedKind, selectedLink, shareText]);

  const selectKind = (kind: ReferralLinkKind) => {
    haptic.impact('light');
    setSelectedKind(kind);
    setCopied(false);
  };

  const copyLink = async () => {
    if (!selectedLink) return;
    await copyToClipboard(selectedLink);
    haptic.notification('success');
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const shareLink = async () => {
    if (!selectedLink) return;
    haptic.impact('light');

    if (selectedKind === 'telegram') {
      openTelegramLink(selectedShareUrl);
      return;
    }

    await share(shareText, selectedLink);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-testid="ultima-referral-share-sheet"
        showCloseButton
        className="rounded-t-[22px] border-white/[0.12]"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-surface) 96%, #071218), color-mix(in srgb, var(--ultima-color-secondary) 94%, #050b11))',
        }}
      >
        <SheetHeader className="pr-9 text-left">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-[19px] text-white/[0.97]">
              {t('ultima.home.inviteSheetTitle', { defaultValue: 'Пригласить друга' })}
            </SheetTitle>
            {bonusLabel ? (
              <span className="rounded-full border border-emerald-200/[0.18] bg-emerald-300/[0.1] px-2 py-1 text-[10px] font-semibold text-emerald-100">
                {bonusLabel}
              </span>
            ) : null}
          </div>
          <SheetDescription className="text-[12px] leading-snug text-white/[0.52]">
            {t('ultima.home.inviteSheetHint', {
              defaultValue: 'Выберите, куда должен перейти приглашённый пользователь.',
            })}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-white/[0.08] bg-black/[0.14] p-1">
          {telegramLink ? (
            <button
              type="button"
              onClick={() => selectKind('telegram')}
              data-testid="ultima-referral-kind-telegram"
              className={cn(
                'flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-[12px] font-semibold transition',
                selectedKind === 'telegram'
                  ? 'bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'text-white/[0.48]',
              )}
            >
              <Send className="h-4 w-4" strokeWidth={1.8} />
              Telegram
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => selectKind('web')}
            data-testid="ultima-referral-kind-web"
            className={cn(
              'flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-[12px] font-semibold transition',
              selectedKind === 'web'
                ? 'bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-white/[0.48]',
            )}
          >
            <Globe2 className="h-4 w-4" strokeWidth={1.8} />
            {t('ultima.home.webReferral', { defaultValue: 'Веб-ссылка' })}
          </button>
        </div>

        {selectedLink ? (
          <div className="mt-4">
            <div className="mx-auto flex w-fit max-w-full rounded-lg bg-white p-3 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
              <QRCodeSVG value={selectedLink} size={168} level="M" includeMargin={false} />
            </div>
            <div className="mt-3 truncate rounded-lg border border-white/[0.08] bg-black/[0.15] px-3 py-2.5 text-[11px] text-white/[0.58]">
              {selectedLink}
            </div>
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void copyLink()}
            data-testid="ultima-referral-copy-selected"
            className="ultima-btn-pill ultima-btn-secondary flex min-h-11 items-center justify-center gap-2 px-3 text-[12px]"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied
              ? t('referral.copied', { defaultValue: 'Скопировано' })
              : t('referral.copyLink', { defaultValue: 'Копировать' })}
          </button>
          <button
            type="button"
            onClick={() => void shareLink()}
            data-testid="ultima-referral-share-selected"
            data-share-url={selectedShareUrl}
            className="ultima-btn-pill ultima-btn-primary flex min-h-11 items-center justify-center gap-2 px-3 text-[12px]"
          >
            <Share2 className="h-4 w-4" />
            {t('referral.shareButton', { defaultValue: 'Поделиться' })}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onOpenChange(false);
            onOpenReferralPage();
          }}
          className="mt-3 min-h-10 w-full text-center text-[12px] font-medium text-white/[0.58] transition hover:text-white/[0.9]"
        >
          {t('ultima.home.openReferralProgram', { defaultValue: 'Открыть реферальную программу' })}
        </button>
      </SheetContent>
    </Sheet>
  );
}
