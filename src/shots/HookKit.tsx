import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, mix, sec, tabular} from '../theme';
import {useDesignFrame} from '../clock';
import {presence, ramp, roll, slam, snap, tween, glide} from '../motion';
import {Flash} from '../components/common';
import {SfxTrack} from '../audio/Sfx';
import {Cue} from '../audio/cues';
import {SHORTS_SAFE} from '../layout';
import {byName} from '../data';

/**
 * Hook kit for the Shorts: the first ~3 s of a Short is one small piece of motion that SHOWS the claim, then the line lands.
 * Beats (design frames, 30 fps, local to the hook): 0-4 scrim and label, 4-44 the number runs, 46 impact (flash, shake, hit),
 * 50+ the claim lands word by word. Everything numeric comes from src/data, nothing is typed in.
 */
export const HOOK_SECONDS = 3.4;
const END = sec(HOOK_SECONDS);
const IMPACT = 46;
const AREA_TOP = SHORTS_SAFE.top + 20; // 170: below the Shorts shelf

/** Damped shake after an impact. */
const shake = (f: number, at: number, amp: number) => {
  const t = f - at;
  return t < 0 || t > 16 ? 0 : amp * Math.exp(-t / 4) * Math.sin(t * 2.6);
};

/** Frame, dark scrim, shake and flash shared by every hook. The sound cues are local to the hook; the offset is far past the
 *  voice-over envelope, so the voice ducking never touches them. */
const Stage: React.FC<{cues: Cue[]; children: React.ReactNode}> = ({cues, children}) => {
  const f = useDesignFrame();
  const vis = presence(f, 0, END, 5, 12);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 760, opacity: vis, background: 'linear-gradient(180deg, rgba(5,14,29,0.9) 0%, rgba(5,14,29,0.82) 62%, rgba(5,14,29,0) 100%)'}} />
      <div style={{position: 'absolute', inset: 0, opacity: vis, transform: `translate(${shake(f, IMPACT, 9)}px, ${shake(f, IMPACT + 2, 6)}px)`}}>{children}</div>
      <Flash at={IMPACT} duration={9} peak={0.3} />
      <SfxTrack cues={cues} offset={10_000_000} />
    </AbsoluteFill>
  );
};

/** A small outlined label that pops in. */
const Pill: React.FC<{text: string; color: string; at?: number}> = ({text, color, at = 1}) => {
  const f = useDesignFrame();
  const p = tween(f, at, 12, snap);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: AREA_TOP, display: 'flex', justifyContent: 'center', opacity: ramp(f, at, at + 5), transform: `scale(${0.7 + 0.3 * p})`}}>
      <div style={{padding: '10px 34px', borderRadius: 999, border: `3px solid ${color}`, background: `${color}22`, fontFamily: F.body, fontWeight: 700, fontSize: 36, letterSpacing: '0.2em', color}}>{text}</div>
    </div>
  );
};

