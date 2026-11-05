import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';

await build({ entryPoints: ['src/main.ts'], bundle: true, minify: true, format: 'iife', target: 'es2022', outfile: 'assets/portfolio.bundle.js' });
const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
if (relative(root, output) !== 'dist') throw new Error('Build output must stay inside the project dist directory');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'bambi.html', 'studio.html', 'styles.css', 'work.css', 'script.js']) await cp(file, `dist/${file}`);
await cp('assets', 'dist/assets', { recursive: true });
console.log('Production site built in dist/');
