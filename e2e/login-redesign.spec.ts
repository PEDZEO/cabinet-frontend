import { expect, test, type Page, type Route } from '@playwright/test';

const THEME_CONFIG = {
  themePresetId: 'login-redesign-test',
  animationPresetId: 'orbital-aura',
  primaryColor: '#2bd3a3',
  primaryTextColor: '#04120f',
  secondaryColor: '#0a2925',
  secondaryTextColor: '#f4fffb',
  navBackgroundColor: '#0c312c',
  navActiveColor: '#2bd3a3',
  navTextColor: '#d9fff3',
  backgroundTopColor: '#03171d',
  backgroundBottomColor: '#071f28',
  auraColor: '#2bd3a3',
  ringColor: '#a8ffe4',
  surfaceColor: '#0b2a27',
  surfaceBorderColor: '#8aeed1',
  scrollbarThumbColor: '#42d7aa',
  scrollbarTrackColor: '#0a2424',
  contentEnterMs: 260,
  tapRingMs: 620,
  ringWaveSec: 11,
  sliderGlowSec: 2,
  stepRingSec: 4.5,
  successWaveMs: 850,
  itemEnterMs: 210,
  framesEnabled: false,
  homeUseBrandLogo: false,
};

async function mockLoginApi(page: Page) {
  await page.route('**/api/**', async (route: Route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');

    if (path === '/cabinet/branding/logo') {
      await route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="72"><rect width="180" height="72" rx="12" fill="#2bd3a3"/></svg>',
      });
      return;
    }
    if (path === '/cabinet/branding') {
      await route.fulfill({
        status: 200,
        json: {
          name: 'Theme test brand',
          logo_url: '/cabinet/branding/logo',
          logo_letter: 'T',
          has_custom_logo: true,
        },
      });
      return;
    }
    if (path === '/cabinet/branding/ultima-mode') {
      await route.fulfill({ status: 200, json: { enabled: true } });
      return;
    }
    if (path === '/cabinet/branding/lite-mode') {
      await route.fulfill({ status: 200, json: { enabled: false } });
      return;
    }
    if (path === '/cabinet/branding/ultima-theme-config') {
      await route.fulfill({ status: 200, json: THEME_CONFIG });
      return;
    }
    if (path === '/cabinet/branding/email-auth') {
      await route.fulfill({ status: 200, json: { enabled: true } });
      return;
    }
    if (path === '/cabinet/auth/oauth/providers') {
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
    if (path === '/cabinet/info/languages') {
      await route.fulfill({
        status: 200,
        json: { languages: [{ code: 'ru', name: 'Русский', flag: 'RU' }] },
      });
      return;
    }

    await route.fulfill({ status: 404, json: { detail: 'not configured in login test' } });
  });
}

async function openLogin(page: Page) {
  await mockLoginApi(page);
  await page.addInitScript((themeConfig) => {
    localStorage.setItem('cabinet_language', 'ru');
    localStorage.setItem('cabinet_ultima_mode', 'true');
    localStorage.setItem('cabinet_ultima_theme_config', JSON.stringify(themeConfig));
  }, THEME_CONFIG);
  await page.goto('/login');
  await expect(page.locator('#app-startup-overlay')).toHaveCount(0);
}

test('opens email login and registration without exposing the full form on the first screen', async ({
  page,
}) => {
  await openLogin(page);

  await expect(page.getByRole('heading', { name: 'Выберите способ входа' })).toBeVisible();
  await expect(page.locator('input[name="email"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Theme test brand' })).toHaveCount(0);
  await expect(page.locator('img[alt="Theme test brand"]')).toBeVisible();
  await expect(page.locator('.auth-brand-signature')).toBeVisible();
  await expect(page.locator('.auth-brand-scene')).toHaveCount(0);

  const methodIconColor = await page
    .locator('.auth-method-icon')
    .first()
    .evaluate((element) => getComputedStyle(element).color);
  expect(methodIconColor).toBe('rgb(43, 211, 163)');

  await page.getByRole('button', { name: /Войти по Email/i }).click();
  await expect(page.getByRole('heading', { name: 'Вход в личный кабинет' })).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();

  await page.getByRole('button', { name: 'Все способы входа' }).click();
  await expect(page.getByRole('heading', { name: 'Выберите способ входа' })).toBeVisible();
  await expect(page.locator('input[name="email"]')).toHaveCount(0);

  await page.getByRole('button', { name: /Создать аккаунт/i }).click();
  await expect(page.getByRole('heading', { name: 'Создать аккаунт' })).toBeVisible();
  await expect(page.locator('input[name="firstName"]')).toBeVisible();
  await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
});

test('keeps the redesigned login within a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLogin(page);

  await expect(page.getByRole('heading', { name: 'Выберите способ входа' })).toBeVisible();
  const viewportMetrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewportMetrics.scrollWidth).toBeLessThanOrEqual(viewportMetrics.clientWidth);

  await page.getByRole('button', { name: /Войти по Email/i }).click();
  const emailField = page.locator('input[name="email"]');
  await expect(emailField).toBeVisible();
  await expect
    .poll(async () =>
      emailField.evaluate((input) => {
        const rect = input.getBoundingClientRect();
        const viewportWidth = document.documentElement.clientWidth;

        return Math.max(0, Math.round(-rect.left), Math.round(rect.right - viewportWidth));
      }),
    )
    .toBe(0);

  const emailViewportMetrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(emailViewportMetrics.scrollWidth).toBeLessThanOrEqual(emailViewportMetrics.clientWidth);
});
