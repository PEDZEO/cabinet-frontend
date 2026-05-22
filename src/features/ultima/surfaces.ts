import { type CSSProperties } from 'react';

export const ultimaCardClassName =
  'rounded-[24px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_54px_rgba(0,0,0,0.34)] backdrop-blur-xl';

export const ultimaPanelClassName =
  'rounded-[24px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_54px_rgba(0,0,0,0.34)] backdrop-blur-xl';

export const ultimaPaneClassName =
  'rounded-[18px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_34px_rgba(0,0,0,0.24)] backdrop-blur-xl';

export const ultimaSurfaceStyle: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 18%, transparent)',
  background:
    'linear-gradient(180deg, color-mix(in srgb, #0b1320 62%, var(--ultima-color-surface) 38%), color-mix(in srgb, #070d16 72%, var(--ultima-color-secondary) 28%))',
};

export const ultimaAccentSurfaceStyle: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
  background:
    'radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--ultima-color-ring) 16%, transparent), transparent 36%), linear-gradient(135deg, color-mix(in srgb, #0f2430 64%, var(--ultima-color-aura) 36%), color-mix(in srgb, #08111d 72%, var(--ultima-color-secondary) 28%))',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.10), 0 30px 70px color-mix(in srgb, var(--ultima-color-aura) 10%, rgba(0,0,0,0.42))',
};

export const ultimaPaneSurfaceStyle: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 16%, transparent)',
  background:
    'linear-gradient(180deg, color-mix(in srgb, #0b1320 68%, var(--ultima-color-secondary) 32%) 0%, color-mix(in srgb, #070d16 72%, var(--ultima-color-surface) 28%) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 14px 34px rgba(0,0,0,0.24)',
};
