#!/usr/bin/env bash
# Renders key-frame stills for every shot into out/stills/.
# Usage: npm run stills   (or: bash scripts/stills.sh Shot3-Method)
set -euo pipefail
mkdir -p out/stills

K=2 # the video renders at 60 fps; the frame numbers below are 30 fps design frames (see src/clock.ts)
still() { # still <composition> <design-frame...>
  local comp="$1"; shift
  for fr in "$@"; do
    npx remotion still src/index.ts "$comp" "out/stills/${comp}-f${fr}.png" --frame="$((fr * K))"
  done
}

want="${1:-all}"
run() { [[ "$want" == "all" || "$want" == "$1" ]]; }

# Shot 1, cold open: grid draw, seam, outlines, counts landed, slam, chips
run Shot1-ColdOpen && still Shot1-ColdOpen 20 70 110 160 200 240 330 420
# Shot 3, method: gauge, needle at 100, California, formula, result, rail
run Shot3-Method && still Shot3-Method 60 120 200 300 400 470 520 580
# Shot 4, one state of each kind. #10 to #6 use the 15 s beats (450 frames), #5 to #1 the full ones (750 to 1050).
for comp in RankReveal-WestVirginia RankReveal-Kansas; do
  run "$comp" && still "$comp" 0 24 78 126 198 264 378 432
done
for comp in RankReveal-Iowa RankReveal-Arkansas; do
  run "$comp" && still "$comp" 0 30 90 240 450 720
done
# The two breaks inside the countdown
for comp in Break-notHere Break-prices; do
  run "$comp" && still "$comp" 20 130 220
done
# Shot 5, reality check: wave, rows, bars + slam, interrupt, lights + badges, ring + cards
run Shot5-RealityCheck && still Shot5-RealityCheck 90 200 300 520 760 800 960 1100 1260
# Shot 6, outro: cards, 27%, cursor, subscribed, end screen
run Shot6-Outro && still Shot6-Outro 60 120 200 300 390 450 560
