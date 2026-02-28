import { useEffect, useRef } from 'react';
import { sanitizeColor, clampNumber } from './types';

interface Props {
  settings: Record<string, unknown>;
}

export default function BackgroundRipple({ settings }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const rippleColor = sanitizeColor(settings.rippleColor, '#818cf8');
  const rippleCount = clampNumber(settings.rippleCount, 1, 20, 5);
  const speed = clampNumber(settings.speed, 0.1, 5, 0.5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth ?? window.innerWidth;
      canvas.height = canvas.parentElement?.offsetHeight ?? window.innerHeight;
    };

    const ripples = Array.from({ length: rippleCount }, (_, i) => ({
      phase: (i / rippleCount) * Math.PI * 2,
      maxRadius: 0,
    }));

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxR = Math.sqrt(cx * cx + cy * cy);

      for (let i = 0; i < ripples.length; i++) {
        const t = ((time * speed) / 1000 + ripples[i].phase) % (Math.PI * 2);
        const progress = t / (Math.PI * 2);
        const radius = progress * maxR;
        const opacity = 0.3 * (1 - progress);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = rippleColor;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    animationRef.current = requestAnimationFrame(animate);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [rippleColor, rippleCount, speed]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
