import { expect, test, type Page } from '@playwright/test';

type Scenario =
  | 'no_subscription'
  | 'trial_available'
  | 'active_subscription'
  | 'expired_subscription';

const STATIC_USER = {
  id: 1,
  telegram_id: 10001,
  username: 'lite_smoke',
  first_name: 'Lite',
  last_name: 'Smoke',
  email: 'lite@example.com',
  email_verified: true,
  balance_kopeks: 0,
  balance_rubles: 0,
  referral_code: 'SMOKE123',
  language: 'ru',
  created_at: '2026-01-01T00:00:00.000Z',
  auth_type: 'telegram',
};

const LINKED_IDENTITIES = {
  identities: [],
  telegram_relink: {
    can_start_relink: true,
    requires_unlink_first: false,
    cooldown_until: null,
    retry_after_seconds: null,
  },
};

const PURCHASE_OPTIONS = {
  sales_mode: 'tariffs',
  tariffs: [],
  current_tariff_id: null,
};

const TRIAL_AVAILABLE_INFO = {
  is_available: true,
  duration_days: 3,
  traffic_limit_gb: 10,
  device_limit: 1,
  requires_payment: false,
  price_kopeks: 0,
  price_rubles: 0,
  reason_unavailable: null,
};

const TRIAL_UNAVAILABLE_INFO = {
  ...TRIAL_AVAILABLE_INFO,
  is_available: false,
  reason_unavailable: 'already_used',
};

const ACTIVE_SUBSCRIPTION = {
  id: 100,
  start_date: '2026-02-01T00:00:00.000Z',
  end_date: '2026-03-01T00:00:00.000Z',
  traffic_limit_gb: 100,
  traffic_used_gb: 20,
  traffic_used_percent: 20,
  device_limit: 3,
  connected_squads: [],
  servers: [],
  autopay_enabled: false,
  autopay_days_before: 1,
  subscription_url: 'https://example.com/sub',
  hide_subscription_link: false,
  is_active: true,
  is_expired: false,
  tariff_id: 1,
  tariff_name: 'Base',
};

const EXPIRED_SUBSCRIPTION = {
  ...ACTIVE_SUBSCRIPTION,
  end_date: '2026-02-01T00:00:00.000Z',
  is_active: false,
  is_expired: true,
};

function createFakeJwt(): string {
  const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  const payload = 'eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6IjEifQ';
  return `${header}.${payload}.signature`;
}

async function bootstrapAuthAndLiteMode(page: Page): Promise<void> {
  const token = createFakeJwt();
  await page.addInitScript(
    ({ jwt }) => {
      sessionStorage.setItem('access_token', jwt);
      localStorage.setItem('refresh_token', jwt);
      localStorage.setItem('cabinet_lite_mode', 'true');
    },
    { jwt: token },
  );
}

