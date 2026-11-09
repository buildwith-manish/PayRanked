import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Background} from '../components/Background';
import {USMap, GEO, MapGeo, geoOf} from '../components/USMap';
import {Count} from '../components/Count';
import {Bracket} from '../components/Bracket';
import {Glass} from '../components/Glass';
import {MaskChars, MaskLine, MaskWords} from '../components/MaskText';
import {MotionBlur} from '../components/MotionBlur';
import {Odometer} from '../components/Odometer';
import {exitIn, glide, ramp, slam, snap, stagger, tween} from '../motion';
import {Flash, SourceTag, win} from '../components/common';
import {BOTTOM_FIVE, NO_WAGE_TAX, STATES, byName, fmtUSD, gap} from '../data';
import {C, F, H, MARGIN, W, mix, ordinal, sec, tabular} from '../theme';

export const SHOT5_FRAMES = sec(130); // 5:35 to 7:45

/** Shot-local times (0 = 5:35). */
export const T = {
  rows: sec(25), // 6:00
  bars: sec(60), // 6:35
  interrupt: sec(85), // 7:00
  lights: sec(88), // 7:03
  ring: sec(115), // 7:30
};

const ark = byName('Arkansas');
const cal = byName('California');
const BASE = '#2a4a70';
const origin = geoOf('Arkansas').centroid;
const distFromArkansas = (g: MapGeo) => Math.hypot(g.centroid[0] - origin[0], g.centroid[1] - origin[1]);
const maxDist = Math.max(...GEO.map(distFromArkansas));
const waveColor = (rpp: number) => mix(C.emerald, C.red, (rpp - ark.rpp) / (cal.rpp - ark.rpp));

/** The nine no-wage-tax states, west to east, so they light up in a sweep. */
const taxStates = NO_WAGE_TAX.map((name) => ({name, geo: geoOf(name)})).sort((a, b) => a.geo.centroid[0] - b.geo.centroid[0]);

const Row: React.FC<{name: string; i: number}> = ({name, i}) => {
  const f = useCurrentFrame();
  const s = byName(name);
  const d = T.rows + stagger(i, 6);
  const isCal = name === 'California';
  const inAt = (t: number) => tween(t, d, 26, glide);
  const p = inAt(f);
  // one accent (red). California is the focal row at full strength; the others sit back at half.
  const barW = (s.display / ark.display) * 760 * tween(f, d + 6, 34, glide);
  return (
    <MotionBlur dx={-260 * (inAt(f) - inAt(f - 1)) * -1} style={{position: 'absolute', left: MARGIN, right: MARGIN, top: 190 + i * 128, height: 108}}>
      <Glass
        radius={24}
        tint={isCal ? C.red : C.text}
        strength={isCal ? 1.2 : 0.6}
        glow={isCal ? 22 : 0}
        style={{
          height: 108,
          display: 'flex',
          alignItems: 'center',
          padding: '0 36px',
          gap: 28,
          opacity: Math.min(1, p * 2) * (isCal ? 1 : 0.62),
          transform: `translateX(${(1 - p) * -260}px)`,
        }}
      >
        <div style={{width: 330, fontFamily: F.display, fontWeight: 700, fontSize: 40, color: C.text}}>
          <MaskLine start={d + 4} dur={18}>
            {name}
          </MaskLine>
        </div>
        <div style={{width: 780, height: 44, borderRadius: 22, background: 'rgba(232,238,247,0.08)'}}>
          <div style={{width: barW, height: 44, borderRadius: 22, background: C.red, opacity: isCal ? 1 : 0.7, boxShadow: isCal ? `0 0 20px ${C.red}88` : 'none'}} />
        </div>
        <div style={{flex: 1, textAlign: 'right'}}>
          <Count to={s.display} start={d + 10} duration={50} size={54} color={isCal ? C.red : C.text} />
        </div>
      </Glass>
    </MotionBlur>
  );
};

