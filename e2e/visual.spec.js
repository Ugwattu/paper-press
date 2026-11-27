const { test, expect } = require('@playwright/test');
const { boot, openRail } = require('./helpers');
for (const theme of ['light', 'dark']) {
  test(`layout is clean in ${theme} mode`, async ({ page }, info) => {
    await boot(page, { theme }); await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const noXScroll = async (label) => { const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })); expect(o.sw, `horizontal overflow (${label})`).toBeLessThanOrEqual(o.cw + 1); };
    await noXScroll('paper view'); await page.screenshot({ path: info.outputPath(`${info.project.name}-${theme}-paper.png`), fullPage: false });
    await openRail(page); await noXScroll('settings'); await page.screenshot({ path: info.outputPath(`${info.project.name}-${theme}-settings.png`) });
    /* no two visible interactive controls in the top bar overlap */
    const boxes = await page.$$eval('header button, .topbar button, #tabbar button', (els) => els.filter((e) => e.offsetParent).map((e) => { const r = e.getBoundingClientRect(); return { id: e.id || e.textContent.trim().slice(0, 12), x: r.x, y: r.y, w: r.width, h: r.height }; }));
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) { const a = boxes[i], b = boxes[j]; const ov = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oh = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); expect(ov > 2 && oh > 2, `controls ${a.id} and ${b.id} overlap`).toBeFalsy(); }
    if (info.project.name === 'mobile') {
      await expect(page.locator('#tabbar')).toBeVisible();
      await page.locator('#tabbar [data-tab]').nth(1).click(); await page.screenshot({ path: info.outputPath(`mobile-${theme}-drawer-or-tab.png`) }); await noXScroll('after tab switch');
    }
    for (const att of ['png']) await info.attach(`${info.project.name}-${theme}`, { path: info.outputPath(`${info.project.name}-${theme}-paper.png`), contentType: 'image/png' });
  });
}
