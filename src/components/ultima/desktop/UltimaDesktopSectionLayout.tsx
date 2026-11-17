import { type ReactNode } from 'react';
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

export function UltimaDesktopPanel({
  title,
  subtitle,
  children,
  className,
}: UltimaDesktopPanelProps) {
  return (
    <section className={cn('ultima-card ultima-desktop-panel ultima-web-sectionpanel', className)}>
      {title || subtitle ? (
        <header className="ultima-web-sectionpanel-header">
          {title ? <h2>{title}</h2> : null}
          {subtitle ? <p>{subtitle}</p> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function UltimaDesktopSectionLayout({
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
      <div className={cn('ultima-desktop-page ultima-web-sectionpage', contentClassName)}>
        <header className="ultima-desktop-page-header ultima-web-sectionheader">
          <div className="ultima-web-sectionheading">
            {displayEyebrow ? <p className="ultima-web-sectioneyebrow">{displayEyebrow}</p> : null}
            <h1>{title}</h1>
            {subtitle ? <p className="ultima-web-sectionsubtitle">{subtitle}</p> : null}
          </div>
          {heroActions ? (
            <div className="ultima-desktop-page-actions ultima-web-sectionactions">
              {heroActions}
            </div>
          ) : null}
        </header>

        {metrics && metrics.length > 0 ? (
          <section className="ultima-desktop-metrics ultima-web-sectionsummary" aria-label="Сводка">
            <dl>
              {metrics.map((metric) => (
                <div
                  className="ultima-web-sectionsummary-item"
                  key={`${metric.label}-${metric.value}`}
                >
                  <dt>{metric.label}</dt>
                  <dd>{metric.value}</dd>
                  {metric.hint ? (
                    <dd className="ultima-web-sectionsummary-hint">{metric.hint}</dd>
                  ) : null}
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <div className="ultima-web-sectioncontent">{children}</div>
      </div>
    </UltimaDesktopWorkspace>
  );
}
