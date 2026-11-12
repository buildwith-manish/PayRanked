import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Background} from './Background';
import {geoOf} from './USMap';
import {ThreeCanvas} from '@remotion/three';
import {Aberration} from './Grade';
import {Glass} from './Glass';
import {CAM_D, FOV, fovFor, lerp, toWorld} from '../three/camera';
import {CameraRig, MapLights, Pin3D, Sync} from '../three/scene';
import {Map3D, RISE_LAND} from '../three/Map3D';
import {currentTop} from '../three/State3D';
import {stateGeo} from '../three/geometry';
import {Count} from './Count';
import {CoinStack, coinsFor} from './CoinStack';
import {MiniGauge} from './Gauge';
import {Leaderboard, RailEntry, railOpenAt} from './Leaderboard';
import {MaskChars, MaskLine, MaskRule, MaskWords} from './MaskText';
import {MotionBlur} from './MotionBlur';
import {byName, fmtUSD, nearTieOf, SALARY} from '../data';
import {SourceTag} from './common';
import {camEase, cubicInOut, drop as dropEase, exitIn, glide, ramp, slam, snap, tween} from '../motion';
import {C, F, H, MARGIN, W, clamp, sec, tabular} from '../theme';
// COUNT_DUR lives in timeline.ts so revealSeconds() stays in sync with the
// count duration — changing one frame budget can't drift away from the other.
import {COUNT_DUR} from '../timeline';
import {K, useDesignFrame} from '../clock';
import {useLayout} from '../layout';

export type RankRevealProps = {
  rankLabel: string; // "#10"
  names: string[]; // 1 state, or 2 for a tie
  durationInFrames: number;
  /** entries already locked into the rail before this reveal */
  railBefore?: RailEntry[];
  /** the 15 s version of the beats (#10 to #6) */
  fast?: boolean;
  /** swap the coin stack and fact card for a side-by-side against California (one reveal, to break the template) */
  versus?: boolean;
};

/** The state this reveal is set against in the versus layout: the same California the cold open and the reality check use. */
export const VERSUS_VS = 'California';
/** Frame (within the reveal) on which the versus rows start: just after the dollar count has landed. */
export const versusAt = (t: {dollars: number}) => t.dollars + COUNT_DUR + 10;

/** Frames between letters of the state name (the cue sheet needs it to time the underline). */
export const NAME_STEP = 1.6;
/** The tie stamp lands this many frames after the name starts (1 s in the full reveal). */
export const TIE_STAMP_AFTER_NAME = 30;

/**
 * Everything that depends on the shape of the frame, in one place. `land` is the original 1920x1080 layout (map left, text
 * panel right, rail far left). `vert` is the 1080x1920 Shorts layout, a real redesign rather than a scaled-down copy:
 * the 3D map takes the top of the frame, the text stacks underneath it (rank label, name, BEA chip, dollars and coins, fact
 * card), the rail is a slim strip on the left edge, and every line of text stays inside the Shorts safe area
 * (below ~150 px, above ~1540 px, clear of the right-hand button column). The beats and timings are the same in both.
 */
const GEOM = {
  land: {
    w: W, h: H,
    ovFocusY: H / 2, // where the overview map sits before the fly (the middle of the frame)
    focusX: W * 0.4, focusY: H / 2, // where the zoomed state sits on screen: left of centre, so the right-hand info panel stays clear
    panelX: W - MARGIN - 760, panelW: 760, // left edge and width of the info panel
    zoomMin: 1.7, zoomMax: 3.0, fitW: W * 0.4, fitH: H * 0.55, // zoom is fitted to the state(s), then clamped (1 = the whole country fills the frame)
    ovK: 1.3, settleK: 1.08, // camera distance (in CAM_D) of the overview pose and of the opening push-in
    rankFont: 520, labelY: 118, // the slammed rank number, and where it settles as a small label
    nameTop: 172, nameSize: 92, nameSizeTie: 68,
    beaTop: 410, dollarTop: 410, countSize: 128, countSizeTie: 110, gainSize: 46, coinScale: 0.85,
    dollarTopVs: 410, countSizeVs: 128, chipFont: 80, gaugeSize: 150, nearMain: 40, nearSub: 30,
    versusTop: 640, nearTop: 752, factTop: 560, factFont: 40, factPad: '28px 34px', factSource: 24,
    barW: 600, versusLabel: 32, versusValue: 44, barH: 26, versusGap: 26,
  },
  vert: {
    w: 1080, h: 1920,
    ovFocusY: 1920 * 0.28, // the overview map sits in the upper part of the frame, above the slammed rank number (y 770+)
    focusX: 1080 * 0.56, focusY: 1920 * 0.235,
    panelX: 64, panelW: 952,
    zoomMin: 1.25, zoomMax: 2.6, fitW: 1080 * 0.66, fitH: 1920 * 0.27, // fitted so the extruded state ends above the rank label (y 858)
    ovK: 1.55, settleK: 1.35,
    rankFont: 340, labelY: 858, // 340 so the slammed "#10" (1.55x at its biggest) still fits inside 1080 px
    nameTop: 896, nameSize: 96, nameSizeTie: 58,
    // type is as large as the 1080 px width allows: the count and chip are ~1.2-1.4x their landscape size, the fact card 1.4x
    beaTop: 1086, dollarTop: 1086, countSize: 156, countSizeTie: 130, gainSize: 60, coinScale: 0.8,
    dollarTopVs: 1050, countSizeVs: 112, chipFont: 104, gaugeSize: 190, nearMain: 50, nearSub: 36,
    versusTop: 1255, nearTop: 1350, factTop: 1250, factFont: 56, factPad: '28px 36px', factSource: 32,
    barW: 700, versusLabel: 36, versusValue: 46, barH: 24, versusGap: 12,
  },
};
export type Geom = typeof GEOM.land;
export const geomOf = (vertical?: boolean): Geom => (vertical ? GEOM.vert : GEOM.land);
/** States whose longest side (in map pixels) is below this get a bigger pin. */
const SMALL_STATE = 130;

