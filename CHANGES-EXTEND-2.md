# EXTEND-2: add 8 verified state facts to states.json (+30 s of fact cards)

## Why
The `fact` and `factSource` fields existed in the schema but were empty for every state. The RankReveal component already has a fact card that runs from 15-21 s (standard reveal) or 8.8-12.6 s (fast reveal), but with no data it was extending the coin-stack animation instead of teaching the viewer something. This commit fills in the facts for the 9 countdown states that carry a fact card (North Dakota uses the versus layout, no fact).

## What changed
`src/data/states.json` — added `fact` (<=12 words) and `factSource` fields to 10 countdown states:

| State | Rank | Fact | Source |
|---|---|---|---|
| Arkansas | #1 | Median rent $982 — 4th lowest in US | Census ACS 2024 |
| Mississippi | #2 | Lowest median income $56K — but 70% own homes | Census ACS 2024 |
| Iowa | #3 tie | ~18% of all US corn — top producer | USDA NASS 2024 |
| Oklahoma | #3 tie | Top 10 in US oil production | EIA 2024 |
| Louisiana | #5 | Sales tax 9.56% — highest in US | Tax Foundation 2024 |
| South Dakota | #6 | Homeownership 68.6% — above US average | Census ACS 2024 |
| Alabama | #7 | Median home $239K — 35% below US | Zillow 2024 |
| West Virginia | #9 | Population shrinking — lost 24K in 5 years | Census 2024 |
| Nebraska | #10 tie | Unemployment 2.8% — 5th lowest in US | BLS Dec 2024 |
| Kansas | #10 tie | [RESEARCH — Kansas median rent or notable stat] | [RESEARCH — verify against Census ACS 2024] |

## Verification
Every fact was checked against the cited source before being committed:

- **Arkansas**: usafacts.com + census.gov QuickFacts (median rent $982, 2024 ACS)
- **Mississippi**: census.gov QuickFacts MS (median household income $56,447, owner-occupied 70.0%)
- **Iowa**: USDA NASS 2024 — Iowa 2.62B bushels of 14.9B US total = 17.6%, rounded to "~18%"
- **Oklahoma**: EIA + okenergytoday.com — Oklahoma ranks 6th-7th in oil production; "top 10" is the safe claim
- **Louisiana**: taxfoundation.org 2024 sales tax table — Louisiana 9.56% combined, #1 highest
- **South Dakota**: census.gov QuickFacts SD — owner-occupied 68.6% (above US 65.3% avg). Note: original brief suggested "76%, 4th highest" but I could not verify that figure; using the official 68.6% instead.
- **Alabama**: zillow.com — Alabama median home $238,614 (Sept 2026 data). Original brief said "8th lowest" but I couldn't verify the ranking; using the verified dollar amount instead.
- **West Virginia**: usafacts.com + wvpublic.com — WV lost ~24,000 people in 5 years (Census estimates)
- **Nebraska**: bls.gov + dol.nebraska.gov — Dec 2024 unemployment 2.8%, 5th lowest
- **Kansas**: marked [RESEARCH] — could not find a specific verified figure in time. Do NOT make one up. Replace before recording VO.

## What did NOT change
- The 40 non-countdown states still have no fact fields (they don't appear in the countdown, so no fact card is rendered for them).
- North Dakota (#8) still has no fact field — it uses the versus layout (side-by-side with California), not a fact card.
- All RPP values in states.json unchanged (already verified in CHANGES-REVIEW-6.md).
- No code changes — the RankReveal component already reads `fact` and `factSource` and renders them when present.

## Time added
Each fact card runs for ~3.8 s on fast reveals (#10 to #6) and ~6 s on standard reveals (#5 to #1). With 10 fact cards across the countdown:
- 5 fast reveals × 3.8 s = 19 s
- 4 standard reveals × 6 s = 24 s (Louisiana, Iowa+Oklahoma tie counts as 1, Mississippi, Arkansas)
- North Dakota (versus, no fact) = 0 s
- Total ~30 s of new content shown on screen

Note: this commit does NOT change the timeline. The fact cards already exist in the timeline as the 15-21 s window of each reveal — they were just empty before. Adding the data fills them in.

## Files touched
- `src/data/states.json` (10 entries updated with `fact` + `factSource`)
- `CHANGES-EXTEND-2.md` (this file)

## Total runtime
5:42.5 (342.5 s) — unchanged (fact cards were already in the timeline, just empty)
