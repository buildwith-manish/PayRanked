import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Background} from '../components/Background';
import {Gauge, useNeedle} from '../components/Gauge';
import {Count} from '../components/Count';
import {Leaderboard} from '../components/Leaderboard';
import {SourceTag, win} from '../components/common';
import {MaskLine, MaskWords} from '../components/MaskText';
import {MotionBlur} from '../components/MotionBlur';
import {glide, ramp, snap, tween} from '../motion';
import {byName, fmtUSD, SALARY} from '../data';
import {SHOT_SECONDS} from '../timeline';
import {C, F, H, W, mix, sec, tabular} from '../theme';
import {useDesignFrame} from '../clock';

// Method, restored to 60 s (EXTEND-1). The gauge + formula + footnote still run in the first 20 s; the extra 40 s
// adds: what BEA measures (categories with weights), a concrete housing example (3 bars), and a final honesty
// line that carries the section out. Rail opens at 56 s instead of 16.5 s.
export const SHOT3_FRAMES = sec(SHOT_SECONDS.shot3);

/** Shot-local times (0 = the start of the shot). */
export const T = {
  avg:       sec(2.5),  // needle springs to 100
  toCal:     sec(5),    // and swings to California
  formula:   sec(9.5),  // formula tokens fly in
  rail:      sec(56.5), // leaderboard opens, "Let's count down" (was 16.5; the new beats fill 20-56 s)
  // EXTEND-1: the three new beats after the formula
  categories: sec(20),  // 5-category breakdown appears
  housing:    sec(35),  // 3-bar housing comparison
  honesty:    sec(50),  // "Prices, not paychecks" exit line
};

/** Label under the gauge: rises from behind a line, holds, then drops back. */
const PopLabel: React.FC<{text: string; start: number; end: number; color: string}> = ({text, start, end, color}) => {
  const f = useDesignFrame();
  if (f < start || f > end + 20) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 790,
        textAlign: 'center',
        fontFamily: F.display,
        fontWeight: 700,
        fontSize: 58,
        color,
        ...tabular,
      }}
    >
      <MaskWords text={text} start={start} step={3} dur={18} leaveAt={end - 6} />
    </div>
  );
};

/** Token directions for the formula fly-in, cycled. */
const DIRS: [number, number][] = [[-1, 0], [0, -1], [1, 0], [0, 1], [-1, -1], [1, -1], [1, 1], [-1, 1], [0, 1]];

