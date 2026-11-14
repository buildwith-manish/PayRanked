import React from 'react';
import {useDesignFrame} from '../clock';
import {C} from '../theme';
import {glide, slam, tween} from '../motion';
import {FONT, MOTION, ROLE, TYPE} from './system';
import {METROS, money, shownName} from './layout';

/** Fade + rise on entry. `at` is a design frame local to the scene. */
export const Enter: React.FC<{at: number; style?: React.CSSProperties; children: React.ReactNode; rise?: number}> = ({at, style, children, rise = 28}) => {
  const f = useDesignFrame();
  const p = tween(f, at, MOTION.enterFrames, glide);
  return <div style={{position: 'absolute', opacity: p, transform: `translateY(${(1 - p) * rise}px)`, ...style}}>{children}</div>;
};

/** A number that counts from `from` to `to` between `at` and `at + dur`. */
export const CountMoney: React.FC<{from: number; to: number; at: number; dur?: number; color?: string; size?: number; prefix?: string; style?: React.CSSProperties}> = ({
  from, to, at, dur = 30, color = C.text, size = TYPE.number, prefix = '', style,
}) => {
  const f = useDesignFrame();
  const v = from + (to - from) * tween(f, at, dur, glide);
  const vis = f >= at;
  return (
    <span style={{fontFamily: FONT.num, fontWeight: 700, fontSize: size, color, fontVariantNumeric: 'tabular-nums', opacity: vis ? 1 : 0, ...style}}>
      {prefix}{money(v)}
    </span>
  );
};

export const Label: React.FC<{children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties}> = ({children, color = C.muted, size = TYPE.label, style}) => (
  <div style={{fontFamily: FONT.text, fontWeight: 600, fontSize: size, color, letterSpacing: 1, ...style}}>{children}</div>
);

/** Hairline outlined tag: quieter than a solid Pill, for secondary notes and labels. */
export const Tag: React.FC<{text: string; color?: string; size?: number}> = ({text, color = C.muted, size = 26}) => (
  <div style={{display: 'inline-block', fontFamily: FONT.text, fontWeight: 600, fontSize: size, color, border: `1.5px solid ${color}`, borderRadius: 999, padding: '6px 20px', letterSpacing: 1}}>{text}</div>
);

export const Pill: React.FC<{text: string; color: string; size?: number}> = ({text, color, size = 34}) => (
  <div style={{display: 'inline-block', fontFamily: FONT.text, fontWeight: 700, fontSize: size, color: C.navy3, background: color, borderRadius: 999, padding: '10px 28px', boxShadow: `0 0 30px ${color}66`}}>{text}</div>
);

export const Source: React.FC<{text: string}> = ({text}) => (
  <div style={{display: 'inline-block', fontFamily: FONT.text, fontWeight: 600, fontSize: TYPE.source, color: C.muted, border: `1.5px solid ${C.muted}88`, borderRadius: 8, padding: '4px 12px', marginRight: 10}}>{text}</div>
);

/** Rank number that slams in. */
export const RankSlam: React.FC<{text: string; at: number; color?: string; size?: number}> = ({text, at, color = ROLE.buying, size = TYPE.hero}) => {
  const f = useDesignFrame();
  const p = tween(f, at, MOTION.slamFrames, slam);
  const o = tween(f, at, 6);
  return (
    <div style={{position: 'absolute', fontFamily: FONT.num, fontWeight: 700, fontSize: size, color, lineHeight: 1, opacity: o, transform: `scale(${1 + (1 - p) * 0.8})`, transformOrigin: '0% 50%', textShadow: `0 0 50px ${color}88`}}>
      {text}
    </div>
  );
};

