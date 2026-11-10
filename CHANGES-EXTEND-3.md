# EXTEND-3: expand reality check Shot 5 from 44 s to 100 s (+56 s)

## Why
Shot 5 (Reality Check) was cut from 130 s to 44 s in earlier retention passes — too aggressively. The 8:30 target needs the section to deliver on the "what most videos leave out" promise from the cold open. With only 44 s and 3 cards, the section made its point but didn't earn it. Restoring to 100 s lets the section deliver 4 more cards that each make a different point about what the index leaves out.

## What changed
`src/shots/Shot5.tsx`:
- `T.card4` at 43 s — Housing comparison: San Francisco median rent $3,500/mo vs rural Arkansas $800/mo. Count-up on both numbers. The point: state averages hide a 4× city-vs-rural spread.
- `T.card5` at 50 s — Property tax angle: Texas "no wage tax" headline vs property tax 1.7% (6th highest in US). The point: no wage tax ≠ low total tax.
- `T.card6` at 58 s — Healthcare access: "Cheapest states have ~30% fewer specialists." Source line: HRSA Area Health Resources File, 2024. The point: cheap states are cheap partly because they offer fewer services.
- `T.card7` at 68 s — The honest catch: "Cheap ≠ better. It's just cheaper." Big text in amber (color shift from emerald-to-amber is the section's final image). Holds until end of section.
- `T.card3` (the cliffhanger tease) is replaced with a short bridge card: "Same salary. +27% gap." The original cliffhanger ("So which state actually wins...") is moved into Shot 5.5 (Practical Takeaways), which opens on that exact question.

`src/timeline.ts`:
- `SHOT_SECONDS.shot5` from 44 to 100.

`scripts/timing.json`:
- `total` +56 (342.5 → 398.5)
- `shot5.dur` 44 → 100
- `shot6.start` +56 (319.5 → 375.5)
- Added `shot5.card4` (43), `card5` (50), `card6` (58), `card7` (68)

## Data sources
- San Francisco rent: Zillow Observed Rent Index (ZORI), September 2024 (~$3,500/mo)
- Rural Arkansas rent: Census ACS 2024 non-metro median rent (~$800/mo)
- Texas property tax: Tax Foundation 2024 state and local property tax rankings (1.7% effective rate, 6th highest)
- Healthcare specialists: HRSA Area Health Resources File (AHRF) 2024 — cheapest states have ~30% fewer specialists per capita than the US average

## What did NOT change
- The first 44 s of Shot 5 (map wave, expensive-state rows, bars + bracket + +27%, tax-state counter, Washington ring, card1, card2) — all unchanged.
- The map and bar animations continue to play during the new cards (the new cards are InfoCards layered on top, same as card1-3).
- Shot 4 countdown, Shot 6 outro — untouched.
- The fact cards from EXTEND-2 still render inside the countdown (Shot 4).

## Files touched
- `src/shots/Shot5.tsx` (+74 lines: 4 new InfoCard blocks + comments)
- `src/timeline.ts` (1 line: `shot5: 100`)
- `scripts/timing.json` (shot5.dur 100, shot6.start +56, total +56, added card4-7 beats)
- `CHANGES-EXTEND-3.md`

## Typecheck
Passes (verified with `npx tsc --noEmit`).

## Total runtime
5:42.5 (342.5 s) -> 6:38.5 (398.5 s)
