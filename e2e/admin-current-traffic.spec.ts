import { expect, test, type Page, type Route } from '@playwright/test';
import { DEFAULT_ANIMATION_CONFIG } from '../src/components/ui/backgrounds/types';
import { DEFAULT_ENABLED_THEMES, DEFAULT_THEME_COLORS } from '../src/types/theme';

test.use({ locale: 'ru-RU' });

const USER = {
  id: 99,
  telegram_id: 99001,
  username: 'traffic_admin',
  first_name: 'Traffic',
  last_name: 'Admin',
  email: 'admin@example.com',
  email_verified: true,
  balance_kopeks: 0,
  balance_rubles: 0,
  referral_code: 'TRAFFIC99',
  language: 'ru',
  created_at: '2026-01-01T00:00:00.000Z',
  auth_type: 'telegram',
};

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

function makeTrafficItem(index: number) {
  const limit = 35 + (index % 3) * 35;
  const used = index === 3 ? limit : Math.min(limit, 4.5 + index * 2);
  return {
    user_id: index,
    telegram_id: 100_000 + index,
    username: `traffic_user_${index}`,
    email: `user${index}@example.com`,
    full_name: `Пользователь ${index}`,
    tariff_id: index % 2 ? 1 : 2,
    tariff_name: index % 2 ? 'Обычный' : 'Стандарт',
    subscription_status: index === 3 ? 'limited' : 'active',
    is_trial: false,
    traffic_limit_gb: limit,
    traffic_used_gb: used,
    traffic_remaining_gb: Math.max(0, limit - used),
    traffic_used_percent: (used / limit) * 100,
    is_unlimited: false,
    is_exhausted: index === 3,
    metered_access_blocked: index === 3,
    purchased_traffic_gb: index === 2 ? 10 : 0,
    device_bonus_traffic_gb: index === 1 ? 35 : 0,
    device_limit: 2 + (index % 4),
    traffic_reset_at: null,
    last_checked_at: '2026-07-17T12:00:00Z',
    end_date: '2026-08-17T12:00:00Z',
  };
}

const TRAFFIC_ITEMS = Array.from({ length: 27 }, (_, index) => makeTrafficItem(index + 1));

async function mockAdminApi(page: Page): Promise<void> {
  await page.route('**/api/**', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, '');
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

    if (path === '/cabinet/admin/traffic/current') {
      const pageNumber = Number(url.searchParams.get('page') || 1);
      const pageSize = Number(url.searchParams.get('page_size') || 25);
      const start = (pageNumber - 1) * pageSize;
      return respond({
        items: TRAFFIC_ITEMS.slice(start, start + pageSize),
        stats: {
          total: TRAFFIC_ITEMS.length,
          limited: TRAFFIC_ITEMS.length,
          unlimited: 0,
          warning: 2,
          exhausted: 1,
          traffic_used_gb: 420.5,
          traffic_limit_gb: 1575,
          traffic_remaining_gb: 1154.5,
          last_checked_at: '2026-07-17T12:00:00Z',
        },
        tariffs: [
          { id: 1, name: 'Обычный' },
          { id: 2, name: 'Стандарт' },
        ],
        total: TRAFFIC_ITEMS.length,
        page: pageNumber,
        page_size: pageSize,
        pages: Math.ceil(TRAFFIC_ITEMS.length / pageSize),
        warning_percent: 80,
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

test('shows current traffic and paginates on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootstrapAdmin(page);
  await mockAdminApi(page);

  await page.goto('/admin/current-traffic');

  await expect(page.getByRole('heading', { name: 'Лимиты трафика' })).toBeVisible();
  await expect(page.getByTestId('traffic-desktop-user-1')).toBeVisible();
  await expect(page.getByText('1 из 2', { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: 'Следующая страница' }).click();
  await expect(page.getByTestId('traffic-desktop-user-26')).toBeVisible();
  await expect(page.getByText('2 из 2', { exact: true })).toBeVisible();
});

test('uses compact traffic cards without overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await bootstrapAdmin(page);
  await mockAdminApi(page);

  await page.goto('/admin/current-traffic');

  await expect(page.getByRole('heading', { name: 'Лимиты трафика' })).toBeVisible();
  const firstUserCard = page.getByTestId('traffic-mobile-user-1');
  await expect(firstUserCard).toBeVisible();
  await expect(firstUserCard.getByText('использовано', { exact: true })).toBeVisible();
  await expect(firstUserCard.getByText('осталось', { exact: true })).toBeVisible();
  await expect(firstUserCard.getByText('лимит, ГБ', { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
