/**
 * Cue sheet types. Video 2 builds its cues from the voiceover cue sheet (scripts/vo_layout.py output), not from
 * hand-typed frames. A cue says "this sound's main impact lands on frame `at`" (local to its Sequence);
 * `Sfx.tsx` starts the file early by its `peak` (see manifest.json).
 */
import manifest from './manifest.json';

export type SfxName = keyof typeof manifest;
export type Cue = {
  sfx: SfxName;
  /** frame (local to the shot) on which the sound's main impact lands */
  at: number;
  /** relative loudness of this cue, 0..1 */
  gain: number;
  /** a hero cue is never ducked by the voice-over and pulls the music down around it */
  hero?: boolean;
};

/** Master-timeline frames of the big strikes: the music dips around these (see AUDIO.dip* and duck.ts). */
export const HERO_BEATS: number[] = [];
