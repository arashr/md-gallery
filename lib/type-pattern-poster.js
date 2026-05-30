/**
 * Flat `theme.graphics.typePattern` → `renderTypePattern` options.
 * Random fields use `*Min` / `*Max` (or `patternTypes` + `gridStaggerProbability`).
 */

import { PATTERN_TYPES } from './type-pattern.js';

export const TYPE_PATTERN_DEFAULTS = {
  patternTypes: ['wave', 'grid', 'line'],
  fillSpace: false,
  opticalTight: true,
  followPath: true,
  flipReadable: true,
  flipAlternateVertical: true,
  flipAlternateHorizontal: true,
  repeatsMin: 18,
  repeatsMax: 38,
  paddingMin: 0,
  paddingMax: 0,
  tightTrackingMin: 0.92,
  tightTrackingMax: 0.98,
  lineAngleMin: -25,
  lineAngleMax: 25,
  startAngleDegMin: -180,
  startAngleDegMax: 180,
  arcSweepDegMin: 63,
  arcSweepDegMax: 360,
  spiralTurnsMin: 1,
  spiralTurnsMax: 4.5,
  waveAmplitudeMin: 0.16,
  waveAmplitudeMax: 0.34,
  waveCyclesMin: 2,
  waveCyclesMax: 6,
  gridColumnsMin: 3,
  gridColumnsMax: 7,
  gridStaggerProbability: 0.6,
  fillAngleMin: -18,
  fillAngleMax: 18,
  fillRowGapMin: 1.1,
  fillRowGapMax: 1.2,
  opacityMin: 1,
  opacityMax: 1,
  emptySpaceMinPx: 56,
  emptySpaceMinRatio: 0.1,
  regionInsetPx: 12,
  alignToCardEdge: false,
  regionPreference: ['bottom', 'between', 'top'],
  fallbackBandWidth: 88,
  fallbackSide: 'auto',
  edgeOverflowPx: 24,
  symbolPool: '+*-´`=/|',
  symbolProbability: 0.55,
  noneProbability: 0.18
};

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function clampInt(n, fallback) {
  const v = Number.parseInt(String(n), 10);
  return Number.isFinite(v) ? v : fallback;
}

function clampNum(n, fallback) {
  const v = Number.parseFloat(String(n));
  return Number.isFinite(v) ? v : fallback;
}

function hasFontSizeRange(cfg) {
  const lo = Number(cfg.fontSizeMin);
  const hi = Number(cfg.fontSizeMax);
  return Number.isFinite(lo) && Number.isFinite(hi);
}

/**
 * @param {Partial<typeof TYPE_PATTERN_DEFAULTS>} raw
 * @param {{
 *   rand: () => number;
 *   pick: <T>(arr: T[]) => T;
 *   int: (min: number, max: number) => number;
 *   float: (min: number, max: number) => number;
 *   letter: string;
 *   foregroundColor: string;
 *   fontFamily: string;
 *   fontWeight: string;
 *   width: number;
 *   height: number;
 * }} ctx
 */
export function buildPosterTypePatternOptions(raw, ctx) {
  const cfg = { ...TYPE_PATTERN_DEFAULTS, ...raw };
  const { rand, pick, int, float, letter, foregroundColor, fontFamily, fontWeight, width, height } =
    ctx;

  const types = (
    Array.isArray(cfg.patternTypes) && cfg.patternTypes.length
      ? cfg.patternTypes
      : TYPE_PATTERN_DEFAULTS.patternTypes
  ).filter((t) => PATTERN_TYPES.includes(t));

  const ri = (minKey, maxKey, fallbackMin, fallbackMax, integer = true) => {
    const lo = clampNum(cfg[minKey], fallbackMin);
    const hi = clampNum(cfg[maxKey], fallbackMax);
    const a = Math.min(lo, hi);
    const b = Math.max(lo, hi);
    return integer ? int(a, b) : float(a, b);
  };

  let fontSize = null;
  if (hasFontSizeRange(cfg)) {
    fontSize = ri('fontSizeMin', 'fontSizeMax', 12, 72, true);
  }

  const gridColsMin = clampInt(cfg.gridColumnsMin, 3);
  const gridColsMax = Math.max(gridColsMin, clampInt(cfg.gridColumnsMax, 7));
  const staggerProb = Math.min(1, Math.max(0, clampNum(cfg.gridStaggerProbability, 0.6)));

  return {
    letter,
    width,
    height,
    type: pick(types.length ? types : ['wave']),
    repeats: ri('repeatsMin', 'repeatsMax', 18, 38, true),
    fontSize,
    padding: ri('paddingMin', 'paddingMax', 0, 0, true),
    fillSpace: Boolean(cfg.fillSpace),
    opticalTight: cfg.opticalTight !== false,
    tightTracking: ri('tightTrackingMin', 'tightTrackingMax', 0.92, 0.98, false),
    spacing: null,
    followPath: cfg.followPath !== false,
    flipReadable: cfg.flipReadable !== false,
    flipAlternateVertical: Boolean(cfg.flipAlternateVertical),
    flipAlternateHorizontal: Boolean(cfg.flipAlternateHorizontal),
    lineAngle: ri('lineAngleMin', 'lineAngleMax', -25, 25, true),
    startAngle: degToRad(ri('startAngleDegMin', 'startAngleDegMax', -180, 180, true)),
    arcSweep: degToRad(ri('arcSweepDegMin', 'arcSweepDegMax', 63, 360, false)),
    spiralTurns: ri('spiralTurnsMin', 'spiralTurnsMax', 1, 4.5, false),
    waveAmplitude: ri('waveAmplitudeMin', 'waveAmplitudeMax', 0.16, 0.34, false),
    waveCycles: ri('waveCyclesMin', 'waveCyclesMax', 2, 6, true),
    gridColumns: int(gridColsMin, gridColsMax),
    gridStagger: rand() < staggerProb,
    fillAngle: ri('fillAngleMin', 'fillAngleMax', -18, 18, true),
    fillRowGap: ri('fillRowGapMin', 'fillRowGapMax', 1.1, 1.2, false),
    opacity: ri('opacityMin', 'opacityMax', 1, 1, false),
    backgroundColor: 'rgba(0,0,0,0)',
    foregroundColor,
    fontFamily,
    fontWeight
  };
}
