import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Background} from './Background';
import {Leaderboard, RailEntry} from './Leaderboard';
import {MaskWords} from './MaskText';
import {Chip} from './Chip';
import {win} from './common';
import {byName, fmtUSD, STATES} from '../data';
import {BreakKind} from '../timeline';
import {glide, ramp} from '../motion';
import {C, F, sec} from '../theme';
import {useLayout} from '../layout';
import {useDesignFrame} from '../clock';

/**
 * A change of picture inside the countdown. Neither break names the winner.
 *  - notHere: the hook promised it is not Texas or Florida. Here is where they actually sit.
 *  - prices:  the cheap-is-not-a-salary turn, moved up from the old reality check so the tension holds until #1.
 * The rail stays on the left with the rows already locked in, so the viewer never loses the countdown.
 */
export const BREAK_BEATS = {
  line1: sec(0.4),
  line2: sec(3),
  chips: sec(3.6),
};

const rankOf = (name: string) => STATES.find((s) => s.name === name)!.rank;

export const Break: React.FC<{kind: BreakKind; rail: RailEntry[]; durationInFrames: number}> = ({kind, rail, durationInFrames}) => {
  const f = useDesignFrame();
  const {w: W, h: H, vertical: V} = useLayout();
  const tx = byName('Texas');
  const fl = byName('Florida');
  const out = durationInFrames - 10;
  const fade = (start: number) => win(f, start, out, 10);

  return (
    <AbsoluteFill>
      <Background glowX={W * (V ? 0.5 : 0.58)} glowY={H * (V ? 0.42 : 0.5)}>
        <Leaderboard entries={rail} revealAt={0} open={0} />
        <div
          style={{
            position: 'absolute',
            // vertical: clear of the slim rail on the left and the Shorts header / player UI at the top and bottom
            left: V ? 150 : 300,
            right: V ? 56 : 120,
            top: V ? 150 : 0,
            bottom: V ? 380 : 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 44,
            opacity: 1 - ramp(f, out, durationInFrames, glide),
          }}
        >
          {kind === 'notHere' ? (
            <>
              <div style={{fontFamily: F.display, fontWeight: 700, fontSize: V ? 92 : 84, color: C.text, textAlign: 'center', lineHeight: 1.1, opacity: fade(BREAK_BEATS.line1)}}>
                <MaskWords text="Not on this list." start={BREAK_BEATS.line1} step={5} dur={22} />
              </div>
              <div style={{display: 'flex', flexDirection: V ? 'column' : 'row', alignItems: 'center', gap: V ? 28 : 36, opacity: fade(BREAK_BEATS.chips)}}>
                <Chip text={`TEXAS · #${rankOf('Texas')} · ${fmtUSD(tx.display)}`} delay={BREAK_BEATS.chips} size={V ? 40 : 46} from="left" />
                <Chip text={`FLORIDA · #${rankOf('Florida')} · ${fmtUSD(fl.display)}`} delay={BREAK_BEATS.chips + 14} size={V ? 40 : 46} from="right" color={C.amber} />
              </div>
              <div style={{fontFamily: F.body, fontWeight: 500, fontSize: V ? 46 : 40, color: C.muted, textAlign: 'center', opacity: fade(sec(5.4))}}>
                <MaskWords text="No wage tax doesn’t fix the prices." start={sec(5.4)} step={4} dur={20} />
              </div>
            </>
          ) : (
            <>
              <div style={{fontFamily: F.display, fontWeight: 700, fontSize: V ? 92 : 88, color: C.text, textAlign: 'center', lineHeight: 1.1, opacity: fade(BREAK_BEATS.line1)}}>
                <MaskWords text="Cheap doesn’t mean you’d earn $100K there." start={BREAK_BEATS.line1} step={4} dur={22} />
              </div>
              <div style={{fontFamily: F.body, fontWeight: 500, fontSize: V ? 50 : 46, color: C.muted, textAlign: 'center', lineHeight: 1.3, opacity: fade(sec(4.6))}}>
                <MaskWords text="This ranks prices, not paychecks." start={sec(4.6)} step={4} dur={22} />
              </div>
            </>
          )}
        </div>
      </Background>
    </AbsoluteFill>
  );
};
