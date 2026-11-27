const { test, expect } = require('@playwright/test');
const JSZip = require('jszip'); const fs = require('fs');
const { boot, openRail } = require('./helpers');

test('boots with a paper and a 20-course picker', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await boot(page); await openRail(page);
  await expect(page.locator('#gradeCard [data-grade]')).toHaveCount(4);
  await expect(page.locator('#courseGrid [data-course]')).toHaveCount(5);
  expect(errors).toEqual([]);
});

test('11th and 12th show group chips; 9th does not', async ({ page }) => {
  await boot(page); await openRail(page);
  await page.locator('#gradeCard [data-grade="11"]').click();
  await expect(page.locator('#groupBar')).toBeVisible();
  const chips = page.locator('#groupBar [data-group]'); expect(await chips.count()).toBeGreaterThan(2);
  await expect(chips.first()).toHaveAttribute('aria-pressed', 'true');
  await chips.nth(1).click(); await expect(chips.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#gradeCard [data-grade="9"]').click(); await expect(page.locator('#groupBar')).toBeHidden();
});

test('switch course, generate a paper, undo and redo', async ({ page }) => {
  await boot(page); await openRail(page);
  await page.locator('#gradeCard [data-grade="10"]').click();
  await page.locator('#courseGrid [data-course="10-computer"]').click();
  await expect(page.locator('#selectedCourse')).toContainText('10');
  const seed = () => page.locator('#tagSeed').innerText();
  const before = await seed();
  await page.locator('#miniShuffle').click(); await page.waitForTimeout(700);
  const after = await seed(); expect(after).not.toBe(before);
  await page.locator('#btnUndo').click(); await expect.poll(seed).toBe(before);
  await page.locator('#btnRedo').click(); await expect.poll(seed).toBe(after);
});

test('save a backup and restore it', async ({ page }, info) => {
  await boot(page); await openRail(page);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#btnBackup').click()]);
  const file = info.outputPath('backup.json'); await dl.saveAs(file);
  const j = JSON.parse(fs.readFileSync(file, 'utf8')); expect(j.app).toBe('paper-press-backup'); expect(Object.keys(j.data)).toContain('pp.state.v7');
  page.on('dialog', (d) => d.accept());
  await page.locator('#backupFile').setInputFiles(file);
  await page.waitForLoadState('load'); await expect(page.locator('#sheet')).toContainText(/Paper|Objective/i, { timeout: 30000 });
});

test('export .docx is a valid zip with word/document.xml', async ({ page }) => {
  await boot(page);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#btnExp').click()]);
  expect(dl.suggestedFilename()).toMatch(/\.docx$/i);
  const path = await dl.path(); const zip = await JSZip.loadAsync(fs.readFileSync(path), { checkCRC32: true });
  expect(Object.keys(zip.files)).toContain('word/document.xml');
  const xml = await zip.file('word/document.xml').async('string'); expect(xml).toMatch(/<w:document[\s>]/); expect(xml).toMatch(/<w:bidi\/>/);
});
