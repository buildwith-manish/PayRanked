import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion';
import {Aberration} from '../components/Grade';
import {glide, ramp} from '../motion';
import {sec} from '../theme';
import {useDesignFrame} from '../clock';

// intro.mp4 is 3.5 s (extended from 3.0 s: +0.5 s hold + fade-in) (v9); the shot has to be as long as the clip or its last 0.4 s is cut off
export const SHOT2_FRAMES = sec(3.5);

/** Design frames for the fade in from black (matching Shot 1's fade-out) and the dissolve to black at the end. */
const FADE_IN = 3;   // 0.1 s — quick fade, barely shows background   // 0.2 s fade in from black — matches Shot 1's fade-out so there is no hard cut
const FADE_OUT = 4;  // 0.13 s — quick fade out  // 0.27 s dissolve to black at the end — smoother than the old 0.2 s

/**
 * The 3.5 s PayRanked intro. It has its own audio, so the music bed must be muted during this shot.
 * The clip was built separately, so it goes through the same Aberration wrapper as the other shots (a short fringe on
 * its first frame, like the slams elsewhere) and a gentle vignette to pull its edges toward the rest of the piece; the
 * whole-video Grade in Root already covers the colour.
 *
 * Transitions: the intro FADES IN via clip opacity (the main video's navy background shows through — no dead black screen) (matching Shot 1's fade-out so the handoff is seamless — no 0.13 s
 * of dead black, no sudden pop of the intro clip), and FADES OUT to black at the end (matching Shot 3's fade-in
 * from black). The clip's own audio is untouched by both fades.
 */
export const Shot2: React.FC = () => {
  const f = useDesignFrame();
  // The intro clip fades in/out using its own opacity (not a black overlay), so the main video's
  // navy background shows through during the transition — no dead black screen.
  const fadeIn = ramp(f, 0, FADE_IN, glide);               // 0 -> 1 (clip opacity rises)
  const fadeOut = 1 - ramp(f, SHOT2_FRAMES - FADE_OUT, SHOT2_FRAMES, glide);  // 1 -> 0 (clip opacity falls)
  const clipOpacity = Math.min(fadeIn, fadeOut);            // whichever fade is active
  return (
    <AbsoluteFill style={{background: 'linear-gradient(160deg, #143A66 0%, #0A1D38 55%, #050E1D 100%)'}}>
      <Aberration at={[0]} peak={7}>
        <AbsoluteFill style={{opacity: clipOpacity}}>
          <OffthreadVideo src={staticFile('intro.mp4')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
      </Aberration>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.10) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
