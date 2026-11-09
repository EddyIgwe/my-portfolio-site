/**
 * Injects server-rendered HTML into the built pages so the site is readable,
 * indexable and fast before any JavaScript runs.
 * Usage: node scripts/prerender.mjs <outDir> <ssrDir>
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const outDir = process.argv[2] ?? 'dist';
const ssrDir = process.argv[3] ?? '.ssr';
const { render } = await import(pathToFileURL(path.resolve(ssrDir, 'entry-server.js')).href);

const assetsDir = path.join(outDir, 'assets');
const font = fs.existsSync(assetsDir)
  ? fs.readdirSync(assetsDir).find((f) => /^albert-sans-latin-wght-normal.*\.woff2$/.test(f))
  : undefined;
const preload = font ? `<link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin />` : '';

for (const [file, page] of [
  ['index.html', 'home'],
  ['404.html', '404'],
]) {
  const target = path.join(outDir, file);
  if (!fs.existsSync(target)) continue;
  let html = fs.readFileSync(target, 'utf8');
  html = html.replace('<!--app-html-->', render(page)).replace('<!--preload-font-->', preload);
  fs.writeFileSync(target, html);
  console.log(`prerendered ${target}`);
}
