# PayRanked video 1: motion craft + restraint pass

Items 3 and 4 of the review. Nothing was rendered here (no network, so no `npm install`), so please run
`npm run dev` and look at **Shot1-ColdOpen** and **RankReveal-Arkansas** first. Typecheck was run against stub typings
only: no logic errors, but run `npm run typecheck` once for real.

## 3. Motion craft

**Custom curves, no single preset** (`src/motion.ts`). Every kind of move has its own curve:

| curve | feel | used for |
|---|---|---|
| `anticipate` | pulls back ~7%, whips, overshoots ~7%, settles | camera fly, needle, cards splitting, next-video card, recap flips |
| `slam` | full-speed strike, ~12-15% overshoot, rings out | rank number, gap number, TIE stamp, state lift, rail lock-in |
| `drop` | gravity fall with one bounce | coins, map pin |
| `snap` | crisp, ~5% overshoot | chips, bars, formula tokens, rise of the states |
| `glide` | long expo tail, no overshoot | panels, rails, fades, anything calm |
| `rise` | for mask reveals | all kinetic type |
| `roll` | brakes hard in the last third | odometer counts |

The overshoot is an exact damped spring (you choose the overshoot % and the number of swings), not a hand-tuned
guess. `bezier(x1,y1,x2,y2)` is there if you want your own handles.

**Follow-through.** Secondary things land a few frames after the main move (`trail()`): chip text and icon trail the
chip box by 4 frames, the rail's row names trail their row, the gauge trails the BEA chip, the "+$X" gain rises after
the dollars have rolled in, coin shadows pulse on every landing, coins squash for 2 frames when they land, the odometer
wheels overshoot and ring out after a number lands, card text follows the card.

**Motion blur on every fast move.** `MotionBlur` measures the real speed of an element (position this frame minus
position last frame) and blurs along its direction of travel with a 180 degree shutter. Under ~1px of travel it draws
nothing, so slow moves stay sharp. The 3D camera is measured the same way (pan, view offset and zoom), so the map blurs
only while the camera is actually flying. Used on: chips, cards, formula tokens, rows, bars, coins, the next-video
card, recap flips, the BEA group, the camera.

**Odometer** (`Odometer.tsx`, `Count.tsx`). Every number is now a set of wheels. Digits only turn when the wheel below
them rolls over (a real odometer), fast wheels get a vertical blur, digits fade at the top and bottom edge of their
window, and the whole thing settles with a mechanical wobble. `Count` keeps the same props except `format` is replaced by
`prefix` / `suffix` (e.g. `prefix="+" suffix="%"`). Used for all dollar counts, the gap number, the +27%, the Shot 1
cards and the lit-states counter in Shot 5.

**Mask-reveal type** (`MaskText.tsx`): `MaskLine`, `MaskWords`, `MaskChars`, `MaskRule`. Text rises from behind a clip
line with a small skew that straightens as it lands, and can drop back behind it (`leaveAt`). Used for state names,
formula lines, labels, row names, recap cards, info cards, the closing line. `Letters` now uses it too.

## 4. Restraint

- **Reveal (RankReveal)** now plays one beat at a time: rank slams, then shrinks into a small label above the name.
  Name, then BEA score (name steps back), then dollars + coins (BEA leaves), then fact card (dollars step back, coins
  sink), then the whole panel leaves before the rail takes the stage for the lock-in. Same timings as the brief, so the
  voice-over still lands.
- **Rail** has two states: a slim strip of rank numbers while a state is on stage, expanded for the lock-in. It no
  longer wipes in again at the start of every reveal; it stays on screen between reveals.
- **Shot 1** starts with a single $100,000 that splits in two, instead of two cards from frame 0. Coins arrive with the
  counts, not before. At the gap, everything else steps back so the amber number is alone. The chips are neutral except
  the last.
- **One accent per frame.** Mint is the only accent in the reveals (TIE stamp, pin and $100,000 reference ring are no
  longer amber/red). Red and mint only appear together where they are the data (cheap vs costly). Amber is for the gap
  and the no-wage-tax beat only. Shot 5 rows are red only, with California as the focal row; the bars step back when
  the +27% lands; the nine "NO WAGE TAX" pills are now plain state names.
- **Shot 3** chips are neutral with a mint icon each. **Shot 6** recap cards and the NEXT VIDEO tag are neutral.
- Life while holding is subtle: slow drift, glass breathing, needle tremble. No new objects.

## Fixed along the way
- The BEA mini gauge was cropped to its top-left corner (a 150x90 window on a 300x230 SVG). It now shows the dial.

## Tuning
- Overshoot / swings: the numbers in `hit()` and `soft()` at the top of `src/motion.ts`.
- Blur strength: `shutter` (0.5 = film) and `cap` props on `MotionBlur`.
- Rail fold / unfold times: `railOpenAt(frame, foldAt, unfoldAt)` call in `RankReveal.tsx`.
- All reveal beat times: the `T` object at the top of `RankReveal.tsx`.

## Not done yet (items 5 and 6)
Sound design is now done (see CHANGES-SOUND.md). The process change (VO cut to the beat) is still to do.
