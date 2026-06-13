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
          proc.stdout.off('data', onData);
          proc.stderr.off('data', onData);
          resolve({ proc, port });
        }
      }
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
    args: ['--window-size=1920,889', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
    userDataDir: path.join(OUT, '.tmp-debug-profile'),
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 889 });
    page.on('console', (msg) => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    const hasCanvas = await page.evaluate(() => !!document.querySelector('canvas'));
    console.log('hasCanvas:', hasCanvas);
    const body = await page.evaluate(() => document.body.innerHTML.slice(0, 500));
    console.log('body:', body);
    await page.screenshot({ path: path.join(OUT, 'debug-canvas.png'), type: 'png' });
  } finally {
    await browser.close();
    proc.kill('SIGTERM');
  }
})().catch((err) => { console.error(err); process.exit(1); });
