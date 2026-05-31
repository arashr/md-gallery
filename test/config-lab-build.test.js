import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { buildLabGalleryConfig, readLabStateFromConfig } from '../lib/config-lab-build.js';

describe('config lab build', () => {
  it('buildLabGalleryConfig uses single opacity values for selected blend', () => {
    const base = JSON.parse(readFileSync('config/gallery.config.json', 'utf8'));
    const cfg = buildLabGalleryConfig(base, {
      ...readLabStateFromConfig(base),
      patternBlend: 'overlay',
      patternOpacity: 0.42,
      heroBlend: 'difference',
      heroOpacity: 0.33
    });
    assert.equal(cfg.theme.graphics.typePattern.blend.opacity.overlay.min, 0.42);
    assert.equal(cfg.theme.graphics.typePattern.blend.opacity.overlay.max, 0.42);
    assert.equal(cfg.theme.graphics.heroGlyph.blend.opacity.difference.min, 0.33);
    assert.deepEqual(cfg.theme.graphics.typePattern.blend.modes, ['overlay']);
  });
});
