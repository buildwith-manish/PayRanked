/** Reads the voiceover layout (scripts/vo_layout.py) and the verified metro data, so every scene is timed by the voice. */
import layoutRaw from '../audio/vo-layout.json';
import metrosRaw from '../data/metros.json';
import {DESIGN_FPS} from '../clock';

export type Shot = {id: string; section: string; start: number; seconds: number; speechStart: number; speechEnd: number; text: string; words: [string, number][]};
export const SHOTS = layoutRaw.shots as unknown as Shot[];
export const SECTIONS = layoutRaw.sections as {id: string; start: number; seconds: number}[];
export const END_SCREEN_SECONDS = layoutRaw.endScreenSeconds;
export const d = (seconds: number) => Math.round(seconds * DESIGN_FPS);
export const TOTAL_DESIGN = d(layoutRaw.totalSeconds);
export const section = (id: string) => SECTIONS.find((s) => s.id === id)!;

export type Metro = (typeof metrosRaw.metros)[number];
export const METROS: Metro[] = metrosRaw.metros;
export const byRank = (r: number) => METROS.find((m) => m.rank === r)!;
export const shownName = (m: Metro) => (m.name === 'Washington' ? 'Washington, DC' : m.name);

/** Shots whose id starts with `prefix`, with start times in design frames relative to the first of them. */
export const group = (prefix: string) => {
  const list = SHOTS.filter((s) => s.id.startsWith(prefix));
  const t0 = list[0].start;
  const end = list[list.length - 1].start + list[list.length - 1].seconds;
  return {
    list,
    shots: list,
    rel: list.map((s) => d(s.start - t0)),
    speech: list.map((s) => d(s.speechStart - t0)),
    from: d(t0),
    frames: d(end - t0),
  };
};
export const cityPrefix = (rank: number) => `r${String(rank).padStart(2, '0')}_`;

export const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

export type Group = ReturnType<typeof group>;
const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');
/** A visual beat lands this long BEFORE the word it illustrates. */
export const AHEAD = 0.25;

/**
 * Scene-local design frame at which one of `words` is heard (first match at or after clip index `from`), minus AHEAD.
 * Uses the recognised word times (scripts/vo_words.py); if the recogniser missed the word, falls back to its character
 * position in the line, spread over the clip's speech. Returns `fallback` when the word is not in the lines at all.
 */
export const cue = (g: Group, words: string | string[], fallback: number, opts: {from?: number; ahead?: number} = {}): number => {
  const want = (Array.isArray(words) ? words : [words]).map(norm);
  const ahead = opts.ahead ?? AHEAD;
  for (let i = opts.from ?? 0; i < g.shots.length; i++) {
    const sh = g.shots[i];
    const hit = sh.words.find(([w]) => want.includes(norm(w)));
    if (hit) return d(sh.speechStart + hit[1] - ahead) - g.from;
    const text = sh.text.toLowerCase();
    for (const w of want) {
      const m = new RegExp(`\\b${w}\\b`).exec(text);
      if (m) return d(sh.speechStart + (m.index / text.length) * (sh.speechEnd - sh.speechStart) - ahead) - g.from;
    }
  }
  return fallback;
};
