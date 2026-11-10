/**
 * Mix settings. Everything is linear gain (1 = unity). Files in public/sfx are normalised to -1 dBFS peak, so the
 * per-cue gains in cues.ts set how loud each sound is *relative to the others*, and these set the buses.
 */
export const AUDIO = {
  /**
   * Set false while a track is not in public/ yet, so the render does not stop on the missing file.
   * public/vo.wav is not in the repo yet, so this is off. Record it against review/VO-CUES.md, drop it in public/,
   * run `npm run vo-envelope`, then set this to true.
   */
  vo: false,
  music: true,
  sfx: true,

  voLevel: 1,
  /** Music bed level before ducking. Per-section levels are in `musicGain` (master.ts). */
  musicLevel: 0.5,
  sfxLevel: 0.6,

  /** Sidechain: how far the music drops while the voice is speaking (0.7 = about -10 dB). */
  musicDuck: 0.7,
  /** The SFX bus ducks a little too, so a tick never masks a word. Cues marked `hero` skip this. */
  sfxDuck: 0.28,

  /** Impacts (cues marked `hero`) pull the music down just before and just after they land. */
  dipDepth: 0.65,
  dipPre: 8,
  dipRelease: 20,
};