export const Shot3: React.FC = () => {
  const f = useDesignFrame();
  const cal = byName('California');

  const needle = useNeedle([
    {at: T.avg,   value: 100},
    {at: T.toCal, value: cal.rpp},
  ]);
  const tint    = f < T.toCal ? C.text : C.red;
  const pricier = Math.round(cal.rpp - 100);
  const gaugeOpacity = 1 - ramp(f, T.formula - 30, T.formula - 15, glide);

  // formula tokens, built from the data
  const tokens     = ['$100,000', '÷', '(', cal.rpp.toFixed(1), '÷', '100', ')', '='];
  const resultDelay = T.formula + tokens.length * 5 + 6;
  const formulaOpacity = win(f, T.formula, T.categories, 10);  // Bug 9: fade out before CategoriesBreakdown appears at T.categories

  // The limits as a single compact footnote line that fades in one beat
  // after the result lands — no stagger, no chips, no separate beat.
  // The index compares price levels only: it does not count state income tax, and housing is compared by type, size and
  // age of home, not by how good it is. Both are said on screen rather than hidden behind "before tax".
  const footnoteDelay = resultDelay + 54 + 6; // result count finishes + 6 frames
  const footnote = 'State averages · Prices only: income tax not counted · Housing quality varies';

  const typed = 'Let’s count down';

  return (
    <AbsoluteFill>
      <Background glowX={W / 2} glowY={H * 0.45}>
        {/* gauge */}
        <div style={{position: 'absolute', left: W / 2 - 450, top: 200, opacity: gaugeOpacity, transform: `scale(${1 - 0.1 * (1 - gaugeOpacity)})`}}>
          <Gauge value={needle} size={900} tint={tint} drawFrames={60} jitter={f > T.toCal && f < T.formula} />
        </div>
        <PopLabel text="US average" start={T.avg + 14} end={T.toCal + 6} color={C.text} />
        <PopLabel text={`California ${cal.rpp.toFixed(1)}: about ${pricier}% pricier`} start={T.toCal + 28} end={T.formula - 2} color={C.red}     />

        {/* formula, token by token */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 400,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'baseline',
            gap: 26,
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 104,
            color: C.text,
            opacity: formulaOpacity,
            ...tabular,
          }}
        >
          {tokens.map((t, i) => {
            const d    = T.formula + i * 5;
            const pAt  = (t2: number) => tween(t2, d, 22, snap);
            const p    = pAt(f);
            const [dx, dy] = DIRS[i % DIRS.length];
            const isEq = t === '=';
            const pulse = isEq && f > d + 14
              ? 1 + 0.2 * Math.exp(-(f - d - 14) / 12) * Math.sin((f - d - 14) / 2.5)
              : 1;
            return (
              <MotionBlur key={i} dx={dx * 520 * (pAt(f) - pAt(f - 1))} dy={dy * 360 * (pAt(f) - pAt(f - 1))} shutter={0.6} cap={50} style={{display: 'inline-block'}}>
                <span
                  style={{
                    display: 'inline-block',
                    opacity: ramp(f, d, d + 6),
                    transform: `translate(${dx * 520 * (1 - p)}px, ${dy * 360 * (1 - p)}px) scale(${pulse})`,
                    color: t === '÷' ? C.muted : C.text,
                  }}
                >
                  {t}
                </span>
              </MotionBlur>
            );
          })}
          <span style={{opacity: ramp(f, resultDelay, resultDelay + 6)}}>
            <Count to={cal.display} start={resultDelay} duration={54} size={104} color={C.red} glow={20} />
          </span>
        </div>

        {/* result caption: what the number means */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 560,
            textAlign: 'center',
            fontFamily: F.body,
            fontWeight: 500,
            fontSize: 38,
            color: C.muted,
            opacity: formulaOpacity,
          }}
        >
          <MaskLine start={resultDelay + 44} dur={22}>
            {fmtUSD(SALARY)} salary in {cal.name} buys what {fmtUSD(cal.display)} buys at the US average
          </MaskLine>
        </div>

        {/* Fix 1: single compact footnote replaces three staggered chip animations.
            Fades in one beat after the result count finishes; exits with the formula. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 650,
            textAlign: 'center',
            fontFamily: F.body,
            fontWeight: 500,
            fontSize: 30,
            color: C.muted,
            letterSpacing: '0.08em',
            opacity: win(f, footnoteDelay, T.categories, 8),  // Bug 9: fade out before CategoriesBreakdown
          }}
        >
          <MaskLine start={footnoteDelay} dur={18}>
            {footnote}
          </MaskLine>
        </div>

        {/* EXTEND-1 (20-35 s): what BEA measures — 5 category bars with their RPP weight shares.
            Source: BEA Regional Price Parities by Major Category, 2024. Weights are the national expenditure shares
            that feed the all-items index (Housing 42%, Other services 19%, Food 13%, Transportation 9%, Medical 7%,
            other 10%). The point is: housing dominates, which sets up the housing example next. */}
        <CategoriesBreakdown start={T.categories} end={T.housing - 2} opacity={win(f, T.categories, T.housing - 2, 12)} />

        {/* EXTEND-1 (35-50 s): concrete housing example — 3 bars count up.
            Zillow ZHVI typical home value, September 2024 (Q3 close to the BEA 2024 release).
              US median: ~$360K  Arkansas: ~$215K  California: ~$780K
            Numbers are rounded to the nearest $5K and use the same count-up as the formula result. */}
        <HousingExample start={T.housing} end={T.honesty - 2} opacity={win(f, T.housing, T.honesty - 2, 12)} />

        {/* EXTEND-1 (50-60 s): the honesty line that carries the section out.
            Repeats the footnote as a single big line ("Prices, not paychecks. Pay gets its own video.") so the
            viewer leaves the method with the same caveat in two forms: small footnote (limits) + big exit line (what
            to do about it). */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 470,
            textAlign: 'center',
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 84,
            color: C.text,
            letterSpacing: '-0.01em',
            opacity: win(f, T.honesty, T.rail - 4, 12),
          }}
        >
          <MaskWords text="Prices, not paychecks." start={T.honesty} step={4} dur={20} leaveAt={T.rail - 8} />
          <div style={{marginTop: 24, fontFamily: F.body, fontWeight: 500, fontSize: 40, color: C.muted}}>
            <MaskLine start={T.honesty + 24} dur={20}>Pay gets its own video.</MaskLine>
          </div>
        </div>

        {/* leaderboard rail + typed line */}
        <Leaderboard entries={[]} revealAt={T.rail} />
        {f >= T.rail + 25 && (
          <div style={{position: 'absolute', left: 560, top: 440, fontFamily: F.display, fontWeight: 700, fontSize: 104, color: C.text}}>
            <MaskWords text={typed} start={T.rail + 25} step={7} dur={22} />
          </div>
        )}
      </Background>
      <SourceTag />
    </AbsoluteFill>
  );
};


// EXTEND-1 helpers: the categories breakdown and the housing example.
// Both are pure SVG/divs with the same motion language as the rest of the shot (spring + glide + ramp).

/** BEA RPP categories with their national expenditure weights (the share of consumer spending each represents).
 *  Source: BEA Regional Price Parities by Major Type of Product, 2024 release. */
