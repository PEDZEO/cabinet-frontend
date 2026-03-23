import { type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type UltimaDesktopAgreementProps = {
  title: string;
  subtitle: string;
  updatedAtLabel: string | null;
  htmlContent: string;
  isLoading: boolean;
  emptyLabel: string;
  bottomNav: ReactNode;
};

const cardClassName =
  'rounded-[30px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_22px_48px_rgba(3,14,24,0.24)] backdrop-blur-xl';

const cardStyle: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 22%, transparent)',
  background:
    'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-surface) 30%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 66%, transparent))',
};

const highlightStyle: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 30%, transparent)',
  background:
    'linear-gradient(145deg, color-mix(in srgb, var(--ultima-color-aura) 20%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 74%, transparent))',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.08), 0 28px 56px color-mix(in srgb, var(--ultima-color-aura) 12%, transparent)',
};

const DocumentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
    <path
      d="M8 3.5h7l4 4v12A1.5 1.5 0 0 1 17.5 21h-9A1.5 1.5 0 0 1 7 19.5v-14A1.5 1.5 0 0 1 8.5 4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M15 3.5V8h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="m9.8 14.1 1.8 1.8 3.2-3.2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function UltimaDesktopAgreement({
  title,
  subtitle,
  updatedAtLabel,
  htmlContent,
  isLoading,
  emptyLabel,
  bottomNav,
}: UltimaDesktopAgreementProps) {
  return (
    <div
      className="ultima-shell-inner lg:max-w-[1120px]"
      style={{
        height: 'calc(100dvh - 32px - env(safe-area-inset-bottom, 0px))',
        minHeight: 'calc(100dvh - 32px - env(safe-area-inset-bottom, 0px))',
        maxHeight: 'calc(100dvh - 32px - env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="grid h-full min-h-0 gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <aside className="space-y-5 lg:sticky lg:top-4">
          <section
            className={cn(cardClassName, 'relative overflow-hidden p-6')}
            style={highlightStyle}
          >
            <div className="text-white/84 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07]">
              <DocumentIcon />
            </div>
            <h1 className="mt-4 text-[36px] font-semibold leading-[0.94] tracking-[-0.04em] text-white">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-[1.6] text-white/70">{subtitle}</p>
            <div className="mt-6 rounded-[22px] border border-white/10 bg-black/15 px-4 py-3">
              <div className="text-white/42 text-[11px] uppercase tracking-[0.22em]">
                Последнее обновление
              </div>
              <div className="text-white/88 mt-2 text-sm font-medium">
                {updatedAtLabel ?? 'Не указано'}
              </div>
            </div>
          </section>

          <div className="ultima-nav-dock mt-0">{bottomNav}</div>
        </aside>

        <section
          className={cn(cardClassName, 'flex min-h-0 flex-col overflow-hidden p-0')}
          style={cardStyle}
        >
          <div className="border-white/8 flex items-center justify-between border-b px-6 py-5">
            <div>
              <div className="text-2xl font-semibold tracking-[-0.03em] text-white">{title}</div>
            </div>
            <div className="text-white/52 text-sm">{updatedAtLabel ?? 'Актуальная версия'}</div>
          </div>

          {isLoading ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/35 border-t-transparent" />
            </div>
          ) : (
            <div className="ultima-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-6">
              {htmlContent ? (
                <div
                  className="prose prose-invert max-w-none text-[15px] leading-[1.75] [&_a]:text-[#5de8c3] [&_a]:underline [&_h1]:mb-4 [&_h1]:text-[38px] [&_h1]:font-semibold [&_h1]:leading-[1] [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-[32px] [&_h2]:font-semibold [&_h2]:leading-[1.08] [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-[26px] [&_h3]:font-semibold [&_li]:mb-2 [&_p]:mb-4 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              ) : (
                <p className="text-white/60">{emptyLabel}</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
