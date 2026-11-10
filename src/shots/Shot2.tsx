import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion';
import {Aberration} from '../components/Grade';
import {glide, ramp} from '../motion';
import {sec} from '../theme';
import {useDesignFrame} from '../clock';

export const SHOT2_FRAMES = sec(2.6);

/** Design frames of the dissolve to black at the end of the intro, so it does not hard-cut into Shot 3. */
const FADE_OUT = 6;

/**
 * The 2.6 s PayRanked intro. It has its own audio, so the music bed must be muted during this shot.
 * The clip was built separately, so it goes through the same Aberration wrapper as the other shots (a short fringe on
 * its first frame, like the slams elsewhere) and a gentle vignette to pull its edges toward the rest of the piece; the
 * whole-video Grade in Root already covers the colour. Only the picture dissolves out, the clip's audio is untouched.
 */
export const Shot2: React.FC = () => {
  const f = useDesignFrame();
  const dissolve = ramp(f, SHOT2_FRAMES - FADE_OUT, SHOT2_FRAMES, glide);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Aberration at={[0]} peak={7}>
        <OffthreadVideo src={staticFile('intro.mp4')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </Aberration>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.32) 100%)', pointerEvents: 'none'}} />
      <AbsoluteFill style={{backgroundColor: '#000', opacity: dissolve, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
