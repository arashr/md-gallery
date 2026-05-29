# MD Gallery — project memory

**Purpose:** Durable context for humans and agents continuing this repo. Update when architecture, workflows, or conventions change.

**Last updated:** 2026-05-29

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
- **Search** filters posters and highlights matches in visible bodies (no poster count label in the header).
- **View controls:** theme toggle on landing + reader headers (synced); zoom −/+ in reader only; **serif/sans** toggle for poster body text (`data-prose-font`, persisted). Toolbar uses inline SVG icons. Dark mode uses `--chrome-*` / `--chrome-red*` on UI only; `:root` `--red` stays `#c8102e` on poster grounds.
- **Design system:** ground rules in `docs/DESIGN.md` (APCA, OKLCH, 8px grid). Config in `config/gallery.config.json`; field reference in `config/README.md`. Applied via `lib/gallery-config.js`. Refocus tab after save to reload.
- **Post cards:** Default height hugs content. Short posters (`.post-card--roomy`): B-min height, body `margin-top: auto`. **All** poster titles: `lib/fit-poster-title.js` binary-searches pixel `font-size` to fit card **width** only; title block height is natural (no `max-height` clip on `.post-title-bounds`). See **Title fitting** below for checkpoint tag and planned long-title tiers.
- **Cursor:** system default (custom crosshair CSS removed from `site.css`).
- **Open file** returns to landing (file picker).
- **Folder drop:** multiple `.md` files → landing gallery (`#gallery`); browser **Back** restores gallery (`history` + cached file map).
- **Poster PDF:** export button in external toolbar beside card (`lib/poster-export.js`); clone-only color pinning (no live DOM mutation).
- **Code blocks:** `lib/code-blocks.js` adds copy button in external toolbar (same pattern as export). Block `pre` and **tables** use **poster surface** bg + 2px border (opaque; no pattern bleed). Inline `` `code` `` uses tinted chip background only (**no border**).

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
| `lib/gallery-config.js` | Load `gallery.config.json` → CSS vars, grounds, code chips, fonts |
| `lib/apca-check.js` | APCA audit helpers (`npm test`) |
| `lib/code-blocks.js` | Wrap `pre` + external copy toolbar |
| `lib/poster-export.js` | Per-poster PDF via html2canvas + jsPDF |
| `lib/render-landing-gallery.js` | Folder-drop thumbnail grid |
| `lib/type-pattern.js`, `lib/type-pattern-mosaic.js` | Decorative glyph patterns on posters |
| `lib/bundled-md.js`, `lib/local-md-links.js` | Same-origin `.md` links |
| `config/gallery.config.json` | Grounds, theme, code, fonts, title scale |
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

- Body/UI and inline code: **Inconsolata** (`fonts.uiSans` → `--font-ui-sans`). Display titles use **title-face-*** (Ultra, Monoton, …). `fonts.mono` matches uiSans for legacy `--font-mono` tokens.  
- Poster titles + in-post `h2`–`h6`: **title-face-*** (Ultra, Monoton, Limelight, Jersey 25, Black Ops One, Notable) cycled by poster index.  
- Collection hero on reader view: sits on **page paper** with `theme.hero` tokens (not a ground poster); doc title uses default Ultra styling (not per-file title face).  
- Wide screens: `width: fit-content` posters + `--poster-shift` from `lib/stagger.js`.

To change fonts/colors: edit `config/gallery.config.json` (preferred) or matching CSS in `assets/site.css` (search “Post title poster fonts” for per-face line-height tweaks).

### Code appearance (`theme.code` in config)

| Piece | Behavior |
|-------|----------|
| **Inline `` `code` ``** | Chip bg via `--on-ground-code-chip-bg` (no border) |
| **Block `pre` / tables** | Poster surface bg (`var(--surface)`); border matches `--hair` / `--on-ground-edge` |
| **Dark ink body** | Chip **20% lighter than ground**: `color-mix(in oklch, surface, var(--config-paper))` — uses **`--config-paper`**, not `var(--paper)`, so dark mode chrome does not re-tint poster code |
| **White ground, carmine** | Chip **10% darker** (`chipLightSurfaceShade` toward black) — page paper is already neutral / carmine uses white body |
| **Titles / display headings** | `forTitle` on poster titles + TOC poster rows; `render-document` strips `<code>` in body `h2`–`h4` (same as titles); CSS backup + dark-mode chip exclusion |

APCA: `test/apca-grounds.test.js` + `auditGroundForegrounds()`; code role uses `codeChipBgFromSurface()` (matches chip, not raw `pre`).

### Dark mode

- `data-theme="dark"` retints **chrome only** (`assets/reader.css`, `darkTheme` in config).
- Poster grounds, edges, prose, **code chips**, and export/copy controls on cards keep **on-ground** tokens.
- Collection hero prose follows chrome tokens.

### Glyph patterns

