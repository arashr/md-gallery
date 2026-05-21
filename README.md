# MD Gallery

Browser-based Markdown reader with the Figlets editorial poster layout. Drop a `.md` file on the homepage; everything runs locally in your browser.

## Features

- **Poster gallery** — colored cards, staggered on wide screens, title display fonts
- **No date requirements** — split logic is structural (`##`, `---`, or single doc)
- **Instant search** — filters posters and highlights matches in body text
- **Table of contents** — poster titles + in-document headings; toggle via **Contents** in the nav
- **Privacy** — files are not uploaded; parsing happens with `FileReader`

## Quick start

```bash
npm install
npm start
```

Open http://localhost:3000 (or the port `serve` prints), drop a Markdown file.

## How posters are split

See [docs/POSTER_LOGIC.md](docs/POSTER_LOGIC.md). Agent context: [docs/PROJECT_MEMORY.md](docs/PROJECT_MEMORY.md), [docs/DECISION_LOG.md](docs/DECISION_LOG.md).

1. **`##` headings** (default) — each level-2 section is one poster  
2. **`---` rules** — if there are no `##` lines but multiple horizontal rules  
3. **Single poster** — whole file when neither applies  

## Stack

- [marked](https://marked.js.org/) — Markdown → HTML  
- [DOMPurify](https://github.com/cure53/DOMPurify) — sanitize user HTML  
- `assets/site.css` — shared visual system with [figlets-blog](https://github.com/) (copied; blog repo unchanged)

## Sister project

**figlets-blog** remains the static editorial site (collections, RSS, build pipeline). **MD Gallery** is a separate repo for client-side reading only.
