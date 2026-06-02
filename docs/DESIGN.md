# Design system - MD Gallery

Ground rules, color/accessibility standards, and token map for poster gallery UI. **Implementation reference:** `config/gallery.config.json` + `config/README.md`. **CSS:** `assets/site.css` (posters, shared with figlets-blog), `assets/reader.css` (reader chrome).

---

## Ground rules

These are non-negotiable defaults for new work.

1. **Accessibility first:** contrast, focus, motion, and readable type come before visual flair. **Background colors are the anchor; foreground adapts** (see APCA section).
2. **Grid system: 8px:** spacing and sizing snap to an 8px base. Documented exceptions: 4px card shadow offset, fractional em underline offsets, and sub-pixel title fitting from JS.
3. **Always responsive:** fluid layout uses `clamp()`, `%`, `vw`, and container queries. Avoid fixed desktop-only layouts.

### Tokens & config

4. **Config before CSS:** theme colors, grounds, typography, spacing, decorative graphics, and dark chrome live in `config/gallery.config.json`. CSS consumes `--config-*` custom properties. Avoid hardcoding theme values in stylesheets unless layout logic requires it.
5. **Semantic colors over one-off hex:** prefer named tokens (`ink`, `inkSoft`, `red`, `redBright`) in config. Use raw hex only for ground-specific overrides, such as muted text on a light ground.
6. **Every ground is a pair, not a color:** each ground defines `surface` plus a full `foreground` set (`display`, `body`, `muted`, `accent`, `focus`). Never ship a surface without a tested text pair. Set **surface first**. Tune `foreground.*` until APCA passes.
7. **Dark mode is chrome-only:** `darkTheme` affects the reader shell (header, drop zone, TOC). Poster grounds keep their configured light-theme pairs. Do not re-tint posters in dark mode.

### Layout & spacing

8. **Fluid padding, fixed rhythm:** page pad uses `clamp(16px, 4vw, 56px)` (8px multiples). Poster inner padding uses `clamp()` in rem/vw, not fixed px breakpoints.
9. **Prose measure cap:** body text targets about 50 to 75 characters per line (`65ch` default). Poster width (`42rem`) stays decoupled from measure so UI font changes do not shrink cards.
10. **Short posters use ISO B proportions:** `.post-card--roomy` gets a B-aspect min-height from `titleScale.bAspect`. Body content anchors to the bottom when there is slack.
11. **Wide screens stagger, narrow screens stack:** gallery offset (`--poster-shift`) only above about 900px. Mobile is full-width, left-aligned, with no horizontal scroll.

### Typography

12. **Titles fill the box, never overflow:** poster titles are sized by live DOM fitting (`lib/fit-poster-title.js`), not a fixed px scale in CSS.
13. **One display face per poster:** title faces rotate from config (`titleFaces`). In-body `h2` through `h6` inherit the same face as the poster title.
14. **Serif toggle is body-only:** `data-prose-font='serif'` affects prose and hero brief, not display titles or UI chrome.
15. **Balance long headings:** use `text-wrap: balance` on poster and in-body headings where supported.

### Surface & texture

16. **Decorative layers are optional:** glyph patterns, hero glyphs, and image halftone effects are token-driven and can be turned off without affecting layout or contrast.
17. **Edges derive from surface:** hairline and edge colors come from OKLCH `color-mix` on `--surface`, not hand-picked per ground. Posters use no border (`border: none`).
18. **Grounds are assigned, not chosen:** poster ground comes from slug hash (`lib/grounds.js`), keeping distribution stable across reloads.

### Motion & interaction

19. **Motion has named tokens:** card hover uses config `cardHoverEase` + `cardHoverDuration`. Avoid ad-hoc transition values in component CSS.
20. **Hover enhances, never required:** all interactive states must work without hover (keyboard, touch, reduced motion).
21. **Respect `prefers-reduced-motion`:** disable scroll smoothing, reveals, and hover transforms when the user asks for reduced motion.
22. **Respect `prefers-reduced-transparency`:** reduce or disable decorative transparency layers.

### Focus & input

23. **Focus is never decorative:** use `:focus-visible` with `--on-ground-focus` on posters and `--chrome-red-bright` / `--red-bright` on page chrome. Minimum 3px outline + offset.
24. **Skip link on every view:** keyboard users can bypass chrome to main content.

### Content & continuity

