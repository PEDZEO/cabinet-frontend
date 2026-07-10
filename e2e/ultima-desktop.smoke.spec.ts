import { expect, test, type Page, type Route } from '@playwright/test';
import { DEFAULT_ANIMATION_CONFIG } from '../src/components/ui/backgrounds/types';
import { DEFAULT_ENABLED_THEMES, DEFAULT_THEME_COLORS } from '../src/types/theme';

test.use({ locale: 'ru-RU' });

const THEME_CONFIG = {
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
  contentEnterMs: 0,
  tapRingMs: 0,
  ringWaveSec: 18,
  sliderGlowSec: 2.6,
  stepRingSec: 5.8,
  successWaveMs: 0,
  itemEnterMs: 0,
  framesEnabled: false,
  homeUseBrandLogo: false,
};

const USER = {
  id: 99,
  telegram_id: 99001,
  username: 'desktop_smoke',
  first_name: 'Desktop',
  last_name: 'Smoke',
  email: 'desktop@example.com',
  email_verified: true,
  balance_kopeks: 125_000,
  balance_rubles: 1250,
  referral_code: 'DESKTOP99',
  language: 'ru',
  created_at: '2026-01-01T00:00:00.000Z',
  auth_type: 'telegram',
};

const SUBSCRIPTION = {
  id: 990,
  status: 'ACTIVE',
  is_trial: false,
  start_date: '2026-06-01T00:00:00.000Z',
  end_date: '2027-06-01T00:00:00.000Z',
  days_left: 326,
  hours_left: 0,
  minutes_left: 0,
  time_left_display: '326 дней',
  traffic_limit_gb: 100,
  traffic_used_gb: 18,
  traffic_used_percent: 18,
  device_limit: 3,
  connected_squads: [],
  servers: [{ uuid: 'server-1', name: 'Нидерланды', country_code: 'NL' }],
  autopay_enabled: false,
  autopay_days_before: 1,
  subscription_url: 'https://example.com/subscription',
  hide_subscription_link: false,
  is_active: true,
  is_expired: false,
  tariff_id: 1,
  tariff_name: 'Обычный',
  traffic_purchases: [],
};

const TARIFF = {
  id: 1,
  name: 'Обычный',
  description: 'Основной тариф',
  tier_level: 1,
  traffic_limit_gb: 100,
  traffic_limit_label: '100 GB',
  is_unlimited_traffic: false,
  device_limit: 3,
  base_device_limit: 2,
  max_device_limit: 3,
  extra_devices_count: 1,
  servers_count: 1,
  servers: [{ uuid: 'server-1', name: 'Нидерланды' }],
  is_available: true,
  is_current: true,
  periods: [
    {
      days: 30,
      months: 1,
      label: '1 месяц',
      price_kopeks: 31000,
      price_label: '310 ₽',
      price_per_month_kopeks: 31000,
      price_per_month_label: '310 ₽',
      extra_devices_count: 1,
    },
  ],
};

function createFakeJwt(): string {
  const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  const payload = 'eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6Ijk5In0';
  return `${header}.${payload}.signature`;
}

async function bootstrapUltimaDesktop(page: Page): Promise<void> {
  await page.addInitScript(
    ({ jwt, themeConfig }) => {
      sessionStorage.setItem('access_token', jwt);
      sessionStorage.setItem('refresh_token', jwt);
      localStorage.setItem('cabinet_ultima_mode', 'true');
      localStorage.setItem('cabinet_lite_mode', 'false');
      localStorage.setItem('cabinet_ultima_theme_config', JSON.stringify(themeConfig));
      localStorage.setItem('ultima_connection_completed_v1:99', '1');
      localStorage.setItem('ultima_connection_flow_v1:99', '3');
    },
    { jwt: createFakeJwt(), themeConfig: THEME_CONFIG },
  );
}

