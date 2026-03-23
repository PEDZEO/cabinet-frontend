/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react';
import { LazyPage, ProtectedRoute } from '../../components/routing/RouteShells';
import type { RouteConfig } from './types';

const Dashboard = lazy(() => import('../Dashboard'));
const Subscription = lazy(() => import('../Subscription'));
const SubscriptionPurchase = lazy(() => import('../SubscriptionPurchase'));
const GiftSubscription = lazy(() => import('../GiftSubscription'));
const GiftResult = lazy(() => import('../GiftResult'));
const Contests = lazy(() => import('../Contests'));
const Polls = lazy(() => import('../Polls'));
const Info = lazy(() => import('../Info'));
const Wheel = lazy(() => import('../Wheel'));
const ConnectionQR = lazy(() => import('../ConnectionQR'));
const ReferralPartnerApply = lazy(() => import('../ReferralPartnerApply'));
const ReferralWithdrawalRequest = lazy(() => import('../ReferralWithdrawalRequest'));
const Support = lazy(() => import('../Support'));
const Profile = lazy(() => import('../Profile'));
const TopUpMethodSelect = lazy(() => import('../TopUpMethodSelect'));
const TopUpAmount = lazy(() => import('../TopUpAmount'));
const Balance = lazy(() => import('../Balance'));
const Referral = lazy(() => import('../Referral'));
const AccountLinking = lazy(() => import('../AccountLinking'));
const Connection = lazy(() => import('../Connection'));
const NewsArticle = lazy(() => import('../NewsArticle'));
const UltimaAgreement = lazy(async () => {
  const module = await import('../UltimaAgreement');
  return { default: module.UltimaAgreement };
});
const UltimaDevices = lazy(async () => {
  const module = await import('../UltimaDevices');
  return { default: module.UltimaDevices };
});
const UltimaGift = lazy(async () => {
  const module = await import('../UltimaGift');
  return { default: module.UltimaGift };
});
const UltimaPromocode = lazy(async () => {
  const module = await import('../UltimaPromocode');
  return { default: module.UltimaPromocode };
});
const UltimaSubscriptionInfo = lazy(async () => {
  const module = await import('../UltimaSubscriptionInfo');
  return { default: module.UltimaSubscriptionInfo };
});

export const protectedRoutes: RouteConfig[] = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <Dashboard />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/subscription',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <Subscription />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/subscription/purchase',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <SubscriptionPurchase />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/gift',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <GiftSubscription />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/gift/result',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <GiftResult />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/balance',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <Balance />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/balance/top-up',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <TopUpMethodSelect />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/balance/top-up/:methodId',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <TopUpAmount />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/referral',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <Referral />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/referral/partner/apply',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <ReferralPartnerApply />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/referral/withdrawal/request',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <ReferralWithdrawalRequest />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/support',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <Support />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <Profile />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/account-linking',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <AccountLinking />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/promocode',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <UltimaPromocode />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/ultima/gift',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <UltimaGift />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/ultima/devices',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <UltimaDevices />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/ultima/subscription-info',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <UltimaSubscriptionInfo />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/contests',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <Contests />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/polls',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <Polls />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/info',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <Info />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/ultima/agreement',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <UltimaAgreement />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/wheel',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <Wheel />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/connection/qr',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <ConnectionQR />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/connection',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <Connection />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/news/:slug',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <NewsArticle />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
];