/** The claim, one word at a time: each word lands with an overshoot, blur and a small drop. `key` words get the accent colour. */
const Words: React.FC<{words: {t: string; accent?: boolean}[]; start: number; top: number; size?: number; accent: string}> = ({words, start, top, size = 60, accent}) => {
  const f = useDesignFrame();
  return (
    <div style={{position: 'absolute', left: 48, right: 48, top, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 16, rowGap: 2, fontFamily: F.display, fontWeight: 700, fontSize: size, lineHeight: 1.12, textShadow: '0 4px 22px rgba(2,8,18,0.8)'}}>
      {words.map((w, i) => {
        const p = tween(f, start + i * 3, 14, slam);
        const o = ramp(f, start + i * 3, start + i * 3 + 4);
        return (
          <span key={i} style={{display: 'inline-block', color: w.accent ? accent : C.text, opacity: o, transform: `translateY(${(1 - p) * 34}px) scale(${1 + (1 - p) * (w.accent ? 0.7 : 0.35)})`, filter: p < 0.9 ? `blur(${(1 - p) * 7}px)` : undefined}}>
            {w.t}
          </span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// Short 3: Texas. A marker runs the 50-state ranking and stops one place outside the "top 25" zone.
// ---------------------------------------------------------------------------------------------------------------------
export const Short3Hook: React.FC = () => {
  const f = useDesignFrame();
  const texas = byName('Texas').rank; // 26
  const TRACK = 888;
  const x = (r: number) => ((r - 1) / 49) * TRACK;
  const run = roll(ramp(f, 4, 44)); // the rank runs 1 -> 26 on the odometer curve
  const rank = Math.max(1, Math.round(1 + (texas - 1) * run));
  const landed = ramp(f, IMPACT, IMPACT + 12, slam);
  const col = mix(C.mint, C.red, ramp(f, 14, 44) * 0.9 + 0.1);
  const big = 1 + 0.42 * (1 - landed) * (f >= IMPACT ? 1 : 0);
  const cues: Cue[] = [
    {sfx: 'pop', at: 2, gain: 0.3, hero: true},
    {sfx: 'riser_short', at: IMPACT, gain: 0.45, hero: true},
    {sfx: 'hit_med', at: IMPACT, gain: 0.7, hero: true},
    {sfx: 'click', at: IMPACT + 5, gain: 0.25, hero: true},
  ];
  return (
    <Stage cues={cues}>
      <Pill text="TEXAS" color={C.amber} />
      <div style={{position: 'absolute', left: 0, right: 0, top: AREA_TOP + 70, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 230, lineHeight: 1, color: col, transform: `scale(${big})`, textShadow: `0 0 ${24 + 40 * landed}px ${col}88`, opacity: ramp(f, 2, 8), ...tabular}}>
        #{rank}
      </div>
      <div style={{position: 'absolute', left: 96, top: AREA_TOP + 350, width: TRACK, height: 20, opacity: ramp(f, 3, 12)}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 10, background: 'rgba(232,238,247,0.16)'}} />
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: x(25), borderRadius: 10, background: C.mint, opacity: 0.85}} />
        <div style={{position: 'absolute', left: x(25) - 1, top: -14, width: 3, height: 48, background: C.text}} />
        <div style={{position: 'absolute', left: x(25) - 110, top: 40, width: 220, textAlign: 'center', fontFamily: F.body, fontWeight: 700, fontSize: 28, letterSpacing: '0.16em', color: C.mint, opacity: ramp(f, 8, 18)}}>TOP 25</div>
        <div style={{position: 'absolute', left: x(1 + (texas - 1) * run) - 17, top: -7, width: 34, height: 34, borderRadius: 17, background: landed > 0 ? C.red : C.text, boxShadow: `0 0 ${18 + 20 * landed}px ${landed > 0 ? C.red : C.mint}`}} />
      </div>
      <Words start={IMPACT + 4} top={AREA_TOP + 440} accent={C.red} words={[{t: 'Texas'}, {t: "isn't"}, {t: 'even'}, {t: 'top', accent: true}, {t: '25.', accent: true}]} />
    </Stage>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// Short 4: Louisiana. The sales-tax number runs up the meter, then a "#5" stamp hits next to it.
// ---------------------------------------------------------------------------------------------------------------------
export const Short4Hook: React.FC = () => {
  const f = useDesignFrame();
  const la = byName('Louisiana');
  const tax = parseFloat((la.fact ?? '').match(/([\d.]+)%/)?.[1] ?? '0'); // 10.11, from the fact line in states.json
  const MAXPCT = 12;
  const run = roll(ramp(f, 4, 44));
  const stamp = tween(f, IMPACT + 4, 14, slam);
  const landed = ramp(f, IMPACT, IMPACT + 10);
  const cues: Cue[] = [
    {sfx: 'pop', at: 2, gain: 0.3, hero: true},
    {sfx: 'gauge_sweep', at: 24, gain: 0.35, hero: true},
    {sfx: 'riser_short', at: IMPACT, gain: 0.45, hero: true},
    {sfx: 'hit_med', at: IMPACT, gain: 0.6, hero: true},
    {sfx: 'stamp', at: IMPACT + 6, gain: 0.6, hero: true},
  ];
  return (
    <Stage cues={cues}>
      <Pill text="LOUISIANA SALES TAX" color={C.red} />
      <div style={{position: 'absolute', left: 64, top: AREA_TOP + 80, fontFamily: F.display, fontWeight: 700, fontSize: 200, lineHeight: 1, color: C.red, textShadow: `0 0 ${24 + 36 * landed}px ${C.red}88`, opacity: ramp(f, 2, 8), ...tabular}}>
        {(tax * run).toFixed(2)}%
      </div>
      {/* #5 stamp: the sales tax is the highest in the US, and the state still ranks #5 */}
      <div style={{position: 'absolute', right: 70, top: AREA_TOP + 108, width: 190, height: 190, borderRadius: 95, border: `8px solid ${C.mint}`, background: `${C.mint}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 104, color: C.mint, opacity: f >= IMPACT + 4 ? 1 : 0, transform: `rotate(${-12 + 12 * stamp}deg) scale(${3 - 2 * stamp})`, boxShadow: `0 0 40px ${C.mint}66`}}>
        #{la.rank}
      </div>
      <div style={{position: 'absolute', left: 96, top: AREA_TOP + 350, width: 888, height: 22, borderRadius: 11, background: 'rgba(232,238,247,0.16)', opacity: ramp(f, 3, 12)}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(tax / MAXPCT) * run * 100}%`, borderRadius: 11, background: `linear-gradient(90deg, ${C.amber}, ${C.red})`, boxShadow: `0 0 24px ${C.red}99`}} />
        <div style={{position: 'absolute', right: 0, top: 36, fontFamily: F.body, fontWeight: 700, fontSize: 28, letterSpacing: '0.16em', color: C.red, opacity: ramp(f, 40, 52)}}>HIGHEST IN THE US</div>
      </div>
      <Words start={IMPACT + 6} top={AREA_TOP + 440} size={56} accent={C.mint} words={[{t: 'Highest'}, {t: 'sales'}, {t: 'tax'}, {t: 'in'}, {t: 'the'}, {t: 'US,'}, {t: 'and'}, {t: 'still'}, {t: `#${la.rank}.`, accent: true}]} />
    </Stage>
  );
};

export const SHORT_HOOK_ANIMS: Partial<Record<number, React.FC>> = {3: Short3Hook, 4: Short4Hook};
