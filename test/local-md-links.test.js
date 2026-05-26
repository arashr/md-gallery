import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isExternalHref,
  isFragmentHref,
  isLocalMarkdownHref,
  normalizeRelativePath,
  resolveRelativeMarkdownPath
} from '../lib/local-md-links.js';

describe('local markdown links', () => {
  it('detects fragment, external, and local hrefs', () => {
    assert.equal(isFragmentHref('#intro'), true);
    assert.equal(isExternalHref('https://example.com/x.md'), true);
    assert.equal(isExternalHref('mailto:a@b.com'), true);
    assert.equal(isLocalMarkdownHref('./other.md'), true);
    assert.equal(isLocalMarkdownHref('notes/readme.markdown'), true);
    assert.equal(isLocalMarkdownHref('../escape.md'), true);
    assert.equal(isLocalMarkdownHref('https://example.com/x.md'), false);
    assert.equal(isLocalMarkdownHref('#section'), false);
    assert.equal(isLocalMarkdownHref('./page.html'), false);
  });

  it('normalizes relative paths and blocks escape above root', () => {
    assert.equal(normalizeRelativePath('docs/../guide.md'), 'guide.md');
    assert.equal(normalizeRelativePath('../secret.md'), null);
    assert.equal(normalizeRelativePath('./a/./b.md'), 'a/b.md');
  });

  it('resolves markdown paths from the open file location', () => {
    assert.equal(resolveRelativeMarkdownPath('guide.md', 'other.md'), 'other.md');
    assert.equal(resolveRelativeMarkdownPath('docs/guide.md', '../readme.md'), 'readme.md');
    assert.equal(resolveRelativeMarkdownPath('docs/guide.md', './setup.md'), 'docs/setup.md');
    assert.equal(resolveRelativeMarkdownPath('docs/guide.md', '../../outside.md'), null);
    assert.equal(resolveRelativeMarkdownPath('guide.md', 'https://x.com/a.md'), null);
  });
});
