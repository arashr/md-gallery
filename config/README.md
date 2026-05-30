# Gallery design system (`gallery.config.json`)

Single source of truth for theme, poster grounds, typography, spacing, and title fitting. Loaded at startup by `lib/gallery-config.js` and applied as CSS custom properties + a small injected stylesheet for per-ground tokens.

## Applying edits

1. Run the app with **`npm start`** and open **http://localhost:3000** (not `file://` — the config is loaded via `fetch`).
2. **Save** `config/gallery.config.json`.
3. **Switch away from the browser tab and back** (or change to another app and return). The tab refocus reloads config and redraws poster patterns.
4. Have a **`.md` file open in the reader** — landing page alone does not show posters or glyph patterns.

**Quick checks**

| Change | What you should see |
|--------|---------------------|
| `theme.graphics.glyphPatternOpacity` → `0.2` | Much stronger background letters |
| `theme.graphics.typePattern.noneProbability` → `0` | Every poster gets a pattern (none were skipped before) |
| `theme.graphics.typePattern.patternTypes` → `["line"]` only | Only straight-line letter paths |
| `theme.graphics.typePattern.repeatsMin` / `Max` → `4` / `4` | Fewer, larger gaps between letters |
| `grounds.*.surface` | Poster card background color |

If nothing changes: hard-refresh the page (Cmd+Shift+R), re-drop your `.md` file, and confirm the JSON is valid (a parse error keeps the previous config).

**Ground rules, APCA targets, OKLCH usage:** [`docs/DESIGN.md`](../docs/DESIGN.md).

**Reload:** save the file, then refocus the browser tab (or refresh). Changes apply without rebuilding.

---

## `theme` — page chrome & shared tokens

### `theme.colors`

| Key | Role |
|-----|------|
| `paper` | Page background |
| `ink` | Primary text |
| `inkSoft` | Body / secondary text |
| `inkMute` | Meta, hints (rgba ok) |
| `red` | Accent |
| `redBright` | Accent hover / focus |

### `theme.layout`

| Key | Role |
|-----|------|
| `measure` | Prose max line length (`65ch`) |
| `posterWidth` | Poster card width (`42rem`) |
| `edgeStepMix` | How much black mixes into ground edges (0–0.4) |
| `pad` | Horizontal page padding |
| `scrollOffset` | Scroll-padding for sticky header |

### `theme.hero`

Collection hero (top of document) — values can be **semantic** or hex:

| Key | Example |
|-----|---------|
| `display` | `"red"` |
| `body` | `"inkSoft"` |
| `muted` | `"inkMute"` |

Semantic names: `paper`, `ink`, `inkSoft`, `inkMute`, `red`, `redBright`.

### `theme.typography`

| Key | Maps to |
|-----|---------|
| `bodySize` | `body` font-size |
| `bodyLineHeight` | `body` line-height |
| `proseLineHeight` | `.prose` line-height (sans body) |
| `titleLineHeight` | Default poster title line-height |
| `titleHeadingLineHeight` | In-post h2–h4 on title-face cards (when face has no override) |
| `titleFaceLetterSpacing` | Default letter-spacing for title faces |
| `labelSize` | `.kicker`, `.mono-label` |
| `labelWeight` | label weight |
| `labelLetterSpacing` | label tracking |
| `proseSize` | `.prose` inside posters |
| `crumbSize` | breadcrumbs |

### `theme.motion`

| Key | Role |
|-----|------|
| `cardHoverEase` | Card hover easing |
| `cardHoverDuration` | Card hover duration |
| `revealDuration` | Scroll-reveal fade/slide duration |
| `revealEase` | Scroll-reveal easing |
| `shutterDuration` | Shutter intro duration |
| `shutterEase` | Shutter intro easing |

### `theme.graphics` — poster type patterns

Canvas glyph patterns on each poster (`lib/type-pattern.js`, driven from `assets/reader.js`). Not a CSS background tile.

| Key | Role |
|-----|------|
| `glyphPatternColor` | `"display"` (use each ground’s `foreground.display`) or a semantic/hex color → `--config-glyph-pattern-color` / per-ground `--on-ground-glyph-pattern-color` |
| `glyphPatternOpacity` | Canvas layer opacity (default `0.07`) → `--glyph-pattern-opacity` on `.post-card__glyph-canvas` |
| `imageHalftone` | Poster image halftone subgroup (object below). Set `{ "enabled": false }` or legacy `false` for plain photos. **Independent** of glyph `typePattern`. |
| `typePattern` | Flat object — one `renderTypePattern` per poster empty region (`lib/type-pattern-poster.js`). |

