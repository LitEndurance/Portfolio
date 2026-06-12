const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:\\Users\\willb\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const URL = 'http://localhost:57871/';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--window-size=1920,889', '--hide-scrollbars', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
    userDataDir: path.resolve(__dirname, '..', '.tmp-puppeteer-profile-measure'),
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 889 });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.keyboard.press('Enter').catch(() => {});
  await new Promise((r) => setTimeout(r, 4000));
  const data = await page.evaluate(() => {
    const ids = ['hero', 'about', 'skills', 'projects', 'gallery', 'contact'];
    const total = document.documentElement.scrollHeight - window.innerHeight;
    return ids.map((id) => {
      const el = document.getElementById(id);
      const top = el ? el.getBoundingClientRect().top + window.scrollY : 0;
      return { id, top, progress: top / total, height: el ? el.getBoundingClientRect().height : 0 };
    }).concat({ totalScrollable: total, scrollHeight: document.documentElement.scrollHeight, innerHeight: window.innerHeight });
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
