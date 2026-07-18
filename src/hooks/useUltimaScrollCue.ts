import { useCallback, useEffect, useRef, useState } from 'react';

const SCROLL_REGION_SELECTOR = '.ultima-scrollbar';
const TRANSIENT_VISUAL_SELECTOR = '[data-ultima-transient-visual]';
// Ignore the reserved space beneath docked actions/navigation. It is not real hidden content.
const SCROLL_EPSILON_PX = 56;

type ScrollCueState = {
  isVisible: boolean;
  progress: number;
};

const INITIAL_STATE: ScrollCueState = {
  isVisible: false,
  progress: 0,
};

const isVisibleScrollableRegion = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 80 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    element.scrollHeight - element.clientHeight > SCROLL_EPSILON_PX
  );
};

export function useUltimaScrollCue(enabled: boolean, routeKey: string) {
  const scrollTargetRef = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<ScrollCueState>(INITIAL_STATE);

  const updateState = useCallback(() => {
    const target = scrollTargetRef.current;
    if (!target) {
      setState((current) => (current.isVisible ? INITIAL_STATE : current));
      return;
    }

    const maxScrollTop = Math.max(0, target.scrollHeight - target.clientHeight);
    const progress =
      maxScrollTop > 0 ? Math.min(100, (target.scrollTop / maxScrollTop) * 100) : 100;
    const isVisible = maxScrollTop > SCROLL_EPSILON_PX && target.scrollTop < maxScrollTop - 8;

    setState((current) => {
      if (current.isVisible === isVisible && Math.abs(current.progress - progress) < 0.5) {
        return current;
      }
      return { isVisible, progress };
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      scrollTargetRef.current = null;
      setState(INITIAL_STATE);
      return;
    }

    const root = document.querySelector<HTMLElement>('main.ultima-app-main');
    if (!root) return;

    let frameId: number | null = null;
    let targetResizeObserver: ResizeObserver | null = null;

    const detachTarget = () => {
      const target = scrollTargetRef.current;
      if (target) target.removeEventListener('scroll', updateState);
      targetResizeObserver?.disconnect();
      targetResizeObserver = null;
    };

    const attachTarget = (target: HTMLElement | null) => {
      if (scrollTargetRef.current === target) {
        updateState();
        return;
      }

      detachTarget();
      scrollTargetRef.current = target;

      if (!target) {
        setState(INITIAL_STATE);
        return;
      }

      target.addEventListener('scroll', updateState, { passive: true });
      targetResizeObserver = new ResizeObserver(updateState);
      targetResizeObserver.observe(target);
      if (target.firstElementChild instanceof HTMLElement) {
        targetResizeObserver.observe(target.firstElementChild);
      }
      updateState();
    };

    const evaluateRegions = () => {
      frameId = null;
      const regions = Array.from(root.querySelectorAll<HTMLElement>(SCROLL_REGION_SELECTOR))
        .filter(isVisibleScrollableRegion)
        .sort(
          (left, right) =>
            right.clientHeight * right.clientWidth - left.clientHeight * left.clientWidth,
        );
      attachTarget(regions[0] ?? null);
    };

    const scheduleEvaluation = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(evaluateRegions);
    };

    const mutationObserver = new MutationObserver((records) => {
      const hasPersistentContentChange = records.some(
        (record) =>
          !(record.target instanceof Element) || !record.target.closest(TRANSIENT_VISUAL_SELECTOR),
      );
      if (hasPersistentContentChange) scheduleEvaluation();
    });
    mutationObserver.observe(root, { childList: true, subtree: true });

    const rootResizeObserver = new ResizeObserver(scheduleEvaluation);
    rootResizeObserver.observe(root);
    window.addEventListener('resize', scheduleEvaluation, { passive: true });

    scheduleEvaluation();
    const delayedChecks = [120, 480, 1000].map((delay) =>
      window.setTimeout(scheduleEvaluation, delay),
    );

    return () => {
      delayedChecks.forEach(window.clearTimeout);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      mutationObserver.disconnect();
      rootResizeObserver.disconnect();
      window.removeEventListener('resize', scheduleEvaluation);
      detachTarget();
      scrollTargetRef.current = null;
    };
  }, [enabled, routeKey, updateState]);

  const scrollForward = useCallback(() => {
    const target = scrollTargetRef.current;
    if (!target) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollBy({
      top: Math.max(180, Math.min(420, target.clientHeight * 0.62)),
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, []);

  return {
    ...state,
    scrollForward,
  };
}
