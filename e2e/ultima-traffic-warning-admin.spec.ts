import { expect, test, type Page, type Route } from '@playwright/test';
import { DEFAULT_ANIMATION_CONFIG } from '../src/components/ui/backgrounds/types';
import { DEFAULT_ENABLED_THEMES, DEFAULT_THEME_COLORS } from '../src/types/theme';

test.use({ locale: 'ru-RU' });

const USER = {
  id: 99,
  telegram_id: 99001,
  username: 'admin_smoke',
  first_name: 'Admin',
  last_name: 'Smoke',
  email: 'admin@example.com',
  email_verified: true,
  balance_kopeks: 0,
  balance_rubles: 0,
  referral_code: 'ADMIN99',
  language: 'ru',
  created_at: '2026-01-01T00:00:00.000Z',
  auth_type: 'telegram',
};

const SETTINGS: Record<string, boolean | number | string> = {
  WEBHOOK_NOTIFY_BANDWIDTH_THRESHOLD: true,
  ULTIMA_TRAFFIC_WARNING_DEFAULT_PERCENT: 80,
  ULTIMA_TRAFFIC_WARNING_MESSAGE_RU:
    '📊 <b>Трафик почти закончился</b>\n\nОсталось <b>{remaining_gb} ГБ</b>.',
};

function createFakeJwt(): string {
  const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  const payload = 'eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6Ijk5In0';
  return `${header}.${payload}.signature`;
}

async function bootstrapAdmin(page: Page) {
  await page.addInitScript((jwt) => {
    sessionStorage.setItem('access_token', jwt);
    localStorage.setItem('refresh_token', jwt);
    localStorage.setItem('cabinet_ultima_mode', 'true');
    localStorage.setItem('cabinet_lite_mode', 'false');
  }, createFakeJwt());
}

async function mockAdminApi(page: Page, updatedKeys: string[]) {
  await page.route('**/api/**', async (route: Route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api/, '');
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

    const settingsMatch = path.match(/^\/cabinet\/admin\/settings\/(.+)$/);
    if (settingsMatch) {
      const key = decodeURIComponent(settingsMatch[1]);
      if (request.method() === 'PUT') {
        const payload = request.postDataJSON() as { value: boolean | number | string };
        SETTINGS[key] = payload.value;
        updatedKeys.push(key);
      }
      return respond({
        key,
        name: key,
        category: { key: 'WEBHOOK_NOTIFICATIONS', label: 'Уведомления' },
        type: typeof SETTINGS[key] === 'boolean' ? 'bool' : typeof SETTINGS[key],
        is_optional: false,
        current: SETTINGS[key],
        original: SETTINGS[key],
        has_override: false,
        read_only: false,
        choices: [],
      });
    }

    return respond({});
  });
}

test('edits the traffic warning without overflowing a phone viewport', async ({ page }) => {
  const updatedKeys: string[] = [];
  await page.setViewportSize({ width: 390, height: 844 });
  await bootstrapAdmin(page);
  await mockAdminApi(page, updatedKeys);

  await page.goto('/admin/ultima-settings/traffic-warning');

  await expect(page.getByRole('heading', { name: 'Заканчивается трафик' })).toBeVisible();
  await expect(page.getByText('Докупить трафик', { exact: true })).toBeVisible();
  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

  const percentInput = page.getByRole('spinbutton');
  await percentInput.fill('85');
  await page.getByRole('textbox').fill('Осталось {remaining_gb} ГБ из {limit_gb} ГБ');

  await expect(page.getByText('Осталось 15 ГБ из 100 ГБ')).toBeVisible();
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await expect(page.getByText('Настройки предупреждения сохранены.')).toBeVisible();

  expect(updatedKeys.sort()).toEqual(Object.keys(SETTINGS).sort());
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
