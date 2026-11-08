import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion';
import {sec} from '../theme';

export const SHOT2_FRAMES = sec(2.6);

/** The 2.6 s PayRanked intro. It has its own audio, so the music bed must be muted during this shot. */
export const Shot2: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <OffthreadVideo src={staticFile('intro.mp4')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  </AbsoluteFill>
);
