import type { CSSProperties, ReactNode } from 'react';
import type { UltimaThemeConfig } from '@/api/branding';
import { getUltimaThemeCssVarStyle } from '@/features/ultima/theme';
import { cn } from '@/lib/utils';

export type UltimaThemePreviewScene = 'dashboard' | 'connection' | 'profile';
export type UltimaThemePreviewDevice = 'mobile' | 'desktop';

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
  device?: UltimaThemePreviewDevice;
  className?: string;
};

function withVars(config: UltimaThemeConfig): CSSProperties {
  return getUltimaThemeCssVarStyle(config);
}

function PreviewIcon({ active }: { active?: boolean }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
      style={{
        borderColor: active
          ? 'color-mix(in srgb, var(--ultima-color-ring) 42%, transparent)'
          : 'var(--ultima-border-soft)',
        background: active
          ? 'color-mix(in srgb, var(--ultima-color-primary) 24%, transparent)'
          : 'color-mix(in srgb, var(--ultima-color-surface) 34%, transparent)',
        color: active
          ? 'color-mix(in srgb, var(--ultima-color-ring) 92%, #ffffff)'
          : 'var(--ultima-color-nav-text)',
      }}
    >
      <span className="h-3 w-3 rounded-[5px] border-2 border-current" />
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="min-w-0 rounded-2xl border px-3 py-2.5"
      style={{
        borderColor: 'var(--ultima-border-soft)',
        background: 'var(--ultima-bg-surface-soft)',
      }}
    >
      <div className="truncate text-[10px] font-medium uppercase tracking-wide text-white/[0.46]">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold text-white/95">{value}</div>
    </div>
  );
}

function PreviewButton({ children, primary }: { children: ReactNode; primary?: boolean }) {
  return (
    <div
      className={cn(
        'flex min-h-10 items-center justify-center rounded-full px-4 text-center text-sm font-semibold',
        !primary && 'border font-medium',
      )}
      style={
        primary
          ? {
              background: 'var(--ultima-color-primary)',
              color: 'var(--ultima-color-primary-text)',
              boxShadow:
                '0 14px 28px color-mix(in srgb, var(--ultima-color-aura) 22%, transparent)',
            }
          : {
              borderColor: 'var(--ultima-border-medium)',
              background: 'color-mix(in srgb, var(--ultima-color-secondary) 70%, transparent)',
              color: 'var(--ultima-color-secondary-text)',
            }
      }
    >
      {children}
    </div>
  );
}

