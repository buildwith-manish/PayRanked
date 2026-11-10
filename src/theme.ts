/**
 * Design tokens — colours, spacing, typography, helpers.
 *
 * Fonts: Clash Display (display/numbers) + Satoshi (body) via self-hosted
 * Fontshare woff2 files, loaded in src/fontshare/load-fonts.ts (imported by
 * Root.tsx). Poppins and Inter have been removed.
 */
import {PAYRANKED_FONTS} from './fontshare/load-fonts';
import {DESIGN_FPS} from './clock';

export {DESIGN_FPS, FPS} from './clock';

export const W = 1920;
export const H = 1080;
export const MARGIN = 96;

export const C = {
  navy1: '#143A66',
  navy2: '#0A1D38',
  navy3: '#050E1D',
  emerald: '#19C37D',
  mint: '#3DF0A8',
  red: '#FF5C5C',
  amber: '#FFB020',
  text: '#E8EEF7',
  muted: '#8DA2BB',
};

/** Font stacks for all components. Source of truth is PAYRANKED_FONTS in load-fonts.ts. */
export const F = {
  display: PAYRANKED_FONTS.display,  // 'Clash Display', Satoshi, sans-serif
  body:    PAYRANKED_FONTS.body,     // Satoshi, Plus Jakarta Sans, system-ui, sans-serif
};

export const tabular: React.CSSProperties = {fontVariantNumeric: 'tabular-nums'};

export const springIn = {damping: 15, stiffness: 150, mass: 1};

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

/** Seconds -> design frames (the 30 fps clock every timing is written in; see clock.ts). */
export const sec = (s: number) => Math.round(s * DESIGN_FPS);

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

const hexToRgb = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Blend two #rrggbb colours; t is clamped to 0-1. */
export const mix = (a: string, b: string, t: number) => {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * clamp(t))).join(',')})`;
};

export const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
