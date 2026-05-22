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
  return {
    ['--ultima-bg-page-desktop' as string]:
      'radial-gradient(circle at 78% 12%, color-mix(in srgb, var(--ultima-color-aura) 16%, transparent), transparent 44%), radial-gradient(circle at 16% 86%, color-mix(in srgb, var(--ultima-color-ring) 9%, transparent), transparent 50%), linear-gradient(145deg, color-mix(in srgb, #020617 80%, var(--ultima-color-bg-top) 20%) 0%, color-mix(in srgb, #06101b 68%, var(--ultima-color-bg-bottom) 32%) 46%, color-mix(in srgb, #020617 84%, var(--ultima-color-secondary) 16%) 100%)',
    ['--ultima-bg-page-mobile' as string]:
      'radial-gradient(70% 42% at 50% 18%, color-mix(in srgb, var(--ultima-color-ring) 10%, transparent), transparent 66%), radial-gradient(92% 68% at 76% 62%, color-mix(in srgb, var(--ultima-color-aura) 26%, transparent), transparent 62%), linear-gradient(180deg, color-mix(in srgb, #020617 78%, var(--ultima-color-bg-top) 22%) 0%, color-mix(in srgb, var(--ultima-color-bg-top) 82%, #000000) 38%, color-mix(in srgb, #020617 72%, var(--ultima-color-bg-bottom) 28%) 100%)',
    ['--ultima-bg-page-overlay-desktop' as string]:
      'radial-gradient(circle at 34% 82%, color-mix(in srgb, var(--ultima-color-aura) 9%, transparent), transparent 54%), radial-gradient(circle at 86% 18%, color-mix(in srgb, var(--ultima-color-ring) 8%, transparent), transparent 50%)',
    ['--ultima-bg-page-overlay-mobile' as string]:
      'radial-gradient(82% 48% at 28% 80%, color-mix(in srgb, var(--ultima-color-aura) 18%, transparent), transparent 58%), radial-gradient(66% 38% at 84% 22%, color-mix(in srgb, var(--ultima-color-ring) 13%, transparent), transparent 56%)',
    ['--ultima-bg-page-scrim-desktop' as string]:
      'linear-gradient(160deg, rgba(2,6,23,0.72) 0%, rgba(2,8,18,0.50) 44%, rgba(2,6,23,0.86) 100%)',
    ['--ultima-bg-page-scrim-mobile' as string]:
      'linear-gradient(180deg, color-mix(in srgb, #020617 22%, transparent) 0%, color-mix(in srgb, var(--ultima-color-bg-top) 12%, transparent) 42%, color-mix(in srgb, #020617 46%, transparent) 100%)',
    ['--ultima-bg-shell' as string]:
      'linear-gradient(160deg, color-mix(in srgb, #030712 70%, var(--ultima-color-bg-top) 30%) 0%, color-mix(in srgb, #050b14 66%, var(--ultima-color-bg-bottom) 34%) 100%)',
    ['--ultima-bg-surface' as string]:
      'linear-gradient(180deg, color-mix(in srgb, #0b1320 54%, var(--ultima-color-surface) 46%) 0%, color-mix(in srgb, #070d16 58%, var(--ultima-color-secondary) 42%) 100%)',
    ['--ultima-bg-surface-soft' as string]:
      'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-surface) 42%, transparent) 0%, color-mix(in srgb, var(--ultima-color-secondary) 36%, transparent) 100%)',
    ['--ultima-bg-surface-strong' as string]:
      'linear-gradient(180deg, color-mix(in srgb, #0b1320 44%, var(--ultima-color-surface) 56%) 0%, color-mix(in srgb, #070d16 50%, var(--ultima-color-secondary) 50%) 100%)',
    ['--ultima-bg-accent-surface' as string]:
      'radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--ultima-color-ring) 15%, transparent), transparent 36%), linear-gradient(135deg, color-mix(in srgb, var(--ultima-color-aura) 32%, #0f2430) 0%, color-mix(in srgb, var(--ultima-color-secondary) 38%, #08111d) 100%)',
    ['--ultima-bg-pane' as string]:
      'linear-gradient(180deg, color-mix(in srgb, #0b1320 58%, var(--ultima-color-secondary) 42%) 0%, color-mix(in srgb, #070d16 62%, var(--ultima-color-surface) 38%) 100%)',
    ['--ultima-border-soft' as string]:
      'color-mix(in srgb, var(--ultima-color-surface-border) 18%, transparent)',
    ['--ultima-border-medium' as string]:
      'color-mix(in srgb, var(--ultima-color-surface-border) 26%, transparent)',
    ['--ultima-text-strong' as string]:
      'color-mix(in srgb, var(--ultima-color-secondary-text) 92%, #ffffff)',
    ['--ultima-text-muted' as string]:
      'color-mix(in srgb, var(--ultima-color-secondary-text) 56%, transparent)',
    ['--ultima-shadow-surface' as string]:
      'inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 54px rgba(0,0,0,0.34)',
    ['--ultima-shadow-accent' as string]:
      'inset 0 1px 0 rgba(255,255,255,0.10), 0 30px 70px color-mix(in srgb, var(--ultima-color-aura) 10%, rgba(0,0,0,0.42))',
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
