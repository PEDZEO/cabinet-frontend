import { type CSSProperties, type ReactNode } from 'react';
import {
  ultimaAccentSurfaceStyle,
  ultimaCardClassName,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';
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

const defaultCardStyle: CSSProperties = ultimaSurfaceStyle;
const accentCardStyle: CSSProperties = ultimaAccentSurfaceStyle;

export function UltimaDesktopPanel({
  title,
  subtitle,
  children,
  className,
}: UltimaDesktopPanelProps) {
  return (
    <section className={cn(ultimaCardClassName, className)} style={defaultCardStyle}>
      {title ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-semibold leading-[1.08] tracking-[-0.02em] text-white">
              {title}
            </h2>
            {subtitle ? (
              <p className="text-white/62 mt-1.5 max-w-[64ch] text-sm leading-[1.55]">{subtitle}</p>
            ) : null}
          </div>
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
    <div className="ultima-shell-inner lg:max-w-[1280px]">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className={cn('space-y-4', contentClassName)}>
          <section
            className={cn(ultimaCardClassName, 'relative overflow-hidden p-5 lg:p-6')}
            style={accentCardStyle}
          >
            <div className="absolute inset-y-0 right-[-8%] w-[34%] rounded-full bg-white/[0.05] blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-[54ch]">
                  <div className="text-white/84 flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.08]">
                    {icon}
                  </div>
                  {displayEyebrow ? (
                    <div className="text-white/48 mt-4 text-[11px] uppercase tracking-[0.22em]">
                      {displayEyebrow}
                    </div>
                  ) : null}
                  <h1 className="mt-2.5 max-w-[18ch] text-[clamp(30px,3.2vw,46px)] font-semibold leading-[0.98] tracking-[-0.035em] text-white">
                    {title}
                  </h1>
                  <p className="mt-3 max-w-[62ch] text-[15px] leading-[1.62] text-white/70">
                    {subtitle}
                  </p>
                </div>
                {heroActions ? <div className="flex flex-wrap gap-2">{heroActions}</div> : null}
              </div>

              {metrics && metrics.length > 0 ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {metrics.map((metric) => (
                    <div
                      key={`${metric.label}-${metric.value}`}
                      className="bg-black/16 rounded-[18px] border border-white/10 px-4 py-3"
                    >
                      <div className="text-white/42 text-[10px] uppercase tracking-[0.18em]">
                        {metric.label}
                      </div>
                      <div className="mt-2 text-[22px] font-semibold leading-none tracking-[-0.025em] text-white">
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
