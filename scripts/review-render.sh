#!/bin/bash
# Re-render the style frames and motion tests used in review/ (run on your own machine, from the project root).
#   npm run review
mkdir -p review/new && cd "$(dirname "$0")/.."
# Frame numbers below are 30 fps design frames; the video renders at 60 fps (see src/clock.ts), so they are doubled here.
K=2
still() { npx remotion still src/index.ts "$1" "review/new/$3.png" --frame="$(($2 * K))"; }
clip()  { local a="${2%-*}" b="${2#*-}"; npx remotion render src/index.ts "$1" "review/new/$3.mp4" --frames="$((a * K))-$((b * K))" --crf=18; }
# 1. static style frames
still Shot1-ColdOpen 50 s1_number
still Shot1-ColdOpen 140 s2_states
still RankReveal-Arkansas 150 s3_reveal_lift
still RankReveal-Arkansas 345 s4_reveal_dollars
still Shot3-Method 400 s5_gauge
still Shot5-RealityCheck 1862 s6_slam27
still Shot6-Outro 1720 s7_endscreen
still Shot5-RealityCheck 2700 s8_lights
# 2. motion tests (with sound)
clip Shot1-ColdOpen 40-160 t1_split_states
clip RankReveal-Arkansas 0-100 t2_slam_whip_lift
clip Shot5-RealityCheck 2500-2650 t3_interrupt_lights
