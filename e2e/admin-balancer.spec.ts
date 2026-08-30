import { expect, test, type Page, type Route } from '@playwright/test';
import { DEFAULT_ANIMATION_CONFIG } from '../src/components/ui/backgrounds/types';
import { DEFAULT_ENABLED_THEMES, DEFAULT_THEME_COLORS } from '../src/types/theme';

test.use({ locale: 'ru-RU' });

const USER = {
  id: 99,
  telegram_id: 99001,
  username: 'balancer_admin',
  first_name: 'Balancer',
  last_name: 'Admin',
  email: 'admin@example.com',
  email_verified: true,
  balance_kopeks: 0,
  balance_rubles: 0,
  referral_code: 'BALANCER99',
  language: 'ru',
  created_at: '2026-01-01T00:00:00.000Z',
  auth_type: 'telegram',
};

const HOSTS = [
  {
    uuid: 'host-poland',
    remark: 'PL Польша',
    address: 'pl.example.com',
    port: 443,
    is_disabled: false,
  },
  {
    uuid: 'host-germany',
    remark: 'DE Германия',
    address: 'de.example.com',
    port: 443,
    is_disabled: false,
  },
  {
    uuid: 'host-net-cdn',
    remark: 'NL Net CDN',
    address: 'cdn.example.com',
    port: 80,
    is_disabled: false,
  },
  {
    uuid: 'host-test',
    remark: 'RU test',
    address: 'test.example.com',
    port: 80,
    is_disabled: false,
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

    if (path === '/cabinet/admin/balancer/status') {
      return respond({
        configured: true,
        base_url: 'https://sub.example.com',
        has_admin_token: true,
        request_timeout_sec: 10,
      });
    }
    if (path === '/cabinet/admin/balancer/health') {
      return respond({ status: 'ok', groups: ['Польша', 'Германия'], node_stats: 4 });
    }
    if (path === '/cabinet/admin/balancer/ready') return respond({ status: 'ready' });
    if (path === '/cabinet/admin/balancer/debug/stats') {
      return respond({ status: 'ok', profile_mode: 'stable', runtime_stats: {} });
    }
    if (path === '/cabinet/admin/balancer/groups') {
      return respond({
        status: 'ok',
        groups: {
          'PL Польша': [],
          'DE Германия': [],
          'RU Спецсерверы': [],
        },
        group_descriptions: {
          'PL Польша': 'Основной сервер Польши',
          'RU Спецсерверы': 'Для тарифицируемого трафика',
        },
        group_hosts: {
          'PL Польша': ['host-poland'],
          'DE Германия': ['host-germany'],
          'RU Спецсерверы': ['host-net-cdn', 'host-test'],
        },
        fastest_group: true,
        fastest_group_name: 'Самые быстрые',
        fastest_exclude_groups: [],
        fastest_fallback: [],
        node_stats_exclude: [],
        expand_groups_to_nodes: [],
        hidden_groups: [],
        hidden_nodes: [],
      });
    }
    if (path === '/cabinet/admin/balancer/hosts') {
      return respond({ status: 'ok', hosts: HOSTS, total: HOSTS.length, enabled: HOSTS.length });
    }
    if (path === '/cabinet/admin/balancer/quarantine') {
      return respond({ status: 'ok', quarantine_nodes: [], quarantine_count: 0 });
    }
    if (path === '/cabinet/admin/balancer/attack-mode') {
      return respond({ status: 'ok', protection_enabled: true, nodes: [] });
    }
    if (path === '/cabinet/admin/balancer/health-metrics') {
      return respond({
        poland: {
          nodeName: 'PL Польша',
          lastRttMs: 34,
          avgRttMs: 38,
          jitterMs: 4,
          lossPercent: 0,
          rstCount: 0,
          throttled: false,
          partialBlock: false,
          lastCheckAt: 1788100000000,
        },
        germany: {
          nodeName: 'DE Германия',
          lastRttMs: 120,
          avgRttMs: 110,
          jitterMs: 32,
          lossPercent: 3,
          rstCount: 1,
          throttled: false,
          partialBlock: true,
          lastCheckAt: 1788100000000,
        },
      });
    }
    if (path === '/cabinet/admin/balancer/node-stats') {
      return respond({
        'PL Польша': {
          usersOnline: 20,
          cpuCount: 4,
          totalRamGb: 8,
          cpuLoad: 5,
          ramLoad: 2.5,
          isConnected: true,
          isDisabled: false,
        },
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

test('keeps groups compact and shows existing server assignments', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootstrapAdmin(page);
  await mockAdminApi(page);
  await page.goto('/admin/balancer');

  await expect(page.getByRole('heading', { name: 'Группы серверов' })).toBeVisible();
  await expect(page.getByRole('button', { name: /PL Польша/ })).toBeVisible();
  await expect(page.getByText('pl.example.com:443')).toBeHidden();

  await page.getByRole('button', { name: /DE Германия/ }).click();
  await expect(page.getByText('В группах: PL Польша')).toBeVisible();
  await expect(page.getByText('В группах: RU Спецсерверы')).toHaveCount(2);

  const initialHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(initialHeight).toBeLessThan(1800);
  await expectNoHorizontalOverflow(page);
});

test('shows readable quality cards and stays compact on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await bootstrapAdmin(page);
  await mockAdminApi(page);
  await page.goto('/admin/balancer');

  await page.getByRole('button', { name: 'Серверы', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Качество соединения' })).toBeVisible();
  await expect(page.getByText('Стабильно', { exact: true })).toBeVisible();
  await expect(page.getByText('Часть сайтов может быть недоступна')).toBeVisible();
  await expect(page.getByText('Загрузка серверов')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
