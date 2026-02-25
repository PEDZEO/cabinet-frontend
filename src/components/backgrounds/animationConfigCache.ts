import type { AnimationConfig } from '@/components/ui/backgrounds/types';

const ANIMATION_CACHE_KEY = 'cabinet_animation_config';

export function getCachedAnimationConfig(): AnimationConfig | null {
  try {
    const cached = localStorage.getItem(ANIMATION_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export function setCachedAnimationConfig(config: AnimationConfig): void {
  try {
    localStorage.setItem(ANIMATION_CACHE_KEY, JSON.stringify(config));
  } catch {
    // localStorage not available
  }
}