#### `imageHalftone` keys

Object under `theme.graphics.imageHalftone`. Defaults in `lib/image-halftone-config.js`.

| Key | Default | Role |
|-----|---------|------|
| `enabled` | `true` | Master toggle |
| `dotPx` | `5` | Dot spacing in CSS px (lower = finer) |
| `contrast` | `1.2` | Tone punch / dot density (higher = less washed out) |
| `saturation` | `1.35` | Color boost per dot |
| `paper` | `"surface"` | Solid fill behind dots: `surface` (poster ground), `paper` (page bg), or hex — blocks glyph bleed-through |
| `angleDeg` | `15` | Screen angle in degrees (`0` = upright grid; classic newsprint ≈ `15`–`45`) |
| `pattern` | `"stagger"` | Dot layout: `stagger` (hex offset rows), `grid` (square), `line` (square rows, no hex offset) |

Legacy flat keys (`imageHalftoneDotPx`, `imageHalftoneContrast`, etc.) still merge if present.

**Quick checks**

| Change | What you should see |
|--------|---------------------|
| `imageHalftone.angleDeg` → `45` | Diagonal ruling across the photo |
| `imageHalftone.pattern` → `"grid"` | Square dot matrix (no row offset) |
| `imageHalftone.pattern` → `"line"` | Visible scan-line rows |
| `imageHalftone.enabled` → `false` | Plain photograph |

#### `typePattern` keys

**Pattern type:** `patternTypes` — array of `line` | `circle` | `arc` | `spiral` | `wave` | `grid` | `fill`; one picked at random per poster.

**Fixed booleans:** `fillSpace`, `opticalTight`, `followPath`, `flipReadable`, `flipAlternateVertical`, `flipAlternateHorizontal`.

**Random ranges** (`Min` / `Max`, inclusive per poster): `repeats`, `padding`, `tightTracking`, `lineAngle` (deg), `startAngleDeg`, `arcSweepDeg`, `spiralTurns`, `waveAmplitude`, `waveCycles`, `gridColumns`, `fillAngle` (deg), `fillRowGap`, `opacity`. Optional `fontSizeMin` / `fontSizeMax` — omit both for library auto size.

**Random probability:** `gridStaggerProbability` (`0–1`).

**Placement** (where on the card):

| Key | Role |
|-----|------|
| `regionPreference` | Order to try: `bottom` (below body), `between` (header–body gap), `top` (above title) |
| `emptySpaceMinPx` / `emptySpaceMinRatio` | Minimum empty band height before trying the next slot |
| `regionInsetPx` | Shrink chosen region on all sides (keeps pattern off text). Use **`0`** with edge align. |
| `alignToCardEdge` | **`true`** — pattern band spans the full poster (edge to edge in the padding margins). **`false`** — band stays inside the content box only. |
| `fallbackBandWidth` / `fallbackSide` | Narrow side column when no slot is tall enough (`left` / `right` / `auto`) |
| `edgeOverflowPx` | Side band only (when `alignToCardEdge` is false): pixels to extend past the content box toward the card edge. Omit to auto-use the poster’s horizontal padding. Ignored when `alignToCardEdge` is true. |
| `symbolPool`, `symbolProbability`, `noneProbability` | Letter source and skip chance |

Patterns re-measure after poster title fitting so bands track the final title height.

### `theme.code`

Code blocks (`pre`) and inline `` `code` `` on posters and page prose.

| Key | Role |
|-----|------|
| `text` | Text on code blocks — semantic or hex; maps to `--config-code-text` (does **not** follow dark-mode `--paper`) |
| `blockSteps` | OKLCH darken steps from surface/paper (default `2`) |
| `blockStepMix` | Target mix toward black for `referenceSteps` (default `0.36` at 2 steps) |
| `referenceSteps` | Steps `blockStepMix` is calibrated for when `autoCompensateMix` is on (default `2`) |
| `autoCompensateMix` | When `true` (default), scales per-step mix so total darkness stays constant as `blockSteps` changes — e.g. 1 step uses ~`0.59` to match 2×`0.36`. Set `false` to use literal `blockStepMix` per step. |
| `inlineSurfaceMix` | Chip tint: mix of darkened block bg back toward surface (e.g. `"35%"`) — used for both inline and block code |
| `chipDarkBodyLift` | Dark poster body (`ink`): code chips this much **lighter than the ground** — `color-mix` from `surface` toward `paper` (default `"20%"`) |
| `chipLightSurfaceShade` | **White** ground (≈ page paper) and **carmine** (white body): chips this much **darker** — mix from `surface` toward black (default `"10%"`) |
| `chipPaperMix` | Optional extra lift toward `paper` on lighten grounds only |

