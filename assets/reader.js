import { parseDocument, peekDocumentTitle } from '../lib/parse-document.js';
import { renderDocument, renderToc } from '../lib/render-document.js';
import { renderLandingGallery } from '../lib/render-landing-gallery.js';
import { renderMiniPoster } from '../lib/render-mini-poster.js';
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
import { renderPosterGlyphPatterns } from '../lib/poster-glyph-render.js';
import { enhancePosterImageHalftone } from '../lib/image-halftone.js';
import { applyImageTableLayouts } from '../lib/image-table-layout.js';
import { setupImageLightbox } from '../lib/image-lightbox.js';
import { mountEdgeHalftone } from '../lib/edge-halftone.js';
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
  const landingFeatured = document.getElementById('landing-featured');

  const LANDING_FEATURED = [
    {
      path: 'docs/demo/gallery-showcase.md',
      slug: 'gallery-demo',
      title: 'Gallery Demo',
      subtext: 'See what you can do'
    },
    {
      path: 'docs/POSTER_LOGIC.md',
      slug: 'poster-logic',
      title: 'Poster Logic',
      subtext: 'See how it works'
    }
  ];
  const fileInput = document.getElementById('file-input');
  const mainReader = document.getElementById('main-reader');
  const docLabel = document.getElementById('doc-label');
  const searchInput = document.getElementById('search-input');
  const highlightClear = document.getElementById('highlight-clear');
  const zoomOut = document.getElementById('zoom-out');
  const zoomIn = document.getElementById('zoom-in');
  const themeToggles = document.querySelectorAll('.theme-toggle');
  const tocToggle = document.getElementById('toc-toggle');
  const tocPanel = document.getElementById('toc-panel');
  const tocRoot = document.getElementById('toc-root');
  const tocRail = document.getElementById('reader-toc-rail');
  const tocRailRoot = document.getElementById('toc-rail-root');
  const readerLayout = document.querySelector('#reader .reader-layout');
  const openAnother = document.getElementById('open-another');
  const readerHome = document.getElementById('reader-home');
  const backToTop = document.getElementById('back-to-top');

  const ZOOM_MIN = 0.85;
  const ZOOM_MAX = 1.5;
  const ZOOM_STEP = 0.1;
  /** Extra space below the sticky reader header (pairs with `scroll-margin-top` / `scroll-padding-top`). */
  const SCROLL_GAP_PX = 6;
  let lastReaderHeaderHeight = 0;
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
  /** @type {{ destroy: () => void, refresh: () => void }} */
  let edgeHalftone = { destroy() {}, refresh() {} };

  function injectIcons() {
    document.querySelectorAll('[data-icon]').forEach((slot) => {
      const key = slot.getAttribute('data-icon');
      if (ICONS[key]) slot.innerHTML = ICONS[key];
    });
    document.querySelectorAll('.theme-toggle__icons').forEach((wrap) => {
      wrap.innerHTML = ICONS.moon + ICONS.sun;
    });
  }

  function closeTocPanel() {
    tocPanel.classList.remove('is-open');
    tocToggle.setAttribute('aria-expanded', 'false');
  }

  function tocRailFits() {
    if (!readerLayout) return false;
    const style = getComputedStyle(readerLayout);
    const padInline =
      (Number.parseFloat(style.paddingLeft) || 0) +
      (Number.parseFloat(style.paddingRight) || 0);
    const minWidth = readCssLengthPx('--toc-rail-min', 1200);
    return readerLayout.clientWidth - padInline >= minWidth;
  }

  function updateTocRailOffset() {
    if (!tocRail || reader.hidden || !readerLayout) return;
    const firstPoster = mainReader.querySelector('.poster-gallery .post-card-wrap');
    if (!firstPoster) {
      tocRail.style.setProperty('--toc-rail-offset', '0px');
      return;
    }
    const layoutTop = readerLayout.getBoundingClientRect().top;
    const posterTop = firstPoster.getBoundingClientRect().top;
    const offset = posterTop - layoutTop;
    tocRail.style.setProperty('--toc-rail-offset', `${Math.max(0, Math.round(offset))}px`);
  }

  function updateTocLayout() {
    if (reader.hidden) {
      reader.classList.remove('has-toc');
      reader.classList.remove('has-toc-rail');
      tocRail?.setAttribute('aria-hidden', 'true');
      return;
    }

    const hasToc = Boolean(tocRoot.querySelector('.toc-list'));
    reader.classList.toggle('has-toc', hasToc);
    const useRail = hasToc && tocRailFits();
    reader.classList.toggle('has-toc-rail', useRail);
    tocRail?.setAttribute('aria-hidden', useRail ? 'false' : 'true');
    if (useRail) {
      updateTocRailOffset();
      closeTocPanel();
    }
  }

  function setTocHtml(html) {
    tocRoot.innerHTML = html;
    if (tocRailRoot) tocRailRoot.innerHTML = html;
    updateTocLayout();
  }

  function handleTocLinkClick(e) {
    const a = e.target.closest('[data-toc-link]');
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute('href')?.slice(1);
    const el = id && document.getElementById(id);
    if (el) scrollToEl(el);
    closeTocPanel();
  }

  function readCssLengthPx(token, fallback = 0) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    if (!raw) return fallback;
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return fallback;
    if (raw.endsWith('rem')) {
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize);
      return n * (Number.isFinite(root) ? root : 16);
    }
    return n;
  }

  function readerHeaderEl() {
    return document.querySelector('#reader .site-header--reader');
  }

  function readAnchorOffsetPx() {
    const header = readerHeaderEl();
    const headerBottom = header ? Math.ceil(header.getBoundingClientRect().bottom) : 0;
    const gap = readCssLengthPx('--space-scroll-anchor-gap', SCROLL_GAP_PX);
    const adjust = readCssLengthPx('--space-scroll-anchor-adjust', 0);
    return headerBottom + gap + adjust;
  }

  function syncScrollOffsetVar() {
    const header = readerHeaderEl();
    if (header) lastReaderHeaderHeight = header.getBoundingClientRect().height;
    const offset = readAnchorOffsetPx();
    document.documentElement.style.setProperty('--scroll-offset', `${offset}px`);
    return offset;
  }

  function updateScrollOffset() {
    if (reader.hidden) return;
    const header = readerHeaderEl();
    if (!header) return;
    const height = header.getBoundingClientRect().height;
    if (Math.abs(height - lastReaderHeaderHeight) < 1) return;
    syncScrollOffsetVar();
  }

  /** Poster slugs live on `.post-card`; scroll to the visible title row, not card padding. */
  function resolveScrollTarget(el) {
    if (el.classList.contains('post-card')) {
      return el.querySelector('.post-header') || el;
    }
    return el;
  }

  let anchorSettleTimer = 0;

  function clearAnchorSettle() {
    clearTimeout(anchorSettleTimer);
    anchorSettleTimer = 0;
  }

  function anchorTopPx(target) {
    syncScrollOffsetVar();
    return Math.max(0, target.getBoundingClientRect().top + window.scrollY - readAnchorOffsetPx());
  }

  function userScrollBehavior() {
    return prefersReducedMotion ? 'auto' : 'smooth';
  }

  function realignScrollToHash() {
    const id = location.hash.slice(1);
    if (!id || id === 'read' || id === 'gallery' || reader.hidden) return;
    const el = document.getElementById(id);
    if (!el) return;
    scrollToEl(el, { behavior: 'auto' });
  }

  function scrollToEl(el, { behavior } = {}) {
    clearAnchorSettle();
    const target = resolveScrollTarget(el);
    window.scrollTo({ top: anchorTopPx(target), behavior: behavior ?? userScrollBehavior() });

    const hashId = el.id;
    if (hashId) history.replaceState(history.state, '', `#${hashId}`);
  }

  function renderGlyphs() {
    renderPosterGlyphPatterns(posterEls, getGalleryConfig());
  }

  function schedulePosterTitleFit({ realignHash = false } = {}) {
    cancelAnimationFrame(titleScaleFrame);
    titleScaleFrame = requestAnimationFrame(() => {
      void mainReader.offsetHeight;
      fitPosterTitles(posterEls, getGalleryConfig().titleScale);
      renderGlyphs();
      updateTocLayout();
      if (realignHash && location.hash) realignScrollToHash();
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
    updateScrollOffset();
    schedulePosterTitleFit({ realignHash: Boolean(location.hash) });
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
    edgeHalftone.refresh();
  }

  function landingMiniPosterEls() {
    return Array.from(document.querySelectorAll('#landing .mini-poster[data-slug]'));
  }

  function scheduleLandingMiniGlyphs() {
    requestAnimationFrame(() => {
      renderPosterGlyphPatterns(landingMiniPosterEls(), getGalleryConfig());
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          renderPosterGlyphPatterns(landingMiniPosterEls(), getGalleryConfig());
        });
      }
    });
  }

  function renderFeaturedLanding() {
    if (!landingFeatured) return;
    landingFeatured.innerHTML = LANDING_FEATURED.map((item, index) =>
      renderMiniPoster({
        slug: item.slug,
        title: item.title,
        subtext: item.subtext,
        index,
        tag: 'button',
        extraClass: 'landing-featured-card reveal is-visible',
        attrs: { 'data-bundled-md': item.path }
      })
    ).join('');
    scheduleLandingMiniGlyphs();
  }

  async function boot() {
    await reloadGalleryConfig();
    edgeHalftone.destroy();
    edgeHalftone = mountEdgeHalftone(getGalleryConfig());
    injectIcons();
    renderFeaturedLanding();
    applyZoom();
    applyTheme(localStorage.getItem('md-gallery-theme') === 'dark' ? 'dark' : 'light');
  }

  boot();
  history.replaceState({ view: 'landing' }, '', '#');

  const readerHeader = document.querySelector('.site-header--reader');
  if (readerHeader && typeof ResizeObserver !== 'undefined') {
    const headerResize = new ResizeObserver(() => updateScrollOffset());
    headerResize.observe(readerHeader);
  }

  if (readerLayout && typeof ResizeObserver !== 'undefined') {
    const readerLayoutResize = new ResizeObserver(() => updateTocLayout());
    readerLayoutResize.observe(readerLayout);
  }

  if (mainReader && typeof ResizeObserver !== 'undefined') {
    const readerContentResize = new ResizeObserver(() => updateTocLayout());
    readerContentResize.observe(mainReader);
  }

  function showReader() {
    landing.classList.add('is-hidden');
    reader.hidden = false;
    reader.classList.add('is-active');
    document.body.classList.remove('page-landing');
    document.body.classList.add('page-collection');
    edgeHalftone.refresh();
  }

  function showLandingShell() {
    landing.classList.remove('is-hidden');
    reader.hidden = true;
    reader.classList.remove('is-active');
    document.body.classList.add('page-landing');
    document.body.classList.remove('page-collection');
    searchInput.value = '';
    syncHighlightClear();
    closeTocPanel();
    edgeHalftone.refresh();
  }

  function showLanding() {
    showLandingShell();
    hideLandingGallery();
  }

  function hideLandingGallery() {
    if (!landingGallery) return;
    dropZone.hidden = false;
    landingFeatured?.removeAttribute('hidden');
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
    landingFeatured?.setAttribute('hidden', '');
    landingGallery.hidden = false;
    landingMain?.classList.add('landing-main--gallery');
    landingGalleryCount.textContent = `${items.length} Markdown file${items.length === 1 ? '' : 's'} — choose one`;
    landingGalleryGrid.innerHTML = renderLandingGallery(items);
    scheduleLandingMiniGlyphs();
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
    applyImageTableLayouts(mainReader);
    enhancePosterImageHalftone(mainReader, getGalleryConfig());
    setupImageLightbox(mainReader, {
      icons: { zoomIn: ICONS.zoomIn, zoomOut: ICONS.zoomOut, xmark: ICONS.xmark }
    });
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
    setTocHtml(renderToc(doc.toc));
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
    lastReaderHeaderHeight = 0;
    syncScrollOffsetVar();
    updateTocLayout();
    schedulePosterTitleFit();
    requestAnimationFrame(renderGlyphs);
    requestAnimationFrame(() => enhancePosterImageHalftone(mainReader, getGalleryConfig()));
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        schedulePosterTitleFit();
        renderGlyphs();
        enhancePosterImageHalftone(mainReader, getGalleryConfig());
      });
    }
    if (document.fonts?.addEventListener) {
      document.fonts.addEventListener('loadingdone', () => {
        schedulePosterTitleFit();
        renderGlyphs();
      });
    }
    if (updateHistory) pushReadState(relativePath);
    clearAnchorSettle();
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
    const pick = e.target.closest('.mini-poster[data-md-path]');
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
          scheduleLandingMiniGlyphs();
          return;
        }
        void showLandingGallery(droppedFileMap, { updateHistory: false }).catch((err) => console.error(err));
      }
      return;
    }

    showLanding();
  });

  landing.addEventListener('click', (e) => {
    const bundled = e.target.closest('[data-bundled-md]');
    if (bundled) {
      e.preventDefault();
      const path = bundled.getAttribute('data-bundled-md');
      if (path) {
        void openBundledMarkdown(path).catch((err) => {
          console.error(err);
          alert('Could not open this bundled doc. Run npm start locally to read docs shipped with the app.');
        });
      }
      return;
    }

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
      closeTocPanel();
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

  tocRoot.addEventListener('click', handleTocLinkClick);
  tocRailRoot?.addEventListener('click', handleTocLinkClick);

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

  /** Highlight query text in poster bodies only — all posters stay visible. */
  function applySearch() {
    const q = searchInput.value.trim();
    posterEls.forEach((card) => {
      card.classList.remove('is-filtered-out');

      const body = card.querySelector('.post-body');
      if (body && bodyCache.has(card.id)) {
        let html = bodyCache.get(card.id);
        if (q) html = highlightHtml(html, q);
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

  function syncHighlightClear() {
    if (!highlightClear) return;
    highlightClear.hidden = searchInput.value.length === 0;
  }

  searchInput.addEventListener('input', () => {
    syncHighlightClear();
    applySearch();
  });

  highlightClear?.addEventListener('click', () => {
    searchInput.value = '';
    syncHighlightClear();
    applySearch();
    searchInput.focus();
  });

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
    closeTocPanel();
  });

  openAnother.addEventListener('click', () => {
    showLanding();
    void pickFileToOpen();
  });

  readerHome?.addEventListener('click', () => {
    showLanding();
    history.pushState({ view: 'landing' }, '', '#');
  });

  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 300);
    });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  let resizeTimer;
  let configReloadTimer;

  async function reloadConfigAndRefresh() {
    await reloadGalleryConfig();
    edgeHalftone.destroy();
    edgeHalftone = mountEdgeHalftone(getGalleryConfig());
    enhancePosterImageHalftone(mainReader, getGalleryConfig());
    schedulePosterTitleFit();
    if (!landing.classList.contains('is-hidden')) {
      scheduleLandingMiniGlyphs();
      edgeHalftone.refresh();
    } else {
      enhanceReaderContent();
    }
  }

  function scheduleConfigReload() {
    clearTimeout(configReloadTimer);
    configReloadTimer = setTimeout(() => void reloadConfigAndRefresh(), 250);
  }

  window.addEventListener('focus', scheduleConfigReload);
  window.addEventListener('pageshow', scheduleConfigReload);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    scheduleConfigReload();
  });

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      updateScrollOffset();
      schedulePosterTitleFit();
      renderGlyphs();
      enhancePosterImageHalftone(mainReader, getGalleryConfig());
      if (!landing.classList.contains('is-hidden')) {
        scheduleLandingMiniGlyphs();
      }
    }, 120);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tocPanel.classList.contains('is-open')) {
      closeTocPanel();
    }
  });
})();
