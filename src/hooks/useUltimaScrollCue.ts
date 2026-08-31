import { useCallback, useEffect, useRef, useState } from 'react';

const SCROLL_REGION_SELECTOR = '.ultima-scrollbar';
const TRANSIENT_VISUAL_SELECTOR = '[data-ultima-transient-visual]';
// Ignore the reserved space beneath docked actions/navigation. It is not real hidden content.
const SCROLL_EPSILON_PX = 56;

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
  const cueElementRef = useRef<HTMLButtonElement | null>(null);
  const progressRef = useRef(0);
  const scrollFrameRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const paintProgress = useCallback((progress: number) => {
    progressRef.current = progress;
    cueElementRef.current?.style.setProperty('--ultima-scroll-progress', `${progress}%`);
  }, []);

  const updateState = useCallback(() => {
    const target = scrollTargetRef.current;
    if (!target) {
      paintProgress(0);
      setIsVisible(false);
      return;
    }

    const maxScrollTop = Math.max(0, target.scrollHeight - target.clientHeight);
    const progress =
      maxScrollTop > 0 ? Math.min(100, (target.scrollTop / maxScrollTop) * 100) : 100;
    const nextIsVisible = maxScrollTop > SCROLL_EPSILON_PX && target.scrollTop < maxScrollTop - 8;

    paintProgress(progress);
    setIsVisible((current) => (current === nextIsVisible ? current : nextIsVisible));
  }, [paintProgress]);

  const scheduleScrollUpdate = useCallback(() => {
    if (scrollFrameRef.current !== null) return;

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      updateState();
    });
  }, [updateState]);

  const cueRef = useCallback((element: HTMLButtonElement | null) => {
    cueElementRef.current = element;
    element?.style.setProperty('--ultima-scroll-progress', `${progressRef.current}%`);
  }, []);

  useEffect(() => {
    if (!enabled) {
      scrollTargetRef.current = null;
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
      paintProgress(0);
      setIsVisible(false);
      return;
    }

    const root = document.querySelector<HTMLElement>('main.ultima-app-main');
    if (!root) {
      paintProgress(0);
      setIsVisible(false);
      return;
    }

    let frameId: number | null = null;
    let targetResizeObserver: ResizeObserver | null = null;

    const detachTarget = () => {
      const target = scrollTargetRef.current;
      if (target) target.removeEventListener('scroll', scheduleScrollUpdate);
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
        paintProgress(0);
        setIsVisible(false);
        return;
      }

      target.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
      targetResizeObserver = new ResizeObserver(scheduleScrollUpdate);
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
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
      mutationObserver.disconnect();
      rootResizeObserver.disconnect();
      window.removeEventListener('resize', scheduleEvaluation);
      detachTarget();
      scrollTargetRef.current = null;
    };
  }, [enabled, paintProgress, routeKey, scheduleScrollUpdate, updateState]);

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
    isVisible,
    cueRef,
    scrollForward,
  };
}
