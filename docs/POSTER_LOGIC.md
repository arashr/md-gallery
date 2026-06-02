# How MD Gallery turns a file into posters

MD Gallery reads one Markdown file and shows it as a vertical gallery of posters.

Each poster is one section of the file. You control the posters with normal Markdown structure.

## Best format

Use this format for predictable results:

```md
# Document title

A short introduction.

## First poster

Write the first section here.

## Second poster

Write the second section here.
```

The `#` line becomes the document title.

Each `##` line becomes a poster title.

The text under each `##` becomes that poster body.

## Split rules

MD Gallery chooses one split method for the file.

1. `##` headings

   If the file has at least one `##` heading, each `##` starts a new poster.

2. `---` divider lines

   If the file has no `##` headings and has two or more `---` lines on their own line, each part between dividers becomes a poster.

3. One poster

   If the file has no `##` headings and no divider structure, the whole file becomes one poster.

## Document title

MD Gallery uses the first available title in this order:

1. A `title:` value at the top of the file, if present.
2. The first `#` heading.
3. The file name without `.md`.

Use one `#` heading near the top of the file for the clearest result.

## Introduction

Short text between the `#` title and the first poster stays above the gallery.

Use this area for a summary, date, author note, or short context.

If this area is long, MD Gallery turns it into an **Overview** poster so it is easier to read.

## Headings inside posters

Use `###` and deeper headings inside a poster.

These headings stay inside the current poster. They do not start a new poster.

They can appear in **Contents**, so readers can jump to them.

```md
## Project plan

### Goals

### Risks

### Next steps
```

## Markdown you can use

You can use common Markdown inside each poster:

- Paragraphs
- Bold and italic text
- Links
- Lists
- Task lists
- Tables
- Quotes
- Images
- Inline code
- Code blocks

Keep one topic per poster when possible. Long files are easier to scan when each poster has a clear purpose.

## Dividers

Use divider lines only when your file does not use `##` headings.

```md
# Workshop notes

Opening notes

---

Group activity

---

Closing notes
```

When using dividers, MD Gallery looks for the first `#` or `##` heading inside each part. If it does not find one, it names the poster **Section 1**, **Section 2**, and so on.

## Code examples

Headings or divider lines inside fenced code blocks do not split the file.

````md
```js
## This is code text
---
```
````

This keeps examples, templates, and snippets inside the poster where they belong.

## Practical tips

- Use `#` once for the document title.
- Use `##` for poster breaks.
- Use `###` for subtopics inside a poster.
- Keep poster titles short.
- Put long explanations in the body.
- Split very long tables into several posters.
- Add alt text to images.
- Use **Contents** for navigation.
- Use **Highlight** to mark words while reading.
- Export a poster when one section needs to be shared as a PDF.

## Quick checklist

Before opening a file, check that:

- The file ends in `.md`.
- The main title uses `#`.
- Poster sections use `##`.
- Subsections use `###` or deeper headings.
- Divider lines are only used when there are no `##` sections.
