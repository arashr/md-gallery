/** @typedef {{ id: string, google: string, lineHeight?: string, headingLineHeight?: string, letterSpacing?: string }} TitleFaceConfig */
/** @typedef {{ display?: string, body?: string, muted?: string, accent?: string, focus?: string, linkHoverText?: string, linkHoverBg?: string }} GroundForeground */
/** @typedef {{ surface: string, foreground?: GroundForeground, grainOpacity?: number }} GroundDef */
/** @typedef {string | GroundDef} GroundEntry */

const DEFAULT_GROUND_FOREGROUND = {
  light: {
    display: '#710617',
    body: 'ink',
    muted: '#1f2428',
    accent: '#710617',
    focus: 'ink',
    linkHoverText: '#ffffff',
    linkHoverBg: 'ink'
  },
  tangerine: {
    display: '#710617',
    body: 'ink',
    muted: '#1f2428',
    accent: '#710617',
    focus: '#710617',
    linkHoverText: '#ffffff',
    linkHoverBg: 'ink'
  },
  forest: {
    display: '#0a3d28',
    body: 'ink',
    muted: '#1f2428',
    accent: '#0a3d28',
    focus: '#0a3d28',
    linkHoverText: '#ffffff',
    linkHoverBg: 'ink'
  },
  carmine: {
    display: '#ffffff',
    body: '#ffffff',
    muted: '#f5f7f9',
    accent: '#ffffff',
    focus: '#ffffff',
    linkHoverText: '#ffffff',
    linkHoverBg: 'ink'
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
      bodyLineHeight: '1.5',
      proseLineHeight: '1.6',
      titleLineHeight: '1.12',
      titleHeadingLineHeight: '0.95',
      titleFaceLetterSpacing: '0.02em',
      labelSize: '0.75rem',
      labelWeight: '500',
      labelLetterSpacing: '0.06em',
      proseSize: '18px',
      crumbSize: '0.85rem'
    },
    motion: {
      cardHoverEase: 'cubic-bezier(0.22, 1, 0.36, 1)',
      cardHoverDuration: '0.4s',
      revealDuration: '0.8s',
      revealEase: 'ease',
      shutterDuration: '0.9s',
      shutterEase: 'cubic-bezier(0.77, 0, 0.18, 1)'
    },
    grain: {
      opacity: 0.55,
      opacityOnDarkGrounds: 0.45,
      tileSize: '96px'
    },
    code: {
      text: 'paper',
      blockSteps: 2,
      blockStepMix: 0.36,
      referenceSteps: 2,
      autoCompensateMix: true,
      inlineSurfaceMix: '35%'
    }
  },
  darkTheme: {
    paper: '#12151a',
    colors: {
      ink: '#eef0f4',
      inkSoft: '#c8cdd6',
      inkMute: '#c0c8d4',
      red: '#ffa0ab',
      redBright: '#ffb3bc'
    },
    dropZone: {
      butterMix: '22%'
    }
  },
  grounds: {
    pink: {
      surface: '#f8c0d4',
      foreground: DEFAULT_GROUND_FOREGROUND.light,
      grainOpacity: 0.55
    },
    chartreuse: {
      surface: '#d8e04a',
      foreground: DEFAULT_GROUND_FOREGROUND.light,
      grainOpacity: 0.55
    },
    lime: {
      surface: '#e0ff83',
      foreground: DEFAULT_GROUND_FOREGROUND.light,
      grainOpacity: 0.55
    },
    tangerine: {
      surface: '#fbc090',
      foreground: DEFAULT_GROUND_FOREGROUND.tangerine,
      grainOpacity: 0.45
    },
    lilac: {
      surface: '#d5d0ef',
      foreground: DEFAULT_GROUND_FOREGROUND.light,
      grainOpacity: 0.55
    },
    forest: {
      surface: '#b8d8c5',
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
      google: 'Inter+Mono:ital,wght@0,400;0,500;1,400',
      lineHeight: '1.45'
    },
    titleFaces: [
      { id: 'ultra', google: 'Ultra', letterSpacing: '-0.005em' },
      { id: 'monoton', google: 'Monoton', lineHeight: '0.88', letterSpacing: '0.04em' },
      { id: 'limelight', google: 'Limelight', letterSpacing: '0.02em' },
      { id: 'jersey25', google: 'Jersey+25', lineHeight: '0.88', letterSpacing: '0.03em' },
      { id: 'blackops', google: 'Black+Ops+One', lineHeight: '0.86', letterSpacing: '0.02em' },
      { id: 'notable', google: 'Notable', lineHeight: '0.9', letterSpacing: '0.01em' }
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
  const fg = { ...defaultForegroundForGround(name), ...(entry.foreground || {}) };
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
        `--on-ground-focus:${resolveColor(fg.focus, cfg)};` +
        `--on-ground-link-hover-text:${resolveColor(fg.linkHoverText ?? '#ffffff', cfg)};` +
        `--on-ground-link-hover-bg:${resolveColor(fg.linkHoverBg ?? 'ink', cfg)};}`
    );
  }

  return lines.join('\n');
}

