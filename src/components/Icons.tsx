import React from 'react';
import {interpolate} from 'remotion';
import {C} from '../theme';
import {useDesignFrame} from '../clock';

export type IconKind = 'pin' | 'percent' | 'tag' | 'bars' | 'buildings' | 'bell';

const PATHS: Record<IconKind, string[]> = {
  pin: ['M32 60 C14 40 12 32 12 25 A20 20 0 0 1 52 25 C52 32 50 40 32 60 Z', 'M25 25 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0'],
  percent: ['M14 52 L50 12', 'M10 20 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0', 'M38 44 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0'],
  tag: ['M8 8 H32 L58 34 L34 58 L8 32 Z', 'M17 19 a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0'],
  bars: ['M4 58 H60', 'M10 58 V30 H26 V58', 'M38 58 V10 H54 V58'],
  buildings: ['M4 58 H60', 'M10 58 V26 H28 V58', 'M28 58 V8 H48 V58', 'M48 58 V32 H58 V58', 'M34 18 h8 M34 30 h8 M34 42 h8'],
  bell: ['M32 8 c-12 0 -18 10 -18 22 v10 l-6 8 h48 l-6 -8 v-10 c0 -12 -6 -22 -18 -22 z', 'M26 52 a6 6 0 0 0 12 0'],
};

/** Line icon that draws itself, one stroke after another (4-frame stagger). `start` is in composition frames. */
export const DrawIcon: React.FC<{kind: IconKind; start?: number; size?: number; color?: string; strokeWidth?: number}> = ({
  kind,
  start = 0,
  size = 64,
  color = C.text,
  strokeWidth = 3.5,
}) => {
  const f = useDesignFrame();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{overflow: 'visible'}}>
      {PATHS[kind].map((d, i) => {
        const p = interpolate(f, [start + i * 4, start + i * 4 + 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <path
            key={i}
            d={d}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - p}
          />
        );
      })}
    </svg>
  );
};
