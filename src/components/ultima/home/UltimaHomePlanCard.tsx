import { ArrowRight, ChevronRight, ShieldCheck } from 'lucide-react';

export type UltimaHomePlanTone = 'active' | 'trial' | 'warning' | 'expired';

type UltimaHomePlanCardProps = {
  eyebrow: string;
  planName: string;
  statusLabel: string;
  tone: UltimaHomePlanTone;
  isExpired: boolean;
  expiryLabel: string;
  daysLabel: string;
  daysValue: string;
  devicesLabel: string;
  devicesValue: string;
  devicesLoading?: boolean;
  brandName: string;
  primaryLabel: string;
  primaryMeta?: string | null;
  secondaryLabel?: string | null;
  onPrimaryAction: () => void;
  onSecondaryAction?: (() => void) | null;
};

export function UltimaHomePlanCard({
  eyebrow,
  planName,
  statusLabel,
  tone,
  isExpired,
  expiryLabel,
  daysLabel,
  daysValue,
  devicesLabel,
  devicesValue,
  devicesLoading = false,
  brandName,
  primaryLabel,
  primaryMeta,
  secondaryLabel,
  onPrimaryAction,
  onSecondaryAction,
}: UltimaHomePlanCardProps) {
  return (
    <section className="ultima-mobile-plan" data-testid="ultima-home-overview" data-tone={tone}>
      <header className="ultima-mobile-plan-header">
        <div className="ultima-mobile-plan-brand">
          <ShieldCheck
            className="ultima-mobile-plan-mark"
            size={23}
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <span>{brandName}</span>
        </div>
        <span
          className={
            isExpired
              ? 'ultima-mobile-plan-status ultima-mini-expired-status'
              : 'ultima-mobile-plan-status'
          }
        >
          {statusLabel}
        </span>
      </header>

      <div className="ultima-mobile-plan-body">
        <div className="ultima-mobile-plan-summary">
          <div className="ultima-mobile-plan-heading">
            <p className="ultima-mobile-plan-eyebrow">{eyebrow}</p>
            <h1>{planName}</h1>
            {expiryLabel ? <p className="ultima-mobile-plan-expiry">{expiryLabel}</p> : null}
          </div>
          {secondaryLabel && onSecondaryAction ? (
            <button
              type="button"
              onClick={onSecondaryAction}
              data-testid="ultima-home-plan-details"
              className="ultima-mobile-plan-secondary"
            >
              <span>{secondaryLabel}</span>
              <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <dl className="ultima-mobile-plan-details">
          <div data-testid="ultima-home-days">
            <dt>{daysLabel}</dt>
            <dd>{daysValue}</dd>
          </div>
          <div data-testid="ultima-plan-device-count" aria-busy={devicesLoading}>
            <dt>{devicesLabel}</dt>
            <dd>{devicesLoading ? <span aria-hidden="true">…</span> : devicesValue}</dd>
          </div>
        </dl>

        <div className="ultima-mobile-plan-actions">
          <button
            type="button"
            onClick={onPrimaryAction}
            data-testid="ultima-primary-cta"
            className="ultima-mobile-plan-primary"
          >
            <span>{primaryLabel}</span>
            {primaryMeta ? (
              <span className="ultima-mobile-plan-action-meta">{primaryMeta}</span>
            ) : null}
            <ArrowRight size={18} strokeWidth={1.9} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
