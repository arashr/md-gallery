import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyAppearanceOpacityFallback,
  flattenGroupedConfig,
  flattenHeroGlyphConfig,
  resolveGlyphPatternTokens,
  resolveTypePatternConfig
} from '../lib/resolve-graphics-config.js';

describe('resolve graphics config', () => {
  it('resolveTypePatternConfig flattens grouped typePattern', () => {
    const cfg = resolveTypePatternConfig({
      theme: {
        graphics: {
          typePattern: {
            symbol: { pool: 'AB+', probability: 0.5 },
            blend: {
              modes: ['overlay'],
              opacity: { overlay: { min: 0.08, max: 0.12 } }
            },
            shape: { patternTypes: ['line'] },
            roll: { noneProbability: 0.1 }
          }
        }
      }
    });
    assert.equal(cfg.symbolPool, 'AB+');
    assert.equal(cfg.symbolProbability, 0.5);
    assert.deepEqual(cfg.blendModes, ['overlay']);
    assert.deepEqual(cfg.blendOpacity.overlay, { min: 0.08, max: 0.12 });
    assert.deepEqual(cfg.patternTypes, ['line']);
    assert.equal(cfg.noneProbability, 0.1);
  });

  it('resolveTypePatternConfig inherits glyph opacity when appearance omits opacity', () => {
    const cfg = resolveTypePatternConfig({
      theme: {
        graphics: {
          glyph: { opacity: 0.12 },
          typePattern: { shape: { patternTypes: ['line'] } }
        }
      }
    });
    assert.equal(cfg.opacityMin, 0.12);
    assert.equal(cfg.opacityMax, 0.12);
  });

  it('resolveTypePatternConfig accepts legacy flat keys', () => {
    const cfg = resolveTypePatternConfig({
      theme: { graphics: { typePattern: { symbolPool: 'X', repeatsMin: 4 } } }
    });
    assert.equal(cfg.symbolPool, 'X');
    assert.equal(cfg.repeatsMin, 4);
  });

  it('flattenHeroGlyphConfig flattens grouped heroGlyph', () => {
    const flat = flattenHeroGlyphConfig({
      theme: {
        graphics: {
          heroGlyph: {
            roll: { probability: 0.5 },
            text: { lengthMax: 3, glyphColor: 'accent' },
            layout: { sizeRatio: 0.8 },
            blend: {
              modes: ['overlay', 'exclusion'],
              opacity: { overlay: { min: 0.1, max: 0.2 } }
            }
          }
        }
      }
    });
    assert.equal(flat.probability, 0.5);
    assert.equal(flat.lengthMax, 3);
    assert.equal(flat.glyphColor, 'accent');
    assert.equal(flat.sizeRatio, 0.8);
    assert.deepEqual(flat.blendModes, ['overlay', 'exclusion']);
    assert.deepEqual(flat.blendOpacity.overlay, { min: 0.1, max: 0.2 });
  });

  it('resolveGlyphPatternTokens reads glyph subgroup', () => {
    const tokens = resolveGlyphPatternTokens({
      theme: { graphics: { glyph: { color: 'red', opacity: 0.2 } } }
    });
    assert.equal(tokens.color, 'red');
    assert.equal(tokens.opacity, 0.2);
  });

  it('resolveGlyphPatternTokens falls back to legacy flat keys', () => {
    const tokens = resolveGlyphPatternTokens({
      theme: { graphics: { glyphPatternColor: 'accent', glyphPatternOpacity: 0.15 } }
    });
    assert.equal(tokens.color, 'accent');
    assert.equal(tokens.opacity, 0.15);
  });

  it('applyAppearanceOpacityFallback keeps flattened appearance range', () => {
    const flat = flattenGroupedConfig(
      { appearance: { opacityMin: 0.15, opacityMax: 0.25 } },
      ['appearance']
    );
    applyAppearanceOpacityFallback(flat, { opacityMin: 0.15, opacityMax: 0.25 }, 0.07);
    assert.equal(flat.opacityMin, 0.15);
    assert.equal(flat.opacityMax, 0.25);
  });

  it('applyAppearanceOpacityFallback inherits glyph opacity when appearance omits range', () => {
    const flat = applyAppearanceOpacityFallback({}, undefined, 0.12);
    assert.equal(flat.opacityMin, 0.12);
    assert.equal(flat.opacityMax, 0.12);
  });

  it('flattenGroupedConfig lets grouped keys override legacy flat keys', () => {
    const flat = flattenGroupedConfig(
      { symbolPool: 'OLD', symbol: { pool: 'NEW' } },
      ['symbol'],
      { symbol: { pool: 'symbolPool' } }
    );
    assert.equal(flat.symbolPool, 'NEW');
  });
});
