public/music.mp3 is the music bed (composed by scripts/make_music.py, `npm run music`, nothing to license). It is built
from scripts/timing.json, which is exported from the video's own timeline, so it is as long as the video (about 5:00).
Re-run `npm run music` whenever a shot is cut or a reveal changes length.

Put these files here before rendering:
  intro.mp4   the 2.6 s PayRanked intro (carries its own sound)
  vo.wav      the voice-over, one file, starting at 0:00 of the video (cue sheet: review/VO-CUES.md, `npm run vo-cues`;
              then set `vo: true` in src/audio/config.ts, it is off until the file exists)

public/sfx/ holds the sound effects (53 files). They are synthesised by scripts/make_sfx.py, so there is nothing to
license and nothing to download. Re-run `npm run sfx` to regenerate them (it also rewrites src/audio/manifest.json).

After you add or change vo.wav, run `npm run vo-envelope` so the music and effects duck against the new voice-over.
Until a file is here, set its flag to false in src/audio/config.ts (vo / music) so the render does not stop on it.
