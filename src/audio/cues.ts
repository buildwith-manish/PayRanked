/**
 * Cue sheet: every sound in the video, and the frame it must land on.
 *
 * The frames are not typed in by hand. They are computed from the same constants and curves the visuals use
 * (`T` in each shot, the odometer's `roll` curve, the coin stagger, the slam curve's strike point), so if a beat moves
 * the sound moves with it.
 *
 * A cue says "this sound's main impact lands on frame `at`" (frames are local to the shot). `Sfx.tsx` then starts the
 * file early by its `peak` (see manifest.json), so whooshes start before the move and risers end on the hit.
 *
 * Layers in the mix, from the bottom: sub thump on every strike, the hit itself, coin foley on every coin landing,
 * ticks that follow the odometer's own speed, whooshes sized to each move, and one pitched ladder (the blips) wherever
 * things light up in sequence.
 */
import {byName, gap, nearTieOf, NO_WAGE_TAX, BOTTOM_FIVE} from '../data';
import {coinsFor} from '../components/CoinStack';
import {BREAK_BEATS} from '../components/Break';
import {NAME_STEP, TIE_STAMP_AFTER_NAME, timing, versusAt} from '../components/RankReveal';
import {breaks as countdownBreaks, COUNT_DUR as REVEAL_COUNT, isFast} from '../timeline';
import {
  BRACKET_START,
  CHIPS_START,
  COUNT_DUR as S1_COUNT,
  COUNT_START as S1_COUNT_START,
  EXPLAIN_START,
  HEAD2_START,
  HEAD_START,
  REST2_START,
  REST_START,
  SEAM_START,
  SHAPE_START,
  SLAM as S1_SLAM,
  valueAt as s1ValueAt,
} from '../shots/Shot1';
import {SHOT3_FRAMES, T as T3} from '../shots/Shot3';
import {T as T5} from '../shots/Shot5';
import {T as T55} from '../shots/Shot55'; // EXTEND-4
import {T as T6} from '../shots/Shot6';
import {glide, ramp, roll, stagger} from '../motion';
import {sec} from '../theme';
import {START, timeline} from '../timeline';
import manifest from './manifest.json';

export type SfxName = keyof typeof manifest;
export type Cue = {
  sfx: SfxName;
  /** frame (local to the shot) on which the sound's main impact lands */
  at: number;
  /** relative loudness of this cue, 0..1 */
  gain: number;
  /** a hero cue is never ducked by the voice-over and pulls the music down around it */
  hero?: boolean;
};

/**
 * Movement sounds (whooshes, swishes, "out"s) are the easiest thing to overuse: they sound the travel, not the arrival.
 * So they are kept for big camera and scene moves, sit lower in the mix than everything else, and every departure uses
 * the same darker, quieter `out_soft`. See `tidy` for how repeats are thinned and varied.
 */
const MOVE = /^(whoosh_|swish|out_)/;
const MOVE_TRIM = 0.7;

const cue = (sfx: SfxName, at: number, gain = 1, hero = false): Cue => {
  const name = (sfx.startsWith('out_') ? 'out_soft' : sfx) as SfxName;
  return {sfx: name, at: Math.round(at), gain: MOVE.test(name) ? gain * MOVE_TRIM : gain, hero};
};

/** A muted tactile tap, for a card settling or a label arriving, where a swish used to sit. Rotates through three pitches. */
let tapN = 0;
const tapCue = (at: number, gain = 0.2): Cue => cue(`tap_${tapN++ % 3}` as SfxName, at, gain);

const MOVE_RANK: Record<string, number> = {whoosh_xl: 6, whoosh_l: 5, whoosh_m: 4, whoosh_s: 3, out_soft: 2, swish_long: 2, swish: 1, whoosh_xs: 0};
/** At most one movement sound per this many frames (about 1.7 s); a layered partner inside LAYER frames counts as the same move. */
const MOVE_GAP = 50;
const LAYER = 4;

/**
 * Final pass on a shot's cues: (1) keep at most one movement sound every couple of seconds, the biggest one winning;
 * (2) rotate the kept whooshes through their three variants (different sweep, softer top end, panned left or right) so
 * the same file never plays twice in a row; (3) a few percent of level variation on movement sounds and taps.
 */
