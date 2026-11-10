#!/usr/bin/env python3
"""
Mixes the sound effects on their own (no voice-over, no music), exactly where the cue sheet puts them, so they can be
auditioned without rendering the video.

    node scripts/dump-cues.mjs           # writes scripts/cues.json from src/audio/cues.ts and the timeline
    python3 scripts/make_audio_previews.py

Writes audio-previews/sfx-only-{full,shot1,reveal10,shot6}.mp3. Each cue starts early by its manifest `peak`, so its
impact lands on the beat, and plays at min(1, gain * sfxLevel) like Sfx.tsx does. The voice-over duck is not applied
(there is no voice here). Needs numpy and ffmpeg.
"""
import json
import os
import subprocess
import wave

import numpy as np

SR = 48000
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SFX = os.path.join(ROOT, 'public', 'sfx')
OUT = os.path.join(ROOT, 'audio-previews')
SFX_LEVEL = 0.6  # AUDIO.sfxLevel in src/audio/config.ts

cues = json.load(open(os.path.join(ROOT, 'scripts', 'cues.json')))
manifest = json.load(open(os.path.join(ROOT, 'src', 'audio', 'manifest.json')))


def load(name):
    with wave.open(os.path.join(SFX, f'{name}.wav')) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float64) / 32768
        x = x.reshape(-1, w.getnchannels())
    return np.repeat(x, 2, axis=1) if x.shape[1] == 1 else x


cache = {}
total = cues['total'] + 4
mix = np.zeros((int(total * SR), 2))
for c in cues['cues']:
    x = cache.setdefault(c['sfx'], load(c['sfx']))
    start = int(round((c['t'] - manifest[c['sfx']]['peak']) * SR))
    g = min(1.0, c['gain'] * SFX_LEVEL)
    a, b = max(0, start), min(len(mix), start + len(x))
    if b > a:
        mix[a:b] += x[a - start:b - start] * g

peak = np.abs(mix).max()
print(f'full mix peak {20 * np.log10(peak):.1f} dBFS')
if peak > 0.89:  # keep the previews under -1 dBFS
    mix *= 0.89 / peak


def write(name, t0, t1):
    seg = mix[int(max(0, t0) * SR):int(t1 * SR)]
    wav = os.path.join(OUT, f'{name}.wav')
    with wave.open(wav, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(seg, -1, 1) * 32767).astype('<i2').tobytes())
    mp3 = os.path.join(OUT, f'{name}.mp3')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '128k', mp3], check=True)
    os.remove(wav)
    print(f'{name}.mp3  {t1 - max(0, t0):.1f} s')


reveals = [c['t'] for c in cues['cues'] if c['tag'] == 'reveal #10']
os.makedirs(OUT, exist_ok=True)
write('sfx-only-full', 0, cues['total'])
write('sfx-only-shot1', cues['shots']['shot1'], cues['shots']['shot1'] + 30)
write('sfx-only-reveal10', min(reveals) - 3, min(reveals) - 3 + 30)
write('sfx-only-shot6', cues['shots']['shot6'], cues['total'])
