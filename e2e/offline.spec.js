const { test, expect } = require('@playwright/test');
const { boot } = require('./helpers');
test('app boots and generates a paper with the network cut', async ({ page, context }) => {
  await boot(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(async () => page.evaluate(async () => (await caches.keys()).filter((k) => k.startsWith('pp-')).length), { timeout: 30000 }).toBe(2);
  await page.reload(); await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(async () => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#sheet')).toContainText(/Paper|Objective/i, { timeout: 30000 });
  await page.locator('#miniShuffle').click(); await expect(page.locator('#tagSeed')).toContainText('Set V-');
  const fonts = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family); });
  expect(fonts.length).toBeGreaterThan(0);
  await context.setOffline(false);
});
