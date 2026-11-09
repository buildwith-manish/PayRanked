import React from 'react';
import {interpolate} from 'remotion';
import {C, F, tabular} from '../theme';
import {anticipate, glide, tween} from '../motion';
import {useDesignFrame} from '../clock';

const MIN = 80;
const MAX = 120;
const angleFor = (v: number) => interpolate(v, [MIN, MAX], [-90, 90], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** Semicircle gauge, scale 80-120. `value` is the needle value; the arc draws itself over `drawFrames`. */
export const Gauge: React.FC<{
  value: number;
  size?: number;
  tint?: string;
  drawFrames?: number;
  label?: string;
  jitter?: boolean;
}> = ({value, size = 640, tint = C.text, drawFrames = 30, label, jitter = false}) => {
  const frame = useDesignFrame();
  const r = size / 2 - 40;
  const cx = size / 2;
  const cy = size / 2;
  const arcLen = Math.PI * r;
  const draw = tween(frame, 0, drawFrames, glide);
  // a needle at rest on a real gauge trembles a little; it is the only thing that moves once the reading is in
  const ang = angleFor(value) + (jitter ? Math.sin(frame * 1.7) * 0.5 : 0);
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const ticks = [80, 90, 100, 110, 120];
  return (
    <svg width={size} height={size / 2 + 80} viewBox={`0 0 ${size} ${size / 2 + 80}`}>
      <path d={arc} fill="none" stroke="rgba(232,238,247,0.15)" strokeWidth={26} strokeLinecap="round" />
      <path
        d={arc}
        fill="none"
        stroke={tint}
        strokeWidth={26}
        strokeLinecap="round"
        strokeDasharray={arcLen}
        strokeDashoffset={arcLen * (1 - draw)}
        opacity={0.35}
      />
      {ticks.map((t) => {
        const a = ((angleFor(t) - 90) * Math.PI) / 180;
        return (
          <g key={t} opacity={draw}>
            <line x1={cx + (r - 34) * Math.cos(a)} y1={cy + (r - 34) * Math.sin(a)} x2={cx + (r + 8) * Math.cos(a)} y2={cy + (r + 8) * Math.sin(a)} stroke={C.muted} strokeWidth={3} />
            <text
              x={cx + (r - 66) * Math.cos(a)}
              y={cy + (r - 66) * Math.sin(a) + 8}
              textAnchor="middle"
              fill={C.muted}
              fontFamily={F.body}
              fontSize={24}
              style={tabular}
            >
              {t}
            </text>
          </g>
        );
      })}
      <g transform={`rotate(${ang} ${cx} ${cy})`} opacity={draw}>
        <line x1={cx} y1={cy} x2={cx} y2={cy - r + 24} stroke={tint} strokeWidth={8} strokeLinecap="round" />
      </g>
      <circle cx={cx} cy={cy} r={16} fill={tint} />
      {label && (
        <text x={cx} y={cy + 62} textAnchor="middle" fill={tint} fontFamily={F.display} fontWeight={700} fontSize={34}>
          {label}
        </text>
      )}
    </svg>
  );
};

/**
 * Needle value that moves from one reading to the next the way a heavy needle does: it pulls back a little, swings
 * across, overshoots and settles (the `anticipate` curve), instead of one spring preset for every move.
 */
export const useNeedle = (targets: {at: number; value: number}[], startValue = MIN) => {
  const frame = useDesignFrame();
  let from = startValue;
  let current = startValue;
  for (const t of targets) {
    if (frame >= t.at) {
      const p = tween(frame, t.at, 44, anticipate);
      current = from + (t.value - from) * p;
      from = t.value;
    }
  }
  return current;
};

/** Small gauge for BEA score chips. */
export const MiniGauge: React.FC<{value: number; size?: number; color?: string; delay?: number}> = ({value, size = 150, color = C.mint, delay = 0}) => {
  const frame = useDesignFrame();
  const p = tween(frame, delay, 40, anticipate);
  return <Gauge value={MIN + (value - MIN) * p} size={size * 2} tint={color} drawFrames={20} />;
};
