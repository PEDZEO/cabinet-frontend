import { Link } from 'react-router';
import { useHapticFeedback } from '@/platform/hooks/useHaptic';

interface LiteActionButtonProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function LiteActionButton({
  to,
  label,
  icon,
  variant = 'secondary',
}: LiteActionButtonProps) {
  const haptic = useHapticFeedback();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40';
      case 'ghost':
        return 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50';
      default:
        return 'border border-dark-600 bg-dark-800/80 text-dark-100 hover:border-dark-500 hover:bg-dark-700/80';
    }
  };

  const handleClick = () => {
    haptic.buttonPress();
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={`flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-5 text-lg font-semibold transition-transform active:scale-[0.98] ${getVariantStyles()}`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
