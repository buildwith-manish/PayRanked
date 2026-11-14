#!/usr/bin/env python3
"""
Video 2 music bed, synthesised from scratch (nothing to license). Writes public/music.mp3 (48 kHz stereo, 128 kbps).

    python3 scripts/make_music2.py

D natural minor, 96 BPM (a bar is 2.5 s), chords Dm - Bb - F - C on a global bar grid, so every effect note ladder in the SFX library stays
inside the key. Section starts come from src/audio/vo-layout.json (the recorded voice), so the bed follows the edit:

  cold open   pad + a thin pulse; tension, no drums
  method      calm: pad and soft plucks
  countdown   one engine that grows every city: pad -> plucks -> bass -> hats -> kick -> clap/bell for #1
  rent break  stripped back to pad only, so the picture change is also a sound change
  twist       a 5 s riser, a short silence, then a drop with the full groove; this is where the bed swells
  takeaway    pad, plucks, bass (settled)
  outro       warm, thinning, pad alone on the end screen

Pads, plucks and bass are sidechained to the kick. Deterministic (fixed seed). Needs numpy, scipy, ffmpeg.
"""
import json, os, subprocess, wave
import numpy as np
from scipy import signal

SR = 48000
BEAT = 60 / 96
BAR = 4 * BEAT
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'public', 'music.mp3')
L = json.load(open(os.path.join(ROOT, 'src', 'audio', 'vo-layout.json')))
SH = L['shots']
TOTAL = L['totalSeconds'] + 3.0
N = int(TOTAL * SR)
rng = np.random.default_rng(96)


def span(prefix):
    s = [x for x in SH if x['id'].startswith(prefix)]
    return s[0]['start'], s[-1]['start'] + s[-1]['seconds']


def tt(d): return np.arange(int(d * SR)) / SR
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def lp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'high', fs=SR, output='sos'), x)


pad_bus = np.zeros((N, 2), np.float32)
mus_bus = np.zeros((N, 2), np.float32)   # plucks + bass (sidechained)
drum_bus = np.zeros((N, 2), np.float32)
kicks = []


def put(bus, x, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i < 0 or i >= N: return
    n = min(len(x), N - i)
    th = (pan + 1) * np.pi / 4
    seg = x[:n].astype(np.float32) * g
    bus[i:i + n, 0] += seg * np.cos(th)
    bus[i:i + n, 1] += seg * np.sin(th)


# ---- sections: name -> (t0, t1, level 0..5, pad gain)
sections = []
c0, c1 = span('s01_'); sections.append((c0, c1, 1, 0.5))
m0, m1 = span('s02_'); sections.append((m0, m1, 1, 0.55))
CITY_LEVEL = {10: 1, 9: 1, 8: 2, 7: 2, 6: 3, 5: 3, 4: 4, 3: 4, 2: 4, 1: 5}
for r in range(10, 0, -1):
    a, b = span(f'r{r:02d}_'); sections.append((a, b, CITY_LEVEL[r], 0.5))
b0, b1 = span('s03_'); sections.append((b0, b1, 0, 0.45))
t0, t1 = span('s04_'); sections.append((t0, t1, 4, 0.7))
k0, k1 = span('s05_'); sections.append((k0, k1, 2, 0.5))
o0, o1 = span('s06_'); sections.append((o0, o1, 2, 0.5))
END_SCREEN = L['endScreenSeconds']


def sec_at(t):
    for a, b, lv, pg in sections:
        if a <= t < b: return a, b, lv, pg
    return None


# ---- instruments (cached)
PROG = [(50, 53, 57, 38), (46, 50, 53, 34), (53, 57, 60, 41), (48, 52, 55, 36)]  # Dm, Bb, F, C (+ bass root)


def saw(f, t, nh=10): return sum(np.sin(2 * np.pi * k * f * t) / k for k in range(1, nh + 1)) * 0.5


_pad = {}
def pad(ci):
    if ci not in _pad:
        t = tt(BAR + 0.8)
        x = np.zeros_like(t)
        for m in PROG[ci][:3]:
            for det in (-0.07, 0.0, 0.07):
                x += saw(mtof(m + det), t)
        x = lp(x, 1400)
        env = np.minimum(1, t / 0.7) * np.minimum(1, (t[-1] - t) / 0.8)
        _pad[ci] = (x * env / 9).astype(np.float32)
    return _pad[ci]


_pl = {}
def pluck(m):
    if m not in _pl:
        t = tt(0.55)
        f = mtof(m)
        x = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)) * np.exp(-t * 7)
        _pl[m] = (lp(x, 4500) * 0.6).astype(np.float32)
    return _pl[m]


_bass = {}
def bass(m):
    if m not in _bass:
        t = tt(BEAT * 1.6)
        x = np.sin(2 * np.pi * mtof(m) * t) * np.exp(-t * 2.2) * np.minimum(1, t / 0.01)
        _bass[m] = (x * 0.9).astype(np.float32)
    return _bass[m]


def kick_w():
    t = tt(0.28)
    ph = 2 * np.pi * np.cumsum(45 + 90 * np.exp(-t * 28)) / SR
    return (np.sin(ph) * np.exp(-t * 11)).astype(np.float32)


def hat_w():
    t = tt(0.05)
    return (hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * 70) * 0.25).astype(np.float32)


