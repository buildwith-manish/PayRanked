#!/usr/bin/env python3
"""
PayRanked sound library, synthesised from scratch (no samples, so there is nothing to license).

    python3 scripts/make_sfx.py          # writes public/sfx/*.wav and src/audio/manifest.json

Every sound is built the way a sound designer layers it:
  hits    sub thump (pitch-dropping sine) + body + crack (filtered noise transient) + a short room tail
  coins   inharmonic metal partials (a real coin is not a clean tone) + a tick + a small bounce
  whoosh  noise through a bank of band-passes that sweeps in pitch; the louder, faster and brighter the move,
          the higher the sweep goes and the shorter it is (xs / s / m / l / xl, and out_ versions that fall)
  ticks   three mechanical variants so a roll never plays the same click twice in a row
  blips   a pentatonic ladder, used wherever things light up one after another

manifest.json holds, per file, its length and `peak`: the time in seconds of its main impact. The cue sheet uses it
to start each file early enough that the impact lands exactly on the visual beat (a whoosh starts before the move,
a riser ends on the hit it builds to).

Needs numpy and scipy. Deterministic: the same files come out every run.
"""
import json
import os
import wave

import numpy as np
from scipy import signal

SR = 48000
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'public', 'sfx')
MANIFEST = os.path.join(ROOT, 'src', 'audio', 'manifest.json')
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.dirname(MANIFEST), exist_ok=True)

rng = np.random.default_rng(20261108)
lib: dict = {}  # name -> (audio[n] or [n,2], peak seconds)


# ---------------------------------------------------------------- helpers
def t_(dur):
    return np.arange(int(dur * SR)) / SR


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def expd(t, tau):
    return np.exp(-t / tau)


def sine(freq, t, phase=0.0):
    """Sine with a time-varying frequency (array) or fixed one."""
    f = np.broadcast_to(freq, t.shape)
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def bp(x, lo, hi, order=2):
    hi = min(hi, SR / 2 * 0.95)
    sos = signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='high', fs=SR, output='sos'), x)


def fade(x, a=0.002, b=0.01):
    n = len(x)
    ia, ib = int(a * SR), int(b * SR)
    x = x.copy()
    shape = (-1, 1) if x.ndim == 2 else (-1,)
    if ia:
        x[:ia] *= np.linspace(0, 1, ia).reshape(shape)
    if ib:
        x[-ib:] *= np.linspace(1, 0, ib).reshape(shape)
    return x


