# MD Gallery — project memory

**Purpose:** Durable context for humans and agents continuing this repo. Update when architecture, workflows, or conventions change.

**Last updated:** 2026-05-21

---

## What this project is

**MD Gallery** is a browser-only Markdown reader. Users drop a `.md` file on the homepage; the app parses and renders it as a vertical **poster gallery** (same editorial visual language as [figlets-blog](https://github.com/) — grounds, display title fonts, staggered cards). No server, no upload, no build step for user content.

**Sister project:** `figlets-blog` (separate repo) = static blog with Node build, collections, RSS. Do not merge the two pipelines; share **ideas and CSS**, not a single deploy.

**Not in scope (v1):** Accounts, cloud sync, editing, multi-file libraries, blog index/RSS/tags, dated-post requirements.

---

## Quick start

```bash
npm install
npm start          # npx serve . → http://localhost:3000
```

- Drop a `.md` file on the landing page.
- **Contents** in the nav opens the TOC drawer.
- **Search** filters posters and highlights matches in visible bodies.
- **Open file** returns to landing (file picker).

---

## Repository layout

| Path | Role |
|------|------|
| `index.html` | Landing + reader shell; import map for `marked` / `isomorphic-dompurify` |
| `assets/reader.js` | App: drop, read file, render, search, TOC toggle, scroll |
| `assets/reader.css` | Drop zone, TOC panel, reader chrome |
| `assets/site.css` | Poster/gallery/grounds/title-face styles (copied from figlets-blog; extend carefully) |
| `lib/parse-document.js` | Split MD → document model (posters, toc, intro) |
| `lib/render-document.js` | Model → HTML (`marked` + sanitize) |
| `lib/grounds.js` | Ground class per poster slug |
| `lib/title-faces.js` | Display font rotation + Google Fonts URL |
| `lib/stagger.js` | `--poster-shift` rem per poster |
| `lib/sanitize.js` | DOMPurify allowlist for user MD |
| `docs/PROJECT_MEMORY.md` | This file |
| `docs/DECISION_LOG.md` | Product/architecture decisions (not CSS trivia) |
| `docs/POSTER_LOGIC.md` | How posters are split from a file |
| `AGENTS.md` | Pointer for agents |

---

## Data flow

1. `FileReader` → raw string + filename  
2. `parseDocument(text, filename)` → `{ title, introMarkdown, posters[], toc[], splitMode }`  
3. `renderDocument(doc, filename)` → HTML injected into `#main-reader`  
4. `renderToc(doc.toc)` → TOC list in nav drawer  
5. Search/filter client-side on `data-search` per `.post-card`

All parsing/rendering is **client-side**. No `dist/` build for the app itself (static files + `node_modules` for local serve).

---

## Poster split (summary)

See `docs/POSTER_LOGIC.md`. Auto-detect:

1. **`##` headings** (default) — each `##` = one poster  
2. **`---` rules** — if no `##` but multiple horizontal rules  
3. **Single poster** — whole file  

Code fences are respected when detecting splits.

---

## Typography & styling

- Body/UI: **Inter Tight**; code: **Inter Mono** (from `site.css`).  
- Poster titles + in-post `h2`–`h6`: **title-face-*** (Ultra, Monoton, Limelight, Jersey 25, Black Ops One, Notable) cycled by poster index.  
- Collection hero on reader view: fixed `ground-lilac` + Ultra for doc title (not per-file face).  
- Wide screens: `width: fit-content` posters + `--poster-shift` from `lib/stagger.js`.

To change fonts: edit `lib/title-faces.js` + matching blocks in `assets/site.css` (search “Post title poster fonts”).

---

## TOC & heading IDs

- TOC entries: each **poster title** (links to `#poster.slug`) plus **h3–h6** parsed from poster bodies.  
- IDs: `slugify` + dedupe; poster slugs assigned in `parse-document.js`; in-body headings use `marked` custom renderer with `tokens[].raw` for stable IDs.  
- TOC toggle: `#toc-toggle` / `#toc-panel` in header (hidden until opened).

---

## Search

- Input: `#search-input` on reader view only.  
- Hides posters with `.is-filtered-out` when `data-search` lacks query.  
- Highlights matches in `.post-body` via cached HTML + `search-highlight` class (same pattern as figlets-blog collection search).

---

## Security

User Markdown is untrusted. All rendered HTML goes through `lib/sanitize.js` (`isomorphic-dompurify` with an allowlist). Do not bypass sanitize for user content.

---

## Dependencies

- `marked` ^15 — Markdown parse  
- `isomorphic-dompurify` — sanitize (browser + Node smoke tests)

`index.html` import map points at `node_modules` paths; `npm start` must be used (or any static server that serves the repo root).

---

## Handoff checklist

- [ ] Run `npm start`, drop `content/md-themed.md` or any large `##`-sectioned file  
- [ ] Verify TOC links scroll to posters and in-body headings  
- [ ] Verify search filters and highlight  
- [ ] After CSS changes, check mobile (<900px: no stagger, full-width cards)  
- [ ] Update `docs/DECISION_LOG.md` for product/architecture changes only  
- [ ] Update this file for design/implementation notes  

---

## Known gaps / follow-ups

- No automated tests yet (`node --test` on `lib/parse-document.js` recommended).  
- TOC does not include intro-only headings before first `##`.  
- No persistence (reload loses file); no URL load from hash/blob.  
- Optional: link from figlets-blog index footer to MD Gallery deploy URL.  
- Optional: split mode UI (user chooses `##` vs `---` vs single).  
- Optional: sync CSS from figlets-blog via script instead of manual copy.
