import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, mix, sec, tabular} from '../theme';
import {useDesignFrame} from '../clock';
import {presence, ramp, roll, slam, snap, tween, glide} from '../motion';
import {Flash} from '../components/common';
import {SfxTrack} from '../audio/Sfx';
import {Cue} from '../audio/cues';
import {SHORTS_SAFE} from '../layout';
import {byName, SALARY} from '../data';

const money = (n: number) => '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

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
const Stage: React.FC<{cues: Cue[]; children: React.ReactNode; height?: number; alpha?: number}> = ({cues, children, height = 760, alpha = 0.9}) => {
  const f = useDesignFrame();
  const vis = presence(f, 0, END, 5, 12);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height, opacity: vis, background: `linear-gradient(180deg, rgba(5,14,29,${alpha}) 0%, rgba(5,14,29,${alpha * 0.9}) 62%, rgba(5,14,29,0) 100%)`}} />
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

// ---------------------------------------------------------------------------------------------------------------------
// Short 2: the #10 tie. Kansas and Nebraska slide in from opposite sides, the same dollar figure runs up, "=" slams between them.
// ---------------------------------------------------------------------------------------------------------------------
export const Short2Hook: React.FC = () => {
  const f = useDesignFrame();
  const ks = byName('Kansas');
  const ne = byName('Nebraska');
  const ca = byName('California');
  const buys = Math.min(ks.display, ne.display); // both round to $111,000
  const aheadK = Math.floor((Math.min(ks.dollars, ne.dollars) - ca.dollars) / 1000); // 20: both beat California by more than $20K
  const run = roll(ramp(f, 4, 44));
  const slide = tween(f, 3, 26, glide);
  const eq = tween(f, IMPACT, 14, slam);
  const landed = ramp(f, IMPACT, IMPACT + 10);
  const name = (t: string, side: 1 | -1) => (
    <div style={{flex: 1, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 62, color: C.text, transform: `translateX(${side * (1 - slide) * 520}px)`, opacity: ramp(f, 3, 9)}}>{t}</div>
  );
  const cues: Cue[] = [
    {sfx: 'whoosh_s', at: 14, gain: 0.3, hero: true},
    {sfx: 'riser_short', at: IMPACT, gain: 0.45, hero: true},
    {sfx: 'hit_med', at: IMPACT, gain: 0.65, hero: true},
    {sfx: 'stamp', at: IMPACT + 4, gain: 0.45, hero: true},
  ];
  return (
    <Stage cues={cues}>
      <Pill text={`TIED FOR #${ks.rank}`} color={C.amber} />
      <div style={{position: 'absolute', left: 40, right: 40, top: AREA_TOP + 70, display: 'flex', alignItems: 'center'}}>
        {name(ks.name.toUpperCase(), -1)}
        <div style={{width: 90, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 90, color: C.amber, opacity: f >= IMPACT ? 1 : 0, transform: `scale(${3 - 2 * eq})`, textShadow: `0 0 ${20 + 20 * landed}px ${C.amber}99`}}>=</div>
        {name(ne.name.toUpperCase(), 1)}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: AREA_TOP + 175, textAlign: 'center', fontFamily: F.body, fontWeight: 700, fontSize: 34, letterSpacing: '0.16em', color: C.muted, opacity: ramp(f, 6, 14)}}>{money(SALARY)} BUYS</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: AREA_TOP + 215, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 190, lineHeight: 1, color: C.mint, textShadow: `0 0 ${24 + 36 * landed}px ${C.mint}88`, opacity: ramp(f, 4, 10), ...tabular}}>
        {money(SALARY + (buys - SALARY) * run)}
      </div>
      <Words start={IMPACT + 6} top={AREA_TOP + 440} size={56} accent={C.mint} words={[{t: 'Two'}, {t: 'states'}, {t: 'tie.'}, {t: 'Both'}, {t: 'beat'}, {t: 'California'}, {t: 'by'}, {t: `$${aheadK}K.`, accent: true}]} />
    </Stage>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// Short 5: cheap is not a $100K job. The salary runs up, then a red slash strikes it out and a "?" lands.
