import React, {useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {useDesignFrame} from '../clock';
import {blurLength, cubicInOut, exitIn, glide, tween} from '../motion';

/**
 * Editing layer for Video 2 (point 4: pacing and transitions). Every scene is wrapped in one of these by Video2.tsx.
 *
 *   enter 'whip'   the scene slides in from the right with directional motion blur, so the cut between two cities reads
 *                  as one camera move instead of a hard cut
 *   enter 'flash'  a short impact flash and a punch-in; used for the two big reveals (#1 and the twist)
 *   exit  'whip'   the scene is pulled out to the left with the same blur
 *   exit  'build'  the last ~0.9 s slows into a slow push-in, darkens and tightens: the beat of quiet before a big reveal
 *   drift          a slow push (about 3.5 % over the scene) that alternates direction per scene, so something is always
 *                  moving even when no new element appears
 *   punchAts       frames (local to the scene) where the camera kicks in by about 2.5 % and settles, for hits and slams
 *
 * Everything is a pure function of the frame, so it is safe for Remotion's parallel rendering.
 */
export type SceneCameraProps = {
  frames: number;
  seed?: number;
  enter?: 'whip' | 'flash' | 'none';
  exit?: 'whip' | 'build' | 'none';
  flashColor?: string;
  punchAts?: number[];
  children: React.ReactNode;
};

const WHIP_IN = 12;
const WHIP_OUT = 10;
const BUILD = 26;
const WHIP_PX_IN = 220;
const WHIP_PX_OUT = 260;

const offsetX = (f: number, frames: number, enter: string, exit: string) => {
  let x = 0;
  if (enter === 'whip') x += (1 - tween(f, 0, WHIP_IN, glide)) * WHIP_PX_IN;
  if (exit === 'whip') x -= tween(f, frames - WHIP_OUT, WHIP_OUT, exitIn) * WHIP_PX_OUT;
  return x;
};

export const SceneCamera: React.FC<SceneCameraProps> = ({frames, seed = 0, enter = 'whip', exit = 'whip', flashColor = '#ffffff', punchAts = [], children}) => {
  const f = useDesignFrame();
  const uid = useRef(Math.random().toString(36).slice(2, 8));
  const id = `whip_${uid.current}`;

  const x = offsetX(f, frames, enter, exit);
  const blur = blurLength(x - offsetX(f - 1, frames, enter, exit), 0.5, 48);

  // slow drift: alternate the direction per scene so consecutive cities do not push the same way
  const s = Math.min(1, Math.max(0, f / frames));
  const dir = seed % 2 === 0 ? 1 : -1;
  let scale = 1 + 0.035 * s;
  const dx = dir * 14 * s;
  const dy = ((seed % 3) - 1) * 8 * s;

  // build-up before a big reveal: slow push-in, darker, tighter
  const build = exit === 'build' ? tween(f, frames - BUILD, BUILD, cubicInOut) : 0;
  scale += 0.05 * build;

  // impact: flash + punch-in at the start of a reveal scene, plus any extra punches
  const since = f; // frames since the scene started
  const flash = enter === 'flash' ? 0.3 * Math.exp(-since / 4) : 0;
  if (enter === 'flash') scale += 0.05 * Math.exp(-since / 6);
  for (const a of punchAts) if (f >= a) scale += 0.025 * Math.exp(-(f - a) / 5);

  return (
    <AbsoluteFill>
      {blur > 0 && (
        <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
          <defs>
            <filter id={id} x="-15%" y="0" width="130%" height="100%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation={`${blur} 0`} />
            </filter>
          </defs>
        </svg>
      )}
      <AbsoluteFill style={{transform: `translate(${x + dx}px, ${dy}px) scale(${scale})`, transformOrigin: '50% 50%', filter: blur > 0 ? `url(#${id})` : undefined}}>
        {children}
      </AbsoluteFill>
      {build > 0 && (
        <AbsoluteFill style={{pointerEvents: 'none', opacity: build, background: 'radial-gradient(ellipse at center, rgba(3,8,18,0.30) 25%, rgba(3,8,18,0.88) 100%)'}} />
      )}
      {flash > 0.004 && <AbsoluteFill style={{pointerEvents: 'none', background: flashColor, opacity: flash, mixBlendMode: 'screen'}} />}
    </AbsoluteFill>
  );
};
