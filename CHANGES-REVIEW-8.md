# Review 8: overlap fixes in RankReveal

1. BEA chip/gauge overlapped the dollar count (both at top:410). BEA now exits so it is fully gone when the dollars start (`beaOutAt = T.dollars - 18`, unmounted at `T.dollars`).
   Fast reveals (#10 to #6) only gave BEA 0.4 s (bea 4.2 / dollars 4.6); now bea 3.6 / dollars 5.2.
2. The "+$X" gain line peeked out from behind the fact card. It now fades out just before the card arrives.
