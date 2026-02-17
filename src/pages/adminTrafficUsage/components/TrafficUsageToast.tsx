interface TrafficUsageToastProps {
  toast: { message: string; type: 'success' | 'error' } | null;
}

export function TrafficUsageToast({ toast }: TrafficUsageToastProps) {
  if (!toast) {
    return null;
  }

  return (
    <div
      className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl border px-4 py-2 text-sm shadow-lg ${
        toast.type === 'success'
          ? 'border-success-500/30 bg-success-500/20 text-success-400'
          : 'border-error-500/30 bg-error-500/20 text-error-400'
      }`}
    >
      {toast.message}
    </div>
  );
}