/** Frame numbers of every beat, in one place. They are the brief's timings, so the voice-over still lands on them.
 *
 * BEA beat (6-10s → 6-8s): shortened from 4 s to 2 s. The chip and gauge read in about 1.5 s; the extra 2 s was
 * dead air. The freed 2 s moves to the dollar roll (8 s → 10 s start), giving the number and coins more room to
 * breathe — the dollar count is the actual payoff and previously felt rushed relative to the BEA setup.
 * The formula line ($100,000 ÷ index) was cut at the same time: it had no visual emphasis (plain MaskLine at the
 * bottom of the panel) and added no information the chip score and gauge didn't already carry. */
export const T = {
  slam: 0,
  fly: sec(1),
  name: sec(3),
  bea: sec(6),
  dollars: sec(8),   // was sec(10): BEA beat shortened by 2 s, time moved here
  fact: sec(15),
  panelOut: sec(20.2),
  railOpen: sec(20.4),
  lock: sec(21),
  mapOut: sec(23.2),
  /** total length of the reveal, in design frames (the exit blur runs up to it) */
  end: sec(25),
};

/**
 * The same beats, in the same order, in 15 s instead of 25. Used for #10 to #6 so the countdown escalates: the early
 * reveals move, the last ones (#5 to #1) take their full time. Nothing is removed; every gap between beats is shorter.
 * BEA beat also shortened here by the same ratio (4.2 s → 4.6 s instead of 6.6 s, saving 0.4 s of dead air).
 */
export const T_FAST: typeof T = {
  slam: 0,
  fly: sec(0.8),
  name: sec(2.6),
  bea: sec(3.6),     // was 4.2: with dollars at 4.6 the chip had 0.4 s and was still on screen when the count started
  dollars: sec(5.2),
  fact: sec(8.8),
  panelOut: sec(12.6),
  railOpen: sec(12.8),
  lock: sec(13.4),
  mapOut: sec(14.4),
  end: sec(15),
};

export const timing = (fast: boolean): typeof T => (fast ? T_FAST : T);

/**
 * Camera fly: about 2.4 s in the full reveal, scaled by the same 15/25 ratio as the beats in the fast one. The fly starts on
 * T.fly in both, so no beat moves. The two variants use a different peak (camEase a/b) so the top speed of the whip lands
 * on the same frame, T.fly + 17, that the whoosh cue in audio/cues.ts is placed on.
 */
export const FLY_DUR_FULL = sec(2.4);
export const flyDurOf = (fast: boolean) => (fast ? Math.round(FLY_DUR_FULL * (T_FAST.end / T.end)) : FLY_DUR_FULL);
const flyEaseOf = (fast: boolean) => (fast ? (t: number) => camEase(t, 2, 3) : (t: number) => camEase(t, 1, 3));
/** Pitch and yaw trail the position by this many design frames, so the camera arrives before it finishes turning. */
export const ANGLE_LAG = 7;
/** Peak of the yaw drift in degrees. */
const DRIFT_DEG = 9;