/** Rank ladder: ten slots, filled bottom-up as the countdown goes. `revealed` maps rank -> design frame it appears (-1 = already there). */
export const Ladder: React.FC<{revealed: Record<number, number>; active?: number; x?: number; y?: number}> = ({revealed, active, x = 96, y = 130}) => {
  const f = useDesignFrame();
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 340}}>
      {Array.from({length: 10}, (_, i) => i + 1).map((rank) => {
        const m = METROS.find((q) => q.rank === rank)!;
        const at = revealed[rank];
        const shown = at !== undefined;
        const p = shown ? (at < 0 ? 1 : tween(f, at, MOTION.enterFrames, glide)) : 0;
        const isActive = active === rank;
        return (
          <div key={rank} style={{display: 'flex', alignItems: 'center', height: 70, marginBottom: 6, borderRadius: 14, padding: '0 18px', background: isActive ? `${ROLE.buying}22` : 'rgba(255,255,255,0.05)', border: `1.5px solid ${isActive ? ROLE.buying : 'rgba(255,255,255,0.08)'}`, opacity: shown ? 0.55 + 0.45 * p : 0.35}}>
            <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 34, color: isActive ? ROLE.buying : C.muted, width: 62}}>{rank}</div>
            <div style={{fontFamily: FONT.text, fontWeight: 600, fontSize: 30, color: C.text, transform: `translateX(${(1 - p) * 24}px)`}}>{shown ? shownName(m) : '?'}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Half-circle dial for a price level, national average = 100 at the top. */
export const Dial: React.FC<{value: number; at: number; width?: number; hideValue?: boolean}> = ({value, at, width = 340, hideValue = false}) => {
  const f = useDesignFrame();
  const lo = 70, hi = 130;
  const ang = (v: number) => Math.PI - ((v - lo) / (hi - lo)) * Math.PI;
  const p = tween(f, at, 34, glide);
  const cur = 100 + (value - 100) * p;
  const R = width / 2 - 20, cx = width / 2, cy = width / 2 + 30;
  const pt = (v: number, r: number) => [cx + r * Math.cos(ang(v)), cy - r * Math.sin(ang(v))];
  const [nx, ny] = pt(cur, R - 8);
  const [t0x, t0y] = pt(100, R + 8), [t1x, t1y] = pt(100, R - 22);
  const col = value > 100 ? ROLE.rent : ROLE.buying;
  return (
    <svg width={width} height={cy + 60} style={{position: 'absolute', opacity: tween(f, at - 4, 10)}}>
      <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`} stroke="rgba(255,255,255,0.14)" strokeWidth={18} fill="none" strokeLinecap="round" />
      <line x1={t0x} y1={t0y} x2={t1x} y2={t1y} stroke={C.text} strokeWidth={4} />
      <text x={cx} y={cy - R - 18} textAnchor="middle" fill={C.muted} fontSize={22} fontFamily={FONT.text}>100 = U.S. average</text>
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={col} strokeWidth={8} strokeLinecap="round" style={{filter: `drop-shadow(0 0 10px ${col})`}} />
      <circle cx={cx} cy={cy} r={12} fill={col} />
      {!hideValue && <text x={cx} y={cy + 50} textAnchor="middle" fill={col} fontSize={34} fontWeight={700} fontFamily={FONT.num}>{cur.toFixed(1)}</text>}
    </svg>
  );
};

/** Index bar centred on 100 (the national average): longer to the right = pricier than average, to the left = cheaper. */
export const IndexBar: React.FC<{label: string; value: number; color: string; at: number; width?: number; span?: number}> = ({label, value, color, at, width = 800, span = 75}) => {
  const f = useDesignFrame();
  const p = tween(f, at, MOTION.enterFrames + 10, glide);
  const half = width / 2;
  const px = Math.max(-half, Math.min(half, ((value - 100) / span) * half)) * p;
  const barW = Math.max(p > 0 ? 6 : 0, Math.abs(px));
  return (
    <div style={{width, opacity: tween(f, at, 8)}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT.text, fontWeight: 600, fontSize: TYPE.label, color: C.text, marginBottom: 8}}>
        <span>{label}</span>
        <span style={{color, fontFamily: FONT.num, fontVariantNumeric: 'tabular-nums'}}>{(100 + (value - 100) * p).toFixed(1)}</span>
      </div>
      <div style={{position: 'relative', height: 30, borderRadius: 15, background: 'rgba(255,255,255,0.08)'}}>
        <div style={{position: 'absolute', top: 0, height: '100%', left: half + (px < 0 ? -barW : 0), width: barW, borderRadius: 15, background: color, boxShadow: `0 0 22px ${color}88`}} />
        <div style={{position: 'absolute', left: half - 1.5, top: -8, width: 3, height: 46, background: C.text, opacity: 0.8}} />
      </div>
    </div>
  );
};