const tidy = (list: Cue[]): Cue[] => {
  const moves = list.filter((c) => MOVE.test(c.sfx)).sort((a, b) => (MOVE_RANK[b.sfx] ?? 0) - (MOVE_RANK[a.sfx] ?? 0) || a.at - b.at);
  const kept: Cue[] = [];
  for (const c of moves) {
    if (!kept.some((o) => Math.abs(o.at - c.at) > LAYER && Math.abs(o.at - c.at) < MOVE_GAP)) kept.push(c);
  }
  const out = list.filter((c) => !MOVE.test(c.sfx) || kept.includes(c));
  const seen: Record<string, number> = {};
  [...out]
    .sort((a, b) => a.at - b.at)
    .forEach((c, i) => {
      const base = c.sfx;
      if (base === 'whoosh_s' || base === 'whoosh_m' || base === 'whoosh_l') {
        const n = (seen[base] = (seen[base] ?? -1) + 1);
        c.sfx = (['', '_b', '_c'].map((x) => `${base}${x}`)[n % 3]) as SfxName;
      }
      if (MOVE.test(base) || base.startsWith('tap_')) c.gain = Math.min(1, c.gain * (0.92 + 0.16 * hash(i)));
    });
  return out;
};

/** Where a `slam` curve first reaches its target: a strike, so the sound belongs here and not at the start of the move. */
const STRIKE = 3;

/** Cheap deterministic variety, so the same coin never plays twice in a row and runs are repeatable. */
const hash = (i: number) => ((i * 37 + 11) % 13) / 13;

/**
 * Odometer ticks for a number that rolls with the `roll` curve over `dur` frames. Tick k is placed where the number
 * has covered k/n of its distance, so the ticks are dense while the wheels spin and spread out as they brake, exactly
 * like the digits on screen.
 */
const ticks = (start: number, dur: number, n: number, gain: number, shift = 0): Cue[] => {
  const out: Cue[] = [];
  const seen = new Set<number>();
  for (let k = 1; k <= n; k++) {
    // invert roll by bisection
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (roll(mid) < k / n) lo = mid;
      else hi = mid;
    }
    const fr = Math.round(start + ((lo + hi) / 2) * dur);
    if (seen.has(fr)) continue;
    seen.add(fr);
    const taper = 1 - 0.45 * (k / n); // quieter as it brakes
    out.push(cue(`tick_${(k + shift) % 3}` as SfxName, fr, gain * taper));
  }
  return out;
};

/**
 * One clink for every coin that lands. Mirrors CoinStack: coin i starts to fall at appearAt + 3i, lands 14 frames
 * later, and only exists while the running coin count is above i.
 */
const FALL = 22;
const LAND = Math.round(FALL * 0.62);
const coinLandings = (appearAt: number, countAt: (f: number) => number, gain: number, max = 14, scan = 120): Cue[] => {
  const out: Cue[] = [];
  for (let i = 0; i < max; i++) {
    let vis = -1;
    for (let f = appearAt; f <= appearAt + scan; f++) {
      if (countAt(f) - i > 0.02) {
        vis = f;
        break;
      }
    }
    if (vis < 0) continue;
    const at = Math.max(appearAt + i * 3 + LAND, vis);
    const g = gain * (0.62 + 0.38 * hash(i)) * (i === 0 ? 1.2 : 1);
    out.push(cue(`coin_${(i * 3 + 1) % 4}` as SfxName, at, Math.min(1, g)));
  }
  return out;
};

