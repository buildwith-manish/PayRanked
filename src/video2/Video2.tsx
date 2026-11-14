import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Background} from '../components/Background';
import {Watermark} from '../components/Watermark';
import {C, F} from '../theme';
import {toReal} from '../clock';
import {PLAN, START} from '../timeline2';
import {MasterAudio} from '../audio/Sfx';

/**
 * Video 2 skeleton. One Sequence per planned section; each is replaced by a real scene once the voiceover exists.
 */
const Placeholder: React.FC<{title: string}> = ({title}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <Background />
    <div style={{fontFamily: F.display, fontSize: 96, color: C.mint, letterSpacing: 2}}>{title}</div>
  </AbsoluteFill>
);

export const Video2: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.navy3}}>
    <MasterAudio />
    {PLAN.map((p) => (
      <Sequence key={p.id} from={toReal(START[p.id])} durationInFrames={toReal(p.seconds * 30)} name={p.id}>
        <Placeholder title={p.id} />
      </Sequence>
    ))}
    <Watermark />
  </AbsoluteFill>
);
