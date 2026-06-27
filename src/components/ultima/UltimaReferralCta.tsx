import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type UltimaReferralCtaProps = {
  commissionPercent?: number | null;
  onClick: () => void;
  variant?: 'mobile' | 'desktop';
  className?: string;
  title?: string;
  description?: string;
  badgeLabel?: string;
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
  title: titleOverride,
  description: descriptionOverride,
  badgeLabel,
}: UltimaReferralCtaProps) {
  const { t } = useTranslation();
  const normalizedCommission = Math.max(0, Math.round(commissionPercent ?? 0));
  const showBadge = normalizedCommission > 0 || Boolean(badgeLabel);
  const title = titleOverride ?? t('ultima.referralInviteTitle', { defaultValue: 'Позови друга' });
  const description =
    descriptionOverride ??
    t('ultima.referralInviteDescription', {
      percent: normalizedCommission,
      defaultValue: 'Бонус за приглашение друга',
    });
  const resolvedBadgeLabel =
    badgeLabel ?? t('ultima.referralInviteBadge', { defaultValue: 'Бонус' });

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative isolate w-full overflow-hidden text-left transition-transform duration-200 hover:translate-y-[-1px] active:translate-y-0',
        variant === 'desktop'
          ? 'rounded-[22px] border px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_32px_rgba(3,14,24,0.16)] backdrop-blur-xl'
          : 'rounded-[20px] border px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_22px_rgba(3,14,24,0.16)] backdrop-blur-md',
        className,
      )}
      style={{
        borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-surface) 50%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 68%, transparent))',
      }}
      aria-label={title}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full opacity-70 blur-2xl"
        style={{
          background: 'color-mix(in srgb, var(--ultima-color-aura) 16%, transparent)',
        }}
      />

      <div className="relative flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-[18px] border text-white/[0.88]',
            variant === 'desktop' ? 'h-10 w-10' : 'h-9 w-9',
          )}
          style={{
            borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 18%, transparent)',
            background: 'color-mix(in srgb, var(--ultima-color-surface) 42%, transparent)',
          }}
        >
          <ReferralIcon />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate font-semibold leading-tight text-white/[0.96]',
              variant === 'desktop' ? 'text-[15px]' : 'text-[14px]',
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              'mt-0.5 truncate text-white/[0.62]',
              variant === 'desktop' ? 'text-[12px] leading-tight' : 'text-[11px] leading-tight',
            )}
          >
            {description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 pl-1">
          {showBadge ? (
            <span
              className={cn(
                'rounded-full border px-2 py-1 text-center font-semibold text-white/[0.94] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
                variant === 'desktop' ? 'min-w-[54px] text-[11px]' : 'text-[10px]',
              )}
              style={{
                borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 22%, transparent)',
                background: 'color-mix(in srgb, var(--ultima-color-primary) 16%, transparent)',
              }}
            >
              {resolvedBadgeLabel}
            </span>
          ) : null}

          <span
            className="flex h-8 w-8 items-center justify-center rounded-full border text-white/[0.72] transition-colors group-hover:text-white/[0.92]"
            style={{
              borderColor:
                'color-mix(in srgb, var(--ultima-color-surface-border) 18%, transparent)',
              background: 'color-mix(in srgb, #ffffff 4%, transparent)',
            }}
          >
            <ArrowUpRightIcon />
          </span>
        </div>
      </div>
    </button>
  );
}