// ---------------------------------------------------------------------------------------------------------------------
export const Short5Hook: React.FC = () => {
  const f = useDesignFrame();
  const run = roll(ramp(f, 4, 44));
  const slash = tween(f, IMPACT, 10, glide);
  const q = tween(f, IMPACT + 6, 14, slam);
  const landed = ramp(f, IMPACT, IMPACT + 10);
  const col = mix(C.mint, C.muted, landed);
  const cues: Cue[] = [
    {sfx: 'pop', at: 2, gain: 0.3, hero: true},
    {sfx: 'riser_short', at: IMPACT, gain: 0.45, hero: true},
    {sfx: 'hit_med', at: IMPACT, gain: 0.6, hero: true},
    {sfx: 'glitch', at: IMPACT + 2, gain: 0.35, hero: true},
  ];
  return (
    <Stage cues={cues}>
      <Pill text="CHEAP STATE" color={C.mint} />
      <div style={{position: 'absolute', left: 0, right: 0, top: AREA_TOP + 90, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 190, lineHeight: 1, color: col, opacity: ramp(f, 2, 8) * (1 - 0.35 * landed), ...tabular}}>
        {money(SALARY * run)}
      </div>
      {/* the strike: a red bar that draws left to right across the figure */}
      <div style={{position: 'absolute', left: 90, top: AREA_TOP + 90 + 100, width: 900 * slash, height: 14, borderRadius: 7, background: C.red, transform: 'rotate(-5deg)', transformOrigin: '0% 50%', boxShadow: `0 0 26px ${C.red}`}} />
      <div style={{position: 'absolute', right: 80, top: AREA_TOP + 260, fontFamily: F.display, fontWeight: 700, fontSize: 130, lineHeight: 1, color: C.red, opacity: f >= IMPACT + 6 ? 1 : 0, transform: `scale(${2.4 - 1.4 * q}) rotate(${10 * (1 - q)}deg)`}}>?</div>
      <Words start={IMPACT + 6} top={AREA_TOP + 440} size={56} accent={C.red} words={[{t: 'Cheap'}, {t: "doesn't"}, {t: 'mean'}, {t: "you'd"}, {t: 'earn', accent: true}, {t: '$100K', accent: true}, {t: 'there.', accent: true}]} />
    </Stage>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// Short 7: "Try this with your own salary." A salary box types itself, then the formula part lands under it. Compact on purpose:
// the profile card of the Short sits from y 400, so the hook stays above it and the card shows through the glass frame.
// ---------------------------------------------------------------------------------------------------------------------
export const Short7Hook: React.FC = () => {
  const f = useDesignFrame();
  const text = money(SALARY);
  const typed = Math.min(text.length, Math.floor(ramp(f, 6, 40) * (text.length + 0.99)));
  const cursor = Math.floor(f / 8) % 2 === 0 || typed < text.length;
  const part = tween(f, IMPACT, 14, slam);
  const cues: Cue[] = [
    ...Array.from({length: text.length}, (_, i): Cue => ({sfx: (`tick_${i % 3}`) as Cue['sfx'], at: 6 + Math.round((i / text.length) * 34), gain: 0.22, hero: true})),
    {sfx: 'riser_short', at: IMPACT, gain: 0.4, hero: true},
    {sfx: 'hit_med', at: IMPACT, gain: 0.55, hero: true},
  ];
  return (
    <Stage cues={cues} height={560} alpha={0.82}>
      <Pill text="YOUR SALARY" color={C.amber} />
      <div style={{position: 'absolute', left: 150, right: 150, top: AREA_TOP + 66, height: 110, borderRadius: 24, border: `3px solid ${C.amber}`, background: 'rgba(5,14,29,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 84, color: C.text, opacity: ramp(f, 2, 8), ...tabular}}>
        {text.slice(0, typed)}
        <span style={{display: 'inline-block', width: 6, height: 76, marginLeft: 6, background: C.amber, opacity: cursor ? 1 : 0}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: AREA_TOP + 196, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 64, color: C.amber, opacity: f >= IMPACT ? 1 : 0, transform: `scale(${2 - part}) translateY(${(1 - part) * -20}px)`, textShadow: `0 0 28px ${C.amber}88`, whiteSpace: 'nowrap'}}>
        ÷ (RPP ÷ 100)
      </div>
      <Words start={IMPACT + 6} top={AREA_TOP + 286} size={54} accent={C.amber} words={[{t: 'Try'}, {t: 'this'}, {t: 'with'}, {t: 'your'}, {t: 'own', accent: true}, {t: 'salary.', accent: true}]} />
    </Stage>
  );
};

export const SHORT_HOOK_ANIMS: Partial<Record<number, React.FC>> = {2: Short2Hook, 3: Short3Hook, 4: Short4Hook, 5: Short5Hook, 7: Short7Hook};
