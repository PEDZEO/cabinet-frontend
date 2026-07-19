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

const CONNECTED_DEVICE = {
  hwid: 'desktop-smoke-device',
  platform: 'windows',
  device_model: 'Desktop PC',
  created_at: '2026-07-01T00:00:00.000Z',
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

const LOW_TRAFFIC_SUBSCRIPTION = {
  ...SUBSCRIPTION,
  traffic_used_gb: 92,
  traffic_used_percent: 92,
};

const TRIAL_SUBSCRIPTION = {
  ...SUBSCRIPTION,
  id: 991,
  is_trial: true,
  end_date: '2030-07-17T20:47:00.000Z',
  days_left: 3,
  time_left_display: '3 дня',
  traffic_limit_gb: 2,
  traffic_used_gb: 0,
  traffic_used_percent: 0,
  device_limit: 1,
  tariff_id: 2,
  tariff_name: 'Стандарт + LTE',
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
  device_price_kopeks: 5000,
  device_traffic_gb: 35,
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

const PREMIUM_TARIFF = {
  ...TARIFF,
  id: 2,
  name: 'Премиум',
  description: 'Больше трафика и устройств',
  tier_level: 2,
  traffic_limit_gb: 250,
  traffic_limit_label: '250 GB',
  device_limit: 4,
  base_device_limit: 3,
  max_device_limit: 6,
  device_price_kopeks: 7000,
  is_current: false,
  periods: [
    {
      days: 30,
      months: 1,
      label: '1 месяц',
      price_kopeks: 50000,
      price_label: '500 ₽',
      price_per_month_kopeks: 50000,
      price_per_month_label: '500 ₽',
      extra_devices_count: 1,
    },
  ],
};

const MULTI_PERIOD_TARIFF = {
  ...TARIFF,
  periods: [
    TARIFF.periods[0],
    {
      days: 90,
      months: 3,
      label: '3 месяца',
      price_kopeks: 85000,
      price_label: '850 ₽',
      price_per_month_kopeks: 28333,
      price_per_month_label: '283 ₽',
      extra_devices_count: 1,
    },
    {
      days: 180,
      months: 6,
      label: '6 месяцев',
      price_kopeks: 150000,
      price_label: '1 500 ₽',
      price_per_month_kopeks: 25000,
      price_per_month_label: '250 ₽',
      extra_devices_count: 1,
    },
    {
      days: 365,
      months: 12,
      label: '1 год',
      price_kopeks: 280000,
      price_label: '2 800 ₽',
      price_per_month_kopeks: 23333,
      price_per_month_label: '233 ₽',
      extra_devices_count: 1,
    },
  ],
};

const TRAFFIC_PACKAGES = [
  {
    gb: 10,
    price_kopeks: 10000,
    price_rubles: 100,
    price_label: '100 ₽',
    is_unlimited: false,
    discount_percent: 0,
  },
  {
    gb: 50,
    price_kopeks: 35000,
    price_rubles: 350,
    price_label: '350 ₽',
    is_unlimited: false,
    base_price_kopeks: 50000,
    discount_percent: 30,
  },
];

function createFakeJwt(): string {
  const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  const payload = 'eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6Ijk5In0';
  return `${header}.${payload}.signature`;
}

async function bootstrapUltimaDesktop(
  page: Page,
  { connectionCompleted = true }: { connectionCompleted?: boolean } = {},
): Promise<void> {
  await page.addInitScript(
    ({ jwt, themeConfig, connectionCompleted }) => {
      sessionStorage.setItem('access_token', jwt);
      sessionStorage.setItem('refresh_token', jwt);
      localStorage.setItem('cabinet_ultima_mode', 'true');
      localStorage.setItem('cabinet_lite_mode', 'false');
      localStorage.setItem('cabinet_ultima_theme_config', JSON.stringify(themeConfig));
      if (connectionCompleted) {
        localStorage.setItem('ultima_connection_completed_v1:99', '1');
        localStorage.setItem('ultima_connection_flow_v1:99', '3');
      } else {
        localStorage.removeItem('ultima_connection_completed_v1:99');
        localStorage.setItem('ultima_connection_flow_v1:99', '1');
      }
    },
    { jwt: createFakeJwt(), themeConfig: THEME_CONFIG, connectionCompleted },
  );
}

async function mockUltimaDesktopApi(
  page: Page,
  {
    isAdmin = false,
    subscription = SUBSCRIPTION,
    connectedDevices = [CONNECTED_DEVICE],
    devicesGate,
    subscriptionGate,
    tariffs = [TARIFF],
    currentTariffId = 1,
    balanceKopeks = 125_000,
    trafficPackages = TRAFFIC_PACKAGES,
  }: {
    isAdmin?: boolean;
    subscription?: typeof SUBSCRIPTION;
    connectedDevices?: Array<typeof CONNECTED_DEVICE>;
    devicesGate?: Promise<void>;
    subscriptionGate?: Promise<void>;
    tariffs?: Array<typeof TARIFF>;
    currentTariffId?: number | null;
    balanceKopeks?: number;
    trafficPackages?: typeof TRAFFIC_PACKAGES;
  } = {},
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
    if (path === '/cabinet/notifications') {
      return respond({
        subscription_expiry_enabled: true,
        subscription_expiry_days: 7,
        traffic_warning_enabled: true,
        traffic_warning_percent: 80,
        balance_low_enabled: true,
        balance_low_threshold: 100,
        news_enabled: true,
        promo_offers_enabled: true,
      });
    }
    if (path === '/cabinet/subscription') {
      if (subscriptionGate) {
        await subscriptionGate;
      }
      return respond({ has_subscription: true, subscription });
    }
    if (path === '/cabinet/subscription/purchase-options') {
      return respond({
        sales_mode: 'tariffs',
        tariffs,
        current_tariff_id: currentTariffId,
        balance_kopeks: balanceKopeks,
        balance_label: `${balanceKopeks / 100} ₽`,
        has_subscription: true,
      });
    }
    if (path === '/cabinet/subscription/trial') {
      return respond({ is_available: false, reason_unavailable: 'already_used' });
    }
    if (path === '/cabinet/subscription/devices') {
      if (devicesGate) {
        await devicesGate;
      }
      return respond({
        devices: connectedDevices,
        total: connectedDevices.length,
        device_limit: subscription.device_limit,
      });
    }
    if (path === '/cabinet/subscription/devices/reduction-info') {
      return respond({
        available: true,
        current_device_limit: subscription.device_limit,
        min_device_limit: 2,
        can_reduce: Math.max(0, subscription.device_limit - 2),
        connected_devices_count: connectedDevices.length,
      });
    }
    if (path === '/cabinet/subscription/devices/price') {
      const devices = Math.max(1, Number(url.searchParams.get('devices') ?? 1));
      return respond({
        available: true,
        devices,
        can_add: 7,
        total_price_kopeks: devices * 5000,
      });
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
    if (path === '/cabinet/subscription/traffic-packages') {
      return respond(trafficPackages);
    }
    if (path === '/cabinet/balance') {
      return respond({ balance_kopeks: balanceKopeks, balance_rubles: balanceKopeks / 100 });
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

  test('opens the traffic top-up section from a notification deep link', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bootstrapUltimaDesktop(page);
    await mockUltimaDesktopApi(page);
    await page.goto('/subscription?trafficTopUp=1#ultima-traffic-top-up');

    const trafficTopUp = page.locator('#ultima-traffic-top-up');
    await expect(trafficTopUp).toBeVisible();
    await expect(trafficTopUp.locator('button[aria-expanded]').first()).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(page.getByTestId('ultima-traffic-package-10')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByTestId('ultima-traffic-order')).toContainText('30 дней');
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1366, height: 768 },
  ]) {
    test(`shows traffic warning and opens top-up at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await bootstrapUltimaDesktop(page);
      await mockUltimaDesktopApi(page, { subscription: LOW_TRAFFIC_SUBSCRIPTION });
      await page.goto('/');

      const warning = page.getByTestId('ultima-traffic-warning');
      await expect(warning).toBeVisible();
      await expect(warning).toContainText('Трафик заканчивается');
      await expect(warning).toContainText('Осталось 8 ГБ из 100 ГБ');
      await expect(page.getByText('Позови друга', { exact: true })).toHaveCount(0);
      await expect(page.getByText('Подключить новое устройство', { exact: true })).toHaveCount(0);
      await expectNoHorizontalOverflow(page);

      await page.getByTestId('ultima-traffic-warning-action').click();
      await expect(page).toHaveURL(/\/subscription\?trafficTopUp=1$/);
      await expect(page.locator('#ultima-traffic-top-up')).toBeVisible();
      await expect(
        page.locator('#ultima-traffic-top-up button[aria-expanded]').first(),
      ).toHaveAttribute('aria-expanded', 'true');
      await expectNoHorizontalOverflow(page);
    });
  }

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

    await page.locator('[data-ultima-nav-target="news"]').click();
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

    await page.locator('[data-ultima-nav-target="profile"]').click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.locator('h1').first()).toBeVisible();

    await page.locator('[data-ultima-nav-target="support"]').click();
    await expect(page).toHaveURL(/\/support$/);
    await expect(page.locator('h1').first()).toBeVisible();

    await page.goto('/ultima/devices');
    await expect(page.locator('h1').first()).toBeVisible();

    await page.goto('/subscription');
    const deviceStepper = page.getByTestId('ultima-desktop-device-stepper');
    await expect(deviceStepper).toBeVisible();
    await expect(deviceStepper.locator('button')).toHaveCount(2);
    await expect(page.getByTestId('ultima-desktop-device-count')).toHaveText('3');
    await expect(page.getByTestId('ultima-desktop-device-select')).toHaveCount(0);
    await page.getByTestId('ultima-desktop-devices-minus').click();
    await expect(page.getByTestId('ultima-desktop-device-count')).toHaveText('2');
    await page.getByTestId('ultima-desktop-devices-plus').click();
    await expect(page.getByTestId('ultima-desktop-device-count')).toHaveText('3');

    await page.locator('[data-ultima-nav-target="connection"]').click();
    await expect(page).toHaveURL(/\/connection$/);
    await expect(page.locator('.ultima-desktop-workspace')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('Ultima subscription device selection', () => {
  test('uses one compact device control and explains the extra charge on mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bootstrapUltimaDesktop(page);

    let releaseSubscription!: () => void;
    const subscriptionGate = new Promise<void>((resolve) => {
      releaseSubscription = resolve;
    });
    await mockUltimaDesktopApi(page, { subscriptionGate });
    await page.goto('/subscription');

    await expect(page.getByTestId('ultima-mobile-device-stepper')).toHaveCount(0);
    releaseSubscription();

    const deviceStepper = page.getByTestId('ultima-mobile-device-stepper');
    await expect(deviceStepper).toBeVisible();
    await expect(deviceStepper.locator('button')).toHaveCount(2);
    await expect(page.getByTestId('ultima-mobile-device-count')).toHaveText('3');
    await expect(page.getByTestId('ultima-desktop-device-select')).toHaveCount(0);

    const extraSummary = page.getByTestId('ultima-mobile-extra-device-summary');
    await expect(extraSummary).toContainText('Дополнительно: +1');
    await expect(extraSummary).toContainText('+50 ₽');
    await expect(extraSummary).toContainText('+35 ГБ');

    const priceSummary = page.getByTestId('ultima-subscription-price-summary');
    await expect(priceSummary).toContainText('360 ₽');
    await expect(priceSummary).toContainText('−360 ₽');
    await expect(priceSummary).toContainText('Не нужно');
    const primaryAction = page.getByTestId('ultima-subscription-primary-action');
    await expect(primaryAction).toContainText('Продлить на 1 месяц');
    await expect(primaryAction).toContainText('360 ₽');
    await expect(primaryAction).toContainText('С баланса');
    await expect(page.getByTestId('ultima-subscription-action-price')).toHaveText('360 ₽');

    await page.getByTestId('ultima-mobile-devices-minus').click();
    await expect(page.getByTestId('ultima-mobile-device-count')).toHaveText('2');
    await expect(extraSummary).toHaveCount(0);
    await expect(priceSummary).toContainText('310 ₽');

    await page.getByTestId('ultima-mobile-devices-plus').click();
    await expect(page.getByTestId('ultima-mobile-device-count')).toHaveText('3');
    await expect(page.getByTestId('ultima-mobile-extra-device-summary')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('keeps the current plan open until the user chooses another tariff', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bootstrapUltimaDesktop(page);
    await mockUltimaDesktopApi(page, { tariffs: [TARIFF, PREMIUM_TARIFF] });
    await page.goto('/subscription');

    await expect(page.getByTestId('ultima-subscription-configurator')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Выберите тариф' })).toHaveCount(0);

    await page.getByTestId('ultima-subscription-change-tariff').click();
    await expect(page.getByRole('heading', { name: 'Выберите тариф' })).toBeVisible();
    await page.getByRole('button', { name: /Премиум/ }).click();

    const configurator = page.getByTestId('ultima-subscription-configurator');
    await expect(configurator.getByRole('heading', { name: 'Премиум' })).toBeVisible();
    await expect(page.getByTestId('ultima-mobile-period-selector')).toHaveCount(0);
    await expect(page.getByTestId('ultima-subscription-primary-action')).toContainText(
      'Сменить тариф',
    );
    await expectNoHorizontalOverflow(page);
  });

  test('keeps several periods compact and recalculates the order', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await bootstrapUltimaDesktop(page);
    await mockUltimaDesktopApi(page, {
      tariffs: [MULTI_PERIOD_TARIFF],
      balanceKopeks: 500_000,
    });
    await page.goto('/subscription');

    const periodSelector = page.getByTestId('ultima-mobile-period-selector');
    await expect(periodSelector.getByRole('radio')).toHaveCount(4);
    await expect(page.getByText('Выгодно', { exact: true })).toBeVisible();
    await expect(page.getByTestId('ultima-mobile-period-90')).toContainText('3 месяца');
    await expect(page.getByText('subscription.bestDeal', { exact: true })).toHaveCount(0);
    await expect(page.getByTestId('ultima-subscription-primary-action')).toContainText(
      'Продлить на 6 месяцев',
    );
    await expect(page.getByTestId('ultima-subscription-action-price')).toHaveText('1800 ₽');

    await page.getByTestId('ultima-mobile-period-90').click();
    await expect(page.getByTestId('ultima-subscription-primary-action')).toContainText(
      'Продлить на 3 месяца',
    );
    await expect(page.getByTestId('ultima-subscription-action-price')).toHaveText('1000 ₽');
    await expectNoHorizontalOverflow(page);
  });

  test('separates subscription price, balance and required top-up', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bootstrapUltimaDesktop(page);
    await mockUltimaDesktopApi(page, { balanceKopeks: 10_000 });
    await page.goto('/subscription');

    const priceSummary = page.getByTestId('ultima-subscription-price-summary');
    await expect(priceSummary).toContainText('360 ₽');
    await expect(priceSummary).toContainText('−100 ₽');
    await expect(priceSummary).toContainText('260 ₽');
    await expect(page.getByTestId('ultima-subscription-primary-action')).toContainText(
      'Пополнить и купить',
    );
    await expect(page.getByTestId('ultima-subscription-action-price')).toHaveText('260 ₽');
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('Ultima subscription information', () => {
  test('turns traffic top-up into one clear package and payment flow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bootstrapUltimaDesktop(page);
    await mockUltimaDesktopApi(page);
    await page.goto('/ultima/subscription-info');

    const topUp = page.getByTestId('ultima-traffic-top-up');
    const toggle = page.getByTestId('ultima-traffic-top-up-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(topUp).toContainText('82 ГБ');
    await expect(topUp).toContainText('от 100 ₽');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('ultima-traffic-package-10')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    const order = page.getByTestId('ultima-traffic-order');
    await expect(order).toContainText('30 дней');
    await expect(order).toContainText('1250 ₽');
    await expect(page.getByTestId('ultima-traffic-purchase')).toHaveText('Купить 10 ГБ за 100 ₽');

    await page.getByTestId('ultima-traffic-package-50').click();
    await expect(page.getByTestId('ultima-traffic-purchase')).toHaveText('Купить 50 ГБ за 350 ₽');
    await expectNoHorizontalOverflow(page);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('ultima-traffic-package-10')).toHaveCount(0);
    await expect(topUp).toBeVisible();
  });

  test('shows the exact balance shortage before opening payment', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await bootstrapUltimaDesktop(page);
    await mockUltimaDesktopApi(page, { balanceKopeks: 5000 });
    await page.goto('/ultima/subscription-info');

    await page.getByTestId('ultima-traffic-top-up-toggle').click();
    await expect(page.getByTestId('ultima-traffic-order')).toContainText(
      'На балансе не хватает 50 ₽',
    );
    await expect(page.getByTestId('ultima-traffic-top-up-balance')).toHaveText('Пополнить на 50 ₽');
    await expectNoHorizontalOverflow(page);
  });

  test('keeps the active plan, traffic, connection link and renewal clear on mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bootstrapUltimaDesktop(page);
    await mockUltimaDesktopApi(page);
    await page.goto('/ultima/subscription-info');

    const infoPage = page.getByTestId('ultima-subscription-info-page');
    await expect(infoPage).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Обычный', exact: true })).toBeVisible();
    await expect(page.getByTestId('ultima-subscription-info-status')).toHaveText('Активна');
    await expect(page.getByText('Действует до', { exact: true })).toBeVisible();

    const trafficOverview = page.getByTestId('ultima-subscription-traffic-overview');
    await expect(trafficOverview).toContainText('82 ГБ');
    await expect(trafficOverview).toContainText('18 ГБ');
    await expect(trafficOverview).toContainText('100 ГБ');
    await expect(page.locator('#ultima-traffic-top-up')).toBeVisible();
    await expect(
      page.locator('#ultima-traffic-top-up button[aria-expanded]').first(),
    ).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('ultima-subscription-link')).toContainText(
      'Ссылка для подключения',
    );
    await expect(page.getByTestId('ultima-subscription-info-primary-action')).toContainText(
      'Продлить подписку',
    );
    await expectNoHorizontalOverflow(page);
    await page.getByTestId('ultima-subscription-info-devices').click();
    await expect(page).toHaveURL(/\/ultima\/devices$/);
  });

  test('uses the full desktop workspace without losing subscription actions', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await bootstrapUltimaDesktop(page);
    await mockUltimaDesktopApi(page);
    await page.goto('/ultima/subscription-info');

    await expect(page.locator('.ultima-desktop-workspace')).toBeVisible();
    await expect(page.getByTestId('ultima-subscription-info-page')).toBeVisible();
    await expect(page.getByTestId('ultima-subscription-traffic-overview')).toContainText('82 ГБ');
    await expect(page.getByTestId('ultima-subscription-link')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Продлить подписку' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Устройства' }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('Ultima device management', () => {
  test('uses one target limit control for adding and reducing slots', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bootstrapUltimaDesktop(page);
    await mockUltimaDesktopApi(page);
    await page.goto('/ultima/devices');

    await expect(page.getByTestId('ultima-device-capacity')).toBeVisible();
    await expect(page.getByTestId('ultima-device-free-slots')).toContainText('2 свободно');
    await expect(page.getByTestId('ultima-devices-limit-device-count')).toHaveText('3');
    await expect(page.getByTestId('ultima-device-limit-summary')).toHaveCount(0);
    await expect(page.getByText('Купить слоты для устройств', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Уменьшить количество устройств', { exact: true })).toHaveCount(0);

    await page.getByTestId('ultima-devices-limit-devices-plus').click();
    await expect(page.getByTestId('ultima-devices-limit-device-count')).toHaveText('4');
    const increaseSummary = page.getByTestId('ultima-device-limit-summary');
    await expect(increaseSummary).toContainText('Новый лимит: 4');
    await expect(increaseSummary).toContainText('Добавится мест: +1');
    await expect(increaseSummary).toContainText('+35 ГБ');
    await expect(increaseSummary).toContainText('50.00 ₽');
    await expect(page.getByTestId('ultima-device-limit-apply')).toContainText('Добавить +1');

    await page.getByTestId('ultima-devices-limit-devices-minus').click();
    await page.getByTestId('ultima-devices-limit-devices-minus').click();
    await expect(page.getByTestId('ultima-devices-limit-device-count')).toHaveText('2');
    const reductionSummary = page.getByTestId('ultima-device-limit-summary');
    await expect(reductionSummary).toContainText('Новый лимит: 2');
    await expect(reductionSummary).toContainText('Уменьшится на 1');
    await expect(page.getByTestId('ultima-device-limit-apply')).toContainText('Уменьшить до 2');

    await page.getByTestId('ultima-device-primary-action').click();
    await expect(page.locator('#ultima-connect-new-device[role="dialog"]')).toBeVisible();
    await expect(page.getByTestId('ultima-device-qr')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('keeps a long device list compact until it is expanded', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bootstrapUltimaDesktop(page);
    const connectedDevices = Array.from({ length: 7 }, (_, index) => ({
      ...CONNECTED_DEVICE,
      hwid: `device-${index + 1}`,
      device_model: `Device ${index + 1}`,
    }));
    await mockUltimaDesktopApi(page, {
      connectedDevices,
      subscription: { ...SUBSCRIPTION, device_limit: 10 },
    });
    await page.goto('/ultima/devices');

    await expect(page.getByTestId('ultima-device-row')).toHaveCount(5);
    await expect(page.getByTestId('ultima-devices-list-toggle')).toContainText('Показать еще 2');
    await page.getByTestId('ultima-devices-list-toggle').click();
    await expect(page.getByTestId('ultima-device-row')).toHaveCount(7);
    await expect(page.getByTestId('ultima-devices-list-toggle')).toContainText('Свернуть список');
    await expectNoHorizontalOverflow(page);
  });

  test('does not show zero capacity while devices are loading', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bootstrapUltimaDesktop(page);
    let releaseDevices!: () => void;
    const devicesGate = new Promise<void>((resolve) => {
      releaseDevices = resolve;
    });
    await mockUltimaDesktopApi(page, { devicesGate });
    await page.goto('/ultima/devices');

    await expect(page.getByTestId('ultima-devices-loading')).toBeVisible();
    await expect(page.getByTestId('ultima-device-capacity')).toHaveCount(0);
    releaseDevices();
    await expect(page.getByTestId('ultima-devices-loading')).toHaveCount(0);
    await expect(page.getByTestId('ultima-device-free-slots')).toContainText('2 свободно');
  });
});

test.describe('Ultima device loading state', () => {
  test('does not flash a zero device count before the device request finishes', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bootstrapUltimaDesktop(page);

    let releaseDevices!: () => void;
    const devicesGate = new Promise<void>((resolve) => {
      releaseDevices = resolve;
    });
    const connectedDevices = [
      CONNECTED_DEVICE,
      { ...CONNECTED_DEVICE, hwid: 'desktop-smoke-device-2' },
      { ...CONNECTED_DEVICE, hwid: 'desktop-smoke-device-3' },
    ];

    await mockUltimaDesktopApi(page, { connectedDevices, devicesGate });
    await page.goto('/');

    await expect(page.getByTestId('ultima-device-cta-loading')).toBeVisible();
    await expect(page.getByTestId('ultima-plan-device-count-loading')).toBeVisible();
    await expect(page.getByTestId('ultima-device-home-cta-title')).toHaveCount(0);
    await expect(page.getByTestId('ultima-plan-device-count')).not.toContainText('0/3');

    releaseDevices();

    await expect(page.getByTestId('ultima-device-cta-loading')).toHaveCount(0);
    await expect(page.getByTestId('ultima-plan-device-count')).toHaveText('3/3');
    await expect(page.getByTestId('ultima-device-home-cta-title')).toHaveText('Купить слот');
  });
});

test.describe('Ultima mobile scrolling', () => {
  for (const viewport of [
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ]) {
    test(`keeps the mobile workspace inside ${viewport.width}x${viewport.height}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport);
      await bootstrapUltimaDesktop(page);
      await mockUltimaDesktopApi(page);
      await page.goto('/');

      const scrollRegion = page.getByTestId('ultima-dashboard-scroll-region');
      const nav = page.locator('.ultima-shared-nav-shell');
      await expect(scrollRegion).toBeVisible();
      await expect(nav).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expect(page.locator('.ultima-ring-wave')).toHaveCount(3);

      const scrollbarStyles = await scrollRegion.evaluate((element) => ({
        firefox: getComputedStyle(element).scrollbarWidth,
        webkit: getComputedStyle(element, '::-webkit-scrollbar').display,
      }));
      expect(scrollbarStyles.firefox).toBe('none');
      expect(scrollbarStyles.webkit).toBe('none');

      const navBox = await nav.boundingBox();
      expect(navBox).not.toBeNull();
      expect(navBox!.x).toBeGreaterThanOrEqual(0);
      expect(navBox!.x + navBox!.width).toBeLessThanOrEqual(viewport.width);
      expect(navBox!.y + navBox!.height).toBeLessThanOrEqual(viewport.height);

      const remainingScroll = await scrollRegion.evaluate(
        (element) => element.scrollHeight - element.clientHeight,
      );
      const cue = page.getByTestId('ultima-scroll-cue');
      if (remainingScroll > 56) {
        await expect(cue).toBeVisible();
        const cueBox = await cue.boundingBox();
        expect(cueBox).not.toBeNull();
        expect(cueBox!.x).toBeGreaterThanOrEqual(viewport.width - 60);
        expect(cueBox!.x + cueBox!.width).toBeLessThanOrEqual(viewport.width);
        expect(cueBox!.y + cueBox!.height).toBeLessThanOrEqual(navBox!.y);
      } else {
        await expect(cue).toHaveCount(0);
      }

      await page.screenshot({
        path: testInfo.outputPath(`ultima-mobile-${viewport.width}x${viewport.height}.png`),
        animations: 'disabled',
      });
    });
  }

  test('scroll cue advances a long page and disappears at the end', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await bootstrapUltimaDesktop(page);
    await mockUltimaDesktopApi(page);
    await page.goto('/profile');

    const scrollRegion = page.locator('section.ultima-scrollbar').first();
    await expect(scrollRegion).toBeVisible();
    await expect
      .poll(() => scrollRegion.evaluate((element) => element.scrollHeight - element.clientHeight))
      .toBeGreaterThan(56);

    const cue = page.getByTestId('ultima-scroll-cue');
    await expect(cue).toBeVisible();
    const cueBox = await cue.boundingBox();
    const navBox = await page.locator('.ultima-shared-nav-shell').boundingBox();
    expect(cueBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(cueBox!.x + cueBox!.width).toBeLessThanOrEqual(360);
    expect(cueBox!.y).toBeGreaterThanOrEqual(navBox!.y - 24);
    expect(cueBox!.y + cueBox!.height).toBeLessThanOrEqual(navBox!.y);

    await page.screenshot({
      path: testInfo.outputPath('ultima-mobile-scroll-cue.png'),
      animations: 'disabled',
    });

    await cue.click();
    await expect
      .poll(() => scrollRegion.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);

    await scrollRegion.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(cue).toHaveCount(0);
  });

  test('bounds transient effects during rapid shield taps', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bootstrapUltimaDesktop(page);
    await mockUltimaDesktopApi(page);
    await page.goto('/');

    const shield = page.getByTestId('ultima-shield-tap-target');
    await expect(shield).toBeVisible();
    await shield.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      for (let index = 0; index < 80; index += 1) {
        element.dispatchEvent(
          new PointerEvent('pointerdown', {
            bubbles: true,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
            pointerId: index + 1,
            pointerType: 'touch',
          }),
        );
      }
    });

    const effectCounts = await shield.evaluate((element) => ({
      digits: element.querySelectorAll('.ultima-float-number').length,
      ripples: element.querySelectorAll('.ultima-tap-ring').length,
    }));
    expect(effectCounts.ripples).toBeGreaterThan(0);
    expect(effectCounts.ripples).toBeLessThanOrEqual(10);
    expect(effectCounts.digits).toBeGreaterThan(0);
    expect(effectCounts.digits).toBeLessThanOrEqual(16);
  });
});

