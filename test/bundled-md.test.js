import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveBundledMarkdownUrl } from '../lib/bundled-md.js';

describe('bundled markdown', () => {
  it('resolves same-origin markdown paths from the app root', () => {
    const url = resolveBundledMarkdownUrl('docs/POSTER_LOGIC.md', 'http://localhost:3000/');
    assert.ok(url);
    assert.equal(url.href, 'http://localhost:3000/docs/POSTER_LOGIC.md');
    assert.equal(url.origin, 'http://localhost:3000');
  });
});
