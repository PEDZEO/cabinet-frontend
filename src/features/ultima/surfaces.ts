import { type CSSProperties } from 'react';

export const ultimaCardClassName =
  'rounded-[24px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_54px_rgba(0,0,0,0.34)] backdrop-blur-xl';

export const ultimaPanelClassName =
  'rounded-[24px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_54px_rgba(0,0,0,0.34)] backdrop-blur-xl';

export const ultimaPaneClassName =
  'rounded-[18px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_34px_rgba(0,0,0,0.24)] backdrop-blur-xl';

export const ultimaSurfaceStyle: CSSProperties = {
  borderColor: 'var(--ultima-border-soft)',
  background: 'var(--ultima-bg-surface)',
};

export const ultimaAccentSurfaceStyle: CSSProperties = {
  borderColor: 'var(--ultima-border-medium)',
  background: 'var(--ultima-bg-accent-surface)',
  boxShadow: 'var(--ultima-shadow-accent)',
};

export const ultimaPaneSurfaceStyle: CSSProperties = {
  borderColor: 'var(--ultima-border-soft)',
  background: 'var(--ultima-bg-pane)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 14px 34px rgba(0,0,0,0.24)',
};
