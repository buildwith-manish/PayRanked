# Review point 7: smaller overlaps

## Texas said twice
The "Not on this list" break (after #7) already shows Texas (#26) and Florida (#40) and says "No wage tax doesn't fix the prices."
Then card 2 of the reality check showed Texas again ("... about $X, and no state wage tax").

Card 2 now makes a different point, computed from the data: **"Only 1 of 9 no-wage-tax states is in the top 10"**, with
"South Dakota, #6" under it. It follows the amber light-up of the nine states, so it pays that off instead of repeating the break.
`Shot5.tsx` builds it from `NO_WAGE_TAX` and each state's rank, so it stays right if the data changes.

## Outro: 7 s end screen
The outro was 20 s with the end screen starting at 13 s, so the end screen was 7 s and came straight after the subscribe click (11 s).
`SHOT_SECONDS.shot6` is now 23, so the end screen is **10 s**. Nothing before it moved: the recap cards, next-video card,
cursor, click (11 s) and end-screen start (13 s) are on the same frames, so a voice-over cut to the old beats still lines up. The video is 3 s longer (5:02.5).

## Needs you
- **Re-run the music**: `npm run music`. The bed is built from `scripts/timing.json`, and the outro now has more bars to fill (the end screen rings out).
  I edited `timing.json` by hand (`total` 302.5, `shot6.dur` 23) because the exporter needs `esbuild`, which was not installed here; `npm run timing` will confirm it. `review/VO-CUES.md` was regenerated.
- **Voice-over**: the outro section is 3 s longer; if the ask ("subscribe") is spoken, it can take the extra room at the end.
- **Not rendered or typechecked end to end** (no `node_modules`). Scrub `Shot5` at about 35 to 39 s (card 2 on one line, two lines fit the 190 px card) and the last 10 s of `Shot6-Outro`.
