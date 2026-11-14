import React from 'react';
import {useDesignFrame} from '../clock';
import {C} from '../theme';
import {glide, slam, tween} from '../motion';
import {CoinStack} from '../components/CoinStack';
import {FONT, GOLD, ROLE, ROLE_LABEL, TYPE, coinsFor} from './system';
import {LocatorMap, MetroMap} from './MetroMap';
import {Dial, Enter, CountMoney, IndexBar, Label, Ladder, Pill, RankSlam, Source, Tag} from './parts';
import {END_SCREEN_SECONDS, METROS, Metro, byRank, d, group, money, shownName} from './layout';
import {breakBeats, cityBeats, coldBeats, methodBeats, twistBeats} from './beats';

const Stack: React.FC<{dollars: number; at: number; color: string; left: number; top: number; ref10?: boolean; scale?: number}> = ({dollars, at, color, left, top, ref10 = true, scale = 1}) => (
  <div style={{position: 'absolute', left, top, transform: `scale(${scale})`, transformOrigin: '0% 0%'}}>
    <CoinStack count={coinsFor(dollars)} max={12} appearAt={at} color={color} refLineAt={ref10 ? 10 : undefined} refLabel="$50,000" width={170} />
  </div>
);

/* ------------------------------------------------------------------ cold open */
export const ColdOpen: React.FC = () => {
  const f = useDesignFrame();
  const {g, tOther, tOnly, tFirst, tGap, tWinner, tStops, tTitle} = coldBeats();
  const rel = g.rel;
  const hou = byRank(1), mia = byRank(10);
  const gap = hou.buyingPower50k - mia.buyingPower50k;
  const split = tween(f, tOther, 30, glide);
  const crack = tween(f, tStops, 14, slam);
  const big = TYPE.title * 0.72;
  return (
    <>
      <Enter at={4} style={{left: 300, top: 60}}><Label>PERSON A</Label></Enter>
      <Enter at={10} style={{left: 840, top: 60}}><Label>PERSON B</Label></Enter>
      <Stack dollars={50000} at={4} color={ROLE.buying} left={330} top={110} scale={1.25} />
      <Stack dollars={50000 - (50000 - mia.buyingPower50k) * split} at={10} color={split > 0.5 ? ROLE.loss : ROLE.buying} left={870} top={110} scale={1.25} />
      <Enter at={rel[0] + 30} style={{left: 300, top: 600}}><div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: big, color: C.text}}>$50,000 a year</div></Enter>
      <Enter at={rel[0] + 36} style={{left: 840, top: 600}}><div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: big, color: C.text}}>$50,000 a year</div></Enter>
      <Enter at={tFirst} style={{left: 300, top: 710}}><CountMoney from={50000} to={hou.buyingPower50k} at={tFirst} color={ROLE.buying} size={TYPE.number * 0.8} /></Enter>
      <Enter at={tOnly} style={{left: 840, top: 710}}><CountMoney from={50000} to={mia.buyingPower50k} at={tOnly} color={ROLE.loss} size={TYPE.number * 0.8} /></Enter>
      <Enter at={rel[1] + 20} style={{left: 300, top: 850}}><Label size={32}>buys this much at average U.S. prices</Label></Enter>
      <div style={{position: 'absolute', left: 1290, top: 220, opacity: tween(f, tGap, 8), transform: `scale(${1 + (1 - tween(f, tGap, 14, slam)) * 0.8})`, transformOrigin: '0% 50%'}}>
        <div style={{fontFamily: FONT.text, fontWeight: 700, fontSize: TYPE.label, color: C.muted}}>THE GAP</div>
        <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: TYPE.hero * 0.62, color: ROLE.loss, textShadow: `0 0 50px ${ROLE.loss}88`}}>{money(gap)}</div>
        <div style={{fontFamily: FONT.text, fontSize: 32, color: C.text}}>just from where they live</div>
      </div>
      <Enter at={tWinner} style={{left: 1290, top: 620}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
          <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 110, color: crack > 0.5 ? C.muted : ROLE.buying, transform: `rotate(${crack * -8}deg)`}}>#1</div>
          <Label color={C.text} size={32}>{crack > 0.5 ? 'stops winning' : '10 metros ranked'}</Label>
        </div>
      </Enter>
      <Enter at={tTitle} style={{left: 0, top: 0, width: 1920, height: 1080, background: 'rgba(5,14,29,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: TYPE.hero * 0.6, color: C.text}}>Let's start at the bottom.</div>
      </Enter>
    </>
  );
};

