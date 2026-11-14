/**
 * Video 2 sound design: one cue list on the master timeline (design frames), built from the SAME beat times the scenes use
 * (beats.ts), so every sound lands on the frame of the thing it belongs to.
 *
 * Language of the mix (so it does not turn into a sound-effects reel):
 *   hit_big (hero)   only the reveals: the gap, #1, the twist
 *   hit_med          every rank slam
 *   whoosh_m         every scene change (the whip); replaced by riser + hit at the two big reveals
 *   chip / pop       a bar or pill appearing; soft
 *   tick             a number counting; very soft
 *   blip_0..8        the NEXT teaser, pitched up one step per city, so the countdown builds
 * The voice is on almost all the time, so everything except the hero cues is quiet and is ducked under it (duck.ts).
 */
import {Cue, SfxName} from '../audio/cues';
import {breakBeats, cityBeats, coldBeats, methodBeats, twistBeats} from './beats';
import {END_SCREEN_SECONDS, d, group} from './layout';

const cues: Cue[] = [];
const add = (sfx: SfxName, at: number, gain = 0.5, hero = false) => cues.push({sfx, at, gain, hero});
/** A counter: a few soft ticks while a number rolls (CountMoney lasts 30 design frames). */
const ticks = (start: number, n = 5, step = 5, gain = 0.3) => {
  for (let i = 0; i < n; i++) add((`tick_${i % 3}`) as SfxName, start + 4 + i * step, gain);
};
const whoosh = (t: number) => add('whoosh_m', t, 0.45);

/* ---- cold open */
{
  const b = coldBeats();
  const o = b.g.from;
  add('coin_0', o + 4, 0.35);
  add('coin_1', o + 10, 0.35);
  add('sink_down', o + b.tOther, 0.45);
  ticks(o + b.tFirst);
  ticks(o + b.tOnly);
  add('hit_big', o + b.tGap + 2, 1, true);
  add('pop', o + b.tWinner, 0.4);
  add('glitch', o + b.tStops, 0.45);
  add('hit_small', o + b.tStops + 2, 0.5);
  add('swish_long', o + b.tTitle, 0.4);
}

/* ---- method */
{
  const b = methodBeats();
  const o = b.g.from;
  whoosh(o + 6);
  add('gauge_sweep', o + b.tDial + 22, 0.5);
  add('pop', o + b.tAbove, 0.4);
  add('swish', o + b.tEq, 0.4);
  add('chip_0', o + b.tRent, 0.5);
  add('chip_1', o + b.tGoods, 0.5);
  add('chip_2', o + b.tServ, 0.5);
  add('click', o + b.tSources, 0.4);
  add('click', o + b.tSources + 3, 0.35);
}

/* ---- the countdown */
for (let rank = 10; rank >= 1; rank--) {
  const b = cityBeats(rank);
  const o = b.g.from;
  if (rank === 1) {
    // arrives with the flash: the riser that started under #2 lands here
    add('hit_big', o + 2, 1, true);
    add('shimmer', o + 4, 0.5);
  } else {
    whoosh(o + 6);
    add('hit_med', o + 8, 0.8);
  }
  add('coin_' + ((rank % 4) as 0 | 1 | 2 | 3) as SfxName, o + b.tPower, 0.45);
  ticks(o + b.tPower);
  add('gauge_sweep', o + b.tDial + 22, 0.45);
  add('chip_0', o + b.tRentBar, 0.45);
  add('chip_1', o + b.tGoodsBar, 0.45);
  add('chip_2', o + b.tServBar, 0.45);
  add('pop', o + b.tRent, 0.4);
  if (b.tRemember >= 0) add('ding_hi', o + b.tRemember, 0.5);
  if (b.tWin >= 0) add('ding', o + b.tWin, 0.6);
  // the teaser steps up one blip per city: #10 -> blip_0 ... #2 -> blip_8
  if (rank > 1) add(('blip_' + (10 - rank)) as SfxName, o + b.tNext, 0.4);
  // the build under the last 1 s of #2 climaxes on the reveal
  if (rank === 2) add('riser_short', o + b.g.frames, 0.4);
}

/* ---- rent vs paycheck */
{
  const b = breakBeats();
  const o = b.g.from;
  whoosh(o + 6);
  add('chip_0', o + b.tMiami, 0.5);
  for (let i = 1; i < 10; i++) add((`tick_${i % 3}`) as SfxName, o + b.tLA + (i - 1) * 8 + 4, 0.35);
  add('pop', o + b.tNote, 0.35);
  add('riser_short', o + b.g.frames, 0.4); // into the twist
}

/* ---- the twist */
{
  const b = twistBeats();
  const o = b.g.from;
  add('hit_big', o + 2, 1, true);
  add('shimmer', o + 4, 0.4);
  add('stamp', o + b.tBadge, 0.5);
  add('whoosh_l', o + b.tHou, 0.5);
  for (let i = 0; i < 10; i++) add((`tick_${i % 3}`) as SfxName, o + b.tHou + i * 6 + 14, 0.3);
  add('sink_down', o + b.tHou + 20, 0.5); // Houston drops
  add('pop', o + b.tHou + 10, 0.4);
  add('rise_up', o + b.tDC, 0.55); // Washington rises
  add('rise_up', o + b.tNY, 0.45);
  add('lock', o + b.tMia, 0.5); // Miami: last again
  add('ding', o + b.tPill, 0.5);
}

/* ---- takeaway + outro */
{
  const g = group('s05_');
  const o = g.from;
  const rel = g.rel;
  whoosh(o + 6);
  for (let i = 0; i < 4; i++) add('swish', o + rel[i], 0.4);
  ticks(o + rel[0] + 140);
  for (let i = 0; i < 10; i++) add((`tick_${i % 3}`) as SfxName, o + rel[1] + 30 + i * 4 + 4, 0.3);
  add('ding', o + rel[1] + 90, 0.45);
  add('hit_med', o + rel[2] + 20, 0.6);
  add('click', o + rel[3] + 40, 0.4);
}
{
  const g = group('s06_');
  const o = g.from;
  const rel = g.rel;
  whoosh(o + 6);
  for (let i = 0; i < 3; i++) add((`chip_${i}`) as SfxName, o + rel[0] + 30 + i * 70, 0.5);
  add('pop', o + rel[1], 0.4);
  const endAt = g.frames - d(END_SCREEN_SECONDS);
  add('ding', o + endAt, 0.5);
}

export const VIDEO2_CUES: Cue[] = cues.sort((a, b) => a.at - b.at);
/** Master-timeline frames of the hero hits: the music dips around these (duck.ts). */
export const HERO_BEATS_V2: number[] = VIDEO2_CUES.filter((c) => c.hero).map((c) => c.at);