async function mockLiteDashboardApi(page: Page, scenario: Scenario) {
  let trialActivationCalls = 0;

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = request.method();

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

    if (path === '/cabinet/branding/lite-mode' && method === 'GET') {
      await route.fulfill({ status: 200, json: { enabled: true } });
      return;
    }

    if (path === '/cabinet/branding' && method === 'GET') {
      await route.fulfill({
        status: 200,
        json: {
          name: 'PEDZEO',
          logo_url: null,
          logo_letter: 'P',
          has_custom_logo: false,
        },
      });
      return;
    }

    if (path === '/cabinet/balance' && method === 'GET') {
      await route.fulfill({
        status: 200,
        json: {
          balance_kopeks: 0,
          balance_rubles: 0,
        },
      });
      return;
    }

    if (path === '/cabinet/referral' && method === 'GET') {
      await route.fulfill({
        status: 200,
        json: {
          referral_code: '',
          referral_link: '',
          total_referrals: 0,
          active_referrals: 0,
          total_earnings_kopeks: 0,
          total_earnings_rubles: 0,
          commission_percent: 25,
        },
      });
      return;
    }

    if (path === '/cabinet/subscription/purchase-options' && method === 'GET') {
      await route.fulfill({ status: 200, json: PURCHASE_OPTIONS });
      return;
    }

    if (path === '/cabinet/subscription' && method === 'GET') {
      if (scenario === 'active_subscription') {
        await route.fulfill({
          status: 200,
          json: { has_subscription: true, subscription: ACTIVE_SUBSCRIPTION },
        });
        return;
      }

      if (scenario === 'expired_subscription') {
        await route.fulfill({
          status: 200,
          json: { has_subscription: true, subscription: EXPIRED_SUBSCRIPTION },
        });
        return;
      }

      await route.fulfill({ status: 200, json: { has_subscription: false, subscription: null } });
      return;
    }

    if (path === '/cabinet/subscription/trial' && method === 'GET') {
      await route.fulfill({
        status: 200,
        json: scenario === 'trial_available' ? TRIAL_AVAILABLE_INFO : TRIAL_UNAVAILABLE_INFO,
      });
      return;
    }

    if (path === '/cabinet/subscription/trial' && method === 'POST') {
      trialActivationCalls += 1;
      await route.fulfill({ status: 200, json: ACTIVE_SUBSCRIPTION });
      return;
    }

    if (path === '/cabinet/config/theme/enabled' && method === 'GET') {
      await route.fulfill({ status: 200, json: { enabled_themes: ['default'] } });
      return;
    }

    if (path === '/cabinet/promo-offers/templates' && method === 'GET') {
      await route.fulfill({ status: 200, json: [] });
      return;
    }

    if (path === '/cabinet/promo-offers/active-discount' && method === 'GET') {
      await route.fulfill({ status: 200, json: null });
      return;
    }

    await route.fulfill({ status: 200, json: {} });
  });

  return {
    getTrialActivationCalls: () => trialActivationCalls,
  };
}

test.describe('Lite dashboard smoke', () => {
  test('no subscription without trial: shows no-subscription state', async ({ page }) => {
    await bootstrapAuthAndLiteMode(page);
    await mockLiteDashboardApi(page, 'no_subscription');

    await page.goto('/');

    await expect(page.getByTestId('lite-no-subscription-card')).toBeVisible();
    await expect(page.getByTestId('lite-trial-hint-card')).toHaveCount(0);
    await expect(page.getByTestId('lite-subscription-active-card')).toHaveCount(0);
  });

  test('trial available: shows trial hint and activation button', async ({ page }) => {
    await bootstrapAuthAndLiteMode(page);
    await mockLiteDashboardApi(page, 'trial_available');

    await page.goto('/');

    await expect(page.getByTestId('lite-trial-hint-card')).toBeVisible();
    await expect(page.getByTestId('lite-activate-trial')).toBeVisible();
  });

  test('active subscription: shows active subscription card', async ({ page }) => {
    await bootstrapAuthAndLiteMode(page);
    await mockLiteDashboardApi(page, 'active_subscription');

    await page.goto('/');

    await expect(page.getByTestId('lite-subscription-active-card')).toBeVisible();
    await expect(page.getByTestId('lite-trial-hint-card')).toHaveCount(0);
  });

  test('expired subscription: shows expired-connect hint', async ({ page }) => {
    await bootstrapAuthAndLiteMode(page);
    await mockLiteDashboardApi(page, 'expired_subscription');

    await page.goto('/');

    await expect(page.getByTestId('lite-connect-expired-hint')).toBeVisible();
  });

  test('trial activation: blocks duplicate clicks during cooldown', async ({ page }) => {
    await bootstrapAuthAndLiteMode(page);
    const mockApi = await mockLiteDashboardApi(page, 'trial_available');

    await page.goto('/');

    const activateButton = page.getByTestId('lite-activate-trial');
    await expect(activateButton).toBeVisible();
    await activateButton.click();
    await activateButton.click({ force: true });

    await expect
      .poll(() => mockApi.getTrialActivationCalls(), { timeout: 5_000 })
      .toBeLessThanOrEqual(1);
  });
});
