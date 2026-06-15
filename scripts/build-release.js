#!/usr/bin/env node
/**
 * Production release build — minified JS/CSS into dist/.
 * Source in assets/, lib/, and modular assets/css/ stays readable for dev (`npm start`).
 */

import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
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

const ASSET_JS = ['assets/reader.js', 'assets/icons.js', 'assets/config-lab.js'];

function jsEntryPoints() {
  const lib = readdirSync(join(root, 'lib'))
    .filter((name) => name.endsWith('.js'))
    .map((name) => join('lib', name));
  return [...ASSET_JS, ...lib];
}

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
  cpSync(join(root, 'node_modules'), join(dist, 'node_modules'), { recursive: true });
}

async function minifyJs() {
  await esbuild.build({
    entryPoints: jsEntryPoints(),
    outdir: dist,
    outbase: root,
    minify: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2020'],
    logLevel: 'info'
  });
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
  await Promise.all([minifyJs(), minifyCss()]);
  console.log('Release build → dist/ (minified JS + bundled CSS)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
