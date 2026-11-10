# Review point 6: unverified claims and what the ranking leaves out

## Checked
| Claim | Was | Source says | Now |
|---|---|---|---|
| Arkansas median household income | ~$56K | $62,106 (±$831), ACS 1-year 2024 | ~$62K, labelled 2024 |
| California median household income | ~$91K | $100,149 (±$381), ACS 1-year 2024 | ~$100K, labelled 2024 |
| BEA index values for California (110.7) and the 11 countdown states (Arkansas 86.9 up to Kansas and Nebraska 90.1) | in `states.json` | match the 2024 BEA regional price parities | unchanged |

The old income figures were from an older survey year. I used 2024 to match the 2024 prices. The 2025 ACS was released
on Nov 4, 2026 (Arkansas $65,588 ±$976, California $102,159 ±$390; US $84,780): to use it, change `INCOME_2024` in
`Shot5.tsx` to `$66K` / `$102K`, and say 2025 on the line and in the source line. Do not mix 2025 incomes with the 2024 prices without saying so.

The Shot 5 line now carries its year and a source line (Census Bureau, ACS 1-year, 2024).

## What the index does not cover (now said on screen)
The footnote in Shot 3 read "State averages · Before tax · Prices, not pay". "Before tax" described the salary, not the
index, and housing quality was not mentioned. It now reads: **State averages · Prices only: income tax not counted ·
Housing quality varies.**

- The BEA index compares price levels. It does not count state income tax.
- Rents are compared by type, size and age of home (not by quality or neighbourhood), and owner-occupied homes are
  priced from rents.

## Not verified
- The 12 index values I checked (not the other 38 states) came from a site that republishes BEA's table (release dated Feb 19, 2026), not from BEA's own tables. BEA's site was not reachable from here. A spot-check against bea.gov (SARPP, line 1) is worth a minute.
- Other numbers in the video that are computed from the index (for example "about 11% pricier", the dollar values) were not re-derived.
