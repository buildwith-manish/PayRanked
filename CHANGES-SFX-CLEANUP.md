# SFX cleanup: fewer, softer movement sounds

Whooshes, swishes and "out" sounds were about half of all cues (100 lines). They sounded the travel of every text line,
card and exit, so the mix read as one repeated hiss. Now:

- **Movement cues: 100 -> 28 lines.** Kept for big camera/scene moves (rank-reveal whip, seam, rail opening, Shot 5
  colour wave, interrupt, countdown hand-over, outro card whip) and one headline swish per beat.
- **Text and cards** use a muted tap (`tap_0..2`, new) on arrival/landing instead of a swish or a whoosh on the way in.
- **Departures** all use `out_soft` (new: darker, quieter). Most exits are silent: the next element's arrival marks them.
- **Rotation:** `whoosh_s/m/l` each have `_b` and `_c` variants (new: lower top end, different sweep, panned the other
  way). `tidy()` in `cues.ts` rotates them and adds a few percent of level variation, so one file never repeats.
- **Density:** `tidy()` keeps at most one movement sound per 50 design frames (about 1.7 s); the biggest wins, and a
  layered partner within 4 frames counts as the same move (the rank-reveal whip keeps its whoosh_l + whoosh_m).
- **Level:** movement sounds are trimmed to 70% in `cue()`, so they sit under the music and voice.
- Measured: the new whooshes carry 0.6-2.8% of their energy above 6 kHz (the old `swish` carried 36%).

`scripts/make_sfx.py` generates the new files; the existing files are left exactly as committed.

## Swapping in recorded sounds (best remaining upgrade)
Drop licensed or CC0 recordings into `public/sfx/` under the same names (24-bit/16-bit WAV, 48 kHz stereo, normalised to
-1 dBFS, trimmed so the impact is at the time listed in `manifest.json`): `whoosh_s/_b/_c`, `whoosh_m/_b/_c`,
`whoosh_l/_b/_c`, `whoosh_xl`, `out_soft`, `swish`, `swish_long`, `tap_0..2`. If an impact point differs, update that
file's `peak` in `src/audio/manifest.json`.
