import { Link } from 'react-router';

interface LiteActionButtonProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function LiteActionButton({
  to,
  label,
  icon,
  variant = 'secondary',
}: LiteActionButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Link
      to={to}
      className={`flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-5 text-lg font-semibold transition-transform active:scale-[0.98] ${
        isPrimary
          ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40'
          : 'border border-dark-600 bg-dark-800/80 text-dark-100 hover:border-dark-500 hover:bg-dark-700/80'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
