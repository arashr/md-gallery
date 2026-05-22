# Gallery configuration

Edit **`gallery.config.json`** to change theme colors, poster ground colors, UI/body fonts, display title fonts, and title auto-scaling behavior.

The app loads this file on startup (`lib/gallery-config.js`). Changes take effect after a refresh.

| Section | What it controls |
|---------|------------------|
| `theme` | Paper, ink, accent red, `measure` (prose line length, e.g. `65ch`), `posterWidth` (card width, e.g. `42rem` — stable when changing UI fonts), `edgeStepMix` (each darken step mixes this much black into the surface; two steps → `--hair` / `--on-ground-edge`) |
| `grounds` | Poster background colors (`--ground-*`) |
| `fonts` | UI sans/serif, mono, and rotating `titleFaces` (Google Fonts family names) |
| `titleScale` | `minPx` / `maxPx`, `maxWidthRatio`, tall-title height cap, B-aspect + slack (short posters use B min-height; all titles sized by DOM fit in `lib/fit-poster-title.js`) |

Per-ground text colors (display red on mint, etc.) remain in `assets/site.css` under `.ground-*` rules.
