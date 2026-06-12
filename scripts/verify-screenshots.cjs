const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const OUT_DIR = path.join(__dirname, '..', 'out');
const PORT = 8765;

async function main() {
  const server = http.createServer((req, res) => {
    const filePath = path.join(OUT_DIR, req.url === '/' ? 'index.html' : req.url);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath);
      const contentType = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.woff2': 'font/woff2',
        '.bin': 'application/octet-stream',
        '.gz': 'application/gzip',
      }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Serving ${OUT_DIR} on http://localhost:${PORT}`);

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });

  const screenshotDir = path.join(__dirname, '..', 'screenshots-verify');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  // Wait for boot sequence to render and mountain binary to load
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(screenshotDir, '01-hero.png'), fullPage: false });

  // Scroll to each section
  const sections = ['about', 'skills', 'projects', 'gallery', 'contact'];
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, section);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, `${String(i + 2).padStart(2, '0')}-${section}.png`), fullPage: false });
  }

  await browser.close();
  server.close();
  console.log('Screenshots saved to', screenshotDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