25. **One poster, one editorial unit:** each `##` or split-rule section is a self-contained card with a title block and prose body. It should use the same visual language as figlets-blog.
26. **User-facing docs are app content:** bundled docs such as `gallery-showcase.md` and `POSTER_LOGIC.md` should teach users how to operate the reader and format Markdown. Do not mention backend, dependency, parser, or configuration details in those files. Put technical implementation details in `README.md`, `PROJECT_MEMORY.md`, `DECISION_LOG.md`, or `config/README.md`.
27. **Markdown examples must render as examples:** when a user-facing doc shows fenced code that contains Markdown split markers such as `##` or `---`, wrap the example in a longer outer fence. The parser supports fence marker type and length, so those markers should stay inside the current poster.
28. **Sanitize all user HTML:** markdown output always passes through the allowlist sanitizer. Design assumes untrusted content.
29. **Sync poster CSS with figlets-blog manually:** `assets/site.css` is shared DNA. Mirror intentional changes there, not via merged builds.

### Dev workflow

30. **Edit JSON, refocus tab:** config hot-reloads on window focus after save. There is no rebuild step.

---

## Accessibility - APCA

We use **[APCA](https://git.apcacontrast.com/documentation/APCAeasyIntro)** (Accessible Perceptual Contrast Algorithm), not legacy WCAG 2.x contrast *ratios*, for judging text/background pairs.

APCA reports **Lc** (lightness contrast). Polarity matters: test **dark text on light ground** and **light text on dark ground** separately. Use a current APCA calculator (e.g. [Myndex CPCA](https://www.myndex.com/APCA/)) when adding or changing grounds.

### Background first, foreground adapts

**The background is the design decision; foreground follows.**

| Priority | What | Examples |
|----------|------|----------|
| **1 - Keep** | Ground `surface`, page `paper`, code-block bg derived from surface | Brand pink, chartreuse, ISO poster grounds |
| **2 - Adjust** | `foreground.*`, `theme.code.text`, link-hover pair, dark chrome text | Darker body hex, white on carmine, `#710617` display on light grounds |
| **3 - Last resort** | Background itself | Only when no foreground pair can hit Lc targets without breaking the palette |

This applies everywhere: poster grounds, code blocks (`theme.code.text` on `--on-ground-code-bg`), collection hero on paper, and dark UI chrome. Do not lighten a ground surface just to make default `red` display text pass. Pick a display color that works on that surface instead.

When a pair fails APCA: **change foreground in config** (semantic token or hex). Re-test. Change **surface** only if foreground cannot reach targets while staying on-brand.

### Minimum Lc targets

| Role | Typical use | Min Lc | Notes |
|------|-------------|--------|-------|
| **Body** | Prose, links, UI labels on paper | **75** | `foreground.body` on `surface` |
| **Muted** | Meta, captions, dates | **60** | Smaller/lighter but still readable |
| **Display** | Poster titles, in-post `h2` through `h6` | **60** | Large display faces (Ultra, Monoton, ...); size reduces required Lc |
| **Accent / focus** | Tags, focus rings | **60** | Focus ring must remain visible on ground *and* on hover states |
| **Chrome (dark UI)** | Header, TOC, drop zone on `--config-dark-paper` | **75** body, **60** muted | Test `darkTheme.colors.*` on dark paper |
| **Code (inline)** | `` `code` `` on ground | **75** | `foreground.body` on `--on-ground-code-chip-bg` (see `theme.code.chipDarkBodyLift` / `chipLightSurfaceShade` in `config/README.md`) |
| **Code (block `pre`)** | Fenced blocks | **75** | Same text color as body. Background matches poster surface. Border uses edge tokens. APCA is for text on ground, not chip fill |

### Other a11y requirements

- **Keyboard:** all controls reachable; TOC drawer trap handled in `reader.js`.
- **Motion:** see rules 21 and 22 above.
- **Zoom:** reader zoom scales content without breaking title fit (refit on resize).
- **Links:** underline + offset on ground prose; hover inverts with sufficient APCA on both states.

---

## Color - OKLCH

**OKLCH** is the preferred color space for **generation and mixing**. Authoring in config may use hex or semantic names for clarity; **derived** colors should use OKLCH.

### Where OKLCH is used today

```css
/* Two-step edge from any ground surface - assets/site.css */
--on-ground-edge-1: color-mix(in oklch, var(--surface) calc(100% - var(--edge-mix)), black);
--on-ground-edge: color-mix(in oklch, var(--on-ground-edge-1) calc(100% - var(--edge-mix)), black);
```

Page chrome edges (`--edge-1`, `--hair`) use the same OKLCH mix chain on `--surface` / `--paper`. Tune strength with `theme.layout.edgeStepMix` (0.04 to 0.4).

### Rules for new color work

| Do | Don't |
|----|--------|
| `color-mix(in oklch, ...)` for edges, tints, and steps from a base | Hand-pick edge hex per ground |
| Keep ground **surfaces** in config as sRGB hex (portable, easy to edit) | Mix in `srgb` for perceptual steps on colored posters |
| Re-test APCA after any OKLCH mix that affects text or large UI areas | Assume `color-mix` preserved contrast |
| Use semantic tokens in `foreground.*` when possible | Duplicate `#c8102e` when `"red"` resolves correctly |

Legacy UI tints in `reader.css` still use `color-mix(in srgb, …)` for paper/butter overlays. **Prefer OKLCH** when touching those rules.

### Semantic color map

| Token | Role |
|-------|------|
| `paper` | Page background |
| `ink` | Strong text |
| `inkSoft` | Body default |
| `inkMute` | Secondary / meta on paper |
| `red` / `redBright` | Brand accent, display on light grounds, focus on paper |

On each ground, CSS maps `foreground.*` → `--on-ground-display`, `--on-ground-body`, `--on-ground-muted`, `--on-ground-accent`, `--on-ground-focus` via injected rules from `lib/gallery-config.js`.

---

## 8px grid reference

| Token / element | Value | Grid |
|-----------------|-------|------|
| `theme.layout.pad` | `clamp(16px, 4vw, 56px)` | 16, 56 = 2×8, 7×8 |
| `theme.graphics.typePattern.fillRowGap` | `1.15` (example) | fluid typography grid |
| Card shadow | `-4px 4px` | half-step (exception) |
| Focus outline | `3px` + `3px` offset | exception for visibility |
| Gallery gap | `clamp(1.25rem, 3vw, 2rem)` | rem-based fluid |

Prefer **rem** for typography and **ch** for measure. Use **px** only where the 8px grid or sub-pixel fitting requires it.

---

## Token map (quick)

| Concern | Config path | CSS variable(s) |
|---------|-------------|-----------------|
| Page colors | `theme.colors` | `--config-paper`, `--config-ink`, ... |
| Layout | `theme.layout` | `--config-measure`, `--config-poster-width`, `--config-pad`, … |
| Typography | `theme.typography`, `fonts.*.lineHeight`, `fonts.titleFaces[]` | `--config-body-size`, `--config-prose-line-height`, `--config-title-line-height`, … |
| Motion | `theme.motion` | `--config-card-hover-ease`, `--config-card-hover-duration` |
| Decorative graphics | `theme.graphics` | `--config-glyph-pattern-*`, `--on-ground-glyph-pattern-*` |
| Code blocks | `theme.code` | `--config-code-text`, `--code-block-bg`, `--on-ground-code-bg` |
| Dark chrome | `darkTheme` | `--config-dark-*`, `--chrome-*` in `reader.css` |
| Ground surface | `grounds.*.surface` | `--ground-{name}` |
| Ground text | `grounds.*.foreground` | `--on-ground-*` (injected) |
| Title fitting | `titleScale` | `--poster-title-size`, `--poster-min-height`, … (JS) |
| Stagger | computed in JS | `--poster-shift` from `lib/stagger.js` |

Full field reference: [`config/README.md`](../config/README.md).

---

## Checklist - New Ground Or Theme Change

1. Add or edit entry under `grounds` in JSON. Set **`surface` first**, then `foreground`.
2. Tune **`foreground.*`** until APCA passes on that surface (background stays fixed unless step 3 is needed).
3. Run **`npm test`**. This checks APCA on grounds, code blocks, and dark chrome (`test/apca-grounds.test.js`).
4. Confirm **focus** and **link hover** visible on surface.
5. Refocus browser tab. Spot-check poster in light UI and dark chrome.
6. If changing shared poster CSS, consider mirroring in **figlets-blog** `site.css`.

---

## Principles (one screen)

- **Background first; foreground adapts** (APCA)
- **OKLCH for derived color; config for authored color**
- **Tokens in JSON, behavior in CSS**
- **Fluid by default, stagger on wide**
- **Titles scale to fit; body reads at measure**
- **Chrome darkens; posters stay true**
- **Grain and motion are configurable, not baked in**
