import {RailEntry} from './components/Leaderboard';
import {COUNTDOWN} from './data';
import {sec} from './theme';

/**
 * Frames the dollar count takes to roll inside each RankReveal.
 * Colocated here so revealSeconds() (below) stays in sync with the audio-cue
 * timing that depends on when the count finishes.
 * (Formerly COUNT_DUR lived in RankReveal.tsx — moved here in fix/timing-colocation.)
 */
export const COUNT_DUR = 54; // 54 frames = 1.8 s at 30 fps

/** Seconds per reveal: 25 normally, 30 for ties, 35 for #1.
 *  The reveal must be long enough for the dollar count (COUNT_DUR frames) to finish
 *  before the hand-over animation begins, so keep COUNT_DUR in mind if you change these. */
export const revealSeconds = (names: string[], rank: number) => (rank === 1 ? 35 : names.length > 1 ? 30 : 25);

/** Every reveal in order, each carrying the rail entries locked in so far. */
export const timeline = (() => {
  let at = 0;
  const done: RailEntry[] = [];
  return COUNTDOWN.map((c) => {
    const dur = sec(revealSeconds(c.names, c.rank));
    const item = {...c, from: at, dur, railBefore: [...done]};
    done.push({label: c.label, names: c.names, lockAt: 0});
    at += dur;
    return item;
  });
})();

export const COUNTDOWN_TOTAL = timeline.reduce((a, t) => a + t.dur, 0);

/** Start frames on the master timeline (m:ss from the brief). */
export const START = {
  shot1: 0,
  shot2: sec(30),
  shot3: sec(33),
  /**
   * shot4 is the Countdown / RankReveal sequence (see Root.tsx → <Countdown>).
   * There is no Shot4.tsx — the composition is named "Countdown" internally but
   * registered as "Shot4-Countdown" in Root.tsx to keep the external IDs sequential.
   */
  shot4: sec(90),
  shot5: sec(335), // 5:35
  shot6: sec(465), // 7:45
};