async function mockUltimaDesktopApi(
  page: Page,
  { isAdmin = false }: { isAdmin?: boolean } = {},
): Promise<void> {
  await page.route('**/api/**', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = request.method();

    const respond = async (json: unknown) => route.fulfill({ status: 200, json });

    if (path === '/cabinet/auth/me') return respond(USER);
    if (path === '/cabinet/auth/me/is-admin') return respond({ is_admin: isAdmin });
    if (path === '/cabinet/auth/identities') {
      return respond({
        identities: [],
        telegram_relink: {
          can_start_relink: true,
          requires_unlink_first: false,
          cooldown_until: null,
          retry_after_seconds: null,
        },
      });
    }
    if (path === '/cabinet/branding/ultima-mode') return respond({ enabled: true });
    if (path === '/cabinet/branding/lite-mode') return respond({ enabled: false });
    if (path === '/cabinet/branding/ultima-theme-config') return respond(THEME_CONFIG);
    if (path === '/cabinet/branding') {
      return respond({ name: 'Ultimteam VPN', logo_url: null, logo_letter: 'U' });
    }
    if (path === '/cabinet/branding/colors') return respond(DEFAULT_THEME_COLORS);
    if (path === '/cabinet/branding/themes') return respond(DEFAULT_ENABLED_THEMES);
    if (path === '/cabinet/branding/animation-config') return respond(DEFAULT_ANIMATION_CONFIG);
    if (path === '/cabinet/branding/fullscreen') return respond({ enabled: false });
    if (path === '/cabinet/branding/analytics') return respond({});
    if (path === '/cabinet/branding/gift-enabled') return respond({ enabled: false });
    if (path === '/cabinet/subscription') {
      return respond({ has_subscription: true, subscription: SUBSCRIPTION });
    }
    if (path === '/cabinet/subscription/purchase-options') {
      return respond({
        sales_mode: 'tariffs',
        tariffs: [TARIFF],
        current_tariff_id: 1,
        balance_kopeks: 125_000,
        balance_label: '1 250 ₽',
        has_subscription: true,
      });
    }
    if (path === '/cabinet/subscription/trial') {
      return respond({ is_available: false, reason_unavailable: 'already_used' });
    }
    if (path === '/cabinet/subscription/devices') {
      return respond({
        devices: [
          {
            hwid: 'desktop-smoke-device',
            platform: 'windows',
            device_model: 'Desktop PC',
            created_at: '2026-07-01T00:00:00.000Z',
          },
        ],
        total: 1,
        device_limit: 3,
      });
    }
    if (path === '/cabinet/subscription/devices/reduction-info') {
      return respond({
        available: true,
        current_device_limit: 3,
        min_device_limit: 2,
        connected_devices: 1,
      });
    }
    if (path === '/cabinet/subscription/devices/price') {
      return respond({ available: true, can_add: 7, total_price_kopeks: 5000 });
    }
    if (path === '/cabinet/subscription/connection-link') {
      return respond({
        subscription_url: SUBSCRIPTION.subscription_url,
        connect_mode: 'url',
        hide_link: false,
        instructions: { steps: [] },
      });
    }
    if (path === '/cabinet/subscription/happ-downloads') {
      return respond({ happ_enabled: false, platforms: {} });
    }
    if (path === '/cabinet/balance') {
      return respond({ balance_kopeks: 125_000, balance_rubles: 1250 });
    }
    if (path === '/cabinet/referral') {
      return respond({
        referral_code: USER.referral_code,
        referral_link: 'https://t.me/example?start=DESKTOP99',
        total_referrals: 4,
        active_referrals: 3,
        total_earnings_kopeks: 15000,
        total_earnings_rubles: 150,
        available_earnings_kopeks: 15000,
        withdrawn_earnings_kopeks: 0,
        commission_percent: 25,
      });
    }
    if (path === '/cabinet/referral/terms') {
      return respond({ is_enabled: true, commission_percent: 25, inviter_bonus_days: 3 });
    }
    if (path === '/cabinet/tap-rewards/progress') {
      return respond({
        enabled: false,
        total_taps: 0,
        progress_taps: 0,
        threshold: 100,
        taps_until_next: 100,
        streak_timeout_seconds: 1,
        rewards_granted_total: 0,
        daily_reward_limit: 1,
        daily_rewards_granted: 0,
        daily_limit_reached: false,
        reward_granted: false,
      });
    }
    if (path === '/cabinet/promo/offers') return respond([]);
    if (path === '/cabinet/promo/active-discount') return respond(null);
    if (path === '/cabinet/news') return respond({ items: [], total: 0, limit: 6, offset: 0 });
    if (path === '/cabinet/tickets') {
      return respond({ items: [], total: 0, page: 1, per_page: 20, pages: 0 });
    }
    if (path === '/cabinet/tickets/notifications/unread-count') {
      return respond({ unread_count: 0 });
    }
    if (path === '/cabinet/info/support-config') {
      return respond({
        use_tickets: true,
        tickets_enabled: true,
        support_type: 'tickets',
        external_url: null,
        telegram_username: null,
      });
    }
    if (path === '/cabinet/info/languages') {
      return respond({ languages: [{ code: 'ru', name: 'Русский', flag: 'RU' }], default: 'ru' });
    }
    if (path === '/cabinet/wheel/config') return respond({ is_enabled: false });
    if (path === '/cabinet/contests/count') return respond({ count: 0 });
    if (path === '/cabinet/polls/count') return respond({ count: 0 });
    if (path === '/cabinet/config/theme/enabled') return respond({ enabled_themes: ['dark'] });

    if (method === 'GET') return respond({});
    return respond({ success: true });
  });
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      })),
    )
    .toMatchObject({
      documentWidth: page.viewportSize()?.width,
      viewportWidth: page.viewportSize()?.width,
    });
}

