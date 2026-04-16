const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  try {
    await page.goto('http://127.0.0.1:5173/login');
    await page.fill('input[type="email"]', 'yashrajvaghela@gmail.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    const docs = await page.locator('h3').first();
    await docs.click();

    await page.waitForTimeout(2000);
  } catch (e) {
    console.error('TEST ERROR:', e);
  } finally {
    await browser.close();
  }
})();
