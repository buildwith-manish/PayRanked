import React from 'react';
import {C} from '../theme';
import {FONT, ROLE} from './system';
import {METROS, byRank, shownName} from './layout';
import {LocatorMap} from './MetroMap';

// Kept compact: this rail now stacks the ladder, the next-cue line and the locator map in one column
// (they used to be three separately-placed things), so each has to give up some size to fit the 1080px frame.
const ROW_H = 56;
const ROW_GAP = 5;
const ROW_STEP = ROW_H + ROW_GAP;

/**
 * Countdown #10 -> #1 navigation, merged into one persistent object instead of three separate floating pieces
 * (the old Ladder, LocatorMap and "NEXT" teaser). Mounted once by Video2 for the whole countdown block and driven
 * by frame values it computes itself (see Video2.tsx), so it survives scene cuts instead of re-entering each time.
 *
 *   - the highlight bar SLIDES between rows across the cut (slidePos is fractional during the transition)
 *   - the row just above the active one pulses instead of a separate "NEXT -> #N ?" line
 *   - the locator pin lives inside the same panel, right under the ladder, instead of its own floating card
 *   - on #1's own beat, the up-next row is replaced by a small "THE TWIST ->" cue in the same slot
 */
export const CountdownNav: React.FC<{
  /** Continuous rank position: 10 at the very start, 1 at the very end; fractional while sliding between rows. */
  slidePos: number;
  /** The city actually on screen right now. */
  activeRank: number;
  /** Scene-local design frame of the active city (0 at its own start), for the pin and name-reveal timing. */
  localFrame: number;
  /** Local frame at which the active city's own locator pin drops (cityBeats().tPin). */
  pinAt: number;
  /** Local frame at which the "next" cue should turn on (cityBeats().tNext). */
  nextAt: number;
  x?: number;
  y?: number;
}> = ({slidePos, activeRank, localFrame, pinAt, nextAt, x = 96, y = 118}) => {
  const nextRank = activeRank - 1;
  const highlightTop = (slidePos - 1) * ROW_STEP;
  const nextOn = localFrame >= nextAt;
  const pulse = 0.55 + 0.45 * Math.sin(localFrame / 7);

  return (
    <div style={{position: 'absolute', left: x, top: y, width: 340}}>
      {/* sliding highlight, underneath the rows, instead of each row toggling its own background on a hard cut */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: highlightTop,
          width: '100%',
          height: ROW_H,
          borderRadius: 14,
          background: `${ROLE.buying}22`,
          border: `1.5px solid ${ROLE.buying}`,
          transition: 'none',
        }}
      />
      {Array.from({length: 10}, (_, i) => i + 1).map((rank) => {
        const m = byRank(rank);
        const done = rank > activeRank;
        const isActive = rank === activeRank;
        const isNext = rank === nextRank && !(activeRank === 1); // #1 has no "next" city; it hands off to the twist cue below
        const shown = done || isActive;
        const showTwistCue = isNext && nextOn; // reuse the next-row slot for the pulse itself; text swap only for rank 1 below
        return (
          <div
            key={rank}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              height: ROW_H,
              marginBottom: ROW_GAP,
              padding: '0 18px',
              opacity: shown ? 1 : isNext && nextOn ? pulse : 0.32,
            }}
          >
            <div style={{fontFamily: FONT.num, fontWeight: 700, fontSize: 28, color: isActive ? ROLE.buying : C.muted, width: 54}}>{rank}</div>
            <div style={{fontFamily: FONT.text, fontWeight: 600, fontSize: 25, color: C.text}}>{shown ? shownName(m) : '?'}</div>
            {isActive && (
              <div style={{position: 'absolute', right: 14, opacity: localFrame >= pinAt ? 1 : 0, transform: `scale(${localFrame >= pinAt ? 1 : 0.4})`}}>
                <div style={{width: 12, height: 12, borderRadius: 6, background: ROLE.buying, boxShadow: `0 0 14px ${ROLE.buying}`}} />
              </div>
            )}
          </div>
        );
      })}
      {activeRank === 1 && (
        <div style={{marginTop: 4, opacity: nextOn ? pulse : 0, fontFamily: FONT.num, fontWeight: 700, fontSize: 24, color: ROLE.wage, letterSpacing: 1}}>
          BUT THERE IS A TWIST →
        </div>
      )}
      <div style={{marginTop: 14}}>
        <LocatorMap
          name={byRank(activeRank).name}
          at={pinAt}
          done={METROS.filter((q) => q.rank > activeRank).map((q) => q.name)}
          next={activeRank > 1 ? byRank(nextRank).name : undefined}
          nextAt={nextAt}
          width={170}
          frame={localFrame}
        />
      </div>
    </div>
  );
};
