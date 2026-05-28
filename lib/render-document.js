import { marked } from 'marked';
import { groundForSlug } from './grounds.js';
import { titleFaceForIndex } from './title-faces.js';
import { posterStaggerRem } from './stagger.js';
import { sanitizeHtml } from './sanitize.js';
import { inlineMarkdownToHtml } from './inline-markdown.js';

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const usedHeadingIds = new Set();

function resetHeadingIds() {
  usedHeadingIds.clear();
}

function slugifyHeading(text) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'heading'
  );
}

function uniqueHeadingId(rawText) {
  let base = slugifyHeading(rawText);
  let id = base;
  let n = 2;
  while (usedHeadingIds.has(id)) {
    id = `${base}-${n}`;
    n++;
  }
  usedHeadingIds.add(id);
  return id;
}

function configureMarked() {
  const renderer = new marked.Renderer();
  renderer.heading = function ({ tokens, depth }) {
    const raw = tokens.map((t) => t.raw).join('');
    const text = this.parser.parseInline(tokens);
    const id = uniqueHeadingId(raw);
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
  };
  marked.setOptions({ gfm: true, breaks: false, renderer });
}

configureMarked();

function wrapTables(html) {
  return html.replace(
    /<table(\s[^>]*)?>/gi,
    '<div class="table-wrap"><table$1>'
  ).replace(/<\/table>/gi, '</table></div>');
}

function mdToHtml(markdown) {
  if (!markdown?.trim()) return '';
  return sanitizeHtml(wrapTables(marked.parse(markdown.trim())));
}

export function renderDocument(doc, fileLabel) {
  resetHeadingIds();

  let previousStaggerRem = null;
  const postersHtml = doc.posters
    .map((poster) => {
      const ground = groundForSlug(poster.slug);
      const face = titleFaceForIndex(poster.index);
      const staggerRem = posterStaggerRem(poster.slug, poster.index, previousStaggerRem);
      previousStaggerRem = staggerRem;
      // Reserve poster slug before body headings (matches buildToc used-set order).
      usedHeadingIds.add(poster.slug);
      const bodyHtml = mdToHtml(poster.bodyMarkdown);

      return `
    <div class="post-card-wrap ${ground} reveal is-visible" style="--poster-shift: ${staggerRem}rem">
      <article class="post-card ${ground} title-face-${face.id}" id="${escapeHtml(poster.slug)}" data-slug="${escapeHtml(poster.slug)}" data-search="${escapeHtml(poster.searchText)}">
        <header class="post-header">
          <div class="post-title-bounds">
            <h2 class="poster__title post-title"><a href="#${escapeHtml(poster.slug)}">${inlineMarkdownToHtml(poster.title)}</a></h2>
          </div>
        </header>
        <div class="prose post-body">${bodyHtml}</div>
      </article>
      <div class="post-card__toolbar" aria-label="Poster actions">
        <button type="button" class="post-card__export btn-icon btn-ghost" data-poster-export aria-label="Export poster as PDF">
          <span data-icon="pdf" aria-hidden="true"></span>
        </button>
      </div>
    </div>`;
    })
    .join('\n');

  const introHtml = doc.introMarkdown ? mdToHtml(doc.introMarkdown) : '';

  return `
    <header class="poster collection-hero reveal is-visible">
      <p class="kicker">MD Gallery</p>
      <p class="doc-meta mono-label">${escapeHtml(fileLabel)} · ${doc.posters.length} poster${doc.posters.length === 1 ? '' : 's'} · split by ${doc.splitMode}</p>
      <h1 class="poster__title">${inlineMarkdownToHtml(doc.title)}</h1>
      ${introHtml ? `<div class="case-hero__sub prose-brief">${introHtml}</div>` : ''}
    </header>
    <div id="posters" class="posts-list poster-gallery" aria-label="Posters">
      ${postersHtml}
    </div>`;
}

export function renderToc(toc) {
  if (!toc.length) {
    return '<p class="toc-empty mono-label">No headings in this file.</p>';
  }
  return `<ol class="toc-list">
    ${toc
      .map(
        (item) =>
          `<li class="toc-item toc-depth-${item.depth}"><a href="#${escapeHtml(item.id)}" data-toc-link>${inlineMarkdownToHtml(item.text)}</a></li>`
      )
      .join('\n')}
  </ol>`;
}
