export const TITLE_FACES = [
  { id: 'ultra', google: 'Ultra' },
  { id: 'monoton', google: 'Monoton' },
  { id: 'limelight', google: 'Limelight' },
  { id: 'jersey25', google: 'Jersey+25' },
  { id: 'blackops', google: 'Black+Ops+One' },
  { id: 'notable', google: 'Notable' }
];

export function titleFaceForIndex(index) {
  return TITLE_FACES[((index % TITLE_FACES.length) + TITLE_FACES.length) % TITLE_FACES.length];
}

export function fontsHref() {
  const families = [
    'Inter+Tight:ital,wght@0,400;0,500;0,600;1,400',
    'Inter+Mono:ital,wght@0,400;0,500;1,400',
    ...TITLE_FACES.map((f) => f.google)
  ];
  return `https://fonts.googleapis.com/css2?family=${families.join('&family=')}&display=swap`;
}