def clap_w():
    t = tt(0.18)
    x = signal.sosfilt(signal.butter(2, [1200, 3800], 'band', fs=SR, output='sos'), rng.standard_normal(len(t)))
    return (x * np.exp(-t * 28) * 0.5).astype(np.float32)


KICK, HAT, CLAP = kick_w(), hat_w(), clap_w()

# ---- fade envelope for the pad bar by bar, driven by the section table
n_bars = int(TOTAL / BAR) + 1
for bi in range(n_bars):
    t = bi * BAR
    s = sec_at(t + 0.1)
    if not s: continue
    a, b, lv, pg = s
    g = pg
    if t < 3: g *= min(1, t / 3 + 0.2)                    # fade in under the cold open
    if o1 - END_SCREEN <= t: g *= 0.9                      # pad alone on the end screen
    if t > o1 - 6: g *= max(0.0, (o1 + 2.5 - t) / 8.5)     # fade out over the last bars
    if b0 <= t < b1 and t > b1 - 3: g *= 0.55              # the quiet beat before the twist
    put(pad_bus, pad(bi % 4), t, g * 0.8, pan=0.0)

# ---- rhythmic layers on a global 8th-note grid
step = BEAT / 2
ns = int(TOTAL / step)
for i in range(ns):
    t = i * step
    s = sec_at(t)
    if not s: continue
    a, b, lv, pg = s
    if b0 <= t < b1 and lv == 0: continue
    if t > o1 - 6: continue
    bi = int(t / BAR)
    ch = PROG[bi % 4]
    pos = i % 8                                             # 8th within the bar
    arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 24, ch[2] + 12, ch[1] + 12, ch[0] + 24, ch[2] + 12][pos]
    if lv >= 1 and pos % 2 == (0 if lv < 3 else 1) or lv >= 3:
        gain = {1: 0.12, 2: 0.17, 3: 0.2, 4: 0.24, 5: 0.28}[lv]
        if pos % 2 == 0 or lv >= 2:
            put(mus_bus, pluck(arp), t, gain, pan=(-0.4 if i % 2 else 0.4))
            put(mus_bus, pluck(arp), t + 0.47, gain * 0.3, pan=(0.5 if i % 2 else -0.5))  # echo
    if lv >= 2 and pos in (0, 4):
        put(mus_bus, bass(ch[3]), t, {2: 0.32, 3: 0.36, 4: 0.4, 5: 0.45}[lv])
    if lv >= 3 and pos % 2 == 1:
        put(drum_bus, HAT, t, 0.35 if lv < 5 else 0.45, pan=0.3)
    if lv >= 3 and pos % 2 == 0:
        pass
    if lv >= 4 and pos in (0, 2, 4, 6) and pos % 2 == 0:
        if pos in (0, 4) or lv == 5:
            put(drum_bus, KICK, t, 0.7)
            kicks.append(t)
    if lv >= 5 and pos in (2, 6):
        put(drum_bus, CLAP, t, 0.5)
    if lv == 1 and a == c0 and pos in (0, 4):
        put(drum_bus, HAT, t, 0.2, pan=-0.3)                # cold open: thin ticking

# ---- the twist: 5 s riser, 0.35 s silence, then a boom at the drop
tw = t0
rn = tt(5.0)
nz = rng.standard_normal(len(rn))
sweep = signal.sosfilt(signal.butter(2, [400, 6000], 'band', fs=SR, output='sos'), nz) * (rn / 5.0) ** 2
riser = (sweep * 0.35 * np.minimum(1, (5.0 - rn) / 0.05 + 0.0)).astype(np.float32)
riser[-int(0.35 * SR):] = 0                                 # the short silence
put(drum_bus, riser, tw - 5.0, 0.9)
tb = tt(1.6)
boom = (np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tb * 1.6) + 28) / SR) * np.exp(-tb * 2.2)).astype(np.float32)
put(drum_bus, boom, tw, 1.0)
kicks.append(tw)

# ---- sidechain: pad and plucks pump under each kick
duck = np.ones(N, np.float32)
for kt in kicks:
    i = int(kt * SR); n = int(0.32 * SR)
    if i >= N: continue
    n = min(n, N - i)
    duck[i:i + n] *= 1 - 0.5 * np.exp(-np.arange(n) / (0.1 * SR))
mix = (pad_bus + mus_bus) * duck[:, None] + drum_bus

# ---- master: gentle high-cut, peak at -3 dBFS, short fade in/out
mix[:, 0] = lp(mix[:, 0], 12000, 1); mix[:, 1] = lp(mix[:, 1], 12000, 1)
peak = float(np.abs(mix).max()) or 1.0
mix *= 10 ** (-3 / 20) / peak
fi, fo = int(1.0 * SR), int(2.5 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
pcm = (np.clip(mix, -1, 1) * 32767).astype('<i2')
wav = '/tmp/music2.wav'
with wave.open(wav, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-b:a', '128k', OUT], check=True)
print(f'wrote {OUT}: {TOTAL:.1f} s, peak before norm {20*np.log10(peak):.1f} dB, {len(kicks)} kicks')
for name, a, b in [('cold', c0, c1), ('method', m0, m1), ('#10', *span('r10_')), ('#1', *span('r01_')), ('break', b0, b1), ('twist', t0, t1), ('takeaway', k0, k1), ('outro', o0, o1)]:
    seg = mix[int(a * SR):int(b * SR)]
    print(f'  {name:9s} rms {20*np.log10(np.sqrt((seg**2).mean()) + 1e-9):6.1f} dBFS')
