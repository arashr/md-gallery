import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveHeroGlyphOptions,
  resolveHeroGlyphConfig,
  resolveHeroGlyphPaintState,
  shouldUseHeroGlyph,
  isHeroGlyphAllowed,
  isHeroGlyphFaceAllowed,
  pickHeroGlyphText,
  pickHeroGlyphOffsetX,
  posterTitleFaceId,
  posterRandFromSlug,
  HERO_GLYPH_DEFAULTS
} from '../lib/poster-hero-glyph.js';
import { pickGlyphBlendOpacity } from '../lib/glyph-blend-opacity.js';
import {
  TYPE_PATTERN_DEFAULTS,
  filterPosterSymbolPool,
  posterTitleLetter,
  resolvePatternSymbolPool
} from '../lib/type-pattern-poster.js';

describe('poster hero glyph', () => {
  it('resolveHeroGlyphOptions merges nested config', () => {
    const opts = resolveHeroGlyphOptions({
      theme: { graphics: { heroGlyph: { probability: 0.5, lengthMax: 3 } } }
    });
    assert.equal(opts.probability, 0.5);
    assert.equal(opts.lengthMax, 3);
    assert.equal(opts.lengthMin, HERO_GLYPH_DEFAULTS.lengthMin);
  });

  it('shouldUseHeroGlyph is deterministic per slug', () => {
    const opts = { ...HERO_GLYPH_DEFAULTS, probability: 0.5 };
    const rand = posterRandFromSlug('image-on-a-poster');
    const a = shouldUseHeroGlyph(opts, rand);
    const rand2 = posterRandFromSlug('image-on-a-poster');
    const b = shouldUseHeroGlyph(opts, rand2);
    assert.equal(a, b);
  });

  it('pickHeroGlyphText respects length bounds and typePattern pool', () => {
    const heroOpts = resolveHeroGlyphOptions({
      theme: { graphics: { heroGlyph: { lengthMin: 2, lengthMax: 2 } } }
    });
    const patternCfg = { ...TYPE_PATTERN_DEFAULTS, symbolPool: 'AB', symbolProbability: 1 };
    const text = pickHeroGlyphText(heroOpts, patternCfg, 'Poster 2', posterRandFromSlug('demo'));
    assert.equal(text.length, 2);
    assert.match(text, /^[AB]+$/);
  });

  it('isHeroGlyphAllowed respects reduced transparency', () => {
    const opts = resolveHeroGlyphOptions({});
    const env = { matchMedia: (q) => ({ matches: q.includes('reduced-transparency') }) };
    assert.equal(isHeroGlyphAllowed(opts, env), false);
  });

  it('filterPosterSymbolPool drops digits and keeps letters and symbols', () => {
    assert.equal(filterPosterSymbolPool('+*2A9'), '+*A');
    assert.equal(resolvePatternSymbolPool({ symbolPool: '012+*' }), '+*');
  });

  it('posterTitleLetter ignores digits in title', () => {
    assert.equal(posterTitleLetter('42 ways to go'), 'W');
    assert.equal(posterTitleLetter('2024'), 'A');
  });

  it('isHeroGlyphFaceAllowed respects excludeTitleFaces', () => {
    const opts = resolveHeroGlyphOptions({
      theme: { graphics: { heroGlyph: { excludeTitleFaces: ['monoton'] } } }
    });
    const card = { className: 'post-card ground-pink title-face-monoton' };
    assert.equal(isHeroGlyphFaceAllowed(opts, card), false);
    assert.equal(isHeroGlyphFaceAllowed(opts, { className: 'post-card title-face-ultra' }), true);
  });

  it('pickHeroGlyphOffsetX is deterministic per slug', () => {
    const opts = resolveHeroGlyphOptions({
      theme: { graphics: { heroGlyph: { offsetXRatioMin: -0.5, offsetXRatioMax: 0.5 } } }
    });
    const rand = posterRandFromSlug('offset-demo');
    const a = pickHeroGlyphOffsetX(opts, 400, rand);
    const rand2 = posterRandFromSlug('offset-demo');
    const b = pickHeroGlyphOffsetX(opts, 400, rand2);
    assert.equal(a, b);
    assert.ok(a >= -200 && a <= 200);
  });

  it('posterTitleFaceId reads title-face class', () => {
    assert.equal(posterTitleFaceId({ className: 'post-card title-face-blackops' }), 'blackops');
  });

  it('resolveHeroGlyphConfig maps legacy appearance opacity to fallback range', () => {
    const cfg = resolveHeroGlyphConfig({
      theme: { graphics: { heroGlyph: { appearance: { opacity: 0.2 } } } }
    });
    assert.equal(cfg.opacityMin, 0.2);
    assert.equal(cfg.opacityMax, 0.2);
  });

  it('resolveHeroGlyphPaintState picks up new blend opacity after config change', () => {
    const card = { clientWidth: 400, dataset: { slug: 'demo' } };
    const layoutRand = posterRandFromSlug('demo');
    const opacityRand = posterRandFromSlug('demo:hero-opacity');
    const before = resolveHeroGlyphConfig({
      theme: {
        graphics: {
          heroGlyph: {
            blend: { opacity: { difference: { min: 0.1, max: 0.1 } } }
          }
        }
      }
    });
    const after = resolveHeroGlyphConfig({
      theme: {
        graphics: {
          heroGlyph: {
            blend: { opacity: { difference: { min: 0.5, max: 0.5 } } }
          }
        }
      }
    });
    const a = resolveHeroGlyphPaintState(card, before, 'difference', layoutRand, opacityRand);
    const b = resolveHeroGlyphPaintState(card, after, 'difference', layoutRand, opacityRand);
    assert.equal(a.opacity, 0.1);
    assert.equal(b.opacity, 0.5);
  });
});