- Canvas layer on each poster (`.post-card__glyph-layer`); config under `theme.graphics.typePattern`.
- Driven from `assets/reader.js` after render; first letter of title, seeded layout.

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

`index.html` import map points at `node_modules` paths (`marked`, `isomorphic-dompurify/dist/browser.mjs`, `dompurify/dist/purify.es.mjs`); `npm start` must be used (or any static server that serves the repo root). Opening `index.html` as `file://` or a broken import map leaves drop/browse inert and drag opens the file in a new tab.

---

## Handoff checklist

- [ ] Run `npm start`, drop any large `##`-sectioned `.md` (or a folder for the landing gallery)  
- [ ] Verify TOC links scroll to posters and in-body headings  
- [ ] Verify search filters and highlight  
- [x] `npm test` — parser + TOC/render id alignment  
- [ ] After CSS changes, check mobile (<900px: no stagger, full-width cards)  
- [ ] Update `docs/DECISION_LOG.md` for product/architecture changes only  
- [ ] Update this file for design/implementation notes  

---

## Tests

```bash
npm test
```

- `test/parse-document.test.js` — poster split modes (`h2` / `hr` / `single`), intro, YAML, fences, slug/TOC dedupe.
- `test/toc-render-alignment.test.js` — in-body TOC `id`s match `marked` heading `id`s in `renderDocument()` (poster slugs reserved before body parse).
- `test/apca-grounds.test.js` — configured ground foreground + code chip pairs vs `docs/DESIGN.md` Lc targets.
- `test/gallery-config.test.js` — config merge, injected ground/code CSS.
- `test/landing-gallery.test.js`, `test/inline-markdown.test.js` — folder gallery, title markdown.

## Intro vs posters (2026-05-21)

- **Short intro** (metadata before the first `##`) stays in the lilac hero and is rendered as Markdown (bold, etc.).
- **Long or structured intro** (>4 non-fence lines, >400 chars, or a real `##`/`###` before the first poster split) becomes the first gallery poster (“Overview”), not hero copy.
- **No `##` in file:** Body after the `#` title goes to a single poster, not the hero (fixed split-at bug).

Poster titles, doc `h1`, and TOC poster rows use `forTitle` (bold/italic OK; backticks = plain display text). In-post `h2`–`h4` get the same via CSS. Deeper TOC entries (h3+) may still render `` `code` `` chips in the UI font.

## Rendering quirks (investigated 2026-05-21)

- **`##` split + `---` between sections:** Trailing `---` before the next `##` used to stay in the previous poster body (rendered as `<hr>`, hidden by `.post-card .prose hr { display: none; }`). `parse-document.js` now trims them at split time.
- **Tables:** GFM tables render; `.prose .table-wrap` + table rules in `site.css` handle overflow on wide docs (e.g. PRD tables).
- **Mermaid / diagrams:** Fenced `mermaid` blocks render as `<pre><code>` only (no diagram engine in v1).
- **Task lists:** GFM checkboxes need `input` in the DOMPurify allowlist (`lib/sanitize.js`).
- **`<details>` / HTML widgets:** Stripped by sanitize unless tags are allowlisted.

## Title fitting (`lib/fit-poster-title.js`)

**Current (checkpoint):** Largest px in `[minPx, maxPx]` with `maxPx = min(titleScale.maxPx, floor(innerWidth × maxWidthRatio))` and no horizontal overflow on `.post-title-bounds a`. No vertical budget. Config defaults: `minPx` 64, `maxPx` 280, `maxWidthRatio` 0.45. Re-run on render, resize, zoom, `document.fonts.ready` (`assets/reader.js`).

**Checkpoint tag:** `checkpoint/pre-title-tier-fit` — revert long-title experiments to this commit if tier/line-count tuning regresses short posters or readability.

**Next (approved, not implemented):** `titleScale.tiers` from `poster.plainTitle.length` + binary search with **max line count** per tier (still no CSS clip). Illustrative tiers: ≤24 chars → current behavior; 25–55 → lower ratio/floor; >55 → `maxLines` ~4–5, `minPx` ~32. Measure lines via DOM during search (`getClientRects` or line-height). Config keys `tallTitleMaxPx` / `tallTitleHeightRatio` are legacy (unused by fitter); fold into tiers or delete when shipping.

**Pitfall:** Do not restore `--poster-title-max-h` + `overflow: hidden` on `.post-title-bounds` without a strong reason — caused clipping bugs on long titles.

## Known gaps / follow-ups  
- **Title tiers + line-count fit** — approved; see above.  
- TOC does not include intro-only headings before first `##`.  
- No persistence (reload loses file); no URL load from hash/blob.  
- Optional: link from figlets-blog index footer to MD Gallery deploy URL.  
- Optional: split mode UI (user chooses `##` vs `---` vs single).  
- Optional: sync CSS from figlets-blog via script instead of manual copy.
