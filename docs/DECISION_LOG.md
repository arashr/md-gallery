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

## 2026-05-28 — Block code: border only, inline code: chip

**Decision:** Fenced `pre` blocks use a transparent background and the same 2px edge border as tables. Inline `` `code` `` keeps a tinted chip background derived from `theme.code` (`chipDarkBodyLift` / `chipLightSurfaceShade`).

**Why:** Border separates blocks without a second “panel” color on the ground; inline code still needs a readable chip on saturated surfaces.

---

## 2026-05-28 — Paper grain removed; type patterns only

**Decision:** Drop `theme.grain`, per-ground `grainOpacity`, `assets/poster-grain.svg`, and the poster `::before` grain overlay. Decorative texture is **type patterns** only (`theme.graphics`: `glyphPatternColor`, `glyphPatternOpacity`, `typePattern`).

**Why:** Grain and glyph patterns were separate systems; grain had no remaining CSS consumer after the SVG overlay was removed. One graphics config path avoids dead tokens (`--poster-grain-opacity`, `--config-grain-*`).

---

## 2026-05-28 — No code styling in poster titles

**Decision:** `inlineMarkdownToHtml` with `{ forTitle: true }` strips `<code>` wrappers in poster titles (and collection `h1`); backticks render as plain display text.

**Why:** Filename-style titles (`type-pattern-mosaic.js`) should stay in one display face, not switch to mono + chip.
