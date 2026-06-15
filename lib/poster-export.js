import {
  buildCodeStylesheetForExport,
  buildExportRootVars,
  buildGroundStylesheet,
  buildTitleFaceStylesheet,
  getGalleryConfig,
  getGroundDefs,
  resolveColor
} from './gallery-config.js';

/** @param {string} name */
export function posterPdfFilename(name) {
  const base =
    String(name)
      .trim()
      .replace(/[^\w\s-]+/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'poster';
  return `${base}.pdf`;
}

/** html2canvas 1.x cannot parse oklch(), color-mix(), lab(), etc. */
const UNSUPPORTED_COLOR_RE = /oklch|color-mix|(?:^|[\s,])lab\(|\blch\(/i;
const COLOR_FN_START_RE = /(?:oklch|color-mix|lab|lch)\(/gi;

const EXPORT_CSS_HREFS = ['assets/site.css', 'assets/reader.css'];
/** @type {Map<string, string>} */
const exportCssCache = new Map();

const CSS_IMPORT_RE = /@import\s+url\((['"]?)([^'")]+)\1\)\s*;?/gi;

/**
 * Inline nested @import rules — export injects raw CSS into the clone (no import resolver).
 *
 * @param {string} css
 * @param {(href: string) => Promise<string>} load
 */
export async function flattenCssImports(css, load) {
  const parts = [];
  let last = 0;
  const re = new RegExp(CSS_IMPORT_RE.source, 'gi');
  let m;
  while ((m = re.exec(css)) !== null) {
    parts.push(css.slice(last, m.index));
    const imported = await load(m[2]);
    parts.push(imported ? await flattenCssImports(imported, load) : '');
    last = m.index + m[0].length;
  }
  parts.push(css.slice(last));
  return parts.join('\n');
}

/**
 * @param {string} href
 * @param {Set<string>} [seen]
 */
async function fetchCssBundle(href, seen = new Set()) {
  const base = new URL(href, window.location.href);
  if (seen.has(base.href)) return '';
  seen.add(base.href);

  let raw = exportCssCache.get(base.href);
  if (raw === undefined) {
    const res = await fetch(base.href);
    if (!res.ok) throw new Error(`Failed to load ${href}`);
    raw = await res.text();
    exportCssCache.set(base.href, raw);
  }

  return flattenCssImports(raw, (importHref) =>
    fetchCssBundle(new URL(importHref, base.href).href, seen)
  );
}

/**
 * @param {HTMLElement} card
 */
function exportColorContext(card) {
  const wrap = document.createElement('div');
  wrap.className = [...card.classList]
    .filter((c) => c.startsWith('ground-') || c.startsWith('title-face-') || c === 'post-card')
    .join(' ');
  wrap.style.cssText =
    'position:fixed;left:-9999px;top:0;visibility:hidden;pointer-events:none;contain:strict;';
  document.body.appendChild(wrap);
  return wrap;
}

/**
 * @param {string} value
 * @param {HTMLElement} context
 */
function resolvePaintInContext(value, context) {
  if (!value || value === 'none' || value === 'transparent') return value;
  if (!UNSUPPORTED_COLOR_RE.test(value)) return value;

  const props = ['color', 'background-color', 'background', 'border-color', 'outline-color'];
  for (const prop of props) {
    const probe = document.createElement('span');
    context.appendChild(probe);
    probe.style.setProperty(prop, value);
    const resolved = getComputedStyle(probe).getPropertyValue(prop);
    probe.remove();
    if (resolved && !UNSUPPORTED_COLOR_RE.test(resolved)) return resolved.trim();
  }

  const probe = document.createElement('span');
  probe.style.cssText = 'position:fixed;left:-9999px;visibility:hidden;pointer-events:none;';
  probe.style.setProperty('color', value);
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).getPropertyValue('color');
  probe.remove();
  if (!resolved || UNSUPPORTED_COLOR_RE.test(resolved)) return null;
  return resolved.trim();
}

/**
 * @param {string} css
 * @param {HTMLElement} context
 */
function sanitizeCssForExport(css, context) {
  const spans = [];
  let i = 0;
  while (i < css.length) {
    COLOR_FN_START_RE.lastIndex = i;
    const m = COLOR_FN_START_RE.exec(css);
    if (!m || m.index === undefined) break;
    const start = m.index;
    const open = css.indexOf('(', start);
    if (open < 0) break;
    let depth = 0;
    let j = open;
    for (; j < css.length; j++) {
      if (css[j] === '(') depth++;
      else if (css[j] === ')') {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
    }
    spans.push({ start, end: j, text: css.slice(start, j) });
    i = j;
  }

  if (!spans.length) return css;

  let out = '';
  let last = 0;
  for (const { start, end, text } of spans) {
    out += css.slice(last, start);
    out += resolvePaintInContext(text, context) ?? 'transparent';
    last = end;
  }
  return out + css.slice(last);
}

/**
 * @param {HTMLElement} card
 */
async function buildExportStylesheet(card) {
  const cfg = getGalleryConfig();
  const context = exportColorContext(card);
  try {
    const chunks = [
      buildExportRootVars(cfg),
      buildGroundStylesheet(cfg),
      buildCodeStylesheetForExport(cfg),
      buildTitleFaceStylesheet(cfg)
    ];

    for (const href of EXPORT_CSS_HREFS) {
      chunks.push(sanitizeCssForExport(await fetchCssBundle(href), context));
    }

    return chunks.join('\n');
  } finally {
    context.remove();
  }
}

/**
 * @param {HTMLElement} root
 * @param {HTMLElement} context
 */
function inlineUnsupportedColors(root, context) {
  const props = [
    'color',
    'background-color',
    'background',
    'border-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'text-decoration-color',
    'column-rule-color',
    'caret-color',
    'fill',
    'stroke'
  ];

  const nodes = [root, ...root.querySelectorAll('*')];
  for (const el of nodes) {
    if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) continue;
    const cs = getComputedStyle(el);
    for (const prop of props) {
      const val = cs.getPropertyValue(prop);
      if (!val || !UNSUPPORTED_COLOR_RE.test(val)) continue;
      const fixed = resolvePaintInContext(val, context);
      if (fixed) el.style.setProperty(prop, fixed, 'important');
    }
  }
}

/**
 * Pin poster surface + foreground tokens from config (hex) so export colors match the screen.
 *
 * @param {HTMLElement} card
 */
function pinGroundColors(card) {
  const groundClass = [...card.classList].find((c) => c.startsWith('ground-'));
  if (!groundClass) return;

  const name = groundClass.slice('ground-'.length);
  const cfg = getGalleryConfig();
  const def = getGroundDefs(cfg)[name];
  if (!def) return;

  const surface = resolveColor(def.surface, cfg);
  const fg = def.foreground ?? {};
  card.style.setProperty('background-color', surface, 'important');
  card.style.setProperty('--surface', surface, 'important');
  card.style.setProperty('--on-ground-display', resolveColor(fg.display ?? 'ink', cfg), 'important');
  card.style.setProperty('--on-ground-body', resolveColor(fg.body ?? 'ink', cfg), 'important');
  card.style.setProperty('--on-ground-muted', resolveColor(fg.muted ?? 'ink', cfg), 'important');
  card.style.setProperty('--on-ground-accent', resolveColor(fg.accent ?? 'ink', cfg), 'important');
}

/** Drop linked/authored stylesheets from html2canvas's clone document (they contain oklch). */
function stripCloneStylesheets(doc) {
  doc.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => node.remove());
}

/**
 * @param {Document} doc
 * @param {string} exportCss
 */
function injectExportStyles(doc, exportCss) {
  const style = doc.createElement('style');
  style.id = 'md-gallery-export-styles';
  style.textContent = exportCss;
  doc.head.appendChild(style);

  const fontsHref = document.getElementById('fonts-link')?.getAttribute('href');
  if (fontsHref) {
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontsHref;
    doc.head.appendChild(link);
  }
}

/**
 * Best-effort: inline any loadable external <img> sources to avoid tainted canvases.
 *
 * @param {HTMLElement} root
 */
async function inlineExportImages(root) {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src') || '';
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;

      let url;
      try {
        url = new URL(src, window.location.href);
      } catch {
        return;
      }

      const isSameOrigin = url.origin === window.location.origin;
      if (!isSameOrigin) img.crossOrigin = 'anonymous';

      try {
        const res = await fetch(url.href, { mode: 'cors', credentials: 'omit' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('FileReader failed'));
          reader.readAsDataURL(blob);
        });
        if (dataUrl) img.src = dataUrl;
      } catch {
        const placeholder = document.createElement('div');
        placeholder.className = 'export-img-placeholder';
        placeholder.textContent = img.getAttribute('alt')?.trim() || 'Image omitted';
        placeholder.style.cssText = [
          'display:flex',
          'align-items:center',
          'justify-content:center',
          'min-height:120px',
          'padding:12px',
          'border:2px solid currentColor',
          'opacity:0.85',
          'font-family:inherit',
          'font-size:14px',
          'text-align:center'
        ].join(';');
        img.replaceWith(placeholder);
      }
    })
  );
}

/** jsPDF UMD bundle (index.html) — ESM build has bare imports the import map cannot resolve. */
function loadJsPDF() {
  const ctor = globalThis.jspdf?.jsPDF ?? globalThis.jspdf?.default;
  if (typeof ctor !== 'function') {
    throw new Error('jsPDF failed to load (check node_modules/jspdf is installed)');
  }
  return ctor;
}

/** @param {HTMLElement} card */
export function posterExportLayoutSize(card) {
  const rect = card.getBoundingClientRect();
  return {
    width: Math.max(1, Math.ceil(rect.width)),
    height: Math.max(1, Math.ceil(rect.height))
  };
}

/** Raster scale for html2canvas — PDF page stays at layout px; image is supersampled into it. */
export function posterExportRasterScale(dpr = 1) {
  const targetDpi = 192;
  const cssDpi = 96;
  return Math.min(4, Math.max(3, Math.ceil(targetDpi / cssDpi), dpr));
}

/**
 * Render a poster card to a PDF download (client-side only).
 * High-resolution raster snapshot (PNG in PDF) matching on-screen design.
 *
 * @param {HTMLElement} card
 * @param {string} [filename]
 */
export async function exportPosterAsPdf(card, filename = 'poster') {
  if (!card) throw new Error('Missing poster');

  const { default: html2canvas } = await import('html2canvas');
  const jsPDF = loadJsPDF();

  card.classList.add('is-exporting');
  const colorContext = exportColorContext(card);
  let exportCss = '';
  try {
    if (document.fonts?.ready) await document.fonts.ready;

    exportCss = await buildExportStylesheet(card);
    await inlineExportImages(card);

    const posterBg =
      resolvePaintInContext(getComputedStyle(card).backgroundColor, colorContext) || '#eff1f3';

    const { width: layoutWidth, height: layoutHeight } = posterExportLayoutSize(card);
    const scale = posterExportRasterScale(window.devicePixelRatio || 1);

    const canvas = await html2canvas(card, {
      scale,
      useCORS: true,
      backgroundColor: posterBg,
      logging: false,
      imageTimeout: 15000,
      onclone(doc, ref) {
        stripCloneStylesheets(doc);
        injectExportStyles(doc, exportCss);
        if (ref instanceof HTMLElement) {
          pinGroundColors(ref);
          inlineUnsupportedColors(ref, colorContext);
          ref.querySelectorAll('.post-card__toolbar, .code-block__copy').forEach((el) => el.remove());
        }
      }
    });

    const imgData = canvas.toDataURL('image/png');
    const orientation = layoutWidth >= layoutHeight ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [layoutWidth, layoutHeight],
      compress: true
    });
    pdf.addImage(imgData, 'PNG', 0, 0, layoutWidth, layoutHeight, undefined, 'MEDIUM');
    pdf.save(posterPdfFilename(filename));
  } finally {
    colorContext.remove();
    card.classList.remove('is-exporting');
  }
}
