import { useEffect, useRef } from 'react';
import { createNoise3D } from 'simplex-noise';
import { sanitizeColor, clampNumber } from './types';

interface Props {
  settings: Record<string, unknown>;
}

export default function VortexBackground({ settings }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const particleCount = clampNumber(settings.particleCount, 50, 2000, 500);
  const rangeY = clampNumber(settings.rangeY, 10, 500, 100);
  const baseHue = clampNumber(settings.baseHue, 0, 360, 220);
  const rangeSpeed = clampNumber(settings.rangeSpeed, 0.1, 5, 1.5);
  const backgroundColor = sanitizeColor(settings.backgroundColor, '#000000');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const noise3D = createNoise3D();
    const particlePropCount = 9;
    const particlePropsLength = particleCount * particlePropCount;
    let particleProps = new Float32Array(particlePropsLength);
    let tick = 0;
    let center: [number, number] = [0, 0];

    const rand = (n: number) => n * Math.random();
    const randRange = (n: number) => n - rand(2 * n);
    const TAU = 2 * Math.PI;
    const fadeInOut = (t: number, m: number) => {
      const hm = 0.5 * m;
      return Math.abs(((t + hm) % m) - hm) / hm;
    };
    const lerp = (n1: number, n2: number, speed: number) => (1 - speed) * n1 + speed * n2;

    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth ?? window.innerWidth;
      canvas.height = canvas.parentElement?.offsetHeight ?? window.innerHeight;
      center = [0.5 * canvas.width, 0.5 * canvas.height];
    };

    const initParticle = (i: number) => {
      const x = rand(canvas.width);
      const y = center[1] + randRange(rangeY);
      const life = 0;
      const ttl = 50 + rand(150);
      const speed = rand(rangeSpeed);
      const radius = 1 + rand(2);
      const hue = baseHue + rand(100);
      particleProps.set([x, y, 0, 0, life, ttl, speed, radius, hue], i);
    };

    const initParticles = () => {
      tick = 0;
      particleProps = new Float32Array(particlePropsLength);
      for (let i = 0; i < particlePropsLength; i += particlePropCount) {
        initParticle(i);
      }
    };

    const drawParticle = (
      x: number,
      y: number,
      x2: number,
      y2: number,
      life: number,
      ttl: number,
      radius: number,
      hue: number,
    ) => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = radius;
      ctx.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(life, ttl)})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
    };

    const draw = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particlePropsLength; i += particlePropCount) {
        const x = particleProps[i];
        const y = particleProps[i + 1];
        const n = noise3D(x * 0.00125, y * 0.00125, tick * 0.0005) * 3 * TAU;
        const vx = lerp(particleProps[i + 2], Math.cos(n), 0.5);
        const vy = lerp(particleProps[i + 3], Math.sin(n), 0.5);
        const life = particleProps[i + 4];
        const ttl = particleProps[i + 5];
        const speed = particleProps[i + 6];
        const x2 = x + vx * speed;
        const y2 = y + vy * speed;
        const radius = particleProps[i + 7];
        const hue = particleProps[i + 8];

        drawParticle(x, y, x2, y2, life, ttl, radius, hue);

        particleProps[i] = x2;
        particleProps[i + 1] = y2;
        particleProps[i + 2] = vx;
        particleProps[i + 3] = vy;
        particleProps[i + 4] = life + 1;

        if (x2 > canvas.width || x2 < 0 || y2 > canvas.height || y2 < 0 || life + 1 > ttl) {
          initParticle(i);
        }
      }

      // Glow effect
      ctx.save();
      ctx.filter = 'blur(8px) brightness(200%)';
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();

      animationRef.current = requestAnimationFrame(draw);
    };

    resize();
    initParticles();
    animationRef.current = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [particleCount, rangeY, baseHue, rangeSpeed, backgroundColor]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
