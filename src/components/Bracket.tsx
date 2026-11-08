import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';
import {C} from '../theme';

/** Vertical bracket between two y positions at x. Draws itself over `duration` frames. */
export const Bracket: React.FC<{
  x: number;
  y1: number;
  y2: number;
  start?: number;
  duration?: number;
  color?: string;
  depth?: number;
}> = ({x, y1, y2, start = 0, duration = 20, color = C.amber, depth = 36}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const d = `M ${x} ${y1} q ${depth} 0 ${depth} ${depth} L ${x + depth} ${(y1 + y2) / 2 - depth} q 0 ${depth} ${depth} ${depth} q -${depth} 0 -${depth} ${depth} L ${x + depth} ${y2 - depth} q 0 ${depth} -${depth} ${depth}`;
  return (
    <svg style={{position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none'}} width={1920} height={1080}>
      <path d={d} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
    </svg>
  );
};
