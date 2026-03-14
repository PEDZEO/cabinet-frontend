/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react';
import { LazyPage, ProtectedRoute } from '../../components/routing/RouteShells';
import type { RouteConfig } from './types';
import Support from '../Support';
import Profile from '../Profile';
import TopUpMethodSelect from '../TopUpMethodSelect';
import TopUpAmount from '../TopUpAmount';
import Balance from '../Balance';
import Referral from '../Referral';
import AccountLinking from '../AccountLinking';
import Connection from '../Connection';
import { UltimaAgreement } from '../UltimaAgreement';
import { UltimaGift } from '../UltimaGift';
import { UltimaPromocode } from '../UltimaPromocode';

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
        <Balance />
      </ProtectedRoute>
    ),
  },
  {
    path: '/balance/top-up',
    element: (
      <ProtectedRoute>
        <TopUpMethodSelect />
      </ProtectedRoute>
    ),
  },
  {
    path: '/balance/top-up/:methodId',
    element: (
      <ProtectedRoute>
        <TopUpAmount />
      </ProtectedRoute>
    ),
  },
  {
    path: '/referral',
    element: (
      <ProtectedRoute>
        <Referral />
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
        <Support />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/account-linking',
    element: (
      <ProtectedRoute>
        <AccountLinking />
      </ProtectedRoute>
    ),
  },
  {
    path: '/promocode',
    element: (
      <ProtectedRoute>
        <UltimaPromocode />
      </ProtectedRoute>
    ),
  },
  {
    path: '/ultima/gift',
    element: (
      <ProtectedRoute>
        <UltimaGift />
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
        <UltimaAgreement />
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
        <Connection />
      </ProtectedRoute>
    ),
  },
];
