import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

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
    <section className="ultima-mobile-actions" data-testid="ultima-home-quick-actions">
      <header className="ultima-mobile-actions-heading">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      <div className="ultima-mobile-action-list">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            disabled={action.loading}
            aria-busy={action.loading || undefined}
            data-testid={`ultima-home-action-${action.id}`}
            data-tone={action.tone || 'default'}
            className="ultima-mobile-action-row"
          >
            <span className="ultima-mobile-action-copy">
              <span className="ultima-mobile-action-heading">
                <strong className="ultima-mobile-action-title">{action.title}</strong>
                <span className="ultima-mobile-action-value">
                  {action.loading ? <span aria-hidden="true">…</span> : action.value}
                </span>
              </span>
              {action.hint ? (
                <span className="ultima-mobile-action-hint">{action.hint}</span>
              ) : null}
            </span>
            <ChevronRight
              className="ultima-mobile-action-arrow"
              size={18}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
