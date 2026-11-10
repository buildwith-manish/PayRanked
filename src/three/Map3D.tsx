import React from 'react';
import * as THREE from 'three';
import {snap, tween} from '../motion';
import {GEO} from '../components/USMap';
import {FLOOR, rppColor, rppOf} from './geometry';
import {State3D} from './State3D';
import {C, clamp, sec} from '../theme';

/** Colour of a state that has not had its turn yet: no buying-power colour, so the map cannot hint at what is coming. */
const UNREVEALED = new THREE.Color('#2a3850');
/** World units of height of a state that is still waiting: a flat slab on the floor. */
const FLAT = 2.5;
/** The current state rises out of the flat map as the camera whips in (design frames, local to the reveal). */
export const RISE_AT = sec(1.1);
export const RISE_DUR = 34;

/**
 * The country as extruded states. Height is buying power: cheap states rise, expensive ones stay low.
 *
 * No spoilers: only the states that already locked into the rail (`revealed`) stand at full height and colour, and the
 * state being revealed rises on its own cue. Every other state is a flat grey slab until its turn, so the tallest, greenest
 * state is never on screen before its reveal.
 */
export const Map3D: React.FC<{
  frame: number;
  fps?: number;
  /** states that are the subject of this shot */
  highlight: string[];
  /** states that locked into the rail in earlier reveals: they stand at full height and colour from the first frame */
  revealed: string[];
  /** 0-1: how far the other states are pushed back into the dark */
  dim: number;
  /** extra world units the highlighted states rise, already sprung */
  pop: number;
  /** 0-1 outline trace of the highlighted states */
  trace: number;
  /** emissive pulse of the highlighted states, 0-1 */
  pulse: number;
}> = ({frame, highlight, revealed, dim, pop, trace, pulse}) => {
  return (
    <>
      {GEO.map((g) => {
        const hot = highlight.includes(g.name);
        const done = !hot && revealed.includes(g.name);

        if (hot) {
          // rises from the flat map on a snap curve (small overshoot, then it settles), colour fading in with it
          const rise = tween(frame, RISE_AT, RISE_DUR, snap);
          const colour = UNREVEALED.clone().lerp(rppColor(rppOf(g.name)), clamp(rise));
          return (
            <State3D
              key={g.name}
              name={g.name}
              grow={rise}
              extra={pop}
              color={colour}
              glow={(0.28 + 0.14 * pulse) * clamp(rise)}
              trace={trace}
              lineColor={C.mint}
              lineOpacity={0.95}
            />
          );
        }

        return (
          <State3D
            key={g.name}
            name={g.name}
            // an earlier reveal stands tall in its own colour; everything else is a flat grey slab
            {...(done ? {grow: 1} : {topZ: FLOOR + FLAT, color: UNREVEALED})}
            dim={dim}
            lineColor="#E8EEF7"
            lineOpacity={0.2 * (1 - dim * 0.6)}
          />
        );
      })}
    </>
  );
};
