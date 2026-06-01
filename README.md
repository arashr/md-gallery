# MD Gallery

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Browser-based Markdown reader with the Figlets editorial **poster gallery** layout. Drop a `.md` file (or folder) on the homepage; parsing and rendering stay **entirely in your browser** — nothing is uploaded.

**Repository:** [github.com/arashr/md-gallery](https://github.com/arashr/md-gallery)

## Features

- **Poster gallery** — colored grounds, rotating display title fonts, staggered cards on wide screens
- **Structural splits** — posters from `##` headings, `---` rules, or a single card; no dates required ([POSTER_LOGIC.md](docs/POSTER_LOGIC.md))
- **Decorative glyphs** — per-poster **hero glyph** or **type pattern** band (configurable blends, placement, opacity); optional **image halftone** on photos
- **Long-title fitting** — `titleScale.tiers` shrink long section titles by length and line count (no clipped title boxes)
- **Highlight** — marks matches in poster body text (all posters stay visible)
- **Table of contents** — poster titles + in-document headings; **Contents** in the reader nav
- **Folder drop** — multiple `.md` files → landing gallery; pick one to read
- **Local markdown links** — open relative `.md` paths from the same folder when available
- **Reader controls** — dark mode (chrome only), zoom, serif/sans body text (persisted); toolbar icons from [Lineicons Basic](https://github.com/LineiconsHQ/Lineicons) (MIT)
- **Poster PDF export** — per-card export via toolbar beside each poster
- **Copy code** — copy button on fenced blocks
- **Design system** — grounds, typography, code chips, graphics, and title scale in [config/gallery.config.json](config/gallery.config.json); refocus the tab after editing to reload ([config/README.md](config/README.md))
- **Bundled demo** — **Open the gallery demo** on the landing footer loads [docs/demo/gallery-showcase.md](docs/demo/gallery-showcase.md) offline

## Quick start

Requires [Node.js](https://nodejs.org/) (for `npm` and the static dev server).

```bash
git clone https://github.com/arashr/md-gallery.git
cd md-gallery
npm install
npm start
```

Open http://localhost:3000 (or the port `serve` prints). Use `http://localhost` — not `file://` — so the app can `fetch` [config/gallery.config.json](config/gallery.config.json).

Drop a Markdown file, a folder of `.md` files, or use **Open the gallery demo** in the landing footer.

```bash
npm test
```

Parser, config, APCA, glyph, and render tests (no browser required).

## Configuration

Most behavior is driven by **`config/gallery.config.json`**:

| Area | Keys (grouped under `theme.graphics`) |
|------|----------------------------------------|
| Pattern ink | `glyph` — color and opacity CSS vars |
| Hero glyph | `heroGlyph` — full-card decorative letter |
| Type patterns | `typePattern` — bands, blends, `fillSpace`, `sideBandWidthRatio`, etc. |
| Photos | `imageHalftone` — colored halftone overlay |

See [config/README.md](config/README.md) for the full field reference and [docs/DESIGN.md](docs/DESIGN.md) for color and contrast rules.

**Dev preview:** `/config-lab.html` (not linked from the app) — live tweak pattern and hero settings on sample cards.

## How posters are split

1. **`##` headings** (default) — each level-2 section is one poster
2. **`---` rules** — if there are no `##` lines but multiple horizontal rules
3. **Single poster** — whole file when neither applies

Code fences are respected when detecting splits. Details: [docs/POSTER_LOGIC.md](docs/POSTER_LOGIC.md).

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/POSTER_LOGIC.md](docs/POSTER_LOGIC.md) | How one `.md` file becomes posters |
| [docs/DESIGN.md](docs/DESIGN.md) | Design system, APCA, OKLCH, tokens |
| [config/README.md](config/README.md) | Config file reference |
| [docs/DECISION_LOG.md](docs/DECISION_LOG.md) | Product and architecture decisions |
| [docs/PROJECT_MEMORY.md](docs/PROJECT_MEMORY.md) | Implementation notes for contributors |
| [AGENTS.md](AGENTS.md) | Agent handoff checklist |

## Stack

- [marked](https://marked.js.org/) — Markdown → HTML
- [DOMPurify](https://github.com/cure53/DOMPurify) — sanitize user HTML
- [html2canvas](https://html2canvas.hertzen.com/) + [jsPDF](https://github.com/parallax/jsPDF) — poster PDF export
- `assets/site.css` — poster and gallery visual system (shared lineage with **figlets-blog**; sync manually)
- `lib/gallery-config.js` — loads config, injects ground / code / title-face CSS

No production build step for the app itself (static files + `npx serve`).

## Third-party assets

- **Toolbar icons** — [Lineicons Basic](https://github.com/LineiconsHQ/Lineicons) (MIT), inlined in `assets/icons.js`
- **Demo photo** — [Universtock on Unsplash](https://unsplash.com/photos/bright-star-with-colorful-nebula-in-dark-space-bsEmH06Ko1w) (`assets/demo/nebula-universtock.jpg`); credited on the showcase poster

## License

This project is released under the **[MIT License](LICENSE)**.

MIT is a permissive open-source license: you may use, modify, and distribute the code (including in commercial projects) as long as you keep the copyright notice. It does **not** require derivatives to be open source.

If you later want stricter terms, common alternatives are:

| License | When to consider it |
|---------|-------------------|
| **Apache 2.0** | Like MIT, plus an explicit patent grant (common for larger orgs) |
| **GPL-3.0** | You want forks and hosted copies to stay open source (copyleft) |

For a small client-side tool meant to be freely reusable, MIT is the usual fit.

## Sister project

**figlets-blog** is the static editorial site (collections, RSS, Node build). **MD Gallery** is a separate repo for client-side reading only — share ideas and CSS, not a single deploy pipeline.
