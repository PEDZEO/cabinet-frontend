import { useEffect, useRef } from 'react';
import { createNoise3D } from 'simplex-noise';
import { sanitizeColor, clampNumber } from './types';

interface Props {
  settings: Record<string, unknown>;
}

export default function BackgroundLines({ settings }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const lineCount = clampNumber(settings.lineCount, 5, 100, 40);
  const lineColor = sanitizeColor(settings.lineColor, '#818cf8');
  const speed = clampNumber(settings.speed, 0.0005, 0.01, 0.002);
  const strokeWidth = clampNumber(settings.strokeWidth, 0.5, 5, 1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const noise3D = createNoise3D();
    let nt = 0;

    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth ?? window.innerWidth;
      canvas.height = canvas.parentElement?.offsetHeight ?? window.innerHeight;
    };

    const animate = () => {
      nt += speed;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < lineCount; i++) {
        const yBase = (i / lineCount) * canvas.height;
        const opacity = 0.1 + 0.15 * Math.sin((i / lineCount) * Math.PI);

        ctx.beginPath();
        ctx.strokeStyle = lineColor;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = strokeWidth;

        for (let x = 0; x < canvas.width; x += 4) {
          const y = yBase + noise3D(x / 600, i * 0.3, nt) * 40;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

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
  }, [lineCount, lineColor, speed, strokeWidth]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