const BEA_CATEGORIES = [
  {label: 'Housing',     weight: 42, color: C.emerald},
  {label: 'Other',       weight: 19, color: C.muted},
  {label: 'Food',        weight: 13, color: C.amber},
  {label: 'Transport',   weight: 9,  color: C.mint},
  {label: 'Medical',     weight: 7,  color: C.red},
  {label: 'Goods + Rest', weight: 10, color: C.muted},
];

const CategoriesBreakdown: React.FC<{start: number; end: number; opacity: number}> = ({start, end, opacity}) => {
  const f = useDesignFrame();
  if (f < start - 6 || f > end + 12) return null;
  // The 6 bars appear left to right with a 6-frame stagger; each bar's height = its weight / 42 * 280.
  const maxBar = 280;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 380,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 28,
        opacity,
      }}
    >
      <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 56, color: C.text, textAlign: 'center'}}>
        <MaskLine start={start} dur={18}>What BEA measures</MaskLine>
      </div>
      <div style={{display: 'flex', gap: 48, alignItems: 'flex-end', height: maxBar + 80}}>
        {BEA_CATEGORIES.map((c, i) => {
          const d = start + 18 + i * 6;
          const p = tween(f, d, 22, snap);
          const h = c.weight / 42 * maxBar * p;
          const prev = c.weight / 42 * maxBar * tween(f - 1, d, 22, snap);
          return (
            <div key={c.label} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
              <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 36, color: c.color, opacity: p, ...tabular}}>
                {c.weight}%
              </div>
              <MotionBlur dy={-(h - prev)} shutter={0.5} cap={20} style={{width: 110, height: Math.max(0, h)}}>
                <div style={{width: 110, height: Math.max(0, h), background: c.color, borderRadius: '8px 8px 0 0', boxShadow: `0 0 18px ${c.color}55`}} />
              </MotionBlur>
              <div style={{fontFamily: F.body, fontWeight: 500, fontSize: 28, color: C.muted, opacity: ramp(f, d + 8, d + 16)}}>
                {c.label}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{fontFamily: F.body, fontWeight: 500, fontSize: 30, color: C.muted, opacity: ramp(f, start + 60, start + 80)}}>
        Housing dominates. That\'s why cheap states feel cheap.
      </div>
    </div>
  );
};

/** Concrete housing example: 3 bars (US median, Arkansas, California) with count-up animation.
 *  Source: Zillow ZHVI typical home value, September 2024 (Q3 close to the BEA 2024 release). */
const HOUSING_VALUES = [
  {label: 'US median',    value: 360, color: C.muted},
  {label: 'Arkansas',     value: 215, color: C.emerald},
  {label: 'California',   value: 780, color: C.red},
];

const HousingExample: React.FC<{start: number; end: number; opacity: number}> = ({start, end, opacity}) => {
  const f = useDesignFrame();
  if (f < start - 6 || f > end + 12) return null;
  const maxBar = 320;
  // Scale: California is the tallest at 780; bar = value/780 * maxBar.
  const scale = (v: number) => v / 780 * maxBar;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 360,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
        opacity,
      }}
    >
      <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 56, color: C.text, textAlign: 'center'}}>
        <MaskLine start={start} dur={18}>Median home value</MaskLine>
      </div>
      <div style={{display: 'flex', gap: 80, alignItems: 'flex-end', height: maxBar + 110}}>
        {HOUSING_VALUES.map((h, i) => {
          const d = start + 18 + i * 8;
          const p = tween(f, d, 24, snap);
          const targetH = scale(h.value) * p;
          const prevH = scale(h.value) * tween(f - 1, d, 24, snap);
          return (
            <div key={h.label} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
              <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 44, color: h.color, opacity: p, ...tabular}}>
                <Count to={h.value} start={d + 4} duration={50} size={44} color={h.color} prefix="$" suffix="K" />
              </div>
              <MotionBlur dy={-(targetH - prevH)} shutter={0.5} cap={24} style={{width: 180, height: Math.max(0, targetH)}}>
                <div style={{width: 180, height: Math.max(0, targetH), background: `linear-gradient(${h.color}, ${mix('#050E1D', h.color, 0.4)})`, borderRadius: '12px 12px 0 0', boxShadow: `0 0 24px ${h.color}55`}} />
              </MotionBlur>
              <div style={{fontFamily: F.body, fontWeight: 500, fontSize: 30, color: C.muted, opacity: ramp(f, d + 14, d + 22)}}>
                {h.label}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{fontFamily: F.body, fontWeight: 500, fontSize: 30, color: C.muted, opacity: ramp(f, start + 80, start + 100), textAlign: 'center', maxWidth: 1200}}>
        Same $100K salary — but a California mortgage eats 4× what an Arkansas one does.
      </div>
    </div>
  );
};