/* ------------------------------------------------------------------ method */
export const Method: React.FC = () => {
  const f = useDesignFrame();
  const {g, tDial, tAbove, tEq, tRent, tGoods, tServ, tSources, tMap, tMapOut} = methodBeats();
  const rel = g.rel;
  const eq = tween(f, tEq, 20, glide);
  const mapIn = tween(f, tMap, 22, glide) * (1 - tween(f, tMapOut, 14));
  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: 1 - mapIn}}>
      <Enter at={6} style={{left: 160, top: 90}}><Label color={ROLE.buying} size={TYPE.title * 0.6}>THE METHOD</Label></Enter>
      <Enter at={rel[0] + 24} style={{left: 160, top: 190}}><Dial value={byRank(10).bea.allItems} at={tDial} width={620} /></Enter>
      <Enter at={rel[0] + 10} style={{left: 960, top: 190}}>
        <div style={{fontFamily: FONT.text, fontWeight: 600, fontSize: TYPE.label, color: C.text, width: 800}}>Bureau of Economic Analysis<br /><span style={{color: C.muted}}>price level of every metro area</span></div>
      </Enter>
      <Enter at={tAbove} style={{left: 960, top: 360}}>
        <div style={{fontFamily: FONT.text, fontSize: TYPE.label, color: C.text, lineHeight: 1.5}}>
          <span style={{color: ROLE.rent}}>Above 100</span> prices run higher<br /><span style={{color: ROLE.buying}}>Below 100</span> prices run lower
        </div>
      </Enter>
      <div style={{position: 'absolute', left: 160, top: 640, opacity: eq, transform: `translateY(${(1 - eq) * 30}px)`, fontFamily: FONT.num, fontWeight: 700, fontSize: 80, color: C.text}}>
        salary <span style={{color: C.muted}}>×</span> 100 <span style={{color: C.muted}}>÷</span> <span style={{color: ROLE.rent}}>price level</span> <span style={{color: C.muted}}>=</span> <span style={{color: ROLE.buying}}>buying power</span>
      </div>
      <div style={{position: 'absolute', left: 160, top: 790, width: 1300}}>
        <div style={{display: 'flex', gap: 36}}>
          <Enter at={tRent} style={{position: 'relative'}}><Pill text={ROLE_LABEL.rent} color={ROLE.rent} /></Enter>
          <Enter at={tGoods} style={{position: 'relative'}}><Pill text={ROLE_LABEL.goods} color={ROLE.goods} /></Enter>
          <Enter at={tServ} style={{position: 'relative'}}><Pill text="Other services" color={ROLE.services} /></Enter>
        </div>
      </div>
      <Enter at={rel[2] + 60} style={{left: 160, top: 900}}><Label>2024 data · metro areas, not just city limits</Label></Enter>
      <Enter at={tSources} style={{left: 1200, top: 900}}><Source text="BEA" /><Source text="CENSUS rent" /><Source text="BLS wages" /></Enter>
      </div>
      <MetroMap at={tMap} out={tMapOut} />
    </>
  );
};

