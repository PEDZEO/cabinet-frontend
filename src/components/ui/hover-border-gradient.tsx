'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Direction = 'TOP' | 'LEFT' | 'BOTTOM' | 'RIGHT';

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = 'button',
  duration = 1,
  clockwise = true,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
    duration?: number;
    clockwise?: boolean;
  } & React.HTMLAttributes<HTMLElement>
>) {
  const [hovered, setHovered] = useState<boolean>(false);
  const [direction, setDirection] = useState<Direction>('TOP');

  const rotateDirection = (currentDirection: Direction): Direction => {
    const directions: Direction[] = ['TOP', 'LEFT', 'BOTTOM', 'RIGHT'];
    const currentIndex = directions.indexOf(currentDirection);
    const nextIndex = clockwise
      ? (currentIndex - 1 + directions.length) % directions.length
      : (currentIndex + 1) % directions.length;
    return directions[nextIndex];
  };

  // Bright accent-colored moving gradient spot
  const movingMap: Record<Direction, string> = {
    TOP: 'radial-gradient(30% 60% at 50% 0%, rgb(var(--color-accent-400)) 0%, transparent 100%)',
    LEFT: 'radial-gradient(25% 55% at 0% 50%, rgb(var(--color-accent-400)) 0%, transparent 100%)',
    BOTTOM:
      'radial-gradient(30% 60% at 50% 100%, rgb(var(--color-accent-400)) 0%, transparent 100%)',
    RIGHT:
      'radial-gradient(25% 55% at 100% 50%, rgb(var(--color-accent-400)) 0%, transparent 100%)',
  };

  // On hover — full bright glow
  const highlight =
    'radial-gradient(80% 200% at 50% 50%, rgb(var(--color-accent-500)) 0%, rgb(var(--color-accent-300) / 0.3) 50%, transparent 100%)';

  useEffect(() => {
    if (!hovered) {
      const interval = setInterval(() => {
        setDirection((prevState) => rotateDirection(prevState));
      }, duration * 1000);
      return () => clearInterval(interval);
    }
  }, [hovered, duration]);

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative flex content-center items-center justify-center overflow-visible rounded-xl border-none p-[1.5px] transition duration-500',
        containerClassName,
      )}
      {...props}
    >
      <div
        className={cn(
          'z-10 w-auto rounded-[inherit] bg-dark-900 px-4 py-2.5 text-sm font-medium text-white',
          className,
        )}
      >
        {children}
      </div>
      <motion.div
        className="absolute inset-0 z-0 flex-none overflow-hidden rounded-[inherit]"
        style={{
          filter: 'blur(3px)',
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: hovered ? [movingMap[direction], highlight] : movingMap[direction],
        }}
        transition={{ ease: 'linear', duration: duration ?? 1 }}
      />
      <div className="absolute inset-[2px] z-[1] flex-none rounded-[10px] bg-dark-900" />
    </Tag>
  );
}
