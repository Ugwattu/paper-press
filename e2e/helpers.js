const { expect } = require('@playwright/test');
/* Boot the app with the onboarding tour suppressed and wait for the first paper. */
async function boot(page, { theme } = {}) {
  await page.addInitScript((t) => { try { localStorage.setItem('pp.tutorial.v4', '1'); if (t) localStorage.setItem('pp.theme', JSON.stringify(t)); } catch (e) { /* ignore */ } }, theme || null);
  await page.goto('/index.html');
  await expect(page.locator('#sheet')).toContainText(/Paper|Objective|OBJECTIVE/, { timeout: 30000 });
  /* dismiss the tour if its completion key differs from the one assumed above */
  const end = page.getByRole('button', { name: /end tour|skip/i });
  if (await end.first().isVisible().catch(() => false)) await end.first().click();
}
/* On phones the settings rail lives behind the tab bar. */
async function openRail(page) { const t = page.locator('#tabbar [data-tab="rail"]'); if (await t.isVisible().catch(() => false)) await t.click(); }
module.exports = { boot, openRail };