test.describe('Ultima desktop workspace', () => {
  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
  ]) {
    test(`fits ${viewport.width}x${viewport.height} without page overflow`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await bootstrapUltimaDesktop(page);
      await mockUltimaDesktopApi(page);

      await page.goto('/');

      await expect(page.locator('[data-ultima-nav-btn="1"]').first()).toBeVisible();
      await expect(page.locator('.ultima-desktop-workspace')).toBeVisible();
      await expect(page.locator('.ultima-desktop-topbar')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }

  test('scrolls long desktop pages with the document wheel', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await bootstrapUltimaDesktop(page);
    await mockUltimaDesktopApi(page);
    await page.goto('/subscription');

    await expect(page.locator('.ultima-desktop-topbar')).toBeVisible();
    const overflowState = await page.evaluate(() => ({
      bodyOverflow: getComputedStyle(document.body).overflowY,
      rootOverflow: getComputedStyle(document.documentElement).overflowY,
    }));
    expect(overflowState.bodyOverflow).not.toBe('hidden');
    expect(overflowState.rootOverflow).not.toBe('hidden');

    const pageDimensions = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      viewportHeight: document.documentElement.clientHeight,
    }));
    expect(pageDimensions.scrollHeight).toBeGreaterThan(pageDimensions.viewportHeight);

    await page.mouse.move(800, 600);
    await page.mouse.wheel(0, 720);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });

  test('keeps the admin action inside the rail', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await bootstrapUltimaDesktop(page);
    await mockUltimaDesktopApi(page, { isAdmin: true });
    await page.goto('/');

    await expect(page.locator('.ultima-desktop-workspace')).toBeVisible();
    const adminAction = page.getByTestId('ultima-desktop-admin-link');
    await expect(adminAction).toBeVisible();
    expect(await adminAction.count()).toBe(1);

    const adminBox = await adminAction.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    });
    const topbarBox = await page.locator('.ultima-desktop-topbar').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    });

    expect(adminBox.right).toBeLessThanOrEqual(topbarBox.left);
  });

  test('keeps primary desktop sections reachable from the rail', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await bootstrapUltimaDesktop(page);
    await mockUltimaDesktopApi(page);
    await page.goto('/');

    await page.locator('[data-ultima-nav-btn="1"]').nth(2).click();
    await expect(page).toHaveURL(/\/ultima\/news$/);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('.ultima-desktop-workspace')).toHaveClass(
      /ultima-desktop-workspace-no-context/,
    );
    const newsMainWidth = await page
      .locator('.ultima-desktop-main')
      .evaluate((element) => element.getBoundingClientRect().width);
    expect(newsMainWidth).toBeGreaterThan(1100);
    await expectNoHorizontalOverflow(page);

    await page.locator('[data-ultima-nav-btn="1"]').nth(3).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.locator('h1').first()).toBeVisible();

    await page.locator('[data-ultima-nav-btn="1"]').nth(4).click();
    await expect(page).toHaveURL(/\/support$/);
    await expect(page.locator('h1').first()).toBeVisible();

    await page.goto('/ultima/devices');
    await expect(page.locator('h1').first()).toBeVisible();

    await page.goto('/subscription');
    const deviceSelect = page.getByTestId('ultima-desktop-device-select');
    await expect(deviceSelect).toBeVisible();
    await expect(deviceSelect.locator('option')).toHaveCount(2);
    await deviceSelect.selectOption({ label: '2' });
    await expect(deviceSelect).toHaveValue('2');

    await page.locator('[data-ultima-nav-btn="1"]').nth(1).click();
    await expect(page).toHaveURL(/\/connection$/);
    await expect(page.locator('.ultima-desktop-workspace')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