function clampMix(value, max = 0.65) {
  return Math.min(max, Math.max(0.04, Number(value) || 0.12));
}

function clampCodeSteps(value) {
  return Math.max(1, Math.min(4, Number(value) || 2));
}

/**
 * Per-step OKLCH mix toward black. When autoCompensateMix is true (default),
 * blockStepMix + referenceSteps define target darkness; mix scales with blockSteps
 * so 1 step at ~0.59 ≈ 2 steps at 0.36.
 */
export function resolveCodeStepMix(cfg = activeConfig) {
  const code = { ...DEFAULT_CONFIG.theme.code, ...(cfg.theme?.code || {}) };
  const layout = { ...DEFAULT_CONFIG.theme.layout, ...(cfg.theme?.layout || {}) };
  const edgeMix = clampMix(layout.edgeStepMix ?? 0.12);
  const steps = clampCodeSteps(code.blockSteps);

  if (code.autoCompensateMix === false) {
    return clampMix(code.blockStepMix ?? edgeMix);
  }

  const refSteps = clampCodeSteps(code.referenceSteps ?? 2);
  const refMix = clampMix(code.blockStepMix ?? 0.36);
  const retention = Math.pow(1 - refMix, refSteps);
  return clampMix(1 - Math.pow(retention, 1 / steps));
}

export function resolveCodeBlockSteps(cfg = activeConfig) {
  const code = { ...DEFAULT_CONFIG.theme.code, ...(cfg.theme?.code || {}) };
  return clampCodeSteps(code.blockSteps);
}

/** @param {string} base CSS color expression, e.g. `var(--surface)` */
export function codeBlockBgMixExpr(base, steps = 2, mixVar = 'var(--code-step-mix)') {
  const n = Math.max(1, Math.min(4, Number(steps) || 2));
  let expr = base;
  for (let i = 0; i < n; i++) {
    expr = `color-mix(in oklch, ${expr} calc(100% - ${mixVar}), black)`;
  }
  return expr;
}

