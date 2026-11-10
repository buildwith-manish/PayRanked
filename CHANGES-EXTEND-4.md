# EXTEND-4: new Shot 5.5 — Practical Takeaways (+110 s)

## Why
The original 5:02 cut ended on the cliffhanger "So which state actually wins?" without answering it. The 8:30 target needs a section that turns the abstract ranking into something the viewer can use. Shot 5.5 answers the cliffhanger for three viewer profiles (remote worker, retiree, early career), shows the formula so the viewer can plug in their own salary, then teases the next video (cities).

## What changed
- `src/shots/Shot55.tsx` (NEW, 240 lines) — the new section. Five beats:
  - 0-5 s: Hook slam — "So who actually wins?" (big text + hero hit + flash)
  - 5-30 s: Profile 1 — REMOTE WORKER. Card with 3D rotateY flip: "Texas. Florida. Washington." Body: "No wage tax helps — but check total cost, not just the headline. Property tax and insurance can eat the savings."
  - 30-55 s: Profile 2 — RETIREE. Card: "Cheapest states win." Body: "Arkansas, Mississippi, Oklahoma stretch a fixed income furthest. But healthcare access matters more than price."
  - 55-80 s: Profile 3 — EARLY CAREER. Card: "Don't chase cheap." Body: "Expensive states often pay enough to offset the cost. Chase income growth first, cost of living second."
  - 80-100 s: The formula — "YOUR TURN: $100,000 ÷ (RPP ÷ 100) = your real buying power." Count-up on the $100,000, each operator fades in sequence. Footnote: "Plug in your salary and your state's BEA score. That's what your money actually buys."
  - 100-110 s: Tease — "Cities next. Where does $50K actually go?" Cross-fade to Shot 6.

- `src/timeline.ts` — added `shot55: 110` to `SHOT_SECONDS`, added `shot55` to `START` calculation. Shot 6 now starts after Shot 5.5.

- `src/Root.tsx` — imported Shot55, added a `<Sequence>` for it between Shot 5 and Shot 6 in Video1, added `GradedShot55` for the standalone composition, added `Shot55-Practical` composition ID.

- `src/audio/cues.ts` — added `shot55Cues()` function with: hero hit on the hook slam, whooshes + chips for each profile card entrance, hero hit + riser + 5 ticks for the formula reveal, riser + bell + shimmer for the tease. Added `shot55: shot55Cues()` to CUES. Added Shot 55 to HERO_BEATS so the music dips around its hero hits.

- `scripts/timing.json` — added `shot55` section with `start: 375.5, dur: 110`. Updated `shot6.start` from 375.5 to 485.5. Updated `total` from 398.5 to 508.5. Added the 6 Shot 55 beats (hook, profile1-3, formula, tease).

## Why 110 s, not 80 s
The original spec called for 80 s (20 s per profile + 10 s formula + 5 s tease). With the facts from EXTEND-2 filling already-scheduled fact-card time (no timeline change), the running total after EXTEND-1+2+3 was 6:38.5 (398.5 s). Adding 80 s for Shot 5.5 would have landed at 7:58.5 (478.5 s) — just under the 8:00 mid-roll threshold and 31.5 s short of the 8:30 target.

Extending Shot 5.5 to 110 s gives each profile 25 s of read time (the body text needs ~22 s at a comfortable reading pace) and the formula 20 s (the count-up + footnote need ~18 s). This brings the total to 8:28.5 — right at the 8:30 target, well under the 8:45 ceiling.

## Visual style
- Profile cards: same Glass panels as Shot 5's InfoCards, with 3D rotateY flip entrance (80deg → 0deg over 28 frames) and a MotionBlur on the X-axis. Tint color matches the profile (amber/mint/red).
- Formula: same count-up pattern as Shot 3's formula reveal — `<Count prefix="$">` for the $100,000, operators fade in sequence with a 6-frame stagger.
- Tease: same MaskWords pattern as the cold-open hook.
- Two Flash elements: one on the hook slam (peak 0.45), one on the formula reveal (peak 0.35).

## Files touched
- `src/shots/Shot55.tsx` (NEW, 240 lines)
- `src/timeline.ts` (added `shot55: 110` to SHOT_SECONDS, added `shot55` to START)
- `src/Root.tsx` (added Shot55 import, Sequence, GradedShot55, Shot55-Practical composition)
- `src/audio/cues.ts` (added shot55Cues function, CUES.shot55, HERO_BEATS entry)
- `scripts/timing.json` (added shot55 section, updated shot6.start +110, total +110)
- `CHANGES-EXTEND-4.md`

## Typecheck
Passes (verified with `npx tsc --noEmit`).

## Total runtime
6:38.5 (398.5 s) -> 8:28.5 (508.5 s) — hits the 8:30 target, unlocks mid-roll ads.
