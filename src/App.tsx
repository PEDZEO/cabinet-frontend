import { Navigate, Route, Routes } from 'react-router';
import { BlockingOverlay } from './components/routing/RouteShells';
import { useAnalyticsCounters } from './hooks/useAnalyticsCounters';
import { adminRoutes } from './pages/routes/adminRoutes';
import { protectedRoutes } from './pages/routes/protectedRoutes';
import { publicRoutes } from './pages/routes/publicRoutes';

function App() {
  useAnalyticsCounters();

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
