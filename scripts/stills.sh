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
run Shot1-ColdOpen && still Shot1-ColdOpen 20 70 110 200 260 450 520 700 890
# Shot 3, method: gauge, needle at 100, California, Arkansas, formula, chips, rail
run Shot3-Method && still Shot3-Method 60 150 330 500 700 900 1050 1300 1600
# Shot 4, one state of each kind: single, small state, tie, #1 (frames 0, 30, 90, 240, 450, 720 as in the brief)
for comp in RankReveal-WestVirginia RankReveal-Kansas RankReveal-Iowa RankReveal-Arkansas; do
  run "$comp" && still "$comp" 0 30 90 240 450 720
done
# Shot 5, reality check: wave, rows, bars + slam, interrupt, lights + badges, ring + cards
run Shot5-RealityCheck && still Shot5-RealityCheck 300 900 1990 2560 2700 2900 3500 3700 3880
# Shot 6, outro: cards, 27%, cursor, subscribed, end screen
run Shot6-Outro && still Shot6-Outro 120 500 800 1250 1340 1800 2200
