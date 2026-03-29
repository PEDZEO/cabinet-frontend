import type { CSSProperties } from 'react';
import type { UltimaThemeConfig } from '@/api/branding';
import { getUltimaThemeCssVarStyle } from '@/features/ultima/theme';
import { cn } from '@/lib/utils';

export type UltimaThemePreviewScene = 'dashboard' | 'connection' | 'profile';

const SCENE_BADGES: Record<UltimaThemePreviewScene, string> = {
  dashboard: 'Главная',
  connection: 'Подключение',
  profile: 'Профиль',
};

type UltimaThemeLivePreviewProps = {
  config: UltimaThemeConfig;
  title?: string;
  subtitle?: string;
  variant?: 'full' | 'card';
  scene?: UltimaThemePreviewScene;
  className?: string;
};

function withVars(config: UltimaThemeConfig): CSSProperties {
  return getUltimaThemeCssVarStyle(config);
}

function DashboardScene({ compact }: { compact: boolean }) {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {[0, 1.4, 2.8].map((delay, index) => (
          <div
            key={delay}
            className="ultima-preview-ring-wave absolute left-1/2 top-[48%] rounded-full border"
            style={{
              width: compact ? `${42 + index * 12}%` : `${38 + index * 14}%`,
              height: compact ? `${42 + index * 12}%` : `${38 + index * 14}%`,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>

      <div className={cn('mt-auto space-y-3', compact && 'space-y-2.5')}>
        <div
          className={cn(
            'rounded-[22px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_42px_rgba(3,14,24,0.18)]',
            compact ? 'p-3' : 'p-4',
          )}
          style={{
            borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
            background: 'color-mix(in srgb, var(--ultima-color-surface) 44%, transparent)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-white/48 text-xs uppercase tracking-[0.18em]">Dashboard</div>
              <div className={cn('font-semibold text-white/95', compact ? 'text-sm' : 'text-base')}>
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
                boxShadow: '0 0 30px color-mix(in srgb, var(--ultima-color-aura) 24%, transparent)',
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
                <div className="text-white/46 text-[11px] uppercase tracking-[0.2em]">Traffic</div>
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
                <div className="text-white/46 text-[11px] uppercase tracking-[0.2em]">Devices</div>
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
    </>
  );
}

function ConnectionScene({ compact }: { compact: boolean }) {
  const ringSizes = compact
    ? { outer: 132, middle: 98, inner: 68, center: 76, success: 150 }
    : { outer: 188, middle: 138, inner: 96, center: 108, success: 210 };

  return (
    <div className="mt-auto flex flex-1 items-center justify-center">
      <div
        className="relative flex items-center justify-center"
        style={{ width: ringSizes.outer, height: ringSizes.outer }}
      >
        <div
          className="ultima-preview-step-ring absolute rounded-full border"
          style={{
            width: ringSizes.outer,
            height: ringSizes.outer,
            borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 22%, transparent)',
          }}
        />
        <div
          className="ultima-preview-step-ring ultima-step-ring-delay-1 absolute rounded-full border"
          style={{
            width: ringSizes.middle,
            height: ringSizes.middle,
            borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 18%, transparent)',
          }}
        />
        <div
          className="ultima-preview-step-ring ultima-step-ring-delay-2 absolute rounded-full border"
          style={{
            width: ringSizes.inner,
            height: ringSizes.inner,
            borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 48%, transparent)',
          }}
        />
        <div
          className="ultima-preview-success-wave absolute rounded-full border"
          style={{
            width: ringSizes.success,
            height: ringSizes.success,
            borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 38%, transparent)',
            animationIterationCount: 'infinite',
            animationDelay: '0.35s',
          }}
        />
        <div
          className="relative z-10 flex flex-col items-center justify-center rounded-full border text-center"
          style={{
            width: ringSizes.center,
            height: ringSizes.center,
            borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 28%, transparent)',
            background:
              'radial-gradient(circle at 30% 28%, color-mix(in srgb, var(--ultima-color-primary) 34%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 84%, #071012) 66%)',
            boxShadow:
              '0 24px 48px color-mix(in srgb, var(--ultima-color-aura) 18%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <div className={cn('font-semibold text-white/95', compact ? 'text-xs' : 'text-sm')}>
            Step 2
          </div>
          <div className={cn('text-white/66 mt-1', compact ? 'text-[10px]' : 'text-xs')}>
            Add config
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileScene({ compact }: { compact: boolean }) {
  return (
    <div className="mt-auto space-y-3">
      <div
        className={cn('rounded-[24px] border', compact ? 'p-3' : 'p-4')}
        style={{
          borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 22%, transparent)',
          background:
            'linear-gradient(145deg, color-mix(in srgb, var(--ultima-color-surface) 56%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 62%, transparent))',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 36px color-mix(in srgb, var(--ultima-color-aura) 10%, transparent)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn('shrink-0 rounded-full border', compact ? 'h-10 w-10' : 'h-12 w-12')}
            style={{
              borderColor:
                'color-mix(in srgb, var(--ultima-color-surface-border) 30%, transparent)',
              background:
                'radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--ultima-color-ring) 26%, transparent), color-mix(in srgb, var(--ultima-color-primary) 38%, transparent))',
            }}
          />
          <div className="min-w-0">
            <div
              className={cn(
                'truncate font-semibold text-white/95',
                compact ? 'text-sm' : 'text-base',
              )}
            >
              Ultima Profile
            </div>
            <div className="truncate text-xs text-white/60">ID 813729</div>
          </div>
          <div
            className="ml-auto rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: 'color-mix(in srgb, var(--ultima-color-primary) 22%, transparent)',
              color: 'color-mix(in srgb, var(--ultima-color-ring) 88%, #ffffff)',
            }}
          >
            Premium
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div
            className="rounded-2xl border px-3 py-2.5"
            style={{
              borderColor:
                'color-mix(in srgb, var(--ultima-color-surface-border) 18%, transparent)',
              background: 'color-mix(in srgb, var(--ultima-color-surface) 28%, transparent)',
            }}
          >
            <div className="text-white/46 text-[11px] uppercase tracking-[0.18em]">Balance</div>
            <div className="text-white/94 mt-1 text-sm font-semibold">$24.90</div>
          </div>
          <div
            className="rounded-2xl border px-3 py-2.5"
            style={{
              borderColor:
                'color-mix(in srgb, var(--ultima-color-surface-border) 18%, transparent)',
              background: 'color-mix(in srgb, var(--ultima-color-surface) 28%, transparent)',
            }}
          >
            <div className="text-white/46 text-[11px] uppercase tracking-[0.18em]">Linked</div>
            <div className="text-white/94 mt-1 text-sm font-semibold">3 methods</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div
          className={cn(
            'rounded-full px-4 py-2 font-semibold',
            compact ? 'text-[11px]' : 'text-sm',
          )}
          style={{
            background: 'var(--ultima-color-primary)',
            color: 'var(--ultima-color-primary-text)',
          }}
        >
          Edit
        </div>
        <div
          className={cn(
            'rounded-full border px-4 py-2 font-medium',
            compact ? 'text-[11px]' : 'text-sm',
          )}
          style={{
            borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
            background: 'color-mix(in srgb, var(--ultima-color-secondary) 74%, transparent)',
            color: 'var(--ultima-color-secondary-text)',
          }}
        >
          Logout
        </div>
      </div>
    </div>
  );
}

export function UltimaThemeLivePreview({
  config,
  title = 'Ultima',
  subtitle = 'Live Preview',
  variant = 'full',
  scene = 'dashboard',
  className,
}: UltimaThemeLivePreviewProps) {
  const compact = variant === 'card';

  return (
    <div
      data-ultima-animation={config.animationPresetId}
      style={withVars(config)}
      className={cn(
        'ultima-preview-shell relative isolate overflow-hidden rounded-[28px] border',
        compact ? 'h-48' : 'h-[320px]',
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
            {SCENE_BADGES[scene]}
          </div>
        </div>

        {scene === 'connection' ? (
          <ConnectionScene compact={compact} />
        ) : scene === 'profile' ? (
          <ProfileScene compact={compact} />
        ) : (
          <DashboardScene compact={compact} />
        )}
      </div>
    </div>
  );
}
