import React from 'react';
import {AbsoluteFill, interpolate, spring} from 'remotion';
import {C, F, MARGIN, springIn} from '../theme';
import {presence} from '../motion';
import {MaskChars} from './MaskText';
import {DESIGN_FPS, useDesignFrame} from '../clock';
import {useLayout} from '../layout';

/** 0 -> 1 -> 0 visibility window in frames (fade in at start, fade out at end). */
export const win = (f: number, start: number, end: number, fade = 10) => presence(f, start, end, fade, fade);

export const useSpr = (delay = 0, config: {damping: number; stiffness: number; mass?: number} = springIn) => {
  const f = useDesignFrame();
  return spring({frame: f - delay, fps: DESIGN_FPS, config});
};

/** Text that rises letter by letter from behind a mask line (was a fade + slide). */
export const Letters: React.FC<{text: string; start?: number; stagger?: number; style?: React.CSSProperties}> = ({text, start = 0, stagger = 2, style}) => (
  <MaskChars text={text} start={start} step={stagger * 0.8} style={style} />
);

/** Short light flash that decays from frame `at`. */
export const Flash: React.FC<{at: number; duration?: number; color?: string; peak?: number}> = ({at, duration = 8, color = '#ffffff', peak = 0.85}) => {
  const f = useDesignFrame();
  if (f < at) return null;
  const o = interpolate(f, [at, at + duration], [peak, 0], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: color, opacity: o, pointerEvents: 'none'}} />;
};

export const SourceTag: React.FC<{opacity?: number}> = ({opacity = 1}) => {
  const {vertical} = useLayout();
  return (
    <div
      style={{
        position: 'absolute',
        // vertical: top-left under the Shorts header; the bottom 380 px belong to the Shorts player UI
        ...(vertical ? {left: 44, top: 112, fontSize: 28} : {left: MARGIN, bottom: 48, fontSize: 24}),
        fontFamily: F.body,
        fontWeight: 500,
        color: C.muted,
        opacity: 0.7 * opacity,
      }}
    >
      Source: BEA, 2024 prices
    </div>
  );
};
