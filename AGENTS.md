# Agent instructions — MD Gallery

Read these before changing code:

1. **[docs/PROJECT_MEMORY.md](docs/PROJECT_MEMORY.md)** — architecture, file map, UI behavior, pitfalls, handoff checklist.
2. **[docs/DECISION_LOG.md](docs/DECISION_LOG.md)** — product/architecture decisions only (not design/CSS).
3. **[docs/POSTER_LOGIC.md](docs/POSTER_LOGIC.md)** — how one `.md` file becomes posters.

## Rules of thumb

- **Product/architecture decisions** → `docs/DECISION_LOG.md`.
- **Design, CSS, layout, implementation notes** → `docs/PROJECT_MEMORY.md` only.
- **Poster split rules** → `lib/parse-document.js` + `docs/POSTER_LOGIC.md`.
- **Render / sanitize** → `lib/render-document.js`, `lib/sanitize.js`.
- **App shell / drop / search / TOC** → `assets/reader.js`, `assets/reader.css`.
- **Poster look** → `assets/site.css` (shared with figlets-blog; sync manually if needed).
- **Design system** → `config/gallery.config.json` + `lib/gallery-config.js` (colors, grounds + foreground pairs, fonts, spacing, dark chrome, grain).
- **Sister repo** `figlets-blog` — do not merge builds; keep MD Gallery client-only.

## Commands

```bash
npm install
npm start
```

No production build step. Run parser tests:

```bash
npm test
```