// =============================================================== Shot 1: cold open
export const shot1Cues = (): Cue[] => {
  const k: Cue[] = [];
  const cal = byName('California');
  const dollars = (target: number, startAt: number) => (f: number) => coinsFor(s1ValueAt(f, target, startAt));

  // 0-1s: a seam draws down the black frame, then California lands on it (the opening sting)
  k.push(cue('seam', SEAM_START + 12, 0.5));
  k.push(cue('whoosh_m', SEAM_START + 13, 0.6));
  k.push(cue('hit_big', SHAPE_START, 0.8, true));

  // 1-4s: California's count rolls down and lands, the state sinks; coins pour in with it
  k.push(cue('sink_down', S1_COUNT_START + 18, 0.42));
  k.push(...ticks(S1_COUNT_START, S1_COUNT, 16, 0.42));
  k.push(...coinLandings(S1_COUNT_START, dollars(cal.display, S1_COUNT_START), 0.24));
  k.push(cue('hit_med', S1_COUNT_START + S1_COUNT, 0.85, true));

  // 2-6s: the claim, the one-line reason, then the turn
  k.push(cue('swish', HEAD_START, 0.35));
  k.push(cue('rise_up', HEAD2_START + 10, 0.3)); // "the opposite": the unseen state goes the other way

  // 6-10s: everything steps back, a riser builds under the drawn bracket, the gap slams in alone
  k.push(cue('out_m', REST_START + 2, 0.5));
  k.push(cue('riser', S1_SLAM, 0.8));
  k.push(cue('hit_big', S1_SLAM + STRIKE, 1, true));
  k.push(...ticks(S1_SLAM, 24, 8, 0.45));
  k.push(cue('ding_hi', S1_SLAM + 24, 0.4));
  void BRACKET_START;

  // 10-15s: three chips, each a small glass tap; the last one (amber) gets a bell
  [0, 14, 28].forEach((d, i) => {
    const at = CHIPS_START + d;
    k.push(cue(`chip_${i}` as SfxName, at + 5, 0.75));
  });
  k.push(cue('ding_hi', CHIPS_START + 28 + 8, 0.35));
  return tidy(k);
};

// =============================================================== Shot 3: method
export const shot3Cues = (): Cue[] => {
  const k: Cue[] = [];

  // gauge draws itself
  k.push(cue('whoosh_m', T3.gaugeIn, 0.35));

  // needle: wind-up, whip, settle. The sweep peaks on the whip, a tap marks where it settles.
  [T3.avg, T3.toCal].forEach((at, i) => {
    k.push(cue('gauge_sweep', at + 17, 0.5));
    k.push(cue('hit_small', at + 30, i === 1 ? 0.5 : 0.4));
    k.push(cue('tick_0', at + 34, 0.3));
  });
  k.push(cue('sink_down', T3.toCal + 18, 0.3)); // the needle heads into the red

  // pop labels: rise from behind the line, leave behind it
  [
    [T3.avg + 14, T3.toCal + 6],
    [T3.toCal + 28, T3.formula - 2],
  ].forEach(([s, e]) => {
    k.push(tapCue(s + 8, 0.16)); // the label under the gauge arrives
    void e;
  });
  k.push(cue('out_m', T3.formula - 24, 0.45)); // the gauge leaves

  // formula: every token lands on a rung of the ladder, so it plays as a phrase going up
  const tokens = 8;
  for (let i = 0; i < tokens; i++) {
    const d = T3.formula + i * 5;
    k.push(cue(`blip_${i}` as SfxName, d + 5, 0.5));
  }
  k.push(cue('hit_small', T3.formula + 7 * 5 + 5, 0.6)); // the equals sign
  const resultDelay = T3.formula + tokens * 5 + 6;
  k.push(...ticks(resultDelay, 54, 16, 0.45));
  k.push(cue('hit_med', resultDelay + 54, 0.7, true));
  k.push(cue('ding', resultDelay + 54, 0.38));

  // EXTEND-1 (20-56 s): the formula steps out, then three beats carry the method: categories, housing, the honesty line
  k.push(cue('out_m', T3.categories - 8, 0.45)); // formula and footnote leave

  // what BEA measures: title, then six bars rise left to right and each lands on a rung of the ladder
  k.push(tapCue(T3.categories + 8, 0.18));
  for (let i = 0; i < 6; i++) {
    const d = T3.categories + 18 + i * 6;
    k.push(cue('hit_small', d + 9, i === 0 ? 0.42 : 0.26)); // housing, the big one, lands hardest
    k.push(cue(`blip_${i}` as SfxName, d + 12, 0.38));
  }
  k.push(cue('ding', T3.categories + 18 + 22, 0.3)); // housing bar settles
  k.push(cue('out_m', T3.housing - 14, 0.4));

  // concrete housing example: three bars grow and their values roll up
  k.push(tapCue(T3.housing + 8, 0.18));
  for (let i = 0; i < 3; i++) {
    const d = T3.housing + 18 + i * 8;
    k.push(cue('hit_small', d + 10, 0.36));
    k.push(...ticks(d + 4, 50, 8, 0.24, i));
    k.push(cue(i === 2 ? 'ding_hi' : 'ding', d + 54, i === 2 ? 0.34 : 0.26)); // each value lands
  }
  k.push(cue('sink_down', T3.housing + 18 + 16 + 20, 0.24)); // the California bar towers over the rest
  k.push(cue('out_m', T3.honesty - 14, 0.4));

  // the honesty line carries the section out
  k.push(cue('swish_long', T3.honesty + 6, 0.5)); // "Prices, not paychecks."
  k.push(cue('hit_small', T3.honesty + 24, 0.5)); // the punch on "paychecks"
  k.push(cue('ding', T3.honesty + 24 + 26, 0.28));
  k.push(cue('out_m', T3.rail - 2, 0.4));

  // rail slides in: nine rows trail each other, so nine rising notes
  k.push(cue('whoosh_m', T3.rail + 14, 0.55));
  for (let i = 0; i < 9; i++) k.push(cue(`blip_${i}` as SfxName, T3.rail + stagger(i, 3, 24) + 8, 0.22));
  k.push(tapCue(T3.rail + 25 + 10, 0.2)); // "Let's count down" is typed

  // build into the countdown: the riser ends on the end of the shot, the first reveal's hit follows it
  k.push(cue('riser', SHOT3_FRAMES, 0.75));
  return tidy(k);
};

