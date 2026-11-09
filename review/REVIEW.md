# Style frames and motion tests (steps 1 and 2 of the process)

Rendered from this project with the real Poppins and Inter fonts. `style-frames/before_*` is what the project looked
like; `after_*` is after the fixes below. `motion-tests/` has three short clips with the sound on (music and effects,
no voice-over yet) and a frame sheet next to each (`frames_t*.jpg`, one frame every 8 to 10 frames, left to right).
The clips are half size (960x540) to keep the render short; `npm run review` re-renders everything at full size.

## Fixed
1. **Reveal text on the 3D map (contrast).** The map glowed mint around the highlighted state, so the mint `#1` and the
   mint dollar odometer sat on a mint background and the digits were hard to read. Now: a dark falloff behind the text
   column (fades in with the name, out with the panel) and 30% less mint spill onto neighbouring states.
   `RankReveal.tsx`. See `before_s3/s4` against `after_r3/r4`.
2. **Labels on the amber states.** White type on amber is about 1.5:1; Wyoming and Washington were barely readable.
   Now dark navy on amber, about 11:1. `Shot5.tsx`. See `before_s8` against `after_r8`.
3. **Clipped coin label.** The "$100,000" tag beside the coin stack ran off the right edge of the frame. Now inside it. `CoinStack.tsx`.

## Findings, not changed (your call; the first two depend on the voice-over)
- **Dead air after the interrupt (t3).** From the white flash at 85 s to the first light at 88 s the map is dark and
  nearly still for about 90 frames. If the voice-over carries it, fine. If not, add a slow push-in or a scan line.
- **The flash itself (t3, t1).** The interrupt is one fully cream-white frame, then dark: hard and intentional. The
  split flash in t1 reads as a grey wash rather than a crisp white. Worth a second look at full size.
- **Camera whip on the #1 reveal (t2).** About 10 frames of heavy blur while it dives into Arkansas (frames 48 to 56
  on the sheet), and the huge `#1` sits on top of the whole country for about 30 frames before that. Both read as intentional; if it
  feels slow in the full cut, shorten the hold on the huge `#1`, not the whip.
- **Arkansas looks bigger than California in the split (before_s2).** Each state is fitted to the same box on its own, so the
  taller, thinner California looks smaller. It is a layout choice, not a data error, but it can read as one.
- **Side walls of the extruded states show vertical banding** (jagged coastlines in before_s3/s4). Smoothing the outline
  before extruding would fix it; it is the one thing that still looks like software 3D.
- Sound against picture in t1 looks right: the whoosh peak lands on the stretched frame, the hit on the flash.

## Not verified
Clips were judged from frame sheets, not played back, and not with a voice-over. Motion feel (easing, weight) needs a
look at full speed on your machine.
