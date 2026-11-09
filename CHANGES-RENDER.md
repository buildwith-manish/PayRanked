# Render settings: 4K, PNG frames, 60 fps

## What changed
| Setting | Before | Now | Where |
|---|---|---|---|
| Output resolution | 1920x1080 | **3840x2160** (Remotion `setScale(2)`, no CLI flag needed) | `remotion.config.ts` |
| Frame image format | JPEG | **PNG** | `remotion.config.ts` |
| Frame rate | 30 | **60** | `src/clock.ts` (`FPS`) |

The compositions stay 1920x1080 on purpose: the whole layout is written in 1080p pixels, and `setScale(2)` renders it at 2x
device scale, so text, SVG, filters and the three.js scenes are drawn natively at 4K, not upscaled. `npm run dev` still shows
the 1080p design space. A `--scale` flag on the command line overrides the config (`render:half` still gives 960x540).

## How 60 fps works without retiming anything (`src/clock.ts`)
Every beat, duration and cue in the project is written in 30 fps frames ("design frames"). Those are unchanged.
- Animation code now calls `useDesignFrame()` (render frame / 2), so every curve is sampled twice as often: same speed,
  same beats, twice the smoothness.
- Anything Remotion counts in render frames (Composition and Sequence lengths, audio `startFrom`) goes through `toReal()`.
- Audio cue placement, the voice-over duck and the music curve are converted in `src/audio/Sfx.tsx`.
  `vo-envelope.json` stays at 30 fps, so `scripts/vo_envelope.py` is unchanged.
- Motion blur: callers measure movement per 30 fps frame; the blur length is divided by 2 so it matches a 180 degree
  shutter at 60 fps (`blurLength` in `src/motion.ts`). Blur is therefore about half as long as before, which is correct for 60 fps.
- Stills and review scripts take design-frame numbers and double them. `npm run still` uses render frame 900 (= design frame 450).
- Studio and `--frame` / `--frames` flags on the command line are in **render frames** (60 per second).

## Cost
Roughly 2x the frames, 4x the pixels, PNG instead of JPEG: expect a full render to take many times longer than before.
Try `npx remotion render src/index.ts Video1 out/test.mp4 --frames=0-300` first.
`vo.wav` and `public/intro.mp4` still need to be added before a full render (see `public/README.txt`).

## Not verified
Typecheck passes and the spring / duration maths was checked, but no frames were rendered here (headless Chrome could
not be downloaded), so look at a short render before committing to a full one.
