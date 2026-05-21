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

## 2026-05-21 — In-post headings use poster title font

**Decision:** `h2`–`h6` inside `.prose` inherit the same `title-face-*` display family as the poster title (smaller scale).

**Why:** One cohesive “poster” per section; avoids Ultra-only subheads clashing with Monoton/Limelight titles.
