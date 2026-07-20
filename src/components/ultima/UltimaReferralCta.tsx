import { useTranslation } from 'react-i18next';
import { ArrowUpRight, UsersRound } from 'lucide-react';
import { cn } from '@/lib/utils';

type UltimaReferralCtaProps = {
  commissionPercent?: number | null;
  onClick: () => void;
  variant?: 'mobile' | 'desktop' | 'inline';
  className?: string;
  title?: string;
  description?: string;
  badgeLabel?: string;
};

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
        'group relative isolate w-full overflow-hidden text-left transition-colors duration-200',
        variant === 'desktop'
          ? 'rounded-[22px] border px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_32px_rgba(3,14,24,0.16)] backdrop-blur-xl'
          : variant === 'inline'
            ? 'min-h-[64px] border-b border-white/[0.07] px-1 py-3 last:border-b-0 hover:bg-white/[0.025]'
            : 'rounded-[20px] border px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_22px_rgba(3,14,24,0.16)] backdrop-blur-md',
        className,
      )}
      style={
        variant === 'inline'
          ? undefined
          : {
              borderColor:
                'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
              background:
                'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-surface) 50%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 68%, transparent))',
            }
      }
      aria-label={title}
    >
      <div
        className={cn(
          'relative flex min-w-0 items-center',
          variant === 'desktop' ? 'gap-2.5' : 'gap-3',
        )}
      >
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-[18px] border text-white/[0.88]',
          )}
          style={{
            borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 18%, transparent)',
            background: 'color-mix(in srgb, var(--ultima-color-surface) 42%, transparent)',
          }}
        >
          <UsersRound className="h-5 w-5" strokeWidth={1.8} />
        </span>

        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-[14px] font-semibold leading-tight text-white/[0.96]')}>
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

        <div
          className={cn(
            'flex shrink-0 items-center',
            variant === 'desktop' ? 'gap-1' : 'gap-2 pl-1',
          )}
        >
          {showBadge ? (
            <span
              className={cn(
                'rounded-full border px-2 py-1 text-center font-semibold text-white/[0.94] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
                variant === 'desktop' ? 'min-w-[46px] px-1.5 text-[10px]' : 'text-[10px]',
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
            className={cn(
              'flex items-center justify-center text-white/[0.52] transition-colors group-hover:text-white/[0.9]',
              variant === 'desktop' ? 'h-6 w-5' : 'h-8 w-8',
            )}
          >
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
          </span>
        </div>
      </div>
    </button>
  );
}
