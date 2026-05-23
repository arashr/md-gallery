/** @typedef {{ id: string, google: string }} TitleFaceConfig */
/** @typedef {{ display?: string, body?: string, muted?: string, accent?: string, focus?: string }} GroundForeground */
/** @typedef {{ surface: string, foreground?: GroundForeground, grainOpacity?: number }} GroundDef */
/** @typedef {string | GroundDef} GroundEntry */

const DEFAULT_GROUND_FOREGROUND = {
  light: {
    display: 'red',
    body: 'inkSoft',
    muted: '#363b40',
    accent: 'red',
    focus: 'redBright'
  },
  tangerine: {
    display: '#710617',
    body: 'ink',
    muted: '#363b40',
    accent: '#710617',
    focus: '#710617'
  },
  forest: {
    display: '#0a3d28',
    body: 'ink',
    muted: '#2d4238',
    accent: '#0a3d28',
    focus: '#0a3d28'
  },
  carmine: {
    display: '#ffffff',
    body: '#ffffff',
    muted: '#f5f7f9',
    accent: '#ffffff',
    focus: '#ffffff'
  }
};

const DEFAULT_CONFIG = {
  theme: {
    colors: {
      paper: '#eff1f3',
      ink: '#0c0e10',
      inkSoft: '#1b1f24',
      inkMute: 'rgba(12, 14, 16, 0.66)',
      red: '#c8102e',
      redBright: '#e8334e'
    },
    layout: {
      measure: '65ch',
      posterWidth: '42rem',
      edgeStepMix: 0.12,
      pad: 'clamp(16px, 4vw, 56px)',
      scrollOffset: '6.5rem'
    },
    hero: {
      display: 'red',
      body: 'inkSoft',
      muted: 'inkMute'
    },
    typography: {
      bodySize: '17px',
      bodyLineHeight: '1.6',
      labelSize: '0.75rem',
      labelWeight: '500',
      labelLetterSpacing: '0.06em',
      proseSize: '18px',
      crumbSize: '0.85rem'
    },
    motion: {
      cardHoverEase: 'cubic-bezier(0.22, 1, 0.36, 1)',
      cardHoverDuration: '0.4s'
    },
    grain: {
      opacity: 0.55,
      opacityOnDarkGrounds: 0.45,
      tileSize: '96px'
    }
  },
  darkTheme: {
    paper: '#12151a',
    colors: {
      ink: '#eef0f4',
      inkSoft: '#c8cdd6',
      inkMute: '#9aa3b0',
      red: '#ff6b7d',
      redBright: '#ff8a98'
    },
    dropZone: {
      butterMix: '22%'
    }
  },
  grounds: {
    pink: {
      surface: '#f4a8c2',
      foreground: DEFAULT_GROUND_FOREGROUND.light,
      grainOpacity: 0.55
    },
    chartreuse: {
      surface: '#d8e04a',
      foreground: DEFAULT_GROUND_FOREGROUND.light,
      grainOpacity: 0.55
    },
    lime: {
      surface: '#E0FF83',
      foreground: DEFAULT_GROUND_FOREGROUND.light,
      grainOpacity: 0.55
    },
    tangerine: {
      surface: '#f0894e',
      foreground: DEFAULT_GROUND_FOREGROUND.tangerine,
      grainOpacity: 0.45
    },
    lilac: {
      surface: '#c5bfe8',
      foreground: DEFAULT_GROUND_FOREGROUND.light,
      grainOpacity: 0.55
    },
    forest: {
      surface: '#8fb89b',
      foreground: DEFAULT_GROUND_FOREGROUND.forest,
      grainOpacity: 0.45
    },
    butter: {
      surface: '#ffc64d',
      foreground: DEFAULT_GROUND_FOREGROUND.light,
      grainOpacity: 0.55
    },
    mint: {
      surface: '#a7dbce',
      foreground: DEFAULT_GROUND_FOREGROUND.light,
      grainOpacity: 0.55
    },
    carmine: {
      surface: '#b52840',
      foreground: DEFAULT_GROUND_FOREGROUND.carmine,
      grainOpacity: 0.45
    }
  },
  fonts: {
    uiSans: {
      family: 'Inconsolata',
      google: 'Inconsolata:ital,wght@0,500;0,700;0,900;1,400'
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

/** @param {GroundEntry} entry */
function defaultForegroundForGround(name) {
  if (name === 'tangerine') return DEFAULT_GROUND_FOREGROUND.tangerine;
  if (name === 'forest') return DEFAULT_GROUND_FOREGROUND.forest;
  if (name === 'carmine') return DEFAULT_GROUND_FOREGROUND.carmine;
  return DEFAULT_GROUND_FOREGROUND.light;
}

export function normalizeGround(entry, name) {
  if (typeof entry === 'string') {
    return {
      surface: entry,
      foreground: { ...defaultForegroundForGround(name) },
      grainOpacity: DEFAULT_CONFIG.theme.grain.opacity
    };
  }
  const fg = { ...(DEFAULT_GROUND_FOREGROUND.light), ...(entry.foreground || {}) };
  return {
    surface: entry.surface,
    foreground: fg,
    grainOpacity: entry.grainOpacity ?? DEFAULT_CONFIG.theme.grain.opacity
  };
}

/** @returns {Record<string, GroundDef>} */
export function getGroundDefs(cfg = activeConfig) {
  const out = {};
  for (const [name, entry] of Object.entries(cfg.grounds || {})) {
    out[name] = normalizeGround(entry, name);
  }
  return out;
}

function themeColors(cfg) {
  const t = cfg.theme || {};
  const c = t.colors || {};
  return {
    paper: c.paper ?? t.paper ?? DEFAULT_CONFIG.theme.colors.paper,
    ink: c.ink ?? t.ink ?? DEFAULT_CONFIG.theme.colors.ink,
    inkSoft: c.inkSoft ?? t.inkSoft ?? DEFAULT_CONFIG.theme.colors.inkSoft,
    inkMute: c.inkMute ?? t.inkMute ?? DEFAULT_CONFIG.theme.colors.inkMute,
    red: c.red ?? t.red ?? DEFAULT_CONFIG.theme.colors.red,
    redBright: c.redBright ?? t.redBright ?? DEFAULT_CONFIG.theme.colors.redBright
  };
}

/** Resolve semantic token (e.g. "red", "inkSoft") or pass through hex/rgba. */
export function resolveColor(value, cfg = activeConfig) {
  if (value == null || value === '') return value;
  const s = String(value).trim();
  if (s.startsWith('#') || s.startsWith('rgb') || s.startsWith('hsl') || s === 'var(--hair)') {
    return s;
  }
  const colors = themeColors(cfg);
  const map = {
    paper: colors.paper,
    ink: colors.ink,
    inkSoft: colors.inkSoft,
    inkMute: colors.inkMute,
    red: colors.red,
    redBright: colors.redBright
  };
  return map[s] ?? s;
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

export async function reloadGalleryConfig(url = 'config/gallery.config.json') {
  const cfg = await loadGalleryConfig(url);
  applyGalleryConfigToDocument(cfg);
  return cfg;
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

export function buildGroundStylesheet(cfg) {
  const defs = getGroundDefs(cfg);
  const darkGrain = cfg.theme?.grain?.opacityOnDarkGrounds ?? 0.45;
  const lines = [];

  for (const [name, def] of Object.entries(defs)) {
    const fg = def.foreground;
    const grain = def.grainOpacity ?? darkGrain;
    lines.push(
      `.ground-${name}{background:var(--ground-${name});--surface:var(--ground-${name});--poster-grain-opacity:${grain};` +
        `--on-ground-display:${resolveColor(fg.display, cfg)};` +
        `--on-ground-body:${resolveColor(fg.body, cfg)};` +
        `--on-ground-muted:${resolveColor(fg.muted, cfg)};` +
        `--on-ground-accent:${resolveColor(fg.accent, cfg)};` +
        `--on-ground-focus:${resolveColor(fg.focus, cfg)};}`
    );
  }

  return lines.join('\n');
}

function ensureGroundStyleEl() {
  let el = document.getElementById('gallery-config-grounds');
  if (!el) {
    el = document.createElement('style');
    el.id = 'gallery-config-grounds';
    document.head.appendChild(el);
  }
  return el;
}

export function applyGalleryConfigToDocument(cfg = activeConfig) {
  const root = document.documentElement;
  const colors = themeColors(cfg);
  const layout = { ...DEFAULT_CONFIG.theme.layout, ...(cfg.theme?.layout || {}) };
  const hero = { ...DEFAULT_CONFIG.theme.hero, ...(cfg.theme?.hero || {}) };
  const typo = { ...DEFAULT_CONFIG.theme.typography, ...(cfg.theme?.typography || {}) };
  const motion = { ...DEFAULT_CONFIG.theme.motion, ...(cfg.theme?.motion || {}) };
  const grain = { ...DEFAULT_CONFIG.theme.grain, ...(cfg.theme?.grain || {}) };
  const dark = { ...DEFAULT_CONFIG.darkTheme, ...(cfg.darkTheme || {}) };
  const darkColors = { ...DEFAULT_CONFIG.darkTheme.colors, ...(dark.colors || {}) };
  const { fonts } = cfg;

  for (const legacy of ['--paper', '--ink', '--ink-soft', '--red', '--red-bright', '--measure']) {
    root.style.removeProperty(legacy);
  }

  root.style.setProperty('--config-paper', colors.paper);
  root.style.setProperty('--config-ink', colors.ink);
  root.style.setProperty('--config-ink-soft', colors.inkSoft);
  root.style.setProperty('--config-ink-mute', colors.inkMute);
  root.style.setProperty('--config-red', colors.red);
  root.style.setProperty('--config-red-bright', colors.redBright);

  root.style.setProperty('--config-measure', layout.measure);
  root.style.setProperty('--config-poster-width', layout.posterWidth || layout.measure);
  const edgeMix = Math.min(0.4, Math.max(0.04, Number(layout.edgeStepMix) || 0.12));
  root.style.setProperty('--config-edge-mix', `${Math.round(edgeMix * 100)}%`);
  root.style.setProperty('--config-pad', layout.pad);
  root.style.setProperty('--config-scroll-offset', layout.scrollOffset);

  root.style.setProperty('--config-hero-display', resolveColor(hero.display, cfg));
  root.style.setProperty('--config-hero-body', resolveColor(hero.body, cfg));
  root.style.setProperty('--config-hero-muted', resolveColor(hero.muted, cfg));

  root.style.setProperty('--config-body-size', typo.bodySize);
  root.style.setProperty('--config-body-line-height', String(typo.bodyLineHeight));
  root.style.setProperty('--config-label-size', typo.labelSize);
  root.style.setProperty('--config-label-weight', String(typo.labelWeight));
  root.style.setProperty('--config-label-letter-spacing', typo.labelLetterSpacing);
  root.style.setProperty('--config-prose-size', typo.proseSize);
  root.style.setProperty('--config-crumb-size', typo.crumbSize);

  root.style.setProperty('--config-card-hover-ease', motion.cardHoverEase);
  root.style.setProperty('--config-card-hover-duration', motion.cardHoverDuration);

  root.style.setProperty('--config-grain-opacity', String(grain.opacity));
  root.style.setProperty('--config-grain-opacity-dark', String(grain.opacityOnDarkGrounds));
  root.style.setProperty('--config-grain-tile-size', grain.tileSize ?? '96px');

  root.style.setProperty('--config-dark-paper', dark.paper ?? DEFAULT_CONFIG.darkTheme.paper);
  root.style.setProperty('--config-dark-ink', darkColors.ink);
  root.style.setProperty('--config-dark-ink-soft', darkColors.inkSoft);
  root.style.setProperty('--config-dark-ink-mute', darkColors.inkMute);
  root.style.setProperty('--config-dark-red', darkColors.red);
  root.style.setProperty('--config-dark-red-bright', darkColors.redBright);
  root.style.setProperty(
    '--config-dark-drop-butter-mix',
    dark.dropZone?.butterMix ?? DEFAULT_CONFIG.darkTheme.dropZone.butterMix
  );

  const defs = getGroundDefs(cfg);
  for (const [name, def] of Object.entries(defs)) {
    root.style.setProperty(`--ground-${name}`, def.surface);
  }

  root.style.setProperty('--font-ui-sans', `'${fonts.uiSans.family}', system-ui, sans-serif`);
  root.style.setProperty('--font-ui-serif', `'${fonts.uiSerif.family}', Georgia, 'Times New Roman', serif`);
  root.style.setProperty('--font-mono', `'${fonts.mono.family}', ui-monospace, SFMono-Regular, Menlo, monospace`);

  const link = document.getElementById('fonts-link');
  if (link) link.href = fontsHrefFromConfig(cfg);

  if (typeof document !== 'undefined') {
    ensureGroundStyleEl().textContent = buildGroundStylesheet(cfg);
  }
}

export { DEFAULT_CONFIG };