test.describe('Ultima trial onboarding persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('does not reopen onboarding after the connection flow was completed', async ({ page }) => {
    await bootstrapUltimaDesktop(page, { connectionCompleted: true });
    await mockUltimaDesktopApi(page, { subscription: TRIAL_SUBSCRIPTION });

    await page.goto('/');

    await expect
      .poll(() =>
        page.evaluate(
          (signature) => localStorage.getItem(`ultima_trial_guide_signature_ack_v1:${signature}`),
          `${TRIAL_SUBSCRIPTION.id}:${TRIAL_SUBSCRIPTION.end_date}`,
        ),
      )
      .toBe('1');
    await expect(page.getByTestId('ultima-trial-guide-overlay')).toHaveCount(0);

    await page.reload();
    await page.waitForTimeout(650);
    await expect(page.getByTestId('ultima-trial-guide-overlay')).toHaveCount(0);
  });

  test('keeps the Later dismissal after refresh', async ({ page }) => {
    await bootstrapUltimaDesktop(page, { connectionCompleted: false });
    await mockUltimaDesktopApi(page, { subscription: TRIAL_SUBSCRIPTION });

    await page.goto('/');
    await expect(page.getByTestId('ultima-trial-guide-overlay')).toBeVisible();
    await page.getByTestId('ultima-trial-guide-dismiss').click();
    await expect(page.getByTestId('ultima-trial-guide-overlay')).toHaveCount(0);

    await page.reload();
    await page.waitForTimeout(650);
    await expect(page.getByTestId('ultima-trial-guide-overlay')).toHaveCount(0);
  });

  test('keeps the device card while the primary CTA opens tariff purchase', async ({ page }) => {
    await bootstrapUltimaDesktop(page, { connectionCompleted: true });
    await mockUltimaDesktopApi(page, {
      subscription: SUBSCRIPTION,
      connectedDevices: [],
    });

    await page.goto('/');

    await expect(page.getByText('Подключить первое устройство', { exact: true })).toBeVisible();
    await expect(page.getByText('Установка и настройка', { exact: true })).toBeVisible();
    const primaryCta = page.getByTestId('ultima-primary-cta');
    await expect(primaryCta).toContainText('Продлить подписку');
    await primaryCta.click();
    await expect(page).toHaveURL(/\/subscription$/);
  });
});
