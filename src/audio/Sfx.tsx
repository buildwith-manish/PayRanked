import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {AUDIO} from './config';
import {Cue} from './cues';
import {musicGain, sfxDuck} from './duck';
import manifest from './manifest.json';
import {FPS} from '../theme';

/**
 * Plays one sound for every cue. Each file is started early by its `peak` (from manifest.json) so that its impact, not
 * its first sample, lands on the cue's frame. Every sound is its own <Sequence>, named after the file, so the cue sheet
 * is readable straight off the Remotion Studio timeline.
 *
 * `offset` is the master-timeline frame this shot starts on. The voice-over's duck is measured on the master timeline,
 * so a shot rendered on its own is ducked exactly as it is inside Video1.
 */
export const SfxTrack: React.FC<{cues: Cue[]; offset: number}> = ({cues, offset}) => {
  if (!AUDIO.sfx) return null;
  return (
    <>
      {cues.map((c, i) => {
        const m = manifest[c.sfx];
        const start = Math.round(c.at - m.peak * FPS);
        const trim = Math.max(0, -start); // a cue near the shot's first frames loses the start of its lead-in
        const from = Math.max(0, start);
        const dur = Math.ceil(m.dur * FPS) - trim + 1;
        const gain = Math.min(1, c.gain * AUDIO.sfxLevel);
        return (
          <Sequence key={`${i}-${c.sfx}-${c.at}`} from={from} durationInFrames={dur} layout="none" name={`sfx ${c.sfx}`}>
            <Audio src={staticFile(`sfx/${c.sfx}.wav`)} startFrom={trim} volume={(f) => gain * sfxDuck(offset + from + f, c.hero)} />
          </Sequence>
        );
      })}
    </>
  );
};

/**
 * Voice-over and music bed. Mounted once on Video1 (offset 0), or on a single shot (offset = where it starts on the
 * master timeline) so every composition in the Studio plays with the same sound.
 */
export const MasterAudio: React.FC<{offset?: number}> = ({offset = 0}) => (
  <>
    {AUDIO.vo && <Audio src={staticFile('vo.wav')} startFrom={offset} volume={AUDIO.voLevel} />}
    {AUDIO.music && <Audio src={staticFile('music.mp3')} startFrom={offset} volume={(f) => musicGain(offset + f)} />}
  </>
);
