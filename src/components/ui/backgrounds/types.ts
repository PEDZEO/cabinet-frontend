export type BackgroundType =
  | 'aurora'
  | 'sparkles'
  | 'vortex'
  | 'shooting-stars'
  | 'background-beams'
  | 'background-beams-collision'
  | 'gradient-animation'
  | 'wavy'
  | 'background-lines'
  | 'boxes'
  | 'meteors'
  | 'grid'
  | 'dots'
  | 'spotlight'
  | 'ripple'
  | 'none';

export interface AnimationConfig {
  enabled: boolean;
  type: BackgroundType;
  settings: Record<string, unknown>;
  opacity: number;
  blur: number;
  reducedOnMobile: boolean;
}

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  enabled: true,
  type: 'aurora',
  settings: {},
  opacity: 1.0,
  blur: 0,
  reducedOnMobile: true,
};

/** Sanitize color values to prevent CSS injection. Allows hex, rgb/rgba, hsl/hsla, and named colors. */
export function sanitizeColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  // Allow hex colors
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
  // Allow rgb/rgba/hsl/hsla with numbers, commas, spaces, dots, %
  if (/^(rgb|hsl)a?\([0-9,.\s/%]+\)$/.test(trimmed)) return trimmed;
  // Allow CSS named colors (alphanumeric only)
  if (/^[a-zA-Z]{3,30}$/.test(trimmed)) return trimmed;
  return fallback;
}

/** Clamp a numeric value within bounds */
export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : fallback;
  return Math.max(min, Math.min(max, n));
}

export interface SettingDefinition {
  key: string;
  label: string;
  type: 'number' | 'color' | 'boolean' | 'select';
  min?: number;
  max?: number;
  step?: number;
  default: unknown;
  options?: { label: string; value: string }[];
}

export interface BackgroundDefinition {
  type: BackgroundType;
  labelKey: string;
  descriptionKey: string;
  category: 'css' | 'canvas' | 'svg';
  settings: SettingDefinition[];
}
