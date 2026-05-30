# MD Gallery

Browser-based Markdown reader with the Figlets editorial **poster gallery** layout. Drop a `.md` file (or folder) on the homepage; parsing and rendering stay **entirely in your browser** — nothing is uploaded.

## Features

- **Poster gallery** — colored grounds, rotating display title fonts, staggered cards on wide screens
- **Structural splits** — posters from `##` headings, `---` rules, or a single card; no dates required ([POSTER_LOGIC.md](docs/POSTER_LOGIC.md))
- **Long-title fitting** — `titleScale.tiers` in config shrink long section titles by length and line count (no clipped title boxes)
- **Search** — filters posters and highlights matches in body text
- **Table of contents** — poster titles + in-document headings; **Contents** in the reader nav
- **Folder drop** — multiple `.md` files → landing gallery; pick one to read
- **Local markdown links** — open relative `.md` paths from the same folder when available
- **Reader controls** — dark mode (chrome only), zoom, serif/sans body text (persisted)
- **Poster PDF export** — per-card export via toolbar beside each poster
- **Copy code** — copy button on fenced blocks
- **Design system** — grounds, typography, code chips, and title scale in [config/gallery.config.json](config/gallery.config.json) ([config/README.md](config/README.md)); refocus the tab after editing to reload

## Quick start

```bash
npm install
npm start
```

Open http://localhost:3000 (or the port `serve` prints). Drop a Markdown file, a folder of `.md` files, or use **Open the gallery demo** in the landing footer to load the built-in showcase.

```bash
npm test
```

Parser, config, APCA, and render tests (no browser required).

## How posters are split

1. **`##` headings** (default) — each level-2 section is one poster  
2. **`---` rules** — if there are no `##` lines but multiple horizontal rules  
3. **Single poster** — whole file when neither applies  

Code fences are respected when detecting splits. Details: [docs/POSTER_LOGIC.md](docs/POSTER_LOGIC.md).

## Tuning title size

Poster titles are sized in the DOM by `lib/fit-poster-title.js`, driven by **`titleScale`** in config:

- Short titles (≤ `maxChars` on the first tier) keep large display type (`minPx` ~64).
- Longer titles use stricter tiers: lower width cap, optional **`maxLines`**, and search down to **`floorPx`** when needed.

Edit `titleScale.tiers` in [config/gallery.config.json](config/gallery.config.json), save, refocus the browser tab (or re-open the file). See [config/README.md](config/README.md#titlescale).

## Design & accessibility

- Ground colors and contrast targets: [docs/DESIGN.md](docs/DESIGN.md) (APCA, OKLCH)
- Product/architecture decisions: [docs/DECISION_LOG.md](docs/DECISION_LOG.md)
- Implementation notes for contributors/agents: [docs/PROJECT_MEMORY.md](docs/PROJECT_MEMORY.md), [AGENTS.md](AGENTS.md)

## Stack

- [marked](https://marked.js.org/) — Markdown → HTML  
- [DOMPurify](https://github.com/cure53/DOMPurify) — sanitize user HTML  
- [html2canvas](https://html2canvas.hertzen.com/) + [jsPDF](https://github.com/parallax/jsPDF) — poster PDF export  
- `assets/site.css` — shared visual system with [figlets-blog](https://github.com/) (copied manually; blog repo unchanged)  
- `lib/gallery-config.js` — loads config, injects ground/code/title-face CSS

No production build step for the app itself (static files + `npx serve`).

## Sister project

**figlets-blog** is the static editorial site (collections, RSS, Node build). **MD Gallery** is a separate repo for client-side reading only — share ideas and CSS, not a single deploy pipeline.
