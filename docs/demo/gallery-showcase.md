# MD Gallery — **showcase**

Drop your own `.md` anytime; this file is a **built-in tour** of poster grounds, display title fonts, prose, search, and the table of contents. Open **Contents** in the reader nav and try searching for `carmine`, `glyph`, or `Inconsolata`.

---

## Welcome

Each `##` heading becomes its own **poster card**: a ground color from `gallery.config.json`, a rotating **display title face** (Ultra, Rubik Dirt, BBH Bogle, Jersey 25, Black Ops One, Notable), and a decorative **glyph pattern** in the margins.

This intro stays in the **lilac hero** above the gallery. Everything below scrolls as posters.

---

## Typography on posters

Poster titles support *inline* **markdown** — the face still comes from the design system, not from raw asterisks in the UI.

Body copy uses **Inconsolata** (UI sans / mono). Serif prose uses **Libre Baskerville** where configured. Display lines stay on the poster palette: `display`, body, and muted tokens per ground.

### Heading inside a poster

Use the **Contents** drawer: this `h3` is a TOC entry. Jump between posters without losing your place.

#### Deeper heading

`h4` entries appear in the TOC too — handy for long reference posters.

---

## All nine grounds

Each poster slug hashes to one ground (you will see these colors rotate as you add sections):

| Ground | Role |
|--------|------|
| `pink` | Soft rose surface, indigo display |
| `white` | Neutral gray-violet paper |
| `lime` | Acid green field |
| `tangerine` | Warm yellow-orange |
| `lilac` | Cool violet (hero uses page paper, not a ground) |
| `forest` | Sage green |
| `butter` | Bright yellow |
| `mint` | Sea-glass teal |
| `carmine` | Deep red with light type |

Add or edit grounds in `config/gallery.config.json` — refocus the browser tab after saving to reload.

---

## Code, tables, and chips

Inline `code` uses a tinted chip on each ground. Fenced blocks get a copy button and poster-surface background:

```js
import { parseDocument } from './lib/parse-document.js';

const doc = parseDocument(markdown, 'notes.md');
console.log(doc.posters.length, 'posters');
```

| Feature | Try it |
|---------|--------|
| Search | `table` or `wave` |
| TOC | Open **Contents** |
| Zoom | Reader toolbar − / + |
| Theme | Toggle dark chrome |
| PDF | Export icon on each poster |

- [x] Task lists render when enabled in sanitize
- [ ] This box is unchecked

> Blockquotes use the same prose rhythm as body text — good for pull quotes on colored cards.

---

## Image on a poster

Posters can carry photographs and wide media. This one uses a **bundled JPEG** (works offline with `npm start`):

![Bright star with colorful nebula in dark space](/assets/demo/nebula-universtock.jpg)

Photo by [Universtock](https://unsplash.com/@universtock) on [Unsplash](https://unsplash.com/photos/bright-star-with-colorful-nebula-in-dark-space-bsEmH06Ko1w).

---

## Links and navigation

- [Back to landing](#) — use the browser back button or **Open file** after you opened this demo from the homepage.
- [Poster split rules](../POSTER_LOGIC.md) — how `##` and `---` splits work.
- External links ask before leaving your device.

If you opened this from the footer link, you are reading a **same-origin** bundled file — ideal for trying search and TOC without picking a file from disk.

---

## Short copy on a **roomy** card

Some posters are intentionally brief so the card keeps a **minimum B-series height** and the title sits high on the field. Glyph patterns fill the lower margin when there is room.

Search for **roomy** or **brief** — only this poster should match both words together if you add them here: `roomy brief`.

---

## Long title stress test — how display type scales down to fit the poster width without clipping

Title fitting uses `titleScale.tiers` in config. Long strings like this one shrink and wrap within the card instead of overflowing.

---

## Search playground

Hidden keywords for the reader search box (open search in the nav):

`glyph` `pattern` `wave` `grid` `fill` `Inconsolata` `Ultra` `export` `PDF` `stagger` `OKLCH`

Try partial matches, poster titles, and body text. Matching posters stay visible; others fade with `is-filtered-out`.

---

## Fin

You have seen **hero + intro**, **multiple grounds**, **nested TOC headings**, **code**, **tables**, **lists**, **blockquotes**, **images**, and **short vs long titles**.

Drop your own Markdown folder on the landing page for the **gallery picker**, or edit `config/gallery.config.json` and refocus the tab to tune colors, type patterns, and title scale.
