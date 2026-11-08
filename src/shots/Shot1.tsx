import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Background} from '../components/Background';
import {ThreeCanvas} from '@remotion/three';
import {Aberration} from '../components/Grade';
import {Glass} from '../components/Glass';
import {Shot1Scene} from '../three/Shot1Scene';
import {CoinStack, coinsFor} from '../components/CoinStack';
import {Chip} from '../components/Chip';
import {Count} from '../components/Count';
import {Odometer} from '../components/Odometer';
import {MotionBlur} from '../components/MotionBlur';
import {Flash, Letters, SourceTag} from '../components/common';
import {byName, gap, SALARY} from '../data';
import {anticipate, glide, ramp, roll, slam, snap, tween} from '../motion';
import {C, F, H, W, clamp, mix, sec} from '../theme';

export const SHOT1_FRAMES = sec(30);

export const LX = 480; // centre of the left half
export const RX = 1440; // centre of the right half
export const COUNT_START = sec(6) + 10;
export const COUNT_DUR = 60;
export const SLAM = sec(14) + 24; // bracket draws first, then the gap slams in
export const SPLIT = 58; // the one number splits in two
export const SHAPE_START = 78;

/**
 * Value on a card: 0 to $100,000 on the first roll, then on to the result once the counts start. A pure function of
 * the frame so the odometer can also be given last frame's value, for the blur on its fast wheels.
 */
const valueAt = (f: number, target: number, startAt: number) =>
  f < startAt ? SALARY * tween(f, 6, 28, roll) : SALARY + (target - SALARY) * tween(f, startAt, COUNT_DUR, roll);

/**
 * One idea at a time. 0-2s: a single $100,000 in the middle of the frame. 2-6s: it splits in two (one number
 * becomes the two states). 6-14s: the counts land and the states climb and sink; coins follow. 14-20s: everything
 * steps back so the gap is the only bright thing on screen. 20-30s: the chips, on a quiet frame.
 * Accent rule: mint and red are one semantic pair (cheap and costly) and only exist while the states are the
 * subject; the gap is amber on its own; the chips are neutral except the last.
 */
const Card: React.FC<{side: -1 | 1; target: number; startAt: number}> = ({side, target, startAt}) => {
  const f = useCurrentFrame();
  const place = (t: number) => {
    const sp = tween(t, SPLIT, 34, anticipate); // squeeze together a touch, then burst apart
    const down = tween(t, SPLIT, 34, glide);
    return [W / 2 + side * (W / 2 - (side < 0 ? LX : W - RX)) * sp, 450 + 160 * down] as [number, number];
  };
  const [x, y] = place(f);
  const [px, py] = place(f - 1);
  const enter = tween(f, 4, 22, snap);
  const v = valueAt(f, target, startAt);
  const pv = valueAt(f - 1, target, startAt);
  const firstLand = 6 + 28;
  const secondLand = startAt + COUNT_DUR;
  const since = f >= secondLand ? f - secondLand : f - firstLand;
  const tone = clamp((f - sec(5.5)) / 10);
  const color = tone > 0 ? mix(C.text, side < 0 ? C.mint : C.red, tone) : C.text;
  const apart = f >= SPLIT + 12;
  if (side > 0 && f < SPLIT + 2) return null; // the second card only exists once the number splits
  return (
    <MotionBlur dx={x - px} dy={y - py} shutter={0.6} cap={46} style={{position: 'absolute', left: x - 320, top: y + Math.sin(f / 22 + side) * 3, width: 640, height: 180, pointerEvents: 'none'}}>
      <Glass
        radius={28}
        tint={apart ? (side < 0 ? C.mint : C.red) : C.text}
        strength={1.1}
        glow={apart ? 26 : 10}
        style={{
          width: 640,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: ramp(f, 4, 12, glide),
          transform: `scale(${0.86 + 0.14 * enter}) translateY(${(1 - enter) * 50}px)`,
        }}
      >
        <Odometer value={v} prevValue={pv} sinceLanding={since} size={112} color={color} prefix="$" />
      </Glass>
    </MotionBlur>
  );
};

