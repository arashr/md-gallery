import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseDocument } from '../lib/parse-document.js';
import { renderDocument } from '../lib/render-document.js';

/** Extract id attributes from rendered in-body headings (h3–h6). */
function headingIdsFromHtml(html) {
  const ids = [];
  const re = /<h([3-6]) id="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) ids.push(m[2]);
  return ids;
}

describe('TOC ids align with rendered heading ids', () => {
  it('in-body TOC entries match ids in rendered HTML', () => {
    const md = `# Doc

## Alpha

### One

#### Two

## Beta

### Also One
`;
    const doc = parseDocument(md, 'align.md');
    const html = renderDocument(doc, 'align.md');
    const renderedIds = headingIdsFromHtml(html);
    const tocBodyIds = doc.toc.filter((t) => t.depth > 2).map((t) => t.id);

    assert.deepEqual(tocBodyIds, renderedIds);
    assert.ok(html.includes('id="alpha"'));
    assert.ok(html.includes('id="beta"'));
  });

  it('reserves poster slugs so body headings do not collide', () => {
    const md = `## hello

### hello
`;
    const doc = parseDocument(md, 'collision.md');
    const html = renderDocument(doc, 'collision.md');
    const tocH3 = doc.toc.find((t) => t.depth === 3);
    assert.equal(tocH3.id, 'hello-2');
    assert.match(html, /id="hello-2"/);
  });
});
