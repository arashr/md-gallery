import { parseDocument } from '../lib/parse-document.js';
import { renderDocument, renderToc } from '../lib/render-document.js';
import { reloadGalleryConfig, getGalleryConfig } from '../lib/gallery-config.js';
import { fitPosterTitles } from '../lib/fit-poster-title.js';
import { ICONS } from './icons.js';

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const landing = document.getElementById('landing');
  const reader = document.getElementById('reader');
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const mainReader = document.getElementById('main-reader');
  const docLabel = document.getElementById('doc-label');
  const searchInput = document.getElementById('search-input');
  const zoomOut = document.getElementById('zoom-out');
  const zoomIn = document.getElementById('zoom-in');
  const fontToggle = document.getElementById('font-toggle');
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

  function injectIcons() {
    document.querySelectorAll('[data-icon]').forEach((slot) => {
      const key = slot.getAttribute('data-icon');
      if (ICONS[key]) slot.innerHTML = ICONS[key];
    });
    document.querySelectorAll('.theme-toggle__icons').forEach((wrap) => {
      wrap.innerHTML = ICONS.moon + ICONS.sun;
    });
    document.querySelectorAll('.font-toggle__icons').forEach((wrap) => {
      wrap.innerHTML = ICONS.sans + ICONS.serif;
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

  function applyProseFont(mode) {
    const serif = mode === 'serif';
    document.documentElement.setAttribute('data-prose-font', serif ? 'serif' : 'sans');
    if (fontToggle) {
      fontToggle.setAttribute('aria-pressed', String(serif));
      fontToggle.setAttribute('aria-label', serif ? 'Sans-serif body text' : 'Serif body text');
    }
    localStorage.setItem('md-gallery-prose-font', serif ? 'serif' : 'sans');
  }

  async function boot() {
    await reloadGalleryConfig();
    injectIcons();
    applyZoom();
    applyTheme(localStorage.getItem('md-gallery-theme') === 'dark' ? 'dark' : 'light');
    applyProseFont(localStorage.getItem('md-gallery-prose-font') === 'serif' ? 'serif' : 'sans');
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

  function readFile(file) {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!/\.(md|markdown|txt)$/.test(name) && !file.type.startsWith('text/')) {
      alert('Please choose a Markdown or text file (.md, .markdown, .txt).');
      return;
    }
    const fileReader = new FileReader();
    fileReader.onload = () => {
      try {
        openMarkdown(fileReader.result, file.name);
      } catch (err) {
        console.error(err);
        alert('Could not read this file. See console for details.');
      }
    };
    fileReader.readAsText(file);
  }

  function openMarkdown(text, filename) {
    const doc = parseDocument(text, filename);
    mainReader.innerHTML = renderDocument(doc, filename);
    docLabel.textContent = filename;
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
    history.replaceState({ file: filename }, '', '#read');
  }

  mainReader.addEventListener('click', (e) => {
    const a = e.target.closest('.post-title a[href^="#"], [data-toc-link]');
    if (!a || !a.getAttribute('href')?.startsWith('#')) return;
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    scrollToEl(el);
    tocPanel.classList.remove('is-open');
    tocToggle.setAttribute('aria-expanded', 'false');
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

  function handleDrop(e) {
    if (!landingOpen()) return;
    e.preventDefault();
    dropZone.classList.remove('is-dragover');
    readFile(e.dataTransfer?.files?.[0]);
  }

  dropZone.addEventListener('drop', handleDrop);
  document.addEventListener('drop', (e) => {
    if (!landingOpen() || dropZone.contains(e.target)) return;
    handleDrop(e);
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

  if (fontToggle) {
    fontToggle.addEventListener('click', () => {
      const serif = document.documentElement.getAttribute('data-prose-font') !== 'serif';
      applyProseFont(serif ? 'serif' : 'sans');
    });
  }

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
    fileInput.click();
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
