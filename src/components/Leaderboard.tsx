import React from 'react';

import {C, F, MARGIN} from '../theme';
import {glide, ramp, slam, stagger, trail, tween} from '../motion';
import {Glass} from './Glass';
import {useDesignFrame} from '../clock';

export type RailEntry = {label: string; names: string[]; lockAt: number};

/** One row per rank. There is no #4 because #3 is a tie. */
export const RAIL_ROWS = [10, 9, 8, 7, 6, 5, 3, 2, 1];

const SLIM = 104; // collapsed width: rank numbers only
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Left rail with 9 rows (10, 9, 8, 7, 6, 5, 3, 2, 1). An entry locks into the row for its rank at `lockAt`.
 * A tied row lists both state names.
 *
 * Restraint: the rail has two states. `open` (0-1) is how far it is expanded. Collapsed it is a quiet strip of rank
 * numbers, so it never competes with the state being revealed; expanded it shows the names. Open it for the moment
 * a state locks in, then fold it away again.
 *
 * Motion: the rail glides in with its rows trailing each other (3 frames apart), a locking row lands on a `slam`
 * curve with a light flash, and the state name inside it follows 4 frames behind the row.
 */
export const Leaderboard: React.FC<{entries: RailEntry[]; revealAt?: number; width?: number; open?: number}> = ({
  entries,
  revealAt = 0,
  width = 370,
  open = 1,
}) => {
  const frame = useDesignFrame();
  const rowH = 72;
  const w = lerpN(SLIM, width, open);
  const byRank = new Map<number, RailEntry>();
  entries.forEach((e) => byRank.set(parseInt(e.label.replace('#', ''), 10), e));

  return (
    <div style={{position: 'absolute', left: MARGIN, top: 130, width: w}}>
      {RAIL_ROWS.map((n, idx) => {
        const e = byRank.get(n);
        // entrance: each row glides in from the left, trailing the one above it
        const inP = tween(frame, revealAt + stagger(idx, 3, 24), 26, glide);
        const lockP = e ? tween(frame, e.lockAt, 22, slam) : 0;
        const nameP = e ? trail(frame, e.lockAt, 18, glide, 4) : 0;
        const tie = !!e && e.names.length > 1;
        const filled = !!e && frame >= e.lockAt;
        const flash = e && frame >= e.lockAt ? Math.exp(-(frame - e.lockAt) / 7) : 0;
        // while collapsed, rows that are not the newest sit back
        const quiet = lerpN(0.55, 1, open);
        return (
          <Glass
            key={n}
            radius={14}
            tint={filled ? C.emerald : C.text}
            strength={filled ? 1 + 0.5 * lockP : 0.4}
            glow={filled ? 6 + 34 * flash : 0}
            style={{
              height: rowH - 10,
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '0 16px',
              overflow: 'hidden',
              opacity: Math.min(1, inP * 2) * (filled ? Math.max(quiet, 0.8) : quiet),
              transform: `translateX(${(1 - inP) * (-w - MARGIN)}px) scale(${filled ? 1 + 0.05 * (lockP - 1 > 0 ? lockP - 1 : 0) + 0.07 * flash : 1})`,
              transformOrigin: '0% 50%',
            }}
          >
            <span style={{fontFamily: F.display, fontWeight: 700, fontSize: 30, width: 50, flexShrink: 0, color: filled ? C.mint : C.muted, fontVariantNumeric: 'tabular-nums'}}>{n}</span>
            {e && (
              <span
                style={{
                  fontFamily: F.display,
                  fontWeight: 700,
                  fontSize: tie ? 22 : 26,
                  color: C.text,
                  // Bug fix: threshold was 0.35 — names started appearing when the rail was only 35%
                  // open, overlapping the rank number in the narrow collapsed strip. Raised to 0.65
                  // so names only become visible once the rail is wide enough to hold them.
                  opacity: nameP * ramp(open, 0.65, 1),
                  transform: `translateX(${(1 - nameP) * 40}px)`,
                  whiteSpace: 'nowrap',
                }}
              >
                {e.names.join(' · ')}
              </span>
            )}
          </Glass>
        );
      })}
    </div>
  );
};

/** Rail openness over a reveal: open at the start (context), folded while a state is on stage, open again for the lock. */
export const railOpenAt = (frame: number, foldAt: number, unfoldAt: number) =>
  Math.max(0, Math.min(1, 1 - tween(frame, foldAt, 22, glide) + tween(frame, unfoldAt, 22, glide)));
