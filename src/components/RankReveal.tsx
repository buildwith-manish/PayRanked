import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Background} from './Background';
import {geoOf} from './USMap';
import {ThreeCanvas} from '@remotion/three';
import {Aberration} from './Grade';
import {Glass} from './Glass';
import {CAM_D, FOV, lerp, toWorld} from '../three/camera';
import {CameraRig, MapLights, Pin3D, Sync} from '../three/scene';
import {Map3D} from '../three/Map3D';
import {currentTop} from '../three/State3D';
import {stateGeo} from '../three/geometry';
import {Count} from './Count';
import {CoinStack, coinsFor} from './CoinStack';
import {MiniGauge} from './Gauge';
import {Leaderboard, RailEntry, railOpenAt} from './Leaderboard';
import {MaskChars, MaskLine, MaskRule, MaskWords} from './MaskText';
import {MotionBlur} from './MotionBlur';
import {byName, fmtUSD, SALARY} from '../data';
import {SourceTag} from './common';
import {anticipate, drop as dropEase, exitIn, glide, ramp, slam, snap, tween} from '../motion';
import {C, F, H, MARGIN, W, clamp, sec, tabular} from '../theme';
// COUNT_DUR lives in timeline.ts so revealSeconds() stays in sync with the
// count duration — changing one frame budget can't drift away from the other.
import {COUNT_DUR} from '../timeline';

export type RankRevealProps = {
  rankLabel: string; // "#10"
  names: string[]; // 1 state, or 2 for a tie
  durationInFrames: number;
  /** entries already locked into the rail before this reveal */
  railBefore?: RailEntry[];
};

/** Frames between letters of the state name (the cue sheet needs it to time the underline). */
export const NAME_STEP = 1.6;

/** Zoom is fitted to the state(s) and then clamped to this range (1 = the whole country fills the frame). */
const ZOOM_MIN = 1.7;
const ZOOM_MAX = 3.0;
/** States whose longest side (in map pixels) is below this get a bigger pin. */
const SMALL_STATE = 130;
/** Where the zoomed state sits on screen: left of centre, so the right-hand info panel stays clear. */
const FOCUS_X = W * 0.4;
/** Left edge of the info panel. */
const PANEL_X = W - MARGIN - 760;

/** Frame numbers of every beat, in one place. They are the brief's timings, so the voice-over still lands on them. */
export const T = {
  slam: 0,
  fly: sec(1),
  name: sec(3),
  bea: sec(6),
  dollars: sec(10),
  fact: sec(15),
  panelOut: sec(20.2),
  railOpen: sec(20.4),
  lock: sec(21),
  mapOut: sec(23.2),
};

/**
 * One countdown reveal, built as one idea at a time. Times (seconds) follow the brief:
 * 0-1 rank slam, 1-3 zoom to state, 3-6 name, 6-10 BEA score, 10-15 dollars + coins, 15-21 fact card, 21-25 lock into rail.
 *
 * Restraint: each beat owns the screen. The rank number shrinks into a small label above the name; the name steps
 * back when the BEA score arrives; the BEA score leaves when the dollars arrive; the coins sink when the fact card
 * arrives; the whole panel leaves before the rail takes over for the lock. The rail itself folds to a slim strip
 * while a state is on stage. One accent colour (mint) per frame.
 *
 * Motion: the camera winds back, whips in, overshoots and settles (anticipate); the rank slams (slam); the state
 * lifts with a ringing settle; the pin falls under gravity with a bounce; type rises from behind a mask line; numbers
 * roll on odometer wheels; fast moves carry directional motion blur measured from their real speed.
 */
