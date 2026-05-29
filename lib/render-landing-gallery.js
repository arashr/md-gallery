import { inlineMarkdownToHtml } from './inline-markdown.js';
import { groundForSlug } from './grounds.js';
import { titleFaceForIndex } from './title-faces.js';
import { slugify } from './parse-document.js';

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {{ path: string, title: string, index: number }[]} items
 */
export function renderLandingGallery(items) {
  return items
    .map(({ path, title, index }) => {
      const slug = slugify(path.replace(/\.[^.]+$/, '')) || 'file';
      const ground = groundForSlug(slug);
      const face = titleFaceForIndex(index);
      const titleHtml = inlineMarkdownToHtml(title, { forTitle: true });
      return `<button type="button" class="collection-card ${ground} title-face-${face.id} landing-pick-card reveal is-visible" data-md-path="${escapeHtml(path)}">
      <h2 class="poster__title">${titleHtml}</h2>
    </button>`;
    })
    .join('\n');
}
