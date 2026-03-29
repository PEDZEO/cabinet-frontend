import { expect, test, type Page, type Route } from '@playwright/test';

test.use({ locale: 'ru-RU' });

const DEFAULT_THEME_CONFIG = {
  primaryColor: '#1bd29f',
  primaryTextColor: '#ffffff',
  secondaryColor: '#0c2d2a',
  secondaryTextColor: '#f7fffc',
  navBackgroundColor: '#0f3a38',
  navActiveColor: '#1bd29f',
  navTextColor: '#d6f6ee',
  backgroundTopColor: '#031824',
  backgroundBottomColor: '#06232b',
  auraColor: '#21d09a',
  ringColor: '#b8ffec',
  surfaceColor: '#0c2d2a',
  surfaceBorderColor: '#92f4d8',
  scrollbarThumbColor: '#49e9b3',
  scrollbarTrackColor: '#0c262a',
  contentEnterMs: 320,
  tapRingMs: 780,
  ringWaveSec: 18,
  sliderGlowSec: 2.6,
  stepRingSec: 5.8,
  successWaveMs: 1050,
  itemEnterMs: 280,
  framesEnabled: false,
  homeUseBrandLogo: false,
};

const STATIC_USER = {
  id: 142,
  telegram_id: 12345,
  username: 'ultima_user',
  first_name: 'Ultima',
  last_name: 'User',
  email: 'ultima@example.com',
  email_verified: true,
  balance_kopeks: 0,
  balance_rubles: 0,
  referral_code: 'ULTIMA142',
  language: 'ru',
  created_at: '2026-01-01T00:00:00.000Z',
  auth_type: 'telegram',
};

const DEFAULT_THEME_COLORS = {
  accent: '#3b82f6',
  darkBackground: '#0a0f1a',
  darkSurface: '#0f172a',
  darkText: '#f1f5f9',
  darkTextSecondary: '#94a3b8',
  lightBackground: '#F7E7CE',
  lightSurface: '#FEF9F0',
  lightText: '#1F1A12',
  lightTextSecondary: '#7D6B48',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};

const LINKED_IDENTITIES = {
  identities: [
    {
      provider: 'telegram',
      provider_user_id_masked: 'tg***45',
      can_unlink: false,
      blocked_reason: 'telegram_required',
    },
  ],
  telegram_relink: {
    can_start_relink: false,
    requires_unlink_first: true,
    cooldown_until: null,
    retry_after_seconds: null,
  },
};

function createFakeJwt(): string {
  const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  const payload = 'eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6IjE0MiJ9';
  return `${header}.${payload}.signature`;
}

async function bootstrapUltimaAuth(page: Page): Promise<void> {
  const token = createFakeJwt();
  await page.addInitScript(
    ({ jwt, themeConfig }) => {
      sessionStorage.setItem('access_token', jwt);
      localStorage.setItem('refresh_token', jwt);
      localStorage.setItem('cabinet_ultima_mode', 'true');
      localStorage.setItem('cabinet_ultima_theme_config', JSON.stringify(themeConfig));
    },
    { jwt: token, themeConfig: DEFAULT_THEME_CONFIG },
  );
}

async function mockUltimaLinkingApi(page: Page): Promise<void> {
  await page.route('**/api/**', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!url.pathname.startsWith('/api/')) {
      await route.fallback();
      return;
    }

    const path = url.pathname.replace(/^\/api/, '');
    const method = request.method();

    if (path === '/cabinet/branding/ultima-mode' && method === 'GET') {
      await route.fulfill({ status: 200, json: { enabled: true } });
      return;
    }

    if (path === '/cabinet/branding/ultima-account-linking-mode' && method === 'GET') {
      await route.fulfill({ status: 200, json: { mode: 'provider_auth' } });
      return;
    }

    if (path === '/cabinet/branding/ultima-theme-config' && method === 'GET') {
      await route.fulfill({ status: 200, json: DEFAULT_THEME_CONFIG });
      return;
    }

    if (path === '/cabinet/branding' && method === 'GET') {
      await route.fulfill({
        status: 200,
        json: {
          name: 'UltimVPN',
          logo_url: null,
          logo_letter: 'U',
          has_custom_logo: false,
        },
      });
      return;
    }

    if (path === '/cabinet/branding/colors' && method === 'GET') {
      await route.fulfill({ status: 200, json: DEFAULT_THEME_COLORS });
      return;
    }

    if (path === '/cabinet/auth/me' && method === 'GET') {
      await route.fulfill({ status: 200, json: STATIC_USER });
      return;
    }

    if (path === '/cabinet/auth/me/is-admin' && method === 'GET') {
      await route.fulfill({ status: 200, json: { is_admin: false } });
      return;
    }

    if (path === '/cabinet/auth/identities' && method === 'GET') {
      await route.fulfill({ status: 200, json: LINKED_IDENTITIES });
      return;
    }

    if (path === '/cabinet/auth/oauth/providers' && method === 'GET') {
      await route.fulfill({
        status: 200,
        json: {
          providers: [
            { name: 'yandex', display_name: 'Yandex' },
            { name: 'vk', display_name: 'VK' },
          ],
        },
      });
      return;
    }

    if (path === '/cabinet/auth/link-code/manual-request/latest' && method === 'GET') {
      await route.fulfill({ status: 200, json: null });
      return;
    }

    if (path === '/cabinet/auth/link/result' && method === 'GET') {
      await route.fulfill({
        status: 200,
        json: {
          pending: false,
          status: null,
          provider: null,
          message: null,
          code: null,
          auth_response: null,
        },
      });
      return;
    }

    if (path === '/cabinet/info/support-config' && method === 'GET') {
      await route.fulfill({
        status: 200,
        json: {
          use_tickets: true,
          external_url: null,
          telegram_username: null,
          text: null,
        },
      });
      return;
    }

    if (path === '/cabinet/auth/link/oauth/server-complete' && method === 'POST') {
      await route.fulfill({
        status: 200,
        json: {
          status: 'success',
          provider: 'yandex',
          message: 'Identity linked successfully',
          code: 'identity_linked',
          switched_account: false,
        },
      });
      return;
    }

    await route.fulfill({ status: 200, json: {} });
  });
}

test.describe('Ultima account linking callback', () => {
  test('redirects browser callback back to account linking without crashing', async ({ page }) => {
    await bootstrapUltimaAuth(page);
    await mockUltimaLinkingApi(page);

    await page.goto('/auth/oauth/callback?code=test-code&state=server-flow-state');

    await page.waitForURL('**/account-linking');
    await expect(page.getByText('Сохранение доступа')).toBeVisible();
    await expect(page.getByText('Аккаунты связаны!')).toBeVisible();
    await expect(page.getByText(/Minified React error #185/)).toHaveCount(0);
  });

  test('shows localized telegram relink conflict after returning to account linking', async ({
    page,
  }) => {
    await bootstrapUltimaAuth(page);
    await mockUltimaLinkingApi(page);

    await page.addInitScript(() => {
      const payload = JSON.stringify({
        status: 'error',
        code: 'telegram_relink_requires_unlink',
        message: 'To link another Telegram account, unlink current Telegram first',
      });
      sessionStorage.setItem('cabinet_account_linking_outcome', payload);
      localStorage.setItem('cabinet_account_linking_outcome', payload);
    });

    await page.goto('/account-linking');

    await expect(
      page.getByText('Чтобы привязать другой Telegram, сначала отвяжите текущий Telegram-аккаунт.'),
    ).toBeVisible();
    await expect(
      page.getByText('To link another Telegram account, unlink current Telegram first'),
    ).toHaveCount(0);
  });
});