def room(x, rt=0.9, wet=0.25, bright=5000, pre=0.008):
    """Short synthetic room: decaying, low-passed noise, different in each ear. Returns stereo."""
    n = int(rt * 1.4 * SR)
    tt = np.arange(n) / SR
    out = []
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-tt / (rt / 6.9 * 2.2))
        ir = lp(ir, bright)
        ir[: int(pre * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
        out.append(np.pad(signal.fftconvolve(x, ir), (0, 1))[: len(x) + n])
    dry = np.pad(x, (0, n))
    return np.stack([dry + wet * out[0] * 3.0, dry + wet * out[1] * 3.0], axis=1)


def stereo(x):
    return np.stack([x, x], axis=1) if x.ndim == 1 else x


def finish(name, x, peak=0.0, level=0.89, mono=False, tail_fade=0.02):
    x = np.asarray(x, dtype=np.float64)
    x = np.tanh(x * 1.0) if np.max(np.abs(x)) > 1.6 else x
    m = np.max(np.abs(x)) + 1e-9
    x = x / m * level
    if x.ndim == 1 and not mono:
        x = stereo(x)
    # trim trailing silence (-70 dB) so files stay small
    env = np.max(np.abs(x), axis=1) if x.ndim == 2 else np.abs(x)
    idx = np.where(env > 3e-4)[0]
    end = (idx[-1] + int(0.03 * SR)) if len(idx) else len(x)
    x = x[: min(len(x), end)]
    x = fade(x, 0.0005, tail_fade)
    lib[name] = (x, peak)


def to_mono_if_wide_not_needed(x):
    return x


# ---------------------------------------------------------------- hits
def hit(name, big=1.0, dur=2.2, tail=0.9, wet=0.28, sub=(72, 36), crack=1.0, body=1.0, metal=0.0):
    """Layered impact. big scales the length and weight of the low layers."""
    t = t_(dur)
    # 1. sub: sine that drops in pitch, then decays
    fsub = sub[1] + (sub[0] - sub[1]) * expd(t, 0.06)
    s = sine(fsub, t) * expd(t, 0.28 * big + 0.08) * 1.2
    # 2. body: a short thump an octave up, plus filtered noise "boom"
    b = sine(np.full_like(t, sub[0] * 2.1), t) * expd(t, 0.09 * big) * 0.45 * body
    b += lp(noise(dur), 220) * expd(t, 0.16 * big) * 1.1 * body
    # 3. crack: the transient, so the hit has an edge
    c = bp(noise(dur), 1800, 9000) * expd(t, 0.012 + 0.006 * big) * 0.9 * crack
    c += hp(noise(dur), 400) * expd(t, 0.004) * 0.7 * crack
    # 4. optional metal ring (stamps, locks)
    m = np.zeros_like(t)
    if metal:
        for fr, a, tau in [(1180, 1.0, 0.22), (2630, 0.6, 0.14), (4210, 0.35, 0.09)]:
            m += sine(np.full_like(t, fr), t) * a * expd(t, tau)
        m *= 0.35 * metal
    x = s + b + c + m
    x = np.tanh(x * 1.3)
    x[: int(0.0004 * SR)] *= np.linspace(0, 1, int(0.0004 * SR))  # no click at sample 0
    x = room(x, rt=tail, wet=wet)
    finish(name, x, peak=0.0)


hit('hit_big', big=1.0, dur=2.4, tail=1.1, wet=0.3, sub=(76, 34))
hit('hit_med', big=0.55, dur=1.4, tail=0.7, wet=0.22, sub=(88, 44), crack=0.9)
hit('hit_small', big=0.22, dur=0.8, tail=0.4, wet=0.14, sub=(120, 70), crack=0.8, body=0.7)
hit('stamp', big=0.6, dur=1.6, tail=0.6, wet=0.2, sub=(84, 42), metal=1.0)
hit('lock', big=0.3, dur=1.0, tail=0.5, wet=0.15, sub=(110, 60), crack=1.1, metal=0.7)


def chip_variant(name, f=1.0):
    t = t_(0.28)
    tap = sine(1900 * f * (1 - 0.35 * (1 - expd(t, 0.01))), t) * expd(t, 0.02)
    tap += bp(noise(0.28), 2500, 9000) * expd(t, 0.006) * 0.8
    low = sine(np.full_like(t, 130 * f), t) * expd(t, 0.05) * 1.1
    ring = sine(np.full_like(t, 3300 * f), t) * expd(t, 0.09) * 0.18
    finish(name, tap + low + ring, peak=0.0, mono=True)


for i, f in enumerate([0.94, 1.0, 1.12]):
    chip_variant(f'chip_{i}', f)

# ---------------------------------------------------------------- coins
def coin(name, f0, bounce=True):
    dur = 0.9
    t = t_(dur)
    x = np.zeros_like(t)
    # inharmonic partials, the higher the faster they die
    for ratio, a, tau in [(1.0, 1.0, 0.20), (2.32, 0.7, 0.13), (4.25, 0.5, 0.08), (6.63, 0.32, 0.05), (9.38, 0.2, 0.03)]:
        x += sine(np.full_like(t, f0 * ratio), t, phase=rng.uniform(0, 6.28)) * a * expd(t, tau)
    x += bp(noise(dur), 3000, 11000) * expd(t, 0.004) * 0.9  # the contact tick
    x += sine(np.full_like(t, 410), t) * expd(t, 0.025) * 0.5  # a dull tap underneath
    if bounce:
        d = int(0.062 * SR)
        x[d:] += 0.38 * x[:-d] * 0.8
        d2 = int(0.105 * SR)
        x[d2:] += 0.16 * x[:-d2] * 0.7
    finish(name, x, peak=0.0, mono=True)


for i, f0 in enumerate([1650, 1900, 2200, 2480]):
    coin(f'coin_{i}', f0)

# ---------------------------------------------------------------- whooshes
def whoosh(name, dur, f0, f1, peak_at=0.6, width=2.2, bands=30, rise=1.6, fall=2.4, pan=(-0.35, 0.35), gain=1.0, body=0.0):
    """Noise through a sweeping band-pass bank. f0 -> f1 can fall (out_ versions). peak_at is where it is loudest."""
    t = t_(dur)
    n = len(t)
    centres = f0 * (f1 / f0) ** (np.arange(bands) / (bands - 1))
    chans = []
    for _ in range(2):
        src = noise(dur)
        acc = np.zeros(n)
        for k, fc in enumerate(centres):
            tk = dur * (k + 0.5) / bands
            g = np.exp(-0.5 * ((t - tk) / (dur / bands * width)) ** 2)
            acc += bp(src, fc * 0.7, fc * 1.4) * g
        chans.append(acc)
    x = np.stack(chans, axis=1)
    # loudness: rises to the peak, then falls away faster (the way a pass-by does)
    p = peak_at * dur
    amp = np.where(t < p, (t / p) ** rise, ((dur - t) / (dur - p)) ** fall)
    amp = np.clip(amp, 0, 1)
    x *= amp[:, None]
    # pan across the move
    th = (0.5 + np.linspace(pan[0], pan[1], n) / 2) * np.pi / 2
    x[:, 0] *= np.cos(th) * 1.4
    x[:, 1] *= np.sin(th) * 1.4
    if body:  # a low rumble under bigger moves
        r = lp(noise(dur), 160) * amp ** 1.5 * body
        x += r[:, None]
    finish(name, x * gain, peak=peak_at * dur)


# in: loudest near the end of the move; fast moves are short and bright, slow ones long and low
whoosh('whoosh_xs', 0.22, 2200, 9000, 0.55)
whoosh('whoosh_s', 0.45, 900, 6500, 0.6)
whoosh('whoosh_m', 0.8, 500, 7500, 0.58, body=0.3)
whoosh('whoosh_l', 1.4, 300, 8500, 0.55, body=0.6, pan=(-0.5, 0.5))
whoosh('whoosh_xl', 2.4, 160, 7000, 0.52, body=0.9, pan=(-0.6, 0.6), width=2.6)
# out: falls in pitch, loudest early
whoosh('out_xs', 0.22, 8000, 2000, 0.3)
whoosh('out_s', 0.5, 6000, 700, 0.3)
whoosh('out_m', 0.9, 7000, 400, 0.3, body=0.3)
whoosh('swish', 0.24, 3000, 8500, 0.5, gain=0.7)
whoosh('swish_long', 0.55, 2000, 8000, 0.5, gain=0.7)

# ---------------------------------------------------------------- risers and reverses
def riser(name, dur, f0=250, f1=9000, tone=True, sub=True):
    t = t_(dur)
    x = np.zeros_like(t)
    src = noise(dur)
    bands = 26
    for k in range(bands):
        fc = f0 * (f1 / f0) ** (k / (bands - 1))
        tk = dur * (k / (bands - 1)) ** 0.8
        g = np.exp(-0.5 * ((t - tk) / (dur * 0.12)) ** 2)
        x += bp(src, fc * 0.7, fc * 1.4) * g
    x *= (t / dur) ** 2.2
    if tone:
        f = 180 * (6 ** (t / dur) ** 1.5)
        x += 0.45 * sine(f, t) * (t / dur) ** 2.5 + 0.2 * sine(f * 2.01, t) * (t / dur) ** 3
    if sub:
        x += 0.8 * sine(40 + 50 * (t / dur) ** 2, t) * (t / dur) ** 1.6
    x[-int(0.035 * SR):] *= np.linspace(1, 0, int(0.035 * SR)) ** 0.5  # the suck-out right before the hit
    st = np.stack([x, np.roll(x, 60)], axis=1)
    finish(name, st, peak=dur, tail_fade=0.01)


riser('riser', 2.0)
riser('riser_short', 1.0, f0=400, f1=10000)


def reverse_of(name, src, take):
    x, _ = lib[src]
    n = int(take * SR)
    r = x[:n][::-1].copy()
    r *= np.linspace(0.2, 1, len(r))[:, None] ** 1.5
    finish(name, r, peak=take, tail_fade=0.004)


reverse_of('reverse_swell', 'hit_big', 1.1)

# ---------------------------------------------------------------- tonal: gauge, seam, bells, blips
def gauge_sweep():
    dur = 1.0
    t = t_(dur)
    p = 0.45
    amp = np.where(t < p * dur, (t / (p * dur)) ** 1.6, ((dur - t) / (dur * (1 - p))) ** 2.0)
    f = 220 * (7 ** np.clip(t / dur / 0.9, 0, 1) ** 1.2)
    tone = (signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * 0.5 + sine(f * 1.005, t) * 0.5)
    tone = lp(tone, 3200)
    air = bp(noise(dur), 1500, 7000) * 0.35
    x = (tone * 0.6 + air) * amp
    # faint servo ticks along the sweep
    for k in range(10):
        i = int((0.1 + 0.07 * k) * SR)
        x[i:i + 300] += np.hanning(300) * 0.08 * np.sign(np.sin(np.arange(300) / 2))
    finish('gauge_sweep', stereo(x), peak=p * dur)


gauge_sweep()


def seam():
    dur = 0.6
    t = t_(dur)
    f = 250 * (14 ** (t / dur))
    x = sine(f + 120 * np.sin(2 * np.pi * 38 * t), t) * (t / dur) ** 1.4
    x += bp(noise(dur), 3000, 12000) * (t / dur) ** 2 * 0.4
    x *= np.minimum(1, (dur - t) / 0.05)
    finish('seam', stereo(x), peak=dur * 0.95)


seam()


def shimmer():
    dur = 2.6
    t = t_(dur)
    x = hp(noise(dur), 5000) * 0.6
    x *= (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t)) * np.minimum(1, t / 1.0) ** 1.5 * np.minimum(1, (dur - t) / 0.8)
    st = np.stack([x, np.roll(x, 90)], axis=1)
    finish('shimmer', st * 0.5, peak=1.0)


shimmer()


def bell(name, base, dur=1.5, soft=True, mono=False):
    t = t_(dur)
    x = np.zeros_like(t)
    for ratio, a, tau in [(1.0, 1.0, 0.9), (2.76, 0.5, 0.5), (5.4, 0.28, 0.3), (8.93, 0.14, 0.18)]:
        x += sine(np.full_like(t, base * ratio), t) * a * expd(t, tau)
    x *= np.minimum(1, t / (0.004 if soft else 0.001))
    x += bp(noise(dur), 4000, 12000) * expd(t, 0.004) * 0.25
    finish(name, x, peak=0.0, mono=mono)


bell('ding', 1568, 1.6)
bell('ding_hi', 2093, 1.2)


def bell_ring():
    dur = 1.6
    out = np.zeros(int(dur * SR))
    d, _ = lib['ding_hi']
    d = d[:, 0] if d.ndim == 2 else d
    for k, g in enumerate([1.0, 0.8, 0.9, 0.65, 0.6, 0.4, 0.3, 0.2]):
        i = int(k * 0.11 * SR)
        n = min(len(d), len(out) - i)
        out[i:i + n] += d[:n] * g * np.exp(-k * 0.12)
    finish('bell_ring', stereo(out), peak=0.0)


bell_ring()

SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19]  # major pentatonic over two octaves
for i, semi in enumerate(SCALE):
    f = 523.25 * 2 ** (semi / 12)
    t = t_(0.5)
    x = sine(np.full_like(t, f), t) * expd(t, 0.11) + 0.35 * sine(np.full_like(t, f * 2), t) * expd(t, 0.06)
    x += 0.12 * sine(np.full_like(t, f * 3), t) * expd(t, 0.04)
    x *= np.minimum(1, t / 0.003)
    x += bp(noise(0.5), 3000, 9000) * expd(t, 0.003) * 0.15
    finish(f'blip_{i}', x, peak=0.0, mono=True)

