import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Background} from '../components/Background';
import {CoinStack} from '../components/CoinStack';
import {useDesignFrame} from '../clock';
import {C, W} from '../theme';
import {tween, glide} from '../motion';
import {FONT, MOTION, ROLE, ROLE_LABEL, TYPE, coinsFor} from './system';

const Bar: React.FC<{label: string; pct: number; color: string; start: number; top: number}> = ({label, pct, color, start, top}) => {
  const f = useDesignFrame();
  const p = tween(f, start, MOTION.enterFrames + 8, glide);
  return (
    <div style={{position: 'absolute', left: 1020, top, width: 700}}>
      <div style={{fontFamily: FONT.text, fontSize: TYPE.label, color: C.text, marginBottom: 10}}>{label}</div>
      <div style={{height: 34, borderRadius: 17, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
        <div style={{width: `${pct * p}%`, height: '100%', background: color, borderRadius: 17, boxShadow: `0 0 24px ${color}88`}} />
      </div>
    </div>
  );
};

/** Style frame: the cold-open idea (same $50,000, two cities) plus the four role colours. Open it in Studio as "StyleFrame". */
export const StyleFrame: React.FC = () => {
  const f = useDesignFrame();
  const gap = tween(f, 40, MOTION.enterFrames, glide);
  return (
    <AbsoluteFill>
      <Background glowX={W * 0.3} glowY={600} />
      <div style={{position: 'absolute', left: 160, top: 80}}>
        <CoinStack count={coinsFor(50700)} max={12} appearAt={0} color={ROLE.buying} refLineAt={10} refLabel="$50,000" width={190} />
      </div>
      <div style={{position: 'absolute', left: 520, top: 80}}>
        <CoinStack count={coinsFor(43800)} max={12} appearAt={6} color={ROLE.loss} refLineAt={10} refLabel="$50,000" width={190} />
      </div>
      <div style={{position: 'absolute', left: 150, top: 800, fontFamily: FONT.num, fontWeight: 700, fontSize: TYPE.number, color: ROLE.buying, opacity: gap}}>
        $50,700
      </div>
      <div style={{position: 'absolute', left: 560, top: 800, fontFamily: FONT.num, fontWeight: 700, fontSize: TYPE.number, color: ROLE.loss, opacity: gap}}>
        $43,800
      </div>
      <Bar label={ROLE_LABEL.rent} pct={86} color={ROLE.rent} start={30} top={260} />
      <Bar label={ROLE_LABEL.goods} pct={62} color={ROLE.goods} start={36} top={400} />
      <Bar label={ROLE_LABEL.services} pct={74} color={ROLE.services} start={42} top={540} />
      <Bar label={ROLE_LABEL.wage} pct={92} color={ROLE.wage} start={48} top={680} />
    </AbsoluteFill>
  );
};
