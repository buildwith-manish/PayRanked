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
import voLayout from '../audio/vo-layout.json';
import {byName, fmtUSD, gap, SALARY} from '../data';
import {SHOT_SECONDS} from '../timeline';
import {glide, ramp, roll, slam, snap, tween} from '../motion';
import {C, F, W, clamp, mix, sec} from '../theme';
import {fovFor} from '../three/camera';
import {useLayout} from '../layout';
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
export const HEAD2_START = sec(voLayout.shot1.head2); // "One state does the opposite." on "One lives in Arkansas" (src/audio/vo-layout.json)
export const HEAD2_LEAVE = sec(voLayout.shot1.head2Leave);
export const BRACKET_START = sec(voLayout.shot1.bracket); // the bracket draws, then the gap slams in
export const SLAM = BRACKET_START + 24;
export const REST_START = sec(voLayout.shot1.rest); // California and the "?" step back so the gap is the only bright thing
export const REST2_START = sec(voLayout.shot1.rest2); // everything but the chips steps back
export const CHIPS_START = sec(voLayout.shot1.chips);

/**
 * Where everything sits. `land` is the 16:9 split (the "?" on the left half, California on the right). `vert` is the 9:16
 * Shorts layout: the same two halves stacked, "?" on top and California underneath, with the headline above them, the gap
 * and the chips in the middle of the frame, and everything inside the Shorts safe area (150 px from the top, 380 px from the
 * bottom). The beats are the same in both; only the places change.
 */
