import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Shot1} from './Shot1';
import {Shot3} from './Shot3';
import {C, F, sec} from '../theme';
import {useDesignFrame} from '../clock';

// 13.7 s (was 13.5): clip 006 "...A hundred is the national average." is silent from 7.80 s to 8.12 s (measured on the WAV), and 13.7 s lands the cut
// at 7.82 s into the clip. 13.5 s cut inside "average"; the next beat (needle to California) starts at 13.72 s, so the picture stays clean.
export const SHORT1_METHOD_SECONDS = 13.7;
export const SHORT1_CTA_SECONDS = 3.5;
export const SHORT1_FRAMES = sec(27 + SHORT1_METHOD_SECONDS + SHORT1_CTA_SECONDS);

export const Short1EndCard: React.FC = () => {
  const f = useDesignFrame();
  const fade = Math.min(1, Math.max(0, f / 18));
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${C.navy1} 0%, ${C.navy2} 55%, ${C.navy3} 100%)`, opacity: fade}}>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 120}}>
        <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 104, color: C.text}}>Full ranking + #1</div>
        <div style={{marginTop: 28, fontFamily: F.body, fontWeight: 600, fontSize: 46, color: C.mint}}>on my channel</div>
      </div>
    </AbsoluteFill>
  );
};
