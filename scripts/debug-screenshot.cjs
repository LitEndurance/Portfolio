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
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 8000));
    await page.screenshot({ path: path.join(OUT, 'debug-start.png'), type: 'png' });
    const html = await page.content();
    console.log('Has canvas:', html.includes('<canvas'));
    console.log('Body snippet:', html.slice(0, 500));
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
