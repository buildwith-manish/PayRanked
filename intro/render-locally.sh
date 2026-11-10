#!/bin/bash
# render-locally.sh
# =================
# Renders PayRanked Intro v10 to intro.mp4 on your local machine.
#
# Requirements:
#   - Google Chrome or Chromium installed
#   - ffmpeg installed
#
# Usage:
#   cd PayRanked/intro
#   bash render-locally.sh
#
# Output:
#   intro.mp4 (1920x1080, 60fps, 3.5s, H.264 + AAC)
#   → then copy to ../public/intro.mp4 for use in Remotion

set -e

# Detect chrome binary
CHROME=""
for path in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/usr/bin/google-chrome" \
    "/usr/bin/google-chrome-stable" \
    "/usr/bin/chromium" \
    "/usr/bin/chromium-browser" \
    "/snap/bin/chromium" \
    "/opt/google/chrome/chrome"; do
    if [ -x "$path" ]; then
        CHROME="$path"
        break
    fi
done

if [ -z "$CHROME" ]; then
    echo "ERROR: Chrome/Chromium not found."
    echo "Install Google Chrome or set CHROME_PATH env var."
    echo ""
    echo "  macOS:  brew install --cask google-chrome"
    echo "  Ubuntu: sudo apt install google-chrome-stable"
    echo "  Or set: export CHROME_PATH=/path/to/chrome"
    exit 1
fi

CHROME="${CHROME_PATH:-$CHROME}"

if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "ERROR: ffmpeg not installed."
    echo "  macOS:  brew install ffmpeg"
    echo "  Ubuntu: sudo apt install ffmpeg"
    exit 1
fi

HTML_FILE="$(pwd)/intro-v10.html"
AUDIO_WAV="$(pwd)/intro.wav"
OUTPUT_MP4="$(pwd)/intro.mp4"
TOTAL_FRAMES=210
FRAMES_DIR="/tmp/payranked-intro-frames"

echo "========================================================="
echo "  PayRanked Intro v10 -> MP4 (Local Render)"
echo "========================================================="
echo "  Chrome:  $CHROME"
echo "  HTML:    $HTML_FILE"
echo "  Audio:   $AUDIO_WAV"
echo "  Output:  $OUTPUT_MP4"
echo "  Spec:    1920x1080 @ 60fps, 3.5s, $TOTAL_FRAMES frames"
echo ""

rm -rf "$FRAMES_DIR"
mkdir -p "$FRAMES_DIR"

echo "> Capturing $TOTAL_FRAMES frames..."
START=$(date +%s)

for i in $(seq 0 $((TOTAL_FRAMES - 1))); do
    FRAME_PATH="$FRAMES_DIR/frame-$(printf '%04d' $i).png"
    "$CHROME" \
        --headless=new \
        --no-sandbox \
        --disable-gpu \
        --disable-setuid-sandbox \
        --disable-dev-shm-usage \
        --hide-scrollbars \
        --force-device-scale-factor=1 \
        --screenshot="$FRAME_PATH" \
        --window-size=1920,1080 \
        "file://$HTML_FILE?frame=$i" 2>/dev/null

    if [ ! -s "$FRAME_PATH" ]; then
        echo ""
        echo "ERROR: Frame $i failed to capture"
        exit 1
    fi

    if [ $((i % 20)) -eq 0 ] || [ $i -eq $((TOTAL_FRAMES - 1)) ]; then
        NOW=$(date +%s)
        ELAPSED=$((NOW - START))
        RATE=$(awk "BEGIN{printf \"%.1f\", ($i+1)/$ELAPSED}" 2>/dev/null || echo "?")
        REMAIN=$((TOTAL_FRAMES - i - 1))
        ETA=$(awk "BEGIN{printf \"%.0f\", $REMAIN/$RATE}" 2>/dev/null || echo "?")
        printf "\r  Frame %3d/%d  [%ds elapsed, %s fps, ETA %ss]   " $((i+1)) $TOTAL_FRAMES $ELAPSED "$RATE" "$ETA"
    fi
done
echo ""
echo ""

echo "> Combining frames + WAV with ffmpeg..."
ffmpeg -y -hide_banner -loglevel warning \
    -framerate 60 \
    -i "$FRAMES_DIR/frame-%04d.png" \
    -i "$AUDIO_WAV" \
    -c:v libx264 \
    -preset slow \
    -crf 16 \
    -pix_fmt yuv420p \
    -r 60 \
    -c:a aac \
    -b:a 256k \
    -shortest \
    -movflags +faststart \
    "$OUTPUT_MP4"

rm -rf "$FRAMES_DIR"

if [ -f "$OUTPUT_MP4" ]; then
    SIZE_MB=$(du -m "$OUTPUT_MP4" | cut -f1)
    echo ""
    echo "========================================================="
    echo "  RENDER COMPLETE"
    echo "========================================================="
    echo "  Output: $OUTPUT_MP4"
    echo "  Size:   ${SIZE_MB} MB"
    echo ""
    echo "  Streams:"
    ffprobe -v error -show_entries stream=codec_name,codec_type,width,height,r_frame_rate,duration \
        -of default=noprint_wrappers=1 "$OUTPUT_MP4" 2>&1 | sed 's/^/    /'
    echo ""
    echo "  Next steps:"
    echo "    1. cp intro.mp4 ../public/intro.mp4"
    echo "    2. git add public/intro.mp4 && git commit -m 'feat(intro): add rendered v10 intro MP4'"
    echo "    3. git push origin main"
    echo ""
fi