/* ------------------------------------------------------------------ one city of the countdown */
export const CityScene: React.FC<{rank: number}> = ({rank}) => {
  const f = useDesignFrame();
  const m = byRank(rank);
  const {tPower, tDial, tRentBar, tGoodsBar, tServBar, tRent, tNext, tWin, tRemember, tPin} = cityBeats(rank);
  const tBars = tDial;
  const power = m.buyingPower50k;
  const revealed: Record<number, number> = {};
  for (let r = 10; r > rank; r--) revealed[r] = -1;
  revealed[rank] = 6;
  const diff = power - 50000;
  const good = diff >= 0;
  const atAvg = diff === 0;
  return (
    <>
      <Ladder revealed={revealed} active={rank} />
      <div style={{position: 'absolute', left: 500, top: 100}}><RankSlam text={`#${rank}`} at={0} /></div>
      <Enter at={10} style={{left: 500, top: 300}}><div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: shownName(m).length > 10 ? 56 : TYPE.title, color: C.text, whiteSpace: 'nowrap'}}>{shownName(m)}</div></Enter>
      <Stack dollars={power} at={tPower} color={good ? ROLE.buying : ROLE.loss} left={625} top={450} />
      <Enter at={tPower} style={{left: 1000, top: 110}}><Label>BUYING POWER OF $50,000</Label></Enter>
      <div style={{position: 'absolute', left: 1000, top: 160}}>
        <CountMoney from={50000} to={power} at={tPower} color={good ? ROLE.buying : ROLE.loss} size={TYPE.number * 0.82} />
      </div>
      <Enter at={tPower + 24} style={{left: 1000, top: 285}}>
        {atAvg ? (
          <Label color={C.text}>RIGHT AT THE AVERAGE</Label>
        ) : (
          <Label color={good ? ROLE.buying : ROLE.loss}>{good ? '+' : '−'}{money(Math.abs(diff))} vs $50,000</Label>
        )}
      </Enter>
      <div style={{position: 'absolute', left: 1000, top: 380}}><Dial value={m.bea.allItems} at={tBars} width={340} hideValue /></div>
      <Enter at={tBars + 10} style={{left: 1390, top: 410}}>
        <Label>PRICE LEVEL</Label>
        <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 72, color: m.bea.allItems > 100 ? ROLE.rent : ROLE.buying}}>{m.bea.allItems.toFixed(1)}</div>
      </Enter>
      <div style={{position: 'absolute', left: 1000, top: 650, display: 'flex', flexDirection: 'column', gap: 20}}>
        <IndexBar label={ROLE_LABEL.rent} value={m.bea.rents} color={ROLE.rent} at={tRentBar} />
        <IndexBar label={ROLE_LABEL.goods} value={m.bea.goods} color={ROLE.goods} at={tGoodsBar} />
        <IndexBar label="Other services" value={m.bea.otherServices} color={ROLE.services} at={tServBar} />
      </div>
      <Enter at={tRent} style={{left: 500, top: 880}}>
        <Pill text={`Median rent ${money(m.census.medianGrossRent)}/mo`} color={ROLE.rent} />
      </Enter>
      {rank === 7 && (
        <Enter at={tRemember} style={{left: 500, top: 960}}>
          <Pill text={`Median wage ${money(m.wage.medianAnnual)} — remember this`} color={ROLE.wage} size={28} />
        </Enter>
      )}
      {tWin >= 0 && (
        <Enter at={tWin} style={{left: 500, top: 960}}>
          <Pill text={`${money(power - byRank(10).buyingPower50k)} more than Miami`} color={GOLD} size={30} />
        </Enter>
      )}
      <Enter at={8} style={{left: 1556, top: 160}}>
        <LocatorMap name={m.name} at={tPin} done={METROS.filter((q) => q.rank > rank).map((q) => q.name)} next={rank > 1 ? byRank(rank - 1).name : undefined} nextAt={tNext} />
      </Enter>
      <Enter at={tNext} style={{left: 1000, top: 972}}>
        <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 40, color: ROLE.buying, opacity: 0.6 + 0.4 * Math.sin(f / 6)}}>
          {rank > 1 ? `NEXT  →  #${rank - 1}  ?` : 'BUT THERE IS A TWIST  →'}
        </div>
      </Enter>
    </>
  );
};