// =============================================================== Shot 4: one reveal
export const revealCues = (names: string[], rankLabel: string, versus = false): Cue[] => {
  const k: Cue[] = [];
  const lead = byName(names[0]);
  const tie = names.length > 1;
  const rank = parseInt(rankLabel.replace('#', ''), 10);
  const nearTie = rank === 1 && !tie && !!nearTieOf(lead.name); // #1 is the top of a near-tie: stamp + margin line
  const TR = timing(isFast(rank));
  const isVersus = versus && !tie; // the versus reveal has no coins and no fact card (see RankReveal)
  const hasFact = !!(lead.fact && lead.factSource) && !isVersus;
  const nameLen = names.join('  ·  ').length;
  const ruleAt = TR.name + Math.round(nameLen * NAME_STEP) + 4;

  // 0-1s: the rank slams (a strike), then the camera winds back and whips in
  k.push(cue('hit_big', TR.slam + STRIKE + 1, 1, true));
  // the camera's speed comes from the `anticipate` curve over 2 s: a small pull-back (an inhale), a whip that peaks 17
  // frames in (it was 26, on the way down), then a smaller ring as it settles. Each sound sits on its own part of that.
  k.push(cue('whoosh_l', TR.fly + 17, 0.75)); // the whip, its peak on the camera's top speed
  k.push(cue('whoosh_m', TR.fly + 19, 0.3)); // air under the whip, so the zoom has weight and not only blur

  // the state lifts out of the map, the pin falls with one bounce and rings
  k.push(cue('hit_med', sec(1.5) + STRIKE + 1, 0.7));
  k.push(cue('pin_land', sec(2.4) + LAND, 0.6));
  k.push(cue('ping', sec(2.4) + LAND + 2, 0.32));

  // 3-6s: name rises letter by letter, the rule draws under it
  k.push(cue('swish_long', TR.name + 8, 0.55));
  if (tie || nearTie) k.push(cue('stamp', TR.name + TIE_STAMP_AFTER_NAME + STRIKE, 0.9, true));

  // 6-10s: BEA chip flips in, gauge sweeps, formula line rises
  k.push(cue('chip_1', TR.bea + 4 + 5, 0.75));
  k.push(cue('gauge_sweep', TR.bea + 10 + 17, 0.35));

  // 10-15s: dollars roll on odometer wheels, coins pour in, the gain rises once they land
  k.push(...ticks(TR.dollars, REVEAL_COUNT, 16, 0.5));
  const coinsAt = (f: number) => ramp(f, TR.dollars, TR.dollars + 60, glide) * coinsFor(lead.dollars);
  if (!isVersus) k.push(...coinLandings(TR.dollars, coinsAt, 0.45));
  k.push(cue('hit_small', TR.dollars + REVEAL_COUNT, 0.6));
  k.push(cue('ding', TR.dollars + REVEAL_COUNT, 0.45));
  if (nearTie) k.push(tapCue(TR.dollars + REVEAL_COUNT + 14 + 6, 0.18)); // the margin over #2 rises
  if (isVersus) {
    // the two bars grow, one after the other, and the second lands as the comparison closes
    const v = versusAt(TR);
    k.push(cue('hit_small', v + 22 + 34, 0.4));
  }

  // 15-21s: the fact card slides in alone; dollars step back, coins sink
  if (hasFact) {
    if (!isVersus) k.push(cue('sink_down', TR.fact + 4, 0.26)); // the coins sink as the dollars step back
    k.push(tapCue(TR.fact + 15, 0.4)); // the fact card settles
    k.push(cue('hit_small', TR.fact + 15, 0.2));
  }

  // 20-25s: the panel leaves, the rail opens and the new row locks in. Climbing a pentatonic ladder as ranks fall.
  k.push(cue('out_m', TR.panelOut + 10, 0.6));
  k.push(cue('whoosh_s', TR.railOpen + 10, 0.45));
  const RUNG: Record<number, number> = {10: 0, 9: 1, 8: 2, 7: 3, 6: 4, 5: 5, 3: 6, 2: 7, 1: 8};
  k.push(cue('lock', TR.lock + STRIKE, rank === 1 ? 0.5 : 0.9, true));
  k.push(cue(`blip_${RUNG[rank] ?? 0}` as SfxName, TR.lock + STRIKE, 0.5));
  if (rank === 1) {
    // number one gets the whole stack
    k.push(cue('hit_big', TR.lock + STRIKE, 0.7, true));
    k.push(cue('ding_hi', TR.lock + 8, 0.5));
    k.push(cue('shimmer', TR.lock + 30, 0.4));
  }
  return tidy(k);
};

