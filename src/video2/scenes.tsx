import React from 'react';
import {useDesignFrame} from '../clock';
import {C} from '../theme';
import {glide, slam, tween} from '../motion';
import {CoinStack} from '../components/CoinStack';
import {FONT, ROLE, ROLE_LABEL, TYPE, coinsFor} from './system';
import {Dial, Enter, CountMoney, IndexBar, Label, Ladder, Pill, RankSlam, Source} from './parts';
import {END_SCREEN_SECONDS, METROS, Metro, byRank, cityPrefix, d, group, money, shownName} from './layout';

const Stack: React.FC<{dollars: number; at: number; color: string; left: number; top: number; ref10?: boolean; scale?: number}> = ({dollars, at, color, left, top, ref10 = true, scale = 1}) => (
  <div style={{position: 'absolute', left, top, transform: `scale(${scale})`, transformOrigin: '0% 0%'}}>
    <CoinStack count={coinsFor(dollars)} max={12} appearAt={at} color={color} refLineAt={ref10 ? 10 : undefined} refLabel="$50,000" width={170} />
  </div>
);

/* ------------------------------------------------------------------ cold open */
export const ColdOpen: React.FC = () => {
  const f = useDesignFrame();
  const {rel} = group('s01_');
  const hou = byRank(1), mia = byRank(10);
  const gap = hou.buyingPower50k - mia.buyingPower50k;
  const split = tween(f, rel[1] + 6, 30, glide);
  const crack = tween(f, rel[3] + 60, 14, slam);
  const big = TYPE.title * 0.72;
  return (
    <>
      <Enter at={4} style={{left: 300, top: 60}}><Label>PERSON A</Label></Enter>
      <Enter at={10} style={{left: 840, top: 60}}><Label>PERSON B</Label></Enter>
      <Stack dollars={50000} at={4} color={ROLE.buying} left={330} top={110} scale={1.25} />
      <Stack dollars={50000 - (50000 - mia.buyingPower50k) * split} at={10} color={split > 0.5 ? ROLE.loss : ROLE.buying} left={870} top={110} scale={1.25} />
      <Enter at={rel[0] + 30} style={{left: 300, top: 600}}><div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: big, color: C.text}}>$50,000 a year</div></Enter>
      <Enter at={rel[0] + 36} style={{left: 840, top: 600}}><div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: big, color: C.text}}>$50,000 a year</div></Enter>
      <Enter at={rel[1] + 20} style={{left: 300, top: 710}}><CountMoney from={50000} to={hou.buyingPower50k} at={rel[1] + 20} color={ROLE.buying} size={TYPE.number * 0.8} /></Enter>
      <Enter at={rel[1] + 20} style={{left: 840, top: 710}}><CountMoney from={50000} to={mia.buyingPower50k} at={rel[1] + 80} color={ROLE.loss} size={TYPE.number * 0.8} /></Enter>
      <Enter at={rel[1] + 20} style={{left: 300, top: 850}}><Label size={32}>buys this much at average U.S. prices</Label></Enter>
      <div style={{position: 'absolute', left: 1290, top: 220, opacity: tween(f, rel[2], 8), transform: `scale(${1 + (1 - tween(f, rel[2], 14, slam)) * 0.8})`, transformOrigin: '0% 50%'}}>
        <div style={{fontFamily: FONT.text, fontWeight: 700, fontSize: TYPE.label, color: C.muted}}>THE GAP</div>
        <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: TYPE.hero * 0.62, color: ROLE.loss, textShadow: `0 0 50px ${ROLE.loss}88`}}>{money(gap)}</div>
        <div style={{fontFamily: FONT.text, fontSize: 32, color: C.text}}>just from where they live</div>
      </div>
      <Enter at={rel[3] + 30} style={{left: 1290, top: 620}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
          <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 110, color: crack > 0.5 ? C.muted : ROLE.buying, transform: `rotate(${crack * -8}deg)`}}>#1</div>
          <Label color={C.text} size={32}>{crack > 0.5 ? 'stops winning' : '10 metros ranked'}</Label>
        </div>
      </Enter>
      <Enter at={rel[4] + 4} style={{left: 0, top: 0, width: 1920, height: 1080, background: 'rgba(5,14,29,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: TYPE.hero * 0.6, color: C.text}}>Let's start at the bottom.</div>
      </Enter>
    </>
  );
};

