import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPosterImageHalftoneEnabled,
  dotRadiusFromLuminance,
  halftoneGridPoints
} from '../lib/image-halftone.js';
import {
  resolveImageHalftoneOptions,
  IMAGE_HALFTONE_DEFAULTS
} from '../lib/image-halftone-config.js';
import { setGalleryConfig, getGalleryConfig } from '../lib/gallery-config.js';

describe('poster image halftone', () => {
  it('defaults imageHalftone subgroup in gallery config', () => {
    setGalleryConfig({});
    const ht = getGalleryConfig().theme.graphics.imageHalftone;
    assert.equal(typeof ht, 'object');
    assert.equal(ht.enabled, true);
    assert.equal(ht.pattern, 'stagger');
  });

  it('isPosterImageHalftoneEnabled respects false', () => {
    assert.equal(isPosterImageHalftoneEnabled({ theme: { graphics: { imageHalftone: false } } }), false);
    assert.equal(
      isPosterImageHalftoneEnabled({ theme: { graphics: { imageHalftone: { enabled: false } } } }),
      false
    );
    assert.equal(isPosterImageHalftoneEnabled({ theme: { graphics: {} } }), true);
  });

  it('resolveImageHalftoneOptions merges nested and legacy flat keys', () => {
    const opts = resolveImageHalftoneOptions({
      theme: {
        graphics: {
          imageHalftone: { dotPx: 4, angleDeg: 30 },
          imageHalftoneSaturation: 1.5
        }
      }
    });
    assert.equal(opts.dotPx, 4);
    assert.equal(opts.angleDeg, 30);
    assert.equal(opts.saturation, 1.5);
    assert.equal(opts.pattern, IMAGE_HALFTONE_DEFAULTS.pattern);
  });

  it('dotRadiusFromLuminance scales with luminance', () => {
    assert.ok(dotRadiusFromLuminance(0, 10) > dotRadiusFromLuminance(1, 10));
    assert.equal(dotRadiusFromLuminance(1, 10), 0);
    assert.ok(dotRadiusFromLuminance(0, 10) > 4);
    assert.ok(dotRadiusFromLuminance(0.5, 10, 1.5) > dotRadiusFromLuminance(0.5, 10, 1));
  });

  it('halftoneGridPoints covers the frame at angle zero', () => {
    const points = halftoneGridPoints(100, 50, 5, 'grid', 0);
    assert.ok(points.length > 20);
    assert.ok(points.every((p) => p.x >= 0 && p.x < 100 && p.y >= 0 && p.y < 50));
  });
});
