import { getGalleryConfig } from './gallery-config.js';

/** Poster ground class names from config (stable hash order in `groundForSlug`). */
export function getGrounds() {
  return Object.keys(getGalleryConfig().grounds).map((name) => `ground-${name}`);
}

export function getGroundKeys() {
  return Object.keys(getGalleryConfig().grounds);
}

export function groundForSlug(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  const grounds = getGrounds();
  return grounds[hash % grounds.length];
}