/* ------------------------------------------------------------------ rent vs paycheck */
export const RentBreak: React.FC = () => {
  const f = useDesignFrame();
  const {g, tMiami, tLA, tNote} = breakBeats();
  const rel = g.rel;
  const rows = [...METROS].sort((a, b) => b.rentShareOfWagePct - a.rentShareOfWagePct);
  return (
    <>
      <Enter at={4} style={{left: 160, top: 70}}>
        <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: TYPE.title, color: ROLE.rent}}>A year of rent vs. the typical paycheck</div>
      </Enter>
      {rows.map((m, i) => {
        const at = i === 0 ? tMiami : tLA + (i - 1) * 8;
        const p = tween(f, at, 24, glide);
        return (
          <div key={m.rank} style={{position: 'absolute', left: 160, top: 200 + i * 74, width: 1400, opacity: tween(f, at, 8), display: 'flex', alignItems: 'center'}}>
            <div style={{width: 360, fontFamily: FONT.text, fontWeight: 600, fontSize: 34, color: C.text}}>{shownName(m)}</div>
            <div style={{flex: 1, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.08)', position: 'relative'}}>
              <div style={{width: `${(m.rentShareOfWagePct / 60) * 100 * p}%`, height: '100%', borderRadius: 18, background: m.rentShareOfWagePct > 40 ? ROLE.rent : `${ROLE.rent}99`, boxShadow: `0 0 20px ${ROLE.rent}66`}} />
              <div style={{position: 'absolute', left: `${(40 / 60) * 100}%`, top: -6, width: 3, height: 48, background: C.text, opacity: 0.7}} />
            </div>
            <div style={{width: 120, textAlign: 'right', fontFamily: FONT.num, fontWeight: 700, fontSize: 38, color: ROLE.rent}}>{(m.rentShareOfWagePct * p).toFixed(0)}%</div>
          </div>
        );
      })}
      <Enter at={tNote} style={{left: 160, top: 922}}><Tag text="OUR OWN CALCULATION · yearly rent ÷ median wage, before taxes" size={24} /></Enter>
      <Enter at={tNote + 6} style={{left: 160, top: 990}}><Label size={28}>white tick = 40%, our own threshold</Label></Enter>
    </>
  );
};

/* ------------------------------------------------------------------ the twist */
/** Rank change chip: slams in, green up-arrow for a climb, red down-arrow for a drop. */
const RankChip: React.FC<{from: number; to: number; at: number; size?: number}> = ({from, to, at, size = 44}) => {
  const f = useDesignFrame();
  const p = tween(f, at, 14, slam);
  const up = to < from, same = to === from;
  const col = same ? C.muted : up ? ROLE.buying : ROLE.loss;
  return (
    <div style={{display: 'inline-block', marginTop: size < 44 ? 0 : 10, opacity: tween(f, at, 6), transform: `scale(${1 + (1 - p) * 0.6})`, transformOrigin: '100% 50%', fontFamily: FONT.num, fontWeight: 700, fontSize: size, color: col, textShadow: `0 0 24px ${col}77`, whiteSpace: 'nowrap'}}>
      {same ? '•' : up ? '▲' : '▼'} #{from} → #{to}{same ? '' : ` (${up ? '+' : '−'}${Math.abs(from - to)})`}
    </div>
  );
};

