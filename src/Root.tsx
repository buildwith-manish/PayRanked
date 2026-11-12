// Load self-hosted Fontshare fonts (Clash Display, Satoshi) + Google Fonts
// (Plus Jakarta Sans, JetBrains Mono) before any composition renders.
// @font-face declarations live in src/fontshare/fonts.css; this import triggers
// them and the @remotion/google-fonts loaders in a single side-effect call.
import './fontshare/load-fonts';

import React from 'react';
import {AbsoluteFill, Audio, Composition, Sequence, staticFile} from 'remotion';
import {RankReveal} from './components/RankReveal';
import {Shot1, SHOT1_FRAMES} from './shots/Shot1';
import {Shot2, SHOT2_FRAMES} from './shots/Shot2';
import {Shot3, SHOT3_FRAMES} from './shots/Shot3';
import {Shot5, SHOT5_FRAMES} from './shots/Shot5';
import {Shot55, SHOT55_FRAMES} from './shots/Shot55'; // EXTEND-4: practical takeaways
import {Shot6, SHOT6_FRAMES} from './shots/Shot6';
import {Grade} from './components/Grade';
import {Watermark} from './components/Watermark';
import {C, FPS, H, W, sec} from './theme';
import {FrameOffset, K, toReal} from './clock';
import {Break} from './components/Break';
import {breaks, COUNTDOWN_TOTAL, START, timeline, VIDEO_FRAMES} from './timeline';
import {CUES, Cue} from './audio/cues';
import {MasterAudio, SfxTrack} from './audio/Sfx';
import {Short1EndCard, SHORT1_FRAMES, SHORT1_METHOD_SECONDS} from './shots/Short1';
import {SHORT_END_SECONDS, SHORT_HOOKS, ShortEndCard, ShortHook} from './shots/ShortOverlays';
import {VH, VW} from './layout';
import voManifest from './audio/voiceover-manifest.json';
import {AUDIO} from './audio/config';
import {musicGain} from './audio/duck';

