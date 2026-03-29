import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import type { UltimaThemeConfig } from '@/api/branding';
import { getUltimaThemeCssVarStyle } from '@/features/ultima/theme';

type UltimaThemeLivePreviewProps = {
  config: UltimaThemeConfig;
  title?: string;
  subtitle?: string;
  variant?: 'full' | 'card';
  className?: string;
};

function withVars(config: UltimaThemeConfig): CSSProperties {
  return getUltimaThemeCssVarStyle(config);
}

export function UltimaThemeLivePreview({
  config,
  title = 'Ultima',
  subtitle = 'Live Preview',
  variant = 'full',
  className,
}: UltimaThemeLivePreviewProps) {
  const compact = variant === 'card';

  return (
    <div
      data-ultima-animation={config.animationPresetId}
      style={withVars(config)}
      className={cn(
        'ultima-preview-shell relative isolate overflow-hidden rounded-[28px] border',
        compact ? 'h-44' : 'h-[280px]',
        className,
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
          background:
            'linear-gradient(160deg, color-mix(in srgb, var(--ultima-color-bg-top) 92%, #020202) 0%, color-mix(in srgb, var(--ultima-color-bg-bottom) 90%, #020202) 100%)',
        }}
      />
      <div className="ultima-preview-aura absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 28%, rgba(0,0,0,0.18) 100%)',
        }}
      />

      <div className={cn('relative z-10 flex h-full flex-col', compact ? 'p-3.5' : 'p-5')}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-white/54 truncate text-[10px] font-medium uppercase tracking-[0.24em]">
              {title}
            </div>
            <div
              className={cn(
                'text-white/94 truncate font-semibold',
                compact ? 'text-sm' : 'text-lg',
              )}
            >
              {subtitle}
            </div>
          </div>
          <div
            className="shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{
              borderColor:
                'color-mix(in srgb, var(--ultima-color-surface-border) 28%, transparent)',
              background: 'color-mix(in srgb, var(--ultima-color-surface) 36%, transparent)',
              color: 'color-mix(in srgb, var(--ultima-color-ring) 90%, #ffffff)',
            }}
          >
            Live
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <div
            className={cn(
              'rounded-[22px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_42px_rgba(3,14,24,0.18)]',
              compact ? 'p-3' : 'p-4',
            )}
            style={{
              borderColor:
                'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
              background: 'color-mix(in srgb, var(--ultima-color-surface) 44%, transparent)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-white/48 text-xs uppercase tracking-[0.18em]">Dashboard</div>
                <div
                  className={cn('font-semibold text-white/95', compact ? 'text-sm' : 'text-base')}
                >
                  Secure access
                </div>
              </div>
              <div
                className="h-10 w-10 rounded-full border"
                style={{
                  borderColor:
                    'color-mix(in srgb, var(--ultima-color-surface-border) 34%, transparent)',
                  background:
                    'radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--ultima-color-ring) 26%, transparent), color-mix(in srgb, var(--ultima-color-primary) 38%, transparent))',
                  boxShadow:
                    '0 0 30px color-mix(in srgb, var(--ultima-color-aura) 24%, transparent)',
                }}
              />
            </div>

            {!compact && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div
                  className="rounded-2xl border px-3 py-2.5"
                  style={{
                    borderColor:
                      'color-mix(in srgb, var(--ultima-color-surface-border) 18%, transparent)',
                    background: 'color-mix(in srgb, var(--ultima-color-surface) 28%, transparent)',
                  }}
                >
                  <div className="text-white/46 text-[11px] uppercase tracking-[0.2em]">
                    Traffic
                  </div>
                  <div className="text-white/96 mt-1 text-lg font-semibold">120 GB</div>
                </div>
                <div
                  className="rounded-2xl border px-3 py-2.5"
                  style={{
                    borderColor:
                      'color-mix(in srgb, var(--ultima-color-surface-border) 18%, transparent)',
                    background: 'color-mix(in srgb, var(--ultima-color-surface) 28%, transparent)',
                  }}
                >
                  <div className="text-white/46 text-[11px] uppercase tracking-[0.2em]">
                    Devices
                  </div>
                  <div className="text-white/96 mt-1 text-lg font-semibold">5 active</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <div
              className={cn(
                'rounded-full px-4 py-2 text-center font-semibold',
                compact ? 'text-[11px]' : 'text-sm',
              )}
              style={{
                background: 'var(--ultima-color-primary)',
                color: 'var(--ultima-color-primary-text)',
                boxShadow:
                  '0 14px 28px color-mix(in srgb, var(--ultima-color-aura) 22%, transparent)',
              }}
            >
              Connect
            </div>
            <div
              className={cn(
                'rounded-full border px-4 py-2 text-center font-medium',
                compact ? 'text-[11px]' : 'text-sm',
              )}
              style={{
                borderColor:
                  'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
                background: 'color-mix(in srgb, var(--ultima-color-secondary) 74%, transparent)',
                color: 'var(--ultima-color-secondary-text)',
              }}
            >
              Settings
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