export const Twist: React.FC = () => {
  const f = useDesignFrame();
  const {g, tBadge, tHou, tDC, tNY, tMia, tPill} = twistBeats();
  const rel = g.rel;
  const rowH = 80, top0 = 190;
  const stage = f >= tMia ? 4 : f >= tNY ? 3 : f >= tDC ? 2 : f >= tHou ? 1 : 0;
  const hou = byRank(1), dc = byRank(7), ny = byRank(8), phl = byRank(3), mia = byRank(10);
  const featured: Metro[] = stage === 1 ? [hou] : stage === 2 ? [dc] : stage === 3 ? [ny, phl] : stage >= 4 ? [mia] : [];
  const maxV = 65000; // bars start at $0, so a $5k gap looks like a $5k gap
  // metros whose after-price paycheck is the same to the nearest $100 are shown as ties, so ranks 4/5 and 7/8 are not read as real gaps
  const byTwist = [...METROS].sort((x, y) => x.twistRank - y.twistRank);
  const tiePairs = byTwist.slice(1).map((m, i) => [byTwist[i], m] as const).filter(([a, b]) => Math.abs(a.wageAfterPrices - b.wageAfterPrices) < 50);
  const pulse = 0.5 + 0.5 * Math.sin(f / 7);
  const changed = Math.round(METROS.filter((m) => m.twistRank !== m.rank).length * tween(f, tHou, 60, glide));
  return (
    <>
      <Enter at={tHou} style={{left: 1350, top: 150}}><Label size={26}>RANKS CHANGED</Label></Enter>
      <Enter at={tHou} style={{left: 1670, top: 128}}>
        <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 64, color: ROLE.wage, fontVariantNumeric: 'tabular-nums'}}>{changed}/10</div>
      </Enter>
      <Enter at={4} style={{left: 160, top: 70}}>
        <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: TYPE.title * 0.8, color: ROLE.wage}}>
          {f >= tHou ? 'Paycheck after prices' : 'Same ranking…'}
        </div>
      </Enter>
      <Enter at={tBadge} style={{left: 960, top: 70}}><Pill text="OUR OWN CALCULATION · wage ÷ price level" color={ROLE.wage} size={28} /></Enter>
      <Enter at={rel[1] + 60} style={{left: 1330, top: 830, width: 490}}><Label size={24}>Atlanta/Chicago and Dallas/Phoenix are within about $20 of each other: treat each pair as a tie.</Label></Enter>
      {METROS.map((m) => {
        const stag = (m.rank - 1) * 6;
        const p = tween(f, tHou + stag, 30, glide);
        const y = top0 + ((m.rank - 1) + (m.twistRank - m.rank) * p) * rowH;
        const value = m.buyingPower50k + (m.wageAfterPrices - m.buyingPower50k) * p;
        const lit = featured.includes(m);
        const col = f >= tHou ? (m.twistRank < m.rank ? ROLE.buying : m.twistRank > m.rank ? ROLE.loss : C.text) : ROLE.buying;
        const shownRank = p > 0.5 ? m.twistRank : m.rank;
        return (
          <div key={m.rank} style={{position: 'absolute', left: 160, top: y, height: rowH - 10, width: 1000, display: 'flex', alignItems: 'center', borderRadius: 14, padding: '0 16px', background: lit ? `${col}22` : 'rgba(255,255,255,0.05)', border: `1.5px solid ${lit ? col : 'rgba(255,255,255,0.08)'}`, boxShadow: lit ? `0 0 ${16 + pulse * 22}px ${col}77` : 'none'}}>
            <div style={{width: 60, fontFamily: FONT.num, fontWeight: 700, fontSize: 36, color: col}}>{shownRank}</div>
            <div style={{width: 300, fontFamily: FONT.text, fontWeight: 600, fontSize: 32, color: C.text}}>{shownName(m)}</div>
            <div style={{width: (value / maxV) * 380, height: 22, borderRadius: 11, background: col, opacity: 0.9}} />
            <div style={{marginLeft: 'auto', fontFamily: FONT.num, fontWeight: 700, fontSize: 34, color: col, fontVariantNumeric: 'tabular-nums'}}>{money(value)}</div>
          </div>
        );
      })}
      <svg width={150} height={1080} style={{position: 'absolute', left: 1166, top: 0, opacity: tween(f, tHou + 40, 20), overflow: 'visible'}}>
        {METROS.map((m) => {
          const p = tween(f, tHou + (m.rank - 1) * 6, 30, glide);
          const yNew = top0 + ((m.rank - 1) + (m.twistRank - m.rank) * p) * rowH + (rowH - 10) / 2;
          const yOld = top0 + (m.rank - 1) * rowH + (rowH - 10) / 2;
          const c = m.twistRank < m.rank ? ROLE.buying : m.twistRank > m.rank ? ROLE.loss : C.muted;
          return (
            <g key={`slope-${m.rank}`}>
              <path d={`M 0 ${yNew} C 50 ${yNew}, 50 ${yOld}, 100 ${yOld}`} fill="none" stroke={c} strokeWidth={m.twistRank === m.rank ? 2 : 3.5} strokeOpacity={m.twistRank === m.rank ? 0.5 : 0.95} strokeLinecap="round" />
              <text x={112} y={yOld + 9} fill={C.muted} fontSize={26} fontWeight={700} fontFamily={FONT.num}>{m.rank}</text>
            </g>
          );
        })}
      </svg>
      <Enter at={tHou + 40} style={{left: 1268, top: top0 - 40}}><Label size={22}>WAS</Label></Enter>
      <div style={{position: 'absolute', left: 160, top: 1000, opacity: 0.8}}><Label size={22}>bars start at $0 · wages are before taxes</Label></div>
      {tiePairs.map(([a, b]) => {
        const y1 = top0 + (a.twistRank - 1) * rowH + 6, y2 = top0 + b.twistRank * rowH - 16;
        const o = tween(f, tHou + 80, 16);
        return (
          <React.Fragment key={`tie-${a.rank}-${b.rank}`}>
            <svg width={40} height={y2 - y1 + 4} style={{position: 'absolute', left: 116, top: y1 - 2, opacity: o, overflow: 'visible'}}>
              <path d={`M 34 2 H 12 V ${y2 - y1 + 2} H 34`} fill="none" stroke={C.text} strokeOpacity={0.75} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{position: 'absolute', left: 90, top: (y1 + y2) / 2 - 30, opacity: o, fontFamily: FONT.text, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: C.text, writingMode: 'vertical-rl', transform: 'rotate(180deg)'}}>TIE</div>
          </React.Fragment>
        );
      })}
      {featured.map((m, i) => {
        const two = featured.length > 1;
        const at0 = stage === 1 ? tHou + 10 : stage === 2 ? tDC : stage === 3 ? tNY + i * 40 : tMia;
        return (
          <Enter key={`${stage}-${m.rank}`} at={at0} style={{left: 1330, top: two ? 235 + i * 255 : 250, width: 490}}>
            <div style={{borderRadius: 20, padding: two ? '16px 24px' : 24, background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${ROLE.wage}`}}>
              {two ? (
                <>
                  <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
                    <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 36, color: C.text, whiteSpace: 'nowrap'}}>{shownName(m)}</div>
                    <RankChip from={m.rank} to={m.twistRank} at={at0 + 60} size={28} />
                  </div>
                  <div style={{display: 'flex', gap: 28, marginTop: 6}}>
                    <div>
                      <Label color={ROLE.wage} size={24}>MEDIAN WAGE</Label>
                      <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 46, color: ROLE.wage}}>{money(m.wage.medianAnnual)}</div>
                    </div>
                    <div>
                      <Label color={ROLE.buying} size={24}>AFTER PRICES</Label>
                      <div><CountMoney from={m.wage.medianAnnual} to={m.wageAfterPrices} at={at0 + 20} dur={36} color={ROLE.buying} size={46} /></div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 48, color: C.text}}>{shownName(m)}</div>
                  <Label color={ROLE.wage}>MEDIAN WAGE</Label>
                  <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 64, color: ROLE.wage}}>{money(m.wage.medianAnnual)}</div>
                  <Label color={ROLE.buying}>AFTER PRICES</Label>
                  <div><CountMoney from={m.wage.medianAnnual} to={m.wageAfterPrices} at={at0 + 20} dur={36} color={ROLE.buying} size={64} /></div>
                  <RankChip from={m.rank} to={m.twistRank} at={at0 + 60} />
                </>
              )}
            </div>
          </Enter>
        );
      })}
      <Enter at={tPill} style={{left: 1330, top: 735}}>
        <Pill text="Cheapest isn't automatically best" color={GOLD} size={28} />
      </Enter>
    </>
  );
};

/* ------------------------------------------------------------------ takeaway */
export const Takeaway: React.FC = () => {
  const f = useDesignFrame();
  const {rel} = group('s05_');
  const mia = byRank(10), hou = byRank(1), dc = byRank(7);
  const over40 = METROS.filter((m) => m.rentShareOfWagePct > 40).length;
  const wageUp = (dc.wage.medianAnnual / hou.wage.medianAnnual - 1) * 100;
  const priceUp = (dc.bea.allItems / hou.bea.allItems - 1) * 100;
  const card = (i: number) => ({opacity: tween(f, rel[i], 10) * (1 - (i < 3 ? tween(f, rel[i + 1] - 6, 8) : 0))});
  return (
    <>
      <div style={{position: 'absolute', inset: 0, ...card(0)}}>
        <Enter at={rel[0]} style={{left: 160, top: 120}}><Label color={ROLE.buying} size={TYPE.title * 0.6}>RULE 1 · compare what salaries buy</Label></Enter>
        <Enter at={rel[0] + 60} style={{left: 160, top: 360}}>
          <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 90, color: C.text}}>$50,000 <span style={{color: C.muted}}>×</span> 100 <span style={{color: C.muted}}>÷</span> <span style={{color: ROLE.rent}}>{mia.bea.allItems.toFixed(1)}</span></div>
        </Enter>
        <div style={{position: 'absolute', left: 160, top: 560}}><CountMoney from={50000} to={mia.buyingPower50k} at={rel[0] + 140} color={ROLE.loss} size={TYPE.hero * 0.8} /></div>
      </div>
      <div style={{position: 'absolute', inset: 0, ...card(1)}}>
        <Enter at={rel[1]} style={{left: 160, top: 120}}><Label color={ROLE.rent} size={TYPE.title * 0.6}>RULE 2 · put rent next to your pay</Label></Enter>
        {[...METROS].sort((a, b) => b.rentShareOfWagePct - a.rentShareOfWagePct).map((m, i) => (
          <Enter key={m.rank} at={rel[1] + 30 + i * 4} style={{left: 160 + (i % 5) * 340, top: 300 + Math.floor(i / 5) * 260}}>
            <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 80, fontVariantNumeric: 'tabular-nums', color: m.rentShareOfWagePct > 40 ? ROLE.rent : C.muted, textShadow: m.rentShareOfWagePct > 40 ? `0 0 ${10 + 14 * tween(f, rel[1] + 90, 20, slam)}px ${ROLE.rent}88` : 'none'}}>{(m.rentShareOfWagePct * tween(f, rel[1] + 30 + i * 4, 30, glide)).toFixed(0)}%</div>
            <Label color={C.text} size={30}>{shownName(m)}</Label>
          </Enter>
        ))}
        <Enter at={rel[1] + 90} style={{left: 160, top: 840}}><Pill text={`${over40} of 10 cities: rent is over 40% of the typical wage, before taxes`} color={ROLE.rent} size={34} /></Enter>
      </div>
      <div style={{position: 'absolute', inset: 0, ...card(2)}}>
        <Enter at={rel[2]} style={{left: 160, top: 120}}><Label color={ROLE.wage} size={TYPE.title * 0.6}>RULE 3 · judge a job offer the same way</Label></Enter>
        <Enter at={rel[2] + 20} style={{left: 160, top: 330}}>
          <Label>WASHINGTON vs HOUSTON</Label>
          <div style={{display: 'flex', gap: 120, marginTop: 20}}>
            <div><div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 150, color: ROLE.wage, fontVariantNumeric: 'tabular-nums'}}>+{(wageUp * tween(f, rel[2] + 40, 36, glide)).toFixed(0)}%</div><Label color={ROLE.wage}>median wage</Label></div>
            <div><div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 150, color: ROLE.rent, fontVariantNumeric: 'tabular-nums'}}>+{(priceUp * tween(f, rel[2] + 90, 36, glide)).toFixed(0)}%</div><Label color={ROLE.rent}>prices</Label></div>
          </div>
        </Enter>
        {[{v: wageUp, c: ROLE.wage, at: rel[2] + 40, y: 690}, {v: priceUp, c: ROLE.rent, at: rel[2] + 90, y: 740}].map((b) => (
          <div key={b.y} style={{position: 'absolute', left: 160, top: b.y, height: 26, width: Math.max(8, (b.v / Math.max(wageUp, priceUp)) * 900 * tween(f, b.at, 36, glide)), borderRadius: 13, background: b.c, boxShadow: `0 0 22px ${b.c}88`}} />
        ))}
        <Enter at={rel[2] + 150} style={{left: 160, top: 830}}><Pill text={`Pay grows ${wageUp > priceUp ? 'faster' : 'slower'} than prices: ${Math.abs(wageUp - priceUp).toFixed(0)} points`} color={wageUp > priceUp ? ROLE.buying : ROLE.loss} size={34} /></Enter>
      </div>
      <div style={{position: 'absolute', inset: 0, ...card(3)}}>
        <Enter at={rel[3]} style={{left: 160, top: 300}}>
          <Label color={C.text} size={TYPE.title * 0.6}>Medians for each metro area, 2024.</Label>
          <Label size={TYPE.label}>Your own situation will differ.</Label>
          <Label size={30} style={{marginTop: 14}}>Wages are before taxes; rent is the metro median.</Label>
        </Enter>
        <Enter at={rel[3] + 40} style={{left: 160, top: 560}}><Source text="BEA price levels" /><Source text="Census rent" /><Source text="BLS wages" /><Source text="formula + sources in description" /></Enter>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ outro + end card */
export const Outro: React.FC = () => {
  const f = useDesignFrame();
  const g = group('s06_');
  const rel = g.rel;
  const hou = byRank(1), dc = byRank(7), mia = byRank(10);
  const endAt = g.frames - d(END_SCREEN_SECONDS);
  const cards = [
    {title: 'Cheapest prices', city: shownName(hou), value: money(hou.buyingPower50k), num: hou.buyingPower50k, col: ROLE.buying},
    {title: 'Best paycheck after prices', city: shownName(dc), value: money(dc.wageAfterPrices), num: dc.wageAfterPrices, col: ROLE.wage},
    {title: 'Hardest on your wallet', city: shownName(mia), value: 'last in both', num: 0, col: ROLE.loss},
  ];
  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: 1 - tween(f, endAt, 14)}}>
      {cards.map((c, i) => (
        <Enter key={c.title} at={rel[0] + 30 + i * 70} style={{left: 160 + i * 570, top: 200 + Math.sin(f / 20 + i * 2) * 6, width: 520}}>
          <div style={{borderRadius: 24, padding: 32, height: 330, boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: `2px solid ${c.col}`}}>
            <Label color={c.col}>{c.title.toUpperCase()}</Label>
            <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 50, color: C.text, margin: '12px 0', whiteSpace: 'nowrap'}}>{c.city}</div>
            <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 64, color: c.col, fontVariantNumeric: 'tabular-nums'}}>{c.num ? money(c.num * tween(f, rel[0] + 50 + i * 70, 36, glide)) : c.value}</div>
          </div>
        </Enter>
      ))}
      <Enter at={rel[1]} style={{left: 160, top: 620}}><div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: TYPE.title, color: C.text, textShadow: `0 0 ${14 + 14 * (0.5 + 0.5 * Math.sin(f / 9))}px ${ROLE.wage}66`}}>Which city surprised you most?</div></Enter>
      <Enter at={rel[1] + 80} style={{left: 160, top: 760, width: 1500}}><Label style={{textWrap: 'balance'}}>New price data is due in December. If it covers metro areas, this ranking may be updated.</Label></Enter>
      <Enter at={rel[1] + 100} style={{left: 160, top: 915}}><Label size={30}>General information, not financial advice.</Label></Enter>
      </div>
      {f >= endAt && (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, background: 'rgba(5,14,29,0.96)', opacity: tween(f, endAt, 14)}}>
          <div style={{position: 'absolute', left: 160, top: 220, width: 800, height: 450, borderRadius: 24, border: `3px dashed ${ROLE.buying}`}} />
          <div style={{position: 'absolute', left: 1040, top: 220, width: 450, height: 450, borderRadius: 225, border: `3px dashed ${ROLE.wage}`}} />
          <div style={{position: 'absolute', left: 160, top: 760, fontFamily: FONT.num, fontWeight: 700, fontSize: TYPE.title, color: C.text}}>Subscribe for the December update</div>
        </div>
      )}
    </>
  );
};
