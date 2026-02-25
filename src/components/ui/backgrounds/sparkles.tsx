import { useEffect, useRef, useCallback } from 'react';
import { sanitizeColor, clampNumber } from './types';

interface Props {
  settings: Record<string, unknown>;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  opacityDirection: number;
  opacitySpeed: number;
}

export default function Sparkles({ settings }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  const particleDensity = clampNumber(settings.particleDensity, 50, 5000, 800);
  const minSize = clampNumber(settings.minSize, 0.1, 5, 0.4);
  const maxSize = clampNumber(settings.maxSize, 0.5, 10, 1.4);
  const speed = clampNumber(settings.speed, 0.1, 10, 2);
  const particleColor = sanitizeColor(settings.particleColor, '#FFFFFF');

  const hexToRgb = useCallback((hex: string) => {
    hex = hex.replace('#', '');
    if (hex.length === 3)
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth ?? window.innerWidth;
      canvas.height = canvas.parentElement?.offsetHeight ?? window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      const area = canvas.width * canvas.height;
      const count = Math.floor((area / 1000000) * particleDensity);
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: minSize + Math.random() * (maxSize - minSize),
        speedX: (Math.random() - 0.5) * speed * 0.2,
        speedY: (Math.random() - 0.5) * speed * 0.2,
        opacity: Math.random(),
        opacityDirection: Math.random() > 0.5 ? 1 : -1,
        opacitySpeed: 0.005 + Math.random() * 0.01 * speed,
      }));
    };

    const rgb = hexToRgb(particleColor);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += p.opacityDirection * p.opacitySpeed;

        if (p.opacity <= 0) {
          p.opacity = 0;
          p.opacityDirection = 1;
        } else if (p.opacity >= 1) {
          p.opacity = 1;
          p.opacityDirection = -1;
        }

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${p.opacity})`;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    animationRef.current = requestAnimationFrame(animate);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [particleDensity, minSize, maxSize, speed, particleColor, hexToRgb]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
