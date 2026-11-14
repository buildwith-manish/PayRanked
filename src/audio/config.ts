/**
 * Mix settings. Everything is linear gain (1 = unity). Files in public/sfx are normalised to -1 dBFS peak, so the
 * per-cue gains in cues.ts set how loud each sound is *relative to the others*, and these set the buses.
 */
export const AUDIO = {
  /**
   * Set false while a track is not in public/ yet, so the render does not stop on the missing file.
   * Voice clips come from voiceover-manifest.json, so an empty manifest plays nothing.
   */
  vo: true, // plays whatever is listed in voiceover-manifest.json (empty until the clips are recorded)
  music: true, // public/music.mp3 comes from scripts/make_music2.py (Video 2)
  sfx: true,

  voLevel: 0.9, // clips in public/voiceover are levelled to -15 LUFS (scripts/normalize_vo.py); 0.9 leaves headroom for music + SFX
  /** Music bed level before ducking. Per-section levels are in `musicGain` (master.ts). */
  musicLevel: 0.4,
  sfxLevel: 0.26,

  /** Sidechain: how far the music drops while the voice is speaking (0.7 = about -10 dB). */
  musicDuck: 0.6,
  /** The SFX bus ducks while the voice speaks (0.55 = about -7 dB), so a tick never masks a word. */
  sfxDuck: 0.55,
  /** Cues marked `hero` (the big impacts) duck less, so they still punch, but never sit on top of a word. */
  heroDuck: 0.45,

  /** Impacts (cues marked `hero`) pull the music down just before and just after they land. */
  dipDepth: 0.65,
  dipPre: 8,
  dipRelease: 20,
};
