import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {Background} from '../components/Background';
import {Watermark} from '../components/Watermark';
import {C} from '../theme';
import {toReal} from '../clock';
import {MasterAudio} from '../audio/Sfx';
import {cityPrefix, d, group, section} from './layout';
import {ColdOpen, CityScene, Method, Outro, RentBreak, Takeaway, Twist} from './scenes';

const Seq: React.FC<{from: number; frames: number; name: string; children: React.ReactNode}> = ({from, frames, name, children}) => (
  <Sequence from={toReal(from)} durationInFrames={toReal(frames)} name={name}>
    {children}
  </Sequence>
);

/**
 * Video 2. Every sequence is placed by the recorded voiceover (src/audio/vo-layout.json), so picture and voice cannot drift.
 * One persistent Background keeps the whole video in the same "place".
 */
export const Video2: React.FC = () => {
  const intro = section('intro');
  const parts: {name: string; g: ReturnType<typeof group>; node: React.ReactNode}[] = [
    {name: 'coldOpen', g: group('s01_'), node: <ColdOpen />},
    {name: 'method', g: group('s02_'), node: <Method />},
    ...Array.from({length: 10}, (_, i) => 10 - i).map((rank) => ({name: `city ${rank}`, g: group(cityPrefix(rank)), node: <CityScene rank={rank} />})),
    {name: 'rentBreak', g: group('s03_'), node: <RentBreak />},
    {name: 'twist', g: group('s04_'), node: <Twist />},
    {name: 'takeaway', g: group('s05_'), node: <Takeaway />},
    {name: 'outro', g: group('s06_'), node: <Outro />},
  ];
  return (
    <AbsoluteFill style={{backgroundColor: C.navy3}}>
      <MasterAudio />
      <Background />
      {parts.map((p) => (
        <Seq key={p.name} from={p.g.from} frames={p.g.frames} name={p.name}>
          <AbsoluteFill>{p.node}</AbsoluteFill>
        </Seq>
      ))}
      <Seq from={d(intro.start)} frames={d(intro.seconds)} name="intro">
        <AbsoluteFill style={{backgroundColor: C.navy3}}>
          <OffthreadVideo src={staticFile('intro.mp4')} />
        </AbsoluteFill>
      </Seq>
      <Watermark />
    </AbsoluteFill>
  );
};
