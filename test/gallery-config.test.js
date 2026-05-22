import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setGalleryConfig, getGalleryConfig, fontsHrefFromConfig } from '../lib/gallery-config.js';

describe('gallery config', () => {
  it('merges partial config over defaults', () => {
    setGalleryConfig({ theme: { red: '#ff0000' } });
    const cfg = getGalleryConfig();
    assert.equal(cfg.theme.red, '#ff0000');
    assert.equal(cfg.theme.paper, '#eff1f3');
    assert.ok(cfg.fonts.titleFaces.length >= 1);
  });

  it('builds Google Fonts URL from config', () => {
    const href = fontsHrefFromConfig(getGalleryConfig());
    assert.match(href, /^https:\/\/fonts\.googleapis\.com\/css2\?family=/);
    assert.match(href, /Inter\+Tight/);
  });
});
