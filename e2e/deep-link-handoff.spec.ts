import { expect, test } from '@playwright/test';

test.describe('Telegram deep-link handoff', () => {
  test('keeps a safe custom protocol available as a manual fallback', async ({ page }) => {
    const deepLink = 'happ://crypt5/test-payload';
    await page.goto(
      `/miniapp/redirect.html?autostart=0&lang=ru&url=${encodeURIComponent(deepLink)}`,
    );

    const openButton = page.getByRole('link', { name: 'Открыть приложение' });
    await expect(openButton).toBeVisible();
    await expect(openButton).toHaveAttribute('href', deepLink);
  });

  test('rejects executable and web protocols', async ({ page }) => {
    // eslint-disable-next-line no-script-url -- verifies that the handoff rejects script URLs
    for (const unsafeLink of ['javascript:alert(1)', 'https://example.com/subscription']) {
      await page.goto(`/miniapp/redirect.html?lang=ru&url=${encodeURIComponent(unsafeLink)}`);
      await expect(page.getByRole('heading', { name: 'Некорректная ссылка' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Открыть приложение' })).toBeHidden();
    }
  });
});
