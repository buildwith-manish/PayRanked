#!/usr/bin/env python3
"""Offline mix check for Video 2: places the voice clips and the SFX cue list exactly like Sfx.tsx does and reports levels.

    node (export cues to /tmp/cues2.json, see NOTES.md) ; python3 scripts/mix_check2.py [--write out/mix_check.wav]

Reports: mix peak (must stay under 0 dBFS), voice vs SFX level while the voice speaks, and the loudest SFX moments.
It does not render any video, so it runs in seconds. Music is not included (AUDIO.music is off until a track exists).
"""
import json, os, subprocess, sys
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SR = 24000
FPS = 30
cfg = {'voLevel': 0.9, 'sfxLevel': 0.26, 'sfxDuck': 0.55, 'heroDuck': 0.45}

def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<f4')

layout = json.load(open(os.path.join(ROOT, 'src/audio/vo-layout.json')))
n = int((layout['totalSeconds'] + 4) * SR)
voice = np.zeros(n, dtype=np.float32)
for c in json.load(open(os.path.join(ROOT, 'src/audio/voiceover-manifest.json'))):
    y = decode(os.path.join(ROOT, 'public', c['file'])) * cfg['voLevel']
    a = max(0, int(round(c['startFrame'] / FPS * SR)))
    b = min(n, a + len(y))
    voice[a:b] += y[: b - a]

env = np.array(json.load(open(os.path.join(ROOT, 'src/audio/vo-envelope.json')))['frames']) / 100.0
manifest = json.load(open(os.path.join(ROOT, 'src/audio/manifest.json')))
cues = json.load(open('/tmp/cues2.json'))['cues']
sfx = np.zeros(n, dtype=np.float32)
cache = {}
t_idx = np.arange(n) / SR * FPS
duck_full = 1 - cfg['sfxDuck'] * np.interp(t_idx, np.arange(len(env)), env)
duck_hero = 1 - cfg['heroDuck'] * np.interp(t_idx, np.arange(len(env)), env)
for c in cues:
    if c['sfx'] not in cache:
        cache[c['sfx']] = decode(os.path.join(ROOT, 'public/sfx', c['sfx'] + '.wav'))
    y = cache[c['sfx']]
    start = int(round((c['at'] / FPS - manifest[c['sfx']]['peak']) * SR))
    a0, b0 = max(0, start), min(n, start + len(y))
    if b0 <= a0:
        continue
    seg = y[a0 - start : b0 - start] * min(1.0, c['gain'] * cfg['sfxLevel'])
    seg = seg * (duck_hero if c.get('hero') else duck_full)[a0:b0]
    sfx[a0:b0] += seg.astype(np.float32)

mix = voice + sfx
db = lambda x: 20 * np.log10(max(float(x), 1e-9))
print(f'mix peak {db(np.abs(mix).max()):.1f} dBFS   voice peak {db(np.abs(voice).max()):.1f}   sfx peak {db(np.abs(sfx).max()):.1f}')
win = SR // 2
k = len(mix) // win
rms = lambda a: np.sqrt((a[: k * win].reshape(k, win) ** 2).mean(axis=1) + 1e-12)
rv, rs = rms(voice), rms(sfx)
speaking = rv > 10 ** (-40 / 20)
sfx_on = rs > 10 ** (-60 / 20)
both = speaking & sfx_on
print(f'voice speaking {100 * speaking.mean():.0f}% of the time; SFX audible in {100 * sfx_on.mean():.0f}% of it')
if both.any():
    gap = 20 * np.log10(rs[both] / rv[both])
    print(f'SFX vs voice while both play (0.5 s windows): median {np.median(gap):.1f} dB, loudest {gap.max():.1f} dB (want < -6 dB for non-hero cues)')
ratio = np.where(speaking, rs / np.maximum(rv, 1e-6), 0)
loud = [i for i in np.argsort(-ratio)[:8] if ratio[i] > 0]
print('closest to the voice while the voice speaks (window start, SFX level, voice level, gap):')
for i in sorted(loud):
    print(f'  {i * 0.5:6.1f}s  sfx {db(rs[i]):6.1f} dB  voice {db(rv[i]):6.1f} dB  gap {db(ratio[i]):5.1f} dB')
if '--write' in sys.argv:
    import wave
    path = sys.argv[sys.argv.index('--write') + 1]
    m = np.clip(mix, -1, 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((m * 32767).astype('<i2').tobytes())
    print('wrote', path)
