# Agent instructions — MD Gallery

Read these before changing code:

1. **[docs/PROJECT_MEMORY.md](docs/PROJECT_MEMORY.md)** — architecture, file map, UI behavior, pitfalls, handoff checklist.
2. **[docs/DESIGN.md](docs/DESIGN.md)** — design system ground rules, APCA, OKLCH, token map.
3. **[docs/DECISION_LOG.md](docs/DECISION_LOG.md)** — product/architecture decisions only (not design/CSS).
4. **[docs/POSTER_LOGIC.md](docs/POSTER_LOGIC.md)** — how one `.md` file becomes posters.

## Rules of thumb

- **Product/architecture decisions** → `docs/DECISION_LOG.md`.
- **Design system rules & color/a11y standards** → `docs/DESIGN.md`.
- **Design, CSS, layout, implementation notes** → `docs/PROJECT_MEMORY.md`.
- **Poster split rules** → `lib/parse-document.js` + `docs/POSTER_LOGIC.md`.
- **Render / sanitize** → `lib/render-document.js`, `lib/sanitize.js`.
- **App shell / drop / search / TOC** → `assets/reader.js`, `assets/reader.css`.
- **Poster look** → `assets/site.css` (shared with figlets-blog; sync manually if needed).
- **Design system config** → `config/gallery.config.json` + `lib/gallery-config.js` (see `docs/DESIGN.md`, `config/README.md`).
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
