import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import {
  setGalleryConfig,
  getGalleryConfig,
  fontsHrefFromConfig,
  normalizeGround,
  resolveColor,
  getGroundDefs,
  buildGroundStylesheet,
  buildCodeStylesheet,
  buildCodeStylesheetForExport,
  buildTitleFaceStylesheet,
  resolveTitleFaceTypography,
  codeBlockBgFromSurface,
  resolveCodeStepMix,
  resolveCodeBlockSteps
} from '../lib/gallery-config.js';

describe('gallery config', () => {
  it('merges partial config over defaults', () => {
    setGalleryConfig({ theme: { colors: { red: '#ff0000' } } });
    const cfg = getGalleryConfig();
    assert.equal(cfg.theme.colors.red, '#ff0000');
    assert.equal(cfg.theme.colors.paper, '#eff1f3');
    assert.equal(cfg.theme.graphics.glyphPatternColor, 'display');
    assert.equal(cfg.theme.graphics.glyphPatternOpacity, 0.07);
    assert.deepEqual(cfg.theme.graphics.typePattern.patternTypes, ['wave', 'grid', 'line']);
    assert.ok(cfg.fonts.titleFaces.length >= 1);
  });

  it('builds Google Fonts URL from config', () => {
    const href = fontsHrefFromConfig(getGalleryConfig());
    assert.match(href, /^https:\/\/fonts\.googleapis\.com\/css2\?family=/);
    assert.match(href, /Inconsolata/);
  });

  it('resolves semantic foreground colors', () => {
    setGalleryConfig({});
    assert.equal(resolveColor('red'), '#c8102e');
    assert.equal(resolveColor('#abc'), '#abc');
  });

  it('normalizes string ground to surface + preset foreground', () => {
    const g = normalizeGround('#f8c0d4', 'pink');
    assert.equal(g.surface, '#f8c0d4');
    assert.equal(g.foreground.display, '#710617');
    assert.equal(g.foreground.linkHoverText, '#ffffff');
  });

  it('builds per-ground CSS with foreground and link-hover tokens', () => {
    setGalleryConfig({});
    const css = buildGroundStylesheet(getGalleryConfig());
    assert.match(css, /\.ground-carmine\{[^}]*--on-ground-display:#ffffff/);
    assert.match(css, /\.ground-pink\{[^}]*--on-ground-link-hover-text:#ffffff/);
    assert.match(css, /\.ground-mint\{[^}]*--on-ground-glyph-pattern-color:#710617/);
    assert.match(css, /\.ground-mint\{[^}]*--on-ground-glyph-pattern-opacity:0\.07/);
  });

  it('builds code block CSS with OKLCH darken steps', () => {
    setGalleryConfig(JSON.parse(readFileSync('config/gallery.config.json', 'utf8')));
    const css = buildCodeStylesheet(getGalleryConfig());
    assert.match(css, /--on-ground-code-bg:color-mix\(in oklch/);
    assert.match(css, /--code-block-bg:color-mix\(in oklch, var\(--paper\)/);
    assert.match(css, /--code-chip-bg:color-mix\(in oklch, var\(--paper\) 90%, black\)/);
    assert.match(
      css,
      /\.ground-butter\{--on-ground-code-chip-bg:color-mix\(in oklch, var\(--surface\) 80%, var\(--config-paper\)\)/
    );
    assert.match(
      css,
      /\.ground-white\{--on-ground-code-chip-bg:color-mix\(in oklch, var\(--surface\) 90%, black\)/
    );
    assert.match(
      css,
      /\.ground-carmine\{--on-ground-code-chip-bg:color-mix\(in oklch, var\(--surface\) 90%, black\)/
    );
  });

  it('builds export code CSS without OKLCH', () => {
    setGalleryConfig({});
    const css = buildCodeStylesheetForExport(getGalleryConfig());
    assert.doesNotMatch(css, /oklch|color-mix/i);
    assert.match(css, /\.ground-mint\{--on-ground-code-bg:#[0-9a-f]{6}/i);
  });

  it('builds per-title-face line-height and letter-spacing CSS', () => {
    setGalleryConfig({});
    const css = buildTitleFaceStylesheet(getGalleryConfig());
    assert.match(css, /\.post-card\.title-face-monoton[^}]*line-height:0\.88/);
    assert.match(css, /\.post-card\.title-face-ultra[^}]*letter-spacing:-0\.005em/);
    assert.match(css, /\.post-card\.title-face-notable .prose :is\(h2,h3,h4\)\{line-height:0\.9/);
  });

  it('resolveTitleFaceTypography prefers headingLineHeight over lineHeight', () => {
    const typo = getGalleryConfig().theme.typography;
    const resolved = resolveTitleFaceTypography(
      { id: 'test', google: 'Test', lineHeight: '0.88', headingLineHeight: '0.95' },
      typo
    );
    assert.equal(resolved.titleLh, '0.88');
    assert.equal(resolved.headingLh, '0.95');
  });

  it('compensates per-step mix when blockSteps is 1', () => {
    setGalleryConfig({
      theme: {
        code: { blockSteps: 1, blockStepMix: 0.36, referenceSteps: 2, autoCompensateMix: true }
      }
    });
    const mix = resolveCodeStepMix(getGalleryConfig());
    assert.ok(mix > 0.55, `expected compensated mix > 0.55, got ${mix}`);
    assert.equal(resolveCodeBlockSteps(getGalleryConfig()), 1);
  });

  it('uses literal blockStepMix when autoCompensateMix is false', () => {
    setGalleryConfig({
      theme: { code: { blockSteps: 1, blockStepMix: 0.36, autoCompensateMix: false } }
    });
    assert.equal(resolveCodeStepMix(getGalleryConfig()), 0.36);
  });

  it('getGroundDefs lists all configured grounds', () => {
    setGalleryConfig({});
    const defs = getGroundDefs();
    assert.ok(defs.mint);
    assert.equal(defs.mint.surface, '#a7dbce');
    assert.equal(defs.tangerine.surface, '#fbc090');
  });

  it('replaces grounds map when provided', () => {
    setGalleryConfig({
      grounds: {
        pink: {
          surface: '#f8c0d4'
        }
      }
    });
    const defs = getGroundDefs();
    assert.ok(defs.pink);
    assert.equal(defs.pink.surface, '#f8c0d4');
    assert.equal(defs.chartreuse, undefined);
  });
});
