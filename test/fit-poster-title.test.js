import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  titleHasHorizontalOverflow,
  titleHasVerticalOverflow,
  fitPosterTitles
} from '../lib/fit-poster-title.js';

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
});

describe('fitPosterTitles', () => {
  it('is exported for the reader', () => {
    assert.equal(typeof fitPosterTitles, 'function');
  });
});
