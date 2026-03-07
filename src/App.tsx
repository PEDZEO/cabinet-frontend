import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { BlockingOverlay } from './components/routing/RouteShells';
import { useAnalyticsCounters } from './hooks/useAnalyticsCounters';
import { adminRoutes } from './pages/routes/adminRoutes';
import { protectedRoutes } from './pages/routes/protectedRoutes';
import { publicRoutes } from './pages/routes/publicRoutes';

function App() {
  useAnalyticsCounters();

  useEffect(() => {
    const prefetch = () => {
      void import('./pages/Dashboard');
      void import('./pages/Subscription');
      void import('./pages/TopUpAmount');
      void import('./pages/TopUpMethodSelect');
      void import('./pages/Connection');
      void import('./pages/Balance');
    };

    // Start critical route prefetch immediately to avoid first navigation hitch in Ultima flow.
    prefetch();

    const idle = window.requestIdleCallback?.(() => prefetch(), { timeout: 1800 });
    if (idle) {
      return () => window.cancelIdleCallback?.(idle);
    }
    const timeoutId = window.setTimeout(prefetch, 600);
    return () => window.clearTimeout(timeoutId);
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
