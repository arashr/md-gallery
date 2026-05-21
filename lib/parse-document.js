const H1 = /^#\s+(.+)$/;
const H2 = /^##\s+(.+)$/;
const H_ANY = /^(#{1,6})\s+(.+)$/;

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'section';
}

function parseYamlFrontmatter(text) {
  if (!text.startsWith('---\n')) return { meta: {}, body: text };
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return { meta: {}, body: text };
  const yaml = text.slice(4, end);
  const body = text.slice(end + 5);
  const meta = {};
  for (const line of yaml.split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) meta[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return { meta, body };
}

/** Track ``` fences so split markers inside code blocks are ignored. */
function lineFlags(lines) {
  const flags = [];
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line.trim())) inFence = !inFence;
    flags.push(inFence);
  }
  return flags;
}

function countSplitCandidates(lines, flags) {
  let h2 = 0;
  let hr = 0;
  for (let i = 0; i < lines.length; i++) {
    if (flags[i]) continue;
    if (H2.test(lines[i])) h2++;
    if (/^---\s*$/.test(lines[i].trim())) hr++;
  }
  return { h2, hr };
}

function splitByH2(lines, flags) {
  const blocks = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (flags[i]) {
      if (current) current.lines.push(line);
      continue;
    }
    const m = line.match(H2);
    if (m) {
      if (current) blocks.push(current);
      current = { title: m[1].trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

function splitByHr(lines, flags) {
  const chunks = [];
  let chunk = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!flags[i] && /^---\s*$/.test(line.trim()) && chunk.length) {
      chunks.push(chunk);
      chunk = [];
    } else {
      chunk.push(line);
    }
  }
  if (chunk.length) chunks.push(chunk);
  return chunks.map((chunkLines, idx) => {
    let title = `Section ${idx + 1}`;
    for (const l of chunkLines) {
      const h2 = l.match(H2);
      const h1 = l.match(H1);
      if (h2) {
        title = h2[1].trim();
        break;
      }
      if (h1) {
        title = h1[1].trim();
        break;
      }
    }
    return { title, lines: chunkLines };
  });
}

function extractMeta(lines, filename) {
  let title = filename.replace(/\.md$/i, '').replace(/[-_]/g, ' ');
  const introLines = [];
  let i = 0;

  if (lines[0]?.match(H1)) {
    title = lines[0].replace(/^#\s+/, '').trim();
    i = 1;
  }

  let splitAt = lines.length;
  const flags = lineFlags(lines);
  const { h2, hr } = countSplitCandidates(lines, flags);

  if (h2 > 0) {
    for (let j = i; j < lines.length; j++) {
      if (!flags[j] && H2.test(lines[j])) {
        splitAt = j;
        break;
      }
    }
  } else if (hr >= 2) {
    for (let j = i; j < lines.length; j++) {
      if (!flags[j] && /^---\s*$/.test(lines[j].trim())) {
        splitAt = j;
        break;
      }
    }
  }

  for (; i < splitAt; i++) {
    const line = lines[i];
    if (/^---\s*$/.test(line.trim())) continue;
    if (line.trim()) introLines.push(line);
    else if (introLines.length) introLines.push('');
  }

  return {
    title,
    introMarkdown: introLines.join('\n').trim(),
    bodyLines: lines.slice(splitAt),
    flags
  };
}

function uniqueSlug(base, used) {
  let slug = base || 'section';
  let n = 2;
  while (used.has(slug)) {
    slug = `${base}-${n}`;
    n++;
  }
  used.add(slug);
  return slug;
}

/** TOC: each poster (h2) plus h3–h6 inside poster bodies. IDs match render slug rules. */
export function buildToc(posters) {
  const used = new Set();
  const toc = [];
  for (const poster of posters) {
    toc.push({ depth: 2, text: poster.title, id: poster.slug });
    used.add(poster.slug);
    const lines = poster.bodyMarkdown.split(/\r?\n/);
    const flags = lineFlags(lines);
    for (let i = 0; i < lines.length; i++) {
      if (flags[i]) continue;
      const m = lines[i].match(H_ANY);
      if (!m || m[1].length < 3) continue;
      const text = m[2].trim();
      const id = uniqueSlug(slugify(text), used);
      toc.push({ depth: m[1].length, text, id });
    }
  }
  return toc;
}

export function parseDocument(rawText, filename = 'document.md') {
  const { meta, body } = parseYamlFrontmatter(rawText);
  const lines = body.split(/\r?\n/);
  const flags = lineFlags(lines);
  const { title, introMarkdown, bodyLines, flags: _ } = extractMeta(lines, filename);
  const bodyFlags = lineFlags(bodyLines);
  const { h2, hr } = countSplitCandidates(bodyLines, bodyFlags);

  let rawBlocks = [];
  if (h2 > 0) {
    rawBlocks = splitByH2(bodyLines, bodyFlags);
  } else if (hr >= 2) {
    rawBlocks = splitByHr(bodyLines, bodyFlags);
  } else {
    const sectionTitle =
      bodyLines.find((l, i) => !bodyFlags[i] && H1.test(l))?.replace(/^#\s+/, '').trim() ||
      title;
    rawBlocks = [{ title: sectionTitle, lines: bodyLines }];
  }

  if (rawBlocks.length === 0) {
    rawBlocks = [{ title, lines: bodyLines }];
  }

  const usedSlugs = new Set();
  const posters = rawBlocks.map((block, index) => {
    const slug = uniqueSlug(slugify(block.title), usedSlugs);
    const bodyMarkdown = block.lines.join('\n').trim();
    return {
      index,
      title: block.title,
      slug,
      bodyMarkdown,
      searchText: `${block.title} ${bodyMarkdown}`.toLowerCase()
    };
  });

  const toc = buildToc(posters);

  return {
    title: meta.title || title,
    introMarkdown,
    posters,
    toc,
    splitMode: h2 > 0 ? 'h2' : hr >= 2 ? 'hr' : 'single'
  };
}
