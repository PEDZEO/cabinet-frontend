import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

export type UltimaHomePlanTone = 'active' | 'trial' | 'warning' | 'expired' | 'idle';

type UltimaHomePlanCardProps = {
  title: string;
  brandAction: ReactNode;
  statusLabel: string;
  tone: UltimaHomePlanTone;
  subtitle?: string;
  primaryLabel: string;
  primaryMeta?: string;
  onPrimaryAction: () => void;
  busy?: boolean;
};

export function UltimaHomePlanCard({
  title,
  brandAction,
  statusLabel,
  tone,
  subtitle,
  primaryLabel,
  primaryMeta,
  onPrimaryAction,
  busy,
}: UltimaHomePlanCardProps) {
  return (
    <section className="ultima-mobile-plan" data-testid="ultima-home-overview" data-tone={tone}>
      <div className="ultima-mobile-plan-heading">
        <p className="ultima-mobile-plan-status">
          <span aria-hidden="true" />
          {statusLabel}
        </p>
        <h1>{title}</h1>
        {subtitle ? <p className="ultima-mobile-plan-expiry">{subtitle}</p> : null}
      </div>
      <div className="ultima-home-aurora-orbit">{brandAction}</div>
      <button
        type="button"
        onClick={onPrimaryAction}
        data-testid="ultima-primary-cta"
        className="ultima-mobile-plan-primary"
        disabled={busy}
        aria-busy={busy || undefined}
      >
        <span>
          {primaryLabel}
          {primaryMeta ? (
            <small className="ultima-mobile-plan-action-meta">{primaryMeta}</small>
          ) : null}
        </span>
        <ArrowRight size={18} strokeWidth={1.9} aria-hidden="true" />
      </button>
    </section>
  );
}