const BarCol: React.FC<{x: number; height: number; color: string; label: string; value: number; delay: number}> = ({x, height, color, label, value, delay}) => {
  const f = useCurrentFrame();
  // the bar rises on a snap curve (small overshoot); its value follows the top edge and rolls a few frames later
  const p = tween(f, delay, 40, snap);
  const h = height * p;
  const prevH = height * tween(f - 1, delay, 40, snap);
  return (
    <>
      <MotionBlur dy={-(h - prevH)} shutter={0.5} cap={26} style={{position: 'absolute', left: x, top: 860 - Math.max(0, h), width: 320, height: Math.max(0, h)}}>
        <div style={{width: 320, height: Math.max(0, h), borderRadius: '24px 24px 0 0', background: `linear-gradient(${color}, ${mix('#050E1D', color, 0.4)})`, boxShadow: `0 0 40px ${color}55`}} />
      </MotionBlur>
      <div style={{position: 'absolute', left: x - 40, width: 400, top: 860 - Math.max(0, h) - 96, textAlign: 'center', opacity: ramp(f, delay + 6, delay + 14)}}>
        <Count to={value} start={delay + 8} duration={50} size={78} color={color} />
      </div>
      <div style={{position: 'absolute', left: x - 40, width: 400, top: 884, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 40, color: C.text}}>
        <MaskChars text={label} start={delay + 2} step={1.4} />
      </div>
    </>
  );
};

const InfoCard: React.FC<{start: number; end: number; children: React.ReactNode}> = ({start, end, children}) => {
  const f = useCurrentFrame();
  const inAt = (t: number) => tween(t, start, 24, glide);
  if (f < start || f > end) return null;
  const out = ramp(f, end - 12, end, exitIn);
  return (
    <MotionBlur dy={120 * (inAt(f) - inAt(f - 1)) * -1} style={{position: 'absolute', left: 160, right: 160, top: 740, height: 190}}>
      <Glass
        radius={30}
        tint={C.text}
        strength={1.1}
        style={{
          height: 190,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: ramp(f, start, start + 10, glide) * (1 - out),
          transform: `translateY(${(1 - inAt(f)) * 120 + out * 30}px)`,
        }}
      >
        {children}
      </Glass>
    </MotionBlur>
  );
};

