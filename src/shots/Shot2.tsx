import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion';
import {Aberration} from '../components/Grade';
import {sec} from '../theme';

// intro.mp4 is 3.5 s (extended from 3.0 s: +0.5 s hold + fade-in) (v9); the shot has to be as long as the clip or its last 0.4 s is cut off
export const SHOT2_FRAMES = sec(3.5);

/**
 * The 3.5 s PayRanked intro. It has its own audio, so the music bed is muted during this shot.
 *
 * Transitions live INSIDE the clip: its first and last frames are the same navy gradient as the end of Shot 1 and the
 * start of Shot 3, so the intro arrives out of the background and dissolves back into it. No opacity dips or extra
 * vignette are added here (they made the clip look smaller and doubled the fades).
 */
export const Shot2: React.FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(160deg, #143A66 0%, #0A1D38 55%, #050E1D 100%)'}}>
    <Aberration at={[0]} peak={7}>
      <AbsoluteFill>
        <OffthreadVideo src={staticFile('intro.mp4')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
    </Aberration>
  </AbsoluteFill>
);
