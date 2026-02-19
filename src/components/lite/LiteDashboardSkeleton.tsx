export function LiteDashboardSkeleton() {
  return (
    <div className="mx-auto flex max-w-md animate-pulse flex-col px-4 py-6">
      {/* Subscription card skeleton */}
      <div className="mb-6 rounded-2xl border border-dark-600 bg-dark-800/80 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-dark-600" />
            <div className="h-6 w-20 rounded-full bg-dark-600" />
            <div className="h-4 w-16 rounded bg-dark-600" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-dark-600" />
            <div className="h-4 w-14 rounded bg-dark-600" />
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between">
            <div className="h-3 w-24 rounded bg-dark-600" />
            <div className="h-3 w-16 rounded bg-dark-600" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-dark-600" />
        </div>
      </div>

      {/* Referral card skeleton */}
      <div className="mb-6 rounded-2xl border border-dark-600/50 bg-dark-800/50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-dark-600" />
          <div className="flex-1">
            <div className="mb-1 h-4 w-24 rounded bg-dark-600" />
            <div className="h-3 w-32 rounded bg-dark-600" />
          </div>
        </div>
        <div className="mb-3 h-8 w-full rounded-lg bg-dark-600" />
        <div className="flex gap-2">
          <div className="h-9 flex-1 rounded-lg bg-dark-600" />
          <div className="h-9 flex-1 rounded-lg bg-dark-600" />
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex flex-1 flex-col justify-center gap-3">
        <div className="h-3 w-16 rounded bg-dark-600/80" />
        <div className="h-[68px] w-full rounded-2xl bg-dark-700/80" />
        <div className="rounded-2xl border border-dark-600/70 bg-dark-900/35 p-2">
          <div className="flex flex-col gap-2">
            <div className="h-[52px] w-full rounded-2xl border border-dark-600 bg-dark-800/80" />
            <div className="h-[52px] w-full rounded-2xl border border-dark-600 bg-dark-800/80" />
          </div>
        </div>
        <div className="h-[52px] w-full rounded-2xl bg-dark-800/30" />
      </div>
    </div>
  );
}
