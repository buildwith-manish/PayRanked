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
import {byName, gap, NO_WAGE_TAX, BOTTOM_FIVE} from '../data';
import {coinsFor} from '../components/CoinStack';
import {BREAK_BEATS} from '../components/Break';
import {NAME_STEP, TIE_STAMP_AFTER_NAME, timing} from '../components/RankReveal';
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
import {BUTTON, T as T6} from '../shots/Shot6';
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

const cue = (sfx: SfxName, at: number, gain = 1, hero = false): Cue => ({sfx, at: Math.round(at), gain, hero});

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
  k.push(cue('whoosh_xs', 3, 0.3));
  k.push(cue('seam', SEAM_START + 12, 0.5));
  k.push(cue('whoosh_m', SEAM_START + 13, 0.6));
  k.push(cue('hit_big', SHAPE_START, 0.8, true));
  k.push(cue('swish', SHAPE_START + 20, 0.45));

  // 1-4s: California's count rolls down and lands, the state sinks; coins pour in with it
  k.push(cue('sink_down', S1_COUNT_START + 18, 0.42));
  k.push(...ticks(S1_COUNT_START, S1_COUNT, 16, 0.42));
  k.push(...coinLandings(S1_COUNT_START, dollars(cal.display, S1_COUNT_START), 0.24));
  k.push(cue('hit_med', S1_COUNT_START + S1_COUNT, 0.85, true));

  // 2-6s: the claim, the one-line reason, then the turn
  k.push(cue('swish', HEAD_START, 0.35));
  k.push(cue('swish', EXPLAIN_START, 0.25));
  k.push(cue('swish', HEAD2_START, 0.4));
  k.push(cue('rise_up', HEAD2_START + 10, 0.3)); // "the opposite": the unseen state goes the other way

  // 6-10s: everything steps back, a riser builds under the drawn bracket, the gap slams in alone
  k.push(cue('out_m', REST_START + 2, 0.5));
  k.push(cue('riser', S1_SLAM, 0.8));
  k.push(cue('hit_big', S1_SLAM + STRIKE, 1, true));
  k.push(...ticks(S1_SLAM, 24, 8, 0.45));
  k.push(cue('ding_hi', S1_SLAM + 24, 0.4));
  k.push(cue('out_s', REST2_START + 2, 0.4));
  void BRACKET_START;

  // 10-15s: three chips, each a small glass tap; the last one (amber) gets a bell
  [0, 14, 28].forEach((d, i) => {
    const at = CHIPS_START + d;
    k.push(cue('whoosh_xs', at + 2, 0.25));
    k.push(cue(`chip_${i}` as SfxName, at + 5, 0.75));
  });
  k.push(cue('ding_hi', CHIPS_START + 28 + 8, 0.35));
  return k;
};

// =============================================================== Shot 3: method
export const shot3Cues = (): Cue[] => {
  const k: Cue[] = [];

  // gauge draws itself
  k.push(cue('whoosh_m', 30, 0.35));

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
    k.push(cue('swish', s + 8, 0.42));
    k.push(cue('out_xs', e - 2, 0.25));
  });
  k.push(cue('out_m', T3.formula - 24, 0.45)); // the gauge leaves

  // formula: every token lands on a rung of the ladder, so it plays as a phrase going up
  const tokens = 8;
  for (let i = 0; i < tokens; i++) {
    const d = T3.formula + i * 5;
    k.push(cue('whoosh_xs', d + 1, 0.22));
    k.push(cue(`blip_${i}` as SfxName, d + 5, 0.5));
  }
  k.push(cue('hit_small', T3.formula + 7 * 5 + 5, 0.6)); // the equals sign
  const resultDelay = T3.formula + tokens * 5 + 6;
  k.push(...ticks(resultDelay, 54, 16, 0.45));
  k.push(cue('hit_med', resultDelay + 54, 0.7, true));
  k.push(cue('ding', resultDelay + 54, 0.38));
  k.push(cue('swish_long', resultDelay + 44 + 8, 0.4));
  k.push(cue('out_m', T3.rail - 2, 0.4));

  // rail slides in: nine rows trail each other, so nine rising notes
  k.push(cue('whoosh_m', T3.rail + 14, 0.55));
  for (let i = 0; i < 9; i++) k.push(cue(`blip_${i}` as SfxName, T3.rail + stagger(i, 3, 24) + 8, 0.22));
  k.push(cue('swish_long', T3.rail + 25 + 10, 0.5));

  // build into the countdown: the riser ends on the end of the shot, the first reveal's hit follows it
  k.push(cue('riser', SHOT3_FRAMES, 0.75));
  return k;
};

