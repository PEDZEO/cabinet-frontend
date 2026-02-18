import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color: 'accent' | 'success' | 'warning' | 'error' | 'info';
}

export function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    accent: 'bg-accent-500/20 text-accent-400',
    success: 'bg-success-500/20 text-success-400',
    warning: 'bg-warning-500/20 text-warning-400',
    error: 'bg-error-500/20 text-error-400',
    info: 'bg-info-500/20 text-info-400',
  };

  return (
    <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-4 backdrop-blur transition-colors hover:border-dark-600">
      <div className="mb-2 flex items-start justify-between">
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>{icon}</div>
      </div>
      <div className="mb-1 text-2xl font-bold text-dark-100">{value}</div>
      <div className="text-sm text-dark-400">{title}</div>
      {subtitle && <div className="mt-1 text-xs text-dark-500">{subtitle}</div>}
    </div>
  );
}
