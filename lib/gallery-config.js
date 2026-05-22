/** @typedef {{ id: string, google: string }} TitleFaceConfig */

const DEFAULT_CONFIG = {
  theme: {
    paper: '#eff1f3',
    ink: '#0c0e10',
    inkSoft: '#1b1f24',
    red: '#c8102e',
    redBright: '#e8334e',
    measure: '65ch',
    posterWidth: '42rem',
    edgeStepMix: 0.12
  },
  grounds: {
    pink: '#f4a8c2',
    chartreuse: '#d8e04a',
    tangerine: '#f0894e',
    lilac: '#c5bfe8',
    forest: '#8fb89b',
    butter: '#ffc64d',
    mint: '#a7dbce',
    carmine: '#b52840'
  },
  fonts: {
    uiSans: {
      family: 'Inter Tight',
      google: 'Inter+Tight:ital,wght@0,400;0,500;0,600;1,400'
    },
    uiSerif: {
      family: 'Libre Baskerville',
      google: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400'
    },
    mono: {
      family: 'Inter Mono',
      google: 'Inter+Mono:ital,wght@0,400;0,500;1,400'
    },
    titleFaces: [
      { id: 'ultra', google: 'Ultra' },
      { id: 'monoton', google: 'Monoton' },
      { id: 'limelight', google: 'Limelight' },
      { id: 'jersey25', google: 'Jersey+25' },
      { id: 'blackops', google: 'Black+Ops+One' },
      { id: 'notable', google: 'Notable' }
    ]
  },
  titleScale: {
    minPx: 14,
    maxPx: 280,
    maxWidthRatio: 0.45,
    tallTitleMaxPx: 400,
    tallTitleHeightRatio: 0.42,
    slackMinPx: 56,
    bAspect: 353 / 250,
    targetSlackRatio: 0.12,
    targetSlackMinPx: 48
  }
};

let activeConfig = structuredClone(DEFAULT_CONFIG);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mergeConfig(base, patch) {
  if (!isPlainObject(patch)) return base;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    const next = patch[key];
    if (Array.isArray(next)) {
      out[key] = next.slice();
    } else if (isPlainObject(next) && isPlainObject(base[key])) {
      out[key] = mergeConfig(base[key], next);
    } else if (next !== undefined) {
      out[key] = next;
    }
  }
  return out;
}

export function getGalleryConfig() {
  return activeConfig;
}

export function setGalleryConfig(partial) {
  activeConfig = mergeConfig(structuredClone(DEFAULT_CONFIG), partial || {});
  return activeConfig;
}

export async function loadGalleryConfig(url = 'config/gallery.config.json') {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return activeConfig;
    const json = await res.json();
    return setGalleryConfig(json);
  } catch {
    return activeConfig;
  }
}

export function fontsHrefFromConfig(cfg = activeConfig) {
  const { fonts } = cfg;
  const families = [
    fonts.uiSans.google,
    fonts.uiSerif.google,
    fonts.mono.google,
    ...fonts.titleFaces.map((f) => f.google)
  ];
  return `https://fonts.googleapis.com/css2?family=${families.join('&family=')}&display=swap`;
}

export function applyGalleryConfigToDocument(cfg = activeConfig) {
  const root = document.documentElement;
  const { theme, grounds, fonts } = cfg;

  /* Config-* vars only — do not set --paper/--ink inline or dark mode CSS cannot override */
  for (const legacy of ['--paper', '--ink', '--ink-soft', '--red', '--red-bright', '--measure']) {
    root.style.removeProperty(legacy);
  }
  root.style.setProperty('--config-paper', theme.paper);
  root.style.setProperty('--config-ink', theme.ink);
  root.style.setProperty('--config-ink-soft', theme.inkSoft);
  root.style.setProperty('--config-red', theme.red);
  root.style.setProperty('--config-red-bright', theme.redBright);
  root.style.setProperty('--config-measure', theme.measure);
  root.style.setProperty('--config-poster-width', theme.posterWidth || theme.measure);
  const edgeMix = Math.min(0.4, Math.max(0.04, Number(theme.edgeStepMix) || 0.12));
  root.style.setProperty('--config-edge-mix', `${Math.round(edgeMix * 100)}%`);

  for (const [name, hex] of Object.entries(grounds)) {
    root.style.setProperty(`--ground-${name}`, hex);
  }

  root.style.setProperty('--font-ui-sans', `'${fonts.uiSans.family}', system-ui, sans-serif`);
  root.style.setProperty('--font-ui-serif', `'${fonts.uiSerif.family}', Georgia, 'Times New Roman', serif`);
  root.style.setProperty('--font-mono', `'${fonts.mono.family}', ui-monospace, SFMono-Regular, Menlo, monospace`);


  const link = document.getElementById('fonts-link');
  if (link) link.href = fontsHrefFromConfig(cfg);
}

export { DEFAULT_CONFIG };
