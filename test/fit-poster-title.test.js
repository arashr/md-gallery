import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  titleHasHorizontalOverflow,
  titleHasVerticalOverflow,
  titleLineCount,
  titleCharLength,
  resolveTitleScaleTier,
  fitPosterTitles
} from '../lib/fit-poster-title.js';

const SAMPLE_SCALE = {
  minPx: 64,
  maxPx: 280,
  maxWidthRatio: 0.45,
  tiers: [
    { maxChars: 18 },
    { maxChars: 42, maxWidthRatio: 0.34, minPx: 36, maxPx: 120, maxLines: 4 },
    { maxChars: null, maxWidthRatio: 0.26, minPx: 20, maxPx: 80, maxLines: 3, maxPxRatio: 0.72 }
  ]
};

describe('title overflow helpers', () => {
  it('detects horizontal overflow via scroll vs client width', () => {
    assert.equal(titleHasHorizontalOverflow({ scrollWidth: 200, clientWidth: 100 }), true);
    assert.equal(titleHasHorizontalOverflow({ scrollWidth: 100, clientWidth: 100 }), false);
  });

  it('detects vertical overflow on bounds scroll height', () => {
    assert.equal(
      titleHasVerticalOverflow({ scrollHeight: 200, offsetHeight: 64 }, 100),
      true
    );
    assert.equal(
      titleHasVerticalOverflow({ scrollHeight: 80, offsetHeight: 64 }, 100),
      false
    );
  });

  it('counts wrapped lines from height and line-height', () => {
    const el = { getBoundingClientRect: () => ({ height: 132 }) };
    const prev = globalThis.getComputedStyle;
    globalThis.getComputedStyle = () => ({ lineHeight: '44px', fontSize: '40px' });
    try {
      assert.equal(titleLineCount(el), 3);
    } finally {
      globalThis.getComputedStyle = prev;
    }
  });
});

describe('titleCharLength', () => {
  it('uses data-title-chars when present', () => {
    const card = { dataset: { titleChars: '42' } };
    const link = { textContent: 'short' };
    assert.equal(titleCharLength(card, link), 42);
  });

  it('falls back to link text when dataset is missing', () => {
    const card = { dataset: {} };
    const link = { textContent: '  Hello world  ' };
    assert.equal(titleCharLength(card, link), 11);
  });
});

describe('resolveTitleScaleTier', () => {
  it('uses base scale when tiers are absent', () => {
    const tier = resolveTitleScaleTier({ minPx: 64, maxPx: 200, maxWidthRatio: 0.4 }, 100);
    assert.equal(tier.minPx, 64);
    assert.equal(tier.maxLines, 0);
    assert.equal(tier.maxPxRatio, 1);
  });

  it('picks short tier for brief titles', () => {
    const tier = resolveTitleScaleTier(SAMPLE_SCALE, 12);
    assert.equal(tier.minPx, 64);
    assert.equal(tier.maxWidthRatio, 0.45);
    assert.equal(tier.maxLines, 0);
  });

  it('picks medium tier for mid-length titles', () => {
    const tier = resolveTitleScaleTier(SAMPLE_SCALE, 40);
    assert.equal(tier.minPx, 36);
    assert.equal(tier.maxWidthRatio, 0.34);
    assert.equal(tier.maxLines, 4);
    assert.equal(tier.maxPx, 120);
  });

  it('picks long tier past the last maxChars bound', () => {
    const tier = resolveTitleScaleTier(SAMPLE_SCALE, 80);
    assert.equal(tier.minPx, 20);
    assert.equal(tier.maxWidthRatio, 0.26);
    assert.equal(tier.maxLines, 3);
    assert.equal(tier.maxPxRatio, 0.72);
    assert.equal(tier.maxPx, 80);
  });
});

describe('fitPosterTitles', () => {
  it('is exported for the reader', () => {
    assert.equal(typeof fitPosterTitles, 'function');
  });
});

describe('title chars on rendered cards', () => {
  it('exposes plain title length for tier selection', async () => {
    const { parseDocument } = await import('../lib/parse-document.js');
    const { renderDocument } = await import('../lib/render-document.js');
    const long = '12. Sources cited (Figma + agent docs)';
    const doc = parseDocument(`# Doc\n\n## ${long}\n\nBody.`, 't.md');
    assert.equal(doc.posters[0].plainTitle.length, long.length);
    assert.match(renderDocument(doc, 't.md'), new RegExp(`data-title-chars="${long.length}"`));
  });
});