function DashboardScene({ device }: { device: UltimaThemePreviewDevice }) {
  const isDesktop = device === 'desktop';

  return (
    <div className="relative flex flex-1 flex-col justify-end gap-3">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {[0, 1.5, 3].map((delay, index) => (
          <div
            key={delay}
            className="ultima-preview-ring-wave absolute left-1/2 top-[42%] rounded-full border"
            style={{
              width: `${48 + index * 18}%`,
              height: `${48 + index * 18}%`,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>

      <div
        className="relative rounded-[24px] border p-4"
        style={{
          borderColor: 'var(--ultima-border-medium)',
          background: 'var(--ultima-bg-surface-strong)',
          boxShadow: 'var(--ultima-shadow-surface)',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-white/[0.48]">
              Подписка
            </div>
            <div className={cn('font-semibold text-white/95', isDesktop ? 'text-lg' : 'text-base')}>
              до 6 августа
            </div>
            <div className="mt-1 text-xs text-white/[0.62]">Активна, 4 устройства</div>
          </div>
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border"
            style={{
              borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 36%, transparent)',
              background:
                'radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--ultima-color-ring) 26%, transparent), color-mix(in srgb, var(--ultima-color-primary) 34%, transparent) 42%, color-mix(in srgb, #020617 70%, var(--ultima-color-surface) 30%) 100%)',
              boxShadow: '0 0 34px color-mix(in srgb, var(--ultima-color-aura) 22%, transparent)',
            }}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-current text-[color:var(--ultima-color-ring)]" />
          </div>
        </div>

        {isDesktop ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <MetricCard label="Трафик" value="Безлимит" />
            <MetricCard label="Серверы" value="3" />
            <MetricCard label="Баланс" value="1 250 ₽" />
          </div>
        ) : null}
      </div>

      <div className={cn('grid gap-2', isDesktop ? 'grid-cols-2' : 'grid-cols-1')}>
        <PreviewButton primary>Оплатить подписку</PreviewButton>
        <PreviewButton>Установка и настройка</PreviewButton>
      </div>
    </div>
  );
}

function ConnectionScene({ device }: { device: UltimaThemePreviewDevice }) {
  const isDesktop = device === 'desktop';
  const ringSizes = isDesktop
    ? { outer: 180, middle: 132, inner: 92, center: 104, success: 206 }
    : { outer: 132, middle: 98, inner: 68, center: 78, success: 154 };

  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <div className="flex justify-center">
        <div
          className="relative flex items-center justify-center"
          style={{ width: ringSizes.outer, height: ringSizes.outer }}
        >
          <div
            className="ultima-preview-step-ring absolute rounded-full border"
            style={{ width: ringSizes.outer, height: ringSizes.outer }}
          />
          <div
            className="ultima-preview-step-ring ultima-step-ring-delay-1 absolute rounded-full border"
            style={{ width: ringSizes.middle, height: ringSizes.middle }}
          />
          <div
            className="ultima-preview-step-ring ultima-step-ring-delay-2 absolute rounded-full border"
            style={{ width: ringSizes.inner, height: ringSizes.inner }}
          />
          <div
            className="ultima-preview-success-wave absolute rounded-full border"
            style={{
              width: ringSizes.success,
              height: ringSizes.success,
              animationIterationCount: 'infinite',
              animationDelay: '0.35s',
            }}
          />
          <div
            className="relative z-10 flex flex-col items-center justify-center rounded-full border text-center"
            style={{
              width: ringSizes.center,
              height: ringSizes.center,
              borderColor: 'var(--ultima-border-medium)',
              background:
                'radial-gradient(circle at 30% 28%, color-mix(in srgb, var(--ultima-color-primary) 34%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 84%, #071012) 66%)',
              boxShadow:
                '0 24px 48px color-mix(in srgb, var(--ultima-color-aura) 18%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <div className="text-xs font-semibold text-white/95">Шаг 2</div>
            <div className="mt-1 text-[10px] text-white/[0.66]">Конфиг</div>
          </div>
        </div>
      </div>

      <div className={cn('grid gap-2', isDesktop ? 'grid-cols-3' : 'grid-cols-2')}>
        <MetricCard label="Прогресс" value="Готово" />
        <MetricCard label="Устройство" value="iPhone" />
        {isDesktop ? <MetricCard label="Протокол" value="VLESS" /> : null}
      </div>
    </div>
  );
}

function ProfileScene({ device }: { device: UltimaThemePreviewDevice }) {
  const isDesktop = device === 'desktop';

  return (
    <div className="flex flex-1 flex-col justify-end gap-3">
      <div
        className="rounded-[24px] border p-4"
        style={{
          borderColor: 'var(--ultima-border-medium)',
          background: 'var(--ultima-bg-surface-strong)',
          boxShadow: 'var(--ultima-shadow-surface)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 shrink-0 rounded-full border"
            style={{
              borderColor: 'color-mix(in srgb, var(--ultima-color-ring) 30%, transparent)',
              background:
                'radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--ultima-color-ring) 24%, transparent), color-mix(in srgb, var(--ultima-color-primary) 36%, transparent))',
            }}
          />
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-white/95">Ultimteam VPN</div>
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

        <div className={cn('mt-3 grid gap-2', isDesktop ? 'grid-cols-3' : 'grid-cols-2')}>
          <MetricCard label="Баланс" value="1 250 ₽" />
          <MetricCard label="Методы" value="3" />
          {isDesktop ? <MetricCard label="Сессии" value="2" /> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <PreviewButton primary>Профиль</PreviewButton>
        <PreviewButton>Выйти</PreviewButton>
      </div>
    </div>
  );
}

function BottomNav({ device }: { device: UltimaThemePreviewDevice }) {
  const isDesktop = device === 'desktop';
  const items = isDesktop
    ? ['Главная', 'VPN', 'Новости', 'Профиль', 'Поддержка']
    : ['Главная', 'VPN', 'Новости', 'Профиль', 'Чат'];

  return (
    <div
      className="mt-3 grid gap-2 rounded-[24px] border p-2"
      style={{
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 22%, transparent)',
        background: 'color-mix(in srgb, var(--ultima-color-nav-bg) 78%, transparent)',
        color: 'var(--ultima-color-nav-text)',
      }}
    >
      {items.map((item, index) => (
        <div
          key={item}
          className={cn(
            'flex min-h-10 items-center justify-center rounded-2xl text-center text-xs font-semibold',
            isDesktop && 'gap-2 px-2',
          )}
          style={
            index === 0
              ? {
                  background: 'var(--ultima-color-nav-active)',
                  color: 'var(--ultima-color-primary-text)',
                  boxShadow:
                    '0 12px 24px color-mix(in srgb, var(--ultima-color-nav-active) 20%, transparent)',
                }
              : undefined
          }
        >
          <PreviewIcon active={index === 0} />
          {isDesktop ? <span className="truncate">{item}</span> : null}
        </div>
      ))}
    </div>
  );
}

export function UltimaThemeLivePreview({
  config,
  title = 'Ultima',
  subtitle = 'живой предпросмотр',
  variant = 'full',
  scene = 'dashboard',
  device = 'mobile',
  className,
}: UltimaThemeLivePreviewProps) {
  const compact = variant === 'card';
  const isDesktop = device === 'desktop';
  const sceneNode =
    scene === 'connection' ? (
      <ConnectionScene device={device} />
    ) : scene === 'profile' ? (
      <ProfileScene device={device} />
    ) : (
      <DashboardScene device={device} />
    );

  return (
    <div
      data-ultima-animation={config.animationPresetId}
      style={withVars(config)}
      className={cn(
        'ultima-preview-shell relative isolate overflow-hidden rounded-[28px] border',
        compact ? 'h-[230px]' : isDesktop ? 'h-[360px]' : 'h-[470px]',
        isDesktop ? 'w-full' : 'mx-auto w-full max-w-[390px]',
        className,
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          borderColor: 'var(--ultima-border-medium)',
          background: isDesktop ? 'var(--ultima-bg-page-desktop)' : 'var(--ultima-bg-page-mobile)',
        }}
      />
      <div className="ultima-preview-aura absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDesktop
            ? 'var(--ultima-bg-page-scrim-desktop)'
            : 'var(--ultima-bg-page-scrim-mobile)',
        }}
      />

      <div className={cn('relative z-10 flex h-full flex-col', compact ? 'p-3.5' : 'p-5')}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[10px] font-medium uppercase tracking-[0.22em] text-white/[0.54]">
              {title}
            </div>
            <div
              className={cn(
                'truncate font-semibold text-white/[0.94]',
                compact ? 'text-sm' : 'text-lg',
              )}
            >
              {subtitle}
            </div>
          </div>
          <div
            className="shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
            style={{
              borderColor: 'var(--ultima-border-medium)',
              background: 'color-mix(in srgb, var(--ultima-color-surface) 36%, transparent)',
              color: 'color-mix(in srgb, var(--ultima-color-ring) 90%, #ffffff)',
            }}
          >
            {SCENE_BADGES[scene]}
          </div>
        </div>

        {sceneNode}
        {!compact ? <BottomNav device={device} /> : null}
      </div>
    </div>
  );
}
