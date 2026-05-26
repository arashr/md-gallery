import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { setGalleryConfig } from '../lib/gallery-config.js';
import { auditDarkChrome, auditGroundForegrounds } from '../lib/apca-check.js';

describe('APCA contrast', () => {
  it('ground foreground pairs meet DESIGN.md Lc targets', () => {
    const cfg = JSON.parse(readFileSync('config/gallery.config.json', 'utf8'));
    setGalleryConfig(cfg);
    const failures = auditGroundForegrounds(cfg);
    assert.equal(
      failures.length,
      0,
      failures.map((f) => `${f.scope}.${f.role}: ${f.lc.toFixed(1)} Lc (need ${f.min})`).join('\n')
    );
  });

  it('dark chrome colors meet DESIGN.md Lc targets', () => {
    const cfg = JSON.parse(readFileSync('config/gallery.config.json', 'utf8'));
    setGalleryConfig(cfg);
    const failures = auditDarkChrome(cfg);
    assert.equal(
      failures.length,
      0,
      failures.map((f) => `${f.scope}.${f.role}: ${f.lc.toFixed(1)} Lc (need ${f.min})`).join('\n')
    );
  });
});
