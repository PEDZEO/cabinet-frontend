import { type CSSProperties, type ReactNode } from 'react';
import {
  ultimaAccentSurfaceStyle,
  ultimaCardClassName,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';
import { cn } from '@/lib/utils';
import { UltimaDesktopWorkspace } from './UltimaDesktopWorkspace';

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
    <section
      className={cn(ultimaCardClassName, 'ultima-desktop-panel', className)}
      style={defaultCardStyle}
    >
      {title ? (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-semibold leading-tight text-white">{title}</h2>
            {subtitle ? (
              <p className="mt-1.5 max-w-[64ch] text-sm leading-[1.55] text-white/[0.58]">
                {subtitle}
              </p>
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
    <UltimaDesktopWorkspace bottomNav={bottomNav} aside={aside}>
      <div className={cn('ultima-desktop-page space-y-5', contentClassName)}>
        <header className="ultima-desktop-page-header" style={accentCardStyle}>
          <div className="ultima-desktop-page-heading">
            <div className="ultima-desktop-page-icon">{icon}</div>
            <div className="min-w-0">
              {displayEyebrow ? (
                <div className="ultima-desktop-eyebrow">{displayEyebrow}</div>
              ) : null}
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>
          {heroActions ? <div className="ultima-desktop-page-actions">{heroActions}</div> : null}
        </header>

        {metrics && metrics.length > 0 ? (
          <section className="ultima-desktop-metrics" aria-label="Сводка">
            {metrics.map((metric) => (
              <article key={`${metric.label}-${metric.value}`}>
                <div>{metric.label}</div>
                <strong>{metric.value}</strong>
                {metric.hint ? <p>{metric.hint}</p> : null}
              </article>
            ))}
          </section>
        ) : null}

        {children}
      </div>
    </UltimaDesktopWorkspace>
  );
}
