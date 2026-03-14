import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, Route, Routes } from 'react-router';
import { BlockingOverlay } from './components/routing/RouteShells';
import { useAnalyticsCounters } from './hooks/useAnalyticsCounters';
import { infoApi } from './api/info';
import { ticketsApi } from './api/tickets';
import { adminRoutes } from './pages/routes/adminRoutes';
import { protectedRoutes } from './pages/routes/protectedRoutes';
import { publicRoutes } from './pages/routes/publicRoutes';

function App() {
  useAnalyticsCounters();
  const queryClient = useQueryClient();

  useEffect(() => {
    const prefetch = () => {
      void import('./pages/Dashboard');
      void import('./pages/Subscription');
      void import('./pages/TopUpAmount');
      void import('./pages/TopUpMethodSelect');
      void import('./pages/Connection');
      void import('./pages/Balance');
      void import('./pages/Support');
    };

    // Start critical route prefetch immediately to avoid first navigation hitch in Ultima flow.
    prefetch();
    void queryClient.prefetchQuery({
      queryKey: ['support-config'],
      queryFn: infoApi.getSupportConfig,
    });
    void queryClient.prefetchQuery({
      queryKey: ['tickets'],
      queryFn: () => ticketsApi.getTickets({ per_page: 20 }),
    });

    const idle = window.requestIdleCallback?.(() => prefetch(), { timeout: 1800 });
    if (idle) {
      return () => window.cancelIdleCallback?.(idle);
    }
    const timeoutId = window.setTimeout(prefetch, 600);
    return () => window.clearTimeout(timeoutId);
  }, [queryClient]);

  useEffect(() => {
    let disposed = false;
    let checking = false;

    const currentBundlePath = () => {
      const script = document.querySelector<HTMLScriptElement>('script[src*="/assets/index-"]');
      if (!script) return null;
      try {
        return new URL(script.src, window.location.origin).pathname;
      } catch {
        return null;
      }
    };

    const extractBundlePath = (html: string) => {
      const match = html.match(/<script[^>]*src="([^"]*\/assets\/index-[^"]+\.js)"/i);
      if (!match?.[1]) return null;
      try {
        return new URL(match[1], window.location.origin).pathname;
      } catch {
        return null;
      }
    };

    const checkForNewBuild = async () => {
      if (disposed || checking) return;
      checking = true;
      try {
        const response = await fetch(`/index.html?build_check=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!response.ok) return;
        const html = await response.text();
        const latestBundlePath = extractBundlePath(html);
        const activeBundlePath = currentBundlePath();
        if (latestBundlePath && activeBundlePath && latestBundlePath !== activeBundlePath) {
          window.location.reload();
        }
      } catch {
        // ignore connectivity/cache probe errors
      } finally {
        checking = false;
      }
    };

    const onFocusRefresh = () => {
      if (document.visibilityState === 'hidden') return;
      void checkForNewBuild();
    };

    void checkForNewBuild();
    window.addEventListener('focus', onFocusRefresh);
    document.addEventListener('visibilitychange', onFocusRefresh);
    const intervalId = window.setInterval(() => {
      void checkForNewBuild();
    }, 60000);

    return () => {
      disposed = true;
      window.removeEventListener('focus', onFocusRefresh);
      document.removeEventListener('visibilitychange', onFocusRefresh);
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <>
      <BlockingOverlay />
      <Routes>
        {publicRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        {protectedRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        {adminRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
