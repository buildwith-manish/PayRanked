#!/usr/bin/env python3
"""Pacing audit for Video 2: reads src/audio/vo-layout.json and flags shots that run long without a visual beat.

The rule from NOTES.md is a camera move or animated element every 2 to 3 s. SceneCamera drifts all the time, so the
real risk is a long clip where no NEW element appears. This lists, per scene, the shots longer than LIMIT seconds and the
longest gap between word cues inside them, so you know where to add a beat (a pill, a count, a punch-in).
"""
import json, re, sys
from pathlib import Path

LIMIT = float(sys.argv[1]) if len(sys.argv) > 1 else 4.5
L = json.loads((Path(__file__).resolve().parent.parent / 'src/audio/vo-layout.json').read_text())
shots = L['shots']
scenes = {}
for s in shots:
    key = re.match(r'([a-z]+\d+)_', s['id'])
    scenes.setdefault(key.group(1) if key else s['id'], []).append(s)

total_flag = 0
for name, lst in scenes.items():
    flagged = [s for s in lst if (s['speechEnd'] - s['speechStart']) > LIMIT]
    dur = lst[-1]['start'] + lst[-1]['seconds'] - lst[0]['start']
    print(f"{name:6s} {dur:6.1f}s  {len(lst):2d} shots  {len(flagged)} longer than {LIMIT}s")
    for s in flagged:
        words = s.get('words') or []
        times = [0.0] + [w[1] for w in words] + [s['speechEnd'] - s['speechStart']]
        gap = max((b - a) for a, b in zip(times, times[1:])) if len(times) > 1 else 0
        print(f"    {s['id']:12s} speech {s['speechEnd'] - s['speechStart']:5.1f}s  longest silent gap {gap:4.1f}s  | {s['text'][:70]}")
    total_flag += len(flagged)
print(f"\n{total_flag} shots longer than {LIMIT}s. Check each for a visual beat (new element, count, punch-in) about every 2.5 s.")
