import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type UltimaReferralCtaProps = {
  commissionPercent?: number | null;
  onClick: () => void;
  variant?: 'mobile' | 'desktop';
  className?: string;
};

const ReferralIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M8 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM16.5 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 19a4.5 4.5 0 0 1 9 0M13 19a3.5 3.5 0 0 1 7 0"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowUpRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path
      d="M7 17 17 7M9 7h8v8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function UltimaReferralCta({
  commissionPercent,
  onClick,
  variant = 'mobile',
  className,
}: UltimaReferralCtaProps) {
  const { t } = useTranslation();
  const normalizedCommission = Math.max(0, Math.round(commissionPercent ?? 0));
  const showBadge = normalizedCommission > 0;
  const title = t('profile.referralTitle', { defaultValue: 'Реферальная программа' });
  const description = showBadge
    ? t('ultima.referralCtaDescription', {
        percent: normalizedCommission,
        defaultValue: 'Получайте {{percent}}% комиссии за приглашения',
      })
    : t('profile.referralDescription', {
        defaultValue: 'Получайте бонусы за приглашения',
      });

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full text-left transition-transform duration-200 hover:translate-y-[-1px] active:translate-y-0',
        variant === 'desktop'
          ? 'flex items-center justify-between gap-4 rounded-[24px] border px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_42px_rgba(3,14,24,0.18)] backdrop-blur-xl'
          : 'flex flex-col gap-3 rounded-2xl border px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_24px_rgba(3,14,24,0.18)] backdrop-blur-md min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between',
        className,
      )}
      style={{
        borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 30%, transparent)',
        background:
          'linear-gradient(140deg, color-mix(in srgb, var(--ultima-color-aura) 16%, transparent), color-mix(in srgb, var(--ultima-color-surface) 36%, transparent) 42%, color-mix(in srgb, var(--ultima-color-secondary) 68%, transparent) 100%)',
      }}
      aria-label={title}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-2xl border text-white/90',
            variant === 'desktop' ? 'h-11 w-11' : 'h-10 w-10',
          )}
          style={{
            borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 24%, transparent)',
            background: 'color-mix(in srgb, var(--ultima-color-surface) 44%, transparent)',
          }}
        >
          <ReferralIcon />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-white/96 line-clamp-2 break-words font-semibold leading-tight',
              variant === 'desktop' ? 'text-[15px]' : 'text-[14px]',
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              'text-white/68 mt-1 break-words [overflow-wrap:anywhere]',
              variant === 'desktop' ? 'text-[13px] leading-snug' : 'text-[12px] leading-snug',
            )}
          >
            {description}
          </p>
        </div>
      </div>

      <div
        className={cn(
          'flex shrink-0 items-center gap-2',
          variant === 'desktop'
            ? ''
            : 'w-full justify-between min-[360px]:w-auto min-[360px]:justify-end',
        )}
      >
        {showBadge ? (
          <span
            className={cn(
              'text-white/96 rounded-full border px-2.5 py-1 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
              variant === 'desktop' ? 'text-[13px]' : 'text-[12px]',
            )}
            style={{
              borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 28%, transparent)',
              background: 'color-mix(in srgb, var(--ultima-color-primary) 24%, transparent)',
            }}
          >
            {normalizedCommission}%
          </span>
        ) : null}

        <span
          className="text-white/72 group-hover:text-white/92 flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
          style={{
            borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 20%, transparent)',
            background: 'color-mix(in srgb, #ffffff 4%, transparent)',
          }}
        >
          <ArrowUpRightIcon />
        </span>
      </div>
    </button>
  );
}
