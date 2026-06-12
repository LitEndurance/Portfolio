const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:\\Users\\willb\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const OUT = path.resolve(__dirname, '..');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [
      '--window-size=1920,889',
      '--hide-scrollbars',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--enable-unsafe-swiftshader',
      '--use-gl=swiftshader',
      '--disable-gpu-sandbox',
    ],
    userDataDir: path.join(OUT, '.tmp-puppeteer-profile-' + Date.now()),
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 889 });
    await page.goto('http://localhost:3004/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('canvas', { timeout: 60000 });
    // Let the boot sequence finish (or auto-skip) so the mountain binary has
    // loaded before we capture the starting view.
    await page.waitForFunction(
      () => !document.querySelector('[aria-label="SummitOS boot sequence"]'),
      { timeout: 30000 }
    );
    // The mountain binary takes a while to decode; wait until the scene is lit.
    await new Promise((r) => setTimeout(r, 30000));

    const scrollPositions = [0, 0.08, 0.25, 0.45, 0.65, 0.85, 0.98];
    for (const p of scrollPositions) {
      const maxScroll = await page.evaluate(() => {
        return document.documentElement.scrollHeight - window.innerHeight;
      });
      const y = Math.round(maxScroll * p);
      await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
      await new Promise((r) => setTimeout(r, 2500));
      const filename = `screenshot-${Math.round(p * 100)}.png`;
      await page.screenshot({
        path: path.join(OUT, filename),
        type: 'png',
      });
      console.log(`Captured ${filename} at scroll ${y} (${Math.round(p * 100)}%)`);
    }
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