/** Frames before T.end in which the camera eases back to the overview pose the next reveal starts from (1.2 s). */
export const PULLBACK = sec(1.2);
/** The overview pose: frame 0 of every reveal and, after the pull-back, its last frame. Identical, so the cut has no jump. */
export const OVERVIEW = {target: [0, 20, 0] as [number, number, number], dist: 1.3 * CAM_D, pitch: 60, yaw: -5, offsetX: 0, offsetY: 0};
/** The overview pose for either shape of frame (the vertical frame is narrow, so the camera starts further back to take in the whole country). */
export const overviewOf = (vertical?: boolean) => {
  const G = geomOf(vertical);
  return {...OVERVIEW, dist: G.ovK * CAM_D, offsetY: G.h / 2 - G.ovFocusY};
};

/** The state starts to rise when the camera is this far (0-1) through its fly. */
const RISE_FLY_P = 0.7;
/** Frame (local to the reveal) on which the camera is RISE_FLY_P of the way in: the highlighted state starts to rise then. */
export const riseAtOf = (fast: boolean) => {
  const ease = flyEaseOf(fast);
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (ease(mid) < RISE_FLY_P) lo = mid;
    else hi = mid;
  }
  return timing(fast).fly + hi * flyDurOf(fast);
};

export type CameraInput = {fast: boolean; wx: number; wy: number; topZ: number; targetZoom: number; vertical?: boolean};

/**
 * The camera pose as a pure function of the (design) frame, so its speed can be measured for motion blur and checked by
 * scripts/camera-check.mjs. No wind-up: every value moves monotonically from the overview toward the state.
 */
export const cameraPose = (f: number, c: CameraInput) => {
  const t = timing(c.fast);
  const G = geomOf(c.vertical);
  const dur = flyDurOf(c.fast);
  const ease = flyEaseOf(c.fast);
  // the opening push-in starts from rest too, so the cut from the previous reveal's pull-back has no speed jump
  const settle = camEase(clamp(f / 40));
  const flyP = ease(clamp((f - t.fly) / dur));
  // pitch and yaw take the same curve, a few frames later
  const turnP = ease(clamp((f - t.fly - ANGLE_LAG) / dur));
  // offsetX uses glide, which never overshoots, so the state settles on FOCUS_X without sliding past it
  const slideP = tween(f, t.fly, dur, glide);
  // slow yaw drift: an eased ramp, zero speed at both ends
  const drift = ramp(f, t.name, t.end, cubicInOut) * DRIFT_DEG;
  const base = {
    target: [lerp(0, c.wx, flyP), lerp(20, c.wy, flyP), lerp(0, c.topZ * 0.5, flyP)] as [number, number, number],
    dist: lerp(lerp(G.ovK, G.settleK, settle) * CAM_D, CAM_D / c.targetZoom, flyP),
    pitch: lerp(lerp(60, 42, settle), 51, turnP),
    yaw: lerp(-5, -18, turnP) + drift,
    offsetX: (G.w / 2 - G.focusX) * slideP,
    // the vertical frame parks the state in the upper part of the picture, above the text stack
    offsetY: lerp(G.h / 2 - G.ovFocusY, G.h / 2 - G.focusY, slideP),
  };
  // pull-back: in the last 1.2 s everything, the yaw drift included, eases to the overview pose
  const back = ramp(f, t.end - PULLBACK, t.end, glide);
  const O = overviewOf(c.vertical);
  return {
    target: [lerp(base.target[0], O.target[0], back), lerp(base.target[1], O.target[1], back), lerp(base.target[2], O.target[2], back)] as [number, number, number],
    dist: lerp(base.dist, O.dist, back),
    pitch: lerp(base.pitch, O.pitch, back),
    yaw: lerp(base.yaw, O.yaw, back),
    offsetX: lerp(base.offsetX, O.offsetX, back),
    offsetY: lerp(base.offsetY, O.offsetY, back),
    flyP,
  };
};

// Guard: in both variants the dollar count must finish before the hand-over, and every beat must fit inside the
// reveal. If you change COUNT_DUR or a beat time, this fails the build instead of letting the rail timing and the
// audio cues drift apart.
for (const [label, t] of [['full', T], ['fast', T_FAST]] as const) {
  if (t.dollars + COUNT_DUR > t.panelOut || t.mapOut > t.end) {
    throw new Error(
      `RankReveal (${label}) timing no longer fits: count ends at frame ${t.dollars + COUNT_DUR}, hand-over starts at ${t.panelOut}, ` +
        `map leaves at ${t.mapOut}, reveal is ${t.end} frames.`,
    );
  }
}

