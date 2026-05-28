import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { peekDocumentTitle } from '../lib/parse-document.js';
import { renderLandingGallery } from '../lib/render-landing-gallery.js';
import { setGalleryConfig } from '../lib/gallery-config.js';

describe('landing folder gallery', () => {
  it('peekDocumentTitle reads frontmatter and h1', () => {
    const withYaml = `---\ntitle: From YAML\n---\n\n# Ignored\n`;
    assert.equal(peekDocumentTitle(withYaml, 'x.md'), 'From YAML');

    const withH1 = '# Hello World\n\nBody';
    assert.equal(peekDocumentTitle(withH1, 'notes.md'), 'Hello World');

    assert.equal(peekDocumentTitle('no heading', 'my-file.md'), 'my file');
  });

  it('renderLandingGallery assigns ground and title-face classes', () => {
    setGalleryConfig({});
    const html = renderLandingGallery([
      { path: 'docs/alpha.md', title: 'Alpha', index: 0 },
      { path: 'beta.md', title: '**Beta**', index: 1 }
    ]);
    assert.match(html, /data-md-path="docs\/alpha\.md"/);
    assert.match(html, /class="collection-card ground-\w+ title-face-\w+ landing-pick-card/);
    assert.match(html, /<strong>Beta<\/strong>/);
    assert.match(html, /poster__title/);
  });
});
