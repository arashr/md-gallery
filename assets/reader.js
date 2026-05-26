import { parseDocument } from '../lib/parse-document.js';
import { renderDocument, renderToc } from '../lib/render-document.js';
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
import { ICONS } from './icons.js';

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MARKDOWN_FILE = /\.(md|markdown|txt)$/i;

  const landing = document.getElementById('landing');
  const reader = document.getElementById('reader');
  const dropZone = document.getElementById('drop-zone');
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

  function showReader() {
    landing.classList.add('is-hidden');
    reader.hidden = false;
    reader.classList.add('is-active');
    document.body.classList.remove('page-landing');
    document.body.classList.add('page-collection');
  }

  function showLanding() {
    landing.classList.remove('is-hidden');
    reader.hidden = true;
    reader.classList.remove('is-active');
    document.body.classList.add('page-landing');
    document.body.classList.remove('page-collection');
    searchInput.value = '';
    tocPanel.classList.remove('is-open');
    tocToggle.setAttribute('aria-expanded', 'false');
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
    currentRelativePath = '';
    appDocsMode = false;
  }

  async function openBundledMarkdown(relativePath) {
    const { text, relativePath: path } = await fetchBundledMarkdown(relativePath);
    clearLocalFileAccess();
    appDocsMode = true;
    openMarkdown(text, path);
  }

  function openMarkdown(text, relativePath) {
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

    applySearch();
    setupTitleFitObserver();
    schedulePosterTitleFit();
    if (document.fonts?.ready) {
      document.fonts.ready.then(schedulePosterTitleFit);
    }
    if (document.fonts?.addEventListener) {
      document.fonts.addEventListener('loadingdone', schedulePosterTitleFit);
    }
    history.replaceState({ file: relativePath }, '', '#read');
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  async function openMarkdownFromFile(file, relativePath) {
    const text = await file.text();
    openMarkdown(text, relativePath);
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
      droppedFileMap = collected;
      rootDirHandle = null;
      const initial = chooseInitialMarkdown(collected, e.dataTransfer?.files?.[0]);
      if (initial) {
        try {
          await openMarkdownFromFile(initial.file, initial.path);
        } catch (err) {
          console.error(err);
          alert('Could not read this file. See console for details.');
        }
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
    configReloadTimer = setTimeout(() => void reloadGalleryConfig(), 250);
  });

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(schedulePosterTitleFit, 120);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tocPanel.classList.contains('is-open')) {
      tocPanel.classList.remove('is-open');
      tocToggle.setAttribute('aria-expanded', 'false');
    }
  });
})();
