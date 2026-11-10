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
import {C, F, H, W, sec, tabular} from '../theme';
import {useDesignFrame} from '../clock';

// Method, cut from 42 s to 20 s. Two changes:
//  1. The worked example is California, not Arkansas. The old one walked the winner's score and its $115,100 result
//     across the screen, which gave away #1 before the countdown began. California is already on screen from the hook.
//  2. The gauge leaves, the formula lands, and the leaderboard opens straight after it: no idle stretch in between.
export const SHOT3_FRAMES = sec(SHOT_SECONDS.shot3);

/** Shot-local times (0 = the start of the shot). */
export const T = {
  avg:     sec(2.5),  // needle springs to 100
  toCal:   sec(5),    // and swings to California
  formula: sec(9.5),
  rail:    sec(16.5), // leaderboard opens, "Let's count down"
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
  const formulaOpacity = win(f, T.formula, T.rail - 6, 10);

  // The three limits as a single compact footnote line that fades in one beat
  // after the result lands — no stagger, no chips, no separate beat.
  const footnoteDelay = resultDelay + 54 + 6; // result count finishes + 6 frames
  const footnote = 'State averages · Before tax · Prices, not pay';

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
            opacity: win(f, footnoteDelay, T.rail - 6, 8),
          }}
        >
          <MaskLine start={footnoteDelay} dur={18}>
            {footnote}
          </MaskLine>
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
