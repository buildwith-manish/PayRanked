import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
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
import {MaskWords} from '../components/MaskText';
import {byName, fmtUSD, gap, SALARY} from '../data';
import {SHOT_SECONDS} from '../timeline';
import {glide, ramp, roll, slam, snap, tween} from '../motion';
import {C, F, H, W, clamp, mix, sec} from '../theme';
import {K, useDesignFrame} from '../clock';

export const SHOT1_FRAMES = sec(SHOT_SECONDS.shot1);

export const LX = 480; // centre of the left half
export const RX = 1440; // centre of the right half
export const SEAM_START = 2; // a seam draws down the black frame, then California lands on it
export const SHAPE_START = 18;
export const COUNT_START = 30; // California's number rolls straight away
export const COUNT_DUR = 60;
export const HEAD_START = sec(2.2); // "$100,000 in California feels like $90,300"
export const EXPLAIN_START = sec(3.4); // "Same $100,000 salary. Different prices."
export const HEAD2_START = sec(4.8); // "One state does the opposite."
export const BRACKET_START = sec(6); // the bracket draws, then the gap slams in
export const SLAM = BRACKET_START + 24;
export const REST_START = sec(5.6); // California and the "?" step back so the gap is the only bright thing
export const REST2_START = sec(9.2); // everything but the chips steps back
export const CHIPS_START = sec(10);

/** Value on a card: 0 to the result in one roll. A pure function of the frame so the odometer can also be given last frame's value, for the blur on its fast wheels. */
export const valueAt = (f: number, target: number, startAt: number) => target * tween(f, startAt, COUNT_DUR, roll);

/**
 * A question, not an answer (15 s; it was 30 s and named the winner at second 3, which spent the countdown).
 * 0-4s: California lands on the right and its number rolls down to $90,300 (costly, red); the left half is a "?".
 * 2-6s: the claim and the one-line reason. 5-6.5s: "One state does the opposite." 6-10s: the gap slams in alone,
 * about $25K more than California, and the winner stays hidden. 10-15s: three chips close the door on the obvious
 * guesses (Texas, Florida: neither is in the top 10) and promise the ranked list.
 * Accent rule: mint and red are one semantic pair (cheap and costly) and only exist while the states are the
 * subject; the gap is amber on its own; the chips are neutral except the last.
 */
const Card: React.FC<{side: -1 | 1; target: number; startAt: number}> = ({side, target, startAt}) => {
  const f = useDesignFrame();
  const enterAt = startAt - 4;
  const x = side < 0 ? LX : RX;
  const yAt = (t: number) => 610 + (1 - tween(t, enterAt, 22, snap)) * 50;
  const y = yAt(f);
  const py = yAt(f - 1);
  const enter = tween(f, enterAt, 22, snap);
  const v = valueAt(f, target, startAt);
  const pv = valueAt(f - 1, target, startAt);
  const since = f - (startAt + COUNT_DUR);
  const sideColor = side < 0 ? C.mint : C.red;
  const color = mix(C.text, sideColor, clamp((f - (startAt + 24)) / 16));
  return (
    <MotionBlur dx={0} dy={y - py} shutter={0.6} cap={46} style={{position: 'absolute', left: x - 320, top: y + Math.sin(f / 22 + side) * 3, width: 640, height: 180, pointerEvents: 'none'}}>
      <Glass
        radius={28}
        tint={sideColor}
        strength={1.1}
        glow={26}
        style={{
          width: 640,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: ramp(f, enterAt, enterAt + 8, glide),
          transform: `scale(${0.86 + 0.14 * enter})`,
        }}
      >
        <Odometer value={v} prevValue={pv} sinceLanding={since} size={112} color={color} prefix="$" />
      </Glass>
    </MotionBlur>
  );
};

/**
 * The left half: the winner's number, withheld. Structurally identical to Card — same Glass container, same
 * MotionBlur entrance, same size={112} Odometer layout — but each digit slot shows a "?" instead of a rolling
 * wheel. Digit count matches the winner (Arkansas: 6 digits → "$1??,???") so the two cards occupy the same
 * width on screen and the reveal of the real number at #1 is a true in-place substitution, not a resize.
 *
 * The "?" slots are built to match the Odometer's internal geometry exactly:
 *   - font: F.display, weight 700, size 112 (= Odometer's `size` prop)
 *   - each digit slot: width 1ch, height LINE em (1.15 em), overflow hidden, tabular-nums
 *   - comma slots: width 0.3ch, same height — identical to Odometer's comma divs
 *   - same fade mask (transparent → opaque → transparent) so the "?" sits in the same window the real digit would
 * A slow sine breathe (0.8 + 0.2 * sin) is applied per-slot so the question marks pulse individually rather than
 * the whole string flashing, which read as a glitch at 30 fps.
 */
