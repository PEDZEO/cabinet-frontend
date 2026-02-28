/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react';
import { LazyPage, ProtectedRoute } from '../../components/routing/RouteShells';
import type { RouteConfig } from './types';

const Dashboard = lazy(() => import('../Dashboard'));
const Subscription = lazy(() => import('../Subscription'));
const Balance = lazy(() => import('../Balance'));
const Referral = lazy(() => import('../Referral'));
const Support = lazy(() => import('../Support'));
const Profile = lazy(() => import('../Profile'));
const AccountLinking = lazy(() => import('../AccountLinking'));
const Contests = lazy(() => import('../Contests'));
const Polls = lazy(() => import('../Polls'));
const Info = lazy(() => import('../Info'));
const Wheel = lazy(() => import('../Wheel'));
const Connection = lazy(() => import('../Connection'));
const TopUpMethodSelect = lazy(() => import('../TopUpMethodSelect'));
const TopUpAmount = lazy(() => import('../TopUpAmount'));
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
    path: '/connection',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <Connection />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
];
