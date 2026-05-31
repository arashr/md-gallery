import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildPosterTypePatternOptions,
  TYPE_PATTERN_DEFAULTS,
  pickPosterBlendMode,
  resolveBlendModePool
} from '../lib/type-pattern-poster.js';
import { isCanvasBlendMode, resolveBlendOpacityRange } from '../lib/glyph-blend-opacity.js';

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe('buildPosterTypePatternOptions', () => {
  it('uses flat min/max ranges and patternTypes', () => {
    const rand = rng(7);
    const opts = buildPosterTypePatternOptions(
      {
        patternTypes: ['line'],
        repeatsMin: 10,
        repeatsMax: 10,
        lineAngleMin: 5,
        lineAngleMax: 5
      },
      {
        rand,
        pick: (arr) => arr[0],
        int: (a, b) => a,
        float: (a) => a,
        letter: 'X',
        foregroundColor: '#000',
        fontFamily: 'serif',
        fontWeight: '400',
        width: 100,
        height: 200
      }
    );
    assert.equal(opts.type, 'line');
    assert.equal(opts.repeats, 10);
    assert.equal(opts.lineAngle, 5);
    assert.equal(opts.fontSize, null);
  });

  it('defaults match TYPE_PATTERN_DEFAULTS keys', () => {
    assert.ok(TYPE_PATTERN_DEFAULTS.patternTypes.length >= 1);
    assert.ok('repeatsMin' in TYPE_PATTERN_DEFAULTS);
    assert.ok('emptySpaceMinPx' in TYPE_PATTERN_DEFAULTS);
    assert.ok(Array.isArray(TYPE_PATTERN_DEFAULTS.blendModes));
  });

  it('resolveBlendModePool accepts normal and plain as source-over', () => {
    const pool = resolveBlendModePool({ blendModes: ['plain', 'normal', 'screen'] });
    assert.deepEqual(pool, ['source-over', 'source-over', 'screen']);
  });

  it('isCanvasBlendMode treats source-over as plain opacity', () => {
    assert.equal(isCanvasBlendMode('source-over'), false);
    assert.equal(isCanvasBlendMode('normal'), false);
    assert.equal(isCanvasBlendMode('overlay'), true);
  });

  it('pickPosterBlendMode picks from pool', () => {
    const rand = rng(99);
    const pick = (arr) => arr[Math.floor(rand() * arr.length)];
    const mode = pickPosterBlendMode({ blendModes: ['multiply', 'screen'] }, rand, pick);
    assert.ok(['multiply', 'screen'].includes(mode));
  });

  it('resolveBlendOpacityRange uses per-blend min/max with appearance fallback', () => {
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

    const diff = resolveBlendOpacityRange(
      {
        opacityMin: 0.1,
        opacityMax: 0.2,
        blendOpacity: { difference: { min: 0.05, max: 0.1 } }
      },
      'difference'
    );
    assert.equal(diff.opacityMin, 0.05);
    assert.equal(diff.opacityMax, 0.1);

    const fallback = resolveBlendOpacityRange(
      { opacityMin: 0.1, opacityMax: 0.2, blendOpacity: { plain: { min: 0.12, max: 0.22 } } },
      'overlay'
    );
    assert.equal(fallback.opacityMin, 0.1);
    assert.equal(fallback.opacityMax, 0.2);
  });

  it('buildPosterTypePatternOptions applies blend-specific opacity', () => {
    const rand = rng(3);
    const opts = buildPosterTypePatternOptions(
      {
        blendOpacity: { plain: { min: 0.2, max: 0.2 } },
        opacityMin: 0.05,
        opacityMax: 0.05,
        repeatsMin: 4,
        repeatsMax: 4
      },
      {
        rand,
        pick: (arr) => arr[0],
        int: (a) => a,
        float: (a) => a,
        letter: 'A',
        foregroundColor: '#000',
        fontFamily: 'serif',
        fontWeight: '400',
        width: 100,
        height: 100
      },
      'plain'
    );
    assert.equal(opts.opacity, 0.2);
  });
});
