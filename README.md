# MD Gallery

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

MD Gallery is a browser-based Markdown reader that turns local `.md` files into an editorial poster gallery. Users can drop a file or a folder into the app, read structured sections as poster cards, search within the current document, open a table of contents, and export individual posters as PDFs.

Files remain on the user's device. The app does not upload user Markdown.

Repository: [github.com/arashr/md-gallery](https://github.com/arashr/md-gallery)

## Capabilities

- Read a single `.md` file in the browser.
- Read a folder of `.md` files and show a local gallery picker.
- Split documents into posters from `##` headings, `---` dividers, or one full-file poster.
- Show a document title, short introduction, poster cards, and nested table of contents.
- Highlight matching text in poster bodies while keeping every poster visible.
- Open relative Markdown links when linked files are available from the same folder.
- Render common Markdown, including lists, task lists, tables, quotes, images, inline code, and fenced code blocks.
- Copy fenced code blocks.
- Export one poster at a time as a PDF.
- Adjust reader zoom and prose font.
- Toggle dark reader chrome while poster colors stay stable.
- Use a configurable visual system for grounds, foreground colors, title faces, code chips, decorative glyphs, and title fitting.
- Provide a bundled showcase at [docs/demo/gallery-showcase.md](docs/demo/gallery-showcase.md).

## Quick start

Requires Node.js and npm.

```bash
git clone https://github.com/arashr/md-gallery.git
cd md-gallery
npm install
npm start
```

Open the local URL printed by `serve`, usually:

```text
http://localhost:3000
```

Use a local HTTP server. Do not open `index.html` with `file://`, because the browser must load local project modules and configuration through normal HTTP requests.

Run tests:

```bash
npm test
```

Production / GitHub Pages uses `npm run build`, which writes minified assets to `dist/` without changing source files under `assets/`, `lib/`, or `assets/css/`.

## How it works

MD Gallery is a static client-side app. Local development serves the repo root as-is; production deploys a minified `dist/` build (`npm run build`).

The main flow is:

1. `assets/reader.js` reads a dropped or selected file with browser file APIs.
2. `lib/parse-document.js` converts Markdown text into a document model.
3. `lib/render-document.js` renders the model to sanitized HTML.
4. `assets/reader.js` wires the table of contents, highlight, controls, folder gallery, and local Markdown links.
5. Poster visuals are applied with CSS and configuration from `config/gallery.config.json`.

Markdown rendering uses `marked`. Sanitization uses `isomorphic-dompurify`. Poster PDF export uses `html2canvas` and `jspdf`.

## Poster splitting

The split rules are deterministic:

1. If the file has `##` headings, each `##` starts a poster.
2. If the file has no `##` headings and has two or more `---` divider lines, each divided segment becomes a poster.
3. Otherwise the whole file becomes one poster.

Code fences are respected, so `##` or `---` inside fenced code blocks do not split the document.

User-facing details are in [docs/POSTER_LOGIC.md](docs/POSTER_LOGIC.md).

## Configuration

Most visual settings live in [config/gallery.config.json](config/gallery.config.json).

Important areas:

- `theme.colors`: page colors and reader surface tokens.
- `darkTheme`: dark reader chrome.
- `grounds`: poster background and foreground pairs.
- `fonts` and `titleFaces`: body, UI, and display type.
- `titleScale`: poster title fitting tiers.
- `theme.code`: inline code chips and block code behavior.
- `theme.graphics`: glyph ink, hero glyphs, type pattern bands, and image halftone settings.

See [config/README.md](config/README.md) for the full field reference.

See [docs/DESIGN.md](docs/DESIGN.md) for contrast, OKLCH, APCA, spacing, and design-system rules.

## Project structure

- [index.html](index.html): app shell and import map.
- [assets/reader.js](assets/reader.js): file reading, reader controls, highlight, TOC, folder gallery.
- [assets/reader.css](assets/reader.css): landing page and reader chrome.
- [assets/site.css](assets/site.css): poster cards, grounds, typography, gallery layout.
- [lib/parse-document.js](lib/parse-document.js): Markdown split logic and document model.
- [lib/render-document.js](lib/render-document.js): sanitized document rendering.
- [lib/sanitize.js](lib/sanitize.js): HTML allowlist for rendered Markdown.
- [lib/gallery-config.js](lib/gallery-config.js): config loading and CSS variable injection.
- [lib/poster-export.js](lib/poster-export.js): per-poster PDF export.
- [docs/POSTER_LOGIC.md](docs/POSTER_LOGIC.md): user-facing poster split guide.
- [docs/PROJECT_MEMORY.md](docs/PROJECT_MEMORY.md): architecture notes and handoff context.
- [docs/DECISION_LOG.md](docs/DECISION_LOG.md): product and architecture decisions.

## Development

Install dependencies once:

```bash
npm install
```

Start the static server:

```bash
npm start
```

Run the test suite:

```bash
npm test
```

Tests cover parser behavior, table-of-contents alignment, config merging, APCA checks, local Markdown links, glyph placement, image halftone behavior, poster export helpers, and bundled Markdown paths.

When changing document splitting, update [docs/POSTER_LOGIC.md](docs/POSTER_LOGIC.md) and add a product or architecture note to [docs/DECISION_LOG.md](docs/DECISION_LOG.md) if the behavior changes.

When changing visual rules, update [docs/DESIGN.md](docs/DESIGN.md) or [docs/PROJECT_MEMORY.md](docs/PROJECT_MEMORY.md) as appropriate.

## Third-party assets

- Toolbar icons: [Lineicons Basic](https://github.com/LineiconsHQ/Lineicons), MIT, inlined in [assets/icons.js](assets/icons.js).
- Demo photo: [Universtock on Unsplash](https://unsplash.com/photos/bright-star-with-colorful-nebula-in-dark-space-bsEmH06Ko1w), credited in the showcase.

## License

MIT. See [LICENSE](LICENSE).