# ---------------------------------------------------------------- ticks (odometer, UI)
for i, (f, tau) in enumerate([(2300, 0.006), (1700, 0.007), (2900, 0.005)]):
    t = t_(0.06)
    x = sine(np.full_like(t, f), t) * expd(t, tau) + bp(noise(0.06), 1000, 7000) * expd(t, 0.003) * 1.0
    x += sine(np.full_like(t, 800 + 100 * i), t) * expd(t, 0.012) * 0.5
    finish(f'tick_{i}', x, peak=0.0, mono=True)

# ---------------------------------------------------------------- map, pin, rise and sink
def rise_up():
    dur = 0.9
    t = t_(dur)
    p = 0.55
    amp = np.where(t < p * dur, (t / (p * dur)) ** 1.8, expd(t - p * dur, 0.12))
    f = 38 + 85 * (t / dur) ** 1.3
    x = sine(f, t) * amp * 1.1 + lp(noise(dur), 300) * amp * 0.5
    finish('rise_up', stereo(x), peak=p * dur)


def sink_down():
    dur = 1.0
    t = t_(dur)
    f = 40 + 110 * expd(t, 0.22)
    x = sine(f, t) * expd(t, 0.4) * 1.0 + lp(noise(dur), 260) * expd(t, 0.15) * 0.5
    x *= np.minimum(1, t / 0.01)
    finish('sink_down', stereo(x), peak=0.0)


