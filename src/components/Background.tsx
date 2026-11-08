import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, W, H} from '../theme';

/** Navy gradient, drifting grid, pulsing emerald glow, vignette and film grain. Layers move at different speeds. */
export const Background: React.FC<{
  glowX?: number;
  glowY?: number;
  glowColor?: string;
  tint?: number;
  children?: React.ReactNode;
  drift?: boolean;
  /** Camera position in px (world units). Layers behind the action slide the opposite way at different rates, for parallax. */
  parallax?: [number, number];
}> = ({glowX = W / 2, glowY = H / 2, glowColor = C.emerald, tint = 0, children, drift = true, parallax = [0, 0]}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const camera = drift ? interpolate(frame, [0, durationInFrames], [1, 1.04], {extrapolateRight: 'clamp'}) : 1;
  const gridShift = (frame * 0.25) % 80;
  const pulse = 0.28 + 0.07 * Math.sin(frame / 14);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${C.navy1} 0%, ${C.navy2} 55%, ${C.navy3} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          backgroundPosition: `${gridShift - parallax[0] * 0.12}px ${gridShift * 0.6 + parallax[1] * 0.12}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${glowX + Math.sin(frame / 90) * 30 - parallax[0] * 0.25}px ${glowY + parallax[1] * 0.25}px, ${glowColor} 0%, transparent 42%)`,
          opacity: pulse + tint,
        }}
      />
      <Bokeh frame={frame} parallax={parallax} />
      <AbsoluteFill style={{transform: `scale(${camera})`, transformOrigin: '50% 50%'}}>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}}
      />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.03, mixBlendMode: 'overlay'}}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 7} />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

const BOKEH = Array.from({length: 18}, (_, i) => ({
  x: random(`bx${i}`) * W,
  y: random(`by${i}`) * H,
  r: 40 + random(`br${i}`) * 120,
  depth: 0.15 + random(`bd${i}`) * 0.7, // how strongly it follows the camera: a cheap sense of distance
  o: 0.05 + random(`bo${i}`) * 0.09,
  warm: random(`bw${i}`) > 0.8,
}));

/** Soft out-of-focus lights far behind the map. They slide against the camera at different rates. */
const Bokeh: React.FC<{frame: number; parallax: [number, number]}> = ({frame, parallax}) => (
  <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
    {BOKEH.map((b, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: b.x - b.r - parallax[0] * b.depth * 0.5 + Math.sin(frame / (160 + i * 9) + i) * 18,
          top: b.y - b.r + parallax[1] * b.depth * 0.5 + Math.cos(frame / (190 + i * 7) + i) * 14,
          width: b.r * 2,
          height: b.r * 2,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${b.warm ? '#ffb020' : '#3DF0A8'} 0%, transparent 68%)`,
          opacity: b.o,
        }}
      />
    ))}
  </AbsoluteFill>
);
