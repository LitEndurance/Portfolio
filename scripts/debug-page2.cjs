const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:\\Users\\willb\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const URL = 'http://localhost:57869/';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--window-size=1920,889', '--hide-scrollbars', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
    userDataDir: path.resolve(__dirname, '..', '.tmp-puppeteer-profile2'),
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 889 });
  page.on('console', (msg) => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 6000));
  const canvasCount = await page.evaluate(() => document.querySelectorAll('canvas').length);
  console.log('canvas count', canvasCount);
  await page.screenshot({ path: path.resolve(__dirname, '..', 'debug-57869.png'), type: 'png' });
  await browser.close();
})();
