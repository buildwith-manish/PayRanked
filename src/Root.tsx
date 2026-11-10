// Load self-hosted Fontshare fonts (Clash Display, Satoshi) + Google Fonts
// (Plus Jakarta Sans, JetBrains Mono) before any composition renders.
// @font-face declarations live in src/fontshare/fonts.css; this import triggers
// them and the @remotion/google-fonts loaders in a single side-effect call.
import './fontshare/load-fonts';

import React from 'react';
import {AbsoluteFill, Composition, Sequence} from 'remotion';
import {RankReveal} from './components/RankReveal';
import {Shot1, SHOT1_FRAMES} from './shots/Shot1';
import {Shot2, SHOT2_FRAMES} from './shots/Shot2';
import {Shot3, SHOT3_FRAMES} from './shots/Shot3';
import {Shot5, SHOT5_FRAMES} from './shots/Shot5';
import {Shot6, SHOT6_FRAMES} from './shots/Shot6';
import {Grade} from './components/Grade';
import {C, FPS, H, W} from './theme';
import {toReal} from './clock';
import {COUNTDOWN_TOTAL, START, timeline} from './timeline';
import {CUES, Cue} from './audio/cues';
import {MasterAudio, SfxTrack} from './audio/Sfx';

const Countdown: React.FC = () => (
  <AbsoluteFill>
    {timeline.map((t, i) => (
      <Sequence key={t.label} from={toReal(t.from)} durationInFrames={toReal(t.dur)} name={`${t.label} ${t.names.join(' + ')}`}>
        <RankReveal rankLabel={t.label} names={t.names} durationInFrames={t.dur} railBefore={t.railBefore} />
        <SfxTrack cues={CUES.reveals[i]} offset={START.shot4 + t.from} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

/** Every composition goes through the same filmic grade (bloom, S-curve, split tone, lens dust). Video1 grades once, as a whole. */
const graded =
  <P extends object>(Comp: React.ComponentType<P>, offset = 0, cues?: Cue[]): React.FC<P> =>
  (props) => (
    <>
      <Grade>
        <Comp {...props} />
      </Grade>
      {cues && <SfxTrack cues={cues} offset={offset} />}
      <MasterAudio offset={offset} />
    </>
  );

const Video1: React.FC = () => (
  <Grade>
  <AbsoluteFill style={{backgroundColor: C.navy3}}>
    {/* voice-over and music bed (ducked by the voice, dipped on impacts); every sound effect is inside its shot's Sequence */}
    <MasterAudio />
    <Sequence from={toReal(START.shot1)} durationInFrames={toReal(SHOT1_FRAMES)} name="Shot 1 Cold open">
      <Shot1 />
      <SfxTrack cues={CUES.shot1} offset={START.shot1} />
    </Sequence>
    <Sequence from={toReal(START.shot2)} durationInFrames={toReal(SHOT2_FRAMES)} name="Shot 2 Intro">
      <Shot2 />
    </Sequence>
    <Sequence from={toReal(START.shot3)} durationInFrames={toReal(SHOT3_FRAMES)} name="Shot 3 Method">
      <Shot3 />
      <SfxTrack cues={CUES.shot3} offset={START.shot3} />
    </Sequence>
    <Sequence from={toReal(START.shot4)} durationInFrames={toReal(COUNTDOWN_TOTAL)} name="Shot 4 Countdown">
      <Countdown />
    </Sequence>
    <Sequence from={toReal(START.shot5)} durationInFrames={toReal(SHOT5_FRAMES)} name="Shot 5 Reality check">
      <Shot5 />
      <SfxTrack cues={CUES.shot5} offset={START.shot5} />
    </Sequence>
    <Sequence from={toReal(START.shot6)} durationInFrames={toReal(SHOT6_FRAMES)} name="Shot 6 Outro">
      <Shot6 />
      <SfxTrack cues={CUES.shot6} offset={START.shot6} />
    </Sequence>
  </AbsoluteFill>
  </Grade>
);

// Each standalone composition plays the same sound as it does inside Video1 (same cues, same voice-over slice).
const GradedShot1 = graded(Shot1, START.shot1, CUES.shot1);
const GradedShot2 = graded(Shot2, START.shot2);
const GradedShot3 = graded(Shot3, START.shot3, CUES.shot3);
const GradedShot5 = graded(Shot5, START.shot5, CUES.shot5);
const GradedShot6 = graded(Shot6, START.shot6, CUES.shot6);
const GradedCountdown = graded(Countdown, START.shot4); // the reveals carry their own cues
const GradedReveals = timeline.map((_, i) => graded(RankReveal, START.shot4 + timeline[i].from, CUES.reveals[i]));

const common = {width: W, height: H, fps: FPS};

export const Root: React.FC = () => (
  <>
    <Composition id="Video1" component={Video1} durationInFrames={toReal(16200)} {...common} />
    <Composition id="Shot1-ColdOpen" component={GradedShot1} durationInFrames={toReal(SHOT1_FRAMES)} {...common} />
    <Composition id="Shot2-Intro" component={GradedShot2} durationInFrames={toReal(SHOT2_FRAMES)} {...common} />
    <Composition id="Shot3-Method" component={GradedShot3} durationInFrames={toReal(SHOT3_FRAMES)} {...common} />
    <Composition id="Shot4-Countdown" component={GradedCountdown} durationInFrames={toReal(COUNTDOWN_TOTAL)} {...common} />
    <Composition id="Shot5-RealityCheck" component={GradedShot5} durationInFrames={toReal(SHOT5_FRAMES)} {...common} />
    <Composition id="Shot6-Outro" component={GradedShot6} durationInFrames={toReal(SHOT6_FRAMES)} {...common} />
    {timeline.map((t, i) => (
      <Composition
        key={t.label}
        id={`RankReveal-${t.names[0].replace(/\s+/g, '')}`}
        component={GradedReveals[i]}
        durationInFrames={toReal(t.dur)}
        {...common}
        defaultProps={{rankLabel: t.label, names: t.names, durationInFrames: t.dur, railBefore: t.railBefore}}
      />
    ))}
  </>
);