function parseHexRgb(hex) {
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Conservative sRGB mix for APCA tests (OKLCH in CSS is the source of truth). */
export function codeBlockBgFromSurface(surface, cfg = activeConfig) {
  const blockMix = resolveCodeStepMix(cfg);
  const steps = resolveCodeBlockSteps(cfg);
  let rgb = parseHexRgb(resolveColor(surface, cfg));
  for (let i = 0; i < steps; i++) {
    rgb = rgb.map((c) => Math.round(c * (1 - blockMix)));
  }
  return rgbToHex(rgb);
}

export function buildCodeStylesheet(cfg) {
  const code = { ...DEFAULT_CONFIG.theme.code, ...(cfg.theme?.code || {}) };
  const steps = resolveCodeBlockSteps(cfg);
  const inlineMix = code.inlineSurfaceMix ?? '35%';
  const groundBg = codeBlockBgMixExpr('var(--surface)', steps);
  const pageBg = codeBlockBgMixExpr('var(--paper)', steps);

  return (
    `[class*='ground-']{--on-ground-code-bg:${groundBg};}\n` +
    `:root{--code-block-bg:${pageBg};}\n` +
    `[class*='ground-'] .prose pre{--code-block-bg:var(--on-ground-code-bg);}\n` +
    `.post-card[class*='ground-'] .prose :not(pre)>code{background:color-mix(in oklch,var(--on-ground-code-bg) ${inlineMix},var(--surface));}`
  );
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

function ensureCodeStyleEl() {
  let el = document.getElementById('gallery-config-code');
  if (!el) {
    el = document.createElement('style');
    el.id = 'gallery-config-code';
    document.head.appendChild(el);
  }
  return el;
}

/** @param {TitleFaceConfig} face @param {typeof DEFAULT_CONFIG.theme.typography} typo */
export function resolveTitleFaceTypography(face, typo) {
  const titleLh = face.lineHeight ?? typo.titleLineHeight ?? '1.12';
  const headingLh = face.headingLineHeight ?? face.lineHeight ?? typo.titleHeadingLineHeight ?? '0.95';
  const letterSpacing = face.letterSpacing ?? typo.titleFaceLetterSpacing ?? '0.02em';
  return { titleLh, headingLh, letterSpacing };
}

export function buildTitleFaceStylesheet(cfg) {
  const typo = { ...DEFAULT_CONFIG.theme.typography, ...(cfg.theme?.typography || {}) };
  const faces = cfg.fonts?.titleFaces ?? DEFAULT_CONFIG.fonts.titleFaces;
  const blocks = [];

  for (const face of faces) {
    const { titleLh, headingLh, letterSpacing } = resolveTitleFaceTypography(face, typo);
    const sel = `.post-card.title-face-${face.id}`;
    const titleSel = `${sel} .poster__title,${sel} .post-title,${sel} .post-title a`;
    const headingSel = `${sel} .prose :is(h2,h3,h4)`;
    const legendSel = `.legend-sample.title-face-${face.id}`;
    blocks.push(
      `${titleSel}{line-height:${titleLh};letter-spacing:${letterSpacing};}\n` +
        `${headingSel}{line-height:${headingLh};letter-spacing:${letterSpacing};}\n` +
        `${legendSel}{letter-spacing:${letterSpacing};}`
    );
  }

  return blocks.join('\n\n');
}

function ensureTitleFaceStyleEl() {
  let el = document.getElementById('gallery-config-title-faces');
  if (!el) {
    el = document.createElement('style');
    el.id = 'gallery-config-title-faces';
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
  const code = { ...DEFAULT_CONFIG.theme.code, ...(cfg.theme?.code || {}) };
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
  root.style.setProperty('--config-prose-line-height', String(typo.proseLineHeight ?? '1.6'));
  root.style.setProperty('--config-title-line-height', String(typo.titleLineHeight ?? '1.12'));
  root.style.setProperty(
    '--config-title-heading-line-height',
    String(typo.titleHeadingLineHeight ?? '0.95')
  );
  root.style.setProperty(
    '--config-title-face-letter-spacing',
    typo.titleFaceLetterSpacing ?? '0.02em'
  );
  root.style.setProperty('--config-label-size', typo.labelSize);
  root.style.setProperty('--config-label-weight', String(typo.labelWeight));
  root.style.setProperty('--config-label-letter-spacing', typo.labelLetterSpacing);
  root.style.setProperty('--config-prose-size', typo.proseSize);
  root.style.setProperty('--config-crumb-size', typo.crumbSize);

  root.style.setProperty('--config-card-hover-ease', motion.cardHoverEase);
  root.style.setProperty('--config-card-hover-duration', motion.cardHoverDuration);
  root.style.setProperty('--config-reveal-duration', motion.revealDuration ?? '0.8s');
  root.style.setProperty('--config-reveal-ease', motion.revealEase ?? 'ease');
  root.style.setProperty('--config-shutter-duration', motion.shutterDuration ?? '0.9s');
  root.style.setProperty('--config-shutter-ease', motion.shutterEase ?? 'cubic-bezier(0.77, 0, 0.18, 1)');

  root.style.setProperty('--config-grain-opacity', String(grain.opacity));
  root.style.setProperty('--config-grain-opacity-dark', String(grain.opacityOnDarkGrounds));
  root.style.setProperty('--config-grain-tile-size', grain.tileSize ?? '96px');

  root.style.setProperty('--config-code-text', resolveColor(code.text ?? 'paper', cfg));
  root.style.setProperty('--config-code-inline-mix', code.inlineSurfaceMix ?? '35%');
  const blockMix = resolveCodeStepMix(cfg);
  root.style.setProperty('--config-code-block-step-mix', `${Math.round(blockMix * 100)}%`);

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
  root.style.setProperty(
    '--config-ui-sans-line-height',
    String(fonts.uiSans?.lineHeight ?? typo.bodyLineHeight)
  );
  root.style.setProperty(
    '--config-ui-serif-line-height',
    String(fonts.uiSerif?.lineHeight ?? typo.bodyLineHeight)
  );
  root.style.setProperty(
    '--config-mono-line-height',
    String(fonts.mono?.lineHeight ?? DEFAULT_CONFIG.fonts.mono.lineHeight ?? '1.45')
  );

  const link = document.getElementById('fonts-link');
  if (link) link.href = fontsHrefFromConfig(cfg);

  if (typeof document !== 'undefined') {
    ensureGroundStyleEl().textContent = buildGroundStylesheet(cfg);
    ensureCodeStyleEl().textContent = buildCodeStylesheet(cfg);
    ensureTitleFaceStyleEl().textContent = buildTitleFaceStylesheet(cfg);
  }
}

export { DEFAULT_CONFIG };
