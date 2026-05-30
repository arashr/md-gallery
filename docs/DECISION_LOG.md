# Decision log (MD Gallery)

Important **product- and architecture-level** choices for this reader — not CSS tweaks or one-off visual polish (those go in `docs/PROJECT_MEMORY.md`).

Format: **Date · Decision · Why**

---

## 2026-05-21 — Separate repo from figlets-blog

**Decision:** MD Gallery lives in its own repository (`md-gallery`). Figlets-blog remains the static editorial blog with Node build and `content/*.md`.

**Why:** Different product (client-side reader vs published collections). Avoid breaking the blog while experimenting with drop-to-read UX.

---

## 2026-05-21 — Browser-only, no upload

**Decision:** Parse and render Markdown entirely in the browser via `FileReader`. No backend, no file storage.

**Why:** Privacy and zero hosting complexity; matches “drop a file and read” positioning.

---

## 2026-05-21 — Poster split without dates

**Decision:** Posters are split by structure only: prefer `##`, else `---` segments, else single poster. No `## [date]` requirement.

**Why:** General-purpose MD reader (PRDs, notes, specs), not a blog archive.

---

## 2026-05-21 — Shared visual system via copied CSS

**Decision:** Reuse figlets-blog `assets/site.css` (grounds, poster cards, title faces, gallery stagger). Reader-specific UI in `assets/reader.css`.

**Why:** “One poster, one style” brand continuity without coupling build pipelines.

---

## 2026-05-21 — Sanitize all user HTML

**Decision:** Every `marked` output passes through `isomorphic-dompurify` with an explicit tag/attribute allowlist (`lib/sanitize.js`).

**Why:** User-supplied Markdown is untrusted; blog build trusts repo content only.

---

## 2026-05-21 — TOC in nav drawer, not sidebar

**Decision:** Table of contents opens from a **Contents** button in the header panel; not a persistent sidebar.

**Why:** Full-width poster gallery; matches collection-page direction on figlets-blog (no sidebar). Keeps focus on posters.

---

## 2026-05-21 — Instant in-document search only

**Decision:** Search filters posters in the open file and highlights body text. No global index, tags, or cross-file search.

**Why:** Single-file reader scope for v1; blog-style global search is out of scope.

---

## 2026-05-21 — Promote substantial pre-## intro to first poster

**Decision:** If content between the document `#` title and the first poster split is more than four non-fence lines, longer than 400 characters, or contains a real `##`/`###` heading, render it as the first gallery poster (“Overview”) instead of the hero blurb.

**Why:** Long preambles (PRDs, specs) were stuck in the header; the gallery is the main reading surface.

---

## 2026-05-21 — Inline markdown in poster titles

**Decision:** Poster titles, document `h1`, and TOC labels parse inline Markdown (`**bold**`, `*italic*`, etc.) via `lib/inline-markdown.js`.

**Why:** `##` lines often include emphasis; escaping them as plain text showed literal `**`.

---

## 2026-05-21 — In-post headings use poster title font

**Decision:** `h2`–`h6` inside `.prose` inherit the same `title-face-*` display family as the poster title (smaller scale).

**Why:** One cohesive “poster” per section; avoids Ultra-only subheads clashing with Monoton/Limelight titles.

---

## 2026-05-28 — Poster code colors ignore dark-mode `--paper`

**Decision:** Per-ground code chip mixes use `var(--config-paper)` (fixed light theme paper from config), not `var(--paper)`, which dark mode retints for UI chrome.

**Why:** Poster grounds stay on their configured palette in dark mode; mixing chips toward dark `--paper` made code blocks look washed or wrong.

---

## 2026-05-28 — Block code & tables: surface fill; inline code: chip, no border

**Decision:** Fenced `pre` blocks and tables use the poster **surface** background (`var(--surface)`) and a 2px edge border. Inline `` `code` `` keeps a tinted chip from `theme.code` (`chipDarkBodyLift` / `chipLightSurfaceShade`) with **no border**.

**Why:** Opaque surface on large blocks stops glyph patterns showing through; inline chips stay visually distinct from the ground without boxing every backtick.

---

## 2026-05-28 — Paper grain removed; type patterns only

**Decision:** Drop `theme.grain`, per-ground `grainOpacity`, `assets/poster-grain.svg`, and the poster `::before` grain overlay. Decorative texture is **type patterns** only (`theme.graphics`: `glyphPatternColor`, `glyphPatternOpacity`, `typePattern`).

