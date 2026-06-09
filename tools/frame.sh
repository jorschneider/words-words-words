#!/bin/bash
# Capture a frame of the film at time T: tools/frame.sh 42 [out.png]
# Requires a local server on :8741 (tools/serve.sh).
T=${1:-0}
OUT=${2:-/tmp/www-frames/frame_${T}.png}
mkdir -p "$(dirname "$OUT")"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars \
  --window-size=1280,720 \
  --screenshot="$OUT" \
  --virtual-time-budget=12000 \
  "http://localhost:8741/index.html?t=${T}&frame=1" 2>/dev/null
echo "$OUT"
