import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { posterPdfFilename } from '../lib/poster-export.js';

describe('poster PDF export', () => {
  it('builds a safe download filename', () => {
    assert.equal(posterPdfFilename('Hello **World**'), 'Hello-World.pdf');
    assert.equal(posterPdfFilename(''), 'poster.pdf');
    assert.equal(posterPdfFilename('setup/guide'), 'setupguide.pdf');
  });
});
