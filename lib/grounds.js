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

export function groundForSlug(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return GROUNDS[hash % GROUNDS.length];
}
