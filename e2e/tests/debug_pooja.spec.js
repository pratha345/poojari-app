const { test, expect } = require('@playwright/test');
test('find overflow element on /pooja', async ({ page }) => {
  for (const vp of [{ w:375,h:667,n:'Mobile'}, {w:768,h:1024,n:'Tablet'}, {w:1280,h:720,n:'Desktop'}]) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.goto('http://localhost:5173/pooja', { waitUntil: 'domcontentloaded' });
    // Wait for data to load
    await page.waitForFunction(() => document.querySelectorAll('a[href*="/vidhi/"]').length > 0, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(500);

    const info = await page.evaluate(() => {
      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
      if (!overflow) return { overflow: false };

      // Find which element overflows
      const overflowers = [];
      document.querySelectorAll('*').forEach(el => {
        if (el.scrollWidth > el.clientWidth + 5) {
          overflowers.push({
            tag:   el.tagName,
            cls:   el.className ? el.className.toString().substring(0,60) : '',
            sw:    el.scrollWidth,
            cw:    el.clientWidth,
          });
        }
      });
      return { overflow: true, docSW: document.documentElement.scrollWidth, docCW: document.documentElement.clientWidth, overflowers: overflowers.slice(0,5) };
    });

    console.log(`\n=== ${vp.n} ${vp.w}px ===`);
    console.log(JSON.stringify(info, null, 2));
  }
  expect(true).toBe(true);
});
