import { useEffect, useRef } from 'react';
import { createNoise3D } from 'simplex-noise';
import { sanitizeColor, clampNumber } from './types';

interface Props {
  settings: Record<string, unknown>;
}

export default function WavyBackground({ settings }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const speed = (settings.speed as string) ?? 'fast';
  const waveWidth = clampNumber(settings.waveWidth, 5, 200, 50);
  const blur = clampNumber(settings.blur, 0, 50, 10);
  const waveOpacity = clampNumber(settings.waveOpacity, 0.05, 1, 0.5);
  const backgroundFill = sanitizeColor(settings.backgroundFill, '#000000');
  const colors = ['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#22d3ee'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const noise3D = createNoise3D();
    let nt = 0;
    const speedVal = speed === 'slow' ? 0.001 : 0.002;
    const waveCount = 5;

    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth ?? window.innerWidth;
      canvas.height = canvas.parentElement?.offsetHeight ?? window.innerHeight;
      ctx.filter = `blur(${blur}px)`;
    };

    const drawWave = (_n: number) => {
      nt += speedVal;
      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();
        ctx.lineWidth = waveWidth;
        ctx.strokeStyle = colors[i % colors.length];
        ctx.globalAlpha = waveOpacity;

        for (let x = 0; x < canvas.width; x += 5) {
          const y = noise3D(x / 800, 0.3 * i, nt) * 100;
          ctx.lineTo(x, y + canvas.height * 0.5);
        }

        ctx.stroke();
        ctx.closePath();
      }
    };

    const animate = () => {
      ctx.globalAlpha = 1;
      ctx.fillStyle = backgroundFill;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawWave(5);
      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    animationRef.current = requestAnimationFrame(animate);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [speed, waveWidth, blur, waveOpacity, backgroundFill]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
