const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: 'e2e', timeout: 60000, retries: process.env.CI ? 1 : 0, reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', acceptDownloads: true, serviceWorkers: 'allow' },
  webServer: { command: 'node tools/static-server.js 4173', url: 'http://127.0.0.1:4173/index.html', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }
  ]
});
