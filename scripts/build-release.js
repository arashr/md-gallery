#!/usr/bin/env node
/**
 * Production release build — bundled + minified JS/CSS into dist/.
 * Source in assets/, lib/, and modular assets/css/ stays readable for dev (`npm start`).
 */

import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const COPY_FILES = ['index.html', 'config-lab.html', 'LICENSE'];
const COPY_DIRS = ['config', 'docs', 'assets/demo'];

const CSS_ENTRIES = [
  'assets/site.css',
  'assets/reader.css',
  'assets/gallery.css',
  'assets/config-lab.css'
];

const JS_BUNDLES = [
  {
    entry: 'assets/reader.js',
    outfile: 'assets/reader.js',
    splitting: true,
    chunkNames: 'chunks/[name]-[hash]'
  },
  { entry: 'assets/config-lab.js', outfile: 'assets/config-lab.js' }
];

function resetDist() {
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });
}

function copyStatic() {
  for (const file of COPY_FILES) {
    cpSync(join(root, file), join(dist, file));
  }
  for (const dir of COPY_DIRS) {
    cpSync(join(root, dir), join(dist, dir), { recursive: true });
  }
  mkdirSync(join(dist, 'node_modules'), { recursive: true });
  cpSync(join(root, 'node_modules/jspdf'), join(dist, 'node_modules/jspdf'), { recursive: true });
}

function patchHtmlForRelease(filename) {
  const path = join(dist, filename);
  let html = readFileSync(path, 'utf8');
  html = html.replace(/<script type="importmap">[\s\S]*?<\/script>\s*/g, '');
  if (!html.includes('data-release-build')) {
    html = html.replace('<body', '<body data-release-build="true"');
  }
  writeFileSync(path, html);
}

async function bundleJs() {
  await Promise.all(
    JS_BUNDLES.map(({ entry, outfile, splitting, chunkNames }) => {
      const options = {
        entryPoints: [join(root, entry)],
        bundle: true,
        minify: true,
        format: 'esm',
        platform: 'browser',
        target: ['es2020'],
        logLevel: 'info'
      };
      if (splitting) {
        return esbuild.build({
          ...options,
          outdir: join(dist, 'assets'),
          entryNames: '[name]',
          chunkNames: chunkNames || 'chunks/[name]-[hash]',
          splitting: true
        });
      }
      return esbuild.build({
        ...options,
        outfile: join(dist, outfile)
      });
    })
  );
}

async function minifyCss() {
  await esbuild.build({
    entryPoints: CSS_ENTRIES.map((entry) => join(root, entry)),
    outdir: join(dist, 'assets'),
    outbase: join(root, 'assets'),
    bundle: true,
    minify: true,
    logLevel: 'info'
  });
}

async function main() {
  resetDist();
  copyStatic();
  await Promise.all([bundleJs(), minifyCss()]);
  patchHtmlForRelease('index.html');
  patchHtmlForRelease('config-lab.html');
  console.log('Release build → dist/ (bundled + minified JS/CSS)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
