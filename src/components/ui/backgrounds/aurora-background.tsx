import { cn } from '@/lib/utils';

interface Props {
  settings: Record<string, unknown>;
}

export default function AuroraBackground({ settings }: Props) {
  const showRadialGradient = (settings.showRadialGradient as boolean) ?? true;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className={cn(
          'pointer-events-none absolute -inset-[10px] animate-aurora opacity-50 blur-[10px] will-change-transform',
          showRadialGradient &&
            '[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]',
        )}
        style={{
          backgroundImage:
            'repeating-linear-gradient(100deg, #000 0%, #000 7%, transparent 10%, transparent 12%, #000 16%), repeating-linear-gradient(100deg, #3b82f6 10%, #a5b4fc 15%, #93c5fd 20%, #ddd6fe 25%, #60a5fa 30%)',
          backgroundSize: '300%, 200%',
        }}
      />
    </div>
  );
}
