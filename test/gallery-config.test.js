import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import {
  setGalleryConfig,
  getGalleryConfig,
  fontsHrefFromConfig,
  normalizeGround,
  resolveColor,
  themeColors,
  getGroundDefs,
  buildGroundStylesheet,
  buildCodeStylesheet,
  buildCodeStylesheetForExport,
  buildTitleFaceStylesheet,
  resolveTitleFaceTypography,
  typographyTokens,
  codeBlockBgFromSurface,
  resolveCodeStepMix,
  resolveCodeBlockSteps
} from '../lib/gallery-config.js';

describe('gallery config', () => {
  it('merges partial config over defaults', () => {
    setGalleryConfig({ theme: { graphics: { glyph: { opacity: 0.12 } } } });
    const cfg = getGalleryConfig();
    assert.equal(cfg.theme.graphics.glyph.opacity, 0.12);
    assert.equal(cfg.theme.graphics.imageHalftone.enabled, true);
    assert.ok(cfg.fonts.titleFaces.length >= 1);
    assert.ok(cfg.grounds.pink);
  });

  it('builds Google Fonts URL from config', () => {
    const href = fontsHrefFromConfig(getGalleryConfig());
    assert.match(href, /^https:\/\/fonts\.googleapis\.com\/css2\?family=/);
    assert.match(href, /Inconsolata/);
  });

  it('resolves semantic foreground colors from CSS token fallbacks', () => {
    setGalleryConfig({});
    assert.equal(resolveColor('red'), themeColors().red);
    assert.equal(resolveColor('#abc'), '#abc');
    assert.match(resolveColor('ground-pink'), /^#/);
  });

  it('normalizes string ground to surface slug + preset foreground refs', () => {
    const g = normalizeGround('#f8c0d4', 'pink');
    assert.equal(g.surface, '#f8c0d4');
    assert.equal(g.foreground.display, 'ground-pink-display');
    assert.equal(g.foreground.linkHoverText, 'ground-link-hover-text');
  });

  it('builds per-ground glyph override CSS when configured', () => {
    setGalleryConfig({
      grounds: {
        pink: {
          glyph: { color: 'white', opacity: 0.5 }
        }
      }
    });
    const css = buildGroundStylesheet(getGalleryConfig());
    assert.match(css, /\.ground-pink\{--on-ground-glyph-pattern-color:white/);
    assert.match(css, /--on-ground-glyph-pattern-opacity:0\.5/);
  });

  it('builds code block CSS with OKLCH darken steps', () => {
    setGalleryConfig(JSON.parse(readFileSync('config/gallery.config.json', 'utf8')));
    const css = buildCodeStylesheet(getGalleryConfig());
    assert.match(css, /--on-ground-code-bg:color-mix\(in oklch/);
    assert.match(css, /--code-block-bg:color-mix\(in oklch, var\(--paper\)/);
    assert.match(css, /--code-chip-bg:oklch\(from var\(--paper\)/);
    assert.match(css, /\.ground-butter\{--on-ground-code-chip-bg:oklch\(from var\(--surface\)/);
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
    assert.match(css, /\.post-card\.title-face-limelight[^}]*line-height:0\.8/);
    assert.match(css, /\.post-card\.title-face-ultra[^}]*letter-spacing:-0\.005em/);
    assert.match(css, /\.post-card\.title-face-calsans .prose :is\(h2,h3,h4\)\{line-height:0\.94/);
  });

  it('resolveTitleFaceTypography prefers headingLineHeight over lineHeight', () => {
    const typo = typographyTokens();
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

  it('getGroundDefs lists all configured grounds with CSS surface slugs', () => {
    setGalleryConfig({});
    const defs = getGroundDefs();
    assert.ok(defs.mint);
    assert.equal(defs.mint.surface, 'ground-mint');
    assert.equal(defs.tangerine.surface, 'ground-tangerine');
  });

  it('replaces grounds map when provided', () => {
    setGalleryConfig({
      grounds: {
        pink: {
          glyph: { opacity: 0.3 }
        }
      }
    });
    const defs = getGroundDefs();
    assert.ok(defs.pink);
    assert.equal(defs.pink.glyph?.opacity, 0.3);
    assert.equal(defs.chartreuse, undefined);
  });
});
