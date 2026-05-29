import { parseDocument, peekDocumentTitle } from '../lib/parse-document.js';
import { renderDocument, renderToc } from '../lib/render-document.js';
import { renderLandingGallery } from '../lib/render-landing-gallery.js';
import { reloadGalleryConfig, getGalleryConfig } from '../lib/gallery-config.js';
import { fitPosterTitles } from '../lib/fit-poster-title.js';
import {
  isExternalHref,
  isLocalMarkdownHref,
  normalizeRelativePath,
  readMarkdownFromDirectory,
  resolveRelativeMarkdownPath
} from '../lib/local-md-links.js';
import { fetchBundledMarkdown } from '../lib/bundled-md.js';
import { exportPosterAsPdf } from '../lib/poster-export.js';
import { copyCodeFromButton, enhanceCodeBlocks } from '../lib/code-blocks.js';
import { renderTypePatternMosaic } from '../lib/type-pattern-mosaic.js';
import { ICONS } from './icons.js';

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MARKDOWN_FILE = /\.(md|markdown|txt)$/i;

  const landing = document.getElementById('landing');
  const reader = document.getElementById('reader');
  const dropZone = document.getElementById('drop-zone');
  const landingMain = document.getElementById('main');
  const landingGallery = document.getElementById('landing-gallery');
  const landingGalleryGrid = document.getElementById('landing-gallery-grid');
  const landingGalleryCount = document.getElementById('landing-gallery-count');
  const landingGalleryBack = document.getElementById('landing-gallery-back');
  const fileInput = document.getElementById('file-input');
  const mainReader = document.getElementById('main-reader');
  const docLabel = document.getElementById('doc-label');
  const searchInput = document.getElementById('search-input');
  const zoomOut = document.getElementById('zoom-out');
  const zoomIn = document.getElementById('zoom-in');
  const themeToggles = document.querySelectorAll('.theme-toggle');
  const tocToggle = document.getElementById('toc-toggle');
  const tocPanel = document.getElementById('toc-panel');
  const tocRoot = document.getElementById('toc-root');
  const openAnother = document.getElementById('open-another');
  const backToTop = document.getElementById('back-to-top');

  const ZOOM_MIN = 0.85;
  const ZOOM_MAX = 1.5;
  const ZOOM_STEP = 0.1;
  let readerZoom = clampZoom(parseFloat(localStorage.getItem('md-gallery-zoom') || '1', 10));

  let bodyCache = new Map();
  let posterEls = [];
  let titleScaleFrame = 0;
  let titleFitObserver = null;
  /** @type {FileSystemDirectoryHandle | null} */
  let rootDirHandle = null;
  /** @type {Map<string, File> | null} */
  let droppedFileMap = null;
  /** @type {{ path: string, title: string, index: number }[] | null} */
  let landingGalleryItems = null;
  let currentRelativePath = '';
  let appDocsMode = false;

  function injectIcons() {
    document.querySelectorAll('[data-icon]').forEach((slot) => {
      const key = slot.getAttribute('data-icon');
      if (ICONS[key]) slot.innerHTML = ICONS[key];
    });
    document.querySelectorAll('.theme-toggle__icons').forEach((wrap) => {
      wrap.innerHTML = ICONS.moon + ICONS.sun;
    });
  }

  function schedulePosterTitleFit() {
    cancelAnimationFrame(titleScaleFrame);
    titleScaleFrame = requestAnimationFrame(() => {
      void mainReader.offsetHeight;
      fitPosterTitles(posterEls, getGalleryConfig().titleScale);
    });
  }

  function setupTitleFitObserver() {
    titleFitObserver?.disconnect();
    if (!posterEls.length || typeof ResizeObserver === 'undefined') return;
    let resizeTick = 0;
    titleFitObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeTick);
      resizeTick = requestAnimationFrame(schedulePosterTitleFit);
    });
    posterEls.forEach((card) => titleFitObserver.observe(card));
  }

  function clampZoom(value) {
    if (Number.isNaN(value)) return 1;
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));
  }

  function applyZoom() {
    readerZoom = clampZoom(readerZoom);
    document.documentElement.style.setProperty('--reader-zoom', String(readerZoom));
    localStorage.setItem('md-gallery-zoom', String(readerZoom));
    zoomOut.disabled = readerZoom <= ZOOM_MIN;
    zoomIn.disabled = readerZoom >= ZOOM_MAX;
    schedulePosterTitleFit();
  }

  function applyTheme(theme) {
    const dark = theme === 'dark';
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    themeToggles.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? 'Light mode' : 'Dark mode');
    });
    localStorage.setItem('md-gallery-theme', dark ? 'dark' : 'light');
  }

  async function boot() {
    await reloadGalleryConfig();
    injectIcons();
    applyZoom();
    applyTheme(localStorage.getItem('md-gallery-theme') === 'dark' ? 'dark' : 'light');
  }

  boot();
  history.replaceState({ view: 'landing' }, '', '#');

  function showReader() {
    landing.classList.add('is-hidden');
    reader.hidden = false;
    reader.classList.add('is-active');
    document.body.classList.remove('page-landing');
    document.body.classList.add('page-collection');
  }

  function showLandingShell() {
    landing.classList.remove('is-hidden');
    reader.hidden = true;
    reader.classList.remove('is-active');
    document.body.classList.add('page-landing');
    document.body.classList.remove('page-collection');
    searchInput.value = '';
    tocPanel.classList.remove('is-open');
    tocToggle.setAttribute('aria-expanded', 'false');
  }

  function showLanding() {
    showLandingShell();
    hideLandingGallery();
  }

  function hideLandingGallery() {
    if (!landingGallery) return;
    dropZone.hidden = false;
    landingGallery.hidden = true;
    landingGalleryGrid.innerHTML = '';
    landingMain?.classList.remove('landing-main--gallery');
    landingGalleryCount.textContent = '';
  }

  function pushGalleryState() {
    history.pushState({ view: 'gallery' }, '', '#gallery');
  }

  function pushReadState(relativePath) {
    history.pushState({ view: 'read', file: relativePath }, '', '#read');
  }

  async function showLandingGallery(map, { updateHistory = true } = {}) {
    droppedFileMap = map;
    rootDirHandle = null;
    appDocsMode = false;

    const paths = [...map.keys()].sort();
    const items = await Promise.all(
      paths.map(async (path, index) => {
        const file = map.get(path);
        const text = await file.text();
        const title = peekDocumentTitle(text, displayNameForPath(path));
        return { path, title, index };
      })
    );
    landingGalleryItems = items;

    dropZone.hidden = true;
    landingGallery.hidden = false;
    landingMain?.classList.add('landing-main--gallery');
    landingGalleryCount.textContent = `${items.length} Markdown file${items.length === 1 ? '' : 's'} — choose one`;
    landingGalleryGrid.innerHTML = renderLandingGallery(items);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });

    if (updateHistory) pushGalleryState();
  }

  function isMarkdownFile(file) {
    if (!file) return false;
    return MARKDOWN_FILE.test(file.name) || file.type.startsWith('text/');
  }

  function displayNameForPath(relativePath) {
    return relativePath.split('/').pop() || relativePath;
  }

  function clearLocalFileAccess() {
    rootDirHandle = null;
    droppedFileMap = null;
    landingGalleryItems = null;
    currentRelativePath = '';
    appDocsMode = false;
  }

  async function openBundledMarkdown(relativePath) {
    const { text, relativePath: path } = await fetchBundledMarkdown(relativePath);
    clearLocalFileAccess();
    appDocsMode = true;
    openMarkdown(text, path);
  }

  function enhanceReaderContent() {
    enhanceCodeBlocks(mainReader, { copyIcon: ICONS.copy });
    injectIcons();
  }

  function renderPosterGlyphPatterns() {
    if (!posterEls.length) return;
    const cfg = getGalleryConfig();
    const patternCfg = {
      patternTypes: ['wave', 'grid', 'line'],
      targetTileSize: 128,
      fontSizeMin: 24,
      fontSizeMax: 68,
      repeatsMin: 18,
      repeatsMax: 38,
      paddingMin: 6,
      paddingMax: 18,
      lineAngleMin: -25,
      lineAngleMax: 25,
      waveCyclesMin: 2,
      waveCyclesMax: 6,
      waveAmplitudeMin: 0.16,
      waveAmplitudeMax: 0.34,
      gridColumnsMin: 3,
      gridColumnsMax: 7,
      gridStaggerProbability: 0.6,
      flipAlternateVertical: true,
      flipAlternateHorizontal: true,
      emptySpaceMinPx: 72,
      emptySpaceMinRatio: 0.14,
      fallbackBandWidth: 96,
      fallbackSide: 'auto',
      edgeOverflowPx: 40,
      symbolPool: '+*-´`=/|',
      symbolProbability: 0.55,
      noneProbability: 0.18,
      ...(cfg.theme?.graphics?.typePattern || {})
    };
    const patternTypes =
      Array.isArray(patternCfg.patternTypes) && patternCfg.patternTypes.length
        ? patternCfg.patternTypes
        : ['wave', 'grid', 'line'];
    const clampInt = (n, fallback) => {
      const v = Number.parseInt(String(n), 10);
      return Number.isFinite(v) ? v : fallback;
    };
    const clampNum = (n, fallback) => {
      const v = Number.parseFloat(String(n));
      return Number.isFinite(v) ? v : fallback;
    };
    const computeGlyphRegion = (card, rand) => {
      const cardH = card.clientHeight;
      const cardW = card.clientWidth;
      if (!cardH || !cardW) return { x: 0, y: 0, width: cardW, height: cardH };

      const s = getComputedStyle(card);
      const padTop = clampNum(s.paddingTop, 0);
      const padBottom = clampNum(s.paddingBottom, 0);
      const padLeft = clampNum(s.paddingLeft, 0);
      const padRight = clampNum(s.paddingRight, 0);
      const contentTop = padTop;
      const contentBottom = cardH - padBottom;
      const contentLeft = padLeft;
      const contentRight = cardW - padRight;
      const contentWidth = Math.max(1, contentRight - contentLeft);
      const contentHeight = Math.max(1, contentBottom - contentTop);

      const header = card.querySelector('.post-header');
      const body = card.querySelector('.post-body');
      const cardRect = card.getBoundingClientRect();
      const headerRect = header instanceof HTMLElement ? header.getBoundingClientRect() : null;
      const bodyRect = body instanceof HTMLElement ? body.getBoundingClientRect() : null;
      const headerTop = headerRect ? headerRect.top - cardRect.top : contentTop;
      const headerBottom = headerRect ? headerRect.bottom - cardRect.top : contentTop;
      const bodyTop = bodyRect ? bodyRect.top - cardRect.top : contentBottom;
      const bodyBottom = bodyRect ? bodyRect.bottom - cardRect.top : contentBottom;

      const regions = [
        {
          key: 'top',
          x: contentLeft,
          y: contentTop,
          width: contentWidth,
          height: Math.max(0, headerTop - contentTop)
        },
        {
          key: 'middle',
          x: contentLeft,
          y: headerBottom,
          width: contentWidth,
          height: Math.max(0, bodyTop - headerBottom)
        },
        {
          key: 'bottom',
          x: contentLeft,
          y: bodyBottom,
          width: contentWidth,
          height: Math.max(0, contentBottom - bodyBottom)
        }
      ].sort((a, b) => b.height - a.height);

      const minGapPx = clampInt(patternCfg.emptySpaceMinPx, 72);
      const minGapRatio = Math.min(0.9, Math.max(0, clampNum(patternCfg.emptySpaceMinRatio, 0.14)));
      const minGapFromRatio = Math.round(contentHeight * minGapRatio);
      const minGap = Math.max(minGapPx, minGapFromRatio);
      const roomy = regions[0];
      if (roomy && roomy.height >= minGap) {
        return roomy;
      }

      const bandW = Math.min(
        Math.max(24, clampInt(patternCfg.fallbackBandWidth, 96)),
        Math.floor(contentWidth * 0.45)
      );
      const sidePref = String(patternCfg.fallbackSide || 'auto').toLowerCase();
      const useLeft = sidePref === 'left' || (sidePref !== 'right' && rand() < 0.5);
      return {
        x: useLeft ? contentLeft : contentRight - bandW,
        y: contentTop,
        width: bandW,
        height: contentHeight
      };
    };
    for (const card of posterEls) {
      const canvas = card.querySelector('[data-glyph-canvas]');
      if (!(canvas instanceof HTMLCanvasElement)) continue;
      const layer = card.querySelector('.post-card__glyph-layer');
      if (!(layer instanceof HTMLElement)) continue;
      const title = (card.querySelector('.post-title')?.textContent || card.dataset.slug || 'A').trim();
      const titleLetter = (title.match(/[A-Za-z0-9]/)?.[0] || 'A').toUpperCase();
      const titleEl = card.querySelector('.post-title a, .post-title');
      const cs = getComputedStyle(card);
      const titleStyle = titleEl ? getComputedStyle(titleEl) : cs;
      const foregroundColor = cs.getPropertyValue('--glyph-pattern-color').trim() || cs.color || '#111';
      const seedBase = (card.dataset.slug || title).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const rand = (() => {
        let s = seedBase >>> 0;
        return () => {
          s = (s * 1664525 + 1013904223) >>> 0;
          return s / 4294967296;
        };
      })();
      const pick = (arr) => arr[Math.floor(rand() * arr.length)];
      const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
      const repeatsMin = clampInt(patternCfg.repeatsMin, 18);
      const repeatsMax = Math.max(repeatsMin, clampInt(patternCfg.repeatsMax, 38));
      const fontSizeMin = clampInt(patternCfg.fontSizeMin, 24);
      const fontSizeMax = Math.max(fontSizeMin, clampInt(patternCfg.fontSizeMax, 68));
      const paddingMin = clampInt(patternCfg.paddingMin, 6);
      const paddingMax = Math.max(paddingMin, clampInt(patternCfg.paddingMax, 18));
      const lineAngleMin = clampInt(patternCfg.lineAngleMin, -25);
      const lineAngleMax = Math.max(lineAngleMin, clampInt(patternCfg.lineAngleMax, 25));
      const waveCyclesMin = clampInt(patternCfg.waveCyclesMin, 2);
      const waveCyclesMax = Math.max(waveCyclesMin, clampInt(patternCfg.waveCyclesMax, 6));
      const waveAmpMin = clampNum(patternCfg.waveAmplitudeMin, 0.16);
      const waveAmpMax = Math.max(waveAmpMin, clampNum(patternCfg.waveAmplitudeMax, 0.34));
      const gridColsMin = clampInt(patternCfg.gridColumnsMin, 3);
      const gridColsMax = Math.max(gridColsMin, clampInt(patternCfg.gridColumnsMax, 7));
      const staggerProb = Math.min(1, Math.max(0, clampNum(patternCfg.gridStaggerProbability, 0.6)));
      const symbolProb = Math.min(1, Math.max(0, clampNum(patternCfg.symbolProbability, 0.55)));
      const noneProb = Math.min(1, Math.max(0, clampNum(patternCfg.noneProbability, 0.18)));
      const edgeOverflow = Math.max(0, clampInt(patternCfg.edgeOverflowPx, 40));
      if (rand() < noneProb) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = 'none';
        continue;
      }
      canvas.style.display = 'block';
      const symbolPool = String(patternCfg.symbolPool || '');
      const symbolChars = [...symbolPool].filter((ch) => ch.trim().length > 0);
      const patternLetter =
        symbolChars.length && rand() < symbolProb
          ? pick(symbolChars)
          : titleLetter;
      const patternType = pick(patternTypes);
      const region = computeGlyphRegion(card, rand);
      const usingFallbackBand = region.width <= Math.max(24, clampInt(patternCfg.fallbackBandWidth, 96));
      let x = region.x;
      let w = region.width;
      if (usingFallbackBand && edgeOverflow > 0) {
        const sidePref = String(patternCfg.fallbackSide || 'auto').toLowerCase();
        const onLeft = sidePref === 'left' || (sidePref !== 'right' && x <= card.clientWidth / 2);
        if (onLeft) {
          x -= edgeOverflow;
        } else {
          w += edgeOverflow;
        }
      }
      layer.style.setProperty('--glyph-y', `${Math.round(region.y)}px`);
      layer.style.setProperty('--glyph-x', `${Math.round(x)}px`);
      layer.style.setProperty('--glyph-w', `${Math.max(1, Math.round(w))}px`);
      layer.style.setProperty('--glyph-h', `${Math.max(1, Math.round(region.height))}px`);
      const tilePattern = {
        type: patternType,
        repeats: int(repeatsMin, repeatsMax),
        fontSize: int(fontSizeMin, fontSizeMax),
        followPath: true,
        flipReadable: true,
        flipAlternateVertical: Boolean(patternCfg.flipAlternateVertical),
        flipAlternateHorizontal: Boolean(patternCfg.flipAlternateHorizontal),
        opticalTight: true,
        padding: int(paddingMin, paddingMax),
        lineAngle: int(lineAngleMin, lineAngleMax),
        waveCycles: int(waveCyclesMin, waveCyclesMax),
        waveAmplitude: waveAmpMin + rand() * (waveAmpMax - waveAmpMin),
        gridColumns: int(gridColsMin, gridColsMax),
        gridStagger: rand() < staggerProb
      };
      renderTypePatternMosaic(canvas, patternLetter, {
        autoFill: true,
        targetTileSize: Math.min(
          clampInt(patternCfg.targetTileSize, 128),
          Math.max(32, Math.floor(Math.min(region.width, region.height) * 0.75))
        ),
        gap: 0,
        randomize: false,
        sameTilePattern: true,
        seed: seedBase,
        backgroundColor: 'rgba(0,0,0,0)',
        tilePattern,
        sharedOptions: {
          foregroundColor,
          backgroundColor: 'rgba(0,0,0,0)',
          opacity: 1,
          fontFamily: titleStyle.fontFamily,
          fontWeight: titleStyle.fontWeight,
          opticalTight: true
        }
      });
    }
  }

  function posterExportName(card) {
    const title = card.querySelector('.post-title')?.textContent?.trim();
    return card.getAttribute('data-slug') || title || 'poster';
  }

  function openMarkdown(text, relativePath, { updateHistory = true } = {}) {
    const filename = displayNameForPath(relativePath);
    currentRelativePath = relativePath;
    const doc = parseDocument(text, filename);
    mainReader.innerHTML = renderDocument(doc, relativePath);
    docLabel.textContent = relativePath;
    tocRoot.innerHTML = renderToc(doc.toc);
    showReader();

    posterEls = Array.from(mainReader.querySelectorAll('.post-card'));
    bodyCache = new Map();
    posterEls.forEach((card) => {
      const body = card.querySelector('.post-body');
      if (body) bodyCache.set(card.id, body.innerHTML);
    });

    enhanceReaderContent();
    applySearch();
    setupTitleFitObserver();
    schedulePosterTitleFit();
    requestAnimationFrame(renderPosterGlyphPatterns);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        schedulePosterTitleFit();
        renderPosterGlyphPatterns();
      });
    }
    if (document.fonts?.addEventListener) {
      document.fonts.addEventListener('loadingdone', () => {
        schedulePosterTitleFit();
        renderPosterGlyphPatterns();
      });
    }
    if (updateHistory) pushReadState(relativePath);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  async function openMarkdownFromFile(file, relativePath, opts) {
    const text = await file.text();
    openMarkdown(text, relativePath, opts);
  }

  async function openMarkdownFromHandle(fileHandle) {
    const file = await fileHandle.getFile();
    droppedFileMap = null;
    rootDirHandle = typeof fileHandle.getParent === 'function' ? await fileHandle.getParent() : null;
    await openMarkdownFromFile(file, file.name);
  }

  function readFile(file) {
    if (!file) return;
    if (!isMarkdownFile(file)) {
      alert('Please choose a Markdown or text file (.md, .markdown, .txt).');
      return;
    }
    clearLocalFileAccess();
    const relativePath = normalizeRelativePath((file.webkitRelativePath || file.name).replace(/\\/g, '/')) || file.name;
    const fileReader = new FileReader();
    fileReader.onload = () => {
      try {
        openMarkdown(fileReader.result, relativePath);
      } catch (err) {
        console.error(err);
        alert('Could not read this file. See console for details.');
      }
    };
    fileReader.readAsText(file);
  }

  async function pickFileToOpen() {
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [
            {
              description: 'Markdown',
              accept: {
                'text/markdown': ['.md', '.markdown'],
                'text/plain': ['.txt']
              }
            }
          ],
          multiple: false
        });
        await openMarkdownFromHandle(handle);
      } catch (err) {
        if (err?.name !== 'AbortError') console.error(err);
      }
      return;
    }
    fileInput.click();
  }

  async function requestFolderAccess(message) {
    if (!window.showDirectoryPicker) {
      alert(`${message}\n\nYour browser cannot grant folder access here. Drop the whole folder on the landing page instead.`);
      return false;
    }
    try {
      rootDirHandle = await window.showDirectoryPicker();
      droppedFileMap = null;
      return true;
    } catch (err) {
      if (err?.name !== 'AbortError') console.error(err);
      return false;
    }
  }

  async function followLocalMarkdownLink(href) {
    const targetPath = resolveRelativeMarkdownPath(currentRelativePath, href);
    if (!targetPath) return;

    try {
      if (droppedFileMap?.has(targetPath)) {
        await openMarkdownFromFile(droppedFileMap.get(targetPath), targetPath);
        return;
      }

      if (rootDirHandle) {
        const { file, relativePath } = await readMarkdownFromDirectory(rootDirHandle, targetPath);
        await openMarkdownFromFile(file, relativePath);
        return;
      }

      if (appDocsMode) {
        await openBundledMarkdown(targetPath);
        return;
      }

      const granted = await requestFolderAccess(
        'Choose the folder that contains your Markdown files to follow this link. Nothing is uploaded — files stay on your device.'
      );
      if (!granted) return;

      const { file, relativePath } = await readMarkdownFromDirectory(rootDirHandle, targetPath);
      await openMarkdownFromFile(file, relativePath);
    } catch (err) {
      console.error(err);
      alert(`Could not open "${targetPath}" on this device.`);
    }
  }

  async function walkEntry(entry, prefix, map) {
    if (entry.isFile) {
      const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
      if (!isMarkdownFile(file)) return;
      const rel = normalizeRelativePath(`${prefix}${file.name}`.replace(/\\/g, '/'));
      if (rel) map.set(rel, file);
      return;
    }
    if (!entry.isDirectory) return;

    const reader = entry.createReader();
    const entries = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
    for (const child of entries) {
      await walkEntry(child, `${prefix}${entry.name}/`, map);
    }
  }

  async function collectMarkdownFilesFromDrop(dataTransfer) {
    const map = new Map();
    if (!dataTransfer) return map;

    const items = dataTransfer.items;
    if (items?.length && items[0].webkitGetAsEntry) {
      const entries = [];
      for (const item of items) {
        if (item.kind !== 'file') continue;
        const entry = item.webkitGetAsEntry();
        if (entry) entries.push(entry);
      }
      for (const entry of entries) {
        await walkEntry(entry, '', map);
      }
    }

    if (map.size === 0 && dataTransfer.files?.length) {
      for (const file of dataTransfer.files) {
        if (!isMarkdownFile(file)) continue;
        const rel = normalizeRelativePath((file.webkitRelativePath || file.name).replace(/\\/g, '/'));
        if (rel) map.set(rel, file);
      }
    }

    return map;
  }

  function chooseInitialMarkdown(map, primaryFile) {
    if (primaryFile && isMarkdownFile(primaryFile)) {
      const rel = normalizeRelativePath((primaryFile.webkitRelativePath || primaryFile.name).replace(/\\/g, '/'));
      if (rel && map.has(rel)) return { path: rel, file: map.get(rel) };
    }

    const paths = [...map.keys()].sort();
    const indexPath = paths.find((path) => /^(readme|index)\.(md|markdown|txt)$/i.test(displayNameForPath(path)));
    if (indexPath) return { path: indexPath, file: map.get(indexPath) };

    if (paths.length) return { path: paths[0], file: map.get(paths[0]) };
    return null;
  }

  landingGalleryGrid?.addEventListener('click', (e) => {
    const pick = e.target.closest('.landing-pick-card[data-md-path]');
    if (!pick || !droppedFileMap) return;
    const path = pick.getAttribute('data-md-path');
    const file = droppedFileMap.get(path);
    if (!file) return;
    void openMarkdownFromFile(file, path).catch((err) => {
      console.error(err);
      alert('Could not read this file. See console for details.');
    });
  });

  landingGalleryBack?.addEventListener('click', () => {
    clearLocalFileAccess();
    hideLandingGallery();
    history.pushState({ view: 'landing' }, '', '#');
  });

  window.addEventListener('popstate', (e) => {
    const state = e.state || {};
    const view = state.view || (location.hash === '#read' ? 'read' : location.hash === '#gallery' ? 'gallery' : 'landing');

    if (view === 'read') {
      // If we can reopen from the dropped map, do it; otherwise just stay on landing.
      const path = state.file;
      const file = path && droppedFileMap?.get(path);
      if (file) {
        void openMarkdownFromFile(file, path, { updateHistory: false })
          .catch((err) => console.error(err));
      } else {
        showLanding();
      }
      return;
    }

    if (view === 'gallery') {
      showLandingShell();
      if (droppedFileMap) {
        if (landingGalleryItems) {
          dropZone.hidden = true;
          landingGallery.hidden = false;
          landingMain?.classList.add('landing-main--gallery');
          landingGalleryCount.textContent = `${landingGalleryItems.length} Markdown file${landingGalleryItems.length === 1 ? '' : 's'} — choose one`;
          landingGalleryGrid.innerHTML = renderLandingGallery(landingGalleryItems);
          return;
        }
        void showLandingGallery(droppedFileMap, { updateHistory: false }).catch((err) => console.error(err));
      }
      return;
    }

    showLanding();
  });

  landing.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;

    if (isLocalMarkdownHref(href)) {
      e.preventDefault();
      void openBundledMarkdown(href).catch((err) => {
        console.error(err);
        alert('Could not open this bundled doc. Run npm start locally to read docs shipped with the app.');
      });
      return;
    }

    if (isExternalHref(href)) {
      e.preventDefault();
      if (confirm('This link goes outside your device. Open it in your browser?')) {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    }
  });

  mainReader.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.code-block__copy');
    if (copyBtn) {
      e.preventDefault();
      void copyCodeFromButton(copyBtn).then((ok) => {
        if (!ok) return;
        copyBtn.classList.add('is-copied');
        copyBtn.setAttribute('aria-label', 'Copied');
        window.setTimeout(() => {
          copyBtn.classList.remove('is-copied');
          copyBtn.setAttribute('aria-label', 'Copy code');
        }, 2000);
      });
      return;
    }

    const exportBtn = e.target.closest('[data-poster-export]');
    if (exportBtn) {
      e.preventDefault();
      const card =
        exportBtn.closest('.post-card-wrap')?.querySelector('.post-card') ??
        exportBtn.closest('.post-card');
      if (!card || exportBtn.disabled) return;
      exportBtn.disabled = true;
      exportBtn.setAttribute('aria-busy', 'true');
      void exportPosterAsPdf(card, posterExportName(card))
        .catch((err) => {
          console.error(err);
          alert('Could not export this poster as PDF.');
        })
        .finally(() => {
          exportBtn.disabled = false;
          exportBtn.removeAttribute('aria-busy');
        });
      return;
    }

    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;

    if (href.startsWith('#')) {
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      scrollToEl(el);
      tocPanel.classList.remove('is-open');
      tocToggle.setAttribute('aria-expanded', 'false');
      return;
    }

    if (isLocalMarkdownHref(href)) {
      e.preventDefault();
      void followLocalMarkdownLink(href);
      return;
    }

    if (isExternalHref(href)) {
      e.preventDefault();
      if (confirm('This link goes outside your device. Open it in your browser?')) {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    }
  });

  tocRoot.addEventListener('click', (e) => {
    const a = e.target.closest('[data-toc-link]');
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute('href')?.slice(1);
    const el = id && document.getElementById(id);
    if (el) scrollToEl(el);
    tocPanel.classList.remove('is-open');
    tocToggle.setAttribute('aria-expanded', 'false');
  });

  function getHeaderOffset() {
    const header = document.querySelector('.site-header--reader');
    return (header?.getBoundingClientRect().height ?? 72) + 8;
  }

  function scrollToEl(el) {
    const top = Math.max(0, window.scrollY + el.getBoundingClientRect().top - getHeaderOffset());
    window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    if (el.id) history.replaceState(null, '', `#${el.id}`);
  }

  function highlightHtml(html, query) {
    if (!query) return html;
    const parts = html.split(/(<[^>]+>)/);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'gi');
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) parts[i] = parts[i].replace(re, (m) => `<span class="search-highlight">${m}</span>`);
    }
    return parts.join('');
  }

  function applySearch() {
    const q = searchInput.value.trim().toLowerCase();
    posterEls.forEach((card) => {
      const data = (card.getAttribute('data-search') || '').toLowerCase();
      const show = !q || data.includes(q);
      card.classList.toggle('is-filtered-out', !show);

      const body = card.querySelector('.post-body');
      if (body && bodyCache.has(card.id)) {
        let html = bodyCache.get(card.id);
        if (q && show) html = highlightHtml(html, searchInput.value.trim());
        body.innerHTML = html;
      }
    });
    enhanceReaderContent();
    schedulePosterTitleFit();
  }

  function landingOpen() {
    return !landing.classList.contains('is-hidden');
  }

  document.addEventListener('dragover', (e) => {
    if (!landingOpen()) return;
    e.preventDefault();
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('is-dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('is-dragover'));

  async function handleDrop(e) {
    if (!landingOpen()) return;
    e.preventDefault();
    dropZone.classList.remove('is-dragover');

    const collected = await collectMarkdownFilesFromDrop(e.dataTransfer);
    if (collected.size > 1) {
      try {
        await showLandingGallery(collected);
      } catch (err) {
        console.error(err);
        alert('Could not read these files. See console for details.');
      }
      return;
    }

    if (collected.size === 1) {
      const [path, file] = collected.entries().next().value;
      droppedFileMap = collected;
      rootDirHandle = null;
      try {
        await openMarkdownFromFile(file, path);
      } catch (err) {
        console.error(err);
        alert('Could not read this file. See console for details.');
      }
      return;
    }

    readFile(e.dataTransfer?.files?.[0]);
  }

  dropZone.addEventListener('drop', (e) => {
    void handleDrop(e);
  });
  document.addEventListener('drop', (e) => {
    if (!landingOpen() || dropZone.contains(e.target)) return;
    void handleDrop(e);
  });

  fileInput.addEventListener('change', () => {
    readFile(fileInput.files?.[0]);
    fileInput.value = '';
  });

  searchInput.addEventListener('input', applySearch);

  zoomOut.addEventListener('click', () => {
    readerZoom = clampZoom(readerZoom - ZOOM_STEP);
    applyZoom();
  });

  zoomIn.addEventListener('click', () => {
    readerZoom = clampZoom(readerZoom + ZOOM_STEP);
    applyZoom();
  });

  themeToggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const dark = document.documentElement.getAttribute('data-theme') !== 'dark';
      applyTheme(dark ? 'dark' : 'light');
    });
  });

  tocToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = !tocPanel.classList.contains('is-open');
    tocPanel.classList.toggle('is-open', open);
    tocToggle.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (e) => {
    const wrap = tocToggle.closest('.nav-toc-wrap');
    if (tocPanel.contains(e.target) || wrap?.contains(e.target)) return;
    tocPanel.classList.remove('is-open');
    tocToggle.setAttribute('aria-expanded', 'false');
  });

  openAnother.addEventListener('click', () => {
    showLanding();
    void pickFileToOpen();
  });

  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 300);
    });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  let resizeTimer;
  let configReloadTimer;
  window.addEventListener('focus', () => {
    clearTimeout(configReloadTimer);
    configReloadTimer = setTimeout(async () => {
      await reloadGalleryConfig();
      schedulePosterTitleFit();
    }, 250);
  });

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      schedulePosterTitleFit();
      renderPosterGlyphPatterns();
    }, 120);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tocPanel.classList.contains('is-open')) {
      tocPanel.classList.remove('is-open');
      tocToggle.setAttribute('aria-expanded', 'false');
    }
  });
})();
