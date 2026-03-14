import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { brandingApi, DEFAULT_ULTIMA_THEME_CONFIG, type UltimaThemeConfig } from '@/api/branding';

export function applyUltimaThemeConfig(config: UltimaThemeConfig) {
  const root = document.documentElement;
  root.style.setProperty('--ultima-color-primary', config.primaryColor);
  root.style.setProperty('--ultima-color-primary-text', config.primaryTextColor);
  root.style.setProperty('--ultima-color-secondary', config.secondaryColor);
  root.style.setProperty('--ultima-color-secondary-text', config.secondaryTextColor);
  root.style.setProperty('--ultima-color-nav-bg', config.navBackgroundColor);
  root.style.setProperty('--ultima-color-nav-active', config.navActiveColor);
  root.style.setProperty('--ultima-color-nav-text', config.navTextColor);
  root.style.setProperty('--ultima-color-bg-top', config.backgroundTopColor);
  root.style.setProperty('--ultima-color-bg-bottom', config.backgroundBottomColor);
  root.style.setProperty('--ultima-color-aura', config.auraColor);
  root.style.setProperty('--ultima-color-ring', config.ringColor);
  root.style.setProperty('--ultima-color-surface', config.surfaceColor);
  root.style.setProperty('--ultima-color-surface-border', config.surfaceBorderColor);
  root.style.setProperty('--ultima-color-scrollbar-thumb', config.scrollbarThumbColor);
  root.style.setProperty('--ultima-color-scrollbar-track', config.scrollbarTrackColor);
  root.style.setProperty('--ultima-animation-content-enter-ms', String(config.contentEnterMs));
  root.style.setProperty('--ultima-animation-tap-ring-ms', String(config.tapRingMs));
  root.style.setProperty('--ultima-animation-ring-wave-sec', String(config.ringWaveSec));
  root.style.setProperty('--ultima-animation-slider-glow-sec', String(config.sliderGlowSec));
  root.style.setProperty('--ultima-animation-step-ring-sec', String(config.stepRingSec));
  root.style.setProperty('--ultima-animation-success-wave-ms', String(config.successWaveMs));
  root.style.setProperty('--ultima-animation-item-enter-ms', String(config.itemEnterMs));
  root.classList.toggle('ultima-frames-enabled', config.framesEnabled === true);
}

export function useUltimaThemeConfig() {
  const { data } = useQuery({
    queryKey: ['ultima-theme-config'],
    queryFn: brandingApi.getUltimaThemeConfig,
    staleTime: 60_000,
  });

  useEffect(() => {
    applyUltimaThemeConfig(data ?? DEFAULT_ULTIMA_THEME_CONFIG);
  }, [data]);
}
