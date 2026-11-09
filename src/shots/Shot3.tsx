import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Background} from '../components/Background';
import {Gauge, useNeedle} from '../components/Gauge';
import {Count} from '../components/Count';
import {Chip} from '../components/Chip';
import {DrawIcon, IconKind} from '../components/Icons';
import {Leaderboard} from '../components/Leaderboard';
import {SourceTag, win} from '../components/common';
import {MaskLine, MaskWords} from '../components/MaskText';
import {MotionBlur} from '../components/MotionBlur';
import {glide, ramp, snap, tween} from '../motion';
import {byName, fmtUSD, SALARY} from '../data';
import {C, F, H, W, sec, tabular} from '../theme';
import {useDesignFrame} from '../clock';

export const SHOT3_FRAMES = sec(57); // 0:33 to 1:30

/** Shot-local times (0 = 0:33). */
export const T = {
  avg: sec(3.5), // needle springs to 100
  toCal: sec(7), // 0:40
  toArk: sec(13), // 0:46
  formula: sec(19), // 0:52
  chips: sec(32), // 1:05
  rail: sec(49), // 1:22
};

/** Label under the gauge: rises from behind a line, holds, then drops back behind it. One label at a time. */
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
  const ark = byName('Arkansas');

  const needle = useNeedle([
    {at: T.avg, value: 100},
    {at: T.toCal, value: cal.rpp},
    {at: T.toArk, value: ark.rpp},
  ]);
  const tint = f < T.toCal ? C.text : f < T.toArk ? C.red : C.emerald;
  const pricier = Math.round(cal.rpp - 100);
  const cheaper = Math.round(100 - ark.rpp);
  const gaugeOpacity = 1 - ramp(f, sec(18), sec(18) + 15, glide);

  // formula tokens, built from the data
  const tokens = ['$100,000', '÷', '(', ark.rpp.toFixed(1), '÷', '100', ')', '='];
  const resultDelay = T.formula + tokens.length * 5 + 6;
  const formulaOpacity = win(f, T.formula, T.chips - 6, 10);

  const chips: {text: string; icon: IconKind; color: string}[] = [
    {text: 'State averages', icon: 'pin', color: C.mint},
    {text: 'Before tax', icon: 'percent', color: C.mint},
    {text: 'Prices, not pay', icon: 'tag', color: C.mint},
  ];

  const typed = 'Let’s count down';

  return (
    <AbsoluteFill>
      <Background glowX={W / 2} glowY={H * 0.45}>
        {/* gauge */}
        <div style={{position: 'absolute', left: W / 2 - 450, top: 200, opacity: gaugeOpacity, transform: `scale(${1 - 0.1 * (1 - gaugeOpacity)})`}}>
          <Gauge value={needle} size={900} tint={tint} drawFrames={60} jitter={f > T.toCal && f < T.formula} />
        </div>
        <PopLabel text="US average" start={T.avg + 14} end={T.toCal + 6} color={C.text} />
        <PopLabel text={`California ${cal.rpp.toFixed(1)}: about ${pricier}% pricier`} start={T.toCal + 28} end={T.toArk + 4} color={C.red} />
        <PopLabel text={`Arkansas ${ark.rpp.toFixed(1)}: about ${cheaper}% cheaper`} start={T.toArk + 28} end={T.formula - 2} color={C.mint} />

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
            const d = T.formula + i * 5;
            // each token flies in on a snap curve (fast, tiny overshoot) with blur along its direction of travel
            const pAt = (t2: number) => tween(t2, d, 22, snap);
            const p = pAt(f);
            const [dx, dy] = DIRS[i % DIRS.length];
            const isEq = t === '=';
            const pulse = isEq && f > d + 14 ? 1 + 0.2 * Math.exp(-(f - d - 14) / 12) * Math.sin((f - d - 14) / 2.5) : 1;
            return (
              <MotionBlur key={i} dx={dx * 520 * (pAt(f) - pAt(f - 1))} dy={dy * 360 * (pAt(f) - pAt(f - 1))} shutter={0.6} cap={50} style={{display: 'inline-block'}}>
                <span
                  style={{
                    display: 'inline-block',
                    opacity: ramp(f, d, d + 6),
                    transform: `translate(${dx * 520 * (1 - p)}px, ${dy * 360 * (1 - p)}px) scale(${pulse})`,
                    color: isEq ? C.mint : t === '÷' ? C.muted : C.text,
                  }}
                >
                  {t}
                </span>
              </MotionBlur>
            );
          })}
          <span style={{opacity: ramp(f, resultDelay, resultDelay + 6)}}>
            <Count to={ark.display} start={resultDelay} duration={54} size={104} color={C.mint} glow={20} />
          </span>
        </div>
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
            {fmtUSD(SALARY)} salary in {ark.name} buys what {fmtUSD(ark.display)} buys at the US average
          </MaskLine>
        </div>

        {/* three limit chips, dropping in from the top with a tilt */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, opacity: win(f, T.chips, T.rail - 4, 10)}}>
          {chips.map((c, i) => {
            const d = T.chips + i * 20;
            return (
              <Chip
                key={c.text}
                text={c.text}
                delay={d}
                from="top"
                tilt={i % 2 === 0 ? -9 : 9}
                size={58}
                color={C.text}
                tint={C.text}
                icon={<DrawIcon kind={c.icon} start={d + 14} size={68} color={c.color} />}
              />
            );
          })}
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
