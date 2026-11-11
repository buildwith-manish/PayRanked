import React, {createContext, useContext} from 'react';
import {useCurrentFrame} from 'remotion';

/**
 * The video renders at FPS (60), but every timing in the project (beats, durations, cue sheet, easing lengths) was
 * written in 30 fps frames. Those are "design frames". Nothing needs retiming:
 *
 *   - animation code reads `useDesignFrame()`, which is the render frame divided by K, so it advances 0, 0.5, 1, 1.5 ...
 *     and every curve is simply sampled twice as often (smooth 60 fps motion, same speed and same beats);
 *   - things Remotion itself counts in render frames (Composition / Sequence durations, audio trims) go through
 *     `toReal()`.
 *
 * To change the render rate, change FPS here and nothing else.
 */
export const DESIGN_FPS = 30;
export const FPS = 60;
/** Render frames per design frame. */
export const K = FPS / DESIGN_FPS;
const FRAME_OFFSET = createContext(0);

/** Design frames -> render frames (for Composition, Sequence and Audio props). */
export const toReal = (designFrames: number) => Math.round(designFrames * K);

/** The current frame on the 30 fps design clock. Fractional at 60 fps (0, 0.5, 1, 1.5 ...). */
export const useDesignFrame = () => useCurrentFrame() / K + useContext(FRAME_OFFSET);

export const FrameOffset: React.FC<{offset: number; children: React.ReactNode}> = ({offset, children}) => (
  React.createElement(FRAME_OFFSET.Provider, {value: offset}, children)
);
