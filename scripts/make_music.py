#!/usr/bin/env python3
"""
PayRanked music bed, composed and synthesised from scratch (nothing to license).

    python3 scripts/make_music.py        # writes public/music.mp3 (9:02, 48 kHz stereo)

One piece in D minor at 96 BPM (a bar is 2.5 s, so the 25 / 30 / 35 s reveals are exactly 10 / 12 / 14 bars and every
reveal starts on a downbeat). The key never changes: the SFX library's note ladders (blips, dings, bells) are all
inside D natural minor, so nothing the effects play can clash with the bed.

The arrangement follows the video, section by section, and each section has its own grid starting on its first frame:

  Shot 1  0:00  sparse and ticking, builds under the counts, a snare roll into the gap slam, then thin and alone
          under the amber number, then a groove for the chips
  Shot 2  0:30  silent (the intro carries its own sound)
  Shot 3  0:33  calm, curious: pad, soft plucks, a pulse that wakes up at the formula, a build into the countdown
  Shot 4  1:30  the countdown. Nine reveals on one engine that gets bigger every time (level 1 -> 5): kick and bass,
          then hats, clap and arps, then the bell motif, then everything for #1
  Shot 5  5:35  moodier: airy wave, a steady groove for the rows, a build, a one-beat drop-out on the interrupt
          (bar 34 starts exactly on it), a bright groove while the states light up, then it settles
  Shot 6  7:45  warm recap groove, stripped back for the next-video card, pad and arps on the end screen

Layers: pad (detuned saws), pulse bass, plucks through a ping-pong delay, FM bell motif, kick, clap/snare, hats, risers.
Pads, bass and plucks are sidechained to the kick (the pump). Everything shares one stereo room.

Needs numpy, scipy, ffmpeg. Deterministic.
"""
import os
import subprocess
import wave

import numpy as np
from scipy import signal

SR = 48000
BPM = 96
BEAT = 60 / BPM  # 0.625 s
BAR = 4 * BEAT  # 2.5 s
S16 = BEAT / 4
TOTAL = 542.0
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'public', 'music.mp3')
rng = np.random.default_rng(96)
N = int(TOTAL * SR)

# buses (stereo): drums stay punchy, `mus` is sidechained, `wet` feeds the room
drums = np.zeros((N, 2), np.float32)
mus = np.zeros((N, 2), np.float32)
wet = np.zeros((N, 2), np.float32)
kicks: list[float] = []


# ---------------------------------------------------------------- building blocks
def tt(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, o=2):
    return signal.sosfilt(signal.butter(o, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, o=2):
    return signal.sosfilt(signal.butter(o, f, 'high', fs=SR, output='sos'), x)


def bp(x, a, b, o=2):
    return signal.sosfilt(signal.butter(o, [a, min(b, SR * 0.45)], 'band', fs=SR, output='sos'), x)


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


def saw(f, t, nh=None):
    nh = nh or int(min(24, 9000 / f))
    return sum(np.sin(2 * np.pi * k * f * t) / k for k in range(1, nh + 1)) * 0.6


def put(bus, x, t, g=1.0, pan=0.0):
    """Add mono x to a stereo bus at time t seconds. pan -1..1, equal power."""
    i = int(t * SR)
    if i >= N or i + len(x) <= 0:
        return
    a = max(0, -i)
    n = min(len(x) - a, N - max(i, 0))
    th = (pan + 1) * np.pi / 4
    seg = x[a:a + n].astype(np.float32) * g
    j = max(i, 0)
    bus[j:j + n, 0] += seg * np.cos(th)
    bus[j:j + n, 1] += seg * np.sin(th)


def put2(bus, xl, xr, t, g=1.0):
    i = int(t * SR)
    if i >= N:
        return
    n = min(len(xl), N - i)
    bus[i:i + n, 0] += xl[:n].astype(np.float32) * g
    bus[i:i + n, 1] += xr[:n].astype(np.float32) * g


# ---------------------------------------------------------------- instruments (cached)
_cache: dict = {}


def cached(key, fn):
    if key not in _cache:
        _cache[key] = fn()
    return _cache[key]


def kick_w():
    t = tt(0.45)
    f = 46 + 90 * np.exp(-t / 0.035)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    x += bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t / 0.006) * 0.5
    return np.tanh(x * 1.6) * 0.9


