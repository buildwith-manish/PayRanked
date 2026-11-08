import React, {useMemo} from 'react';
import {snap, tween} from '../motion';
import {GEO} from '../components/USMap';
import {rppOf} from './geometry';
import {State3D} from './State3D';
import {C} from '../theme';

/**
 * The whole country as extruded states. Height is buying power: cheap states rise, expensive ones stay low.
 * The states rise from the floor in order of buying power (cheapest first), so the data builds the shape.
 */
export const Map3D: React.FC<{
  frame: number;
  fps?: number;
  /** states that are the subject of this shot */
  highlight: string[];
  /** 0-1: how far the other states are pushed back into the dark */
  dim: number;
  /** extra world units the highlighted states rise, already sprung */
  pop: number;
  /** 0-1 outline trace of the highlighted states */
  trace: number;
  /** emissive pulse of the highlighted states, 0-1 */
  pulse: number;
}> = ({frame, highlight, dim, pop, trace, pulse}) => {
  // rank of every state by rpp, cheapest first, so growth is staggered by the data
  const order = useMemo(() => {
    const names = GEO.map((g) => g.name).sort((a, b) => rppOf(a) - rppOf(b));
    return new Map(names.map((n, i) => [n, i]));
  }, []);

  return (
    <>
      {GEO.map((g) => {
        const i = order.get(g.name) ?? 0;
        // each state rises on a snap curve (small overshoot, then it settles), cheapest first
        const grow = tween(frame, 2 + i * 0.45, 44, snap);
        const hot = highlight.includes(g.name);
        return (
          <State3D
            key={g.name}
            name={g.name}
            grow={grow}
            extra={hot ? pop : 0}
            dim={hot ? 0 : dim}
            glow={hot ? 0.28 + 0.14 * pulse : 0}
            trace={hot ? trace : 1}
            lineColor={hot ? C.mint : '#E8EEF7'}
            lineOpacity={hot ? 0.95 : 0.2 * (1 - dim * 0.6)}
          />
        );
      })}
    </>
  );
};
