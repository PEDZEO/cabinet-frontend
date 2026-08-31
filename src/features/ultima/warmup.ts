import type { QueryClient } from '@tanstack/react-query';

import { subscriptionApi } from '@/api/subscription';

type WarmupOptions = {
  language: string;
};

let warmupPromise: Promise<void> | null = null;

export function warmUltimaStartup(queryClient: QueryClient, options: WarmupOptions): Promise<void> {
  if (warmupPromise) {
    return warmupPromise;
  }

  // Keep startup warmup deliberately small. Every route also preloads its own
  // data on intent, so eagerly fetching the entire cabinet only delays first paint.
  void options.language;
  const tasks: Array<Promise<unknown>> = [
    import('@/pages/Subscription'),
    import('@/pages/UltimaSubscriptionInfo'),
    import('@/pages/Connection'),
    import('@/pages/UltimaDevices'),
    import('@/pages/AccountLinking'),
    import('@/pages/Referral'),
    import('@/pages/Support'),
    queryClient.prefetchQuery({
      queryKey: ['appConfig'],
      queryFn: subscriptionApi.getAppConfig,
      staleTime: 60_000,
    }),
  ];

  warmupPromise = Promise.allSettled(tasks).then(() => undefined);
  return warmupPromise;
}
