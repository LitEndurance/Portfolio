const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:\\Users\\willb\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const URL = 'http://localhost:57866/';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--window-size=1920,889', '--hide-scrollbars', '--enable-unsafe-swiftshader'],
    userDataDir: path.resolve(__dirname, '..', '.tmp-puppeteer-profile'),
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 889 });
  page.on('console', (msg) => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 5000));
  const html = await page.content();
  console.log('HTML length', html.length);
  console.log('canvas count', await page.evaluate(() => document.querySelectorAll('canvas').length));
  await page.screenshot({ path: path.resolve(__dirname, '..', 'debug-headless.png'), type: 'png' });
  await browser.close();
})();