const PLACE = {
  land: {
    cardW: 640, cardH: 180, odo: 112,
    cardYA: 610, cardYB: 610, // top of the mystery card and of California's card
    qTop: 70, qFont: 380, labelTopA: 515, labelTopB: 515, labelFont: 64, // the "?" and the ONE STATE / CALIFORNIA labels
    headTop: 44, headFont: 46, headNoWrap: true,
    explainTop: 830, explainFont: 44,
    gapTop: 500, gapW: 660, gapSize: 132, bracket: 'M 830 680 v 40 M 830 700 H 1090 M 1090 680 v 40',
    moreTop: 730, moreFont: 40, tagTop: 780, tagFont: 32, chipsTop: 860, chipSize: 44,
    coin: {left: W - 96 - 310, top: 500 - 404},
    splitY: 0,
  },
  vert: {
    cardW: 780, cardH: 200, odo: 132,
    cardYA: 690, cardYB: 1290,
    qTop: 292, qFont: 330, labelTopA: 585, labelTopB: 1215, labelFont: 76,
    headTop: 160, headFont: 58, headNoWrap: false, // 58 px keeps both headlines left of the watermark at x~985; lineHeight 1.25 (was 1.08) so the hidden mask words do not leave slivers at the top
    explainTop: 906, explainFont: 42, // one line in the 66 px strip between the mystery card and the top of California
    gapTop: 720, gapW: 900, gapSize: 170, bracket: 'M 300 916 v 44 M 300 938 H 780 M 780 916 v 44',
    moreTop: 1010, moreFont: 50, tagTop: 1116, tagFont: 44, chipsTop: 1270, chipSize: 50,
    coin: {left: 980 - 310, top: 1205 - 404},
    splitY: 890,
  },
};
const CARD_X = {land: {a: LX, b: RX}, vert: {a: 540, b: 540}};
const SHAPE_CY_V = 1068; // screen y of California's centre in the vertical column

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
  const {vertical: V} = useLayout();
  const P = V ? PLACE.vert : PLACE.land;
  const enterAt = startAt - 4;
  const x = (V ? CARD_X.vert : CARD_X.land)[side < 0 ? 'a' : 'b'];
  const yAt = (t: number) => (side < 0 ? P.cardYA : P.cardYB) + (1 - tween(t, enterAt, 22, snap)) * 50;
  const y = yAt(f);
  const py = yAt(f - 1);
  const enter = tween(f, enterAt, 22, snap);
  const v = valueAt(f, target, startAt);
  const pv = valueAt(f - 1, target, startAt);
  const since = f - (startAt + COUNT_DUR);
  const sideColor = side < 0 ? C.mint : C.red;
  const color = mix(C.text, sideColor, clamp((f - (startAt + 24)) / 16));
  return (
    <MotionBlur dx={0} dy={y - py} shutter={0.6} cap={46} style={{position: 'absolute', left: x - P.cardW / 2, top: y + Math.sin(f / 22 + side) * 3, width: P.cardW, height: P.cardH, pointerEvents: 'none'}}>
      <Glass
        radius={28}
        tint={sideColor}
        strength={1.1}
        glow={26}
        style={{
          width: P.cardW,
          height: P.cardH,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: ramp(f, enterAt, enterAt + 8, glide),
          transform: `scale(${0.86 + 0.14 * enter})`,
        }}
      >
        <Odometer value={v} prevValue={pv} sinceLanding={since} size={P.odo} color={color} prefix="$" />
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
const MYSTERY_SIZE = 112; // must match Card's Odometer size prop (PLACE.land.odo); the vertical layout uses PLACE.vert.odo for both
const MYSTERY_LINE = 1.15; // must match Odometer's LINE constant
// Arkansas has 6 digits (115,000) — digit pattern: 1 _ _ , _ _ _ → slots: [d, d, d, ',', d, d, d]
// We render the digits in the same left-to-right order the Odometer does: most-significant first.
const MYSTERY_SLOTS: Array<'digit' | 'comma'> = ['digit', 'digit', 'digit', 'comma', 'digit', 'digit', 'digit'];

const MysteryCard: React.FC = () => {
  const f = useDesignFrame();
  const {vertical: V} = useLayout();
  const P = V ? PLACE.vert : PLACE.land;
  const mysterySize = V ? PLACE.vert.odo : MYSTERY_SIZE;
  const enterAt = SHAPE_START + 8;
  const enterAt4 = enterAt - 4; // match Card's `startAt - 4` offset so the two cards enter on the same curve
  const yAt = (t: number) => P.cardYA + (1 - tween(t, enterAt4, 22, snap)) * 50;
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
    <MotionBlur dx={0} dy={y - py} shutter={0.6} cap={46} style={{position: 'absolute', left: (V ? CARD_X.vert.a : LX) - P.cardW / 2, top: y + Math.sin(f / 22) * 3, width: P.cardW, height: P.cardH, pointerEvents: 'none'}}>
      <Glass
        radius={28}
        tint={C.mint}
        strength={1.1}
        glow={18 + 8 * Math.sin(f / 14)}
        style={{
          width: P.cardW,
          height: P.cardH,
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
            fontSize: mysterySize,
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
  const {w: W, h: H, vertical: V} = useLayout();
  const P = V ? PLACE.vert : PLACE.land;
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
            {V ? (
              <>
                <div style={{position: 'absolute', left: 0, top: 0, width: W, height: P.splitY, background: C.emerald, opacity: splitTint * (1 - rest)}} />
                <div style={{position: 'absolute', left: 0, top: P.splitY, width: W, height: H - P.splitY, background: C.red, opacity: splitTint * (1 - rest)}} />
              </>
            ) : (
              <>
                <div style={{position: 'absolute', left: 0, top: 0, width: W / 2, height: H, background: C.emerald, opacity: splitTint * (1 - rest)}} />
                <div style={{position: 'absolute', left: W / 2, top: 0, width: W / 2, height: H, background: C.red, opacity: splitTint * (1 - rest)}} />
              </>
            )}
            {f >= SEAM_START && (
              <div
                style={{
                  position: 'absolute',
                  // landscape: the seam draws down the middle; vertical: it draws across the line between the two halves
                  ...(V
                    ? {left: (W * (1 - seamP)) / 2, top: P.splitY - 3, width: W * seamP, height: 6}
                    : {left: W / 2 - 3, top: (H * (1 - seamP)) / 2, width: 6, height: H * seamP}),
                  background: '#fff',
                  boxShadow: `0 0 40px 10px ${C.mint}`,
                  opacity: interpolate(f, [SHAPE_START, SHAPE_START + 42], [1, 0.25], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * (1 - rest),
                }}
              />
            )}

            {/* the states and everything that belongs to them: one group, so it can step back as a whole */}
            <div style={{position: 'absolute', inset: 0, opacity: V ? 1 - 0.9 * rest - 0.1 * rest2 : 1 - 0.72 * rest - 0.2 * rest2, filter: rest > 0 ? `grayscale(${0.6 * rest})` : undefined}}>
              {f >= SHAPE_START && (
                <ThreeCanvas
                  width={W}
                  height={H}
                  shadows
                  camera={{fov: V ? fovFor(H) : 32, near: 60, far: 9000, position: [0, 0, 1900]}}
                  gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}}
                  style={{position: 'absolute', inset: 0}}
                >
                  <Shot1Scene frame={f} shapeStart={SHAPE_START} lxPx={LX} rxPx={V ? CARD_X.vert.b : RX} riseB={COUNT_START} vertical={V} cyPx={SHAPE_CY_V} />
                </ThreeCanvas>
              )}
              {f >= SHAPE_START && (
                <>
                  {/* the empty half: a "?" where the winner would stand. Its name is not shown until #1. */}
                  <div style={{position: 'absolute', left: (V ? CARD_X.vert.a : LX) - 300, width: 600, top: P.qTop, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: P.qFont, lineHeight: 1, color: C.mint, opacity: 0.85 * ramp(f, SHAPE_START + 6, SHAPE_START + 26, glide), textShadow: `0 0 60px ${C.mint}77`, transform: `translateY(${Math.sin(f / 26) * 6}px)`}}>
                    ?
                  </div>
                  <div style={{position: 'absolute', left: (V ? CARD_X.vert.a : LX) - 300, width: 600, top: P.labelTopA, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: P.labelFont, color: C.mint}}>
                    <Letters text="ONE STATE" start={SHAPE_START + 12} stagger={2} />
                  </div>
                  <div style={{position: 'absolute', left: (V ? CARD_X.vert.b : RX) - 300, width: 600, top: P.labelTopB, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: P.labelFont, color: C.red}}>
                    <Letters text="CALIFORNIA" start={SHAPE_START + 12} stagger={2} />
                  </div>
                </>
              )}

              {/* the payoff: both results, at once */}
              <MysteryCard />
              <Card side={1} target={cal.display} startAt={COUNT_START} />

              {/* coin stacks arrive with the counts, not before, and grow / shrink with the value */}
              {f >= COUNT_START - 4 && (
                <div style={{position: 'absolute', left: P.coin.left, top: P.coin.top, transform: 'scale(0.6)', transformOrigin: 'right bottom'}}>
                  <CoinStack count={coinsFor(valueAt(f, cal.display, COUNT_START))} appearAt={COUNT_START} color={C.red} />
                </div>
              )}
            </div>

            {/* 2-4.6s: the claim, written across the top. Only California's number is shown. */}
            <div style={{position: 'absolute', left: V ? 100 : 0, right: V ? 100 : 0, top: P.headTop, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: P.headFont, lineHeight: V ? 1.25 : undefined, color: C.text, whiteSpace: P.headNoWrap ? 'nowrap' : 'normal'}}>
              <MaskWords
                text={`${fmtUSD(SALARY)} in California feels like ${fmtUSD(cal.display)}`}
                start={HEAD_START}
                step={3}
                leaveAt={sec(4.6)}
                wordStyle={(_, i) => (i === 2 || i >= 5 ? {color: C.red} : undefined)}
              />
            </div>

            {/* 4.8-9s: the turn. The question the whole video answers. */}
            <div style={{position: 'absolute', left: V ? 100 : 0, right: V ? 100 : 0, top: P.headTop, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: P.headFont, lineHeight: V ? 1.25 : undefined, color: C.text, whiteSpace: P.headNoWrap ? 'nowrap' : 'normal'}}>
              <MaskWords text="One state does the opposite." start={HEAD2_START} step={4} leaveAt={HEAD2_LEAVE} wordStyle={(_, i) => (i >= 3 ? {color: C.mint} : undefined)} />
            </div>

            {/* 3.4-5.6s: the one-line reason, quiet and neutral, then it drops behind its line before the gap */}
            <div style={{position: 'absolute', left: V ? 56 : 0, right: V ? 56 : 0, top: P.explainTop, textAlign: 'center', fontFamily: F.display, fontWeight: 500, fontSize: P.explainFont, color: C.muted}}>
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
                      d={P.bracket}
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
                      d={P.bracket}
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
                    left: W / 2 - P.gapW / 2,
                    width: P.gapW,
                    top: P.gapTop,
                    display: 'flex',
                    justifyContent: 'center',
                    transform: `scale(${gapScale(f)})`,
                    filter: gapBlur > 0.4 ? `blur(${gapBlur}px)` : undefined,
                    opacity: Math.min(1, gapP(f) * 3),
                  }}
                >
                  <Count to={Math.round(g.amount / 1000)} from={0} start={SLAM} duration={24} size={P.gapSize} color={C.amber} glow={9} prefix="≈ $" suffix="K" />
                </div>
              )}
            </div>

            {f >= SLAM + 20 && (
              <div style={{position: 'absolute', left: V ? 56 : 0, right: V ? 56 : 0, top: P.moreTop, textAlign: 'center', fontFamily: F.display, fontWeight: 500, fontSize: P.moreFont, lineHeight: V ? 1.12 : undefined, color: C.text, opacity: 1 - 0.7 * rest2}}>
                <MaskWords text="more buying power than California" start={SLAM + 20} step={4} />
              </div>
            )}

            {/* Tagline: appears under the gap, above the chips */}
            {f >= SLAM + 36 && (
              <div style={{position: 'absolute', left: 0, right: 0, top: P.tagTop, textAlign: 'center', fontFamily: F.body, fontWeight: 500, fontSize: P.tagFont, color: C.muted, opacity: (1 - 0.7 * rest2) * ramp(f, SLAM + 36, SLAM + 50, glide)}}>
                <MaskWords text="where your money goes further" start={SLAM + 36} step={3} />
              </div>
            )}

            {/* 10-15s: three chips close the door on the obvious guesses. Neither state is in the top 10. */}
            <div style={{position: 'absolute', left: V ? 40 : 0, right: V ? 40 : 0, top: P.chipsTop, display: 'flex', flexWrap: V ? 'wrap' : 'nowrap', justifyContent: 'center', gap: V ? 26 : 28}}>
              <Chip text="NOT TEXAS" delay={CHIPS_START} size={P.chipSize} />
              <Chip text="NOT FLORIDA" delay={CHIPS_START + 14} size={P.chipSize} />
              <Chip text="TOP 10, RANKED" delay={CHIPS_START + 28} color={C.amber} size={P.chipSize} pulse />
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
