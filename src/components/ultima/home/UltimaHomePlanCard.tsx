import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

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
  primaryLabel,
  primaryMeta,
  secondaryLabel,
  onPrimaryAction,
  onSecondaryAction,
}: UltimaHomePlanCardProps) {
  return (
    <section className="ultima-mobile-plan" data-testid="ultima-home-overview" data-tone={tone}>
      <header className="ultima-mobile-plan-heading">
        <div className="ultima-mobile-plan-caption">
          <p className="ultima-mobile-plan-eyebrow">{eyebrow}</p>
          <span className="ultima-mobile-plan-status">{statusLabel}</span>
        </div>
        <h1>{planName}</h1>
        <p className="ultima-mobile-plan-expiry">{expiryLabel}</p>
      </header>

      <dl className="ultima-mobile-plan-details">
        <div data-testid="ultima-home-days">
          <dt>{daysLabel}</dt>
          <dd>{daysValue}</dd>
        </div>
        <div data-testid="ultima-plan-device-count" aria-busy={devicesLoading}>
          <dt>{devicesLabel}</dt>
          <dd>
            {devicesLoading ? (
              <span className="ultima-mobile-plan-loading" aria-hidden="true">
                …
              </span>
            ) : (
              devicesValue
            )}
          </dd>
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
        </button>
        {secondaryLabel && onSecondaryAction ? (
          <button
            type="button"
            onClick={onSecondaryAction}
            data-testid="ultima-home-plan-details"
            className="ultima-mobile-plan-secondary"
          >
            <span>{secondaryLabel}</span>
            <ChevronRight size={17} strokeWidth={1.8} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