export const Shot5: React.FC = () => {
  const f = useCurrentFrame();
  const wa = byName('Washington');
  const tx = byName('Texas');
  const waRank = STATES.filter((s) => s.rpp > wa.rpp).length + 1;
  const g = gap('Arkansas', 'California');

  // map colours: wave outward from Arkansas, then amber for the no-wage-tax states
  const fillFor = (name: string) => {
    const row = STATES.find((s) => s.name === name);
    if (!row) return BASE;
    const delay = (distFromArkansas(geoOf(name)) / maxDist) * sec(18);
    let col = mix(BASE, waveColor(row.rpp), (f - delay) / 20);
    const idx = taxStates.findIndex((t) => t.name === name);
    if (idx >= 0) col = mix(col, C.amber, (f - (T.lights + idx * 4)) / 10);
    return col;
  };
  const isTax = (name: string) => NO_WAGE_TAX.includes(name);
  const dimOthers = ramp(f, T.lights, T.lights + 15, glide);

  const mapOpacity = interpolate(f, [0, sec(24), sec(26), sec(59), sec(61), sec(84), sec(85), sec(115), sec(117)], [1, 1, 0.28, 0.28, 0.12, 0.12, 1, 1, 0.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // the interrupt: the map punches in and settles back on a glide
  const interruptZoom = 1.45 - 0.45 * tween(f, T.interrupt, 22, glide);
  const mapScale = (f >= T.interrupt ? interruptZoom : 1) * interpolate(f, [0, SHOT5_FRAMES], [1, 1.03]);
  const inverted = f >= T.interrupt && f < T.interrupt + 6;

  // bars phase: the bars are a semantic pair (mint, red); when the gap slams in they step back so it is the one accent
  const hArk = 560;
  const hCal = hArk * (cal.dollars / ark.dollars);
  const pctAt = (t: number) => tween(t, T.bars + 40, 22, slam);
  const pctScale = (t: number) => 1 + 1.0 * (1 - pctAt(t));
  const pctBlur = Math.min(14, Math.abs(pctScale(f) - pctScale(f - 1)) * 18);
  const barsBack = ramp(f, T.bars + 40, T.bars + 58, glide);

  // lights phase: a smooth count of how many states have lit, so the number rolls instead of jumping
  const litAt = (t: number) => taxStates.reduce((a, _, idx) => a + tween(t, T.lights + idx * 4 + 10, 8, glide), 0);

  const legendIn = tween(f, sec(18), 26, glide);

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, filter: inverted ? 'invert(1) hue-rotate(180deg)' : undefined}}>
        <Background glowX={W * 0.5} glowY={H * 0.5} glowColor={f < T.interrupt ? C.emerald : C.amber}>
          {/* map */}
          <AbsoluteFill style={{opacity: mapOpacity, transform: `scale(${mapScale})`}}>
            <USMap fill={fillFor} opacity={(n) => (f >= T.lights && !isTax(n) ? 1 - 0.8 * dimOthers : 1)} stroke="rgba(232,238,247,0.3)" glow={f >= T.lights ? NO_WAGE_TAX : []} />
            {/* the nine states name themselves as they light up: plain type, no pills, one at a time */}
            {taxStates.map((t, i) => {
              const d = T.lights + 30 + i * 8;
              if (f < d) return null;
              return (
                <div
                  key={t.name}
                  style={{
                    position: 'absolute',
                    left: t.geo.centroid[0],
                    top: t.geo.centroid[1],
                    transform: 'translate(-50%, -50%)',
                    fontFamily: F.display,
                    fontWeight: 700,
                    fontSize: 22,
                    color: C.navy3, // dark on amber: white on amber reads at about 1.5:1, this is about 11:1
                    whiteSpace: 'nowrap',
                    textShadow: 'none',
                  }}
                >
                  <MaskLine start={d} dur={16}>
                    {t.name.toUpperCase()}
                  </MaskLine>
                </div>
              );
            })}
            {/* pulsing ring on Washington */}
            {f >= T.ring && (
              <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
                {[0, 15, 30].map((o) => {
                  const r = ((f - T.ring + o) % 45) / 45;
                  const [x, y] = geoOf('Washington').centroid;
                  return <circle key={o} cx={x} cy={y} r={18 + r * 90} fill="none" stroke={C.amber} strokeWidth={4} opacity={(1 - r) * win(f, T.ring, T.ring + sec(6), 8)} />;
                })}
              </svg>
            )}
          </AbsoluteFill>

          {/* 0-25s: legend slides in while the wave spreads */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 880,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: win(f, sec(18), sec(25), 12),
              transform: `translateY(${(1 - legendIn) * 120}px)`,
            }}
          >
            <div style={{width: 760, height: 18, borderRadius: 9, background: `linear-gradient(90deg, ${C.emerald}, ${C.red})`}} />
            <div style={{width: 760, display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: F.body, fontWeight: 500, fontSize: 28, color: C.text, ...tabular}}>
              <span>More buying power · {fmtUSD(ark.display)}</span>
              <span>{fmtUSD(cal.display)} · Less</span>
            </div>
          </div>

          {/* 25-60s: the five expensive states as rows */}
          <div style={{position: 'absolute', inset: 0, opacity: win(f, T.rows - 4, T.bars - 2, 12)}}>
            <div style={{position: 'absolute', left: MARGIN, top: 70, fontFamily: F.display, fontWeight: 700, fontSize: 58, color: C.text}}>
              <MaskWords text="Where $100,000 shrinks the most" start={T.rows - 2} step={4} dur={20} />
            </div>
            {BOTTOM_FIVE.map((n, i) => (
              <Row key={n} name={n} i={i} />
            ))}
          </div>

          {/* 60-85s: Arkansas vs California bars, bracket, +27% */}
          <div style={{position: 'absolute', inset: 0, opacity: win(f, T.bars, T.interrupt, 10)}}>
            <div style={{position: 'absolute', inset: 0, opacity: 1 - 0.62 * barsBack}}>
              <BarCol x={380} height={hArk} color={C.mint} label="ARKANSAS" value={ark.display} delay={T.bars + 6} />
              <BarCol x={1220} height={hCal} color={C.red} label="CALIFORNIA" value={cal.display} delay={T.bars + 12} />
              <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
                <line x1={700} y1={860 - hArk} x2={1540} y2={860 - hArk} stroke={C.text} strokeWidth={3} strokeDasharray="14 12" opacity={0.5 * ramp(f, T.bars + 24, T.bars + 36)} />
              </svg>
              <Bracket x={724} y1={860 - hArk} y2={860 - hCal} start={T.bars + 30} duration={22} depth={16} color={C.text} />
            </div>
            {f >= T.bars + 40 && (
              <div
                style={{
                  position: 'absolute',
                  left: W / 2 - 220,
                  width: 440,
                  top: 860 - hArk + 14,
                  display: 'flex',
                  justifyContent: 'center',
                  transform: `scale(${pctScale(f)})`,
                  filter: pctBlur > 0.4 ? `blur(${pctBlur}px)` : undefined,
                  opacity: Math.min(1, pctAt(f) * 3),
                }}
              >
                <Count to={Math.round(g.pct)} from={0} start={T.bars + 40} duration={34} size={130} color={C.amber} glow={22} prefix="+" suffix="%" />
              </div>
            )}
          </div>

          {/* 7:03-7:30: header and counter while the states light up */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 26,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 14,
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 46,
              color: C.amber,
              opacity: win(f, T.lights + 6, T.ring + 6, 12),
              ...tabular,
            }}
          >
            <Odometer value={litAt(f)} prevValue={litAt(f - 1)} size={46} color={C.amber} />
            <span>/ {NO_WAGE_TAX.length} · NO STATE TAX ON WAGES</span>
          </div>

          {/* 7:30-7:45: three cards, one at a time */}
          <InfoCard start={sec(116)} end={sec(122)}>
            <div style={{display: 'flex', alignItems: 'center', width: '100%'}}>
              <div style={{flex: 1, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 58, color: C.text}}>
                <MaskLine start={sec(116) + 8} dur={20}>
                  {ordinal(waRank)} most expensive
                </MaskLine>
              </div>
              <div style={{width: 4, height: 110, background: 'rgba(232,238,247,0.3)', borderRadius: 2}} />
              <div style={{flex: 1, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 58, color: C.amber}}>
                <MaskLine start={sec(116) + 14} dur={20}>
                  No wage tax
                </MaskLine>
              </div>
            </div>
          </InfoCard>
          <InfoCard start={sec(121.5)} end={sec(126)}>
            <div style={{textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 50, color: C.text, padding: '0 40px', ...tabular}}>
              <MaskLine start={sec(121.5) + 8} dur={22}>
                {tx.rpp.toFixed(1)} → about <span style={{color: C.amber}}>{fmtUSD(tx.display)}</span>, and no state wage tax
              </MaskLine>
            </div>
          </InfoCard>
          <InfoCard start={sec(125.5)} end={SHOT5_FRAMES + 60}>
            <div style={{textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 56, color: C.text, padding: '0 40px'}}>
              <MaskLine start={sec(125.5) + 8} dur={22}>
                Total cost matters more than one tax line
              </MaskLine>
            </div>
          </InfoCard>
        </Background>
        <SourceTag />
      </div>
      <Flash at={T.bars + 40} duration={8} peak={0.45} />
      <Flash at={T.interrupt} duration={6} peak={0.9} />
    </AbsoluteFill>
  );
};
