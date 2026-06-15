import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { flattenCssImports, posterExportRasterScale, posterPdfFilename } from '../lib/poster-export.js';

describe('poster PDF export', () => {
  it('builds a safe download filename', () => {
    assert.equal(posterPdfFilename('Hello **World**'), 'Hello-World.pdf');
    assert.equal(posterPdfFilename(''), 'poster.pdf');
    assert.equal(posterPdfFilename('setup/guide'), 'setupguide.pdf');
  });

  it('flattens nested @import rules for export CSS bundles', async () => {
    const loaded = new Map([
      ['entry.css', "@import url('a.css');\n.entry { color: red; }"],
      ['a.css', "@import url('b.css');\n.a { margin: 0; }"],
      ['b.css', '.b { padding: 0; }']
    ]);
    const flat = await flattenCssImports(loaded.get('entry.css'), async (href) => {
      const key = href.replace(/^\.\//, '');
      return loaded.get(key) ?? '';
    });
    assert.match(flat, /\.b \{ padding: 0; \}/);
    assert.match(flat, /\.a \{ margin: 0; \}/);
    assert.match(flat, /\.entry \{ color: red; \}/);
    assert.doesNotMatch(flat, /@import/);
  });

  it('targets at least 3x supersampling for PDF raster', () => {
    assert.equal(posterExportRasterScale(1), 3);
    assert.equal(posterExportRasterScale(2), 3);
    assert.equal(posterExportRasterScale(3), 3);
    assert.equal(posterExportRasterScale(4), 4);
  });
});
