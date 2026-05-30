import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPosterTypePatternOptions, TYPE_PATTERN_DEFAULTS } from '../lib/type-pattern-poster.js';

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
  });
});
