import React from 'react';

import {ramp, rise, stagger} from '../motion';
import {K, useDesignFrame} from '../clock';

/**
 * Mask reveal: the text starts below an invisible line and rises into view from behind it, with a slight skew that
 * straightens as it lands. The line is the clip, so nothing fades: it is cut by the mask the whole way up.
 * Padding on the clip keeps descenders and glow from being sliced.
 */
export const MaskLine: React.FC<{
  children: React.ReactNode;
  start: number;
  dur?: number;
  /** 'up' rises from below (default), 'down' drops from above */
  from?: 'up' | 'down';
  skew?: number;
  style?: React.CSSProperties;
  /** also hide again: frame at which the text leaves back behind the line */
  leaveAt?: number;
}> = ({children, start, dur = 18, from = 'up', skew = 5, style, leaveAt}) => {
  const f = useDesignFrame();
  const inP = ramp(f, start, start + dur, rise);
  const outP = leaveAt === undefined ? 0 : ramp(f, leaveAt, leaveAt + Math.round(dur * 0.7), rise);
  const p = inP * (1 - outP);
  const dir = from === 'up' ? 1 : -1;
  // vertical blur while the line is travelling fast
  const prev = ramp(f - 1, start, start + dur, rise) * (1 - (leaveAt === undefined ? 0 : ramp(f - 1, leaveAt, leaveAt + Math.round(dur * 0.7), rise)));
  const blur = Math.min(2.6, Math.abs(p - prev) * (90 / K));
  // Bug fix: old padding (0.12em top, 0.2em bottom) was too tight for large display text
  // (84–520px). Descenders (g, p, y) and CSS drop-shadow glow were clipped by the
  // overflow:hidden boundary. Increased to 0.18em top and 0.38em bottom to comfortably
  // clear descenders and a glow radius of up to ~15% of the font size. The equal negative
  // margins cancel the extra space from the layout so surrounding elements are unaffected.
  return (
    <span style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingTop: '0.18em', paddingBottom: '0.38em', marginTop: '-0.18em', marginBottom: '-0.38em', ...style}}>
      <span
        style={{
          display: 'inline-block',
          whiteSpace: 'pre',
          transform: `translateY(${(1 - p) * 118 * dir}%) skewY(${(1 - p) * skew * dir}deg)`,
          transformOrigin: dir === 1 ? '0% 100%' : '0% 0%',
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
          willChange: 'transform',
        }}
      >
        {children}
      </span>
    </span>
  );
};

/** One mask per word, staggered. Wraps normally. */
export const MaskWords: React.FC<{
  text: string;
  start: number;
  step?: number;
  dur?: number;
  style?: React.CSSProperties;
  wordStyle?: (word: string, i: number) => React.CSSProperties | undefined;
  leaveAt?: number;
}> = ({text, start, step = 4, dur = 18, style, wordStyle, leaveAt}) => {
  const words = text.split(' ');
  return (
    <span style={style}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <MaskLine start={start + stagger(i, step, 30)} dur={dur} style={wordStyle?.(w, i)} leaveAt={leaveAt === undefined ? undefined : leaveAt + stagger(i, 2, 12)}>
            {w}
          </MaskLine>
          {i < words.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </span>
  );
};

/** One mask per character, for names and short headlines. Each letter has its own clip. */
export const MaskChars: React.FC<{
  text: string;
  start: number;
  step?: number;
  dur?: number;
  style?: React.CSSProperties;
  leaveAt?: number;
}> = ({text, start, step = 1.6, dur = 20, style, leaveAt}) => (
  <span style={style}>
    {text.split('').map((ch, i) => (
      <MaskLine key={i} start={start + Math.round(i * step)} dur={dur} leaveAt={leaveAt === undefined ? undefined : leaveAt + Math.round(i * 0.8)} skew={7}>
        {ch === ' ' ? '\u00a0' : ch}
      </MaskLine>
    ))}
  </span>
);

/** A thin rule that draws from the left with the same curve, to sit under a masked line. */
export const MaskRule: React.FC<{start: number; dur?: number; height?: number; color: string; style?: React.CSSProperties}> = ({start, dur = 22, height = 6, color, style}) => {
  const f = useDesignFrame();
  const p = ramp(f, start, start + dur, rise);
  return <div style={{height, width: '100%', background: color, borderRadius: height / 2, transformOrigin: '0 50%', transform: `scaleX(${p})`, ...style}} />;
};
