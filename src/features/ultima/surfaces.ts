import { type CSSProperties } from 'react';

export const ultimaCardClassName =
  'rounded-[30px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_22px_48px_rgba(3,14,24,0.24)] backdrop-blur-xl';

export const ultimaPanelClassName =
  'rounded-3xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_22px_48px_rgba(3,14,24,0.24)] backdrop-blur-xl';

export const ultimaPaneClassName =
  'rounded-[22px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_16px_36px_rgba(3,14,24,0.18)] backdrop-blur-xl';

export const ultimaSurfaceStyle: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 22%, transparent)',
  background:
    'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-surface) 30%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 66%, transparent))',
};

export const ultimaAccentSurfaceStyle: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 32%, transparent)',
  background:
    'linear-gradient(145deg, color-mix(in srgb, var(--ultima-color-aura) 22%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 72%, transparent))',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.08), 0 28px 56px color-mix(in srgb, var(--ultima-color-aura) 12%, transparent)',
};

export const ultimaPaneSurfaceStyle: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 20%, transparent)',
  background:
    'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-secondary) 72%, transparent) 0%, color-mix(in srgb, var(--ultima-color-surface) 44%, transparent) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 16px 36px rgba(3,14,24,0.18)',
};