def clap_w():
    t = tt(0.3)
    n = rng.standard_normal(len(t))
    env = sum(np.exp(-np.clip(t - d, 0, None) / 0.018) * (t >= d) for d in (0, 0.011, 0.022)) * 0.6
    env += np.exp(-np.clip(t - 0.03, 0, None) / 0.09) * (t >= 0.03)
    return bp(n, 900, 5500) * env * 0.9


def snare_w():
    t = tt(0.3)
    x = bp(rng.standard_normal(len(t)), 1800, 9000) * np.exp(-t / 0.07) + np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05) * 0.6
    return x


def hat_w(open_=False):
    t = tt(0.25 if open_ else 0.06)
    return hp(rng.standard_normal(len(t)), 7500) * np.exp(-t / (0.09 if open_ else 0.012))


def crash_w():
    t = tt(3.0)
    return hp(rng.standard_normal(len(t)), 3500) * np.exp(-t / 0.9) * 0.7


def pad_w(root, notes):
    """Chord: three detuned saws per note, left and right slightly different, slow attack and release."""
    d = BAR + 1.4
    t = tt(d)
    L = np.zeros(len(t))
    R = np.zeros(len(t))
    for n in notes:
        f = mtof(root + n)
        for det, side in [(-9, 0), (0, 2), (9, 1)]:
            w = saw(f * 2 ** (det / 1200), t, nh=8)
            if side in (0, 2):
                L += w
            if side in (1, 2):
                R += w
    env = np.minimum(1, t / 0.9) * np.minimum(1, (d - t) / 1.2)
    return lp(L, 2400) * env * 0.09, lp(R, 2400) * env * 0.09


def bass_w(m, d):
    t = tt(d)
    f = mtof(m)
    x = np.sin(2 * np.pi * f * t) + 0.45 * lp(saw(f, t, nh=6), 600)
    env = np.minimum(1, t / 0.006) * np.minimum(1, (d - t) / 0.05) * (0.55 + 0.45 * np.exp(-t / 0.18))
    return np.tanh(x * env * 1.3) * 0.8


def pluck_w(m):
    t = tt(0.5)
    f = mtof(m)
    x = saw(f, t, nh=10) * np.exp(-t / 0.11)
    return lp(x, 4200) * 0.35


def bell_w(m, d=1.8):
    t = tt(d)
    f = mtof(m)
    idx = 2.2 * np.exp(-t / 0.35)
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t)) * np.exp(-t / 0.85)
    return x * 0.3


def swell_w(d, up=True):
    t = tt(d)
    n = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    bands = 18
    for k in range(bands):
        fc = 300 * (9000 / 300) ** (k / (bands - 1))
        tk = d * (k / (bands - 1))
        out += bp(n, fc * 0.7, fc * 1.4) * np.exp(-0.5 * ((t - tk) / (d * 0.14)) ** 2)
    out *= (t / d) ** 2
    return out * 0.5


# ---------------------------------------------------------------- harmony: Dm - Bb - F - C
D3 = 50
PROG = [(0, [0, 3, 7]), (-4, [0, 4, 7]), (3, [0, 4, 7]), (-2, [0, 4, 7])]
MINOR = [0, 2, 3, 5, 7, 8, 10]  # D natural minor, semitones from D


def chord(bar):
    return PROG[bar % 4]


def arp_notes(bar):
    r, ch = chord(bar)
    base = D3 + 12 + r
    return [base + c for c in ch] + [base + 12]