// =============================================================== Countdown breaks
export const breakCues = (kind: 'notHere' | 'prices', dur: number): Cue[] => {
  const k: Cue[] = [];
  k.push(cue('swish_long', BREAK_BEATS.line1 + 14, 0.45));
  if (kind === 'notHere') {
    [0, 14].forEach((d, i) => {
      k.push(cue(`chip_${i}` as SfxName, BREAK_BEATS.chips + d + 5, 0.7));
    });
  } else {
    k.push(cue('hit_small', sec(2.4), 0.45));
  }
  k.push(cue('out_m', dur - 10 + 2, 0.4)); // the break's text fades out into the next reveal
  return tidy(k);
};

// =============================================================== Shot 5: reality check
export const shot5Cues = (): Cue[] => {
  const k: Cue[] = [];
  const ark = byName('Arkansas');
  const cal = byName('California');
  const g = gap('Arkansas', 'California');

  // 0-7s: the colour wave spreads from Arkansas outward, the legend rises, one salary line
  k.push(cue('whoosh_l', 24, 0.45));
  k.push(cue('wave_swell', 60, 0.35));
  k.push(tapCue(sec(1) + 8, 0.16)); // the income line rises

  // 25-60s: map steps back, five rows slide in and count up. California is the focal row.
  k.push(cue('whoosh_m', T5.rows, 0.55));
  BOTTOM_FIVE.forEach((_, i) => {
    const d = T5.rows + stagger(i, 6);
    k.push(cue('hit_small', d + 16, 0.32));
    k.push(...ticks(d + 10, 50, 9, i === 0 ? 0.3 : 0.2, i));
    k.push(cue(i === 0 ? 'ding' : 'tick_0', d + 60, i === 0 ? 0.35 : 0.3));
  });
  k.push(cue('out_m', T5.bars - 2, 0.4));

  // 60-85s: two bars rise on a snap curve, the bracket draws, a riser builds, +27% slams in alone
  [T5.bars + 6, T5.bars + 12].forEach((d, i) => {
    k.push(cue('rise_up', d + 8, i === 0 ? 0.4 : 0.25));
    k.push(cue('hit_med', d + 10, i === 0 ? 0.6 : 0.45));
    k.push(...ticks(d + 8, 50, 12, 0.34, i));
    k.push(cue('ding', d + 58, 0.35));
  });
  k.push(cue('riser_short', T5.bars + 40, 0.7));
  k.push(cue('hit_big', T5.bars + 40 + STRIKE, 1, true));
  k.push(...ticks(T5.bars + 40, 34, 10, 0.5));
  k.push(cue('ding_hi', T5.bars + 40 + 34, 0.45));
  void ark;
  void cal;
  void g;

  // 85s: the interrupt. The frame inverts for 6 frames: a reverse swell pulls in, a glitch cracks, the hit lands.
  k.push(cue('reverse_swell', T5.interrupt, 0.5));
  k.push(cue('glitch', T5.interrupt, 0.55, true));
  k.push(cue('hit_big', T5.interrupt + 2, 0.8, true));
  k.push(cue('whoosh_m', T5.interrupt + 10, 0.6));

  // 88s: the nine no-wage-tax states light up west to east, one note each, climbing
  for (let i = 0; i < NO_WAGE_TAX.length; i++) {
    k.push(cue(`blip_${i}` as SfxName, T5.lights + i * 4 + 3, 0.6));
    k.push(cue(`tick_${i % 3}` as SfxName, T5.lights + 30 + i * 8 + 4, 0.35)); // each name rising into view
  }
  // sonar rings on Washington
  [0, 1, 2, 3].forEach((n) => k.push(cue('ping_lo', T5.ring + n * 45, [0.5, 0.4, 0.3, 0.2][n])));

  // 31-100s: seven cards, one at a time (EXTEND-3 added cards 4-7; they used to be silent)
  const cards: {start: number; end: number; words: number[]}[] = [
    {start: T5.card1, end: T5.card2 + sec(0.5), words: [8 + 8, 14 + 8]},
    {start: T5.card2, end: T5.card3 + sec(0.5), words: [8 + 8]},
    {start: T5.card3, end: T5.card4 + sec(0.5), words: [8 + 8]},
    {start: T5.card4, end: T5.card5 + sec(0.5), words: []}, // two count-ups instead of a text line (see below)
    {start: T5.card5, end: T5.card6 + sec(0.5), words: [8 + 8]}, // "No wage tax" rises, the 1.7% rolls up beside it
    {start: T5.card6, end: T5.card7 + sec(0.5), words: [8 + 8]},
    {start: T5.card7, end: -1, words: [8 + 8]}, // the last card stays to the end of the shot
  ];
  cards.forEach((c) => {
    k.push(tapCue(c.start + 14, 0.34)); // the card settles
    k.push(cue('hit_small', c.start + 14, 0.22));
  });

  // card 4: rent comparison. Both numbers roll up on odometer wheels and land one after the other.
  k.push(...ticks(T5.card4 + 8, 40, 8, 0.28));
  k.push(...ticks(T5.card4 + 14, 40, 8, 0.22, 1));
  k.push(cue('sink_down', T5.card4 + 8 + 40, 0.26)); // $3,500 lands: the red one
  k.push(cue('ding', T5.card4 + 14 + 40, 0.3)); // $800 lands: the cheap one

  // card 5: Texas has no wage tax, and a 1.7% property tax rolls in beside it
  k.push(...ticks(T5.card5 + 14, 30, 6, 0.28));
  k.push(cue('hit_small', T5.card5 + 14 + 30, 0.36)); // the 1.7% lands

  // card 6: specialists. The negative number sinks; the source line fades in a beat later
  k.push(cue('sink_down', T5.card6 + 16, 0.28));

  // card 7: the thesis line gets a proper finish, since it is the end of the section
  k.push(cue('hit_med', T5.card7 + 14, 0.6, true)); // "Cheap ≠ better."
  k.push(cue('ding', T5.card7 + sec(2.4) + 10, 0.32));
  k.push(cue('shimmer', T5.card7 + sec(2.4) + 20, 0.28));
  return tidy(k);
};

