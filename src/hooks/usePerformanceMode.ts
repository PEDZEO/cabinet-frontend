import { useEffect, useState } from 'react';

export type PerformanceMode = 'full' | 'balanced' | 'efficient';

type NavigatorWithDeviceMemory = Navigator & {
  deviceMemory?: number;
};

const FULL_ANIMATION_BUDGET_MS = '320';
const BALANCED_ANIMATION_BUDGET_MS = '240';
const EFFICIENT_ANIMATION_BUDGET_MS = '180';

const getMediaMatch = (query: string) =>
  typeof window !== 'undefined' && 'matchMedia' in window
    ? window.matchMedia(query).matches
    : false;

export const detectPerformanceMode = (): PerformanceMode => {
  if (typeof window === 'undefined') {
    return 'balanced';
  }

  if (getMediaMatch('(prefers-reduced-motion: reduce)')) {
    return 'efficient';
  }

  const navigatorWithDeviceMemory = window.navigator as NavigatorWithDeviceMemory;
  const hardwareConcurrency = navigatorWithDeviceMemory.hardwareConcurrency ?? 4;
  const deviceMemory = navigatorWithDeviceMemory.deviceMemory ?? 4;
  const coarsePointer = getMediaMatch('(pointer: coarse)');
  const smallViewport = window.innerWidth < 1024;

  if (hardwareConcurrency <= 2 || deviceMemory <= 2) {
    return 'efficient';
  }

  if (coarsePointer || smallViewport || hardwareConcurrency <= 4 || deviceMemory <= 4) {
    return 'balanced';
  }

  return 'full';
};

const applyPerformanceDataset = (mode: PerformanceMode) => {
  const root = document.documentElement;
  root.dataset.performanceMode = mode;
  root.style.setProperty(
    '--app-animation-budget-ms',
    mode === 'full'
      ? FULL_ANIMATION_BUDGET_MS
      : mode === 'balanced'
        ? BALANCED_ANIMATION_BUDGET_MS
        : EFFICIENT_ANIMATION_BUDGET_MS,
  );
};

export function usePerformanceMode() {
  const [mode, setMode] = useState<PerformanceMode>(() => detectPerformanceMode());

  useEffect(() => {
    const updateMode = () => {
      const nextMode = detectPerformanceMode();
      setMode((currentMode) => (currentMode === nextMode ? currentMode : nextMode));
      applyPerformanceDataset(nextMode);
    };

    updateMode();

    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(pointer: coarse)'),
    ];

    mediaQueries.forEach((mediaQuery) => mediaQuery.addEventListener('change', updateMode));
    window.addEventListener('resize', updateMode, { passive: true });

    return () => {
      mediaQueries.forEach((mediaQuery) => mediaQuery.removeEventListener('change', updateMode));
      window.removeEventListener('resize', updateMode);
    };
  }, []);

  return {
    mode,
    isFullPerformance: mode === 'full',
    isBalancedPerformance: mode === 'balanced',
    isEfficientPerformance: mode === 'efficient',
  };
}
