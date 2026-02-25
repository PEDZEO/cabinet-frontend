import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from its current value to a new target.
 * Uses easeOutExpo easing matching the prototype.
 */
export function useAnimatedNumber(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const ref = useRef({ start: 0, startTime: 0, target: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    ref.current.start = value;
    ref.current.target = target;
    ref.current.startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - ref.current.startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = ref.current.start + (ref.current.target - ref.current.start) * ease;
      setValue(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}
