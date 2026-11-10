import React, {useId, useMemo, useRef} from 'react';
import {AbsoluteFill, random} from 'remotion';
import {H, W} from '../theme';
import {useDesignFrame} from '../clock';

/** Turn the soft bloom off if renders are too slow; it is the most expensive part of the grade. */
const BLOOM = true;

const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '_');

/**
 * One filmic grade for the whole video, as a single SVG filter: a bright-pass bloom, then an S-curve with lifted teal
 * shadows and warm highlights. Wrap each composition in this once (Root does it) so every shot gets the same look.
 */
export const Grade: React.FC<{children: React.ReactNode; dust?: boolean}> = ({children, dust = true}) => (
  <AbsoluteFill style={{isolation: 'isolate', backgroundColor: '#000'}}>
    <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
      <defs>
        <filter id="payGrade" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          {BLOOM && (
            <>
              {/* bright-pass: keeps only the hot, still-coloured parts */}
              <feColorMatrix in="SourceGraphic" type="matrix" values="2 0 0 0 -1.15  0 2 0 0 -1.15  0 0 2 0 -1.15  0 0 0 1 0" result="hot" />
              <feGaussianBlur in="hot" stdDeviation="7" result="bloomA" />
              <feGaussianBlur in="hot" stdDeviation="26" result="bloomB" />
              <feComponentTransfer in="bloomA" result="bloomA2">
                <feFuncR type="linear" slope="0.45" />
                <feFuncG type="linear" slope="0.45" />
                <feFuncB type="linear" slope="0.45" />
              </feComponentTransfer>
              <feComponentTransfer in="bloomB" result="bloomB2">
                <feFuncR type="linear" slope="0.7" />
                <feFuncG type="linear" slope="0.7" />
                <feFuncB type="linear" slope="0.7" />
              </feComponentTransfer>
              <feBlend in="SourceGraphic" in2="bloomA2" mode="screen" result="b1" />
              <feBlend in="b1" in2="bloomB2" mode="screen" result="lit" />
            </>
          )}
          <feComponentTransfer in={BLOOM ? 'lit' : 'SourceGraphic'}>
            <feFuncR type="table" tableValues="0.012 0.205 0.512 0.825 1" />
            <feFuncG type="table" tableValues="0.014 0.215 0.503 0.795 0.985" />
            <feFuncB type="table" tableValues="0.040 0.240 0.498 0.765 0.955" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
    <AbsoluteFill style={{filter: 'url(#payGrade)'}}>{children}</AbsoluteFill>
    {dust && <LensDust />}
  </AbsoluteFill>
);

/** Faint out-of-focus dust and two aperture ghosts drifting at different speeds, plus a slow warm light leak. */
export const LensDust: React.FC = () => {
  const f = useDesignFrame();
  const specks = useMemo(
    () =>
      Array.from({length: 24}, (_, i) => ({
        x: random(`dx${i}`) * W,
        y: random(`dy${i}`) * H,
        r: 30 + random(`dr${i}`) * 150,
        o: 0.025 + random(`do${i}`) * 0.055,
        vx: (random(`dvx${i}`) - 0.5) * 0.35,
        vy: (random(`dvy${i}`) - 0.5) * 0.25,
        hex: i % 5 === 0,
        warm: random(`dw${i}`) > 0.55,
      })),
    []
  );
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
      {specks.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: s.x + s.vx * f - s.r,
            top: s.y + s.vy * f - s.r,
            width: s.r * 2,
            height: s.r * 2,
            borderRadius: s.hex ? 0 : '50%',
            clipPath: s.hex ? 'polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)' : undefined,
            background: s.hex
              ? `radial-gradient(circle, transparent 58%, ${s.warm ? '#ffd9a8' : '#bfe9ff'} 100%)`
              : `radial-gradient(circle, ${s.warm ? '#ffe4bd' : '#bfe9ff'} 0%, transparent 66%)`,
            opacity: s.o * (0.75 + 0.25 * Math.sin(f / 45 + i)),
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: -300 + Math.sin(f / 240) * 120,
          top: -260,
          width: 1100,
          height: 800,
          background: 'radial-gradient(ellipse at center, rgba(255,170,90,0.10) 0%, transparent 65%)',
          transform: 'rotate(-18deg)',
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Chromatic aberration for impact frames. `at` lists the frames (local to the shot) of each slam; the red and blue
 * channels split sideways by up to `peak` px and settle back over about 12 frames. Costs nothing when idle.
 */
export const Aberration: React.FC<{at: number[]; peak?: number; children: React.ReactNode}> = ({at, peak = 9, children}) => {
  const f = useDesignFrame();
  // Bug fix: React's useId() produces IDs like ':r0:' which, after safe()-sanitising to '_r0_',
  // collide when multiple Aberration instances render in the same frame (e.g. Shot1 + RankReveal
  // both use Aberration). A stable random token stored in a ref makes every instance unique for
  // the lifetime of the component, without breaking Remotion's deterministic per-frame rendering.
  const uid = useRef(Math.random().toString(36).slice(2, 8));
  const id = safe('ca' + uid.current + useId());
  let amt = 0;
  for (const a of at) if (f >= a && f < a + 14) amt += peak * Math.exp(-(f - a) / 4);
  if (amt < 0.4) return <AbsoluteFill>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
        <defs>
          <filter id={id} x="-2%" y="0" width="104%" height="100%" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
            <feOffset in="r" dx={-amt} dy={0} result="r2" />
            <feOffset in="b" dx={amt} dy={0} result="b2" />
            <feBlend in="r2" in2="g" mode="screen" result="rg" />
            <feBlend in="rg" in2="b2" mode="screen" />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{filter: `url(#${id})`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
