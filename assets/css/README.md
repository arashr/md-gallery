# CSS architecture

Styles load in this order (`index.html`):

1. **site.css** — design system shared by landing and reader (`@import` of `css/site/*`)
2. **reader.css** — reader chrome, 12-column layout, TOC rail (`@import` of `css/reader/*`)
3. **gallery.css** — MD Gallery landing (drop zone, folder grid), lightbox, edge halftone, gallery-only reader chrome (`@import` of `css/portfolio/*` + `css/gallery/*`)

Each entry file only `@import`s modules under `assets/css/`. Edit the module that matches the UI you are changing. See module map in `css/site/` and `css/reader/` (same layout as md-portfolio).

## gallery/

| Module | Concern |
|--------|---------|
| `01-landing.css` | Centered landing shell, folder mini-grid, mini-poster buttons |
| `02-reveal.css` | Scroll reveal animation (gallery keeps `.reveal`) |
| `03-reader-chrome.css` | Single-row header: Open file, highlight search, filtered-out posters |

## portfolio/ (shared landing effects)

| Module | Concern |
|--------|---------|
| `01-effects.css` | Edge halftone |
| `02-landing-shell.css` | Drop zone, featured grid, landing foot |
| `04-lightbox.css` | Image lightbox |

## Key layout tokens (`css/site/01-tokens.css`)

- `--layout-cols: 12`, `--layout-max: 1440px`, `--poster-grid-span: 6`
- Reader posters use nested grid + `--poster-col-start` (see `css/reader/05-layout.css`)
- Sticky TOC rail at `@container reader-shell (min-width: 75rem)` when `.has-toc-rail`

## Config vs CSS

- **CSS** owns page colors, typography, spacing, ground surfaces/foregrounds (`01-tokens.css`, `04-grounds.css`)
- **JSON** (`config/gallery.config.json`) owns graphics, per-ground glyph overrides, fonts, title scale, edge halftone

Ground palette edits → `assets/css/site/01-tokens.css` + `lib/ground-tokens.js`. Glyph tuning → JSON `grounds.*.glyph`.
