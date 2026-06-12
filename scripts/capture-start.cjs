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
    userDataDir: path.join(OUT, '.tmp-puppeteer-profile-' + Date.now()),
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 889 });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('canvas', { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 4000));

    for (const p of [0, 0.02, 0.04, 0.06, 0.08, 0.10]) {
      const maxScroll = await page.evaluate(() => {
        return document.documentElement.scrollHeight - window.innerHeight;
      });
      const y = Math.round(maxScroll * p);
      await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
      await new Promise((r) => setTimeout(r, 1200));
      await page.screenshot({
        path: path.join(OUT, `start-${Math.round(p * 100)}.png`),
        type: 'png',
      });
      console.log(`Captured start-${Math.round(p * 100)}.png at scroll ${y}`);
    }
  } finally {
    await browser.close();
    proc.kill('SIGTERM');
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
