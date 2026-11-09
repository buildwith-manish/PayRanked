# Video 1: payoff-first cold open

Shot 1 used to open on a calm `$100,000` and a grid, split it in two at 2s, and show the states and results at 6s.
The viewer waited about 6 seconds for the point. It now opens with the point and explains it second.

## New order (Shot 1, 30 s total, unchanged)

| time | what happens |
|---|---|
| 0.1-0.6 s | seam draws down the black frame, states land on it (flash + sting) |
| 1-3.5 s | both numbers roll to $115,100 (Arkansas, mint) and $90,300 (California, red); the states climb and sink with them; coins pour in |
| 2.6-4 s | the claim is written across the top: **$115,100 in Arkansas feels bigger than $90,300 in California** (figures come from the data, not typed in) |
| 6.5-13 s | one quiet line says why: "Same $100,000 salary. Different prices." |
| 14-20 s | gap slam, `≈ $25K` (not moved) |
| 20-30 s | chips (not moved) |

Everything from the gap slam onward is on exactly the same frame as before, so the rest of the video, the shot
boundaries and the music hero beats are unaffected.

## What changed in code
- `src/shots/Shot1.tsx`: removed the lone `$100,000` card and the split; the cards now sit in place and roll `0 -> result`
  in one move (`valueAt`, now exported). Added the headline and the explainer line (both use `MaskWords`, so they follow the
  video's existing text motion). `SPLIT` is gone; `SEAM_START`, `HEAD_START`, `EXPLAIN_START` are new. `SHAPE_START`
  moved 78 -> 18, `COUNT_START` 190 -> 30.
- `src/audio/cues.ts`: the Shot 1 cue sheet derives from the same constants, so the opening cues were rebuilt around the
  new beats (sting on the states, odometer ticks and coin clinks follow the new roll). The coin-landing math now calls
  `valueAt` instead of keeping its own copy of the curve.

## Needs your eyes (not verified here)
- **Not rendered.** This environment could not download the headless browser, so nothing was played back. Typecheck passes
  (`npm run typecheck`). Please open **Shot1-ColdOpen** in `npm run dev` and look at frames 0-150: the headline at 46 px
  across the top (should clear the coin stacks and the states), and the 0-1 s opening sting.
- **The voice-over has to move with it.** `vo.wav` is not in the repo, so I could not check sync. The line that used to
  come at about 6-14 s (the results) now needs to land at about 1-4 s, and the "same salary" explanation at about 6.5 s.
  Re-run `npm run vo-envelope` after replacing the audio so the music ducks against the new voice.
- The accent colours in the headline follow the existing rule (mint = cheap, red = costly, only while the states are shown).
