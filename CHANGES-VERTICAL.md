# Vertical Shorts: native 9:16 layouts

## What was wrong

The Shorts were the 16:9 video shrunk into the middle of a 1080x1920 canvas. `Short1Landscape` rendered every scene at
1920x1080 and applied `scale(0.5625)`, so each Short was a 1080x607 strip with empty navy above and below.

## What changed

Every scene now reads the size of the composition it is in (`useLayout()` in `src/layout.ts`) and lays itself out for it.
Timings, data, voice-over, music and sound cues are untouched, and the 1920x1080 video renders exactly as before.

- `RankReveal` (Shorts 2-5): the 3D state sits in the upper part of the frame, and the text stacks underneath it: rank label,
  state name, BEA chip and gauge, dollars and coins, fact card. Camera focus, zoom range, overview pose and view offset are per
  orientation (`GEOM` in `RankReveal.tsx`); the vertical canvas uses a wider vertical FOV (`fovFor`) so one world unit is still one
  pixel at `CAM_D` and fog / shadows keep their tuning.
- `Break`: single column, chips stacked.
- `Shot1` (Short 1 cold open): the left / right split becomes a top / bottom stack ("?" over California), with the headline above,
  the gap and the chips in the middle (`PLACE` in `Shot1.tsx`). `Shot1Scene` takes `vertical` and `cyPx`.
- `Shot3` (Short 1 method opener): welcome line and gauge re-laid out. Only the first 13.5 s are used in Short 1.
- `Shot55` (Shorts 6-7): hook, profile cards and the "your turn" formula (one term per line).
- `Leaderboard` (slim rail on the left edge), `Background`, `Grade` dust, `Watermark` (top right, on for the whole Short) and
  `SourceTag` (top left) are orientation-aware.
- Text stays inside the Shorts safe area: below ~150 px from the top and above ~1540 px (`SHORTS_SAFE`).

## Checks

- `npm run typecheck`
- `npm run camera-check` now also checks the vertical camera pose (frame 0 equals the last frame, so the cut between reveals has no jump).
- The `Preview vertical Shorts (stills)` workflow renders key frames of every Short as PNGs for a quick visual review.