export const RankReveal: React.FC<RankRevealProps> = ({rankLabel, names, railBefore = []}) => {
  const frame = useCurrentFrame();
  const states = names.map(byName);
  const tie = states.length > 1;
  const lead = states[0];
  const geos = names.map(geoOf);

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
  const targetZoom = clamp(Math.min((W * 0.4) / bw, (H * 0.55) / bh), ZOOM_MIN, ZOOM_MAX);
  const small = Math.max(...geos.map((g) => Math.max(g.bounds[1][0] - g.bounds[0][0], g.bounds[1][1] - g.bounds[0][1]))) < SMALL_STATE;

  const [wx, wy] = toWorld(cx, cy);
  const topZ = Math.max(...names.map((n) => stateGeo(n)?.top ?? 0));

  // ---- camera: a pure function of the frame, so its speed can be measured for motion blur ----
  const camAt = (f: number) => {
    const settle = tween(f, 0, 40, glide);
    // wind-up (the camera backs off a little), whip in, overshoot, settle
    const flyP = tween(f, T.fly, sec(2), anticipate);
    const drift = ramp(f, T.name, sec(25)) * 9;
    return {
      target: [lerp(0, wx, flyP), lerp(20, wy, flyP), lerp(0, topZ * 0.5, flyP)] as [number, number, number],
      dist: lerp(lerp(1.3, 1.08, settle) * CAM_D, CAM_D / targetZoom, flyP),
      pitch: lerp(lerp(60, 42, settle), 51, flyP),
      yaw: lerp(-5, -18, flyP) + drift,
      offsetX: (W / 2 - FOCUS_X) * flyP,
      flyP,
    };
  };
  const cam = camAt(frame);
  const camPrev = camAt(frame - 1);
  const camScale = cam.dist / CAM_D; // world units per screen pixel
  // screen-space speed of the picture this frame: the pan, the pan of the view offset, and the zoom
  const zoomPx = (Math.abs(cam.dist - camPrev.dist) / cam.dist) * 520;
  const camBlurX = Math.abs(cam.target[0] - camPrev.target[0]) / camScale + Math.abs(cam.offsetX - camPrev.offsetX) + zoomPx * 0.6;
  const camBlurY = (Math.abs(cam.target[1] - camPrev.target[1]) / camScale) * 0.8 + zoomPx * 0.6;

  // ---- 0-1s rank slam; 1-3s the number shrinks into a label above the name ----
  const slamScale = (f: number) => 1 + 1.2 * (1 - tween(f, 0, 26, slam));
  const travel = (f: number) => tween(f, T.fly, 46, glide);
  const rankScale = (f: number) => slamScale(f) * lerp(1, 0.2, travel(f));
  const rankBlur = Math.min(16, Math.abs(rankScale(frame) - rankScale(frame - 1)) * 16);
  const est = 0.65 * 520 * rankLabel.length; // rough width of the big label, to land its left edge on the panel edge
  const rankX = lerp(W / 2, PANEL_X + est * 0.1, travel(frame));
  const rankY = lerp(H / 2, 118, travel(frame));
  const rankGlow = lerp(80, 26, travel(frame));

  // ---- map state: the highlighted state lifts out of the map, the others fall back into the dark ----
  const pop = tween(frame, sec(1.5), 30, slam) * 30;
  const dimOthers = ramp(frame, T.fly, sec(2.2), glide);
  const trace = tween(frame, sec(1.4), 36, glide);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 14);

  // pins sit on top of the (rising) states, kept at a steady size on screen whatever the camera distance
  const pinScreenPx = small ? 76 : 40;
  const pinDrop = tween(frame, sec(2.4), 22, dropEase);
  const pinRing = ((((frame - sec(2.4) - 10) % 45) + 45) % 45) / 45;

  // tilt-shift depth of field: the top and bottom of the frame defocus while the camera is in motion
  const dof = 4 + 7 * Math.sin(clamp(cam.flyP) * Math.PI);

  // ---- 3-6s name: rises from behind a line, letter by letter; the rule draws under it, a beat later ----
  const nameText = names.join('  ·  ').toUpperCase();
  const nameSize = tie ? 68 : 92;
  const nameStep = NAME_STEP;
  const ruleAt = T.name + Math.round(nameText.length * nameStep) + 4;
  // when the BEA score arrives the name steps back to a label
  const nameBack = tween(frame, T.bea, 22, glide);

  // ---- 6-10s BEA score: the one thing on stage ----
  const chipP = (f: number) => tween(f, T.bea + 4, 24, snap);
  const flip = (1 - tween(frame, T.bea + 4, 26, glide)) * 90;
  const beaOut = tween(frame, T.dollars, 18, exitIn); // leaves as the dollars arrive

  // ---- 10-15s dollars + coins ----
  const coinCount = ramp(frame, T.dollars, T.dollars + 60, glide) * coinsFor(lead.dollars);
  const hasFact = !!(lead.fact && lead.factSource);
  // with a fact card the dollars step back and the coins sink; without one they hold
  const compact = hasFact ? tween(frame, T.fact, 24, glide) : 0;
  const coinFade = hasFact ? 1 - ramp(frame, T.fact, T.fact + 16, exitIn) : 1;

  // ---- 15-21s fact card ----
  const factIn = (f: number) => tween(f, T.fact + 6, 26, glide);

  // ---- 20-25s hand-over to the rail: the panel leaves, the rail opens, the new row locks in ----
  const panelOut = (f: number) => tween(f, T.panelOut, 18, exitIn);
  const recede = ramp(frame, T.panelOut, T.lock + 8, glide);
  const exit = ramp(frame, T.mapOut, sec(25), glide);
  const rail: RailEntry[] = [...railBefore, {label: rankLabel, names, lockAt: T.lock}];
  const open = railOpenAt(frame, sec(1.1), T.railOpen);

  const showPanel = frame >= T.name;

  return (
    <Aberration at={[0, T.dollars + COUNT_DUR]}>
      <Background glowX={W * 0.62} glowY={H * 0.5} tint={0.2 * (1 - clamp(tween(frame, 0, 26, slam)))} parallax={[cam.target[0], cam.target[1]]}>
        {/* 3D map: extruded states, height = buying power */}
        <AbsoluteFill
          style={{
            filter: exit > 0 ? `blur(${exit * 8}px)` : undefined,
            opacity: (1 - 0.5 * recede) * (1 - exit * 0.4),
          }}
        >
          <MotionBlur dx={camBlurX} dy={camBlurY} shutter={0.5} cap={34} style={{position: 'absolute', inset: 0}}>
            <ThreeCanvas
              width={W}
              height={H}
              shadows
              camera={{fov: FOV, near: 60, far: 9000, position: [0, 0, CAM_D]}}
              gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}}
              style={{position: 'absolute', inset: 0}}
            >
              <MapLights glow={{x: wx, y: wy, z: topZ + 150, color: C.mint, amount: dimOthers * 0.55}} />
              <CameraRig target={cam.target} dist={cam.dist} pitch={cam.pitch} yaw={cam.yaw} offsetX={cam.offsetX} />
              <Map3D frame={frame} highlight={names} dim={dimOthers} pop={pop} trace={trace} pulse={pulse} />
              {frame >= sec(2.4) &&
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
          {/* tilt-shift: blurred bands top and bottom fake a shallow depth of field */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backdropFilter: `blur(${dof}px)`,
              WebkitBackdropFilter: `blur(${dof}px)`,
              WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, transparent 20%, transparent 78%, #000 100%)',
              maskImage: 'linear-gradient(to bottom, #000 0%, transparent 20%, transparent 78%, #000 100%)',
            }}
          />
        </AbsoluteFill>

        {/* scrim: a dark falloff behind the text column so mint text never sits on a mint map (contrast) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `linear-gradient(90deg, rgba(5,14,29,0) 30%, rgba(5,14,29,0.5) 62%, rgba(5,14,29,0.72) 100%)`,
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
            fontSize: 520,
            color: C.mint,
            lineHeight: 1,
            textShadow: `0 0 ${rankGlow}px ${C.emerald}`,
            whiteSpace: 'nowrap',
            ...tabular,
          }}
        >
          {rankLabel}
        </div>

        {/* info panel: one beat at a time */}
        {showPanel && (
          <MotionBlur dx={60 * (panelOut(frame) - panelOut(frame - 1))} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
            <div style={{position: 'absolute', left: PANEL_X, top: 0, width: 760, opacity: 1 - panelOut(frame), transform: `translateX(${panelOut(frame) * 60}px)`}}>
              {/* name (3-6s), then it steps back */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 172,
                  width: 760,
                  transformOrigin: '0% 0%',
                  transform: `scale(${1 - 0.22 * nameBack})`,
                  opacity: 1 - 0.58 * nameBack,
                }}
              >
                <div style={{fontFamily: F.display, fontWeight: 700, fontSize: nameSize, color: C.text, lineHeight: 1.05}}>
                  <MaskChars text={nameText} start={T.name} step={nameStep} />
                </div>
                <MaskRule start={ruleAt} color={C.emerald} height={7} style={{marginTop: 14}} />
                {tie && (
                  <div style={{marginTop: 20}}>
                    <TieStamp at={sec(4)} />
                  </div>
                )}
              </div>

              {/* BEA score (6-10s): chip, gauge and formula, the only thing on stage */}
              {frame >= T.bea && frame < T.dollars + 20 && (
                <MotionBlur dy={-40 * (beaOut - tween(frame - 1, T.dollars, 18, exitIn))} style={{position: 'absolute', left: 0, top: 410, width: 760, opacity: 1 - beaOut, transform: `translateY(${-40 * beaOut}px)`}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 32}}>
                    <MotionBlur dx={90 * (chipP(frame) - chipP(frame - 1)) * -1}>
                      <Glass
                        radius={22}
                        tint={C.emerald}
                        strength={1.2}
                        glow={20}
                        style={{
                          padding: '16px 40px',
                          fontFamily: F.display,
                          fontWeight: 700,
                          fontSize: 80,
                          color: C.mint,
                          textShadow: `0 0 22px ${C.emerald}88`,
                          opacity: ramp(frame, T.bea + 4, T.bea + 12, glide),
                          transform: `perspective(800px) rotateX(${flip}deg) translateX(${(1 - chipP(frame)) * -90}px)`,
                          ...tabular,
                        }}
                      >
                        BEA {lead.rpp.toFixed(1)}
                      </Glass>
                    </MotionBlur>
                    {/* the gauge trails the chip by 6 frames */}
                    <div style={{width: 240, height: 140, overflow: 'hidden', opacity: ramp(frame, T.bea + 10, T.bea + 20, glide)}}>
                      <div style={{transform: 'translate(-30px, -30px)'}}>
                        <MiniGauge value={lead.rpp} size={150} delay={T.bea + 10} />
                      </div>
                    </div>
                  </div>
                  <div style={{marginTop: 18, fontFamily: F.body, fontWeight: 500, fontSize: 44, color: C.muted, ...tabular}}>
                    <MaskLine start={T.bea + 12} dur={20}>
                      {fmtUSD(SALARY)} ÷ {(lead.rpp / 100).toFixed(3)}
                    </MaskLine>
                  </div>
                </MotionBlur>
              )}

              {/* dollars + coins (10-15s) */}
              {frame >= T.dollars && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 410,
                    transformOrigin: '0% 0%',
                    transform: `scale(${1 - 0.42 * compact})`,
                    opacity: 1 - 0.25 * compact,
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'flex-end', gap: 30}}>
                    <div>
                      <Count to={lead.display} start={T.dollars} duration={COUNT_DUR} size={tie ? 110 : 128} color={C.mint} glow={14} />
                      {/* follow-through: the gain rises into view once the wheels have settled */}
                      <div style={{marginTop: 8, fontFamily: F.display, fontWeight: 700, fontSize: 46, color: C.mint, opacity: 0.9, ...tabular}}>
                        <MaskLine start={T.dollars + COUNT_DUR - 4} dur={22}>
                          +{fmtUSD(Math.round(lead.extra / 100) * 100)}
                        </MaskLine>
                      </div>
                    </div>
                    <div style={{height: 300, display: 'flex', alignItems: 'flex-end', transform: 'scale(0.85)', transformOrigin: 'bottom left', opacity: coinFade}}>
                      <CoinStack count={coinCount} appearAt={T.dollars} refLineAt={10} />
                    </div>
                  </div>
                </div>
              )}

              {/* fact card (15-21s): arrives alone once the dollars have stepped back */}
              {hasFact && frame >= T.fact && (
                <MotionBlur dx={-120 * (factIn(frame) - factIn(frame - 1))} style={{position: 'absolute', left: 0, top: 560, width: 760}}>
                  <Glass
                    radius={22}
                    tint={C.text}
                    style={{
                      width: 760,
                      padding: '28px 34px',
                      transform: `translateX(${(1 - factIn(frame)) * 120}px)`,
                      opacity: ramp(frame, T.fact + 6, T.fact + 16, glide),
                    }}
                  >
                    <div style={{fontFamily: F.body, fontWeight: 500, fontSize: 40, lineHeight: 1.25, color: C.text}}>
                      <MaskWords text={lead.fact ?? ''} start={T.fact + 12} step={2} dur={18} />
                    </div>
                    <div style={{marginTop: 12, fontFamily: F.body, fontWeight: 500, fontSize: 24, color: C.muted}}>
                      <MaskLine start={T.fact + 12 + Math.min(30, (lead.fact ?? '').split(' ').length * 2) + 6}>Source: {lead.factSource}</MaskLine>
                    </div>
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

/** TIE stamp: slams down from large with a hard overshoot. Mint, like everything else on the frame. */
const TieStamp: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
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
      TIE
    </div>
  );
};
