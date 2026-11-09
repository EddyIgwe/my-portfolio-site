/**
 * Draws the EI monogram (Great Vibes script letters inside a ring) and writes the
 * map the hero's halftone prints: green = where the mark is, blue = a rounded
 * height so the letters and ring stand up in relief. Red is unused.
 *
 *   npm i -D playwright && npx playwright install chromium
 *   node scripts/make-monogram.mjs
 *
 * Output: src/hero/monogram-map.webp (512 x 512, lossless; needs Python with Pillow,
 * like scripts/encode-stills.py)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE ?? 'playwright');
const FONT = process.env.MONO_FONT ?? 'great-vibes';
const font = fs
  .readFileSync(require.resolve(`@fontsource/${FONT}/files/${FONT}-latin-400-normal.woff2`))
  .toString('base64');
const [X, Y, SIZE, STROKE] = (process.env.MONO_TEXT ?? '99,108,88,3.6').split(',').map(Number);
const OUT = process.env.MONO_OUT ?? 'src/hero/monogram-map.webp';

// The mark, on a 200 x 200 drawing: a ring, and the letters thickened with a round stroke.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="512" height="512">
<style>@font-face{font-family:Mono;src:url(data:font/woff2;base64,${font}) format('woff2')}</style>
<circle cx="100" cy="100" r="88" fill="none" stroke="#fff" stroke-width="9"/>
<text x="${X}" y="${Y}" dominant-baseline="middle" text-anchor="middle" font-family="Mono" font-size="${SIZE}"
  fill="#fff" stroke="#fff" stroke-width="${STROKE}" stroke-linejoin="round">EI</text></svg>`;

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();
await page.setContent(`<style>@font-face{font-family:Mono;src:url(data:font/woff2;base64,${font}) format('woff2')}</style><span style="font-family:Mono">EI</span>`);
await page.evaluate(() => document.fonts.ready);
const dataUrl = await page.evaluate(async (svg) => {
  const S = 512;
  const img = new Image();
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  await img.decode();
  const mark = new OffscreenCanvas(S, S).getContext('2d');
  mark.drawImage(img, 0, 0, S, S);
  const soft = new OffscreenCanvas(S, S).getContext('2d');
  soft.filter = 'blur(5px)';
  soft.drawImage(img, 0, 0, S, S);
  const a = mark.getImageData(0, 0, S, S).data;
  const b = soft.getImageData(0, 0, S, S).data;
  let peak = 0;
  for (let i = 3; i < b.length; i += 4) peak = Math.max(peak, b[i]);
  const out = new ImageData(S, S);
  for (let i = 0; i < a.length; i += 4) {
    const m = a[i + 3] / 255;
    const h = Math.sqrt(b[i + 3] / peak); // rounded, pillowy profile (smooth across stroke edges)
    out.data[i] = 0;
    out.data[i + 1] = Math.round(m * 255);
    out.data[i + 2] = Math.round(Math.min(1, h) * 255);
    out.data[i + 3] = 255;
  }
  const c = document.createElement('canvas');
  c.width = c.height = S;
  c.getContext('2d').putImageData(out, 0, 0);
  return c.toDataURL('image/png');
}, svg);
fs.mkdirSync('.stills/map', { recursive: true });
const png = path.resolve('.stills/map/monogram-map.png');
fs.writeFileSync(png, Buffer.from(dataUrl.split(',')[1], 'base64'));
if (OUT.endsWith('.png')) fs.copyFileSync(png, OUT);
else
  execFileSync('python3', ['-c', 'import sys; from PIL import Image; Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2], "WEBP", lossless=True, method=6)', png, OUT]);
await browser.close();
console.log(`wrote ${OUT}`);
