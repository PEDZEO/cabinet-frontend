import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

export type UltimaHomeAction = {
  id: 'devices' | 'setup' | 'identities' | 'referral';
  title: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  onClick: () => void;
  tone?: 'default' | 'attention' | 'accent';
  loading?: boolean;
};

type UltimaHomeActionGridProps = {
  title: string;
  subtitle: string;
  actions: UltimaHomeAction[];
};

export function UltimaHomeActionGrid({ title, subtitle, actions }: UltimaHomeActionGridProps) {
  return (
    <section data-testid="ultima-home-quick-actions">
      <div className="mb-2.5">
        <h2 className="text-[16px] font-semibold text-white/[0.95]">{title}</h2>
        <p className="mt-1 text-[12px] leading-snug text-white/[0.48]">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              disabled={action.loading}
              data-testid={`ultima-home-action-${action.id}`}
              className={cn(
                'group flex min-h-[112px] min-w-0 flex-col rounded-lg border p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-200 active:scale-[0.985] disabled:cursor-wait disabled:opacity-70',
                action.tone === 'attention'
                  ? 'border-amber-200/[0.18] bg-amber-300/[0.075]'
                  : action.tone === 'accent'
                    ? 'border-emerald-200/[0.16] bg-emerald-300/[0.065]'
                    : 'border-white/[0.08] bg-white/[0.035]',
              )}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                    action.tone === 'attention'
                      ? 'border-amber-200/[0.2] bg-amber-300/[0.1] text-amber-100'
                      : action.tone === 'accent'
                        ? 'border-emerald-200/[0.18] bg-emerald-300/[0.09] text-emerald-100'
                        : 'border-white/[0.08] bg-white/[0.035] text-white/[0.78]',
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-white/[0.28] transition-transform group-hover:translate-x-0.5 group-hover:text-white/[0.62]"
                  strokeWidth={1.8}
                />
              </div>

              <div className="mt-auto min-w-0 pt-2.5">
                <p className="truncate text-[11px] font-medium text-white/[0.52]">{action.title}</p>
                {action.loading ? (
                  <span className="mt-1.5 block h-4 w-16 animate-pulse rounded-full bg-white/[0.1]" />
                ) : (
                  <p className="mt-1 truncate text-[15px] font-semibold text-white/[0.96]">
                    {action.value}
                  </p>
                )}
                <p className="mt-1 truncate text-[11px] text-white/[0.43]">{action.hint}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