const MYSTERY_SIZE = 112; // must match Card's Odometer size prop
const MYSTERY_LINE = 1.15; // must match Odometer's LINE constant
// Arkansas has 6 digits (115,000) — digit pattern: 1 _ _ , _ _ _ → slots: [d, d, d, ',', d, d, d]
// We render the digits in the same left-to-right order the Odometer does: most-significant first.
const MYSTERY_SLOTS: Array<'digit' | 'comma'> = ['digit', 'digit', 'digit', 'comma', 'digit', 'digit', 'digit'];

const MysteryCard: React.FC = () => {
  const f = useDesignFrame();
  const enterAt = SHAPE_START + 8;
  const enterAt4 = enterAt - 4; // match Card's `startAt - 4` offset so the two cards enter on the same curve
  const yAt = (t: number) => 610 + (1 - tween(t, enterAt4, 22, snap)) * 50;
  const y = yAt(f);
  const py = yAt(f - 1);
  const enter = tween(f, enterAt4, 22, snap);

  const slots = MYSTERY_SLOTS.map((kind, i) => {
    if (kind === 'comma') {
      return (
        <div
          key={`mc${i}`}
          style={{
            width: '0.3ch',
            textAlign: 'center',
            height: `${MYSTERY_LINE}em`,
            lineHeight: `${MYSTERY_LINE}em`,
            opacity: 0.6,
          }}
        >
          ,
        </div>
      );
    }
    // Per-slot breathe: stagger the phase slightly so the marks pulse in a gentle ripple, not a unison flash.
    const breathe = 0.8 + 0.2 * Math.sin(f / 9 + i * 0.4);
    return (
      <div
        key={`md${i}`}
        style={{
          width: '1ch',
          height: `${MYSTERY_LINE}em`,
          lineHeight: `${MYSTERY_LINE}em`,
          textAlign: 'center',
          overflow: 'hidden',
          // same fade window as Odometer's Wheel so the glyph sits in the same visible region
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)',
          opacity: breathe,
        }}
      >
        ?
      </div>
    );
  });

  return (
    <MotionBlur dx={0} dy={y - py} shutter={0.6} cap={46} style={{position: 'absolute', left: LX - 320, top: y + Math.sin(f / 22) * 3, width: 640, height: 180, pointerEvents: 'none'}}>
      <Glass
        radius={28}
        tint={C.mint}
        strength={1.1}
        glow={18 + 8 * Math.sin(f / 14)}
        style={{
          width: 640,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: ramp(f, enterAt, enterAt + 8, glide),
          transform: `scale(${0.86 + 0.14 * enter})`,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: MYSTERY_SIZE,
            color: C.mint,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            filter: `drop-shadow(0 0 18px ${C.mint}88)`,
          }}
        >
          <span style={{lineHeight: `${MYSTERY_LINE}em`}}>$</span>
          {slots}
        </span>
      </Glass>
    </MotionBlur>
  );
};

