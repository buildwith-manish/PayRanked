# Precision and wording fixes from the BEA verification

A check of `states.json` against BEA's 2024 data found every index value correct, and raised three presentation issues. This change fixes them. No index value changed.

## What changed

| # | Issue | Fix | Files |
|---|---|---|---|
| 1 | "Just ~$130 ahead of #2 Mississippi" came from the one-decimal index (86.9 vs 87.0). At BEA's unrounded precision the gap is about $21 | The margin line now reads "Just ~$20 ahead of #2 Mississippi". The line below it still says the gap is within the data's margin. VO cue note updated to match | `src/data/index.ts`, `scripts/vo_cues.py`, `review/VO-CUES.md` |
| 2 | Ties (Iowa/Oklahoma, Kansas/Nebraska) exist only at one decimal. At three decimals they separate | Ranking and ties still use the published one-decimal `rpp`, on purpose. The video description now says "tied at BEA's published one-decimal precision" | `video-description.txt` |
| 3 | On-screen dollars shifted by up to $100 when computed from the rounded index | New optional `rppExact` field (BEA's unrounded index, from FRED, updated Feb 20 2026). Dollars use it when present. The countdown formula line shows four decimals so a viewer's calculator matches the dollars shown | `src/data/states.json`, `src/data/index.ts`, `src/components/RankReveal.tsx` |

`rppExact` is filled in for the 18 states whose dollars can appear on screen: the top 10 plus Mississippi, the bottom five, California, Texas and Florida. Each rounds to the one-decimal `rpp` already in the file. Other states keep one-decimal values and never show dollars.

## Displayed dollars that moved

| State | Before | After |
|---|---|---|
| Arkansas | $115,100 | $115,000 |
| Mississippi | $114,900 | $115,000 |
| Oklahoma | $113,900 | $113,800 (tie row shows the lead state, Iowa, so this stays off screen) |
| Washington | $93,500 | $93,400 |

All other displayed dollars are unchanged. The $24.7K California gap, +27.4%, ranks and tie order are unchanged.

## Description and sources

`video-description.txt` holds the YouTube description, with a method note and sources (BEA, FRED, Census ACS). The upload step in `render.yml` uses it unless the `YOUTUBE_DESC` secret is set, in which case the secret wins.

The no-wage-tax list is not cited in the description. It was checked only against secondary sources. Cite the state revenue departments, or Tax Foundation, once those are checked.

Older `CHANGES-*.md` files still mention $115,100 and $130. They are history and were left as written.
