/**
 * Renders the Open Graph image (public/og-image.png) with the real type and the
 * real halftone monogram, laid out like the hero. Optional, like render-stills.mjs.
 */
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE ?? 'playwright');

const font = fs
  .readFileSync(require.resolve('@fontsource-variable/albert-sans/files/albert-sans-latin-wght-normal.woff2'))
  .toString('base64');
const code = (
  await build({ entryPoints: ['src/hero/halftone.ts'], bundle: true, format: 'iife', globalName: 'HT', write: false })
).outputFiles[0].text;
const map = `data:image/webp;base64,${fs.readFileSync('src/hero/monogram-map.webp').toString('base64')}`;

const html = `<!doctype html><html><head><style>
@font-face{font-family:Mona;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#0b0b0a;color:#f2f1ec;font-family:Mona;overflow:hidden;position:relative}
.frame{position:absolute;top:0;bottom:0;left:40px;right:40px;border-left:1px solid #2a2a27;border-right:1px solid #2a2a27}
.split{position:absolute;top:0;bottom:0;left:640px;width:1px;background:#2a2a27}
.name{position:absolute;left:74px;top:70px;font-size:106px;font-weight:760;letter-spacing:-.05em;line-height:.9;white-space:nowrap}
.name span{display:block}
.meta{position:absolute;left:76px;bottom:62px;font-size:25px;line-height:1.4;letter-spacing:-.015em}
.meta b{display:block;font-weight:620}
.meta span{display:flex;align-items:center;gap:14px;color:#a3a199}
.meta i{display:block;width:10px;height:10px;background:#f2f1ec}
canvas{position:absolute;left:641px;top:0;width:519px;height:630px;display:block}
.crop{position:absolute;width:18px;height:18px;border:0 solid #4a4944}
.tl{left:657px;top:16px;border-top-width:1px;border-left-width:1px}
.tr{right:56px;top:16px;border-top-width:1px;border-right-width:1px}
.bl{left:657px;bottom:16px;border-bottom-width:1px;border-left-width:1px}
.br{right:56px;bottom:16px;border-bottom-width:1px;border-right-width:1px}
</style></head><body>
<div class="frame"></div><div class="split"></div>
<p class="name"><span>Edwin</span><span>Igwebuike</span></p>
<p class="meta"><b>Brand &amp; Marketing Designer</b><span><i></i>Available for remote roles, worldwide</span></p>
<canvas></canvas>
<div class="crop tl"></div><div class="crop tr"></div><div class="crop bl"></div><div class="crop br"></div>
<script>${code}</script></body></html>`;

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(async (map) => {
  const img = new Image();
  img.src = map;
  await img.decode();
  const c = document.querySelector('canvas');
  window.HT.createHalftoneField(c, { map: img, interactive: false, pitch: 4 }).renderFrame(22, 1);
}, map);
await page.waitForTimeout(200);
await page.screenshot({ path: path.resolve('public/og-image.png') });
await browser.close();
console.log('rendered public/og-image.png');
