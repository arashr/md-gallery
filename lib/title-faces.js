import { getGalleryConfig } from './gallery-config.js';

export function getTitleFaces() {
  return getGalleryConfig().fonts.titleFaces;
}

export function titleFaceForIndex(index) {
  const faces = getTitleFaces();
  return faces[((index % faces.length) + faces.length) % faces.length];
}

export function fontsHref() {
  const { fonts } = getGalleryConfig();
  const families = [
    fonts.uiSans.google,
    fonts.uiSerif.google,
    fonts.mono.google,
    ...fonts.titleFaces.map((f) => f.google)
  ];
  return `https://fonts.googleapis.com/css2?family=${families.join('&family=')}&display=swap`;
}