// =============================================================== Shot 6: outro
export const shot6Cues = (): Cue[] => {
  const k: Cue[] = [];

  // three recap cards flip in on the anticipate curve: whip on the way in, a tap when each settles
  [0, 1, 2].forEach((i) => {
    const d = T6.cards + stagger(i, 10);
    k.push(cue('whoosh_m', d + 15, 0.55));
    k.push(cue('hit_small', d + 24, 0.6));
    k.push(cue('icon_draw', d + 16 + 6, 0.3));
  });
  k.push(cue('rise_up', T6.pct + 20, 0.25)); // the huge ghosted 27% fades up behind the cards
  return tidy(k);
};

/** EXTEND-4: Shot 5.5 Practical Takeaways cues.
 *  A hero hit on the hook slam and on the formula reveal. Each profile card gets a whoosh on the way in, a tap when it
 *  settles, a swish for its headline and body, and an exit as the next card takes over. The formula plays as a phrase
 *  (one blip per piece, like Shot 3's formula) and the tease gets a riser and a soft bell. */
export const shot55Cues = (): Cue[] => {
  const k: Cue[] = [];
  // hook slam — hero hit; the words rise, then leave behind the line before the first card
  k.push(cue('hit_big', T55.hook + 4, 0.9, true));
  k.push(cue('whoosh_xl', T55.hook, 0.5));

  // profile cards — whoosh on entrance, chip on body landing, headline + body rise, exit as the next one arrives
  const profiles: {start: number; end: number; chip: SfxName}[] = [
    {start: T55.profile1, end: T55.profile2, chip: 'chip_0'},
    {start: T55.profile2, end: T55.profile3, chip: 'chip_1'},
    {start: T55.profile3, end: T55.formula, chip: 'chip_2'},
  ];
  profiles.forEach((p) => {
    k.push(cue('whoosh_m', p.start, 0.45)); // the flip: one move, not a whoosh plus a swish plus an exit
    k.push(cue(p.chip, p.start + 14, 0.5));
    k.push(tapCue(p.start + 26, 0.34)); // the card settles flat
  });

  // formula reveal — hero hit on the $100K count-up start, then each piece lands on a rung of the ladder
  k.push(cue('hit_med', T55.formula + 6, 0.7, true));
  k.push(cue('riser_short', T55.formula, 0.4));
  // ticks for the count-up (40-frame count, ~5 ticks) — explicit SFX names so TypeScript keeps the literal-type check
  const tickSfx: SfxName[] = ['tick_0', 'tick_1', 'tick_2', 'tick_0', 'tick_1'];
  for (let i = 0; i < tickSfx.length; i++) {
    k.push(cue(tickSfx[i], T55.formula + 8 + i * 8, 0.4));
  }
  k.push(cue('blip_1', T55.formula + 14, 0.4)); // ÷
  k.push(cue('blip_2', T55.formula + 20, 0.42)); // (RPP ÷ 100)
  k.push(cue('blip_3', T55.formula + 26, 0.44)); // =
  k.push(cue('blip_5', T55.formula + 33, 0.5)); // "your real buying power" (the amber payoff)
  k.push(cue('ding', T55.formula + 36, 0.34));
  // tease — riser + soft bell; "Cities next." and the question under it rise on their own beats
  k.push(cue('riser', T55.tease, 0.4));
  k.push(cue('bell_ring', T55.tease + 8, 0.5));
  k.push(cue('hit_small', T55.tease + 12, 0.38));
  k.push(cue('shimmer', T55.tease + 18, 0.3));
  return tidy(k);
};

export const CUES = {
  shot1: shot1Cues(),
  shot3: shot3Cues(),
  shot5: shot5Cues(),
  shot55: shot55Cues(), // EXTEND-4
  shot6: shot6Cues(),
  reveals: timeline.map((t) => revealCues(t.names, t.label, t.versus)),
  breaks: countdownBreaks.map((b) => breakCues(b.kind, b.dur)),
};

/** Master-timeline frames of the big strikes: the music dips around these (see AUDIO.dip* and duck.ts). */
export const HERO_BEATS: number[] = (() => {
  const beats: number[] = [];
  const add = (offset: number, cues: Cue[]) => cues.filter((c) => c.hero && (c.sfx === 'hit_big' || c.sfx === 'glitch')).forEach((c) => beats.push(offset + c.at));
  add(START.shot1, CUES.shot1);
  add(START.shot5, CUES.shot5);
  add(START.shot55, CUES.shot55); // EXTEND-4
  timeline.forEach((t, i) => add(START.shot4 + t.from, CUES.reveals[i]));
  return beats.sort((a, b) => a - b);
})();
