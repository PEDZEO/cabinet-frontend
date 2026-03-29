import type { QueryClient } from '@tanstack/react-query';
import { balanceApi } from '@/api/balance';
import { infoApi } from '@/api/info';
import { ticketsApi } from '@/api/tickets';
import { referralApi } from '@/api/referral';
import { brandingApi } from '@/api/branding';
import { partnerApi } from '@/api/partners';
import { authApi } from '@/api/auth';
import { withdrawalApi } from '@/api/withdrawals';
import { subscriptionApi } from '@/api/subscription';
import { ultimaAgreementApi } from '@/api/ultimaAgreement';

type WarmupOptions = {
  language: string;
};

export async function warmUltimaStartup(
  queryClient: QueryClient,
  { language }: WarmupOptions,
): Promise<void> {
  const tasks: Array<Promise<unknown>> = [
    import('@/pages/Balance'),
    import('@/pages/TopUpMethodSelect'),
    import('@/pages/UltimaTopUpMethodSelect'),
    import('@/pages/TopUpAmount'),
    import('@/pages/Referral'),
    import('@/pages/AccountLinking'),
    import('@/pages/Connection'),
    import('@/pages/Support'),
    import('@/pages/Profile'),
    import('@/pages/UltimaPromocode'),
    import('@/pages/UltimaSubscriptionInfo'),
    import('@/pages/Subscription'),
    import('@/pages/UltimaAgreement'),

    queryClient.prefetchQuery({
      queryKey: ['subscription'],
      queryFn: subscriptionApi.getSubscription,
      staleTime: 15000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['purchase-options'],
      queryFn: subscriptionApi.getPurchaseOptions,
      staleTime: 60000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['appConfig'],
      queryFn: () => subscriptionApi.getAppConfig(),
      staleTime: 15000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['device-price', 'ultima-max'],
      queryFn: () => subscriptionApi.getDevicePrice(1),
      staleTime: 60000,
    }),

    queryClient.prefetchQuery({
      queryKey: ['payment-methods'],
      queryFn: balanceApi.getPaymentMethods,
      staleTime: 60000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['balance'],
      queryFn: balanceApi.getBalance,
      staleTime: 15000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['transactions', 1, 'ultima'],
      queryFn: () => balanceApi.getTransactions({ page: 1, per_page: 20 }),
      staleTime: 15000,
    }),

    queryClient.prefetchQuery({
      queryKey: ['referral-info'],
      queryFn: referralApi.getReferralInfo,
      staleTime: 15000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['referral-terms'],
      queryFn: referralApi.getReferralTerms,
      staleTime: 15000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['referral-list'],
      queryFn: () => referralApi.getReferralList({ per_page: 20 }),
      staleTime: 15000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['referral-earnings'],
      queryFn: () => referralApi.getReferralEarnings({ per_page: 20 }),
      staleTime: 15000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['branding'],
      queryFn: brandingApi.getBranding,
      staleTime: 60000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['ultima-theme-config'],
      queryFn: brandingApi.getUltimaThemeConfig,
      staleTime: 60000,
    }),

    queryClient.prefetchQuery({
      queryKey: ['linked-identities'],
      queryFn: authApi.getLinkedIdentities,
      staleTime: 15000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['latest-manual-merge-request'],
      queryFn: authApi.getLatestManualMergeRequest,
      staleTime: 15000,
    }),

    queryClient.prefetchQuery({
      queryKey: ['support-config'],
      queryFn: infoApi.getSupportConfig,
      staleTime: 60000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['tickets'],
      queryFn: () => ticketsApi.getTickets({ per_page: 20 }),
      staleTime: 15000,
    }),

    queryClient.prefetchQuery({
      queryKey: ['ultima-agreement', language],
      queryFn: () => ultimaAgreementApi.getAgreement(language || 'ru'),
      staleTime: 60000,
    }),
  ];

  await Promise.allSettled(tasks);

  const partnerStatus = await queryClient.fetchQuery({
    queryKey: ['partner-status'],
    queryFn: partnerApi.getStatus,
    staleTime: 30000,
  });
  if (partnerStatus?.partner_status === 'approved') {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: ['withdrawal-balance'],
        queryFn: withdrawalApi.getBalance,
        staleTime: 15000,
      }),
      queryClient.prefetchQuery({
        queryKey: ['withdrawal-history'],
        queryFn: withdrawalApi.getHistory,
        staleTime: 15000,
      }),
    ]);
  }
}
