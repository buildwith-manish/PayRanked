import React, {useId} from 'react';
import {C, F} from '../theme';
import {blurLength} from '../motion';

const LINE = 1.15; // height of one digit slot, in em
const ROLL_WINDOW = 0.1; // a wheel advances while the wheel below it covers its last 10%

const safeId = (s: string) => 'od' + s.replace(/[^a-zA-Z0-9_-]/g, '_');

/** Continuous position (in digits) of the wheel at decimal place `i` for value `v`. Place 0 turns freely; higher
 *  places only turn while the wheel below them rolls over, like a mechanical odometer. */
const wheelPos = (v: number, i: number) => {
  const x = v / Math.pow(10, i);
  const whole = Math.floor(x);
  if (i === 0) return x;
  const frac = x - whole;
  const roll = Math.min(1, Math.max(0, (frac - (1 - ROLL_WINDOW)) / ROLL_WINDOW));
  // smoothstep so the wheel eases in and out of its turn
  return whole + roll * roll * (3 - 2 * roll);
};

const Wheel: React.FC<{pos: number; prevPos: number; size: number}> = ({pos, prevPos, size}) => {
  const id = safeId(useId());
  const base = Math.floor(pos);
  const speed = Math.abs(pos - prevPos); // digits per frame
  const blur = blurLength(speed * size * LINE, 0.5, 40, 0.8);
  const cells: React.ReactNode[] = [];
  for (let k = base - 1; k <= base + 2; k++) {
    const d = ((k % 10) + 10) % 10;
    cells.push(
      <div
        key={k}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: `${LINE}em`,
          lineHeight: `${LINE}em`,
          textAlign: 'center',
          transform: `translateY(${(k - pos) * LINE}em)`,
        }}
      >
        {d}
      </div>
    );
  }
  return (
    <div
      style={{
        position: 'relative',
        width: '1ch',
        height: `${LINE}em`,
        overflow: 'hidden',
        // digits fade out at the top and bottom edge of the slot, so they roll out of a window rather than being cut
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)',
      }}
    >
      {blur > 0 && (
        <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
          <defs>
            <filter id={id} x="-10%" y="-60%" width="120%" height="220%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation={`0 ${blur}`} />
            </filter>
          </defs>
        </svg>
      )}
      <div style={{position: 'absolute', inset: 0, filter: blur > 0 ? `url(#${id})` : undefined}}>{cells}</div>
    </div>
  );
};

/**
 * Odometer: each digit is a wheel that rolls. Feed it any eased number (`value`) and `prevValue` (the value one frame
 * earlier, for the vertical blur of fast wheels). Digits appear as the number grows, commas follow.
 * `settle` is 0 before the number lands and then runs 0..1 over the next frames: the wheels give a small mechanical
 * overshoot and settle back, so the landing has weight.
 */
export const Odometer: React.FC<{
  value: number;
  prevValue?: number;
  /** frames since the number landed (negative or 0 = not landed yet) */
  sinceLanding?: number;
  size?: number;
  color?: string;
  prefix?: string;
  suffix?: string;
  glow?: number;
  style?: React.CSSProperties;
}> = ({value, prevValue, sinceLanding = 0, size = 120, color = C.text, prefix = '', suffix = '', glow = 0, style}) => {
  const v = Math.max(0, value);
  const pv = Math.max(0, prevValue ?? value);
  const places = Math.max(1, String(Math.floor(Math.round(v))).length);
  const t = Math.max(0, sinceLanding);
  // mechanical settle: a third of a digit of overshoot that rings out in about 14 frames
  const wobble = sinceLanding > 0 ? 0.3 * Math.exp(-t / 3.2) * Math.sin(t * 0.85) : 0;

  const nodes: React.ReactNode[] = [];
  for (let i = places - 1; i >= 0; i--) {
    const wob = i === 0 ? wobble : wobble * 0.55;
    nodes.push(<Wheel key={`w${i}`} pos={wheelPos(v, i) + wob} prevPos={wheelPos(pv, i)} size={size} />);
    if (i > 0 && i % 3 === 0) {
      nodes.push(
        <div key={`c${i}`} style={{width: '0.3ch', textAlign: 'center', height: `${LINE}em`, lineHeight: `${LINE}em`, opacity: 0.85}}>
          ,
        </div>
      );
    }
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: F.display,
        fontWeight: 700,
        fontSize: size,
        color,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        filter: glow > 0 ? `drop-shadow(0 0 ${glow}px ${color}88)` : undefined,
        ...style,
      }}
    >
      {prefix && <span style={{lineHeight: `${LINE}em`}}>{prefix}</span>}
      {nodes}
      {suffix && <span style={{lineHeight: `${LINE}em`}}>{suffix}</span>}
    </span>
  );
};
