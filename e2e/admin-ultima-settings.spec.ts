import { expect, test, type Page, type Route } from '@playwright/test';
import { DEFAULT_ANIMATION_CONFIG } from '../src/components/ui/backgrounds/types';
import { DEFAULT_ENABLED_THEMES, DEFAULT_THEME_COLORS } from '../src/types/theme';

test.use({ locale: 'ru-RU' });

const USER = {
  id: 99,
  telegram_id: 99001,
  username: 'ultima_admin',
  first_name: 'Ultima',
  last_name: 'Admin',
  email: 'admin@example.com',
  email_verified: true,
  balance_kopeks: 0,
  balance_rubles: 0,
  referral_code: 'ULTIMA99',
  language: 'ru',
  created_at: '2026-01-01T00:00:00.000Z',
  auth_type: 'telegram',
};

const OVERVIEW = {
  status: 'ok',
  mode: {
    enabled: true,
    main_menu_mode: 'cabinet',
    account_linking_mode: 'provider_auth',
  },
  start: {
    enabled: true,
    message_text: 'Откройте кабинет',
    button_text: 'Приложение',
    button_url: 'https://web.ultimteam.ru',
    fallback_to_regular_menu: false,
  },
  support: {
    support_type: 'both',
    tickets_enabled: true,
    miniapp_tickets_enabled: true,
    global_tickets_enabled: true,
    support_username: '@UltimVpn',
    support_url: null,
    channel_label: 'Тикеты и профиль',
  },
  notifications: { enabled: true, buttons: [] },
  config: {
    miniapp_url: 'https://web.ultimteam.ru',
    purchase_url: 'https://web.ultimteam.ru/subscription/purchase',
    static_path: '/app',
    service_name_ru: 'Ultimteam VPN',
    service_name_en: 'Ultimteam VPN',
  },
  diagnostics: [{ key: 'ultima_mode', label: 'Режим Ultima', status: 'ok', message: 'OK' }],
  metrics: {
    tickets_total: 54,
    tickets_open: 0,
    tickets_pending: 0,
    tickets_answered: 0,
    tickets_closed: 54,
    tickets_created_7d: 0,
  },
};

const SETTINGS = [
  {
    key: 'HAPP_CRYPTOLINK_ENABLED',
    name: 'Защищенные ссылки Happ',
    category: { key: 'HAPP', label: 'Happ' },
    type: 'bool',
    is_optional: false,
    current: true,
    original: false,
    has_override: true,
    read_only: false,
    choices: [],
  },
  {
    key: 'MINIAPP_SUPPORT_TYPE',
    name: 'Поддержка Mini App',
    category: { key: 'MINIAPP', label: 'Mini App' },
    type: 'str',
    is_optional: false,
    current: 'both',
    original: 'tickets',
    has_override: true,
    read_only: false,
    choices: [],
  },
];

function createFakeJwt(): string {
  const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  const payload = 'eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6Ijk5In0';
  return `${header}.${payload}.signature`;
}

async function bootstrapAdmin(page: Page): Promise<void> {
  await page.addInitScript((jwt) => {
    sessionStorage.setItem('access_token', jwt);
    sessionStorage.setItem('refresh_token', jwt);
    localStorage.setItem('cabinet_ultima_mode', 'true');
    localStorage.setItem('cabinet_lite_mode', 'false');
  }, createFakeJwt());
}

async function mockAdminApi(page: Page): Promise<void> {
  await page.route('**/api/**', async (route: Route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    const respond = async (json: unknown) => route.fulfill({ status: 200, json });

    if (path === '/cabinet/auth/me') return respond(USER);
    if (path === '/cabinet/auth/me/is-admin') return respond({ is_admin: true });
    if (path === '/cabinet/auth/me/permissions') {
      return respond({ permissions: ['*:*'], roles: ['owner'], role_level: 100 });
    }
    if (path === '/cabinet/auth/identities') {
      return respond({ identities: [], telegram_relink: null });
    }
    if (path === '/cabinet/branding/ultima-mode') return respond({ enabled: true });
    if (path === '/cabinet/branding/lite-mode') return respond({ enabled: false });
    if (path === '/cabinet/branding') {
      return respond({ name: 'Ultimteam VPN', logo_url: null, logo_letter: 'U' });
    }
    if (path === '/cabinet/branding/colors') return respond(DEFAULT_THEME_COLORS);
    if (path === '/cabinet/branding/themes') return respond(DEFAULT_ENABLED_THEMES);
    if (path === '/cabinet/branding/animation-config') return respond(DEFAULT_ANIMATION_CONFIG);
    if (path === '/cabinet/branding/analytics') return respond({});
    if (path === '/cabinet/branding/gift-enabled') return respond({ enabled: false });
    if (path === '/cabinet/branding/fullscreen') return respond({ enabled: false });
    if (path === '/cabinet/admin/settings') return respond(SETTINGS);
    if (path === '/cabinet/admin/ultima/overview') return respond(OVERVIEW);
    if (path === '/cabinet/admin/settings/metered-traffic/status') {
      return respond({
        enabled: true,
        running: true,
        squad_uuids: ['squad-1'],
        node_uuids: ['node-1'],
        interval_seconds: 60,
        last_run_at: '2026-07-21T12:00:00Z',
        last_error: null,
        subscriptions: { active: 268, initialized: 268, blocked: 4 },
      });
    }

    return respond({});
  });
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
}

test('shows compact Ultima settings without diagnostic clutter on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootstrapAdmin(page);
  await mockAdminApi(page);

  await page.goto('/admin/ultima-settings');

  await expect(page.getByTestId('admin-ultima-settings')).toBeVisible();
  await expect(page.getByTestId('ultima-current-state')).toContainText('Ultima включена');
  await expect(page.getByRole('heading', { name: 'Основное' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Сервис' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Приложение и подключения' })).toBeVisible();
  await expect(page.getByText('Happ и ссылки')).toBeVisible();
  await expect(page.getByText('Mini App', { exact: true }).last()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Диагностика' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Превью /start' })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test('keeps Ultima settings readable and scrollable on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await bootstrapAdmin(page);
  await mockAdminApi(page);

  await page.goto('/admin/ultima-settings');

  await expect(page.getByTestId('admin-ultima-settings')).toBeVisible();
  await expect(page.getByText('Внешний вид')).toBeVisible();
  await expect(page.getByText('Раздельный трафик')).toBeVisible();
  await expect(page.getByText('Happ и ссылки')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