/**
 * One countdown reveal, built as one idea at a time. Times (seconds) follow the brief:
 * 0-1 rank slam, 1-3 zoom to state, 3-6 name, 6-10 BEA score, 10-15 dollars + coins, 15-21 fact card, 21-25 lock into rail.
 *
 * Restraint: each beat owns the screen. The rank number shrinks into a small label above the name; the name steps
 * back when the BEA score arrives; the BEA score leaves when the dollars arrive; the coins sink when the fact card
 * arrives; the whole panel leaves before the rail takes over for the lock. The rail itself folds to a slim strip
 * while a state is on stage. One accent colour (mint) per frame.
 *
 * Motion: the camera whips in from rest and settles with no wind-up and no overshoot (camEase); the rank slams (slam); the state
 * lifts with a ringing settle; the pin falls under gravity with a bounce; type rises from behind a mask line; numbers
 * roll on odometer wheels; fast moves carry directional motion blur measured from their real speed.
 */
export const RankReveal: React.FC<RankRevealProps> = ({rankLabel, names, railBefore = [], fast = false, versus = false}) => {
  const frame = useDesignFrame();
  const lay = useLayout();
  const V = lay.vertical;
  const G = geomOf(V);
  const T = timing(fast);
  const states = names.map(byName);
  const tie = states.length > 1;
  const lead = states[0];
  // #1 is framed as the top of a tier, not a winner, when the runner-up is inside the data's margin
  const rank = parseInt(rankLabel.replace('#', ''), 10);
  const nearTie = rank === 1 && !tie ? nearTieOf(lead.name) : null;
  const geos = names.map(geoOf);
  // states that locked in before this reveal: the only ones the 3D map may show at full height (no spoilers)
  const revealed = railBefore.flatMap((e) => e.names);

  // focus point: centroid (mean for ties)
  const cx = geos.reduce((a, g) => a + g.centroid[0], 0) / geos.length;
  const cy = geos.reduce((a, g) => a + g.centroid[1], 0) / geos.length;
  // union bounds of the highlighted state(s), used to fit the zoom
  const bx0 = Math.min(...geos.map((g) => g.bounds[0][0]));
  const by0 = Math.min(...geos.map((g) => g.bounds[0][1]));
  const bx1 = Math.max(...geos.map((g) => g.bounds[1][0]));
  const by1 = Math.max(...geos.map((g) => g.bounds[1][1]));
  const bw = bx1 - bx0;
  const bh = by1 - by0;
  const targetZoom = clamp(Math.min(G.fitW / bw, G.fitH / bh), G.zoomMin, G.zoomMax);
  const small = Math.max(...geos.map((g) => Math.max(g.bounds[1][0] - g.bounds[0][0], g.bounds[1][1] - g.bounds[0][1]))) < SMALL_STATE;

  const [wx, wy] = toWorld(cx, cy);
  const topZ = Math.max(...names.map((n) => stateGeo(n)?.top ?? 0));

  // ---- camera: a pure function of the frame, so its speed can be measured for motion blur ----
  const camIn: CameraInput = {fast, wx, wy, topZ, targetZoom, vertical: V};
  const camAt = (f: number) => cameraPose(f, camIn);
  const cam = camAt(frame);
  const camPrev = camAt(frame - 1);
  const camScale = cam.dist / CAM_D; // world units per screen pixel
  // screen-space speed of the picture this frame: the pan, the pan of the view offset, and the zoom
  const zoomPx = (Math.abs(cam.dist - camPrev.dist) / cam.dist) * 520;
  const camBlurX = Math.abs(cam.target[0] - camPrev.target[0]) / camScale + Math.abs(cam.offsetX - camPrev.offsetX) + zoomPx * 0.6;
  const camBlurY = (Math.abs(cam.target[1] - camPrev.target[1]) / camScale) * 0.8 + Math.abs(cam.offsetY - camPrev.offsetY) + zoomPx * 0.6;

  // ---- 0-1s rank slam; 1-3s the number shrinks into a label above the name ----
  // lands on a long expo-out with no overshoot: a clean, heavy settle instead of a bouncing neon slab
  const slamScale = (f: number) => 1 + 0.55 * (1 - tween(f, 0, 30, glide));
  const travel = (f: number) => tween(f, T.fly, 46, glide);
  const rankScale = (f: number) => slamScale(f) * lerp(1, 0.2, travel(f));
  const rankBlur = Math.min(16, Math.abs(rankScale(frame) - rankScale(frame - 1)) * (16 / K));
  const est = 0.65 * G.rankFont * rankLabel.length; // rough width of the big label, to land its left edge on the panel edge
  const rankX = lerp(G.w / 2, G.panelX + est * 0.1, travel(frame));
  const rankY = lerp(G.h / 2, G.labelY, travel(frame));
  // was lerp(80, 26) at full emerald: with the grade's bloom on top the slam blew out to a flat neon slab
  const rankGlow = lerp(14, 5, travel(frame));

  // ---- map state: the highlighted state lifts out of the map, the others fall back into the dark ----
  // the state rises when the camera is 70% in; the extra lift follows the same 12 frames behind it as before (1.1 s then 1.5 s)
  const riseAt = riseAtOf(fast);
  const pop = tween(frame, riseAt + 12, 40, glide) * 30;
  const dimOthers = ramp(frame, T.fly, sec(2.2), glide);
  const trace = tween(frame, sec(1.4), 36, glide);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 14);

  // pins sit on top of the (rising) states, kept at a steady size on screen whatever the camera distance
  const pinScreenPx = small ? 84 : 54; // was 76 / 40: bigger so it still reads when the preview is zoomed out
  // the pin drops once the rise has landed. The audio cue sheet puts the pin sound on 2.4 s, so it never drops before that:
  // in the fast reveal the rise lands earlier and the pin stays on 2.4 s; in the full one it follows the later rise.
  const pinAt = Math.max(sec(2.4), riseAt + RISE_LAND);
  const pinDrop = tween(frame, pinAt, 22, dropEase);
  const pinRing = ((((frame - pinAt - 10) % 45) + 45) % 45) / 45;

  // ---- 3-6s name: rises from behind a line, letter by letter; the rule draws under it, a beat later ----
  const nameText = names.join('  ·  ').toUpperCase();
  const nameSize = tie ? G.nameSizeTie : G.nameSize;
  const nameStep = NAME_STEP;
  const ruleAt = T.name + Math.round(nameText.length * nameStep) + 4;
  // when the BEA score arrives the name steps back to a label
  const nameBack = tween(frame, T.bea, 22, glide);

  // ---- 6-10s BEA score: the one thing on stage ----
  const chipP = (f: number) => tween(f, T.bea + 4, 24, snap);
  const flip = (1 - tween(frame, T.bea + 4, 26, glide)) * 90;
  // BEA exits so that it is fully gone by the time the dollars start (both sit at top:410; overlapping them looked broken)
  const BEA_EXIT = 18;
  const beaOutAt = T.dollars - BEA_EXIT;
  const beaOut = tween(frame, beaOutAt, BEA_EXIT, exitIn);

  // ---- 10-15s dollars + coins ----
  const coinCount = ramp(frame, T.dollars, T.dollars + 60, glide) * coinsFor(lead.dollars);
  // the versus reveal shows its comparison where the fact card would be, so it never carries a fact card
  const hasFact = !!(lead.fact && lead.factSource) && !(versus && !tie);
  // fast reveals (#10 to #6) get about 3.8 s of fact: no source line there (the source is on screen the whole video)
  const showSource = !fast;
  // with a fact card the dollars step back and the coins sink; without one they hold
  const compact = hasFact ? tween(frame, T.fact, 24, glide) : 0;
  const coinFade = hasFact ? 1 - ramp(frame, T.fact, T.fact + 16, exitIn) : 1;
  const gainFade = hasFact ? 1 - ramp(frame, T.fact - 6, T.fact + 2, exitIn) : 1;
  const isVersus = versus && !tie;
  const vs = byName(VERSUS_VS);
  const vAt = versusAt(T);
  // bars share one scale, from $0, so their lengths are honest; the ring marks $100,000
  const BAR_MAX = 120000;
  const BAR_W = G.barW;

  // ---- 15-21s fact card ----
  // snap entrance (about 10 frames, was a 26-frame glide): the blur is taken from this curve's own derivative, so a fast
  // arrival smears like the BEA chip does instead of reading as a slow, unblurred slide
  const FACT_SLIDE = 120;
  const factIn = (f: number) => tween(f, T.fact + 6, 10, snap);

  // ---- 20-25s hand-over to the rail: the panel leaves, the rail opens, the new row locks in ----
  const panelOut = (f: number) => tween(f, T.panelOut, 18, exitIn);
  const recede = ramp(frame, T.panelOut, T.lock + 8, glide);
  const exit = ramp(frame, T.mapOut, T.end, glide);
  const rail: RailEntry[] = [...railBefore, {label: rankLabel, names, lockAt: T.lock}];
  const open = railOpenAt(frame, sec(1.1), T.railOpen);

  const showPanel = frame >= T.name;

  return (
    <Aberration at={[0, T.dollars + COUNT_DUR]} peak={4}>
      <Background glowX={V ? G.w * 0.5 : W * 0.62} glowY={V ? G.h * 0.3 : H * 0.5} tint={0.2 * (1 - clamp(tween(frame, 0, 26, slam)))} parallax={[cam.target[0], cam.target[1]]}>
        {/* 3D map: extruded states, height = buying power */}
        <AbsoluteFill
          style={{
            filter: exit > 0 ? `blur(${exit * 8}px)` : undefined,
            opacity: (1 - 0.5 * recede) * (1 - exit * 0.4),
          }}
        >
          <MotionBlur dx={camBlurX} dy={camBlurY} shutter={0.38} cap={22} style={{position: 'absolute', inset: 0}}>
            <ThreeCanvas
              width={G.w}
              height={G.h}
              shadows
              camera={{fov: fovFor(G.h), near: 60, far: 9000, position: [0, 0, CAM_D]}}
              gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}}
              style={{position: 'absolute', inset: 0}}
            >
              <MapLights glow={{x: wx, y: wy, z: topZ + 150, color: C.mint, amount: dimOthers * 0.55}} />
              <CameraRig target={cam.target} dist={cam.dist} pitch={cam.pitch} yaw={cam.yaw} offsetX={cam.offsetX} offsetY={cam.offsetY} viewW={G.w} viewH={G.h} />
              <Map3D frame={frame} highlight={names} revealed={revealed} dim={dimOthers} pop={pop} riseAt={riseAt} trace={trace} pulse={pulse} />
              {frame >= pinAt &&
                geos.map((g, i) => {
                  const [px, py] = toWorld(g.centroid[0], g.centroid[1]);
                  return (
                    <Pin3D
                      key={names[i]}
                      x={px}
                      y={py}
                      z={currentTop(names[i], 1, pop)}
                      drop={pinDrop}
                      ring={pinRing}
                      scale={camScale}
                      pinPx={pinScreenPx}
                      ringPx={(small ? 70 : 40) * (pinScreenPx / 26)}
                    />
                  );
                })}
              <Sync />
            </ThreeCanvas>
          </MotionBlur>
        </AbsoluteFill>

        {/* scrim: a dark falloff behind the text column so mint text never sits on a mint map (contrast) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: V
              ? `linear-gradient(180deg, rgba(5,14,29,0) 36%, rgba(5,14,29,0.62) 50%, rgba(5,14,29,0.82) 100%)`
              : `linear-gradient(90deg, rgba(5,14,29,0) 30%, rgba(5,14,29,0.5) 62%, rgba(5,14,29,0.72) 100%)`,
            opacity: ramp(frame, T.name - 24, T.name + 6, glide) * (1 - panelOut(frame)),
          }}
        />

        {/* the rank: slams in huge, then shrinks into a small label above the name */}
        <div
          style={{
            position: 'absolute',
            left: rankX,
            top: rankY,
            transform: `translate(-50%, -50%) scale(${rankScale(frame)})`,
            filter: rankBlur > 0.4 ? `blur(${rankBlur}px)` : undefined,
            opacity: 1 - panelOut(frame),
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: G.rankFont,
            color: C.mint,
            lineHeight: 1,
            textShadow: `0 ${lerp(26, 8, travel(frame))}px ${lerp(60, 18, travel(frame))}px rgba(2,8,18,0.55), 0 0 ${rankGlow}px ${C.emerald}44`,
            whiteSpace: 'nowrap',
            ...tabular,
          }}
        >
          {rankLabel}
        </div>

        {/* info panel: one beat at a time */}
        {showPanel && (
          <MotionBlur dx={60 * (panelOut(frame) - panelOut(frame - 1))} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
            <div style={{position: 'absolute', left: G.panelX, top: 0, width: G.panelW, opacity: 1 - panelOut(frame), transform: `translateX(${panelOut(frame) * 60}px)`}}>
              {/* name (3-6s), then it steps back */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: G.nameTop,
                  width: G.panelW,
                  transformOrigin: '0% 0%',
                  transform: `scale(${1 - 0.22 * nameBack})`,
                  opacity: 1 - 0.58 * nameBack,
                }}
              >
                <div style={{fontFamily: F.display, fontWeight: 700, fontSize: nameSize, color: C.text, lineHeight: 1.05}}>
                  <MaskChars text={nameText} start={T.name} step={nameStep} />
                </div>
                <MaskRule start={ruleAt} color={C.emerald} height={7} style={{marginTop: 14}} />
                {(tie || nearTie) && (
                  <div style={{marginTop: 20, display: 'flex', alignItems: 'center', gap: 28}}>
                    <TieStamp at={T.name + TIE_STAMP_AFTER_NAME} label={tie ? 'TIE' : 'TOP TIER'} />
                    {/* ties below #10 take two places (competition ranking), so say why the next number is skipped */}
                    {tie && rank < 10 && (
                      <div style={{fontFamily: F.body, fontWeight: 500, fontSize: 34, color: C.muted, whiteSpace: 'nowrap'}}>
                        <MaskLine start={T.name + TIE_STAMP_AFTER_NAME + 14} dur={20}>
                          Shares #{rank} and #{rank + 1}
                        </MaskLine>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BEA score (6-8s): chip and gauge — the only things on stage.
                  Formula line removed: it was a plain MaskLine at the bottom of the panel with no visual
                  emphasis; the chip score and gauge already carry the same information with more impact.
                  Gauge: previously clipped to 240×140 with a translate(-30,-30) offset that pushed it
                  partially out of its own overflow:hidden box — it was only partially visible. Now rendered
                  at its natural size (MiniGauge renders Gauge at size*2 = 300px svg, viewBox-fit to 150px
                  display) with no clip, so the full semicircle and needle read clearly. */}
              {frame >= T.bea && frame < T.dollars && (
                <MotionBlur dy={-40 * (beaOut - tween(frame - 1, beaOutAt, BEA_EXIT, exitIn))} style={{position: 'absolute', left: 0, top: G.beaTop, width: G.panelW, opacity: 1 - beaOut, transform: `translateY(${-40 * beaOut}px)`}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 48}}>
                    <MotionBlur dx={90 * (chipP(frame) - chipP(frame - 1)) * -1}>
                      <Glass
                        radius={22}
                        tint={C.emerald}
                        strength={1.2}
                        glow={10}
                        style={{
                          padding: '16px 40px',
                          fontFamily: F.display,
                          fontWeight: 700,
                          fontSize: G.chipFont,
                          color: C.mint,
                          textShadow: `0 0 12px ${C.emerald}44`,
                          opacity: ramp(frame, T.bea + 4, T.bea + 12, glide),
                          transform: `perspective(800px) rotateX(${flip}deg) translateX(${(1 - chipP(frame)) * -90}px)`,
                          ...tabular,
                        }}
                      >
                        BEA {lead.rpp.toFixed(1)}
                      </Glass>
                    </MotionBlur>
                    {/* gauge trails the chip by 6 frames; rendered unclipped so the full semicircle is visible */}
                    <div style={{opacity: ramp(frame, T.bea + 10, T.bea + 20, glide)}}>
                      <MiniGauge value={lead.rpp} size={G.gaugeSize} delay={T.bea + 10} />
                    </div>
                  </div>
                </MotionBlur>
              )}

              {/* dollars + coins (10-15s) */}
              {frame >= T.dollars && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: isVersus ? G.dollarTopVs : G.dollarTop,
                    transformOrigin: '0% 0%',
                    transform: `scale(${1 - 0.42 * compact})`,
                    opacity: 1 - 0.25 * compact,
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'flex-end', gap: 18}}>
                    <div>
                      <Count to={lead.display} start={T.dollars} duration={COUNT_DUR} size={tie ? G.countSizeTie : isVersus ? G.countSizeVs : G.countSize} color={C.mint} glow={7} />
                      {/* follow-through: the gain rises into view once the wheels have settled */}
                      {/* fades out before the fact card arrives so it never peeks out behind the card */}
                      <div style={{marginTop: 8, fontFamily: F.display, fontWeight: 700, fontSize: G.gainSize, color: C.mint, opacity: 0.9 * gainFade, ...tabular}}>
                        <MaskLine start={T.dollars + COUNT_DUR - 4} dur={22}>
                          +{fmtUSD(Math.round(lead.extra / 100) * 100)}
                        </MaskLine>
                      </div>
                    </div>
                    {!isVersus && (
                      <div style={{height: 300, display: 'flex', alignItems: 'flex-end', transform: `scale(${G.coinScale})`, transformOrigin: 'bottom left', opacity: coinFade}}>
                        <CoinStack count={coinCount} appearAt={T.dollars} refLineAt={10} refLabel="$100K" refSub="US average" width={130} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* versus (one reveal only): the same $100,000 in this state and in California, on one scale */}
              {isVersus && frame >= vAt && (
                <div style={{position: 'absolute', left: 0, top: G.versusTop, width: G.panelW}}>
                  <div style={{fontFamily: F.body, fontWeight: 500, fontSize: 34, color: C.muted, marginBottom: V ? 14 : 22}}>
                    <MaskLine start={vAt} dur={20}>
                      The same $100,000 buys
                    </MaskLine>
                  </div>
                  {[
                    {label: lead.name, dollars: lead.display, color: C.mint, delay: 0},
                    {label: vs.name, dollars: vs.display, color: C.muted, delay: 14},
                  ].map((row) => {
                    const p = tween(frame, vAt + 8 + row.delay, 34, glide);
                    return (
                      <div key={row.label} style={{marginBottom: G.versusGap, opacity: ramp(frame, vAt + 4 + row.delay, vAt + 14 + row.delay, glide)}}>
                        <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: BAR_W + 150}}>
                          <span style={{fontFamily: F.body, fontWeight: 500, fontSize: G.versusLabel, color: row.color === C.mint ? C.text : C.muted}}>{row.label}</span>
                          <span style={{fontFamily: F.display, fontWeight: 700, fontSize: G.versusValue, color: row.color, ...tabular}}>{fmtUSD(Math.round(row.dollars * p))}</span>
                        </div>
                        <div style={{position: 'relative', marginTop: 8, height: G.barH, width: BAR_W + 150}}>
                          <div style={{position: 'absolute', left: 0, top: 0, height: G.barH, width: (row.dollars / BAR_MAX) * BAR_W * p, borderRadius: G.barH / 2, background: row.color, opacity: row.color === C.mint ? 1 : 0.55}} />
                          <div style={{position: 'absolute', left: (SALARY / BAR_MAX) * BAR_W - 1.5, top: -6, width: 3, height: G.barH + 12, background: C.text, opacity: 0.7}} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{fontFamily: F.body, fontWeight: 500, fontSize: 26, color: C.muted, marginTop: -2}}>
                    <MaskLine start={vAt + 40} dur={20}>
                      White line: $100,000 at the US average price level
                    </MaskLine>
                  </div>
                </div>
              )}

              {/* #1 only: the honest margin over #2, once the dollars have landed */}
              {nearTie && frame >= T.dollars + COUNT_DUR && (
                <div style={{position: 'absolute', left: 0, top: G.nearTop, width: G.panelW, opacity: V ? gainFade : 1 - 0.25 * compact}}>
                  {/* vertical: the fact card takes this space, so the margin note leaves just before it (the TOP TIER stamp stays) */}
                  <div style={{fontFamily: F.body, fontWeight: 500, fontSize: G.nearMain, color: C.text, lineHeight: 1.2, ...tabular}}>
                    <MaskLine start={T.dollars + COUNT_DUR + 14} dur={22}>
                      Just ~{fmtUSD(Math.round(nearTie.dollarGap / 10) * 10)} ahead of #2 {nearTie.name}
                    </MaskLine>
                  </div>
                  <div style={{marginTop: 10, fontFamily: F.body, fontWeight: 500, fontSize: G.nearSub, color: C.muted, lineHeight: 1.25}}>
                    <MaskLine start={T.dollars + COUNT_DUR + 26} dur={22}>
                      Ranked by index. A gap this small is within the data’s margin.
                    </MaskLine>
                  </div>
                </div>
              )}

              {/* fact card (15-21s): arrives alone once the dollars have stepped back */}
              {hasFact && frame >= T.fact && (
                <MotionBlur dx={-FACT_SLIDE * (factIn(frame) - factIn(frame - 1))} shutter={0.6} cap={50} style={{position: 'absolute', left: 0, top: G.factTop, width: G.panelW}}>
                  <Glass
                    radius={22}
                    tint={C.text}
                    style={{
                      width: G.panelW,
                      padding: G.factPad,
                      transform: `translateX(${(1 - factIn(frame)) * FACT_SLIDE}px)`,
                      opacity: ramp(frame, T.fact + 6, T.fact + 11, glide),
                    }}
                  >
                    <div style={{fontFamily: F.body, fontWeight: 500, fontSize: G.factFont, lineHeight: 1.25, color: C.text}}>
                      <MaskWords text={lead.fact ?? ''} start={T.fact + 12} step={2} dur={18} />
                    </div>
                    {showSource && (
                      <div style={{marginTop: 12, fontFamily: F.body, fontWeight: 500, fontSize: G.factSource, color: C.muted}}>
                        <MaskLine start={T.fact + 12 + Math.min(30, (lead.fact ?? '').split(' ').length * 2) + 6}>Source: {lead.factSource}</MaskLine>
                      </div>
                    )}
                  </Glass>
                </MotionBlur>
              )}
            </div>
          </MotionBlur>
        )}

        <Leaderboard entries={rail} revealAt={-80} open={open} />
        <SourceTag />
      </Background>
    </Aberration>
  );
};

/** TIE (or TOP TIER, for a near-tie #1) stamp: slams down from large with a hard overshoot. Mint, like everything else on the frame. */
const TieStamp: React.FC<{at: number; label?: string}> = ({at, label = 'TIE'}) => {
  const f = useDesignFrame();
  const p = tween(f, at, 16, slam);
  return (
    <div
      style={{
        display: 'inline-block',
        padding: '6px 28px',
        border: `5px solid ${C.mint}`,
        color: C.mint,
        fontFamily: F.display,
        fontWeight: 700,
        fontSize: 56,
        borderRadius: 12,
        transform: `rotate(-6deg) scale(${1 + 1.4 * (1 - p)})`,
        opacity: f >= at ? Math.min(1, p * 3) : 0,
      }}
    >
      {label}
    </div>
  );
};
