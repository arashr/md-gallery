/** @param {string} str */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {{ src: string, alt: string, title?: string | null, width?: number, height?: number, framed?: boolean }} opts — src/alt already escaped
 */
export function renderMarkdownImage(opts) {
  const { src, alt, title, width, height, framed = false } = opts;
  const caption = title?.trim() ?? '';
  const dimAttr =
    Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? ` width="${Math.round(width)}" height="${Math.round(height)}"`
      : '';

  if (!framed) {
    const titleAttr = caption ? ` title="${escapeHtml(caption)}"` : '';
    return `<img src="${src}" alt="${alt}"${dimAttr}${titleAttr} loading="lazy" decoding="async">`;
  }

  const img = `<img src="${src}" alt="${alt}"${dimAttr} loading="lazy" decoding="async">`;
  const captionHtml = caption
    ? `<span class="prose-img-iso__caption mono-label">${escapeHtml(caption)}</span>`
    : '';

  return `<figure class="prose-img-iso"><div class="prose-img-iso__frame">${captionHtml}${img}</div></figure>`;
}