const Countdown: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => (
  <AbsoluteFill>
    {timeline.map((t, i) => (
      <Sequence key={t.label} from={toReal(t.from)} durationInFrames={toReal(t.dur)} name={`${t.label} ${t.names.join(' + ')}`}>
        <RankReveal rankLabel={t.label} names={t.names} durationInFrames={t.dur} railBefore={t.railBefore} fast={t.fast} versus={t.versus} />
        {withAudio && <SfxTrack cues={CUES.reveals[i]} offset={START.shot4 + t.from} />}
      </Sequence>
    ))}
    {breaks.map((b, i) => (
      <Sequence key={b.kind} from={toReal(b.from)} durationInFrames={toReal(b.dur)} name={`Break ${b.kind}`}>
        <Break kind={b.kind} rail={b.rail} durationInFrames={b.dur} />
        {withAudio && <SfxTrack cues={CUES.breaks[i]} offset={START.shot4 + b.from} />}
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
      {/* Channel watermark on every standalone composition too, so it appears in Remotion Studio shot previews. */}
      <Watermark />
    </>
  );

export const Video1: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => (
  <Grade>
  <AbsoluteFill style={{backgroundColor: C.navy3}}>
    {/* voice-over and music bed (ducked by the voice, dipped on impacts); every sound effect is inside its shot's Sequence */}
    {withAudio && <MasterAudio />}
    <Sequence from={toReal(START.shot1)} durationInFrames={toReal(SHOT1_FRAMES)} name="Shot 1 Cold open">
      <Shot1 />
      {withAudio && <SfxTrack cues={CUES.shot1} offset={START.shot1} />}
    </Sequence>
    <Sequence from={toReal(START.shot2)} durationInFrames={toReal(SHOT2_FRAMES)} name="Shot 2 Intro">
      <Shot2 />
    </Sequence>
    <Sequence from={toReal(START.shot3)} durationInFrames={toReal(SHOT3_FRAMES)} name="Shot 3 Method">
      <Shot3 />
      {withAudio && <SfxTrack cues={CUES.shot3} offset={START.shot3} />}
    </Sequence>
    <Sequence from={toReal(START.shot4)} durationInFrames={toReal(COUNTDOWN_TOTAL)} name="Shot 4 Countdown">
      <Countdown withAudio={withAudio} />
    </Sequence>
    <Sequence from={toReal(START.shot5)} durationInFrames={toReal(SHOT5_FRAMES)} name="Shot 5 Reality check">
      <Shot5 />
      {withAudio && <SfxTrack cues={CUES.shot5} offset={START.shot5} />}
    </Sequence>
    {/* EXTEND-4: Shot 5.5 Practical Takeaways — 80s, sits between Reality Check and Outro */}
    <Sequence from={toReal(START.shot55)} durationInFrames={toReal(SHOT55_FRAMES)} name="Shot 5.5 Practical">
      <Shot55 />
      {withAudio && <SfxTrack cues={CUES.shot55} offset={START.shot55} />}
    </Sequence>
    <Sequence from={toReal(START.shot6)} durationInFrames={toReal(SHOT6_FRAMES)} name="Shot 6 Outro">
      <Shot6 />
      {withAudio && <SfxTrack cues={CUES.shot6} offset={START.shot6} />}
    </Sequence>
    {/* Channel watermark — fades in at 5s, fades out 18s before end. Sits on top of every shot. */}
    <Watermark />
  </AbsoluteFill>
  </Grade>
);

/** `parts` (Shorts 6 and 7): source windows played back to back. In the long video each profile card is up for 25 s but the voice reads it
 *  for about 10, so the rest is a still card in silence. The Shorts keep the spoken part of each card and skip the silence.
 *  `start` is a second of the long video, so a part never needs retiming. */
type ShortPart = {start: number; seconds: number};
type ShortSpec = {id: 2 | 3 | 4 | 5 | 6 | 7; sourceStart: number; seconds: number; parts?: ShortPart[]};
export const SHORTS_2_TO_7: ShortSpec[] = [
  {id: 2, sourceStart: 109, seconds: 55},
  {id: 3, sourceStart: 164, seconds: 40},
  {id: 4, sourceStart: 204, seconds: 50},
  {id: 5, sourceStart: 254, seconds: 40},
  {id: 6, sourceStart: 429, seconds: 19, parts: [{start: 429, seconds: 19}]}, // hook + the remote-worker card while it is being read (voice ends at 16.6 s)
  {id: 7, sourceStart: 484, seconds: 22, parts: [{start: 484, seconds: 12.5}, {start: 509, seconds: 9.5}]}, // early-career card while it is read (voice ends at 65.1 s), then straight to the formula (80-89.5 s, voice ends 88.3 s)
];

const SegmentAudio: React.FC<{sourceStart: number; seconds: number; fadeIn?: boolean; joined?: boolean}> = ({sourceStart, seconds, fadeIn = false, joined = false}) => {
  const sourceEnd = sourceStart + seconds;
  return (
    <>
      {AUDIO.vo && voManifest.map((clip: any) => {
        const shotStart = clip.shot === 'shot1' ? 0 : clip.shot === 'shot3' ? 30.5 : clip.shot === 'shot4' ? 109 : clip.shot === 'shot5' ? 344 : clip.shot === 'shot55' ? 429 : 539;
        const clipStart = shotStart + clip.at - clip.lead;
        const clipEnd = clipStart + clip.duration;
        if (clipEnd <= sourceStart || clipStart >= sourceEnd) return null;
        const trim = Math.max(0, sourceStart - clipStart);
        const localStart = Math.max(0, clipStart - sourceStart);
        const duration = Math.min(clipEnd, sourceEnd) - Math.max(clipStart, sourceStart);
        return (
          <Sequence key={clip.id} from={toReal(sec(localStart))} durationInFrames={toReal(sec(duration)) + 10} layout="none" name={`short vo ${clip.id}`}>
            <Audio src={staticFile(clip.file)} startFrom={toReal(sec(trim))} volume={AUDIO.voLevel} />
          </Sequence>
        );
      })}
      {/* the music bed runs on under the end card and fades out over its first 1.5 s (parts that are followed by another part fade out over 8 frames instead) */}
      {AUDIO.music && (
        <Audio
          src={staticFile('music.mp3')}
          startFrom={toReal(sec(sourceStart))}
          volume={(f) => {
            const t = f / K; // design frames since the part began
            const end = sec(seconds);
            const out = joined ? Math.min(1, Math.max(0, (end - t) / 8)) : Math.min(1, Math.max(0, 1 - (t - end) / sec(1.5)));
            return musicGain(sec(sourceStart) + t) * out * (fadeIn ? Math.min(1, t / 8) : 1);
          }}
        />
      )}
    </>
  );
};

const CountdownSegment: React.FC<{offset: number; seconds: number}> = ({offset, seconds}) => (
  <AbsoluteFill>
    {timeline.map((t, i) => {
      const from = t.from - offset;
      const end = from + t.dur;
      if (end <= 0 || from >= sec(seconds)) return null;
      return (
        <Sequence key={t.label} from={toReal(Math.max(0, from))} durationInFrames={toReal(Math.min(t.dur, sec(seconds) - Math.max(0, from)))} name={`${t.label} ${t.names.join(' + ')}`}>
          <RankReveal rankLabel={t.label} names={t.names} durationInFrames={t.dur} railBefore={t.railBefore} fast={t.fast} versus={t.versus} />
          <SfxTrack cues={CUES.reveals[i]} offset={START.shot4 + t.from} />
        </Sequence>
      );
    })}
    {breaks.map((b, i) => {
      const from = b.from - offset;
      const end = from + b.dur;
      if (end <= 0 || from >= sec(seconds)) return null;
      return (
        <Sequence key={b.kind} from={toReal(Math.max(0, from))} durationInFrames={toReal(Math.min(b.dur, sec(seconds) - Math.max(0, from)))} name={`Break ${b.kind}`}>
          <Break kind={b.kind} rail={b.rail} durationInFrames={b.dur} />
          <SfxTrack cues={CUES.breaks[i]} offset={START.shot4 + b.from} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

export const ShortSegment: React.FC<{spec: ShortSpec}> = ({spec}) => {
  const isCountdown = spec.id <= 5;
  const hook = SHORT_HOOKS[spec.id];
  const parts = spec.parts ?? [{start: spec.sourceStart, seconds: spec.seconds}];
  let at = 0; // seconds into the Short at which each part begins
  return (
    // Native 1080x1920 composition: every scene below reads its size from the composition (useLayout) and lays itself out for 9:16.
    <AbsoluteFill style={{backgroundColor: C.navy3}}>
      <Grade>
        <AbsoluteFill>
          {isCountdown ? (
            <>
              {/* the Short itself; the same end card as Short 1 follows it (SHORT_END_SECONDS) */}
              <Sequence from={0} durationInFrames={toReal(sec(spec.seconds))} name={`Short ${spec.id} content`}>
                <CountdownSegment offset={sec(spec.sourceStart) - START.shot4} seconds={spec.seconds} />
              </Sequence>
              <SegmentAudio sourceStart={spec.sourceStart} seconds={spec.seconds} />
            </>
          ) : (
            parts.map((part, i) => {
              const from = at;
              at += part.seconds;
              const localOffset = sec(part.start) - START.shot55;
              const last = i === parts.length - 1;
              return (
                <React.Fragment key={part.start}>
                  <Sequence from={toReal(sec(from))} durationInFrames={toReal(sec(part.seconds))} name={`Short ${spec.id} part ${i + 1}`}>
                    <FrameOffset offset={localOffset}>
                      <Shot55 />
                      <SfxTrack cues={CUES.shot55.map((c) => ({...c, at: c.at - localOffset})).filter((c) => c.at >= 0 && c.at < sec(part.seconds))} offset={START.shot55 + localOffset} />
                    </FrameOffset>
                  </Sequence>
                  {/* voice-over and music of this part; the last part's music runs on under the end card */}
                  <Sequence from={toReal(sec(from))} durationInFrames={toReal(sec(part.seconds + (last ? SHORT_END_SECONDS : 0)))} layout="none" name={`Short ${spec.id} part ${i + 1} audio`}>
                    <SegmentAudio sourceStart={part.start} seconds={part.seconds} fadeIn={i > 0} joined={!last} />
                  </Sequence>
                </React.Fragment>
              );
            })
          )}
          {hook && (
            <Sequence from={0} durationInFrames={toReal(sec(3))} name={`Short ${spec.id} hook`}>
              <ShortHook text={hook} />
            </Sequence>
          )}
          <Sequence from={toReal(sec(spec.seconds))} durationInFrames={toReal(sec(SHORT_END_SECONDS))} name={`Short ${spec.id} end card`}>
            <ShortEndCard />
          </Sequence>
          <Watermark />
        </AbsoluteFill>
      </Grade>
    </AbsoluteFill>
  );
};

// Each standalone composition plays the same sound as it does inside Video1 (same cues, same voice-over slice).
const GradedShot1 = graded(Shot1, START.shot1, CUES.shot1);
const GradedShot2 = graded(Shot2, START.shot2);
const GradedShot3 = graded(Shot3, START.shot3, CUES.shot3);
const GradedShot5 = graded(Shot5, START.shot5, CUES.shot5);
const GradedShot55 = graded(Shot55, START.shot55, CUES.shot55); // EXTEND-4
const GradedShot6 = graded(Shot6, START.shot6, CUES.shot6);
const GradedCountdown = graded(Countdown, START.shot4); // the reveals carry their own cues
const GradedReveals = timeline.map((_, i) => graded(RankReveal, START.shot4 + timeline[i].from, CUES.reveals[i]));

const GradedBreaks = breaks.map((b, i) => graded(Break, START.shot4 + b.from, CUES.breaks[i]));

const SHORT1_METHOD_OFFSET = 27;
const SHORT1_SOURCE_METHOD_START = START.shot3;
const MUTED_WORDS: Record<string, [number, number]> = {
  '002_v02_cold_open': [1.04, 1.48],
  '003_v03_cold_open': [0.48, 0.94],
};

const Short1Audio: React.FC = () => (
  <>
    {AUDIO.vo && voManifest.map((clip: any) => {
      const isShot1 = clip.shot === 'shot1';
      const isMethod = clip.shot === 'shot3' && clip.at < SHORT1_METHOD_SECONDS;
      if (!isShot1 && !isMethod) return null;
      const sourceStart = isShot1 ? clip.at - clip.lead : SHORT1_SOURCE_METHOD_START + clip.at - clip.lead;
      const localStart = isShot1 ? sourceStart : SHORT1_METHOD_OFFSET + clip.at - clip.lead;
      const mute = MUTED_WORDS[clip.id];
      const maxDuration = isMethod ? SHORT1_METHOD_SECONDS - clip.at + clip.lead : clip.duration;
      return (
        <Sequence key={clip.id} from={toReal(sec(localStart))} durationInFrames={toReal(sec(Math.min(clip.duration, maxDuration))) + (maxDuration < clip.duration ? 0 : 10)} layout="none" name={`short vo ${clip.id}`}>
          <Audio
            src={staticFile(clip.file)}
            volume={(f) => {
              const seconds = f / FPS;
              return mute && seconds >= mute[0] && seconds <= mute[1] ? 0 : AUDIO.voLevel;
            }}
          />
        </Sequence>
      );
    })}
    {AUDIO.music && (
      <>
        <Sequence from={0} durationInFrames={toReal(sec(27))} layout="none">
          <Audio src={staticFile('music.mp3')} startFrom={0} volume={(f) => musicGain(f / K)} />
        </Sequence>
        <Sequence from={toReal(sec(SHORT1_METHOD_OFFSET))} durationInFrames={toReal(sec(SHORT1_METHOD_SECONDS))} layout="none">
          <Audio src={staticFile('music.mp3')} startFrom={toReal(SHORT1_SOURCE_METHOD_START)} volume={(f) => musicGain(SHORT1_SOURCE_METHOD_START + f / K)} />
        </Sequence>
      </>
    )}
  </>
);

const Short1: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.navy3}}>
    <Grade>
      <AbsoluteFill>
        <Sequence from={0} durationInFrames={toReal(sec(27))} name="Short 1 cold open">
          <Shot1 />
          <SfxTrack cues={CUES.shot1} offset={START.shot1} />
        </Sequence>
        <Sequence from={toReal(sec(SHORT1_METHOD_OFFSET))} durationInFrames={toReal(sec(SHORT1_METHOD_SECONDS))} name="Short 1 method opener">
          <Shot3 />
          <SfxTrack cues={CUES.shot3} offset={START.shot3} />
        </Sequence>
        <Sequence from={toReal(sec(27 + SHORT1_METHOD_SECONDS))} durationInFrames={toReal(sec(3.5))} name="Short 1 end card">
          <Short1EndCard />
        </Sequence>
        <Short1Audio />
        <Watermark />
      </AbsoluteFill>
    </Grade>
  </AbsoluteFill>
);

const common = {width: W, height: H, fps: FPS};

export const Root: React.FC = () => (
  <>
    <Composition id="Video1" component={Video1} durationInFrames={toReal(VIDEO_FRAMES)} {...common} />
    <Composition id="Short1-Vertical" component={Short1} durationInFrames={toReal(SHORT1_FRAMES)} width={VW} height={VH} fps={FPS} />
    {SHORTS_2_TO_7.map((spec) => (
      <Composition
        key={spec.id}
        id={`Short${spec.id}-Vertical`}
        component={ShortSegment}
        durationInFrames={toReal(sec(spec.seconds + SHORT_END_SECONDS))}
        width={VW}
        height={VH}
        fps={FPS}
        defaultProps={{spec}}
      />
    ))}
    <Composition id="Shot1-ColdOpen" component={GradedShot1} durationInFrames={toReal(SHOT1_FRAMES)} {...common} />
    <Composition id="Shot2-Intro" component={GradedShot2} durationInFrames={toReal(SHOT2_FRAMES)} {...common} />
    <Composition id="Shot3-Method" component={GradedShot3} durationInFrames={toReal(SHOT3_FRAMES)} {...common} />
    <Composition id="Shot4-Countdown" component={GradedCountdown} durationInFrames={toReal(COUNTDOWN_TOTAL)} {...common} />
    <Composition id="Shot5-RealityCheck" component={GradedShot5} durationInFrames={toReal(SHOT5_FRAMES)} {...common} />
    <Composition id="Shot55-Practical" component={GradedShot55} durationInFrames={toReal(SHOT55_FRAMES)} {...common} />
    <Composition id="Shot6-Outro" component={GradedShot6} durationInFrames={toReal(SHOT6_FRAMES)} {...common} />
    {breaks.map((b, i) => (
      <Composition key={b.kind} id={`Break-${b.kind}`} component={GradedBreaks[i]} durationInFrames={toReal(b.dur)} {...common} defaultProps={{kind: b.kind, rail: b.rail, durationInFrames: b.dur}} />
    ))}
    {timeline.map((t, i) => (
      <Composition
        key={t.label}
        id={`RankReveal-${t.names[0].replace(/\s+/g, '')}`}
        component={GradedReveals[i]}
        durationInFrames={toReal(t.dur)}
        {...common}
        defaultProps={{rankLabel: t.label, names: t.names, durationInFrames: t.dur, railBefore: t.railBefore, fast: t.fast, versus: t.versus}}
      />
    ))}
  </>
);
