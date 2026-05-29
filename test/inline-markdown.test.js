import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseDocument } from '../lib/parse-document.js';
import { renderDocument } from '../lib/render-document.js';
import { inlineMarkdownToHtml, plainTextFromMarkdown } from '../lib/inline-markdown.js';

describe('inline markdown in titles', () => {
  it('renders bold in poster titles', () => {
    const md = `# Doc

## **Phase 1** Goals

Body.
`;
    const doc = parseDocument(md, 't.md');
    const html = renderDocument(doc, 't.md');
    assert.match(html, /<h2[^>]*>[\s\S]*<strong>Phase 1<\/strong>/);
    assert.doesNotMatch(html, /<h2[^>]*>[\s\S]*\*\*Phase/);
  });

  it('plainTextFromMarkdown strips markers for slugs', () => {
    assert.equal(plainTextFromMarkdown('**Hello** world'), 'Hello world');
    assert.equal(inlineMarkdownToHtml('**Hi**'), '<strong>Hi</strong>');
  });

  it('forTitle strips code markup so display font is uniform', () => {
    assert.equal(inlineMarkdownToHtml('`mosaic.js`', { forTitle: true }), 'mosaic.js');
    assert.match(inlineMarkdownToHtml('**Bold** `code`', { forTitle: true }), /<strong>Bold<\/strong> code/);
    assert.match(inlineMarkdownToHtml('`code`'), /<code>code<\/code>/);
  });

  it('renders backtick filenames in poster titles without code styling', () => {
    const md = `# Doc

## Layer 2: \`type-pattern-mosaic.js\`

Body.
`;
    const doc = parseDocument(md, 't.md');
    const html = renderDocument(doc, 't.md');
    assert.match(html, /<h2[^>]*>[\s\S]*type-pattern-mosaic\.js/);
    assert.doesNotMatch(html, /<h2[^>]*>[\s\S]*<code>/);
  });
});

describe('substantial intro promotion', () => {
  it('moves long pre-## content into the first poster', () => {
    const lines = ['# Doc', '', 'Intro line.'];
    for (let i = 0; i < 8; i++) lines.push(`Paragraph ${i} with enough text.`);
    lines.push('', '## First section', '', 'Body.');
    const doc = parseDocument(lines.join('\n'), 't.md');
    assert.equal(doc.introMarkdown, '');
    assert.equal(doc.posters[0].plainTitle, 'Overview');
    assert.match(doc.posters[0].bodyMarkdown, /Intro line/);
    assert.equal(doc.posters[1].title, 'First section');
  });
});
