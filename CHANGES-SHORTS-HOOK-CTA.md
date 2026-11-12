# Shorts 2-7: first-second hook + the same end card as Short 1

## What changed
- **Hook line (Shorts 2, 3, 4, 5, 7)**: one line in the headline area (y 180-400, below the Shorts shelf), in at 0.1 s and out at ~2.6 s,
  on a soft dark band so it reads over the 3D map. It names no state and gives no answer; the slam still pays it off.
  Short 6 gets none: it already opens on "So who actually wins?".
- **End card (Shorts 2-7)**: the same card as Short 1 ("Full ranking + #1 / on my channel"), 3.5 s long, added after each Short.
  Each Short is therefore 3.5 s longer. The music fades out over the first 1.5 s of the card.
- Render workflows: `TOTAL` frame counts updated for the new lengths (Short 1's `TOTAL` was 2640, the composition is 2652 frames: fixed too).
- Preview workflow: extra stills at 0.8 s / 1.5 s (hook) and at the end card.

## Hooks (each checked against src/data/states.json)
| Short | Hook | Backing data |
|---|---|---|
| 2 | Two states tie. Both beat California by $20K. | Kansas $111,027 and Nebraska $110,984 vs California $90,318: about $20.7K |
| 3 | Texas isn't even top 25. | Texas is #26 |
| 4 | Highest sales tax in the US, and still #5. | Louisiana, 10.11% (fact in states.json), rank 5 |
| 5 | Cheap doesn't mean you'd earn $100K there. | Moved up from the "Prices, not pay" break |
| 7 | Try this with your own salary. | The "your turn" formula appears later in the Short |

Wording lives in `SHORT_HOOKS` (`src/shots/ShortOverlays.tsx`); edit one line to change a hook.

## Needs your eyes (not verified here)
- **Not rendered.** The headless browser can't be downloaded in this environment; `npm run typecheck` passes. Run the
  `Preview vertical Shorts (stills)` workflow and look at the 0.8 s / 1.5 s stills (hook clear of the map and the rank slam?) and the last still of each Short.
- Short 3's hook (Texas) is paid off by the "Not on this list" break that follows #7 inside the Short. Confirm that break is inside the 40 s window.
- Short 1 says California feels like $90,300; the data gives $90,318. Short 3's #8 bar was reported as $90,251, which does not match either: check it.
- Shorts 6 and 7 held the same card for 20 s or more in the stills reviewed earlier: worth confirming the cards advance as intended.
- Instagram / Facebook: the end line says "on my channel", so keep the matching pinned comment / link on each platform.
