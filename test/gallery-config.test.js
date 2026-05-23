import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  setGalleryConfig,
  getGalleryConfig,
  fontsHrefFromConfig,
  normalizeGround,
  resolveColor,
  getGroundDefs,
  buildGroundStylesheet
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
    const g = normalizeGround('#f4a8c2', 'pink');
    assert.equal(g.surface, '#f4a8c2');
    assert.equal(g.foreground.display, 'red');
  });

  it('builds per-ground CSS with foreground tokens', () => {
    setGalleryConfig({});
    const css = buildGroundStylesheet(getGalleryConfig());
    assert.match(css, /\.ground-carmine\{[^}]*--on-ground-display:#ffffff/);
    assert.match(css, /\.ground-pink\{[^}]*--ground-pink/);
  });

  it('getGroundDefs lists all configured grounds', () => {
    setGalleryConfig({});
    const defs = getGroundDefs();
    assert.ok(defs.mint);
    assert.equal(defs.mint.surface, '#a7dbce');
  });
});
