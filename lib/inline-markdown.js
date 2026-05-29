import { marked } from 'marked';
import { sanitizeHtml } from './sanitize.js';

marked.setOptions({ gfm: true, breaks: false });

/**
 * Inline markdown (bold, italic, code, links) → safe HTML for titles and TOC labels.
 * @param {string} text
 * @param {{ forTitle?: boolean }} [options] — `forTitle` strips `<code>` so poster titles stay in the display face
 */
export function inlineMarkdownToHtml(text, options = {}) {
  if (!text?.trim()) return '';
  let html = sanitizeHtml(marked.parseInline(text.trim()));
  if (options.forTitle) {
    html = html.replace(/<code>([\s\S]*?)<\/code>/gi, '$1');
  }
  return html;
}

/** Plain text for slugs, search keys, and deduped labels. */
export function plainTextFromMarkdown(text) {
  if (!text?.trim()) return '';
  const html = inlineMarkdownToHtml(text);
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
