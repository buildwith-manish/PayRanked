import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {AUDIO} from './config';
import {Cue} from './cues';
import {musicGain, sfxDuck, voEnv} from './duck';
import manifest from './manifest.json';
import voManifest from './voiceover-manifest.json';
import {DESIGN_FPS, FPS, K, toReal} from '../clock';

/**
 * Plays one sound for every cue. Each file is started early by its `peak` (from manifest.json) so that its impact, not
 * its first sample, lands on the cue's frame. Every sound is its own <Sequence>, named after the file, so the cue sheet
 * is readable straight off the Remotion Studio timeline.
 */
export const SfxTrack: React.FC<{cues: Cue[]; offset: number}> = ({cues, offset}) => {
  if (!AUDIO.sfx) return null;
  return (
    <>
      {cues.map((c, i) => {
        const m = manifest[c.sfx];
        const start = Math.round((c.at / DESIGN_FPS - m.peak) * FPS);
        const trim = Math.max(0, -start);
        const from = Math.max(0, start);
        const dur = Math.ceil(m.dur * FPS) - trim + 1;
        const gain = Math.min(1, c.gain * AUDIO.sfxLevel);
        return (
          <Sequence key={`${i}-${c.sfx}-${c.at}`} from={from} durationInFrames={dur} layout="none" name={`sfx ${c.sfx}`}>
            <Audio src={staticFile(`sfx/${c.sfx}.wav`)} startFrom={trim} volume={(f) => gain * sfxDuck(offset + (from + f) / K, c.hero)} />
          </Sequence>
        );
      })}
    </>
  );
};

/**
 * Voice-over and music bed.
 *
 * The VO is now played as individual clips, each placed at its exact visual beat
 * via voiceover-manifest.json. This avoids the "giant wav" problem (48MB file
 * crashing the dev server) and the "overlap/cutoff" problem (clips being pushed
 * late because the previous clip ran long).
 *
 * Each clip is its own <Sequence> at the correct design-frame start time.
 * The music bed is a single <Audio> that runs the full length.
 */
export const MasterAudio: React.FC<{offset?: number}> = ({offset = 0}) => {
  return (
    <>
      {/* Voice-over: individual clips at exact visual beats */}
      {AUDIO.vo && voManifest.map((clip: any, i: number) => {
        const fromFrame = toReal(Math.round(clip.start * DESIGN_FPS));
        const durFrames = toReal(Math.round(clip.duration * DESIGN_FPS));
        const clipOffset = Math.round(clip.start * DESIGN_FPS);
        return (
          <Sequence
            key={clip.id}
            from={fromFrame}
            durationInFrames={durFrames}
            layout="none"
            name={`vo ${clip.id}`}
          >
            <Audio
              src={staticFile(clip.file)}
              volume={(f) => AUDIO.voLevel * (1 - 0.3 * (1 - voEnv(clipOffset + f / K)))}
            />
          </Sequence>
        );
      })}

      {/* Music bed: full length, ducked by the VO envelope */}
      {AUDIO.music && (
        <Audio
          src={staticFile('music.mp3')}
          startFrom={toReal(offset)}
          volume={(f) => musicGain(offset + f / K)}
        />
      )}
    </>
  );
};
