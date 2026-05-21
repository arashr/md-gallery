import { parseDocument } from '../lib/parse-document.js';
import { renderDocument, renderToc } from '../lib/render-document.js';
import { fontsHref } from '../lib/title-faces.js';

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
  const searchStatus = document.getElementById('search-status');
  const tocToggle = document.getElementById('toc-toggle');
  const tocPanel = document.getElementById('toc-panel');
  const tocRoot = document.getElementById('toc-root');
  const openAnother = document.getElementById('open-another');
  const backToTop = document.getElementById('back-to-top');

  document.getElementById('fonts-link').href = fontsHref();

  let bodyCache = new Map();
  let posterEls = [];

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
    const reader = new FileReader();
    reader.onload = () => {
      try {
        openMarkdown(reader.result, file.name);
      } catch (err) {
        console.error(err);
        alert('Could not read this file. See console for details.');
      }
    };
    reader.readAsText(file);
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
    let visible = 0;
    posterEls.forEach((card) => {
      const data = (card.getAttribute('data-search') || '').toLowerCase();
      const show = !q || data.includes(q);
      card.classList.toggle('is-filtered-out', !show);
      if (show) visible++;

      const body = card.querySelector('.post-body');
      if (body && bodyCache.has(card.id)) {
        let html = bodyCache.get(card.id);
        if (q && show) html = highlightHtml(html, searchInput.value.trim());
        body.innerHTML = html;
      }
    });
    const total = posterEls.length;
    if (!q) {
      searchStatus.textContent = total ? `${total} posters` : '';
    } else {
      searchStatus.textContent = `${visible} / ${total}`;
    }
  }

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('is-dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('is-dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('is-dragover');
    const file = e.dataTransfer?.files?.[0];
    readFile(file);
  });
  fileInput.addEventListener('change', () => readFile(fileInput.files?.[0]));

  searchInput.addEventListener('input', applySearch);

  tocToggle.addEventListener('click', () => {
    const open = !tocPanel.classList.contains('is-open');
    tocPanel.classList.toggle('is-open', open);
    tocToggle.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (e) => {
    if (!tocPanel.contains(e.target) && e.target !== tocToggle) {
      tocPanel.classList.remove('is-open');
      tocToggle.setAttribute('aria-expanded', 'false');
    }
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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tocPanel.classList.contains('is-open')) {
      tocPanel.classList.remove('is-open');
      tocToggle.setAttribute('aria-expanded', 'false');
    }
  });
})();
