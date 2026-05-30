import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computePosterGlyphRegionFromLayout } from '../lib/glyph-region.js';

const rand = () => 0.5;

describe('computePosterGlyphRegionFromLayout', () => {
  it('alignToCardEdge spans full card width on bottom slot', () => {
    const layout = {
      cardWidth: 640,
      cardHeight: 800,
      contentLeft: 40,
      contentTop: 48,
      contentRight: 600,
      contentBottom: 752,
      contentWidth: 560,
      contentHeight: 704,
      headerTop: 48,
      headerBottom: 200,
      bodyTop: 240,
      bodyBottom: 420
    };
    const region = computePosterGlyphRegionFromLayout(
      layout,
      { alignToCardEdge: true, emptySpaceMinPx: 48, regionInsetPx: 0 },
      rand
    );
    assert.equal(region.slot, 'bottom');
    assert.equal(region.x, 0);
    assert.equal(region.width, 640);
  });

  it('prefers bottom gap on roomy posters', () => {
    const layout = {
      cardWidth: 640,
      cardHeight: 800,
      contentLeft: 40,
      contentTop: 48,
      contentRight: 600,
      contentBottom: 700,
      contentWidth: 560,
      contentHeight: 652,
      headerTop: 48,
      headerBottom: 200,
      bodyTop: 240,
      bodyBottom: 420
    };
    const region = computePosterGlyphRegionFromLayout(
      layout,
      { emptySpaceMinPx: 48, regionInsetPx: 0 },
      rand
    );
    assert.equal(region.slot, 'bottom');
    assert.equal(region.y, 420);
    assert.ok(region.height >= 280);
  });

  it('uses between gap when bottom is too small', () => {
    const layout = {
      cardWidth: 400,
      cardHeight: 500,
      contentLeft: 0,
      contentTop: 0,
      contentRight: 400,
      contentBottom: 500,
      contentWidth: 400,
      contentHeight: 500,
      headerTop: 0,
      headerBottom: 120,
      bodyTop: 160,
      bodyBottom: 480
    };
    const region = computePosterGlyphRegionFromLayout(
      layout,
      {
        emptySpaceMinPx: 32,
        emptySpaceMinRatio: 0,
        regionPreference: ['bottom', 'between', 'top'],
        regionInsetPx: 0
      },
      rand
    );
    assert.equal(region.slot, 'between');
    assert.equal(region.y, 120);
    assert.equal(region.height, 40);
  });

  it('falls back to side band beside header and body', () => {
    const layout = {
      cardWidth: 500,
      cardHeight: 400,
      contentLeft: 32,
      contentTop: 40,
      contentRight: 500,
      contentBottom: 400,
      contentWidth: 468,
      contentHeight: 360,
      headerTop: 40,
      headerBottom: 180,
      bodyTop: 200,
      bodyBottom: 390
    };
    const region = computePosterGlyphRegionFromLayout(
      layout,
      { emptySpaceMinPx: 200, fallbackBandWidth: 80, regionInsetPx: 0, edgeOverflowPx: 0 },
      rand
    );
    assert.equal(region.slot, 'side');
    assert.equal(region.y, 180);
    assert.ok(region.height >= 200);
    assert.equal(region.width, 80);
  });
});
