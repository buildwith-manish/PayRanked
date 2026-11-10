import type {RailEntry} from './components/Leaderboard';
import {byName, COUNTDOWN} from './data';
import {sec} from './theme';

/**
 * Frames the dollar count takes to roll inside each RankReveal.
 * Colocated here so revealSeconds() (below) stays in sync with the audio-cue
 * timing that depends on when the count finishes.
 * (Formerly COUNT_DUR lived in RankReveal.tsx — moved here in fix/timing-colocation.)
 */
export const COUNT_DUR = 54; // 54 design frames = 1.8 s (all timings are on the 30 fps design clock, see clock.ts)

/** Shortest reveal, in seconds (a normal single-state reveal). Ties add to it. #1 does not: its lead over #2 is inside the data's margin.
 *  RankReveal.tsx checks its beats (the dollar count at COUNT_DUR, the hand-over at T.panelOut/T.mapOut) against this
 *  at load time, so the beats cannot outgrow the reveal without the build failing. */
export const MIN_REVEAL_SECONDS = 25;

/** Seconds per reveal: 15 for #10 to #6 (T_FAST in RankReveal), then 25 normally and 30 for ties. #1 is a normal 25 s reveal. */
export const FAST_FROM_RANK = 6; // #10 .. #6 use the 15 s beats
export const FAST_REVEAL_SECONDS = 15;
export const isFast = (rank: number) => rank >= FAST_FROM_RANK;

/**
 * The one fast reveal that breaks the "3D map left, text panel right" template: #8 swaps the coin stack and fact card for a
 * side-by-side against California, built from the same BEA index as the ranking (so it adds no new claim to verify).
 * It sits in the middle of #10 to #6 so no two neighbouring reveals look alike for more than a beat or two.
 */
export const VERSUS_RANK = 8;
export const hasVersus = (rank: number) => rank === VERSUS_RANK;

/** The 15 s reveals give a fact about 3.8 s on screen with no source line (see RankReveal). Past this many words it cannot be read. */
export const FAST_FACT_MAX_WORDS = 12;
export const revealSeconds = (names: string[], rank: number) =>
  isFast(rank) ? FAST_REVEAL_SECONDS : MIN_REVEAL_SECONDS + (names.length > 1 ? 5 : 0);

/**
 * Pattern breaks inside the countdown, so no stretch runs longer than about a minute without a change of picture.
 *  - after #7: "Not on this list" (the Texas / Florida curiosity gap from the hook, paid off on the way down)
 *  - after #3: "Prices, not pay" (the cheap-is-not-a-salary turn, moved up from the old reality check so the
 *    tension lasts until #1 instead of being spent after it)
 * Neither names the winner.
 */
export type BreakKind = 'notHere' | 'prices';
export const BREAKS: {afterRank: number; kind: BreakKind; seconds: number}[] = [
  {afterRank: 7, kind: 'notHere', seconds: 7.5}, // 3 bars of the 96 BPM bed
  {afterRank: 3, kind: 'prices', seconds: 10}, // 4 bars
];

/** Every reveal in order, each carrying the rail entries locked in so far, and every break between them. */
export const { timeline, breaks, COUNTDOWN_TOTAL } = (() => {
  let at = 0;
  const done: RailEntry[] = [];
  const brk: {kind: BreakKind; from: number; dur: number; rail: RailEntry[]}[] = [];
  const tl = COUNTDOWN.map((c) => {
    const dur = sec(revealSeconds(c.names, c.rank));
    const item = {...c, from: at, dur, fast: isFast(c.rank), versus: hasVersus(c.rank), railBefore: [...done]};
    done.push({label: c.label, names: c.names, lockAt: 0});
    at += dur;
    BREAKS.filter((b) => b.afterRank === c.rank).forEach((b) => {
      const bd = sec(b.seconds);
      // lockAt well in the past: the rows are already in place, so they do not land again
      brk.push({kind: b.kind, from: at, dur: bd, rail: done.map((d) => ({...d, lockAt: -300}))});
      at += bd;
    });
    return item;
  });
  return {timeline: tl, breaks: brk, COUNTDOWN_TOTAL: at};
})();

// A fact that is too long for a fast reveal is a warning, not a build failure: the facts are data, and a long one still renders.
for (const t of timeline) {
  if (!t.fast || t.versus) continue;
  for (const n of t.names) {
    const fact = byName(n).fact;
    if (fact && fact.split(/\s+/).length > FAST_FACT_MAX_WORDS) {
      console.warn(`[timeline] ${t.label} ${n}: fact is ${fact.split(/\s+/).length} words; fast reveals (#10 to #6) read best at ${FAST_FACT_MAX_WORDS} or fewer.`);
    }
  }
}

/** Length of each shot in seconds. The shot files turn these into frames; the master schedule below is built from them. */
export const SHOT_SECONDS = {
  shot1: 15, // cold open: the question, without the answer (was 30)
  shot2: 4.0, // the intro clip (extended from 3.0 s: +0.5 s hold + fade-in) (v9) is 3.0 s; was 2.6 s plus 0.4 s of air
  shot3: 60, // method (EXTEND-1: restored from 20 s to 60 s; was 42 s originally)
  shot5: 100, // EXTEND-3: restored from 44 s to 100 s; was 130 s originally
  shot55: 110, // EXTEND-4: practical takeaways (was 80 s; extended to 110 s so the body text has 25 s per profile, hits the 8:30 target)
  shot6: 12, // outro: the recap cards, then a 1 s fade to black. No next-video card, subscribe ask or end screen (there is no next video yet)
};

/** Start frames on the master timeline. Each shot starts where the one before it ends, so no gap can open up again. */
const shot2 = sec(SHOT_SECONDS.shot1);
const shot3 = shot2 + sec(SHOT_SECONDS.shot2); // the intro now fills its whole 3 s (same start for Shot 3 as before)
const shot4 = shot3 + sec(SHOT_SECONDS.shot3);
const shot5 = shot4 + COUNTDOWN_TOTAL;
const shot55 = shot5 + sec(SHOT_SECONDS.shot5); // EXTEND-4: practical takeaways sit between Shot 5 and Shot 6
const shot6 = shot55 + sec(SHOT_SECONDS.shot55);
export const START = {
  shot1: 0,
  shot2,
  shot3,
  /**
   * shot4 is the Countdown / RankReveal sequence (see Root.tsx → <Countdown>).
   * There is no Shot4.tsx — the composition is named "Countdown" internally but
   * registered as "Shot4-Countdown" in Root.tsx to keep the external IDs sequential.
   */
  shot4,
  shot5,
  shot55, // EXTEND-4
  shot6,
};

/** Total length of Video1, in design frames. */
export const VIDEO_FRAMES = shot6 + sec(SHOT_SECONDS.shot6);
