import type { RouteConfig } from './types';
import Login from '../Login';
import TelegramCallback from '../TelegramCallback';
import TelegramRedirect from '../TelegramRedirect';
import DeepLinkRedirect from '../DeepLinkRedirect';
import OAuthCallback from '../OAuthCallback';
import VerifyEmail from '../VerifyEmail';
import ResetPassword from '../ResetPassword';

export const publicRoutes: RouteConfig[] = [
  { path: '/login', element: <Login /> },
  { path: '/auth/telegram/callback', element: <TelegramCallback /> },
  { path: '/auth/telegram', element: <TelegramRedirect /> },
  { path: '/tg', element: <TelegramRedirect /> },
  { path: '/connect', element: <DeepLinkRedirect /> },
  { path: '/add', element: <DeepLinkRedirect /> },
  { path: '/auth/oauth/callback', element: <OAuthCallback /> },
  { path: '/verify-email', element: <VerifyEmail /> },
  { path: '/reset-password', element: <ResetPassword /> },
];
