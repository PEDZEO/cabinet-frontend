import type { ReactNode } from 'react';
import { CalendarDays, ChevronRight, MonitorSmartphone } from 'lucide-react';

import { cn } from '@/lib/utils';

export type UltimaHomePlanTone = 'active' | 'trial' | 'warning' | 'expired';

type UltimaHomePlanCardProps = {
  eyebrow: string;
  planName: string;
  statusLabel: string;
  tone: UltimaHomePlanTone;
  expiryLabel: string;
  daysLabel: string;
  daysValue: string;
  devicesLabel: string;
  devicesValue: string;
  devicesLoading?: boolean;
  brandMark: ReactNode;
  primaryLabel: string;
  primaryMeta?: string | null;
  secondaryLabel?: string | null;
  onPrimaryAction: () => void;
  onSecondaryAction?: (() => void) | null;
};

const toneStyles: Record<UltimaHomePlanTone, { chip: string; dot: string }> = {
  active: {
    chip: 'border-emerald-200/[0.24] bg-emerald-300/[0.13] text-emerald-50/[0.95]',
    dot: 'bg-emerald-200',
  },
  trial: {
    chip: 'border-cyan-200/[0.24] bg-cyan-300/[0.13] text-cyan-50/[0.95]',
    dot: 'bg-cyan-200',
  },
  warning: {
    chip: 'border-amber-200/[0.26] bg-amber-300/[0.14] text-amber-50/[0.95]',
    dot: 'bg-amber-200',
  },
  expired: {
    chip: 'border-rose-200/[0.25] bg-rose-300/[0.13] text-rose-50/[0.95]',
    dot: 'bg-rose-200',
  },
};

export function UltimaHomePlanCard({
  eyebrow,
  planName,
  statusLabel,
  tone,
  expiryLabel,
  daysLabel,
  daysValue,
  devicesLabel,
  devicesValue,
  devicesLoading = false,
  brandMark,
  primaryLabel,
  primaryMeta,
  secondaryLabel,
  onPrimaryAction,
  onSecondaryAction,
}: UltimaHomePlanCardProps) {
  const toneStyle = toneStyles[tone];

  return (
    <section
      data-testid="ultima-home-overview"
      className="overflow-hidden rounded-[20px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_16px_36px_rgba(3,14,24,0.2)] backdrop-blur-xl"
      style={{
        borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 30%, transparent)',
        background:
          'linear-gradient(145deg, color-mix(in srgb, var(--ultima-color-surface) 80%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 68%, transparent))',
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase text-white/[0.48]">{eyebrow}</span>
            <span
              className={cn(
                'inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-semibold uppercase',
                toneStyle.chip,
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', toneStyle.dot)} />
              {statusLabel}
            </span>
          </div>
          <h1 className="mt-2.5 break-words text-[27px] font-semibold leading-[1.04] text-white/[0.98]">
            {planName}
          </h1>
          <p className="mt-1.5 text-[13px] leading-snug text-white/[0.62]">{expiryLabel}</p>
        </div>

        <div className="flex h-[82px] w-[82px] shrink-0 items-center justify-center">
          {brandMark}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 divide-x divide-white/[0.08] border-y border-white/[0.08] py-3">
        <div data-testid="ultima-home-days" className="min-w-0 pr-3">
          <div className="flex items-center gap-2 text-white/[0.45]">
            <CalendarDays className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span className="truncate text-[11px] font-medium">{daysLabel}</span>
          </div>
          <p className="mt-1.5 truncate text-[17px] font-semibold text-white/[0.94]">{daysValue}</p>
        </div>
        <div
          data-testid="ultima-plan-device-count"
          aria-busy={devicesLoading}
          className="min-w-0 pl-3"
        >
          <div className="flex items-center gap-2 text-white/[0.45]">
            <MonitorSmartphone className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span className="truncate text-[11px] font-medium">{devicesLabel}</span>
          </div>
          {devicesLoading ? (
            <span className="mt-2 block h-4 w-12 animate-pulse rounded-full bg-white/[0.1]" />
          ) : (
            <p className="mt-1.5 truncate text-[17px] font-semibold text-white/[0.94]">
              {devicesValue}
            </p>
          )}
        </div>
      </div>

      <div
        className={cn(
          'mt-3 grid gap-2',
          secondaryLabel && onSecondaryAction
            ? 'grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]'
            : 'grid-cols-1',
        )}
      >
        <button
          type="button"
          onClick={onPrimaryAction}
          data-testid="ultima-primary-cta"
          className="ultima-btn-pill ultima-btn-primary flex min-h-11 min-w-0 items-center justify-between gap-2 px-4 text-left text-[13px]"
        >
          <span className="truncate">{primaryLabel}</span>
          {primaryMeta ? (
            <span className="shrink-0 text-[11px] text-white/[0.76]">{primaryMeta}</span>
          ) : (
            <ChevronRight className="h-4 w-4" strokeWidth={1.9} />
          )}
        </button>

        {secondaryLabel && onSecondaryAction ? (
          <button
            type="button"
            onClick={onSecondaryAction}
            data-testid="ultima-home-plan-details"
            className="ultima-btn-pill ultima-btn-secondary flex min-h-11 min-w-0 items-center justify-center gap-1.5 px-3 text-[12px]"
          >
            <span className="truncate">{secondaryLabel}</span>
            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
          </button>
        ) : null}
      </div>
    </section>
  );
}
