import { type CSSProperties, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { brandingApi, getCachedUltimaThemeConfig, type UltimaThemeConfig } from '@/api/branding';
import { getDefaultUltimaThemeWithPresets } from './presets';

export function normalizeUltimaThemeConfig(config: UltimaThemeConfig): UltimaThemeConfig {
  return {
    ...getDefaultUltimaThemeWithPresets(),
    ...config,
  };
}

export function getUltimaThemeDerivedCssVarStyle(): CSSProperties {
  // Keep configured brand colours as inputs while using the approved quiet surfaces.
  return {
    ['--ultima-bg-page-desktop' as string]:
      'color-mix(in srgb, #0b1215 96%, var(--ultima-color-bg-top))',
    ['--ultima-bg-page-mobile' as string]:
      'color-mix(in srgb, #0b1215 96%, var(--ultima-color-bg-top))',
    ['--ultima-bg-page-overlay-desktop' as string]: 'none',
    ['--ultima-bg-page-overlay-mobile' as string]: 'none',
    ['--ultima-bg-page-scrim-desktop' as string]: 'none',
    ['--ultima-bg-page-scrim-mobile' as string]: 'none',
    ['--ultima-bg-shell' as string]:
      'color-mix(in srgb, #0b1215 96%, var(--ultima-color-bg-bottom))',
    ['--ultima-bg-surface' as string]:
      'color-mix(in srgb, #121e22 92%, var(--ultima-color-surface))',
    ['--ultima-bg-surface-soft' as string]:
      'color-mix(in srgb, #152428 92%, var(--ultima-color-surface))',
    ['--ultima-bg-surface-strong' as string]:
      'color-mix(in srgb, #192b2d 92%, var(--ultima-color-secondary))',
    ['--ultima-bg-accent-surface' as string]:
      'linear-gradient(120deg, color-mix(in srgb, #203b32 94%, var(--ultima-color-aura)), #14272a)',
    ['--ultima-bg-pane' as string]: 'color-mix(in srgb, #121e22 92%, var(--ultima-color-surface))',
    ['--ultima-border-soft' as string]: '#2a3a3e',
    ['--ultima-border-medium' as string]: '#3c6052',
    ['--ultima-text-strong' as string]: '#edf5f3',
    ['--ultima-text-muted' as string]: '#a6b9b7',
    ['--ultima-shadow-surface' as string]: 'none',
    ['--ultima-shadow-accent' as string]: 'none',
  };
}

export function getUltimaThemeCssVarStyle(config: UltimaThemeConfig): CSSProperties {
  const resolved = normalizeUltimaThemeConfig(config);

  return {
    ['--ultima-color-primary' as string]: resolved.primaryColor,
    ['--ultima-color-primary-text' as string]: resolved.primaryTextColor,
    ['--ultima-color-secondary' as string]: resolved.secondaryColor,
    ['--ultima-color-secondary-text' as string]: resolved.secondaryTextColor,
    ['--ultima-color-nav-bg' as string]: resolved.navBackgroundColor,
    ['--ultima-color-nav-active' as string]: resolved.navActiveColor,
    ['--ultima-color-nav-text' as string]: resolved.navTextColor,
    ['--ultima-color-bg-top' as string]: resolved.backgroundTopColor,
    ['--ultima-color-bg-bottom' as string]: resolved.backgroundBottomColor,
    ['--ultima-color-aura' as string]: resolved.auraColor,
    ['--ultima-color-ring' as string]: resolved.ringColor,
    ['--ultima-color-surface' as string]: resolved.surfaceColor,
    ['--ultima-color-surface-border' as string]: resolved.surfaceBorderColor,
    ['--ultima-color-scrollbar-thumb' as string]: resolved.scrollbarThumbColor,
    ['--ultima-color-scrollbar-track' as string]: resolved.scrollbarTrackColor,
    ['--ultima-animation-content-enter-ms' as string]: String(resolved.contentEnterMs),
    ['--ultima-animation-tap-ring-ms' as string]: String(resolved.tapRingMs),
    ['--ultima-animation-ring-wave-sec' as string]: String(resolved.ringWaveSec),
    ['--ultima-animation-slider-glow-sec' as string]: String(resolved.sliderGlowSec),
    ['--ultima-animation-step-ring-sec' as string]: String(resolved.stepRingSec),
    ['--ultima-animation-success-wave-ms' as string]: String(resolved.successWaveMs),
    ['--ultima-animation-item-enter-ms' as string]: String(resolved.itemEnterMs),
    ...getUltimaThemeDerivedCssVarStyle(),
  };
}

export function applyUltimaThemeConfig(config: UltimaThemeConfig) {
  const root = document.documentElement;
  const resolved = normalizeUltimaThemeConfig(config);
  const themeVars = getUltimaThemeCssVarStyle(resolved);

  for (const [key, value] of Object.entries(themeVars)) {
    root.style.setProperty(key, String(value));
  }
  root.dataset.ultimaAnimation = resolved.animationPresetId;
  root.classList.toggle('ultima-frames-enabled', resolved.framesEnabled === true);
}

export function useUltimaThemeConfig() {
  const cachedThemeConfig = getCachedUltimaThemeConfig() ?? getDefaultUltimaThemeWithPresets();
  const { data } = useQuery({
    queryKey: ['ultima-theme-config'],
    queryFn: brandingApi.getUltimaThemeConfig,
    initialData: cachedThemeConfig,
    placeholderData: (previousData) => previousData,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!data) return;
    applyUltimaThemeConfig(data);
  }, [data]);
}
