import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderMiniPoster } from '../lib/render-mini-poster.js';
import { setGalleryConfig } from '../lib/gallery-config.js';

describe('renderMiniPoster', () => {
  it('emits glyph layer and slug for poster randomness', () => {
    setGalleryConfig({});
    const html = renderMiniPoster({
      slug: 'gallery-demo',
      title: 'Gallery Demo',
      subtext: 'See what you can do',
      index: 0,
      tag: 'button',
      attrs: { 'data-bundled-md': 'docs/demo/gallery-showcase.md' }
    });
    assert.match(html, /class="mini-poster ground-/);
    assert.match(html, /data-slug="gallery-demo"/);
    assert.match(html, /post-card__glyph-layer/);
    assert.match(html, /post-header/);
    assert.match(html, /See what you can do/);
  });
});
