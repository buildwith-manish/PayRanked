# Video 2 Shorts plan

**Goal: every Short exists to send viewers to the long video, not to grow Shorts.** We do not chase Shorts views for their own sake. A Short is good if people click through and watch the full video.

Status: plan only. The Shorts are built after the long video is uploaded. Nothing here changes the long video's script.

## Rules for every Short
1. **Open loop.** Each Short ends on a question that only the full video answers. Never give away the twist (Washington winning after prices) inside a Short.
2. **Same voice clips as the long video.** No re-recording. Use only clips whose words stand alone (no "Next:", no "remember" without context).
3. **Hook in the first 2 seconds:** a big on-screen number or city name, in the brand look (navy to green gradient, mint accent, Clash Display and Satoshi).
4. **Under about 50 seconds.** Burned-in captions. 9:16 vertical.
5. **Last 2 to 3 seconds: a clear end card:** "Full ranking: watch the full video" with the channel mark. Spoken version below.
6. **Every number on screen comes from `src/data/metros.json`,** same as the long video.
7. Same facts and wording as the long video: say "metro areas, not city limits" where space allows, and never claim an order between Atlanta/Chicago or Dallas/Phoenix.

## The 7 Shorts
| # | Short | Type | Clips (from `scripts/lines.csv`) | Length | Open question that sends them to the long video |
|---|---|---|---|---|---|
| 1 | The gap | Hook | s01_cold_open_a, s01_cold_open_b, s01_cold_open_c, s01_cold_open_d | ~32 s | "The winner stops winning once I add one more number." Who wins, and what is the number? |
| 2 | Miami: last, twice | Curiosity | r10_miami_a, r10_miami_b, s04_twist_e | ~40 s | Miami is last in both rankings. So who is first, and who is first in the second one? |
| 3 | Rent bites the paycheck | Curiosity | s03_break_a, s03_break_b | ~26 s | Which city takes the smallest bite? (Only in the full video.) |
| 4 | Washington's wage | Open loop | r07_dc_a, r07_dc_b, r07_dc_d | ~21 s | "Remember that number." Why does $68,430 matter? Stop before the twist reveals it. |
| 5 | Houston #1 ... for now | Cliffhanger | r01_hou_a, r01_hou_b, r01_hou_c, r01_hou_d, r01_hou_e, r01_hou_f | ~45 s | "What happens when I use what people actually earn?" |
| 6 | The formula | Value, then tease | s02_method_a, s02_method_b, s05_takeaway_a | ~43 s | You can work out your own city. The full video ranks all ten. |
| 7 | $50,000 is $50,000 | Open loop | r02_atl_a, r02_atl_b, r02_atl_c, r02_atl_d, r02_atl_e | ~24 s | "Number one beats it by $700." Who is number one? |

Lengths are estimates (145 words per minute, plus 0.4 s per clip). The real length comes from the recorded clips.

## Optional short-only clips (not in the script yet)
Recording these once, together with the main script, avoids a second session:
- `sh_cta`: "The full ranking of all ten is on my channel. Link in the description."
- `sh_open_rent`: a one-line hook for Short 3, since "Forget prices for a moment" is a weak opener.

These are proposed only. They are not in `build_script.py` until approved, and then they would be generated with the same data checks as the other lines.

## How to publish (aim: clicks to the long video)
- Publish the Shorts **after** the long video is live, so the link works. Suggest one per day for 7 days.
- In YouTube Studio, set each Short's **related video** to the long video (check the option is available when uploading).
- Pin a comment on each Short with the long video link, and put the link in the description.
- Put the long video first in the description of each Short.

## How to judge success
In YouTube Studio, check the long video's traffic sources for the Shorts feed, and the Shorts' views-to-click-through. If click-through is weak, change the end question, not the data.

## Still to do
- Build 7 vertical compositions on `video-2`. The old `render-short1..7.yml` workflows point at Video 1 compositions on `feat/short-1-vertical` and do not work here.
- Decide on the optional short-only clips before recording.
