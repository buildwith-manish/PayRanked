#!/usr/bin/env bash
# Frame math for the "render the body once, render each end card on its own, join them" workflow.
#
#   short-frames.sh total <N>               prints the frame count of ShortN-Vertical, read from Remotion itself
#   short-frames.sh body  <TOTAL> <CHUNKS> <K>   prints "START END" of body chunk K (1-based); the body is everything before the end card
#   short-frames.sh end   <TOTAL>           prints "START END" of the end card (the last END_FRAMES frames)
#
# END_FRAMES is the end card length in real frames: SHORT_END_SECONDS (4 s) x 60 fps = 240. If the card length ever changes,
# change it here and nowhere else; the workflow's seam check fails if the three versions differ before this point.
set -euo pipefail
END_FRAMES="${END_FRAMES:-240}"

case "${1:-}" in
  total)
    # REMOTION_FLAGS lets a machine without the downloadable browser pass --browser-executable etc.
    # shellcheck disable=SC2086
    npx remotion compositions src/index.ts ${REMOTION_FLAGS:-} 2>/dev/null \
      | awk -v id="Short${2}-Vertical" '$1 == id {print $4; found = 1} END {exit found ? 0 : 1}' \
      || { echo "composition Short${2}-Vertical not found" >&2; exit 1; }
    ;;
  body)
    total=$2; chunks=$3; k=$4
    body=$(( total - END_FRAMES ))
    per=$(( (body + chunks - 1) / chunks ))
    start=$(( (k - 1) * per ))
    end=$(( start + per - 1 ))
    if [ "$end" -ge "$body" ]; then end=$(( body - 1 )); fi
    if [ "$start" -gt "$end" ]; then echo "chunk $k is empty" >&2; exit 1; fi
    echo "$start $end"
    ;;
  end)
    total=$2
    echo "$(( total - END_FRAMES )) $(( total - 1 ))"
    ;;
  *)
    echo "usage: $0 total <N> | body <TOTAL> <CHUNKS> <K> | end <TOTAL>" >&2
    exit 2
    ;;
esac
