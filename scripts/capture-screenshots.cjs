const puppeteer = require('puppeteer-core');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Users\\willb\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const OUT = path.resolve(__dirname, '..');
const BUILD = path.join(OUT, 'build');

function startServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn('python', ['-u', '-m', 'http.server', '0'], {
      cwd: BUILD,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let port = null;
    const onData = (data) => {
      const text = data.toString();
      if (!port) {
        const m = text.match(/port (\d+)/);
        if (m) {
          port = parseInt(m[1], 10);
          cleanup();
          resolve({ proc, port });
        }
      }
    };

    const cleanup = () => {
      proc.stdout.off('data', onData);
      proc.stderr.off('data', onData);
    };

    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);

    proc.on('error', reject);
    setTimeout(() => reject(new Error('Server failed to start')), 10000);
  });
}

(async () => {
  const { proc, port } = await startServer();
  const url = `http://localhost:${port}/`;

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
    userDataDir: path.join(OUT, '.tmp-puppeteer-profile'),
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 889 });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Wait for mountain binary / WebGL boot
    await page.waitForSelector('canvas', { timeout: 30000 });
    // Dismiss boot overlay if present
    await page.keyboard.press('Enter').catch(() => {});
    await new Promise((r) => setTimeout(r, 4000));

    const ids = ['hero', 'about', 'skills', 'projects', 'gallery', 'contact'];
    for (const id of ids) {
      const top = await page.evaluate((id) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + window.scrollY : 0;
      }, id);
      await page.evaluate((y) => window.scrollTo(0, y), top);
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({
        path: path.join(OUT, `v2-${id}.png`),
        type: 'png',
      });
      console.log(`Captured v2-${id}.png at scroll ${top}`);
    }
  } finally {
    await browser.close();
    proc.kill('SIGTERM');
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
