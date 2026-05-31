import {
  loadGalleryConfig,
  setGalleryConfig,
  applyGalleryConfigToDocument,
  getGalleryConfig,
  getGroundDefs
} from '../lib/gallery-config.js';
import { buildLabGalleryConfig, readLabStateFromConfig } from '../lib/config-lab-build.js';
import { renderPosterGlyphPatterns } from '../lib/poster-glyph-render.js';
import { fitPosterTitles } from '../lib/fit-poster-title.js';
import { enhancePosterImageHalftone } from '../lib/image-halftone.js';
import { PATTERN_TYPES } from '../lib/type-pattern.js';
import { POSTER_GLYPH_BLEND_MODES } from '../lib/glyph-blend-opacity.js';

const form = document.getElementById('lab-form');
const groundSelect = document.getElementById('lab-ground');
const titleFaceSelect = document.getElementById('lab-title-face');
const patternTypeSelect = document.getElementById('lab-pattern-type');
const patternBlendSelect = document.getElementById('lab-pattern-blend');
const heroBlendSelect = document.getElementById('lab-hero-blend');
const reloadBtn = document.getElementById('lab-reload-file');
const previewCards = () => Array.from(document.querySelectorAll('#lab-preview-grid .post-card'));

/** @type {import('../lib/gallery-config.js').GalleryConfig} */
let baseConfig;
let applyTimer = 0;

const BLEND_UI = ['plain', ...POSTER_GLYPH_BLEND_MODES.filter((m) => m !== 'source-over')];

function fillSelect(select, options, selected) {
  if (!(select instanceof HTMLSelectElement)) return;
  select.replaceChildren();
  for (const opt of options) {
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.label;
    if (opt.value === selected) el.selected = true;
    select.appendChild(el);
  }
}

function populateDropdowns(cfg) {
  const grounds = Object.keys(getGroundDefs(cfg));
  fillSelect(
    groundSelect,
    grounds.map((g) => ({ value: g, label: g })),
    readLabStateFromConfig(cfg).ground
  );

  const faces = cfg.fonts?.titleFaces ?? [];
  fillSelect(
    titleFaceSelect,
    faces.map((f) => ({ value: f.id, label: f.id })),
    readLabStateFromConfig(cfg).titleFace
  );

  fillSelect(
    patternTypeSelect,
    PATTERN_TYPES.map((t) => ({ value: t, label: t })),
    readLabStateFromConfig(cfg).patternType
  );

  fillSelect(
    patternBlendSelect,
    BLEND_UI.map((m) => ({ value: m, label: m })),
    readLabStateFromConfig(cfg).patternBlend
  );

  fillSelect(
    heroBlendSelect,
    BLEND_UI.filter((m) => m !== 'plain').map((m) => ({ value: m, label: m })),
    readLabStateFromConfig(cfg).heroBlend
  );
}

/** @param {Record<string, unknown>} state */
function writeForm(state) {
  if (!(form instanceof HTMLFormElement)) return;
  for (const [name, value] of Object.entries(state)) {
    const field = form.elements.namedItem(name);
    if (!field) continue;
    if (field instanceof HTMLInputElement) {
      if (field.type === 'checkbox') field.checked = Boolean(value);
      else field.value = String(value ?? '');
    } else if (field instanceof HTMLSelectElement) {
      field.value = String(value ?? '');
    }
  }
  syncRangeOutputs();
}

function readFormState() {
  if (!(form instanceof HTMLFormElement)) return {};
  /** @type {Record<string, unknown>} */
  const state = {};
  for (const el of form.elements) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement)) continue;
    if (!el.name) continue;
    if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      state[el.name] = el.checked;
    } else if (el instanceof HTMLInputElement && el.type === 'number') {
      state[el.name] = Number.parseFloat(el.value);
    } else if (el instanceof HTMLInputElement && el.type === 'range') {
      state[el.name] = Number.parseFloat(el.value);
    } else {
      state[el.name] = el.value;
    }
  }
  return state;
}

function syncRangeOutputs() {
  document.querySelectorAll('output[data-for]').forEach((out) => {
    const name = out.getAttribute('data-for');
    const input = form?.elements.namedItem(name ?? '');
    if (input instanceof HTMLInputElement) out.textContent = input.value;
  });
}

function applyPosterChrome(ground, titleFace) {
  document.querySelectorAll('[data-lab-wrap]').forEach((wrap) => {
    wrap.className = wrap.className
      .split(/\s+/)
      .filter((c) => !c.startsWith('ground-'))
      .join(' ');
    wrap.classList.add(`ground-${ground}`);
  });

  previewCards().forEach((card) => {
    card.className = card.className
      .split(/\s+/)
      .filter((c) => !c.startsWith('ground-') && !c.startsWith('title-face-'))
      .join(' ');
    card.classList.add(`ground-${ground}`, `title-face-${titleFace}`);
  });
}

function refreshPreview() {
  const state = readFormState();
  const cfg = buildLabGalleryConfig(baseConfig, state);
  setGalleryConfig(cfg);
  applyGalleryConfigToDocument(cfg);
  applyPosterChrome(String(state.ground), String(state.titleFace));

  const cards = previewCards();
  renderPosterGlyphPatterns(cards, cfg);
  fitPosterTitles(cards, cfg.titleScale);
  enhancePosterImageHalftone(document.getElementById('lab-preview-grid'), cfg);
  syncRangeOutputs();
}

function scheduleRefresh() {
  clearTimeout(applyTimer);
  applyTimer = window.setTimeout(refreshPreview, 32);
}

async function boot() {
  baseConfig = structuredClone(await loadGalleryConfig());
  populateDropdowns(baseConfig);
  const state = readLabStateFromConfig(baseConfig);
  writeForm(state);
  refreshPreview();

  form?.addEventListener('input', scheduleRefresh);
  form?.addEventListener('change', scheduleRefresh);

  reloadBtn?.addEventListener('click', async () => {
    const keep = {
      ground: readFormState().ground,
      titleFace: readFormState().titleFace
    };
    baseConfig = structuredClone(await loadGalleryConfig());
    populateDropdowns(baseConfig);
    writeForm({ ...readLabStateFromConfig(baseConfig), ...keep });
    refreshPreview();
  });

  window.addEventListener('resize', scheduleRefresh);
  document.fonts?.ready?.then(scheduleRefresh);
}

boot();
