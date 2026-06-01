import { renderMiniPosterGrid } from './render-mini-poster.js';

/**
 * @param {{ path: string, title: string, index: number }[]} items
 */
export function renderLandingGallery(items) {
  return renderMiniPosterGrid(
    items.map(({ path, title, index }) => ({
      path,
      title,
      index,
      subtext: path.split('/').pop() || path
    }))
  );
}
