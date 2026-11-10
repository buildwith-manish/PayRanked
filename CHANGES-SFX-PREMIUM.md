# PayRanked video 1: premium sound-effects pass

Rewrote the synthesis in `scripts/make_sfx.py` so every effect sounds more expensive. Nothing the cue sheet depends on moved: all 53 file
names, every file's length and every impact point are the same, and `src/audio/manifest.json` came out byte-identical to the old one.
`cues.ts` and the shots are untouched. Still synthesised from scratch, so nothing to license.

## What changed in the sound
- **Hits** (`hit_big`, `hit_med`, `hit_small`, `stamp`, `lock`): the sub is now tuned (D2 to D1, F2 to F1, C3 to D2, A2 to A1) so it sits under the
  D-minor music. Layers: sub with a fast pitch drop, a mid body (octave up for small speakers, a noise band for the chest, a low boom), soft
  saturation on that body, a clean filtered-noise crack, then a short room. The room tail is a bright part plus a darker, longer part, so it softens
  as it dies, and it has no sub in it (high-passed at 140 Hz), which keeps the low end tight. Metal ring on stamp and lock is slightly inharmonic with a detuned twin.
- **Coins**: inharmonic metal partials where the higher ones die fastest (decay is about 1 / ratio), a detuned twin of the fundamental for a slow
  shimmer, a lighter contact tick, a dull tap, and a tiny bounce made of two shorter, slightly flatter strikes. The four pitches are G6, A6, C7 and D7,
  so a pour of coins stays in key.
- **Glass tones** (`ding`, `ding_hi`, `bell_ring`, `ping`, `ping_lo`, `chip_0..2`, `blip_0..8`): one additive glass voice with slightly stretched partials, a detuned
  twin, and a raised-cosine attack (2 to 4 ms, no noise burst on the blips). Every pitch is inside D natural minor. `ping` moved from 1250 Hz (not in the key) to D6.
  Sonar echoes get darker each time and bounce left and right. Long tonal tails end on a 100 to 150 ms fade instead of being cut.
- **Whooshes and risers**: 36-band band-pass sweep, 8 ms fade-in, tapered end, hiss rolled off at the top. Risers glide D3 to D6 with a sub D1 to D2, so they land on the key note,
  and finish with a smooth dip right before the hit.
- **Stereo**: hits, whooshes, risers, swells, `seam`, `shimmer`, `gauge_sweep`, `rise_up` and `sink_down` are widened. The side signal is high-passed at 220 Hz, so the bass stays in the
  middle. Ticks, clicks, pops, coins, chips and blips stay mono and dry.
- **Level**: every file is normalised to -1 dBFS peak and ends on a short fade, with a zero-phase 15 Hz high-pass to remove DC.

## What keeps the mix balanced
The cue gains in `cues.ts` were set against the old files' loudness. A cleaner transient with a normalised peak is quieter than a squashed one, so
`make_sfx.py` stores each file's old RMS in `LOCKED` and applies only as much soft clipping as it takes to land within 2 dB of it (noise-based sounds can take a harder clip, it just makes noise denser).
Result: the typical difference from the old library is about 1 dB RMS. Nothing in `config.ts` changed.

## Locked, on purpose
`LOCKED` in `make_sfx.py` pins each file's length, impact point and RMS. The manifest is written from the real output, and the script stops if it ever disagrees
with `LOCKED`, so a better-sounding file can never move a cue. If a cue needs a different length or impact point, change `LOCKED` and `cues.ts` together.

## Previews
`npm run previews` dumps the real cue sheet (`scripts/dump-cues.mjs` writes `scripts/cues.json`, 754 cues over 508.5 s, including the new Shot 5.5) and mixes the effects on their own
(`scripts/make_audio_previews.py`). `audio-previews/sfx-only-*.mp3` are rebuilt from the new library. The full mix peaks at -2.0 dBFS with no clipping.
The `music-only-*` files are untouched.

## Checked here, and what was not
- `npm run sfx` is deterministic (two runs, identical files). `npm run typecheck` passes.
- All 53 files: -1.0 dBFS peak, same channel count as before, no DC, tails faded.
- **Not done: nobody has listened to this by ear.** Audition `audio-previews/sfx-only-full.mp3` and tell me which sounds feel thin, harsh or wrong; the knobs are
  `drive`, `wet`, `tail` and the sub pitches in `hit(...)`, and `decay` in `glass(...)`.
- Not rendered against a real voice-over yet (`vo` is still off in `config.ts`).
