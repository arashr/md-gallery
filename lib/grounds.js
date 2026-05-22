import { getGalleryConfig } from './gallery-config.js';

/** Poster ground class names (order matches config `grounds` keys). */
export const GROUNDS = [
  'ground-chartreuse',
  'ground-tangerine',
  'ground-lilac',
  'ground-forest',
  'ground-butter',
  'ground-mint',
  'ground-carmine',
  'ground-pink'
];

export function getGroundKeys() {
  return Object.keys(getGalleryConfig().grounds);
}

export function groundForSlug(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return GROUNDS[hash % GROUNDS.length];
}