/* ------------------------------------------------------------------ method */
export const Method: React.FC = () => {
  const f = useDesignFrame();
  const {rel} = group('s02_');
  const eq = tween(f, rel[1] + 150, 20, glide);
  return (
    <>
      <Enter at={6} style={{left: 160, top: 90}}><Label color={ROLE.buying} size={TYPE.title * 0.6}>THE METHOD</Label></Enter>
      <Enter at={rel[0] + 24} style={{left: 160, top: 190}}><Dial value={114.2} at={rel[1] + 20} width={620} /></Enter>
      <Enter at={rel[0] + 10} style={{left: 960, top: 190}}>
        <div style={{fontFamily: FONT.text, fontWeight: 600, fontSize: TYPE.label, color: C.text, width: 800}}>Bureau of Economic Analysis<br /><span style={{color: C.muted}}>price level of every metro area</span></div>
      </Enter>
      <Enter at={rel[1] + 30} style={{left: 960, top: 360}}>
        <div style={{fontFamily: FONT.text, fontSize: TYPE.label, color: C.text, lineHeight: 1.5}}>
          <span style={{color: ROLE.rent}}>Above 100</span> prices run higher<br /><span style={{color: ROLE.buying}}>Below 100</span> prices run lower
        </div>
      </Enter>
      <div style={{position: 'absolute', left: 160, top: 640, opacity: eq, transform: `translateY(${(1 - eq) * 30}px)`, fontFamily: FONT.num, fontWeight: 700, fontSize: 80, color: C.text}}>
        salary <span style={{color: C.muted}}>×</span> 100 <span style={{color: C.muted}}>÷</span> <span style={{color: ROLE.rent}}>price level</span> <span style={{color: C.muted}}>=</span> <span style={{color: ROLE.buying}}>buying power</span>
      </div>
      <div style={{position: 'absolute', left: 160, top: 790, width: 1300}}>
        <div style={{display: 'flex', gap: 36}}>
          <Enter at={rel[2] + 6} style={{position: 'relative'}}><Pill text={ROLE_LABEL.rent} color={ROLE.rent} /></Enter>
          <Enter at={rel[2] + 14} style={{position: 'relative'}}><Pill text={ROLE_LABEL.goods} color={ROLE.goods} /></Enter>
          <Enter at={rel[2] + 22} style={{position: 'relative'}}><Pill text="Other services" color={ROLE.services} /></Enter>
        </div>
      </div>
      <Enter at={rel[2] + 60} style={{left: 160, top: 900}}><Label>2024 data · metro areas, not just city limits</Label></Enter>
      <Enter at={rel[3] + 10} style={{left: 1200, top: 900}}><Source text="BEA" /><Source text="CENSUS rent" /><Source text="BLS wages" /></Enter>
    </>
  );
};

