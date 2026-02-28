import { useEffect, useRef } from 'react';
import { sanitizeColor, clampNumber } from './types';

interface Props {
  settings: Record<string, unknown>;
}

interface Star {
  x: number;
  y: number;
  angle: number;
  scale: number;
  speed: number;
  distance: number;
  opacity: number;
}

interface BgStar {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkleSpeed: number | null;
}

export default function ShootingStarsBackground({ settings }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const starColor = sanitizeColor(settings.starColor, '#9E00FF');
  const trailColor = sanitizeColor(settings.trailColor, '#2EB9DF');
  const starDensity = clampNumber(settings.starDensity, 0.00001, 0.001, 0.00015);
  const minSpeed = clampNumber(settings.minSpeed, 1, 50, 10);
  const maxSpeed = clampNumber(settings.maxSpeed, 5, 100, 30);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let shootingStars: Star[] = [];
    let bgStars: BgStar[] = [];
    let lastShootingTime = 0;

    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth ?? window.innerWidth;
      canvas.height = canvas.parentElement?.offsetHeight ?? window.innerHeight;
      initBgStars();
    };

    const initBgStars = () => {
      const count = Math.floor(canvas.width * canvas.height * starDensity);
      bgStars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.2 + 0.3,
        opacity: Math.random(),
        twinkleSpeed: Math.random() > 0.3 ? 0.5 + Math.random() * 0.5 : null,
      }));
    };

    const spawnShootingStar = () => {
      shootingStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        scale: 0.5 + Math.random() * 0.5,
        speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
        distance: 0,
        opacity: 1,
      });
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background stars
      for (const s of bgStars) {
        let opacity = s.opacity;
        if (s.twinkleSpeed) {
          opacity = 0.5 + 0.5 * Math.sin((time / 1000) * s.twinkleSpeed * Math.PI * 2);
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        ctx.fill();
      }

      // Spawn shooting stars
      if (time - lastShootingTime > 4200 + Math.random() * 4500) {
        spawnShootingStar();
        lastShootingTime = time;
      }

      // Draw shooting stars
      shootingStars = shootingStars.filter((star) => {
        star.distance += star.speed;
        star.opacity = Math.max(0, 1 - star.distance / 500);

        if (star.opacity <= 0) return false;

        const x2 = star.x + Math.cos(star.angle) * star.distance;
        const y2 = star.y + Math.sin(star.angle) * star.distance;
        const tailX = star.x + Math.cos(star.angle) * Math.max(0, star.distance - 80);
        const tailY = star.y + Math.sin(star.angle) * Math.max(0, star.distance - 80);

        const gradient = ctx.createLinearGradient(tailX, tailY, x2, y2);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, trailColor);
        gradient.addColorStop(1, starColor);

        ctx.save();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = star.scale * 2;
        ctx.globalAlpha = star.opacity;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();

        return true;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    animationRef.current = requestAnimationFrame(animate);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [starColor, trailColor, starDensity, minSpeed, maxSpeed]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
