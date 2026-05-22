# How MD Gallery splits a file into posters

Each **poster** is one colored card in the vertical gallery. Splitting happens in the browser when you open a file (no dates required).

## Auto-detect order

1. **`##` headings (default)** — If the file has at least one level-2 heading (`## Title`), each `##` starts a new poster. The heading text becomes the poster title; everything until the next `##` is that poster’s body.
2. **`---` rules** — If there are no `##` lines but two or more horizontal rules (`---` on their own line), each segment between rules is a poster. Title = first `#` or `##` in the segment, or “Section N”.
3. **Single poster** — Otherwise the whole file is one poster. Title = first `#` line or the filename.

## Document chrome (above the gallery)

- **Title** — First `# …` line, or YAML `title:`, or filename without `.md`. Inline markdown in the title (e.g. `**bold**`) is rendered, not shown literally.
- **Intro** — Short metadata between the `#` title and the first `##` (or first `---` split) stays in the hero and is rendered as Markdown. If that block is long or contains its own `##`/`###` headings, it becomes the first poster (“Overview”) instead.

## What stays inside one poster

- `###` and deeper headings stay in that poster’s prose (same display font family as the poster title, smaller size).
- Code fences are respected when detecting `##` / `---` (headings inside fenced blocks do not split).

## Stable styling per poster

- **Ground color** — Hash of poster slug (no dates).
- **Title font** — Cycles by poster index (neighbors differ).
- **Horizontal stagger** — Hash of slug + index (wide screens only).

Implementation: `lib/parse-document.js`. To change behavior (e.g. split on `###`), edit that module and document the change in `docs/DECISION_LOG.md`.