def add_kick(t, g=1.0):
    kicks.append(t)
    put(drums, cached('kick', kick_w), t, g)


def add_hat(t, g=0.3, open_=False, pan=0.2):
    put(drums, cached('hat_o' if open_ else 'hat', lambda: hat_w(open_)), t, g, pan)


def add_clap(t, g=0.5):
    put(drums, cached('clap', clap_w), t, g)
    put(wet, cached('clap', clap_w), t, g * 0.5)


def add_pad(t, bar, g=1.0):
    r, ch = chord(bar)
    l, rr = cached(('pad', r % 12, tuple(ch)), lambda: pad_w(D3 - 12 + r + 12, ch))
    put2(mus, l, rr, t, g)
    put2(wet, l, rr, t, g * 0.4)


def add_bass(t, bar, kind, g=1.0, d=None):
    r, _ = chord(bar)
    m = D3 - 24 + r + 12 if r < 0 else D3 - 24 + r + 12
    put(mus, cached(('bass', m, round(d or S16 * 3, 3)), lambda: bass_w(m, d or S16 * 3)), t, g)


def add_pluck(t, m, g=0.5, pan=0.0, echo=True):
    w = cached(('pluck', m), lambda: pluck_w(m))
    put(mus, w, t, g, pan * 0.5)
    put(wet, w, t, g * 0.35, pan)
    if echo:  # ping-pong delay, dotted eighth
        dl = BEAT * 0.75
        put(mus, w, t + dl, g * 0.38, -0.6 if pan >= 0 else 0.6)
        put(mus, w, t + 2 * dl, g * 0.16, 0.6 if pan >= 0 else -0.6)


def add_bell(t, m, g=0.5, pan=0.0):
    w = cached(('bell', m), lambda: bell_w(m))
    put(mus, w, t, g, pan)
    put(wet, w, t, g * 0.6, pan)


def add_swell(t0, d, g=0.5):
    w = cached(('swell', d), lambda: swell_w(d))
    put(wet, w, t0, g)
    put(mus, w, t0, g * 0.6)


def snare_roll(t0, d, g=0.5):
    """Snare roll that accelerates and gets louder, ending at t0 + d."""
    t = t0
    gap = BEAT / 2
    while t < t0 + d - 0.02:
        frac = (t - t0) / d
        put(drums, cached('snare', snare_w), t, g * (0.3 + 0.7 * frac), 0.05)
        gap = max(S16 / 2, BEAT / 2 * (1 - frac) ** 1.2 + S16 / 2 * frac)
        t += gap


# ---------------------------------------------------------------- bar patterns
def groove(t0, bar, lv, vel=1.0):
    """One bar of drums, bass and plucks at energy level lv (0..5)."""
    if lv >= 1:
        for b in range(4):
            add_kick(t0 + b * BEAT, 0.62 * vel)
        for q in range(8):
            if q % 2 == 0 or lv >= 2:
                pass
        add_bass_pulse(t0, bar, 0.8 * vel, eighth=lv >= 2)
    if lv >= 2:
        for q in range(8):
            add_hat(t0 + q * BEAT / 2 + (BEAT / 4 if False else 0), 0.16 * vel + (0.05 if q % 2 else 0), pan=0.3 if q % 2 else -0.3)
        for q in range(4):
            add_hat(t0 + q * BEAT + BEAT / 2, 0.08, open_=True, pan=0.3) if lv >= 4 and q % 2 == 1 else None
    if lv >= 3:
        add_clap(t0 + BEAT, 0.42 * vel)
        add_clap(t0 + 3 * BEAT, 0.42 * vel)
        arp(t0, bar, step=2, g=0.34 * vel)
    if lv >= 4:
        for q in range(16):
            if q % 2 == 1:
                add_hat(t0 + q * S16, 0.09, pan=-0.25 if q % 4 == 1 else 0.25)
        arp(t0, bar, step=1, g=0.22 * vel, offset=1, octave=12)
    if lv >= 5:
        r, _ = chord(bar)
        mot = [D3 + 24 + r + MINOR[i] for i in (4, 2, 0, 2)]
        for q in range(4):
            add_bell(t0 + q * BEAT * 1.0 + (BEAT / 2 if q % 2 else 0), mot[q] if mot[q] < D3 + 36 else mot[q] - 12, 0.32 * vel, pan=-0.3 + 0.2 * q)