rise_up()
sink_down()


def pin_land():
    t = t_(0.7)
    x = sine(120 * (1 + 0.6 * expd(t, 0.03)), t) * expd(t, 0.09) * 1.2
    x += sine(np.full_like(t, 1100), t) * expd(t, 0.2) * 0.35 + sine(np.full_like(t, 2400), t) * expd(t, 0.1) * 0.2
    x += bp(noise(0.7), 2000, 8000) * expd(t, 0.008) * 0.6
    finish('pin_land', room(x, rt=0.5, wet=0.15), peak=0.0)


pin_land()


def ping(name, f, dur=1.3):
    t = t_(dur)
    x = sine(np.full_like(t, f), t) * expd(t, 0.22) * 0.9 + sine(np.full_like(t, f * 2.01), t) * expd(t, 0.12) * 0.25
    x *= np.minimum(1, t / 0.004)
    out = x.copy()
    for k, g in enumerate([0.45, 0.25, 0.12]):  # sonar echoes
        d = int((0.21 + 0.18 * k) * SR)
        out[d:] += g * x[:-d]
    finish(name, stereo(out), peak=0.0)


ping('ping', 1250)
ping('ping_lo', 880)

# ---------------------------------------------------------------- glitch, click, pop, draw, wave
def glitch():
    dur = 0.5
    t = t_(dur)
    seg = noise(dur) * (rng.random(len(t) // 240 + 1).repeat(240)[: len(t)] > 0.45)
    seg = np.round(seg * 4) / 4  # bit-crush
    f = 5000 * expd(t, 0.09) + 150
    x = (seg * 0.6 + sine(f, t) * 0.7) * expd(t, 0.12)
    x += sine(55 * (1 + expd(t, 0.05)), t) * expd(t, 0.3) * 1.2
    finish('glitch', stereo(x), peak=0.0)


glitch()


def mouse_click():
    t = t_(0.2)
    x = bp(noise(0.2), 1500, 9000) * expd(t, 0.003) * 1.0 + sine(np.full_like(t, 3400), t) * expd(t, 0.004) * 0.6
    up = np.zeros_like(x)
    d = int(0.085 * SR)
    up[d:] = 0.45 * x[:-d]
    finish('click', x + up, peak=0.0, mono=True)


def pop():
    t = t_(0.4)
    f = 380 + 700 * (1 - expd(t, 0.03))
    x = sine(f, t) * expd(t, 0.07) * 1.0 + sine(f * 2, t) * expd(t, 0.04) * 0.3
    finish('pop', x, peak=0.0, mono=True)


mouse_click()
pop()


def icon_draw():
    dur = 0.32
    t = t_(dur)
    x = bp(noise(dur), 2600, 5200) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * t)) * np.sin(np.pi * t / dur) ** 0.7 * 0.5
    finish('icon_draw', x, peak=0.15, mono=True)


