/**
 * Thumbnail specs: one entry per Short. This file is the only thing to edit for a new thumbnail.
 * Assets live in public/thumbnails/ (see thumbnails/README.md for the naming scheme and the CTR checklist).
 *
 * Every claim is the one the Short's hook already makes (src/shots/ShortOverlays.tsx): the thumbnail raises a question,
 * the video answers it, and nothing promises more than the video delivers.
 */
export type Accent = 'gold' | 'mint' | 'red';

/** A picture with a black background, blended onto the scene with `screen` so the black disappears. Coordinates are in 1080x1920 px. */
export type Layer = {
  file: string; // file name in public/thumbnails/ without .jpg
  cx: number; // centre x of the picture box
  cy: number; // centre y of the picture box (the box is 1.75x as tall as wide)
  w: number; // box width
  flip?: boolean;
  rotate?: number;
  opacity?: number;
  glow?: string; // soft coloured light behind it
};

/** Where the top of the head sits in each man picture (fraction of the picture height), measured from the generated images. */
const HEAD_TOP: Record<string, number> = {
  'man-amazed': 0.27,
  'man-shocked': 0.37,
  'man-thinking': 0.25,
  'man-warning': 0.33,
  'man-intense': 0.24,
  'man-skeptical': 0.31,
};
/** Place a man so the top of his head is at headY (px) whatever his picture's headroom is, so every thumbnail has the face at the same height. */
const man = (file: string, cx: number, w: number, headY = 900): Layer => ({file, cx, w, cy: headY - HEAD_TOP[file] * w * 1.75 + (w * 1.75) / 2});

export type ThumbSpec = {
  id: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  bg: 'bg-emerald' | 'bg-navy-gold';
  kicker: string;
  /** small line struck through in red above the big text (loss framing) */
  strike?: string;
  big: string;
  bigSize: number;
  sub: string;
  accent: Accent;
  /** drawn back to front */
  layers: Layer[];
};

export const THUMBS: ThumbSpec[] = [
  {
    // Hook: California's $100K feels like $90,318. Loss framing + a question the Short answers.
    id: 1,
    bg: 'bg-emerald',
    kicker: 'CALIFORNIA',
    strike: '$100K',
    big: '$90K',
    bigSize: 400,
    sub: 'is what it really buys',
    accent: 'red',
    layers: [
      {file: 'obj-question', cx: 810, cy: 1340, w: 760, glow: 'rgba(255,176,32,0.35)'},
      man('man-skeptical', 450, 1250),
    ],
  },
  {
    // Hook: two states tie, both beat California by about $20K.
    id: 2,
    bg: 'bg-emerald',
    kicker: 'TWO STATES TIE',
    big: '+$20K',
    bigSize: 360,
    sub: 'better than California',
    accent: 'mint',
    layers: [
      {file: 'obj-money-tower', cx: 870, cy: 1330, w: 700, glow: 'rgba(61,240,168,0.3)'},
      man('man-amazed', 430, 1250),
    ],
  },
  {
    // Hook: Texas is #26 of 50.
    id: 3,
    bg: 'bg-navy-gold',
    kicker: 'TEXAS',
    big: '#26',
    bigSize: 470,
    sub: "isn't even top 25",
    accent: 'gold',
    layers: [man('man-shocked', 540, 1300)],
  },
  {
    // Hook: highest sales tax in the US (Louisiana, 10.11%) and still #5.
    id: 4,
    bg: 'bg-emerald',
    kicker: 'HIGHEST SALES TAX',
    big: '#5',
    bigSize: 520,
    sub: 'and it still ranks top 5',
    accent: 'gold',
    layers: [
      {file: 'obj-trophy', cx: 870, cy: 1400, w: 700, glow: 'rgba(255,176,32,0.35)'},
      man('man-thinking', 430, 1250),
    ],
  },
  {
    // Hook: cheap doesn't mean you'd earn $100K there.
    id: 5,
    bg: 'bg-navy-gold',
    kicker: 'CHEAP STATES',
    big: '$100K?',
    bigSize: 260,
    sub: "cheap doesn't mean you'd earn it",
    accent: 'red',
    layers: [man('man-warning', 540, 1480, 820)],
  },
  {
    // Short 6 opens on "So who actually wins?" (the remote-worker card).
    id: 6,
    bg: 'bg-emerald',
    kicker: 'REMOTE WORKER',
    big: 'WINNER?',
    bigSize: 260,
    sub: 'so who actually wins?',
    accent: 'mint',
    layers: [man('man-intense', 540, 1480, 820)],
  },
  {
    // Hook: try this with your own salary. (No man yet: add man-inviting.jpg, then add it as a layer.)
    id: 7,
    bg: 'bg-navy-gold',
    kicker: 'YOUR TURN',
    big: 'TRY IT',
    bigSize: 330,
    sub: 'with your own salary',
    accent: 'gold',
    layers: [
      {file: 'obj-coins', cx: 250, cy: 1450, w: 700, glow: 'rgba(255,176,32,0.3)'},
      {file: 'obj-arrow-up', cx: 690, cy: 1250, w: 950, glow: 'rgba(255,176,32,0.4)'},
    ],
  },
];
