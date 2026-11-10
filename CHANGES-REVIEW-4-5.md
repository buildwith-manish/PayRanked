# Review points 4 and 5

## 4. Every reveal looked the same
`#8 North Dakota` now uses a **versus layout**. After the dollar count lands, the coin stack and fact card are replaced by
two bars on one scale (from $0), North Dakota against California, with a white line at $100,000. Both numbers come from
the BEA index already in `states.json`, so it adds no new claim to check. Sound follows the picture (no coin landings,
two bar whooshes and a closing hit; see `revealCues`).

- `VERSUS_RANK` in `timeline.ts` picks the reveal; change it to move the variation. Ties are never versus.
- `RankReveal` takes a `versus` prop; `versusAt(T)` is the frame the rows start, shared with the cue sheet.

## 5. Fact cards are dense on the fast reveals
- Fast reveals (#10 to #6) no longer show the "Source:" line under the fact. The full reveals (#5 to #1) keep it.
- `FAST_FACT_MAX_WORDS = 12` in `timeline.ts`: a fast reveal whose fact is longer logs a warning when the timeline loads.

## Needs you
- **The fact text is not in this repo.** `src/data/states.json` has only `name` and `rpp`; no state has a `fact` or `factSource`,
  so no fact card renders from this branch. If the facts live in your local copy, shorten any over 12 words
  (the warning lists them).
- **Not rendered or typechecked end to end.** `node_modules` was not installed where this was written. Run `npm run typecheck`,
  then scrub `RankReveal-NorthDakota` in `npm run dev` (bar lengths, the label under the bars, clearance from the rail).
- Voice-over and music were not touched; #8 keeps its 15 s length.
