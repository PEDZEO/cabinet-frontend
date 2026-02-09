export function LiteSubscriptionSkeleton() {
  return (
    <div className="mx-auto max-w-md animate-pulse px-4 py-6">
      {/* Balance display skeleton */}
      <div className="mb-6 flex items-center justify-between rounded-xl bg-dark-800/50 px-4 py-3">
        <div className="h-4 w-16 rounded bg-dark-600" />
        <div className="h-5 w-20 rounded bg-dark-600" />
      </div>

      {/* Tabs skeleton */}
      <div className="mb-6 flex gap-2">
        <div className="h-10 flex-1 rounded-xl bg-dark-700" />
        <div className="h-10 flex-1 rounded-xl bg-dark-800/50" />
        <div className="h-10 flex-1 rounded-xl bg-dark-800/50" />
      </div>

      {/* Tariff cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-dark-700 bg-dark-800/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="h-6 w-32 rounded bg-dark-600" />
              <div className="h-5 w-5 rounded bg-dark-600" />
            </div>
            <div className="mb-3 h-4 w-48 rounded bg-dark-600" />
            <div className="mb-3 flex gap-2">
              <div className="h-4 w-16 rounded bg-dark-600" />
              <div className="h-4 w-2 rounded bg-dark-600" />
              <div className="h-4 w-20 rounded bg-dark-600" />
              <div className="h-4 w-2 rounded bg-dark-600" />
              <div className="h-4 w-16 rounded bg-dark-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="h-7 w-24 rounded bg-dark-600" />
              <div className="h-4 w-16 rounded bg-dark-600" />
            </div>
          </div>
        ))}
      </div>

      {/* Top up button skeleton */}
      <div className="mt-6 h-12 w-full rounded-xl bg-dark-800/50" />

      {/* Promo code skeleton */}
      <div className="mt-4 flex gap-2">
        <div className="h-12 flex-1 rounded-xl bg-dark-800/50" />
        <div className="h-12 w-24 rounded-xl bg-dark-700" />
      </div>
    </div>
  );
}
