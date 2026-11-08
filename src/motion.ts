/**
 * Motion library for PayRanked.
 *
 * One spring preset on everything reads as "template". Each kind of move gets its own curve instead:
 *   anticipate  small pull-back, then launch, then a soft overshoot and settle (big objects, camera)
 *   slam        fast in, hard overshoot, quick settle (rank numbers, the gap number)
 *   drop        accelerates like a falling object, one small bounce (coins, pins)
 *   glide       long expo-out with no overshoot (panels, rails, anything that should feel calm)
 *   snap        short, crisp, tiny overshoot (chips, labels)
 *   rise        mask-reveal curve: starts fast, lands very softly (kinetic type)
 *
 * Every curve takes t in 0..1 and returns progress (it may leave 0..1 on the way, that is the overshoot).
 * They are pure functions of the frame, so they are safe for Remotion's parallel rendering.
 */

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Cubic bezier easing, the same maths as CSS cubic-bezier() and After Effects' easy-ease handles. */
export const bezier = (x1: number, y1: number, x2: number, y2: number) => {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    // Newton-Raphson, then bisection as a fallback for flat spots
    let t = x;
    for (let i = 0; i < 6; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-5) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 24; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-5) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
};

/**
 * Spring-shaped curves with exact, readable controls: the size of the first overshoot (`os`, 0.12 = 12% past the
 * target) and how many times it swings before it is still (`cycles`). Different moves get different numbers, which is
 * what keeps the motion from looking like one preset.
 *
 * hit:  1 - e^(-dt) cos(wt)            starts at full speed (a strike), overshoots, rings out
 * soft: 1 - e^(-dt)(cos(wt) + d/w sin(wt))   starts from rest, overshoots, rings out
 */
const hit = (os: number, cycles: number) => {
  const w = Math.PI * 2 * cycles;
  const d = (-Math.log(os) / Math.PI) * w;
  return (t: number) => (t >= 1 ? 1 : t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(w * t));
};
const soft = (os: number, cycles: number) => {
  const w = Math.PI * 2 * cycles;
  const d = (-Math.log(os) / Math.PI) * w;
  return (t: number) => (t >= 1 ? 1 : t <= 0 ? 0 : 1 - Math.exp(-d * t) * (Math.cos(w * t) + (d / w) * Math.sin(w * t)));
};

export const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(t)));
export const expoInOut = (t: number) => {
  const x = clamp01(t);
  if (x === 0 || x === 1) return x;
  return x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
};
export const cubicInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

const antMain = soft(0.07, 1.15);
/** Pull back about 7%, whip forward, overshoot about 7%, ring once and settle. For things with weight (camera, cards). */
export const anticipate = (t: number) => {
  const x = clamp01(t);
  if (x >= 1) return 1;
  const A = 0.18; // share of the time spent winding up
  const dip = -0.068;
  if (x < A) return dip * Math.sin((x / A) * Math.PI * 0.5); // eases into the pull-back, zero speed at its end
  return dip + (1 - dip) * antMain((x - A) / (1 - A));
};

const slamCurve = hit(0.12, 1.5);
/** Fast in, overshoots about 12%, rings once and settles. For things that strike (rank numbers, the gap, stamps). */
export const slam = (t: number) => slamCurve(clamp01(t));

/** Gravity drop with one small bounce. 0 = high, 1 = rests on the surface. */
export const drop = (t: number) => {
  const x = clamp01(t);
  if (x >= 1) return 1;
  if (x < 0.62) return Math.pow(x / 0.62, 2); // fall
  const k = (x - 0.62) / 0.38; // bounce up and back
  return 1 - 0.09 * Math.sin(k * Math.PI) * (1 - k);
};

/** Calm, long tail, no overshoot. */
export const glide = bezier(0.19, 1, 0.22, 1);

const snapCurve = hit(0.04, 1);
/** Short and crisp with a 4% overshoot. For chips, labels, bars. */
export const snap = (t: number) => snapCurve(clamp01(t));

/** For mask reveals: leaves the line fast, lands very softly. */
export const rise = bezier(0.22, 1, 0.36, 1);

/** Ease for exits: slow start, accelerates away. */
export const exitIn = bezier(0.5, 0, 0.9, 0.4);

export type Ease = (t: number) => number;

/**
 * Progress of a move that starts at `start` and lasts `dur` frames, through `ease`.
 * Returns 0 before the start and whatever the curve ends on (1) after it.
 */
export const tween = (frame: number, start: number, dur: number, ease: Ease = glide) => ease(clamp01((frame - start) / dur));

/** Linear range map with clamping, then an optional ease. Handy for fades and fly-ins. */
export const ramp = (frame: number, from: number, to: number, ease: Ease = (t) => t) => ease(clamp01((frame - from) / (to - from)));

/** Fade window with eased in and out edges: 0 before `start`, 1 between, 0 after `end`. */
export const presence = (frame: number, start: number, end: number, fadeIn = 10, fadeOut = 10) =>
  ramp(frame, start, start + fadeIn, glide) * (1 - ramp(frame, end - fadeOut, end, cubicInOut));

/**
 * Follow-through: the same move, arriving `lag` frames later. Use it for the secondary things on a main move
 * (the text inside a card, the glow behind a chip, the shadow under a coin) so they trail by a few frames.
 */
export const trail = (frame: number, start: number, dur: number, ease: Ease, lag: number) => tween(frame, start + lag, dur, ease);

/** Per-item delay that grows with the index but shrinks as the list gets long, so a long list never drags. */
export const stagger = (i: number, step = 4, max = 36) => Math.min(max, i * step);

/** Speed (progress per frame) of any move, measured by sampling the function one frame earlier. */
export const speedOf = (fn: (frame: number) => number, frame: number) => Math.abs(fn(frame) - fn(frame - 1));

/**
 * Directional blur length in px from how far an element moved this frame.
 * A shutter of 0.5 (a 180 degree shutter, the film default) means the blur is half the distance travelled.
 * Below `floor` px nothing is drawn, so slow moves stay perfectly sharp and cost nothing.
 */
export const blurLength = (distancePx: number, shutter = 0.5, cap = 60, floor = 1.2) => {
  const b = Math.abs(distancePx) * shutter;
  return b < floor ? 0 : Math.min(cap, b);
};

/** Number roll: leaves fast and brakes hard over the last third, so the last digits visibly click into place. */
export const roll = bezier(0.12, 0.78, 0.18, 1);