/* ------------------------------------------------------------------ one city of the countdown */
export const CityScene: React.FC<{rank: number}> = ({rank}) => {
  const f = useDesignFrame();
  const m = byRank(rank);
  const g = group(cityPrefix(rank));
  const n = g.list.length;
  const rel = g.rel;
  const power = m.buyingPower50k;
  const tPower = n >= 5 ? rel[1] + 4 : rel[0] + 60;
  const tBars = n >= 5 ? rel[2] : rel[1];
  const tRent = n >= 5 ? rel[3] : rel[1] + Math.round(g.list[1].seconds * 30 * 0.6);
  const tNext = rel[n - 1];
  const tWin = rank === 1 ? rel[4] : -1;
  const revealed: Record<number, number> = {};
  for (let r = 10; r > rank; r--) revealed[r] = -1;
  revealed[rank] = 6;
  const diff = power - 50000;
  const good = diff >= 0;
  return (
    <>
      <Ladder revealed={revealed} active={rank} />
      <div style={{position: 'absolute', left: 500, top: 100}}><RankSlam text={`#${rank}`} at={0} /></div>
      <Enter at={10} style={{left: 500, top: 300}}><div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: shownName(m).length > 10 ? 56 : TYPE.title, color: C.text, whiteSpace: 'nowrap'}}>{shownName(m)}</div></Enter>
      <Stack dollars={power} at={tPower} color={good ? ROLE.buying : ROLE.loss} left={560} top={450} />
      <Enter at={tPower} style={{left: 1000, top: 110}}><Label>BUYING POWER OF $50,000</Label></Enter>
      <div style={{position: 'absolute', left: 1000, top: 160}}>
        <CountMoney from={50000} to={power} at={tPower} color={good ? ROLE.buying : ROLE.loss} />
      </div>
      <Enter at={tPower + 24} style={{left: 1000, top: 305}}>
        <Label color={good ? ROLE.buying : ROLE.loss}>{good ? '+' : '−'}{money(Math.abs(diff))} vs $50,000</Label>
      </Enter>
      <div style={{position: 'absolute', left: 1000, top: 380}}><Dial value={m.bea.allItems} at={tBars} width={340} /></div>
      <Enter at={tBars + 10} style={{left: 1390, top: 410}}>
        <Label>PRICE LEVEL</Label>
        <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 72, color: m.bea.allItems > 100 ? ROLE.rent : ROLE.buying}}>{m.bea.allItems.toFixed(1)}</div>
      </Enter>
      <div style={{position: 'absolute', left: 1000, top: 650, display: 'flex', flexDirection: 'column', gap: 20}}>
        <IndexBar label={ROLE_LABEL.rent} value={m.bea.rents} color={ROLE.rent} at={tBars + 12} />
        <IndexBar label={ROLE_LABEL.goods} value={m.bea.goods} color={ROLE.goods} at={tBars + 20} />
        <IndexBar label="Other services" value={m.bea.otherServices} color={ROLE.services} at={tBars + 28} />
      </div>
      <Enter at={tRent} style={{left: 500, top: 880}}>
        <Pill text={`Median rent ${money(m.census.medianGrossRent)}/mo`} color={ROLE.rent} />
      </Enter>
      {rank === 7 && (
        <Enter at={rel[3] + 40} style={{left: 500, top: 960}}>
          <Pill text={`Median wage ${money(m.wage.medianAnnual)} — remember this`} color={ROLE.wage} size={28} />
        </Enter>
      )}
      {tWin >= 0 && (
        <Enter at={tWin} style={{left: 500, top: 960}}>
          <Pill text={`${money(power - byRank(10).buyingPower50k)} more than Miami`} color="#FFD25A" size={30} />
        </Enter>
      )}
      <Enter at={tNext} style={{left: 1330, top: 950}}>
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
  const {rel} = group('s03_');
  const rows = [...METROS].sort((a, b) => b.rentShareOfWagePct - a.rentShareOfWagePct);
  return (
    <>
      <Enter at={4} style={{left: 160, top: 70}}>
        <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: TYPE.title, color: ROLE.rent}}>A year of rent vs. the typical paycheck</div>
      </Enter>
      {rows.map((m, i) => {
        const at = i === 0 ? rel[0] + 40 : rel[1] + (i - 1) * 8;
        const p = tween(f, at, 24, glide);
        return (
          <div key={m.rank} style={{position: 'absolute', left: 160, top: 200 + i * 82, width: 1400, opacity: tween(f, at, 8), display: 'flex', alignItems: 'center'}}>
            <div style={{width: 360, fontFamily: FONT.text, fontWeight: 600, fontSize: 34, color: C.text}}>{shownName(m)}</div>
            <div style={{flex: 1, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.08)', position: 'relative'}}>
              <div style={{width: `${(m.rentShareOfWagePct / 60) * 100 * p}%`, height: '100%', borderRadius: 18, background: m.rentShareOfWagePct > 40 ? ROLE.rent : `${ROLE.rent}99`, boxShadow: `0 0 20px ${ROLE.rent}66`}} />
              <div style={{position: 'absolute', left: `${(40 / 60) * 100}%`, top: -6, width: 3, height: 48, background: C.text, opacity: 0.7}} />
            </div>
            <div style={{width: 120, textAlign: 'right', fontFamily: FONT.num, fontWeight: 700, fontSize: 38, color: ROLE.rent}}>{(m.rentShareOfWagePct * p).toFixed(0)}%</div>
          </div>
        );
      })}
      <Enter at={rel[1] + 40} style={{left: 1010, top: 1030}}><Label size={30}>white tick = 40% of the paycheck</Label></Enter>
    </>
  );
};