icon_draw()


def wave_swell():
    dur = 3.4
    t = t_(dur)
    p = 0.55
    amp = np.where(t < p * dur, (t / (p * dur)) ** 1.5, ((dur - t) / (dur * (1 - p))) ** 1.6)
    low = sine(55 + 20 * (t / dur), t) * 0.9 + lp(noise(dur), 420) * 0.7
    air = bp(noise(dur), 800, 5000) * 0.25
    x = (low + air) * amp
    finish('wave_swell', stereo(x), peak=p * dur)


wave_swell()

# ---------------------------------------------------------------- write
def write_wav(path, x):
    pcm = np.clip(x, -1, 1)
    pcm = (pcm * 32767).astype('<i2')
    ch = 1 if pcm.ndim == 1 else pcm.shape[1]
    with wave.open(path, 'wb') as w:
        w.setnchannels(ch)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


manifest = {}
for name, (x, peak) in sorted(lib.items()):
    write_wav(os.path.join(OUT, f'{name}.wav'), x)
    manifest[name] = {'dur': round(len(x) / SR, 4), 'peak': round(peak, 4)}

with open(MANIFEST, 'w') as f:
    json.dump(manifest, f, indent=1, sort_keys=True)

total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
print(f'{len(manifest)} sounds, {total / 1e6:.1f} MB -> {os.path.relpath(OUT)}')