export const Shot1: React.FC = () => {
  const f = useDesignFrame();
  // the gap is the real, unrounded Arkansas-to-California gap, but only the amount is shown: the name stays hidden until #1
  const g = gap('Arkansas', 'California');
  const cal = byName('California');

  // camera shake as each count lands (a damped hit, not a loop), then the 6% punch-in on the slam
  const shakeAt = (land: number) => (f >= land ? Math.exp(-(f - land) / 6) * 10 : 0);
  const shake = shakeAt(COUNT_START + COUNT_DUR);
  const sx = Math.sin(f * 2.3) * shake;
  const sy = Math.cos(f * 3.1) * shake * 0.7;
  const punch = f >= SLAM ? 1 + 0.06 * Math.exp(-(f - SLAM) / 10) : 1;

  // 0-1s: a seam wipes the black frame into a split, and the states land on it
  const seamP = tween(f, SEAM_START, SHAPE_START - SEAM_START, glide);
  const splitTint = clamp((f - SHAPE_START) / 20) * 0.1;

  // beats: states step back for the gap, then everything but the chips steps back
  const rest = ramp(f, REST_START, REST_START + 30, glide);
  const rest2 = ramp(f, REST2_START, REST2_START + 24, glide);
  const dimLineP = tween(f, BRACKET_START, 24, glide);
  const gapP = (t: number) => tween(t, SLAM, 22, slam);
  const gapScale = (t: number) => 1 + 1.0 * (1 - gapP(t));
  const gapBlur = Math.min(14, Math.abs(gapScale(f) - gapScale(f - 1)) * (18 / K));

  return (
    <Aberration at={[SHAPE_START, COUNT_START + COUNT_DUR, SLAM]} peak={8}>
      <AbsoluteFill style={{backgroundColor: '#000'}}>
        <Background drift>
          <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${punch})`}}>
            {/* The cold open used to draw two more grids on top of Background's own (a 160 px SVG one and a 3D floor grid),
                which read as doubled lines. Background's grid is now the only one, like the rest of the video. */}

            {/* split tints and seam */}
            <div style={{position: 'absolute', left: 0, top: 0, width: W / 2, height: H, background: C.emerald, opacity: splitTint * (1 - rest)}} />
            <div style={{position: 'absolute', left: W / 2, top: 0, width: W / 2, height: H, background: C.red, opacity: splitTint * (1 - rest)}} />
            {f >= SEAM_START && (
              <div
                style={{
                  position: 'absolute',
                  left: W / 2 - 3,
                  top: (H * (1 - seamP)) / 2,
                  width: 6,
                  height: H * seamP,
                  background: '#fff',
                  boxShadow: `0 0 40px 10px ${C.mint}`,
                  opacity: interpolate(f, [SHAPE_START, SHAPE_START + 42], [1, 0.25], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * (1 - rest),
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
                  <Shot1Scene frame={f} shapeStart={SHAPE_START} lxPx={LX} rxPx={RX} riseB={COUNT_START} />
                </ThreeCanvas>
              )}
              {f >= SHAPE_START && (
                <>
                  {/* the empty half: a "?" where the winner would stand. Its name is not shown until #1. */}
                  <div style={{position: 'absolute', left: LX - 300, width: 600, top: 70, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 380, lineHeight: 1, color: C.mint, opacity: 0.85 * ramp(f, SHAPE_START + 6, SHAPE_START + 26, glide), textShadow: `0 0 60px ${C.mint}77`, transform: `translateY(${Math.sin(f / 26) * 6}px)`}}>
                    ?
                  </div>
                  <div style={{position: 'absolute', left: LX - 300, width: 600, top: 515, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 64, color: C.mint}}>
                    <Letters text="ONE STATE" start={SHAPE_START + 12} stagger={2} />
                  </div>
                  <div style={{position: 'absolute', left: RX - 300, width: 600, top: 515, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 64, color: C.red}}>
                    <Letters text="CALIFORNIA" start={SHAPE_START + 12} stagger={2} />
                  </div>
                </>
              )}

              {/* the payoff: both results, at once */}
              <MysteryCard />
              <Card side={1} target={cal.display} startAt={COUNT_START} />

              {/* coin stacks arrive with the counts, not before, and grow / shrink with the value */}
              {f >= COUNT_START - 4 && (
                <div style={{position: 'absolute', left: W - 96 - 310, top: 500 - 404, transform: 'scale(0.6)', transformOrigin: 'right bottom'}}>
                  <CoinStack count={coinsFor(valueAt(f, cal.display, COUNT_START))} appearAt={COUNT_START} color={C.red} />
                </div>
              )}
            </div>

            {/* 2-4.6s: the claim, written across the top. Only California's number is shown. */}
            <div style={{position: 'absolute', left: 0, right: 0, top: 44, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 46, color: C.text, whiteSpace: 'nowrap'}}>
              <MaskWords
                text={`${fmtUSD(SALARY)} in California feels like ${fmtUSD(cal.display)}`}
                start={HEAD_START}
                step={3}
                leaveAt={sec(4.6)}
                wordStyle={(_, i) => (i === 2 || i >= 5 ? {color: C.red} : undefined)}
              />
            </div>

            {/* 4.8-9s: the turn. The question the whole video answers. */}
            <div style={{position: 'absolute', left: 0, right: 0, top: 44, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 46, color: C.text, whiteSpace: 'nowrap'}}>
              <MaskWords text="One state does the opposite." start={HEAD2_START} step={4} leaveAt={sec(9)} wordStyle={(_, i) => (i >= 3 ? {color: C.mint} : undefined)} />
            </div>

            {/* 3.4-5.6s: the one-line reason, quiet and neutral, then it drops behind its line before the gap */}
            <div style={{position: 'absolute', left: 0, right: 0, top: 830, textAlign: 'center', fontFamily: F.display, fontWeight: 500, fontSize: 44, color: C.muted}}>
              <MaskWords text={`Same ${fmtUSD(SALARY)} salary. Different prices.`} start={EXPLAIN_START} step={5} leaveAt={sec(5.6)} />
            </div>

            {/* 6-10s: the gap is the only bright thing on the frame. Amber, alone. It says how much further, never where. */}
            <div style={{position: 'absolute', inset: 0, opacity: 1 - 0.7 * rest2}}>
              {/* Bracket glow: starts breathing once the draw completes (dimLineP ≥ 1), intensifies on the slam,
                  then settles into a slow pulse at the same 14-frame rhythm as Chip's pulse glow. The drop-shadow
                  on the wrapper div is a second amber halo outside the SVG overflow boundary. */}
              {(() => {
                const drawn = clamp((dimLineP - 0.85) / 0.15); // 0→1 in the last 15% of the draw
                const postSlam = clamp((f - SLAM) / 8);        // 0→1 over 8 frames after slam
                const breathe = drawn > 0 ? 0.6 + 0.4 * Math.sin(f / 14) : 0;
                // Glow radius: grows as it draws, jumps on the slam, then breathes
                // was 8 + 4*breathe and a 10 px slam bump: the three stacked amber glows (drop-shadow, blurred copy, text) bloomed into a haze
                const glowR = drawn * (3 + 2 * breathe) + postSlam * 4 * Math.exp(-(f - SLAM) / 12);
                const glowOpacity = drawn * (0.75 + 0.25 * breathe);
                return (
                  <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: glowR > 0.5 ? `drop-shadow(0 0 ${glowR}px ${C.amber})` : undefined}}>
                    <defs>
                      <filter id="bracketGlow" x="-80%" y="-400%" width="260%" height="900%" colorInterpolationFilters="sRGB">
                        <feGaussianBlur stdDeviation={glowR * 1.4} result="blur" />
                        <feComposite in="blur" in2="SourceGraphic" operator="over" />
                      </filter>
                    </defs>
                    {/* glow layer: same path, wider, blurred amber — drawn in sync with the main stroke */}
                    <path
                      d="M 830 680 v 40 M 830 700 H 1090 M 1090 680 v 40"
                      fill="none"
                      stroke={C.amber}
                      strokeWidth={14}
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1 - dimLineP}
                      opacity={glowOpacity * 0.3}
                      filter="url(#bracketGlow)"
                    />
                    {/* main stroke: thickened from 7 to 11px */}
                    <path
                      d="M 830 680 v 40 M 830 700 H 1090 M 1090 680 v 40"
                      fill="none"
                      stroke={C.amber}
                      strokeWidth={11}
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1 - dimLineP}
                    />
                  </svg>
                );
              })()}
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
                  <Count to={Math.round(g.amount / 1000)} from={0} start={SLAM} duration={24} size={132} color={C.amber} glow={9} prefix="≈ $" suffix="K" />
                </div>
              )}
            </div>

            {f >= SLAM + 20 && (
              <div style={{position: 'absolute', left: 0, right: 0, top: 730, textAlign: 'center', fontFamily: F.display, fontWeight: 500, fontSize: 40, color: C.text, opacity: 1 - 0.7 * rest2}}>
                <MaskWords text="more buying power than California" start={SLAM + 20} step={4} />
              </div>
            )}

            {/* 10-15s: three chips close the door on the obvious guesses. Neither state is in the top 10. */}
            <div style={{position: 'absolute', left: 0, right: 0, top: 820, display: 'flex', justifyContent: 'center', gap: 28}}>
              <Chip text="NOT TEXAS" delay={CHIPS_START} size={44} />
              <Chip text="NOT FLORIDA" delay={CHIPS_START + 14} size={44} />
              <Chip text="TOP 10, RANKED" delay={CHIPS_START + 28} color={C.amber} size={44} pulse />
            </div>
          </AbsoluteFill>
        </Background>

        <SourceTag opacity={clamp((f - 60) / 15)} />
        <Flash at={SLAM} duration={8} peak={0.6} />
        <Flash at={SHAPE_START} duration={6} peak={0.5} />
        {/* fade in from black at the start; fade to navy at the end (matches the main background, not dead black) */}
        <AbsoluteFill style={{opacity: f >= SHOT1_FRAMES - 6 ? 1 : interpolate(f, [0, 8], [1, 0], {extrapolateRight: 'clamp'}), pointerEvents: 'none', background: 'linear-gradient(160deg, #143A66 0%, #0A1D38 55%, #050E1D 100%)'}} />
      </AbsoluteFill>
    </Aberration>
  );
};
