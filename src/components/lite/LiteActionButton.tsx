import { Link } from 'react-router';
import { useHapticFeedback } from '@/platform/hooks/useHaptic';

interface LiteActionButtonProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'compact';
  className?: string;
}

export function LiteActionButton({
  to,
  label,
  icon,
  variant = 'secondary',
  size = 'default',
  className = '',
}: LiteActionButtonProps) {
  const haptic = useHapticFeedback();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'border border-accent-400/50 bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30 hover:border-accent-300/70 hover:shadow-accent-500/45';
      case 'ghost':
        return 'text-dark-300 hover:text-dark-100 hover:bg-dark-800/60';
      default:
        return 'border border-dark-600 bg-dark-800/85 text-dark-100 hover:border-dark-500 hover:bg-dark-700/85';
    }
  };

  const handleClick = () => {
    haptic.buttonPress();
  };

  const getSizeStyles = () => {
    if (size === 'compact') {
      return 'min-h-12 px-4 py-3 text-sm sm:px-5 sm:py-3.5 sm:text-base';
    }

    return 'min-h-14 px-4 py-4 text-base sm:px-6 sm:py-5 sm:text-lg';
  };

  const getIconSizeStyles = () => {
    if (size === 'compact') {
      return 'text-base sm:text-lg';
    }

    return 'text-lg sm:text-xl';
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={`flex w-full items-center justify-center gap-2.5 rounded-2xl font-semibold transition-[transform,colors,shadow,border-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900 active:scale-[0.98] sm:gap-3 ${getSizeStyles()} ${getVariantStyles()} ${className}`}
      aria-label={label}
    >
      <span className={getIconSizeStyles()}>{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
