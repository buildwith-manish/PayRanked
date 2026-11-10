# Retention pass 2: structure of the cut

Video 1 went from 9:00 to about 5:10. The share of the video that plays after #1 locks in dropped from ~38% to ~21%.
Five problems, five fixes. Everything is driven from `src/timeline.ts`; change a number there and the shots, cue
sheets, music ducking and `Video1`'s length follow.

| # | Problem | Fix | Where |
|---|---|---|---|
| 1 | The hook named the winner (Arkansas $115,100 vs California $90,300) in second 3, so the countdown had no open question | Cold open is 15 s and never names or shows the winner. California is on one side, a "?" on the other, then the gap slams in (about $25K more than California), then "NOT TEXAS / NOT FLORIDA / TOP 10, RANKED". Texas is #26 and Florida #40 in `states.json`, so neither is in the top 10 | `Shot1.tsx`, `Shot1Scene.tsx` |
| 2 | 15 s of empty backdrop: `SHOT3_FRAMES` was cut to 42 s but `START.shot4` stayed at `sec(90)` | Every shot now starts where the one before it ends (`START` is derived in `timeline.ts`). `Video1`'s length is `VIDEO_FRAMES`, not a hard-coded 16200 | `timeline.ts`, `Root.tsx` |
| 3 | 205 s after the climax (reality check 130 s, outro 75 s) | Reality check 130 -> 44 s, outro 75 -> 20 s (end screen 7 s). The "cheap is not a salary" turn moved up into the countdown | `Shot5.tsx`, `Shot6.tsx`, `Break.tsx` |
| 4 | Every reveal ran the same 25 s template | #10 to #6 run 15 s (`T_FAST`: same beats, shorter gaps). #5 stays 25 s, #3 (tie) 30 s, #2 25 s, #1 35 s | `RankReveal.tsx`, `timeline.ts` |
| 5 | Branding before substance; 42 s of method before the first reveal | Method 42 -> 20 s. Its worked example is now California, because the old one walked Arkansas's score and $115,100 across the screen and gave away #1 | `Shot3.tsx` |

## New schedule
| time | what |
|---|---|
| 0:00 | Shot 1 cold open (15 s) |
| 0:15 | Shot 2 intro (2.6 s) |
| 0:18 | Shot 3 method (20 s) |
| 0:38 | #10, #9, #8, #7 (15 s each) |
| 1:38 | Break: "Not on this list" (Texas #26, Florida #40) (7.5 s) |
| 1:46 | #6 (15 s), #5 (25 s), #3 (30 s) |
| 2:56 | Break: "Cheap doesn't mean you'd earn $100K there" (10 s) |
| 3:06 | #2 (25 s), #1 (35 s) |
| 4:06 | Shot 5 reality check (44 s) |
| 4:50 | Shot 6 outro (20 s) |
| 5:10 | end |

Breaks are 3 and 4 bars at 96 BPM so the music grid still lines up. They are the pattern changes: no stretch of the
countdown runs longer than about a minute and a half without a change of picture, and neither names the winner.

## Also fixed
- `Shot5.tsx` did not compile (stray backslashes before template-literal backticks on three lines).
- `cues.ts` referenced `T3.chips`, which no longer existed, so `npm run typecheck` failed.

## Needs you
- **Not rendered.** No headless browser here. `npm run typecheck` passes. Scrub these in `npm run dev`:
  `Shot1-ColdOpen` (the "?" and headline at top, chips at the bottom clear of the gap number), `Break-notHere`,
  `Break-prices`, `RankReveal-Kansas` and `RankReveal-WestVirginia` (the 15 s beats: BEA gauge is on screen about 2.4 s, the fact card about 3.8 s; if the fact is too fast, lengthen `T_FAST.panelOut`).
- **Voice-over has to be re-cut** to this schedule (it is not in the repo). Then `npm run vo-envelope`.
- **`public/music.mp3` is still the 9:02 bed**, composed section by section against the old timings in
  `scripts/make_music.py`. It will play against the wrong sections until that script is updated to the schedule above.
- **Unchecked figure:** the Shot 5 line "Median household income: Arkansas ~$56K, California ~$91K" was already in the
  code; I kept it and did not verify it.
- `npm run stills` frame lists were updated to the new lengths.
