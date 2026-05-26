import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  setGalleryConfig,
  getGalleryConfig,
  fontsHrefFromConfig,
  normalizeGround,
  resolveColor,
  getGroundDefs,
  buildGroundStylesheet,
  buildCodeStylesheet,
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
  });

  it('builds code block CSS with OKLCH darken steps', () => {
    setGalleryConfig({});
    const css = buildCodeStylesheet(getGalleryConfig());
    assert.match(css, /--on-ground-code-bg:color-mix\(in oklch/);
    assert.match(css, /--code-block-bg:color-mix\(in oklch, color-mix\(in oklch, var\(--paper\)/);
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
    setGalleryConfig({ theme: { code: { blockSteps: 1, blockStepMix: 0.36 } } });
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
});
