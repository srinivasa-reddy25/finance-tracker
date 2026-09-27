// Renders the film frame-by-frame with adaptive motion blur and 2x supersampling.
// usage: node render.mjs [--workers 3] [--dsf 2] [--from 0] [--to 1440] [--out render/master.mp4]
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []),
);
const FPS = 60;
const DUR = 24.0;
const TOTAL = Math.round(FPS * DUR);
const DSF = Number(args.dsf ?? 2);
const WORKERS = Number(args.workers ?? 3);
const FROM = Number(args.from ?? 0);
const TO = Number(args.to ?? TOTAL);
const OUT = path.resolve(args.out ?? 'render/master.mp4');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const W = 1920;
const H = 1080;

async function worker(a, b, file) {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--force-color-profile=srgb', '--hide-scrollbars'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto('file://' + path.resolve('site/index.html'));
  await page.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
  const cdp = await page.context().newCDPSession(page);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '6', '-pix_fmt', 'yuv444p', '-r', String(FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const acc = new Float32Array(W * H * 3);
  const out = Buffer.alloc(W * H * 3);
  const grab = async (t, smp, frameT) => {
    await page.evaluate(([t, smp, ft]) => window.renderAt(t, smp, ft), [t, smp, frameT]);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 97, optimizeForSpeed: true });
    let img = sharp(Buffer.from(data, 'base64'));
    if (DSF !== 1) img = img.resize(W, H, { kernel: 'lanczos3' });
    return img.removeAlpha().raw().toBuffer();
  };
  const t0 = Date.now();
  for (let f = a; f < b; f++) {
    const t = f / FPS;
    const { n, shutter } = await page.evaluate(t => window.samplesAt(t), t);
    if (n <= 1) {
      const buf = await grab(t, { n, shutter }, t);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    } else {
      acc.fill(0);
      for (let k = 0; k < n; k++) {
        const ts = Math.min(DUR - 1e-4, Math.max(0, t + (k / (n - 1) - 0.5) * (shutter / FPS)));
        const buf = await grab(ts, { n, shutter }, t);
        for (let i = 0; i < buf.length; i++) acc[i] += buf[i];
      }
      for (let i = 0; i < out.length; i++) out[i] = Math.min(255, Math.round(acc[i] / n));
      if (!ff.stdin.write(out)) await new Promise(r => ff.stdin.once('drain', r));
    }
    if ((f - a) % 60 === 0) console.log(`[${a}-${b}] frame ${f} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
}

if (args.child) {
  const [a, b] = args.child.split(':').map(Number);
  await worker(a, b, args.file);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const n = TO - FROM;
const parts = [];
const procs = [];
for (let w = 0; w < WORKERS; w++) {
  const a = FROM + Math.floor((n * w) / WORKERS);
  const b = FROM + Math.floor((n * (w + 1)) / WORKERS);
  const file = OUT.replace(/\.mp4$/, `.part${w}.mp4`);
  parts.push(file);
  procs.push(new Promise((res, rej) => {
    const p = spawn(process.execPath, [process.argv[1], '--child', `${a}:${b}`, '--file', file, '--dsf', String(DSF)], { stdio: 'inherit' });
    p.on('close', c => (c === 0 ? res() : rej(new Error('worker failed ' + c))));
  }));
}
const T0 = Date.now();
await Promise.all(procs);
const list = OUT.replace(/\.mp4$/, '.txt');
fs.writeFileSync(list, parts.map(p => `file '${p}'`).join('\n'));
await new Promise((res, rej) => {
  const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', OUT], { stdio: 'inherit' });
  p.on('close', c => (c === 0 ? res() : rej(new Error('concat failed'))));
});
console.log(`done ${OUT} in ${((Date.now() - T0) / 1000).toFixed(0)}s`);