export const Shot1: React.FC = () => {
  const f = useCurrentFrame();
  const g = gap('Arkansas', 'California');
  const ark = byName('Arkansas');
  const cal = byName('California');

  // camera shake as each count lands (a damped hit, not a loop), then the 6% punch-in on the slam
  const shakeAt = (land: number) => (f >= land ? Math.exp(-(f - land) / 6) * 10 : 0);
  const shake = shakeAt(COUNT_START + COUNT_DUR) + shakeAt(COUNT_START + 16 + COUNT_DUR);
  const sx = Math.sin(f * 2.3) * shake;
  const sy = Math.cos(f * 3.1) * shake * 0.7;
  const punch = f >= SLAM ? 1 + 0.06 * Math.exp(-(f - SLAM) / 10) : 1;

  // 0-2s: grid lines draw outward from the centre
  const gridP = tween(f, 0, 40, glide);
  const gridOpacity = interpolate(f, [30, 90], [0.3, 0.06], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lines: number[] = [];
  for (let k = -6; k <= 6; k++) lines.push(k * 160);

  // 2-6s: seam wipes the screen into a split
  const seamP = tween(f, 60, 18, glide);
  const splitTint = clamp((f - 70) / 20) * 0.1;

  // beats: states step back for the gap (14-20s), then everything but the chips steps back (20s on)
  const rest = ramp(f, sec(13.4), sec(14.4), glide);
  const rest2 = ramp(f, sec(19.2), sec(20), glide);
  const dimLineP = tween(f, sec(14), 24, glide);
  const gapP = (t: number) => tween(t, SLAM, 22, slam);
  const gapScale = (t: number) => 1 + 1.0 * (1 - gapP(t));
  const gapBlur = Math.min(14, Math.abs(gapScale(f) - gapScale(f - 1)) * 18);

  return (
    <Aberration at={[SHAPE_START, COUNT_START + COUNT_DUR, COUNT_START + 16 + COUNT_DUR, SLAM]} peak={8}>
      <AbsoluteFill style={{backgroundColor: '#000'}}>
        <Background drift>
          <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${punch})`}}>
            {/* grid draw-out */}
            <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: gridOpacity * (1 - 0.6 * rest)}}>
              {lines.map((d) => (
                <React.Fragment key={d}>
                  <line x1={W / 2 + d} y1={H / 2 - (H / 2) * gridP} x2={W / 2 + d} y2={H / 2 + (H / 2) * gridP} stroke={C.mint} strokeWidth={2} />
                  <line x1={W / 2 - (W / 2) * gridP} y1={H / 2 + d * 0.6} x2={W / 2 + (W / 2) * gridP} y2={H / 2 + d * 0.6} stroke={C.mint} strokeWidth={2} />
                </React.Fragment>
              ))}
            </svg>

            {/* split tints and seam */}
            <div style={{position: 'absolute', left: 0, top: 0, width: W / 2, height: H, background: C.emerald, opacity: splitTint * (1 - rest)}} />
            <div style={{position: 'absolute', left: W / 2, top: 0, width: W / 2, height: H, background: C.red, opacity: splitTint * (1 - rest)}} />
            {f >= 60 && (
              <div
                style={{
                  position: 'absolute',
                  left: W / 2 - 3,
                  top: (H * (1 - seamP)) / 2,
                  width: 6,
                  height: H * seamP,
                  background: '#fff',
                  boxShadow: `0 0 40px 10px ${C.mint}`,
                  opacity: interpolate(f, [78, 120], [1, 0.25], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * (1 - rest),
                }}
              />
            )}

            {/* the states and everything that belongs to them: one group, so it can step back as a whole */}
            <div style={{position: 'absolute', inset: 0, opacity: 1 - 0.72 * rest - 0.2 * rest2, filter: rest > 0 ? `grayscale(${0.6 * rest})` : undefined}}>
              {f >= SHAPE_START && (
                <ThreeCanvas
                  width={W}
                  height={H}
                  shadows
                  camera={{fov: 32, near: 60, far: 9000, position: [0, 0, 1900]}}
                  gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}}
                  style={{position: 'absolute', inset: 0}}
                >
                  <Shot1Scene frame={f} shapeStart={SHAPE_START} lxPx={LX} rxPx={RX} riseA={COUNT_START} riseB={COUNT_START + 16} />
                </ThreeCanvas>
              )}
              {f >= SHAPE_START && (
                <>
                  <div style={{position: 'absolute', left: LX - 300, width: 600, top: 515, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 64, color: C.mint}}>
                    <Letters text="ARKANSAS" start={SHAPE_START + 12} stagger={2} />
                  </div>
                  <div style={{position: 'absolute', left: RX - 300, width: 600, top: 515, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 64, color: C.red}}>
                    <Letters text="CALIFORNIA" start={SHAPE_START + 12} stagger={2} />
                  </div>
                </>
              )}

              {/* one $100,000 that splits into the two cards */}
              <Card side={-1} target={ark.display} startAt={COUNT_START} />
              <Card side={1} target={cal.display} startAt={COUNT_START + 16} />

              {/* coin stacks arrive with the counts, not before, and grow / shrink with the value */}
              {f >= COUNT_START - 4 && (
                <>
                  <div style={{position: 'absolute', left: 96, top: 500 - 404, transform: 'scale(0.6)', transformOrigin: 'left bottom'}}>
                    <CoinStack count={coinsFor(valueAt(f, ark.display, COUNT_START))} appearAt={COUNT_START} color={C.mint} />
                  </div>
                  <div style={{position: 'absolute', left: W - 96 - 310, top: 500 - 404, transform: 'scale(0.6)', transformOrigin: 'right bottom'}}>
                    <CoinStack count={coinsFor(valueAt(f, cal.display, COUNT_START + 16))} appearAt={COUNT_START + 16} color={C.red} />
                  </div>
                </>
              )}
            </div>

            {/* 14-20s: the gap is the only bright thing on the frame. Amber, alone. */}
            <div style={{position: 'absolute', inset: 0, opacity: 1 - 0.7 * rest2}}>
              <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
                <path
                  d="M 830 680 v 40 M 830 700 H 1090 M 1090 680 v 40"
                  fill="none"
                  stroke={C.amber}
                  strokeWidth={7}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - dimLineP}
                />
              </svg>
              {f >= SLAM && (
                <div
                  style={{
                    position: 'absolute',
                    left: W / 2 - 330,
                    width: 660,
                    top: 500,
                    display: 'flex',
                    justifyContent: 'center',
                    transform: `scale(${gapScale(f)})`,
                    filter: gapBlur > 0.4 ? `blur(${gapBlur}px)` : undefined,
                    opacity: Math.min(1, gapP(f) * 3),
                  }}
                >
                  <Count to={Math.round(g.amount / 1000)} from={0} start={SLAM} duration={24} size={132} color={C.amber} glow={22} prefix="≈ $" suffix="K" />
                </div>
              )}
            </div>

            {/* 20-30s: three chips, one after another, on a quiet frame. Neutral, except the last. */}
            <div style={{position: 'absolute', left: 0, right: 0, top: 870, display: 'flex', justifyContent: 'center', gap: 28}}>
              <Chip text="TOP 10 STATES" delay={sec(20)} size={36} />
              <Chip text="BOTTOM 5" delay={sec(20) + 14} size={36} />
              <Chip text="WHAT MOST VIDEOS LEAVE OUT" delay={sec(20) + 28} color={C.amber} size={36} pulse />
            </div>
          </AbsoluteFill>
        </Background>

        <SourceTag opacity={clamp((f - 40) / 15)} />
        <Flash at={SLAM} duration={8} peak={0.6} />
        <Flash at={SHAPE_START} duration={6} peak={0.5} />
        {/* fade in from black at the start; hard cut to black at the end */}
        <AbsoluteFill style={{background: '#000', opacity: f >= SHOT1_FRAMES - 4 ? 1 : interpolate(f, [0, 18], [1, 0], {extrapolateRight: 'clamp'}), pointerEvents: 'none'}} />
      </AbsoluteFill>
    </Aberration>
  );
};
