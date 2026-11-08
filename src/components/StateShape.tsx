import React from 'react';
import {geoOf} from './USMap';

/** One state outline fitted into its own box. `draw` (0-1) traces the outline, then fades in the fill. */
export const StateShape: React.FC<{
  name: string;
  width: number;
  height: number;
  draw: number;
  color: string;
}> = ({name, width, height, draw, color}) => {
  const g = geoOf(name);
  const [[x0, y0], [x1, y1]] = g.bounds;
  const pad = Math.max(x1 - x0, y1 - y0) * 0.06;
  const bw = x1 - x0 + pad * 2;
  const bh = y1 - y0 + pad * 2;
  const stroke = Math.max(bw, bh) / 70;
  return (
    <svg width={width} height={height} viewBox={`${x0 - pad} ${y0 - pad} ${bw} ${bh}`} preserveAspectRatio="xMidYMid meet" style={{overflow: 'visible'}}>
      <path
        d={g.d}
        fill={color}
        fillOpacity={0.55 * Math.max(0, (draw - 0.7) / 0.3)}
        stroke={color}
        strokeWidth={stroke}
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
        style={{filter: `drop-shadow(0 0 ${14 * draw}px ${color})`}}
      />
    </svg>
  );
};
