import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseDocument, slugify, buildToc } from '../lib/parse-document.js';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    assert.equal(slugify('Hello World!'), 'hello-world');
  });

  it('falls back when empty', () => {
    assert.equal(slugify('!!!'), 'section');
  });
});

describe('parseDocument — h2 split', () => {
  const md = `# Doc Title

Intro paragraph before posters.

## First Poster

Body one.

### Sub A

## Second Poster

Body two.
`;

  it('detects h2 split mode', () => {
    const doc = parseDocument(md, 'sample.md');
    assert.equal(doc.splitMode, 'h2');
    assert.equal(doc.title, 'Doc Title');
    assert.match(doc.introMarkdown, /Intro paragraph/);
    assert.equal(doc.posters.length, 2);
    assert.equal(doc.posters[0].title, 'First Poster');
    assert.equal(doc.posters[1].title, 'Second Poster');
  });

  it('assigns unique poster slugs', () => {
    const doc = parseDocument(md, 'sample.md');
    assert.equal(doc.posters[0].slug, 'first-poster');
    assert.equal(doc.posters[1].slug, 'second-poster');
  });

  it('strips trailing --- before the next ## poster', () => {
    const md = `# Doc

## A

foo

---

## B

bar
`;
    const doc = parseDocument(md, 'sample.md');
    assert.equal(doc.posters[0].bodyMarkdown.trim(), 'foo');
    assert.ok(!doc.posters[0].bodyMarkdown.includes('---'));
  });

  it('builds TOC with poster entries and in-body h3+', () => {
    const doc = parseDocument(md, 'sample.md');
    assert.deepEqual(
      doc.toc.map((t) => ({ depth: t.depth, text: t.text, id: t.id })),
      [
        { depth: 2, text: 'First Poster', id: 'first-poster' },
        { depth: 3, text: 'Sub A', id: 'sub-a' },
        { depth: 2, text: 'Second Poster', id: 'second-poster' }
      ]
    );
  });
});

describe('parseDocument — hr split', () => {
  const md = `# Notes

No level-two headings here.

---

# Segment One

Alpha.

---

# Segment Two

Beta.
`;

  it('uses hr split when no h2 outside fences', () => {
    const doc = parseDocument(md, 'notes.md');
    assert.equal(doc.splitMode, 'hr');
    assert.equal(doc.posters.length, 2);
    assert.equal(doc.posters[0].title, 'Segment One');
    assert.equal(doc.posters[1].title, 'Segment Two');
  });
});

describe('parseDocument — single poster', () => {
  it('puts body in a poster when there is no ## split', () => {
    const md = `# My Doc

Paragraph one.

**Bold** paragraph.
`;
    const doc = parseDocument(md, 'solo.md');
    assert.equal(doc.introMarkdown, '');
    assert.equal(doc.posters.length, 1);
    assert.match(doc.posters[0].bodyMarkdown, /Paragraph one/);
    assert.match(doc.posters[0].bodyMarkdown, /\*\*Bold\*\*/);
  });

  it('keeps whole file as one poster', () => {
    const md = `# Only Title

One block of prose without splits.
`;
    const doc = parseDocument(md, 'solo.md');
    assert.equal(doc.splitMode, 'single');
    assert.equal(doc.posters.length, 1);
    assert.equal(doc.posters[0].title, 'Only Title');
  });
});

describe('parseDocument — code fences', () => {
  it('ignores ## inside fenced blocks for split detection', () => {
    const md = `# Doc

\`\`\`md
## Not a poster
\`\`\`

## Real Poster

Content.
`;
    const doc = parseDocument(md, 'fenced.md');
    assert.equal(doc.splitMode, 'h2');
    assert.equal(doc.posters.length, 1);
    assert.equal(doc.posters[0].title, 'Real Poster');
  });

  it('ignores ## inside nested examples with longer outer fences', () => {
    const md = `# Doc

## Code examples

\`\`\`\`md
\`\`\`js
## This is code text
---
\`\`\`
\`\`\`\`

## Practical tips

Content.
`;
    const doc = parseDocument(md, 'fenced.md');
    assert.equal(doc.splitMode, 'h2');
    assert.deepEqual(
      doc.posters.map((p) => p.title),
      ['Code examples', 'Practical tips']
    );
  });
});

describe('parseDocument — YAML frontmatter', () => {
  it('reads title from frontmatter', () => {
    const md = `---
title: YAML Title
---

# Ignored for title when meta present

## Poster
`;
    const doc = parseDocument(md, 'front.md');
    assert.equal(doc.title, 'YAML Title');
    assert.equal(doc.splitMode, 'h2');
  });
});

describe('parseDocument — slug deduplication', () => {
  it('dedupes poster slugs and TOC heading ids', () => {
    const md = `## Hello

### Hello

## Hello

### Hello
`;
    const doc = parseDocument(md, 'dup.md');
    assert.deepEqual(
      doc.posters.map((p) => p.slug),
      ['hello', 'hello-2']
    );
    const headingIds = doc.toc.filter((t) => t.depth > 2).map((t) => t.id);
    assert.deepEqual(headingIds, ['hello-2', 'hello-3']);
  });
});

describe('buildToc', () => {
  it('skips h2 inside poster bodies (poster title covers h2)', () => {
    const posters = [
      {
        title: 'Poster',
        slug: 'poster',
        bodyMarkdown: '## Inner h2\n\n### Inner h3\n'
      }
    ];
    const toc = buildToc(posters);
    assert.deepEqual(
      toc.map((t) => t.depth),
      [2, 3]
    );
    assert.equal(toc[1].text, 'Inner h3');
  });
});