Per-ground `codeChipPaperMix` overrides `chipPaperMix` when one ground needs more lift.

Injected CSS (`#gallery-config-code`) sets `--on-ground-code-chip-bg` per ground, `--code-chip-bg` on `:root`, and `--on-ground-code-bg` (darken expression for export).

---

## `darkTheme` — UI chrome only

Posters keep their configured ground colors in dark mode; only the shell (header, drop zone, TOC) uses these.

| Path | Role |
|------|------|
| `paper` | Dark page background |
| `colors.ink` / `inkSoft` / `inkMute` | Chrome text |
| `colors.red` / `redBright` | Chrome accents |
| `dropZone.butterMix` | Butter tint on drop-zone hover (e.g. `"22%"`) |

---

## `grounds` — poster surfaces & text pairs

Each ground is an object (or a **string** hex for surface only — then default foreground presets apply).

**Accessibility:** choose **`surface` first** (the brand color). Tune **`foreground.*`** until APCA passes — do not lighten the surface just to salvage a default text color. See [`docs/DESIGN.md`](../docs/DESIGN.md#background-first-foreground-adapts).

```json
"mint": {
  "surface": "#a7dbce",
  "foreground": {
    "display": "red",
    "body": "inkSoft",
    "muted": "#363b40",
    "accent": "red",
    "focus": "redBright"
  }
}
```

| Field | Role |
|-------|------|
| `surface` | Poster background (`--ground-*`) |
| `foreground.display` | Titles, headings on ground |
| `foreground.body` | Body / prose |
| `foreground.muted` | Meta, captions |
| `foreground.accent` | Tags, accents |
| `foreground.focus` | Focus ring on ground |
| `foreground.linkHoverText` | Prose link hover text (default `#ffffff`) |
| `foreground.linkHoverBg` | Prose link hover background (default `ink`) |

`foreground.*` values can be semantic (`"red"`, `"inkSoft"`) or any CSS color (`"#363b40"`).

**Default presets** (when you only pass a hex string): light grounds → red display; `tangerine` / `forest` / `carmine` use their own pairs (see defaults in `lib/gallery-config.js`).

---

## `fonts`

| Key | Role |
|-----|------|
| `uiSans` | UI + default sans (`family`, `google`, optional `lineHeight` — defaults to `bodyLineHeight`) |
| `uiSerif` | Serif body toggle (`family`, `google`, optional `lineHeight`) |
| `mono` | Mono labels and code blocks (`family`, `google`, optional `lineHeight`) |
| `titleFaces` | Rotating display fonts per poster (`id`, `google`, optional `lineHeight`, `headingLineHeight`, `letterSpacing`) |

Per-face typography is injected as `#gallery-config-title-faces` (same pattern as grounds/code). Title fitting (`lib/fit-poster-title.js`) reads live line-height from the DOM.

---

## `titleScale`

DOM title fitting (`lib/fit-poster-title.js`):

| Field | Role |
|-------|------|
| `minPx`, `maxPx`, `maxWidthRatio` | Defaults for the shortest tier (and fallback when `tiers` is omitted) |
| `floorPx` | Lowest px the fitter may use when `maxLines` still fails at tier `minPx` (default 14) |
| `slackMinPx`, `bAspect` | When header+body slack is large enough, add `.post-card--roomy` and B-aspect `--poster-min-height` |
| `tiers[]` | Upper bounds on **plain** title length (`data-title-chars` on the card). First matching tier wins (`maxChars: null` = catch-all). Per tier: optional `minPx`, `maxWidthRatio`, `maxLines`, `maxPxRatio`, `floorPx`. |

Binary search picks the largest `--poster-title-size` up to the width-derived cap, within `maxLines` (measured via block height ÷ line-height). Config reload refits open posters (refocus tab). Re-open a file after code changes so `data-title-chars` is present. No CSS height clip on the title box.

---

## What stays in CSS

- Layout that is not yet tokenized (gallery gaps, some clamps, title-face **font-family** rules)
- Dark-mode **component** rules that reference `--chrome-*`
- Prose element styling (lists, tables, code blocks)

To add a new ground: add a key under `grounds` in JSON — no CSS edit required.
