/**
 * Renders the still versions of the halftone monogram (used on phones and for
 * reduced motion) with the same WebGL code as the live hero.
 *
 * Optional: the stills are already in public/hero. Re-run only after changing
 * src/hero/halftone.ts or the monogram map.
 *
 *   npm i -D playwright && npx playwright install chromium
 *   node scripts/render-stills.mjs && python3 scripts/encode-stills.py
 *
 * Output: PNG files in .stills/, converted to WebP by scripts/encode-stills.py.
 */
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE ?? 'playwright');

const out = path.resolve('.stills');
fs.mkdirSync(out, { recursive: true });

const code = (
  await build({ entryPoints: ['src/hero/halftone.ts'], bundle: true, format: 'iife', globalName: 'HT', write: false })
).outputFiles[0].text;
const map = `data:image/webp;base64,${fs.readFileSync('src/hero/monogram-map.webp').toString('base64')}`;

// Sizes match the hero's field cell: tall on desktop, near-square on phones. Rendered at 2x.
// The phone still uses a finer dot pitch so the script strokes hold at a small size.
const stills = [
  { name: 'monogram-still', width: 560, height: 800, time: 22, pitch: 4 },
  { name: 'monogram-still-mobile', width: 360, height: 400, time: 22, pitch: 3.5 },
];

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
for (const s of stills) {
  const page = await browser.newPage({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: 2 });
  await page.setContent(
    `<!doctype html><style>html,body{margin:0;background:transparent}canvas{display:block;width:${s.width}px;height:${s.height}px}</style><canvas></canvas><script>${code}</script>`,
  );
  const dataUrl = await page.evaluate(
    async ({ time, pitch, map }) => {
      const img = new Image();
      img.src = map;
      await img.decode();
      const canvas = document.querySelector('canvas');
      const field = window.HT.createHalftoneField(canvas, { map: img, interactive: false, pitch });
      field.renderFrame(time, 1);
      return canvas.toDataURL('image/png');
    },
    { time: s.time, pitch: s.pitch, map },
  );
  fs.writeFileSync(path.join(out, `${s.name}.png`), Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`rendered ${s.name}.png`);
  await page.close();
}
await browser.close();
