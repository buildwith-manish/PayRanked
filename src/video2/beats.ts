/**
 * Beat times (design frames, local to each scene) for every Video 2 scene, cued to the spoken words.
 * The scenes (scenes.tsx) place their visuals on these and the sound plan (sfx2.ts) places its sounds on the SAME numbers,
 * so picture and sound cannot drift apart. Change a cue here and both follow.
 */
import {byRank, cityPrefix, cue, group} from './layout';

export const coldBeats = () => {
  const g = group('s01_');
  const rel = g.rel;
  return {
    g,
    tOther: cue(g, 'other', rel[1] + 6, {from: 1}),
    tOnly: cue(g, 'only', rel[1] + 80, {from: 1}),
    tFirst: cue(g, 'fifty', rel[1] + 20, {from: 1}),
    tGap: cue(g, ['gap', 'six'], rel[2], {from: 2}),
    tWinner: cue(g, 'winner', rel[3] + 30, {from: 3}),
    tStops: cue(g, 'stops', rel[3] + 60, {from: 3}),
    tTitle: rel[4] + 4,
  };
};

export const methodBeats = () => {
  const g = group('s02_');
  const rel = g.rel;
  const tDial = cue(g, ['hundred', 'average'], rel[0] + 60);
  const tAbove = cue(g, 'above', rel[1] + 30, {from: 1});
  const tEq = cue(g, 'multiply', rel[1] + 150, {from: 1});
  const tRent = cue(g, 'rent', rel[2] + 6, {from: 2});
  const tGoods = cue(g, 'goods', tRent + 8, {from: 2});
  const tServ = cue(g, 'services', tGoods + 8, {from: 2});
  // the map moment: ten metro pins light up west to east as the voice says "these are metro areas", before the countdown
  const tMap = cue(g, ['metro'], rel[2] + 240, {from: 2}) - 10;
  const tMapOut = rel[3] + 55;
  return {g, tDial, tAbove, tEq, tRent, tGoods, tServ, tSources: rel[3] + 10, tMap, tMapOut};
};

export const cityBeats = (rank: number) => {
  const g = group(cityPrefix(rank));
  const n = g.list.length;
  const rel = g.rel;
  const tPower = n >= 5 ? g.speech[1] : cue(g, 'buys', rel[0] + 60);
  const tDial = cue(g, ['price', 'prices'], n >= 5 ? rel[1] + 60 : rel[1], {from: 1});
  const tRentBar = cue(g, 'rent', tDial + 12, {from: 1});
  const tGoodsBar = cue(g, 'goods', tRentBar + 10, {from: 1});
  const tServBar = cue(g, ['services', 'service'], tGoodsBar + 10, {from: 1});
  const tRent = cue(g, 'median', rel[n >= 5 ? 3 : 1] + 120, {from: 1});
  const tNext = cue(g, ['next', 'half'], rel[n - 1], {from: n - 1});
  const tWin = rank === 1 ? cue(g, 'wins', rel[4], {from: 4}) : -1;
  const tRemember = rank === 7 ? cue(g, 'remember', rel[3] + 40, {from: 3}) : -1;
  return {g, n, tPower, tDial, tRentBar, tGoodsBar, tServBar, tRent, tNext, tWin, tRemember};
};

export const breakBeats = () => {
  const g = group('s03_');
  const rel = g.rel;
  return {g, tMiami: cue(g, 'miami', rel[0] + 40), tLA: cue(g, 'angeles', rel[1], {from: 1}), tNote: rel[1] + 40};
};

export const twistBeats = () => {
  const g = group('s04_');
  const rel = g.rel;
  return {
    g,
    tBadge: rel[0] + 60,
    tHou: cue(g, 'houston', rel[1], {from: 1}),
    tDC: cue(g, 'washington', rel[2], {from: 2}),
    tNY: cue(g, ['new', 'york'], rel[3], {from: 3}),
    tMia: cue(g, 'miami', rel[4], {from: 4}),
    tPill: rel[5] + 20,
  };
};
