import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  pickGlyphBlendOpacity,
  pickOpacityInRange,
  resolveBlendOpacityRange
} from '../lib/glyph-blend-opacity.js';

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe('glyph blend opacity', () => {
  it('resolveBlendOpacityRange prefers per-mode entry over appearance fallback', () => {
    const range = resolveBlendOpacityRange(
      {
        opacityMin: 0.1,
        opacityMax: 0.2,
        blendOpacity: {
          plain: { min: 0.12, max: 0.22 },
          difference: { min: 0.05, max: 0.1 }
        }
      },
      'plain'
    );
    assert.equal(range.opacityMin, 0.12);
    assert.equal(range.opacityMax, 0.22);

    const fallback = resolveBlendOpacityRange(
      { opacityMin: 0.1, opacityMax: 0.2, blendOpacity: { plain: { min: 0.12, max: 0.22 } } },
      'overlay'
    );
    assert.equal(fallback.opacityMin, 0.1);
    assert.equal(fallback.opacityMax, 0.2);
  });

  it('pickOpacityInRange is deterministic for a fixed rand', () => {
    const rand = rng(42);
    const a = pickOpacityInRange(0.1, 0.2, rand);
    const rand2 = rng(42);
    const b = pickOpacityInRange(0.1, 0.2, rand2);
    assert.equal(a, b);
    assert.ok(a >= 0.1 && a <= 0.2);
  });

  it('pickGlyphBlendOpacity maps plain to source-over lookup', () => {
    const rand = rng(7);
    const value = pickGlyphBlendOpacity(
      {
        opacityMin: 0.5,
        opacityMax: 0.5,
        blendOpacity: { plain: { min: 0.08, max: 0.08 } }
      },
      'source-over',
      rand
    );
    assert.equal(value, 0.08);
  });
});
