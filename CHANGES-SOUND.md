# PayRanked video 1: sound design

Item 4 of the review. Item 5 (cut the VO to the beat) is next.

## First run
```
npm install
npm run vo-envelope      # once vo.wav is in public/: measures the voice so music and effects can duck against it
npm run dev              # every composition now plays with sound. Try Shot1-ColdOpen and RankReveal-Arkansas first
```
You still supply `intro.mp4`, `vo.wav` and `music.mp3` (see `public/README.txt`). While one is missing, set `vo` or
`music` to `false` in `src/audio/config.ts`. Everything else is in the project already.

Listen first: `audio-previews/` has the effects on their own (no voice, no music), cut from the real cue sheet.
`sfx-only-full.mp3` is the whole 9 minutes. The others are Shot 1, the #10 reveal and the outro.

## What was built

**1. A layered sound library (`scripts/make_sfx.py` -> `public/sfx/`, 53 files).** Synthesised from scratch, so there is
nothing to license. Built in layers the way a designer would:
- *Hits* (`hit_big`, `hit_med`, `hit_small`, `stamp`, `lock`): a sub thump that drops in pitch, a body, a filtered-noise
  crack for the edge, and a short room tail. Big strikes are heavy and long, small ones are tight.
- *Coin foley* (`coin_0..3`): inharmonic metal partials (a coin is not a clean tone), a contact tick, a dull tap
  underneath and a small bounce. Four pitches, so a pour never repeats.
- *Whooshes sized to the move*: `whoosh_xs / s / m / l / xl` (shorter and brighter for fast moves, longer and lower
  with a rumble for camera moves) and `out_xs / s / m` that fall in pitch for things leaving. Each is panned across the move.
- *Risers* (`riser`, `riser_short`, `reverse_swell`) that end on the hit they build to, with a tiny suck-out just before it.
- *Mechanical ticks* (3 variants) for the odometers, a *pentatonic blip ladder* (9 notes) for anything that lights
  up in sequence, glass chip taps, bells, sonar pings, a glitch for the interrupt, a mouse click, a pop.

**2. Every sound lands on its beat (`src/audio/cues.ts`).** Frames are computed from the same constants and curves as the
visuals (the `T` objects, the odometer's `roll` curve, the coin stagger and fall time), not typed in. The shots now
`export` those constants for this. `manifest.json` records where each file's main impact is, and `Sfx.tsx` starts the
file early by that amount: whooshes start before the move, risers end on the hit. Strikes (`slam` curve) are placed
where the visual first reaches its target, 3 to 4 frames in, not on the first frame of the move.
- Odometer ticks follow the number's own speed: dense while the wheels spin, spreading out as they brake.
- One clink per coin, on the frame that coin lands.
- Rank reveals: slam -> whoosh -> state lift -> pin -> name -> BEA chip -> dollars + coins -> fact card -> panel
  out -> lock. The lock plays a rising note per rank (#10 lowest, #1 highest), and #1 gets the full stack.
- Tokens in the formula and the nine rail rows each play a rising rung; the nine no-wage-tax states light up as a run of notes.
- The gap slam, the +27% and the interrupt each get a riser or reverse swell into a hero hit.
- Every sound is its own named `Sequence` (`sfx hit_big`), so the cue sheet shows on the Studio timeline.

**3. Sidechain ducking against the voice-over (`scripts/vo_envelope.py`, `src/audio/duck.ts`).** The script measures
`vo.wav` per frame, with a speech gate that adapts to the recording, a hold so the gaps between words do not make the
music pump, a 3-frame look-ahead (the music is already down when the first word starts), fast attack and slow release.
- Music drops about 10 dB while the voice speaks (`musicDuck`). Effects drop about 3 dB (`sfxDuck`).
- Hero cues (the big strikes) are never ducked, and they pull the music down just before and after they land, so
  impacts are not buried in the bed.
- The music bed has its own shape: fades in under the cold open, steps out for the 2.6 s intro (which carries its own
  sound), comes back lower under the method, lifts for the countdown, fades over the end screen.

## Tuning (all in `src/audio/config.ts`)
`sfxLevel`, `musicLevel`, `voLevel`, `musicDuck`, `sfxDuck`, `dipDepth`. Per-cue loudness is the third number in each
`cue(...)` line in `cues.ts`. Per-section music level is `SECTION_Y` in `duck.ts`. To change a sound itself, edit
`make_sfx.py` and run `npm run sfx`.

## Checked here, and what was not
- `npm run typecheck` passes.
- The whole cue sheet (about 750 cues) was mixed offline: the effects bus peaks at -1.4 dBFS with no clipping.
- A real Remotion audio render of the outro shot (with a stand-in voice and music) matched that offline mix sample for
  sample at the key moments (offset 0 ms, within half a frame at the click). The click, bell ring and end-screen hit land
  where the cue sheet says.
- The ducking script was run on a synthetic voice (look-ahead, hold and release behave as described). It has not seen
  your real voice-over yet. If it pumps, change `HOLD` or the `22` dB gate in `vo_envelope.py`.
- **Not done:** nobody has listened to this by ear, and the other shots (the 3D ones) were not rendered. Treat the
  library as a strong first pass: audition `audio-previews/`, then tell me which sounds feel wrong (too thin, too long,
  wrong pitch) and I will change the synthesis. If the full render clips, lower `sfxLevel`.
- `music.mp3` is not looped, so it has to cover the whole video.
