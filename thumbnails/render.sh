#!/usr/bin/env bash
# Render the 7 Shorts thumbnails to thumbnails/exports/shortN-thumbnail.jpg (1080x1920, ready to upload).
# Usage: bash thumbnails/render.sh [N ...]      (no arguments = all seven)
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p thumbnails/exports
for n in "${@:-1 2 3 4 5 6 7}"; do
  for k in $n; do
    npx remotion still src/index.ts "Short${k}-Thumbnail" "thumbnails/exports/short${k}-thumbnail.jpg" --scale=1 --jpeg-quality=95 ${REMOTION_EXTRA:-}
  done
done