def add_bass_pulse(t0, bar, g, eighth):
    steps = 8 if eighth else 4
    for q in range(steps):
        d = BEAT / 2 * 0.8 if eighth else BEAT * 0.8
        add_bass(t0 + q * (BEAT / 2 if eighth else BEAT) + (0 if q % 2 == 0 or not eighth else BEAT / 2 * 0.0), bar, 'p', g * (1 if q % 2 == 0 else 0.7), d=d)


def arp(t0, bar, step=2, g=0.3, offset=0, octave=0):
    ns = arp_notes(bar)
    for q in range(16 // step):
        n = ns[(q * 3 + offset) % len(ns)] + octave
        add_pluck(t0 + (q * step + (offset if step == 1 else 0)) * S16, n, g * (1.0 if q % 4 == 0 else 0.75), pan=-0.5 + (q % 4) / 3, echo=(q % 2 == 0))


def pad_bar(t0, bar, g=1.0):
    add_pad(t0, bar, g)


def reveal_end_fx(t_end):
    add_swell(t_end - 1.6, 1.6, 0.18)


# ---------------------------------------------------------------- the arrangement
def shot1():
    t0 = 0.0
    for b in range(12):
        t = t0 + b * BAR
        if b <= 5 or b >= 8:
            pad_bar(t, b, 0.5 if b < 2 else 0.7)
        elif b < 8:
            pad_bar(t, b, 0.4)  # the amber number is alone: only the pad
        if 1 <= b <= 4:  # ticking data pluck
            arp(t, b, step=4 if b < 3 else 2, g=0.2 + 0.04 * b)
        if b in (2, 3):  # heartbeat, then hats
            add_kick(t, 0.5)
            add_kick(t + 2 * BEAT, 0.4)
            add_bass(t, b, 'p', 0.6, d=BEAT * 1.6)
        if b == 4:
            groove(t, b, 2, 0.8)
        if b == 5:  # build into the gap
            for q in range(4):
                add_kick(t + q * BEAT, 0.7)
            add_bass_pulse(t, b, 0.8, True)
            add_swell(t, 2.3, 0.35)
            snare_roll(t + BAR / 2, 14.8 - (t + BAR / 2), 0.55)
        if b == 6 or b == 7:
            add_bass(t, b, 'p', 0.5, d=BAR * 0.9)
        if b >= 8:
            groove(t, b, 3 if b < 10 else 3, 0.85)
    put(drums, cached('crash', crash_w), 15.0, 0.5)
    put(wet, cached('crash', crash_w), 15.0, 0.4)


def shot3():
    t0 = 33.0
    n = int((90.0 - t0) // BAR) + 1
    for b in range(n):
        t = t0 + b * BAR
        if t >= 90.0:
            break
        g = min(1.0, 0.45 + 0.1 * b) if b < 5 else 0.9
        pad_bar(t, b, g)
        if b >= 3:
            arp(t, b, step=4 if b < 8 else 2, g=0.22 + (0.06 if b > 7 else 0))
        if b >= 2:
            add_bass(t, b, 'p', 0.55, d=BAR * 0.9)
        if b >= 4:
            add_kick(t, 0.38)
            add_kick(t + 2 * BEAT, 0.3)
        # the formula starts at 52 s (bar 7.6): the pulse wakes up
        if t >= 52.0:
            add_bass_pulse(t, b, 0.62, eighth=False)
            for q in range(4):
                add_kick(t + q * BEAT, 0.34)
        if t >= 65.0:  # the three limits (chips)
            for q in range(8):
                add_hat(t + q * BEAT / 2, 0.11, pan=0.3 if q % 2 else -0.3)
            add_clap(t + BEAT, 0.28)
            add_clap(t + 3 * BEAT, 0.28)
    # last two bars: a build into the countdown (the SFX riser sits on the last 2 s)
    add_swell(84.0, 6.0, 0.4)
    snare_roll(85.0, 5.0, 0.55)


LEVELS = [1, 2, 2, 3, 3, 4, 4, 5, 5]


def countdown(timeline_secs):
    t = 90.0
    for idx, ln in enumerate(timeline_secs):
        lv = LEVELS[idx]
        bars = int(ln / BAR)
        for b in range(bars):
            tb = t + b * BAR
            pad_bar(tb, b, 0.75 + 0.04 * lv)
            # restraint: the first bar after the slam is lighter, the middle sections hold, the lock-in bar lifts
            vel = 0.55 if b == 0 else 1.0
            use = lv if b >= 1 else max(1, lv - 2)
            if b == bars - 1:
                use = max(1, lv - 1)
            groove(tb, b, use, vel)
        put(drums, cached('crash', crash_w), t, 0.45 + 0.05 * lv)
        put(wet, cached('crash', crash_w), t, 0.3)
        reveal_end_fx(t + ln)
        if idx == len(timeline_secs) - 1:
            add_swell(t + ln - 5.0, 5.0, 0.3)
        t += ln
    return t


def shot5():
    t0 = 335.0
    for b in range(52):
        t = t0 + b * BAR
        s = b * BAR
        pad_bar(t, b, 0.9 if s < 25 else 0.75)
        if s < 25:  # airy wave
            arp(t, b, step=4, g=0.16 + 0.01 * b)
            if b >= 4:
                add_bass(t, b, 'p', 0.5, d=BAR * 0.9)
        elif s < 60:  # rows: a steady half-time groove
            add_kick(t, 0.6)
            add_kick(t + 2.5 * BEAT, 0.45)
            add_bass_pulse(t, b, 0.75, eighth=True)
            for q in range(16):
                if q % 2 == 0:
                    add_hat(t + q * S16, 0.1 + (0.05 if q % 4 == 2 else 0), pan=0.25 if q % 4 else -0.25)
            add_clap(t + 2 * BEAT, 0.38)
            arp(t, b, step=4, g=0.2)
        elif s < 85:  # bars: build
            groove(t, b, 3 if s < 72 else 4, 0.95)
            if s >= 72:
                add_swell(t, BAR, 0.1 + 0.02 * (s - 72))
        elif s < 115:  # the states light up
            if b == 34:
                groove(t + 0.0, b, 5, 1.0)
                put(drums, cached('crash', crash_w), t, 0.55)
            else:
                groove(t, b, 4 if s < 100 else 5, 1.0)
        else:  # settle
            fade = 1 - (s - 115) / 15 * 0.5
            if b == 46:
                put(drums, cached('crash', crash_w), t, 0.35)
            add_bell(t, D3 + 24 + chord(b)[0] + 7, 0.3 * fade, pan=-0.3)
            if b % 2 == 0:
                arp(t, b, step=4, g=0.17 * fade)
    # the interrupt at 85.0 s: everything stops for the last 0.35 s of bar 33, then lands on the downbeat
    mute(335 + 85.0 - 0.45, 335 + 85.0)
    add_swell(335 + 82.0, 3.0, 0.25)


def shot6():
    t0 = 465.0
    for b in range(30):
        t = t0 + b * BAR
        s = b * BAR
        pad_bar(t, b, 0.85 if s < 55 else 0.95)
        if s < 25:  # recap cards: warm, full groove
            groove(t, b, 3 if b else 2, 0.9)
            if b == 0:
                put(drums, cached('crash', crash_w), t, 0.4)
        elif s < 35:  # next-video build-up: stripped
            add_kick(t, 0.5)
            add_bass_pulse(t, b, 0.6, eighth=False)
            arp(t, b, step=4, g=0.2)
        elif s < 55:  # next video / subscribe
            groove(t, b, 2 if s < 42.5 else 3, 0.85)
            if b % 2 == 0:
                add_bell(t + BEAT * 2, D3 + 24 + chord(b)[0] + 12 if chord(b)[0] < 0 else D3 + 24 + chord(b)[0] + 7, 0.28, pan=0.3)
        else:  # end screen: pad and arps, ringing out
            if b == 22:
                put(drums, cached('crash', crash_w), t, 0.35)
            arp(t, b, step=4, g=0.2)
            if b % 2 == 0:
                add_bell(t, D3 + 24 + chord(b)[0] + 7, 0.24, pan=-0.25)


def mute(a, b):
    """Hard dip on every bus: used for the one-beat drop-out before the interrupt."""
    i, j = int(a * SR), int(b * SR)
    ramp = np.linspace(1, 0, int(0.04 * SR))[:, None]
    for bus in (drums, mus, wet):
        bus[i:i + len(ramp)] *= ramp
        bus[i + len(ramp):j] = 0


# ---------------------------------------------------------------- run
def main():
    print('arranging...')
    shot1()
    shot3()
    # reveal lengths from the project timeline: 10 tie 30, then 25s, ..., 3 tie 30, #1 35
    lens = [30, 25, 25, 25, 25, 25, 30, 25, 35]
    end = countdown(lens)
    assert abs(end - 335.0) < 1e-6, end
    shot5()
    shot6()

    print('sidechain + room...')
    # sidechain: every kick ducks the pads, bass and plucks for about 120 ms
    env = np.ones(N, np.float32)
    pump = (1 - 0.62 * np.exp(-np.arange(int(0.35 * SR)) / (0.11 * SR))).astype(np.float32)
    for k in kicks:
        i = int(k * SR)
        n = min(len(pump), N - i)
        if n > 0:
            env[i:i + n] = np.minimum(env[i:i + n], pump[:n])
    mus[:] = mus * env[:, None]

    # one stereo room: 2.4 s decaying, darkening noise, different in each ear
    ir_n = int(2.4 * SR)
    tir = np.arange(ir_n) / SR
    irs = []
    for _ in range(2):
        ir = rng.standard_normal(ir_n) * np.exp(-tir / 0.62)
        ir = lp(ir, 5200)
        ir[: int(0.014 * SR)] = 0
        irs.append(ir / np.sqrt((ir ** 2).sum()))
    room = np.zeros((N, 2), np.float32)
    for c in range(2):
        room[:, c] = signal.oaconvolve(wet[:, c].astype(np.float64), irs[c], mode='full')[:N].astype(np.float32)

    mix = drums * 0.95 + mus * 1.0 + room * 1.6
    # light master glue: a soft knee, then set the level
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    mix = hp(mix.T, 28).T
    rms = np.sqrt((mix[: int(30 * SR)] ** 2).mean() + 1e-12)
    mix *= 10 ** (-16 / 20) / (np.sqrt((mix ** 2).mean()) + 1e-12)
    pk = np.abs(mix).max()
    if pk > 0.97:
        mix = np.tanh(mix / pk * 1.4) / np.tanh(1.4) * 0.97
    print(f'peak {np.abs(mix).max():.2f}, rms {20 * np.log10(np.sqrt((mix ** 2).mean())):.1f} dBFS')

    tmp = OUT.replace('.mp3', '.tmp.wav')
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-c:a', 'libmp3lame', '-b:a', '256k', OUT], check=True)
    os.remove(tmp)
    print(f'{os.path.relpath(OUT)}  {os.path.getsize(OUT) / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
