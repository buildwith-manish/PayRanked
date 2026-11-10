# Review 8: overlap fixes in RankReveal

1. BEA chip/gauge overlapped the dollar count (both at top:410). BEA now exits so it is fully gone when the dollars start (`beaOutAt = T.dollars - 18`, unmounted at `T.dollars`).
   Fast reveals (#10 to #6) only gave BEA 0.4 s (bea 4.2 / dollars 4.6); now bea 3.6 / dollars 5.2.
2. The "+$X" gain line peeked out from behind the fact card. It now fades out just before the card arrives.

# Outro: no next video yet
- Shot6: removed the next-video card, subscribe button, cursor, bell and the end-screen slots. The outro is the three recap cards, then a 1 s fade to black. Length 23 s -> 12 s.
- Shot55: removed the "Cities next. Where does $50K actually go?" tease. Length 110 s -> 100 s (the formula now holds to the end).
- Cues for both removed; scripts/make_music.py updated; music.mp3, scripts/timing.json and review/VO-CUES.md regenerated.
- Video is now 8:07 (was 8:28). Voice-over cue times after the countdown have moved: record against the new VO-CUES.md.
- To bring them back later, revert this commit and fill the next-video slot.