// =============================================================== Shot 4: one reveal
export const revealCues = (names: string[], rankLabel: string): Cue[] => {
  const k: Cue[] = [];
  const lead = byName(names[0]);
  const tie = names.length > 1;
  const rank = parseInt(rankLabel.replace('#', ''), 10);
  const TR = timing(isFast(rank));
  const hasFact = !!(lead.fact && lead.factSource);
  const nameLen = names.join('  ·  ').length;
  const ruleAt = TR.name + Math.round(nameLen * NAME_STEP) + 4;

  // 0-1s: the rank slams (a strike), then the camera winds back and whips in
  k.push(cue('hit_big', TR.slam + STRIKE + 1, 1, true));
  k.push(cue('whoosh_l', TR.fly + 26, 0.75));
  k.push(cue('out_xs', sec(1.1) + 4, 0.3)); // the rail folds to a strip

  // the state lifts out of the map, the pin falls with one bounce and rings
  k.push(cue('hit_med', sec(1.5) + STRIKE + 1, 0.7));
  k.push(cue('pin_land', sec(2.4) + LAND, 0.6));
  k.push(cue('ping', sec(2.4) + LAND + 2, 0.32));

  // 3-6s: name rises letter by letter, the rule draws under it
  k.push(cue('swish_long', TR.name + 8, 0.55));
  k.push(cue('swish', ruleAt + 4, 0.35));
  if (tie) k.push(cue('stamp', TR.name + TIE_STAMP_AFTER_NAME + STRIKE, 0.9, true));

  // 6-10s: BEA chip flips in, gauge sweeps, formula line rises
  k.push(cue('chip_1', TR.bea + 4 + 5, 0.75));
  k.push(cue('gauge_sweep', TR.bea + 10 + 17, 0.35));
  k.push(cue('swish', TR.bea + 12 + 6, 0.4));
  k.push(cue('out_s', TR.dollars + 6, 0.5)); // BEA leaves as the dollars arrive

  // 10-15s: dollars roll on odometer wheels, coins pour in, the gain rises once they land
  k.push(...ticks(TR.dollars, REVEAL_COUNT, 16, 0.5));
  const coinsAt = (f: number) => ramp(f, TR.dollars, TR.dollars + 60, glide) * coinsFor(lead.dollars);
  k.push(...coinLandings(TR.dollars, coinsAt, 0.45));
  k.push(cue('hit_small', TR.dollars + REVEAL_COUNT, 0.6));
  k.push(cue('ding', TR.dollars + REVEAL_COUNT, 0.45));
  k.push(cue('swish', TR.dollars + REVEAL_COUNT - 4 + 8, 0.35));

  // 15-21s: the fact card slides in alone; dollars step back, coins sink
  if (hasFact) {
    k.push(cue('out_xs', TR.fact + 2, 0.35));
    k.push(cue('whoosh_s', TR.fact + 10, 0.5));
    k.push(cue('hit_small', TR.fact + 20, 0.4));
    k.push(cue('swish_long', TR.fact + 12 + 8, 0.42));
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
  k.push(cue('out_s', TR.mapOut + 6, 0.35));
  return k;
};

// =============================================================== Countdown breaks
export const breakCues = (kind: 'notHere' | 'prices'): Cue[] => {
  const k: Cue[] = [];
  k.push(cue('out_m', 2, 0.4)); // the last reveal's panel clears
  k.push(cue('whoosh_s', BREAK_BEATS.line1 + 6, 0.4));
  k.push(cue('swish_long', BREAK_BEATS.line1 + 14, 0.45));
  if (kind === 'notHere') {
    [0, 14].forEach((d, i) => {
      k.push(cue('whoosh_xs', BREAK_BEATS.chips + d + 2, 0.25));
      k.push(cue(`chip_${i}` as SfxName, BREAK_BEATS.chips + d + 5, 0.7));
    });
    k.push(cue('swish', sec(5.4) + 8, 0.3));
  } else {
    k.push(cue('hit_small', sec(2.4), 0.45));
    k.push(cue('swish', sec(4.6) + 8, 0.3));
  }
  return k;
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
  k.push(cue('whoosh_s', sec(3) + 10, 0.35)); // legend rises
  k.push(cue('swish', sec(1) + 8, 0.3));

  // 25-60s: map steps back, five rows slide in and count up. California is the focal row.
  k.push(cue('whoosh_m', T5.rows, 0.55));
  k.push(cue('swish_long', T5.rows - 2 + 10, 0.5));
  BOTTOM_FIVE.forEach((_, i) => {
    const d = T5.rows + stagger(i, 6);
    k.push(cue('whoosh_s', d + 8, 0.32));
    k.push(cue('hit_small', d + 16, 0.42));
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
  k.push(cue('swish', T5.bars + 30 + 10, 0.5));
  k.push(cue('riser_short', T5.bars + 40, 0.7));
  k.push(cue('hit_big', T5.bars + 40 + STRIKE, 1, true));
  k.push(...ticks(T5.bars + 40, 34, 10, 0.5));
  k.push(cue('ding_hi', T5.bars + 40 + 34, 0.45));
  k.push(cue('out_s', T5.bars + 44, 0.35));
  void ark;
  void cal;
  void g;

  // 85s: the interrupt. The frame inverts for 6 frames: a reverse swell pulls in, a glitch cracks, the hit lands.
  k.push(cue('reverse_swell', T5.interrupt, 0.5));
  k.push(cue('glitch', T5.interrupt, 0.55, true));
  k.push(cue('hit_big', T5.interrupt + 2, 0.8, true));
  k.push(cue('whoosh_m', T5.interrupt + 10, 0.6));

  // 88s: the nine no-wage-tax states light up west to east, one note each, climbing
  k.push(cue('out_m', T5.lights + 2, 0.4));
  for (let i = 0; i < NO_WAGE_TAX.length; i++) {
    k.push(cue(`blip_${i}` as SfxName, T5.lights + i * 4 + 3, 0.6));
    k.push(cue(`tick_${i % 3}` as SfxName, T5.lights + 30 + i * 8 + 4, 0.35)); // each name rising into view
  }
  // sonar rings on Washington
  [0, 1, 2, 3].forEach((n) => k.push(cue('ping_lo', T5.ring + n * 45, [0.5, 0.4, 0.3, 0.2][n])));

  // 31-44s: three cards, one at a time
  const cards = [
    {start: T5.card1, end: T5.card2 + sec(0.5), words: [8 + 8, 14 + 8]},
    {start: T5.card2, end: T5.card3 + sec(0.5), words: [8 + 8]},
    {start: T5.card3, end: -1, words: [8 + 8]},
  ];
  cards.forEach((c) => {
    k.push(cue('whoosh_s', c.start + 8, 0.5));
    k.push(cue('hit_small', c.start + 14, 0.4));
    c.words.forEach((w, i) => k.push(cue(i === 0 ? 'swish_long' : 'swish', c.start + w, 0.38)));
    if (c.end > 0) k.push(cue('out_s', c.end - 12 + 4, 0.35));
  });
  return k;
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
    k.push(cue('swish', d + 20 + 6, 0.3));
  });
  k.push(cue('rise_up', T6.pct + 20, 0.25)); // the huge ghosted 27% fades up behind the cards

  // cards leave, the next-video card whips in from the right
  k.push(cue('out_m', T6.next + 4, 0.5));
  k.push(cue('whoosh_l', T6.next + 8 + 15, 0.7));
  k.push(cue('hit_med', T6.next + 8 + 26, 0.7));

  // cursor glides to the button, bell draws, click, subscribed, bell rings
  k.push(cue('icon_draw', T6.cursor, 0.3));
  k.push(cue('whoosh_xs', T6.cursor + 12, 0.25));
  k.push(cue('click', T6.click, 0.6, true));
  k.push(cue('pop', T6.click + 4, 0.6));
  k.push(cue('ding', T6.click + 4, 0.4));
  k.push(cue('bell_ring', T6.click + 6, 0.5));
  void BUTTON;

  // end screen: two empty frames draw in
  k.push(cue('hit_med', T6.end + 5, 0.7, true));
  k.push(cue('whoosh_m', T6.end + 10, 0.4));
  k.push(cue('whoosh_s', T6.end + 10 + 4, 0.35));
  k.push(cue('chip_2', T6.end + 10 + 5, 0.5));
  k.push(cue('shimmer', T6.end + 40, 0.3));
  return k;
};

export const CUES = {
  shot1: shot1Cues(),
  shot3: shot3Cues(),
  shot5: shot5Cues(),
  shot6: shot6Cues(),
  reveals: timeline.map((t) => revealCues(t.names, t.label)),
  breaks: countdownBreaks.map((b) => breakCues(b.kind)),
};

/** Master-timeline frames of the big strikes: the music dips around these (see AUDIO.dip* and duck.ts). */
export const HERO_BEATS: number[] = (() => {
  const beats: number[] = [];
  const add = (offset: number, cues: Cue[]) => cues.filter((c) => c.hero && (c.sfx === 'hit_big' || c.sfx === 'glitch')).forEach((c) => beats.push(offset + c.at));
  add(START.shot1, CUES.shot1);
  add(START.shot5, CUES.shot5);
  timeline.forEach((t, i) => add(START.shot4 + t.from, CUES.reveals[i]));
  return beats.sort((a, b) => a - b);
})();
