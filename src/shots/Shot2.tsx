import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion';
import {Aberration} from '../components/Grade';
import {sec} from '../theme';

// intro.mp4 is 3.5 s. The clip has its own navy gradient background (#143A66 → #0A1D38 → #050E1D)
// baked in from the HTML's SVG — that IS the background. No overlays, no fade layers, no vignette.
// The clip's background matches Shot 1's end (navy) and Shot 3's start (navy), so the transitions
// are seamless cuts — no fade needed because the backgrounds are identical.
export const SHOT2_FRAMES = sec(3.5);

export const Shot2: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#050E1D'}}>
      <Aberration at={[0]} peak={7}>
        <OffthreadVideo src={staticFile('intro.mp4')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </Aberration>
    </AbsoluteFill>
  );
};
