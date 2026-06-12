const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Users\\willb\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const URL = 'http://localhost:57869/';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--window-size=1920,889', '--hide-scrollbars', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
    userDataDir: path.resolve(__dirname, '..', '.tmp-puppeteer-profile3'),
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 889 });
  const logs = [];
  page.on('console', (msg) => logs.push(`CONSOLE ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`PAGEERROR: ${err.message}`));
  page.on('response', (resp) => {
    if (resp.status() >= 400) logs.push(`HTTP ${resp.status()}: ${resp.url()}`);
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 6000));
  const html = await page.content();
  fs.writeFileSync(path.resolve(__dirname, '..', 'debug-57869.html'), html);
  const text = await page.evaluate(() => document.body.innerText.slice(0, 800));
  console.log('BODY TEXT:', text);
  console.log('canvas count', await page.evaluate(() => document.querySelectorAll('canvas').length));
  console.log('LOGS:\n', logs.join('\n'));
  await page.screenshot({ path: path.resolve(__dirname, '..', 'debug-57869.png'), type: 'png' });
  await browser.close();
})();
