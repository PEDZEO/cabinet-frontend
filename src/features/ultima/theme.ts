import { type CSSProperties, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { brandingApi, getCachedUltimaThemeConfig, type UltimaThemeConfig } from '@/api/branding';
import { getDefaultUltimaThemeWithPresets } from './presets';

function normalizeUltimaThemeConfig(config: UltimaThemeConfig): UltimaThemeConfig {
  return {
    ...getDefaultUltimaThemeWithPresets(),
    ...config,
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
