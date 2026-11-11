import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {AUDIO} from './config';
import {Cue} from './cues';
import {musicGain, sfxDuck} from './duck';
import manifest from './manifest.json';
import voManifest from './voiceover-manifest.json';
import {DESIGN_FPS, FPS, K, toReal} from '../clock';
import {START} from '../timeline';

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
 * Simplified: VO clips play at full volume (AUDIO.voLevel = 1.0).
 * Music ducks based on the VO envelope from the concatenated mp3.
 */
export const MasterAudio: React.FC<{offset?: number}> = ({offset = 0}) => {
  return (
    <>
      {/* Voice-over: individual clips at exact visual beats */}
      {AUDIO.vo && voManifest.map((clip: any) => {
        // `at` = seconds after the shot's start at which the first WORD is heard; `lead` = silence at the head of the file.
        // Anchoring to START[shot] means the voice follows the picture whenever a shot is made longer or shorter.
        const fromFrame = Math.max(0, toReal(Math.round((START[clip.shot as keyof typeof START] + (clip.at - clip.lead) * DESIGN_FPS))));
        const durFrames = toReal(Math.round(clip.duration * DESIGN_FPS)) + 10; // +10 frames buffer
        return (
          <Sequence key={clip.id} from={fromFrame} durationInFrames={durFrames} layout="none" name={`vo ${clip.id}`}>
            <Audio src={staticFile(clip.file)} volume={AUDIO.voLevel} />
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
