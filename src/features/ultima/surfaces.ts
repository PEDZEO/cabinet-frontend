import { type CSSProperties } from 'react';

export const ultimaCardClassName = 'ultima-card rounded-[20px] border p-5';

export const ultimaPanelClassName = 'ultima-panel rounded-[20px] border';

export const ultimaPaneClassName = 'ultima-pane rounded-[18px] border';

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
  boxShadow: 'none',
};
