import { marked } from 'marked';
import { sanitizeHtml } from './sanitize.js';

marked.setOptions({ gfm: true, breaks: false });

/** Inline markdown (bold, italic, code, links) → safe HTML for titles and TOC labels. */
export function inlineMarkdownToHtml(text) {
  if (!text?.trim()) return '';
  return sanitizeHtml(marked.parseInline(text.trim()));
}

/** Plain text for slugs, search keys, and deduped labels. */
export function plainTextFromMarkdown(text) {
  if (!text?.trim()) return '';
  const html = inlineMarkdownToHtml(text);
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
