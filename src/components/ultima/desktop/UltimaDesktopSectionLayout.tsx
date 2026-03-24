import { type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type UltimaDesktopMetric = {
  label: string;
  value: string;
  hint?: string;
};

type UltimaDesktopSectionLayoutProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  eyebrow?: string;
  metrics?: UltimaDesktopMetric[];
  heroActions?: ReactNode;
  aside?: ReactNode;
  bottomNav: ReactNode;
  children: ReactNode;
  contentClassName?: string;
};

type UltimaDesktopPanelProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

const sharedCardClassName =
  'rounded-[30px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_22px_48px_rgba(3,14,24,0.24)] backdrop-blur-xl';

const defaultCardStyle: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 22%, transparent)',
  background:
    'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-surface) 30%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 66%, transparent))',
};

const accentCardStyle: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 32%, transparent)',
  background:
    'linear-gradient(145deg, color-mix(in srgb, var(--ultima-color-aura) 22%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 72%, transparent))',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.08), 0 28px 56px color-mix(in srgb, var(--ultima-color-aura) 12%, transparent)',
};

export function UltimaDesktopPanel({
  title,
  subtitle,
  children,
  className,
}: UltimaDesktopPanelProps) {
  return (
    <section className={cn(sharedCardClassName, className)} style={defaultCardStyle}>
      {title ? (
        <div className="mb-4">
          <h2 className="text-[22px] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
            {title}
          </h2>
          {subtitle ? <p className="text-white/68 mt-2 text-sm leading-[1.6]">{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function UltimaDesktopSectionLayout({
  icon,
  title,
  subtitle,
  eyebrow,
  metrics,
  heroActions,
  aside,
  bottomNav,
  children,
  contentClassName,
}: UltimaDesktopSectionLayoutProps) {
  const normalizedEyebrow = eyebrow?.trim().toLowerCase();
  const normalizedTitle = title.trim().toLowerCase();
  const displayEyebrow =
    normalizedEyebrow && normalizedEyebrow !== normalizedTitle ? eyebrow : undefined;

  return (
    <div className="ultima-shell-inner lg:max-w-[1160px]">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className={cn('space-y-4', contentClassName)}>
          <section
            className={cn(sharedCardClassName, 'relative overflow-hidden p-6 lg:p-7')}
            style={accentCardStyle}
          >
            <div className="absolute inset-y-0 right-[-10%] w-[34%] rounded-full bg-white/[0.05] blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-[54ch]">
                  <div className="text-white/84 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08]">
                    {icon}
                  </div>
                  {displayEyebrow ? (
                    <div className="text-white/48 mt-4 text-[11px] uppercase tracking-[0.22em]">
                      {displayEyebrow}
                    </div>
                  ) : null}
                  <h1 className="mt-3 text-[clamp(34px,4.2vw,52px)] font-semibold leading-[0.94] tracking-[-0.045em] text-white">
                    {title}
                  </h1>
                  <p className="text-white/72 mt-3 text-[15px] leading-[1.65]">{subtitle}</p>
                </div>
                {heroActions ? <div className="flex flex-wrap gap-2">{heroActions}</div> : null}
              </div>

              {metrics && metrics.length > 0 ? (
                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {metrics.map((metric) => (
                    <div
                      key={`${metric.label}-${metric.value}`}
                      className="bg-black/12 rounded-[22px] border border-white/10 px-4 py-3"
                    >
                      <div className="text-white/42 text-[11px] uppercase tracking-[0.2em]">
                        {metric.label}
                      </div>
                      <div className="mt-2 text-[24px] font-semibold leading-none tracking-[-0.03em] text-white">
                        {metric.value}
                      </div>
                      {metric.hint ? (
                        <div className="mt-2 text-[13px] leading-[1.5] text-white/60">
                          {metric.hint}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          {children}
        </div>

        <aside className="ultima-desktop-aside space-y-4 lg:sticky lg:top-4">
          {aside}
          <div className="ultima-nav-dock mt-0">{bottomNav}</div>
        </aside>
      </div>
    </div>
  );
}