**Why:** Grain and glyph patterns were separate systems; grain had no remaining CSS consumer after the SVG overlay was removed. One graphics config path avoids dead tokens (`--poster-grain-opacity`, `--config-grain-*`).

---

## 2026-05-28 — No code styling in display-type lines

**Decision:** `inlineMarkdownToHtml` with `{ forTitle: true }` strips `<code>` in poster titles, collection `h1`, and TOC poster rows (depth 2). In-post `h2`–`h4` use the same CSS reset (inherit display face, no chip). Body `` `code` `` and `pre` use `--font-ui-sans` (Inconsolata in default config), not a separate Inter Mono stack.

**Why:** Backticks in display lines (`type-pattern-mosaic.js`, headings) should not switch to a chip or second font; the UI body font is already monospaced.

---

## 2026-05-29 — Poster title fit: width only, no height clip

**Decision:** `lib/fit-poster-title.js` binary-searches the largest `--poster-title-size` that avoids **horizontal** overflow on the title link. Remove `--poster-title-max-h`, `max-height`, and `overflow: hidden` on `.post-title-bounds`. Roomy posters (`.post-card--roomy`) still get B-aspect `--poster-min-height` when header+body slack is large enough; the title block grows naturally with wrapped lines.

**Why:** Height-budget fitting caused intermittent clipping and overlap on long or multi-line titles; width-only fitting with natural height is more reliable. Trade-off: very long titles on narrow cards can stack many large lines until the next tuning pass.

**Revert:** `git checkout checkpoint/pre-title-tier-fit` (or reset to the commit tagged at that name) to restore this baseline before length/line-count tiers.

---

## 2026-05-29 — Long titles: length tiers + line-count fit

**Decision:** `titleScale.tiers` select limits from `data-title-chars` (`plainTitle.length`). Binary search finds the largest px with no horizontal overflow and `titleLineCount(link) ≤ maxLines` when the tier sets `maxLines`. Default tiers: ≤24 chars → base (`minPx` 64, no line cap); ≤55 → lower ratio/floor, `maxLines` 6; longer → `minPx` 32, `maxLines` 4, `maxPxRatio` 0.88. Removed unused `tallTitleMaxPx`, `tallTitleHeightRatio`, `targetSlack*`.

**Why:** Width-only fit left long titles huge on narrow cards (high `minPx` floor). Line count targets tall word-stacks without CSS `max-height` clip.

**Revert baseline:** tag `checkpoint/pre-title-tier-fit` (width-only, pre-tiers).

---

## 2026-05-30 — Bundled gallery showcase demo

**Decision:** Ship a same-origin showcase at `docs/demo/gallery-showcase.md` (grounds, typography, prose samples, search keywords, one poster with a bundled photograph). Homepage footer link **Open the gallery demo** opens it via `fetchBundledMarkdown` (`lib/bundled-md.js`); no separate nebula-only doc.

**Why:** One-click onboarding without dropping a file; demonstrates real poster imagery offline. Unsplash photo (`assets/demo/nebula-universtock.jpg`) is resized and bundled; one-line photographer credit on the poster only (no license block in the reader).

---

## 2026-05-30 — Flat `typePattern` config + glyph region placement

**Decision:** All mini-pattern options live as flat keys under `theme.graphics.typePattern` in `gallery.config.json` (`*Min`/`*Max`, `patternTypes`, placement keys). Defaults in `lib/type-pattern-poster.js` (`TYPE_PATTERN_DEFAULTS`). Placement (when/where on the card) is `lib/glyph-region.js`; options merge in `buildPosterTypePatternOptions()`.

**Why:** Matches prior config ergonomics; avoids nested `pattern` / `random` shapes. Placement and pattern generation stay separate so title-fit layout can drive regions.

---

## 2026-05-30 — One `renderTypePattern` per poster (not mosaic)

**Decision:** Each poster gets a single `renderTypePattern()` call into its glyph canvas (`assets/reader.js` → `renderPosterGlyphPatterns`). Do not tile multiple pattern instances (mosaic) in the reader.

**Why:** Mosaic was experimental in the type_pattern library; product intent is one decorative band per empty region. `lib/type-pattern-mosaic.js` remains for library parity but is unused by the reader.

---

## 2026-05-30 — Config reload redraws glyph patterns

**Decision:** On `window` `focus` and `visibilitychange`, debounced `reloadGalleryConfig()` runs `fitPosterTitles()` and **`renderPosterGlyphPatterns()`** (not title fit alone).

**Why:** Editing `gallery.config.json` while the tab stayed focused left patterns stale; users expect refocus-after-save to refresh graphics as well as CSS vars.
