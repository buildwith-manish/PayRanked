# Retention fixes, round 3 (review items 1 and 2)

## 1. No spoiler on the 3D map
`Map3D` no longer draws the whole country at full height in every reveal.

- States that already locked into the rail (`railBefore`) stand at full height and colour from frame 0.
- The state being revealed starts as a flat grey slab, then rises and takes its colour on its own cue
  (`RISE_AT` / `RISE_DUR`), timed with the camera whip-in and the pin drop.
- Every other state is a flat grey slab until its turn, so the tallest, greenest state (Arkansas) is no longer on screen
  from #10 onward.
- The map now fills in as the countdown goes, instead of rebuilding the whole country at the start of each reveal.

## 2. #1 is the top of a near-tie, not an outright winner
Arkansas (86.9) and Mississippi (87.0) are about $130 apart on $115K, inside the margin of the underlying data.

- `data/index.ts`: `nearTieOf()` / `NEAR_TIE_RPP` (0.5 index points) find a runner-up that close.
- `RankReveal`: the #1 reveal shows a "TOP TIER" stamp (same slot and animation as the TIE stamp) and, after the dollars
  land, "Just ~$130 ahead of #2 Mississippi" with "Ranked by index. A gap this small is within the data's margin."
  The number comes from the unrounded data, so it follows the data if it changes.
- `timeline.ts`: #1 is a normal 25 s reveal (was 35 s). The countdown is 10 s shorter and Shot 5 and 6 start 10 s earlier.
- `audio/cues.ts`: the stamp cue also plays on the near-tie #1, plus a swish for the margin line.

Not done here: the voice-over and the 9:02 music bed still have to be re-timed to the new countdown length (review item 3).

## 3. Audio re-timed to the current cut
The music bed (`public/music.mp3`) was 9:02 and arranged against a much longer cut (30 s cold open, 130 s reality check,
nine reveals with no breaks). The video is now 4:59.5, so every section, the interrupt drop-out and the countdown breaks
were landing in the wrong place.

- `scripts/export-timing.mjs` (+ `scripts/timing-entry.ts`) bundles the video's own timeline with esbuild and writes
  `scripts/timing.json`: shot starts, every reveal and break, and the beats inside each shot.
- `scripts/make_music.py` no longer types any timing in. Every section, reveal and break comes from `timing.json`, so
  it follows the cut. Both countdown breaks now have their own stripped-back sound (the "prices" turn has no kick), and
  the Shot 5 interrupt gets its own grid starting exactly on the drop-out. Re-arranged for the current cut:
  cold open, method, countdown (15 s reveals are 6 bars), reality check, outro.
- `public/music.mp3` regenerated: 5:02 (video plus a 3 s tail), 4.8 MB (was 8.7 MB). Measured: silent gap in the intro,
  breaks at 1:38 and 2:55.5, the interrupt drop-out at 4:19.5.
- `npm run music` re-exports the timing first. Run it after any change to a shot length or a reveal length.
- **Voice-over:** `public/vo.wav` is still not in the repo, and `vo: true` made every render fail on the missing file.
  `AUDIO.vo` is now `false` with a note. `npm run vo-cues` writes `review/VO-CUES.md`, the cue sheet to record against
  (section windows and each reveal's name / score / dollars / lock times). After recording: add `public/vo.wav`, run
  `npm run vo-envelope`, set `vo: true`.
- The files in `audio-previews/` were made from the old track and are stale.
