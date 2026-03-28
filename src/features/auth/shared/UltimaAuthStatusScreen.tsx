import type { ReactNode } from 'react';
import { UltimaAuthBrandMark } from './UltimaAuthBrandMark';

type UltimaAuthStatusTone = 'loading' | 'success' | 'error' | 'warning';

interface UltimaAuthStatusScreenProps {
  appName: string;
  logoUrl: string | null;
  showBrandLogo: boolean;
  tone: UltimaAuthStatusTone;
  title: string;
  message: string;
  secondaryText?: string;
  action?: ReactNode;
}

function StatusIcon({ tone }: { tone: UltimaAuthStatusTone }) {
  if (tone === 'loading') {
    return (
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[color:var(--ultima-color-primary)] border-t-transparent" />
    );
  }

  const toneClasses =
    tone === 'success'
      ? 'bg-emerald-400/18 text-emerald-200'
      : tone === 'warning'
        ? 'bg-amber-400/18 text-amber-200'
        : 'bg-rose-400/18 text-rose-200';

  return (
    <div
      className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${toneClasses}`}
    >
      <svg
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        {tone === 'success' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        ) : tone === 'warning' ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM10.29 3.86l-7.5 13A1.5 1.5 0 0 0 4.09 19h15.82a1.5 1.5 0 0 0 1.3-2.14l-7.5-13a1.5 1.5 0 0 0-2.6 0Z"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        )}
      </svg>
    </div>
  );
}

export function UltimaAuthStatusScreen({
  appName,
  logoUrl,
  showBrandLogo,
  tone,
  title,
  message,
  secondaryText,
  action,
}: UltimaAuthStatusScreenProps) {
  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden px-4 py-8"
      style={{
        background:
          'linear-gradient(160deg, color-mix(in srgb, var(--ultima-color-bg-top) 28%, transparent) 0%, color-mix(in srgb, var(--ultima-color-bg-bottom) 40%, #000000) 100%)',
      }}
    >
      <div className="ultima-shell-aura" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col items-center justify-center">
        <div className="mb-5 text-center">
          <UltimaAuthBrandMark
            appName={appName}
            logoUrl={logoUrl}
            showBrandLogo={showBrandLogo}
            variant="card"
            className="mx-auto mb-3"
          />
          <h1 className="text-[28px] font-semibold leading-none tracking-[-0.01em] text-white">
            {appName}
          </h1>
        </div>

        <div
          className="w-full rounded-[28px] border p-5 text-center backdrop-blur-md"
          style={{
            borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
            background: 'color-mix(in srgb, var(--ultima-color-surface) 44%, transparent)',
          }}
        >
          <StatusIcon tone={tone} />
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-white/68 mt-2 text-sm leading-relaxed">{message}</p>
          {secondaryText ? <p className="text-white/48 mt-2 text-xs">{secondaryText}</p> : null}
          {action ? <div className="mt-5">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
