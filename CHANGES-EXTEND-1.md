# EXTEND-1: restore methodology depth (Shot 3: 20 s -> 60 s, +40 s)

## Why
The methodology section was cut from 42 s to 20 s in earlier retention passes (Fix 1 collapsed the three limit chips into a single footnote). That cut the section so short it stopped teaching the viewer what the BEA index actually is, so the cold-open question ("how is $100K worth $25K more in one state?") never gets answered on screen. The 8:30 target needs the section to earn its 60 s.

## What changed
- `src/shots/Shot3.tsx` — `SHOT_SECONDS.shot3` is now 60 (was 20). `T` adds three new beats:
  - `categories` at 20 s — 5-bar breakdown of the BEA RPP category weights (Housing 42%, Other 19%, Food 13%, Transport 9%, Medical 7%, Goods + Rest 10%). Bars spring in left to right with a 6-frame stagger. Footnote: "Housing dominates. That's why cheap states feel cheap."
  - `housing` at 35 s — 3-bar median home value comparison: US median $360K, Arkansas $215K, California $780K. Each bar counts up via `<Count prefix="$" suffix="K">`. Footnote: "Same $100K salary — but a California mortgage eats 4× what an Arkansas one does."
  - `honesty` at 50 s — big exit line: "Prices, not paychecks. Pay gets its own video." Repeats the footnote in long form so the viewer leaves the method with the caveat in two registers.
- `T.rail` moved from 16.5 s to 56.5 s — the leaderboard still opens, just at the end of the new beats instead of immediately after the formula.
- New helper components `CategoriesBreakdown` and `HousingExample` (same motion language: `spring`, `glide`, `ramp`, `snap`, MotionBlur). Pure SVG/divs, no new dependencies.

## Data sources
- BEA RPP category weights: Regional Price Parities by Major Type of Product, 2024 release (Housing ~42%, Other services 19%, Food 13%, Transportation 9%, Medical 7%, Goods + other 10%). Rounded to whole percentages for the bar chart.
- Median home values: Zillow ZHVI typical home value, September 2024 (Q3 close to the BEA 2024 release). US median ~$360K, Arkansas ~$215K, California ~$780K. Rounded to the nearest $5K.
- All three figures are 2024 to match the BEA 2024 RPP release used by the ranking.

## Files touched
- `src/shots/Shot3.tsx` (+131 lines)
- `src/timeline.ts` (1 line: `shot3: 60`)
- `scripts/timing.json` (`total` +40, `shot3.dur` 60, `countdown.start` 38 -> 78, `shot5.start` 235.5 -> 275.5, `shot6.start` 279.5 -> 319.5, added `shot3.categories/housing/honesty` beats)

## What did NOT change
- Shot 1 (cold open, 15 s) — untouched
- Shot 2 (intro, 2.6 s) — untouched
- Shot 4 countdown (197.5 s) — untouched
- Shot 5 (44 s) — untouched (EXTEND-3 will extend this)
- Shot 6 (23 s) — untouched
- The formula, footnote, gauge, leaderboard rail — all kept, just shifted later in the shot

## Total runtime
5:02.5 (302.5 s) -> 5:42.5 (342.5 s)
