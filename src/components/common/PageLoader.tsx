interface PageLoaderProps {
  variant?: 'dark' | 'light' | 'ultima';
}

export default function PageLoader({ variant = 'dark' }: PageLoaderProps) {
  if (variant === 'ultima') {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_72%_56%,rgba(16,185,129,0.34),rgba(4,17,26,0.98)_58%)]">
        {[0, 1.2, 2.4].map((delay) => (
          <div
            key={delay}
            className="ultima-ring-wave absolute left-1/2 top-[42%] h-[120vmax] w-[120vmax] -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{
              animationDelay: `-${delay}s`,
            }}
          />
        ))}
        <div className="relative z-10 h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-300 border-t-transparent" />
      </div>
    );
  }

  const spinnerColor = variant === 'dark' ? 'border-accent-500' : 'border-blue-500';
  const bgClass =
    variant === 'dark'
      ? 'bg-gradient-to-b from-dark-950 via-dark-950 to-dark-900'
      : 'bg-gradient-to-b from-white via-slate-50 to-slate-100';

  return (
    <div className={`flex min-h-screen items-center justify-center ${bgClass}`}>
      <div
        className={`h-10 w-10 border-[3px] ${spinnerColor} animate-spin rounded-full border-t-transparent`}
      />
    </div>
  );
}
