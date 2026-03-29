import type { QueryClient } from '@tanstack/react-query';
import { infoApi } from '@/api/info';
import { subscriptionApi } from '@/api/subscription';
import { ticketsApi } from '@/api/tickets';

export type UltimaBottomNavTab = 'home' | 'connection' | 'profile' | 'support';
export type UltimaTopLevelPath = '/' | '/connection' | '/profile' | '/support';

const ULTIMA_TAB_BY_PATH: Record<UltimaTopLevelPath, UltimaBottomNavTab> = {
  '/': 'home',
  '/connection': 'connection',
  '/profile': 'profile',
  '/support': 'support',
};

const ULTIMA_PATH_BY_TAB: Record<UltimaBottomNavTab, UltimaTopLevelPath> = {
  home: '/',
  connection: '/connection',
  profile: '/profile',
  support: '/support',
};

export const ULTIMA_TOP_LEVEL_PATHS = Object.keys(ULTIMA_TAB_BY_PATH) as UltimaTopLevelPath[];

export const isUltimaTopLevelPath = (pathname: string): pathname is UltimaTopLevelPath =>
  Object.prototype.hasOwnProperty.call(ULTIMA_TAB_BY_PATH, pathname);

export const getUltimaTopLevelTab = (pathname: string): UltimaBottomNavTab | null =>
  isUltimaTopLevelPath(pathname) ? ULTIMA_TAB_BY_PATH[pathname] : null;

export const getUltimaTopLevelPath = (tab: UltimaBottomNavTab): UltimaTopLevelPath =>
  ULTIMA_PATH_BY_TAB[tab];

export const prefetchUltimaTopLevelTab = (queryClient: QueryClient, tab: UltimaBottomNavTab) => {
  if (tab === 'home') {
    void import('@/pages/Dashboard');
    void queryClient.prefetchQuery({
      queryKey: ['subscription'],
      queryFn: subscriptionApi.getSubscription,
      staleTime: 15000,
    });
    return;
  }

  if (tab === 'connection') {
    void import('@/pages/Connection');
    void queryClient.prefetchQuery({
      queryKey: ['appConfig'],
      queryFn: () => subscriptionApi.getAppConfig(),
      staleTime: 15000,
    });
    return;
  }

  if (tab === 'profile') {
    void import('@/pages/Profile');
    void queryClient.prefetchQuery({
      queryKey: ['subscription'],
      queryFn: subscriptionApi.getSubscription,
      staleTime: 15000,
    });
    return;
  }

  void import('@/pages/Support');
  void queryClient.prefetchQuery({
    queryKey: ['support-config'],
    queryFn: infoApi.getSupportConfig,
    staleTime: 60000,
  });
  void queryClient.prefetchQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketsApi.getTickets({ per_page: 20 }),
    staleTime: 15000,
  });
};
