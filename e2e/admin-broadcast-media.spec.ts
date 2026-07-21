import { expect, test, type Page, type Route } from '@playwright/test';
import { DEFAULT_ANIMATION_CONFIG } from '../src/components/ui/backgrounds/types';
import { DEFAULT_ENABLED_THEMES, DEFAULT_THEME_COLORS } from '../src/types/theme';

test.use({ locale: 'ru-RU' });

const USER = {
  id: 99,
  telegram_id: 99001,
  username: 'broadcast_admin',
  first_name: 'Broadcast',
  last_name: 'Admin',
  email: 'admin@example.com',
  email_verified: true,
  balance_kopeks: 0,
  balance_rubles: 0,
  referral_code: 'BROADCAST99',
  language: 'ru',
  created_at: '2026-01-01T00:00:00.000Z',
  auth_type: 'telegram',
};

const BROADCAST = {
  id: 101,
  target_type: 'active',
  message_text: 'Проверка видео',
  has_media: true,
  media_type: 'video',
  media_file_id: 'telegram-video-file-id',
  media_caption: null,
  total_count: 2,
  sent_count: 0,
  failed_count: 0,
  blocked_count: 0,
  status: 'queued',
  admin_id: 99,
  admin_name: 'broadcast_admin',
  created_at: '2026-07-21T12:00:00Z',
  completed_at: null,
  progress_percent: 0,
  channel: 'telegram',
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

async function mockAdminApi(
  page: Page,
  options: { uploadFails?: boolean } = {},
): Promise<{ uploadBodies: string[]; createBodies: unknown[] }> {
  const uploadBodies: string[] = [];
  const createBodies: unknown[] = [];

  await page.route('**/api/**', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, '');
    const respond = async (json: unknown, status = 200) => route.fulfill({ status, json });

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

    if (path === '/cabinet/admin/broadcasts/filters') {
      return respond({
        filters: [
          {
            key: 'active',
            label: 'Активные подписки',
            count: 2,
            group: 'subscription',
          },
        ],
        tariff_filters: [],
        custom_filters: [],
      });
    }
    if (path === '/cabinet/admin/broadcasts/buttons') return respond({ buttons: [] });
    if (path === '/cabinet/admin/broadcasts/preview') {
      return respond({ target: 'active', count: 2 });
    }
    if (path === '/cabinet/media/upload') {
      uploadBodies.push(request.postDataBuffer()?.toString('utf8') || '');
      if (options.uploadFails) {
        return respond({ detail: 'Telegram отклонил этот видеофайл' }, 400);
      }
      return respond(
        {
          media_type: 'video',
          file_id: 'telegram-video-file-id',
          file_unique_id: 'telegram-video-unique-id',
          media_url: '/api/cabinet/media/telegram-video-file-id',
        },
        201,
      );
    }
    if (path === '/cabinet/admin/broadcasts/send' && request.method() === 'POST') {
      createBodies.push(request.postDataJSON());
      return respond(BROADCAST, 201);
    }
    if (path === '/cabinet/admin/broadcasts/101') return respond(BROADCAST);
    if (path === '/cabinet/media/telegram-video-file-id') {
      return route.fulfill({ status: 200, contentType: 'video/mp4', body: '' });
    }

    return respond({});
  });

  return { uploadBodies, createBodies };
}

async function fillTelegramBroadcast(page: Page): Promise<void> {
  const filterButton = page.getByRole('button', { name: 'Выберите фильтр...' });
  await expect(filterButton).toHaveCount(1);
  await filterButton.click();
  await page.getByRole('button', { name: 'Активные подписки 2' }).click();
  await page.getByPlaceholder('Введите текст рассылки...').fill('Проверка видео');
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
}

test('uploads a video with the detected type and includes it in the broadcast', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await bootstrapAdmin(page);
  const captured = await mockAdminApi(page);

  await page.goto('/admin/broadcasts/create');
  await fillTelegramBroadcast(page);
  await page.getByTestId('broadcast-media-input').setInputFiles({
    name: 'announcement.mp4',
    mimeType: 'video/mp4',
    buffer: Buffer.from('fake-video'),
  });

  await expect(page.getByTestId('broadcast-media-ready')).toBeVisible();
  await expect(
    page.getByText('Файл загружен в Telegram и будет отправлен вместе с рассылкой'),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(captured.uploadBodies).toHaveLength(1);
  expect(captured.uploadBodies[0]).toContain('name="media_type"');
  expect(captured.uploadBodies[0]).toContain('video');

  await page.getByRole('button', { name: 'Отправить' }).click();
  await expect(page).toHaveURL(/\/admin\/broadcasts\/101$/);
  expect(captured.createBodies).toEqual([
    expect.objectContaining({
      channel: 'telegram',
      target: 'active',
      media: { type: 'video', file_id: 'telegram-video-file-id' },
    }),
  ]);
});

test('shows a Telegram upload error and prevents an accidental text-only send', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await bootstrapAdmin(page);
  await mockAdminApi(page, { uploadFails: true });

  await page.goto('/admin/broadcasts/create');
  await fillTelegramBroadcast(page);
  await page.getByTestId('broadcast-media-input').setInputFiles({
    name: 'broken.mp4',
    mimeType: 'video/mp4',
    buffer: Buffer.from('broken-video'),
  });

  await expect(page.getByTestId('broadcast-media-error')).toContainText(
    'Telegram отклонил этот видеофайл',
  );
  await expect(page.getByRole('button', { name: 'Отправить' })).toBeDisabled();
  await expect(page.getByTestId('broadcast-media-ready')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});
