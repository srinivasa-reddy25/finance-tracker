import { chromium } from 'playwright-core';
import path from 'path';
import fs from 'fs';
const times = process.argv.slice(2).map(Number);
const out = path.resolve('stills');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--force-color-profile=srgb', '--hide-scrollbars'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('file://' + path.resolve('site/index.html'));
await page.waitForFunction(() => window.READY === true, null, { timeout: 20000 });
for (const t of times) {
  await page.evaluate(t => window.renderAt(t), t);
  const f = path.join(out, `t${t.toFixed(2).padStart(5, '0')}.png`);
  await page.screenshot({ path: f });
  console.log(f);
}
await browser.close();
