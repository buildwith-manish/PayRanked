import type {RailEntry} from './components/Leaderboard';
import {COUNTDOWN} from './data';
import {sec} from './theme';

/**
 * Frames the dollar count takes to roll inside each RankReveal.
 * Colocated here so revealSeconds() (below) stays in sync with the audio-cue
 * timing that depends on when the count finishes.
 * (Formerly COUNT_DUR lived in RankReveal.tsx — moved here in fix/timing-colocation.)
 */
export const COUNT_DUR = 54; // 54 design frames = 1.8 s (all timings are on the 30 fps design clock, see clock.ts)

/** Shortest reveal, in seconds (a normal single-state reveal). Ties and #1 add to it.
 *  RankReveal.tsx checks its beats (the dollar count at COUNT_DUR, the hand-over at T.panelOut/T.mapOut) against this
 *  at load time, so the beats cannot outgrow the reveal without the build failing. */
export const MIN_REVEAL_SECONDS = 25;

/** Seconds per reveal: 15 for #10 to #6 (T_FAST in RankReveal), then 25 normally, 30 for ties, 35 for #1. */
export const FAST_FROM_RANK = 6; // #10 .. #6 use the 15 s beats
export const FAST_REVEAL_SECONDS = 15;
export const isFast = (rank: number) => rank >= FAST_FROM_RANK;
export const revealSeconds = (names: string[], rank: number) =>
  isFast(rank) ? FAST_REVEAL_SECONDS : MIN_REVEAL_SECONDS + (rank === 1 ? 10 : names.length > 1 ? 5 : 0);

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
    const item = {...c, from: at, dur, fast: isFast(c.rank), railBefore: [...done]};
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

/** Length of each shot in seconds. The shot files turn these into frames; the master schedule below is built from them. */
export const SHOT_SECONDS = {
  shot1: 15, // cold open: the question, without the answer (was 30)
  shot2: 2.6,
  shot3: 20, // method (was 42)
  shot5: 44, // after #1 (was 130)
  shot6: 20, // outro (was 75)
};

/** Start frames on the master timeline. Each shot starts where the one before it ends, so no gap can open up again. */
const shot2 = sec(SHOT_SECONDS.shot1);
const shot3 = shot2 + sec(3); // the intro keeps its 0.4 s of air
const shot4 = shot3 + sec(SHOT_SECONDS.shot3);
const shot5 = shot4 + COUNTDOWN_TOTAL;
const shot6 = shot5 + sec(SHOT_SECONDS.shot5);
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
  shot6,
};

/** Total length of Video1, in design frames. */
export const VIDEO_FRAMES = shot6 + sec(SHOT_SECONDS.shot6);
