import { Suspense } from 'react';
import { Navigate, useLocation } from 'react-router';
import Layout from '../layout/Layout';
import PageLoader from '../common/PageLoader';
import { BlacklistedScreen, ChannelSubscriptionScreen, MaintenanceScreen } from '../blocking';
import { useAuthStore } from '../../store/auth';
import { useBlockingStore } from '../../store/blocking';
import { saveReturnUrl } from '../../utils/token';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader variant="dark" />;
  }

  if (!isAuthenticated) {
    saveReturnUrl();
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Layout>{children}</Layout>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader variant="light" />;
  }

  if (!isAuthenticated) {
    saveReturnUrl();
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
}

export function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader variant="dark" />}>{children}</Suspense>;
}

export function BlockingOverlay() {
  const { blockingType } = useBlockingStore();

  if (blockingType === 'maintenance') {
    return <MaintenanceScreen />;
  }

  if (blockingType === 'channel_subscription') {
    return <ChannelSubscriptionScreen />;
  }

  if (blockingType === 'blacklisted') {
    return <BlacklistedScreen />;
  }

  return null;
}