/* ------------------------------------------------------------------ the twist */
export const Twist: React.FC = () => {
  const f = useDesignFrame();
  const g = group('s04_');
  const rel = g.rel;
  const rowH = 80, top0 = 190;
  const stage = f >= rel[4] ? 4 : f >= rel[3] ? 3 : f >= rel[2] ? 2 : f >= rel[1] ? 1 : 0;
  const hou = byRank(1), dc = byRank(7), ny = byRank(8), phl = byRank(3), mia = byRank(10);
  const featured: Metro[] = stage === 1 ? [hou] : stage === 2 ? [dc] : stage === 3 ? [ny, phl] : stage >= 4 ? [mia] : [];
  const maxV = 65000, minV = 38000;
  return (
    <>
      <Enter at={4} style={{left: 160, top: 70}}>
        <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: TYPE.title * 0.8, color: ROLE.wage}}>
          {f >= rel[1] ? 'Paycheck after prices' : 'Same ranking…'}
        </div>
      </Enter>
      <Enter at={rel[0] + 60} style={{left: 960, top: 70}}><Pill text="OUR OWN CALCULATION · wage ÷ price level" color={ROLE.wage} size={28} /></Enter>
      <Enter at={rel[1] + 60} style={{left: 1280, top: 830, width: 540}}><Label size={24}>Atlanta/Chicago and Dallas/Phoenix are within about $20 of each other: treat each pair as a tie.</Label></Enter>
      {METROS.map((m) => {
        const stag = (m.rank - 1) * 6;
        const p = tween(f, rel[1] + stag, 30, glide);
        const y = top0 + ((m.rank - 1) + (m.twistRank - m.rank) * p) * rowH;
        const value = m.buyingPower50k + (m.wageAfterPrices - m.buyingPower50k) * p;
        const lit = featured.includes(m);
        const col = f >= rel[1] ? (m.twistRank < m.rank ? ROLE.buying : m.twistRank > m.rank ? ROLE.loss : C.text) : ROLE.buying;
        const shownRank = p > 0.5 ? m.twistRank : m.rank;
        const w = ((value - minV) / (maxV - minV)) * 560;
        return (
          <div key={m.rank} style={{position: 'absolute', left: 160, top: y, height: rowH - 10, width: 1000, display: 'flex', alignItems: 'center', borderRadius: 14, padding: '0 16px', background: lit ? `${col}22` : 'rgba(255,255,255,0.05)', border: `1.5px solid ${lit ? col : 'rgba(255,255,255,0.08)'}`}}>
            <div style={{width: 60, fontFamily: FONT.num, fontWeight: 700, fontSize: 36, color: col}}>{shownRank}</div>
            <div style={{width: 300, fontFamily: FONT.text, fontWeight: 600, fontSize: 32, color: C.text}}>{shownName(m)}</div>
            <div style={{width: Math.max(10, w) * 0.7, height: 22, borderRadius: 11, background: col, opacity: 0.9}} />
            <div style={{marginLeft: 'auto', fontFamily: FONT.num, fontWeight: 700, fontSize: 34, color: col, fontVariantNumeric: 'tabular-nums'}}>{money(value)}</div>
          </div>
        );
      })}
      {featured.map((m, i) => (
        <Enter key={`${stage}-${m.rank}`} at={stage === 1 ? rel[1] + 10 : stage === 2 ? rel[2] : stage === 3 ? rel[3] + i * 40 : rel[4]} style={{left: 1280, top: 250 + i * 270, width: 540}}>
          <div style={{borderRadius: 20, padding: 24, background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${ROLE.wage}`}}>
            <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 48, color: C.text}}>{shownName(m)}</div>
            <Label color={ROLE.wage}>MEDIAN WAGE</Label>
            <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 64, color: ROLE.wage}}>{money(m.wage.medianAnnual)}</div>
            <Label color={ROLE.buying}>AFTER PRICES</Label>
            <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 64, color: ROLE.buying}}>{money(m.wageAfterPrices)}</div>
            <Label>#{m.rank} → #{m.twistRank}</Label>
          </div>
        </Enter>
      ))}
      <Enter at={rel[5] + 20} style={{left: 1180, top: 900}}>
        <Pill text="Cheapest isn't automatically best" color="#FFD25A" size={34} />
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
            <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 80, color: m.rentShareOfWagePct > 40 ? ROLE.rent : C.muted}}>{m.rentShareOfWagePct.toFixed(0)}%</div>
            <Label color={C.text} size={30}>{shownName(m)}</Label>
          </Enter>
        ))}
        <Enter at={rel[1] + 90} style={{left: 160, top: 840}}><Pill text={`${over40} of 10 cities: rent is over 40% of the typical wage`} color={ROLE.rent} size={34} /></Enter>
      </div>
      <div style={{position: 'absolute', inset: 0, ...card(2)}}>
        <Enter at={rel[2]} style={{left: 160, top: 120}}><Label color={ROLE.wage} size={TYPE.title * 0.6}>RULE 3 · judge a job offer the same way</Label></Enter>
        <Enter at={rel[2] + 20} style={{left: 160, top: 330}}>
          <Label>WASHINGTON vs HOUSTON</Label>
          <div style={{display: 'flex', gap: 120, marginTop: 20}}>
            <div><div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 150, color: ROLE.wage}}>+{wageUp.toFixed(0)}%</div><Label color={ROLE.wage}>median wage</Label></div>
            <div><div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 150, color: ROLE.rent}}>+{priceUp.toFixed(0)}%</div><Label color={ROLE.rent}>prices</Label></div>
          </div>
        </Enter>
      </div>
      <div style={{position: 'absolute', inset: 0, ...card(3)}}>
        <Enter at={rel[3]} style={{left: 160, top: 300}}>
          <Label color={C.text} size={TYPE.title * 0.6}>Medians for each metro area, 2024.</Label>
          <Label size={TYPE.label}>Your own situation will differ.</Label>
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
    {title: 'Cheapest prices', city: shownName(hou), value: money(hou.buyingPower50k), col: ROLE.buying},
    {title: 'Best paycheck after prices', city: shownName(dc), value: money(dc.wageAfterPrices), col: ROLE.wage},
    {title: 'Hardest on your wallet', city: shownName(mia), value: 'last in both', col: ROLE.loss},
  ];
  return (
    <>
      {cards.map((c, i) => (
        <Enter key={c.title} at={rel[0] + 30 + i * 70} style={{left: 160 + i * 570, top: 200, width: 520}}>
          <div style={{borderRadius: 24, padding: 32, height: 330, boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: `2px solid ${c.col}`}}>
            <Label color={c.col}>{c.title.toUpperCase()}</Label>
            <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 50, color: C.text, margin: '12px 0', whiteSpace: 'nowrap'}}>{c.city}</div>
            <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 64, color: c.col}}>{c.value}</div>
          </div>
        </Enter>
      ))}
      <Enter at={rel[1]} style={{left: 160, top: 620}}><div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: TYPE.title, color: C.text}}>Which city surprised you most?</div></Enter>
      <Enter at={rel[1] + 80} style={{left: 160, top: 760}}><Label>New price data is due in December. If it covers metro areas, this ranking may be updated.</Label></Enter>
      <Enter at={rel[1] + 100} style={{left: 160, top: 840}}><Label size={30}>General information, not financial advice.</Label></Enter>
      {f >= endAt && (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, background: 'rgba(5,14,29,0.9)', opacity: tween(f, endAt, 14)}}>
          <div style={{position: 'absolute', left: 160, top: 220, width: 800, height: 450, borderRadius: 24, border: `3px dashed ${ROLE.buying}`}} />
          <div style={{position: 'absolute', left: 1040, top: 220, width: 450, height: 450, borderRadius: 225, border: `3px dashed ${ROLE.wage}`}} />
          <div style={{position: 'absolute', left: 160, top: 760, fontFamily: FONT.num, fontWeight: 700, fontSize: TYPE.title, color: C.text}}>Subscribe for the December update</div>
        </div>
      )}
    </>
  );
};
