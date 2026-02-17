import { ChevronLeftIcon, RefreshIcon } from './Icons';

interface TrafficUsageHeaderProps {
  title: string;
  subtitle: string;
  showBackButton: boolean;
  loading: boolean;
  onBack: () => void;
  onRefresh: () => void;
}

export function TrafficUsageHeader({
  title,
  subtitle,
  showBackButton,
  loading,
  onBack,
  onRefresh,
}: TrafficUsageHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-700 bg-dark-800 transition-colors hover:border-dark-600"
          >
            <ChevronLeftIcon />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-dark-100">{title}</h1>
          <p className="text-sm text-dark-400">{subtitle}</p>
        </div>
      </div>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="rounded-lg p-2 transition-colors hover:bg-dark-700 disabled:opacity-50"
      >
        <RefreshIcon className={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}
