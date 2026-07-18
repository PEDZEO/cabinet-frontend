import { Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type UltimaDeviceStepperProps = {
  value: number;
  canDecrease: boolean;
  canIncrease: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  testIdPrefix: string;
  variant?: 'compact' | 'desktop';
  className?: string;
};

export function UltimaDeviceStepper({
  value,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
  testIdPrefix,
  variant = 'compact',
  className,
}: UltimaDeviceStepperProps) {
  const { t } = useTranslation();
  const isDesktop = variant === 'desktop';

  return (
    <div
      data-testid={`${testIdPrefix}-device-stepper`}
      role="group"
      aria-label={t('lite.devicesTotal', { defaultValue: 'Устройства' })}
      className={cn(
        'grid shrink-0 overflow-hidden border border-white/[0.12] bg-black/20',
        isDesktop
          ? 'h-10 grid-cols-[40px_64px_40px] rounded-[8px]'
          : 'h-9 grid-cols-[34px_40px_34px] rounded-full',
        className,
      )}
    >
      <button
        type="button"
        data-testid={`${testIdPrefix}-devices-minus`}
        onClick={onDecrease}
        disabled={!canDecrease}
        aria-label={t('common.decrease', { defaultValue: 'Уменьшить' })}
        className="flex h-full items-center justify-center border-r border-white/[0.1] text-white/[0.76] transition-colors enabled:hover:bg-white/[0.08] enabled:active:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Minus className="h-4 w-4" strokeWidth={2.25} />
      </button>
      <span
        data-testid={`${testIdPrefix}-device-count`}
        className="flex h-full items-center justify-center text-[15px] font-semibold tabular-nums text-white"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        data-testid={`${testIdPrefix}-devices-plus`}
        onClick={onIncrease}
        disabled={!canIncrease}
        aria-label={t('common.increase', { defaultValue: 'Увеличить' })}
        className="flex h-full items-center justify-center border-l border-white/[0.1] text-white/[0.76] transition-colors enabled:hover:bg-white/[0.08] enabled:active:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Plus className="h-4 w-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}
