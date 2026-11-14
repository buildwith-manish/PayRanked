/**
 * Video 2 visual system. Defined once, used by every scene, so the 9 minutes look like one place.
 * Same base look as Video 1 (navy + emerald, metal coins, filmic Grade); this file only adds what Video 2 needs.
 */
import {C, F} from '../theme';

/** Colour roles: one meaning each, everywhere. Never reuse a role colour for something else. */
export const ROLE = {
  buying: C.mint,     // buying power (the $50,000 stack, the ranking number)
  rent: '#FF8A3D',    // rent price level / median rent
  goods: '#4DA3FF',   // goods price level
  services: '#2EE6D6',// services price level
  wage: '#B084FF',    // median wage (the twist)
  loss: C.red,        // a drop in rank or value
  neutral: C.muted,   // national average / reference
} as const;

/** Highlight used for 'takeaway' tags (one place, not hard-coded in scenes). */
export const GOLD = '#FFD25A';

export type Role = keyof typeof ROLE;
export const ROLE_LABEL: Record<Exclude<Role, 'neutral' | 'loss'>, string> = {
  buying: 'Buying power',
  rent: 'Rent',
  goods: 'Goods',
  services: 'Services',
  wage: 'Median wage',
};

/** Type scale (px at 1920x1080). Numbers must read on a phone: nothing important under TYPE.label. */
export const TYPE = {
  hero: 220,   // rank slam, the big gap number
  number: 132, // the dollar figure of a shot
  title: 84,   // city name
  label: 40,   // bars, chips
  source: 26,  // source badges ("BEA", "Census", "BLS")
} as const;

export const FONT = {num: F.display, text: F.body};

/** Motion language: the same entry and exit everywhere. Frames are design frames (30 fps). */
export const MOTION = {
  slamFrames: 14,    // rank number hit
  enterFrames: 18,   // anything that appears
  exitFrames: 10,    // anything that leaves (faster than it came)
  stagger: 4,        // between siblings
  overshoot: 0.06,   // settle past the target by 6% then return
  beatEvery: 75,     // something must move at least every ~2.5 s
} as const;

/** The reference stack: $50,000 = this many coins. Every city's stack is value / DOLLARS_PER_COIN. */
export const DOLLARS_PER_COIN = 5000;
export const coinsFor = (dollars: number) => dollars / DOLLARS_PER_COIN;
