import type { ReactNode } from 'react';

interface AdminSectionCardProps {
  title?: ReactNode;
  titleClassName?: string;
  className?: string;
  children: ReactNode;
}

interface AdminInfoTileProps {
  label: ReactNode;
  value: ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

interface AdminMetricCardProps {
  value: ReactNode;
  label: ReactNode;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}

export function AdminSectionCard({
  title,
  titleClassName = 'mb-4 font-medium text-dark-200',
  className = '',
  children,
}: AdminSectionCardProps) {
  return (
    <div className={`rounded-xl border border-dark-700 bg-dark-800 p-4 ${className}`.trim()}>
      {title ? <h3 className={titleClassName}>{title}</h3> : null}
      {children}
    </div>
  );
}

export function AdminInfoTile({
  label,
  value,
  className = '',
  labelClassName = 'mb-1 text-sm text-dark-400',
  valueClassName = 'text-sm font-medium text-dark-200',
}: AdminInfoTileProps) {
  return (
    <div className={`rounded-lg bg-dark-700/50 p-3 ${className}`.trim()}>
      <div className={labelClassName}>{label}</div>
      <div className={valueClassName}>{value}</div>
    </div>
  );
}

export function AdminMetricCard({
  value,
  label,
  className = '',
  valueClassName = 'text-2xl font-bold text-dark-100',
  labelClassName = 'text-xs text-dark-500',
}: AdminMetricCardProps) {
  return (
    <div
      className={`rounded-xl border border-dark-700 bg-dark-800 p-4 text-center ${className}`.trim()}
    >
      <div className={valueClassName}>{value}</div>
      <div className={labelClassName}>{label}</div>
    </div>
  );
}
