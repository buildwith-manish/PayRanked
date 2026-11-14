#!/usr/bin/env python3
"""
Measure the voice-over once so the music and SFX can duck against it (the sidechain).

    python3 scripts/vo_envelope.py [public/vo.mp3]      # writes src/audio/vo-envelope.json

Per video frame (30 fps) it writes a number 0..100: how much the voice is "speaking" at that moment.
  1. loudness per frame (RMS in dB)
  2. a speech gate that adapts to this recording (relative to its own loud passages), with hysteresis
     and a hold, so the gaps between words do not make the music pump
  3. look-ahead: the envelope is shifted 3 frames early, so the music is already down when the first word starts
  4. attack / release smoothing: fast on the way down, slow on the way back up
Needs ffmpeg and numpy. Re-run whenever the voice-over is re-cut.
"""
import json
import os
import subprocess
import sys

import numpy as np

FPS = 30
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
out = os.path.join(ROOT, 'src', 'audio', 'vo-envelope.json')

SR = 16000


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<f4')


if len(sys.argv) > 1:
    # legacy: one concatenated file
    src = sys.argv[1]
    x = decode(src)
else:
    # Default: the voice-over plays as separate clips (src/audio/Sfx.tsx), so build the envelope from the clips placed
    # exactly where the video places them (voiceover-manifest.json + shot starts from scripts/timing.json).
    # Run `node scripts/export-timing.mjs` first if the timeline changed.
    src = 'voiceover-manifest.json'
    manifest = json.load(open(os.path.join(ROOT, 'src', 'audio', 'voiceover-manifest.json')))
    timing_path = os.path.join(ROOT, 'scripts', 'timing.json')
    if os.path.exists(timing_path):
        # Video 1 layout: clips are keyed by shot
        timing = json.load(open(timing_path))
        starts = {k: v['start'] for k, v in timing['shots'].items()}
        starts['shot4'] = starts['countdown']
        x = np.zeros(int((timing['total'] + 5) * SR), dtype=np.float32)
        for c in manifest:
            y = decode(os.path.join(ROOT, 'public', c['file']))
            a = int(round((starts[c['shot']] + c['at'] - c['lead']) * SR))
            a = max(0, a)
            b = min(len(x), a + len(y))
            x[a:b] += y[: b - a]
    else:
        # Video 2 layout: every clip has its own start on the 30 fps design clock (`startFrame`), see src/audio/Sfx.tsx
        total = json.load(open(os.path.join(ROOT, 'src', 'audio', 'vo-layout.json')))['totalSeconds']
        x = np.zeros(int((total + 5) * SR), dtype=np.float32)
        for c in manifest:
            y = decode(os.path.join(ROOT, 'public', c['file']))
            a = max(0, int(round(c['startFrame'] / FPS * SR)))
            b = min(len(x), a + len(y))
            x[a:b] += y[: b - a]
hop = SR // FPS
n = len(x) // hop
rms = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)
db = 20 * np.log10(rms)

# The gate sits 22 dB under this recording's loud passages (95th percentile), never below -55 dB absolute.
ref = np.percentile(db, 95)
open_db = max(ref - 22, -55)
close_db = open_db - 4  # hysteresis
HOLD = 9  # frames to stay open after the level falls (bridges the gaps between words)

gate = np.zeros(n)
state, hold = False, 0
for i, v in enumerate(db):
    if v > open_db:
        state, hold = True, HOLD
    elif state and v < close_db:
        hold -= 1
        if hold <= 0:
            state = False
    gate[i] = 1.0 if state else 0.0

gate = np.roll(gate, -3)  # look-ahead
gate[-3:] = 0

env = np.zeros(n)
a_att, a_rel = 1 - np.exp(-1 / 3.0), 1 - np.exp(-1 / 11.0)  # ~100 ms down, ~370 ms up
cur = 0.0
for i, g in enumerate(gate):
    cur += (g - cur) * (a_att if g > cur else a_rel)
    env[i] = cur

frames = [int(round(v * 100)) for v in env]
with open(out, 'w') as f:
    json.dump({'fps': FPS, 'source': os.path.basename(src), 'gate_db': round(float(open_db), 1), 'frames': frames}, f, separators=(',', ':'))

print(f'{n} frames ({n / FPS:.1f} s). Gate {open_db:.1f} dB (voice peaks ~{ref:.1f} dB). Speaking {100 * gate.mean():.0f}% of the time.')
