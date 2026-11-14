import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {Background} from '../components/Background';
import {Watermark} from '../components/Watermark';
import {C} from '../theme';
import {toReal} from '../clock';
import {MasterAudio} from '../audio/Sfx';
import {cityPrefix, cue, d, group, section} from './layout';
import {SceneCamera, SceneCameraProps} from './camera';
import {ROLE} from './system';
import {ColdOpen, CityScene, Method, Outro, RentBreak, Takeaway, Twist} from './scenes';

const Seq: React.FC<{from: number; frames: number; name: string; children: React.ReactNode}> = ({from, frames, name, children}) => (
  <Sequence from={toReal(from)} durationInFrames={toReal(frames)} name={name}>
    {children}
  </Sequence>
);

/** Camera for one countdown city: whip in, whip out; #2 builds into #1, and #1 arrives with an impact flash. */
const cityCam = (rank: number): Omit<SceneCameraProps, 'frames' | 'children'> => ({
  seed: rank,
  enter: rank === 1 ? 'flash' : 'whip',
  exit: rank === 2 ? 'build' : 'whip',
  flashColor: ROLE.buying,
  punchAts: rank === 1 ? [] : [10],
});

/**
 * Video 2. Every sequence is placed by the recorded voiceover (src/audio/vo-layout.json), so picture and voice cannot drift.
 * One persistent Background keeps the whole video in the same "place".
 */
export const Video2: React.FC = () => {
  const intro = section('intro');
  type Cam = Omit<SceneCameraProps, 'frames' | 'children'>;
  const coldG = group('s01_');
  const twistG = group('s04_');
  const parts: {name: string; g: ReturnType<typeof group>; node: React.ReactNode; cam: Cam}[] = [
    {name: 'coldOpen', g: coldG, node: <ColdOpen />, cam: {seed: 0, enter: 'none', exit: 'whip', punchAts: [cue(coldG, ['gap', 'six'], coldG.rel[2], {from: 2})]}},
    {name: 'method', g: group('s02_'), node: <Method />, cam: {seed: 1}},
    ...Array.from({length: 10}, (_, i) => 10 - i).map((rank) => ({name: `city ${rank}`, g: group(cityPrefix(rank)), node: <CityScene rank={rank} />, cam: cityCam(rank)})),
    {name: 'rentBreak', g: group('s03_'), node: <RentBreak />, cam: {seed: 2, exit: 'build'}},
    {name: 'twist', g: twistG, node: <Twist />, cam: {seed: 3, enter: 'flash', flashColor: ROLE.wage, punchAts: [cue(twistG, 'houston', twistG.rel[1], {from: 1})]}},
    {name: 'takeaway', g: group('s05_'), node: <Takeaway />, cam: {seed: 4}},
    {name: 'outro', g: group('s06_'), node: <Outro />, cam: {seed: 5, exit: 'none'}},
  ];
  return (
    <AbsoluteFill style={{backgroundColor: C.navy3}}>
      <MasterAudio />
      <Background />
      {parts.map((p) => (
        <Seq key={p.name} from={p.g.from} frames={p.g.frames} name={p.name}>
          <SceneCamera frames={p.g.frames} {...p.cam}>{p.node}</SceneCamera>
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
