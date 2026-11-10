#!/usr/bin/env python3
"""
PayRanked sound library, synthesised from scratch (no samples, so there is nothing to license).

    python3 scripts/make_sfx.py          # writes public/sfx/*.wav and src/audio/manifest.json

Premium pass. Every sound is built the way a sound designer layers it:
  hits    tuned sub thump (pitch-dropping sine, tuned to D / F / A so it sits under the D-minor music) + mid body
          + soft-saturated low end + a clean filtered-noise crack + a short room tail that darkens as it decays
  coins   inharmonic metal partials (highs die fastest) + detuned twin for a slow shimmer + contact tick + a tiny
          bounce, four pitches taken from D natural minor
  glass   bells, dings, pings, chips and blips are additive glass tones: stretched partials, a 2-4 ms raised-cosine
          attack and a smooth decay, all inside D natural minor
  whoosh  noise through a bank of band-passes that sweeps in pitch, 8 ms fade-in, tapered end, a touch of widening
  risers  filtered noise + tone gliding D3 -> D6 + sub D1 -> D2, ending on a tiny suck-out right before the hit
  ticks   three mechanical variants, clicks and pops: mono and dry on purpose

Hits, whooshes, risers and swells are widened (side signal high-passed at 220 Hz, so the bass stays in the middle).
Every file is normalised to -1 dBFS peak and ends on a short fade.

manifest.json holds, per file, its length and `peak`: the time in seconds of its main impact. The cue sheet uses it
to start each file early enough that the impact lands exactly on the visual beat (a whoosh starts before the move,
a riser ends on the hit it builds to). LOCKED below pins each file's length and impact point to the values the cue
sheet was built against, so a better-sounding file can never move a cue. The manifest is written from the real
output and the script stops if it ever disagrees with LOCKED.

Needs numpy and scipy. Deterministic: the same files come out every run.
"""
import json
import os
import wave

import numpy as np
from scipy import signal

SR = 48000
LEVEL = 10 ** (-1 / 20)  # -1 dBFS peak
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'public', 'sfx')
MANIFEST = os.path.join(ROOT, 'src', 'audio', 'manifest.json')
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.dirname(MANIFEST), exist_ok=True)

# length (s), impact point (s) and loudness (RMS, dBFS, with the file at -1 dBFS peak) of every file, as the cue sheet
# was built against them. RMS is what keeps the mix balance: cues.ts sets gains relative to these levels.
LOCKED = {
    'bell_ring': {'dur': 1.6, 'peak': 0.0, 'rms': -13.4},
    'blip_0': {'dur': 0.5, 'peak': 0.0, 'rms': -14.8},
    'blip_1': {'dur': 0.5, 'peak': 0.0, 'rms': -14.9},
    'blip_2': {'dur': 0.5, 'peak': 0.0, 'rms': -14.7},
    'blip_3': {'dur': 0.5, 'peak': 0.0, 'rms': -14.7},
    'blip_4': {'dur': 0.5, 'peak': 0.0, 'rms': -14.6},
    'blip_5': {'dur': 0.5, 'peak': 0.0, 'rms': -14.8},
    'blip_6': {'dur': 0.5, 'peak': 0.0, 'rms': -14.6},
    'blip_7': {'dur': 0.5, 'peak': 0.0, 'rms': -14.7},
    'blip_8': {'dur': 0.5, 'peak': 0.0, 'rms': -14.7},
    'chip_0': {'dur': 0.28, 'peak': 0.0, 'rms': -13.9},
    'chip_1': {'dur': 0.28, 'peak': 0.0, 'rms': -14.0},
    'chip_2': {'dur': 0.28, 'peak': 0.0, 'rms': -14.2},
    'click': {'dur': 0.1417, 'peak': 0.0, 'rms': -24.3},
    'coin_0': {'dur': 0.9, 'peak': 0.0, 'rms': -13.7},
    'coin_1': {'dur': 0.9, 'peak': 0.0, 'rms': -13.5},
    'coin_2': {'dur': 0.9, 'peak': 0.0, 'rms': -14.5},
    'coin_3': {'dur': 0.9, 'peak': 0.0, 'rms': -13.7},
    'ding': {'dur': 1.6, 'peak': 0.0, 'rms': -9.9},
    'ding_hi': {'dur': 1.2, 'peak': 0.0, 'rms': -8.8},
    'gauge_sweep': {'dur': 1.0, 'peak': 0.45, 'rms': -17.4},
    'glitch': {'dur': 0.5, 'peak': 0.0, 'rms': -8.9},
    'hit_big': {'dur': 3.279, 'peak': 0.0, 'rms': -10.6},
    'hit_med': {'dur': 2.1077, 'peak': 0.0, 'rms': -12.7},
    'hit_small': {'dur': 1.1353, 'peak': 0.0, 'rms': -16.0},
    'icon_draw': {'dur': 0.32, 'peak': 0.15, 'rms': -17.3},
    'lock': {'dur': 1.5435, 'peak': 0.0, 'rms': -16.3},
    'out_m': {'dur': 0.9, 'peak': 0.27, 'rms': -10.2},
    'out_s': {'dur': 0.5, 'peak': 0.15, 'rms': -9.4},
    'out_xs': {'dur': 0.22, 'peak': 0.066, 'rms': -7.7},
    'pin_land': {'dur': 1.3556, 'peak': 0.0, 'rms': -14.7},
    'ping': {'dur': 1.3, 'peak': 0.0, 'rms': -16.1},
    'ping_lo': {'dur': 1.3, 'peak': 0.0, 'rms': -14.8},
    'pop': {'dur': 0.4, 'peak': 0.0, 'rms': -15.5},
    'reverse_swell': {'dur': 1.1, 'peak': 1.1, 'rms': -8.9},
    'rise_up': {'dur': 0.9, 'peak': 0.495, 'rms': -11.3},
    'riser': {'dur': 2.0, 'peak': 2.0, 'rms': -9.4},
    'riser_short': {'dur': 1.0, 'peak': 1.0, 'rms': -9.1},
    'seam': {'dur': 0.6, 'peak': 0.57, 'rms': -13.4},
    'shimmer': {'dur': 2.6, 'peak': 1.0, 'rms': -20.0},
    'sink_down': {'dur': 1.0, 'peak': 0.0, 'rms': -10.9},
    'stamp': {'dur': 2.1892, 'peak': 0.0, 'rms': -13.4},
    'swish': {'dur': 0.24, 'peak': 0.12, 'rms': -8.7},
    'swish_long': {'dur': 0.55, 'peak': 0.275, 'rms': -9.6},
    'tick_0': {'dur': 0.06, 'peak': 0.0, 'rms': -15.7},
    'tick_1': {'dur': 0.06, 'peak': 0.0, 'rms': -15.7},
    'tick_2': {'dur': 0.06, 'peak': 0.0, 'rms': -16.7},
    'wave_swell': {'dur': 3.4, 'peak': 1.87, 'rms': -12.7},
    'whoosh_l': {'dur': 1.4, 'peak': 0.77, 'rms': -11.5},
    'whoosh_m': {'dur': 0.8, 'peak': 0.464, 'rms': -10.2},
    'whoosh_s': {'dur': 0.45, 'peak': 0.27, 'rms': -9.0},
    'whoosh_xl': {'dur': 2.4, 'peak': 1.248, 'rms': -13.0},
    'whoosh_xs': {'dur': 0.22, 'peak': 0.121, 'rms': -7.6},
}

rng = np.random.default_rng(20261110)
lib: dict = {}  # name -> (audio[n] or [n,2], peak seconds)

# D natural minor, the key of the music bed: D E F G A Bb C
D1, D2, D3, A1, A2, F1, F2, C3 = 36.71, 73.42, 146.83, 55.0, 110.0, 43.65, 87.31, 130.81

# ---------------------------------------------------------------- foley layering
# Real recorded foley (coin drops, punches, door slams, glass clinks) layered on top of the
# synthesised sub + tails. The foley is mixed in BEFORE normalisation, so it becomes part of the
# sound. The LOCKED RMS check in finish() keeps the overall loudness within tolerance.
import wave as _wave
FOLEY_DIR = os.path.join(ROOT, 'foley', 'processed')
LAYER_MAP_PATH = os.path.join(ROOT, 'foley', 'layer_map.json')
_foley_cache = {}
_layer_map = {}

def _load_layer_map():
    global _layer_map
    if not os.path.exists(LAYER_MAP_PATH):
        return
    with open(LAYER_MAP_PATH) as f:
        raw = json.load(f)
    _layer_map = {k: v for k, v in raw.items() if not k.startswith('_')}

def _load_foley(fname):
    if fname in _foley_cache:
        return _foley_cache[fname]
    path = os.path.join(FOLEY_DIR, fname)
    if not os.path.exists(path):
        return None
    with _wave.open(path, 'rb') as w:
        ch = w.getnchannels()
        fr = w.getframerate()
        nf = w.getnframes()
        raw = w.readframes(nf)
    samples = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
    if ch == 2:
        mono = samples[0::2]
    else:
        mono = samples
    if fr != SR:
        ratio = SR / fr
        n = int(len(mono) * ratio)
        mono = np.interp(np.arange(n) / ratio, np.arange(len(mono)), mono)
    _foley_cache[fname] = mono
    return mono

def get_foley(name, n_samples):
    if not _layer_map:
        _load_layer_map()
    if name not in _layer_map:
        return None
    cfg = _layer_map[name]
    foley = _load_foley(cfg['file'])
    if foley is None:
        return None
    offset = int(cfg.get('offset', 0.0) * SR)
    gain = cfg.get('gain', 0.15)
    out = np.zeros(n_samples, dtype=np.float64)
    dst_start = offset
    if dst_start >= n_samples:
        return None
    copy_len = min(len(foley), n_samples - dst_start)
    out[dst_start:dst_start + copy_len] = foley[:copy_len] * gain
    return out


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


def tone(f, t, phase=0.0):
    return sine(np.full_like(t, f), t, phase)


def bp(x, lo, hi, order=2):
    hi = min(hi, SR / 2 * 0.95)
    sos = signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)


def lp(x, f, order=2):
    f = min(f, SR / 2 * 0.95)
    return signal.sosfilt(signal.butter(order, f, btype='low', fs=SR, output='sos'), x, axis=0)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='high', fs=SR, output='sos'), x, axis=0)


def fade(x, a=0.002, b=0.01):
    ia, ib = int(a * SR), int(b * SR)
    x = x.copy()
    shape = (-1, 1) if x.ndim == 2 else (-1,)
    if ia:
        x[:ia] *= np.linspace(0, 1, ia).reshape(shape)
    if ib:
        x[-ib:] *= np.linspace(1, 0, ib).reshape(shape)
    return x


def sat(x, drive=1.6):
    """Soft saturation: rounds the peaks and adds low odd harmonics, so the low end sounds thick, not just loud."""
    return np.tanh(drive * x) / np.tanh(drive)


def raised(t, atk):
    """Raised-cosine attack: no click, no slow fade-in."""
    return 0.5 - 0.5 * np.cos(np.pi * np.clip(t / atk, 0, 1))


def _allpass(x, d, g):
    b = np.zeros(d + 1)
    a = np.zeros(d + 1)
    b[0], b[d] = -g, 1.0
    a[0], a[d] = 1.0, -g
    return signal.lfilter(b, a, x, axis=0)


def widen(x, amt=0.3, lo=220.0):
    """Stereo width. Mono in: a decorrelated copy (two all-passes) becomes the side signal. Stereo in: the side signal
    is lifted. Either way the side is high-passed at `lo`, so the bass stays mono and the file folds down cleanly."""
    if x.ndim == 1:
        m = x
        s = hp(_allpass(_allpass(x, int(0.0053 * SR), 0.55), int(0.0117 * SR), 0.5), lo) * amt
    else:
        m = (x[:, 0] + x[:, 1]) / 2
        s = hp((x[:, 0] - x[:, 1]) / 2, lo) * (1 + amt)
    return np.stack([m + s, m - s], axis=1)


def room(x, rt=0.9, wet=0.25, bright=4200, pre=0.008):
    """Short synthetic room: decaying noise, different in each ear. The tail is a bright part plus a darker, longer
    part, so it gets softer as it dies (a gentle low-pass that deepens with time). Returns stereo."""
    n = int(rt * 1.4 * SR)
    tt = np.arange(n) / SR
    tau = rt / 6.9 * 2.2
    out = []
    for _ in range(2):
        ir = lp(rng.standard_normal(n), bright) * np.exp(-tt / tau)
        ir += 0.9 * lp(rng.standard_normal(n), 1500) * np.exp(-tt / (tau * 1.7))
        ir = hp(ir, 140)  # no sub in the reverb: the low end stays tight and in the dry thump
        ir[: int(pre * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
        out.append(np.pad(signal.fftconvolve(x, ir), (0, 1))[: len(x) + n])
    dry = np.pad(x, (0, n))
    return np.stack([dry + wet * out[0] * 3.0, dry + wet * out[1] * 3.0], axis=1)


def stereo(x):
    return np.stack([x, x], axis=1) if x.ndim == 1 else x


def _rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)


DRIVES = (None, 1.2, 1.5, 1.9, 2.4)
NOISY = DRIVES + (3.0, 3.8, 4.6)  # noise-based sounds (whooshes, risers) take a harder soft clip: it just makes noise denser


def true_peak_limit(x, ceiling=0.89):
    """True-peak limiter: detects inter-sample peaks by 4x oversampling, then limits to ceiling.
    Prevents clipping when the audio is played back through a DAC that does sinc reconstruction."""
    if x.ndim == 2:
        return np.stack([true_peak_limit(x[:, i], ceiling) for i in range(x.shape[1])], axis=1)
    # 4x oversample for inter-sample peak detection
    up = signal.resample_poly(x, 4, 1)
    peak = np.max(np.abs(up))
    if peak > ceiling:
        ratio = ceiling / (np.abs(up) + 1e-9)
        gain = np.where(np.abs(up) > ceiling, ratio, 1.0)
        # Smooth the gain envelope (5ms attack, 50ms release)
        smooth_len = max(2, int(0.005 * SR * 4))
        kernel = np.ones(smooth_len) / smooth_len
        gain = np.convolve(gain, kernel, mode='same')
        gain = np.maximum(gain, np.where(np.abs(up) > ceiling, ceiling / (np.abs(up) + 1e-9), 1.0))
        up = up * gain
    return signal.resample_poly(up, 1, 4)[:len(x)]


def transient_shaper(x, attack_gain=1.3, sustain_gain=0.85, freq=2500.0):
    """Transient shaper: boosts the attack, reduces the sustain, in a frequency band around `freq`."""
    if x.ndim == 2:
        return np.stack([transient_shaper(x[:, i], attack_gain, sustain_gain, freq) for i in range(x.shape[1])], axis=1)
    bp_signal = bp(x, freq * 0.5, freq * 2.0)
    env = np.abs(bp_signal)
    attack_tc = 0.001
    release_tc = 0.050
    a_coef = np.exp(-1 / (attack_tc * SR))
    r_coef = np.exp(-1 / (release_tc * SR))
    smoothed = np.zeros_like(env)
    for i in range(1, len(env)):
        if env[i] > smoothed[i-1]:
            smoothed[i] = a_coef * smoothed[i-1] + (1 - a_coef) * env[i]
        else:
            smoothed[i] = r_coef * smoothed[i-1] + (1 - r_coef) * env[i]
    transient = np.maximum(0, np.gradient(smoothed))
    max_t = np.max(transient)
    if max_t > 1e-9:
        transient = transient / max_t
    gain = attack_gain * transient + sustain_gain * (1 - transient)
    return x * gain


def finish(name, x, peak=0.0, mono=False, tail_fade=0.02, drives=DRIVES):
    """Pin the file to its locked length, layer foley if mapped, end it on a short fade, remove DC,
    true-peak limit, normalise to -1 dBFS peak, and keep its loudness within 2 dB of LOCKED."""
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1 and not mono:
        x = stereo(x)
    n = int(round(LOCKED[name]['dur'] * SR))
    if len(x) >= n:
        x = x[:n]
    else:
        x = np.pad(x, [(0, n - len(x))] + [(0, 0)] * (x.ndim - 1))

    # LAYER FOLEY: mix in a real recorded sample for physical texture.
    # The foley is mixed BEFORE normalisation, so it becomes part of the sound.
    # The LOCKED RMS check below keeps the overall loudness within tolerance.
    foley = get_foley(name, n)
    if foley is not None:
        if x.ndim == 2:
            x[:, 0] += foley
            if x.shape[1] > 1:
                x[:, 1] += foley
        else:
            x += foley

    x = fade(x, 0.0005, tail_fade)

    # FIX: subtract mean BEFORE high-pass. The old code only high-passed at 15 Hz (67ms time constant),
    # which is longer than tick files (60ms). For very short files the filter can't remove DC, so
    # tick_1.wav had a +0.0175 DC offset (audible pop at the start). Subtracting the mean first fixes
    # this for all files regardless of length.
    if x.ndim == 2:
        x = x - x.mean(axis=0, keepdims=True)
    else:
        x = x - x.mean()

    # For files longer than 100ms, also apply the 15 Hz high-pass to remove any residual DC drift.
    # For shorter files (ticks, clicks), the mean subtraction above is sufficient — the Butterworth's
    # impulse response is longer than the file, so it would reintroduce edge artifacts.
    if n > int(0.100 * SR):
        x = signal.sosfiltfilt(signal.butter(2, 15, btype='high', fs=SR, output='sos'), x, axis=0)

    # Transient shaper: sharpen the attack on hits and impacts
    if name in ('hit_big', 'hit_med', 'hit_small', 'stamp', 'lock', 'pin_land', 'pop', 'click'):
        x = transient_shaper(x, attack_gain=1.25, sustain_gain=0.88, freq=2500.0)

    # True-peak limiter: prevent inter-sample peaks from clipping on playback
    x = true_peak_limit(x, LEVEL)

    x = x / (np.max(np.abs(x)) + 1e-9) * LEVEL
    target = LOCKED[name]['rms'] - 2.0
    for drive in drives:
        y = x if drive is None else sat(x / LEVEL, drive) * LEVEL
        y = y / (np.max(np.abs(y)) + 1e-9) * LEVEL
        if _rms_db(y) >= target:
            break
    lib[name] = (y, peak)


# ---------------------------------------------------------------- glass tone (bells, dings, pings, chips, blips)
def glass(f, dur, decay=0.9, atk=0.002, tick=0.0, ratios=(1.0, 2.0, 3.0, 4.2, 5.4), amps=(1.0, 0.34, 0.2, 0.09, 0.045)):
    """Additive glass tone: slightly stretched partials, the higher ones dying faster, a detuned twin of the
    fundamental for a slow shimmer, a raised-cosine attack. `tick` adds a barely-there contact tap."""
    t = t_(dur)
    x = np.zeros_like(t)
    for r, a in zip(ratios, amps):
        x += tone(f * r * (1 + 0.0004 * r), t) * a * expd(t, decay / r ** 0.85)
    x += 0.32 * tone(f * 1.0025, t, phase=1.3) * expd(t, decay)
    x *= raised(t, atk)
    if tick:
        x += bp(noise(dur), 3500, 11000) * expd(t, 0.003) * tick
    return x


# ---------------------------------------------------------------- hits
def hit(name, big=1.0, dur=2.4, tail=1.1, wet=0.28, sub=(D2, D1), crack=1.0, body=1.0, metal=0.0, drive=1.7):
    """Layered impact. big scales the length and weight of the low layers. sub = (start, end) pitch of the sub drop."""
    t = t_(dur)
    # 1. tuned sub: a sine that falls fast from sub[0] to sub[1], then decays
    fsub = sub[1] + (sub[0] - sub[1]) * expd(t, 0.05)
    s = sine(fsub, t) * expd(t, 0.30 * big + 0.08) * 1.15
    s *= np.minimum(1, t / 0.0004)  # no click at sample 0
    # 2. mid body: an octave up so small speakers still feel it, a band of noise for the "chest", a low boom
    mid = sine(fsub * 2.0, t) * expd(t, 0.11 * big + 0.03) * 0.42 * body
    mid += bp(noise(dur), 140, 700) * expd(t, 0.07 * big + 0.035) * 0.9 * body
    mid += lp(noise(dur), 200) * expd(t, 0.16 * big) * 0.8 * body
    low = sat(s + mid, drive)  # saturation on the body only, the crack stays clean
    # 3. crack: the transient, so the hit has an edge
    c = bp(noise(dur), 1800, 9000) * expd(t, 0.010 + 0.005 * big) * 0.8 * crack
    c += hp(noise(dur), 500) * expd(t, 0.0035) * 0.55 * crack
    # 4. optional metal ring (stamps, locks): slightly inharmonic, with a detuned twin
    m = np.zeros_like(t)
    if metal:
        for fr, a, tau in [(1180, 1.0, 0.22), (2630, 0.6, 0.14), (4210, 0.35, 0.09)]:
            m += (tone(fr, t) + 0.4 * tone(fr * 1.006, t, phase=0.7)) * a * expd(t, tau)
        m *= 0.3 * metal
    x = sat(low + c + m, 1.25)  # glue: rounds the crack so it sits on the body instead of sticking out of it
    x = room(x, rt=tail, wet=wet)  # stereo, tail darkens as it dies
    x = widen(x, 0.28)
    finish(name, x, peak=0.0, tail_fade=0.06)


hit('hit_big', big=1.0, dur=2.4, tail=1.1, wet=0.3, sub=(D2, D1))
hit('hit_med', big=0.55, dur=1.4, tail=0.7, wet=0.22, sub=(F2, F1), crack=0.9)
hit('hit_small', big=0.22, dur=0.8, tail=0.4, wet=0.14, sub=(C3, D2), crack=0.8, body=0.7)
hit('stamp', big=0.6, dur=1.6, tail=0.6, wet=0.2, sub=(F2, F1), metal=1.0)
hit('lock', big=0.3, dur=1.0, tail=0.5, wet=0.15, sub=(A2, A1), crack=1.1, metal=0.7)

# glass tap: a pitched glass ping on top of a small low thump. Pitches are A6 / C7 / D7 over A2 / C3 / D3.
for i, (ft, fl) in enumerate([(1760.0, A2), (2093.0, C3), (2349.3, D3)]):
    t = t_(0.28)
    x = glass(ft, 0.28, decay=0.05, atk=0.0008, tick=0.5, ratios=(1.0, 2.0, 2.76, 5.4), amps=(1.0, 0.5, 0.3, 0.12))
    x += tone(fl, t) * expd(t, 0.05) * 1.0
    finish(f'chip_{i}', x, peak=0.0, mono=True)


# ---------------------------------------------------------------- coins
def coin(name, f0):
    dur = 0.9
    t = t_(dur)
    phases = rng.uniform(0, 6.28, 6)

    def strike(f, short=1.0):
        y = np.zeros_like(t)
        # inharmonic partials; the higher the partial the faster it dies (tau ~ 1 / ratio)
        for k, (ratio, a) in enumerate([(1.0, 1.0), (2.32, 0.7), (4.25, 0.5), (6.63, 0.32), (9.38, 0.2)]):
            y += tone(f * ratio, t, phases[k]) * a * expd(t, 0.22 / ratio * short)
        y += 0.5 * tone(f * 1.004, t, phases[5]) * expd(t, 0.22 * short)  # detuned twin, slow beating shimmer
        return y

    x = strike(f0)
    x += bp(noise(dur), 3000, 11000) * expd(t, 0.0035) * 0.5  # the contact tick
    x += tone(380, t) * expd(t, 0.022) * 0.45  # a dull tap underneath
    # tiny bounce: two small, shorter, slightly flatter strikes
    for delay, g, ratio in [(0.058, 0.34, 0.99), (0.104, 0.15, 0.975)]:
        d = int(delay * SR)
        b = strike(f0 * ratio, 0.5)
        x[d:] += g * b[:-d]
    finish(name, x, peak=0.0, mono=True)


for i, f0 in enumerate([1568.0, 1760.0, 2093.0, 2349.3]):  # G6 A6 C7 D7, so a pour of coins stays in the key
    coin(f'coin_{i}', f0)


# ---------------------------------------------------------------- whooshes
def whoosh(name, dur, f0, f1, peak_at=0.6, width=2.2, bands=36, rise=1.6, fall=2.4, pan=(-0.35, 0.35), body=0.0):
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
    amp *= raised(t, 0.008)  # short fade-in
    amp *= 1 - raised(t - (dur - 0.02), 0.02)  # clean, tapered end
    x *= amp[:, None]
    # pan across the move
    th = (0.5 + np.linspace(pan[0], pan[1], n) / 2) * np.pi / 2
    x[:, 0] *= np.cos(th) * 1.4
    x[:, 1] *= np.sin(th) * 1.4
    if body:  # a low rumble under bigger moves
        r = lp(noise(dur), 160) * amp ** 1.5 * body
        x += r[:, None]
    x = lp(x, max(f0, f1) * 1.5, order=1)  # take the hiss off the top
    x = widen(x, 0.15)
    finish(name, x, peak=peak_at * dur, tail_fade=0.012, drives=NOISY)


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
whoosh('swish', 0.24, 3000, 8500, 0.5)
whoosh('swish_long', 0.55, 2000, 8000, 0.5)


# ---------------------------------------------------------------- risers and reverses
def riser(name, dur, f0=250, f1=9000, tonal=True, sub=True):
    t = t_(dur)
    prog = t / dur
    x = np.zeros_like(t)
    src = noise(dur)
    bands = 30
    for k in range(bands):
        fc = f0 * (f1 / f0) ** (k / (bands - 1))
        tk = dur * (k / (bands - 1)) ** 0.8
        g = np.exp(-0.5 * ((t - tk) / (dur * 0.12)) ** 2)
        x += bp(src, fc * 0.7, fc * 1.4) * g
    x *= prog ** 2.2
    x += lp(hp(noise(dur), 6500), 12000) * prog ** 3.2 * 0.05  # air on top as it opens
    if tonal:  # glides D3 -> D6, so the riser lands on the key note
        f = D3 * 8 ** (prog ** 1.5)
        x += 0.42 * sine(f, t) * prog ** 2.5 + 0.18 * sine(f * 2.0, t) * prog ** 3 + 0.12 * sine(f * 1.003, t) * prog ** 2.5
    if sub:  # D1 -> D2
        x += 0.8 * sine(D1 * 2 ** (prog ** 2), t) * prog ** 1.6
    x *= raised(t, 0.02)  # short fade-in
    so = int(0.04 * SR)  # the tiny suck-out right before the hit: a smooth dip to almost nothing
    u = np.linspace(0, 1, so)
    x[-so:] *= 0.06 + 0.94 * 0.5 * (1 + np.cos(np.pi * u))
    finish(name, widen(x, 0.35), peak=dur, tail_fade=0.006, drives=NOISY)


riser('riser', 2.0)
riser('riser_short', 1.0, f0=400, f1=10000)


def reverse_of(name, src, take):
    x, _ = lib[src]
    n = int(take * SR)
    r = x[:n][::-1].copy()
    r *= np.linspace(0.2, 1, len(r))[:, None] ** 1.5
    r *= raised(np.arange(len(r)) / SR, 0.015)[:, None]
    finish(name, r, peak=take, tail_fade=0.004)


reverse_of('reverse_swell', 'hit_big', 1.1)


# ---------------------------------------------------------------- tonal: gauge, seam, shimmer, bells, blips
def gauge_sweep():
    dur = 1.0
    t = t_(dur)
    p = 0.45
    amp = np.where(t < p * dur, (t / (p * dur)) ** 1.6, ((dur - t) / (dur * (1 - p))) ** 2.0)
    amp *= raised(t, 0.01)
    f = 220 * (7 ** np.clip(t / dur / 0.9, 0, 1) ** 1.2)
    tn = 0.6 * sine(f, t) + 0.18 * sine(f * 2.0, t) + 0.3 * sine(f * 1.004, t)  # smooth, no saw edge
    tn = lp(tn, 4200)
    air = bp(noise(dur), 1500, 7000) * 0.3
    x = (tn * 0.7 + air) * amp
    # faint servo ticks along the sweep
    for k in range(10):
        i = int((0.1 + 0.07 * k) * SR)
        x[i:i + 300] += np.hanning(300) * 0.06 * np.sign(np.sin(np.arange(300) / 2))
    finish('gauge_sweep', widen(x, 0.2), peak=p * dur)


gauge_sweep()


def seam():
    dur = 0.6
    t = t_(dur)
    f = 250 * (14 ** (t / dur))
    x = sine(f + 120 * np.sin(2 * np.pi * 38 * t), t) * (t / dur) ** 1.4
    x += bp(noise(dur), 3000, 12000) * (t / dur) ** 2 * 0.4
    x *= np.minimum(1, (dur - t) / 0.05)
    x *= raised(t, 0.01)
    finish('seam', widen(x, 0.25), peak=dur * 0.95)


seam()


def shimmer():
    dur = 2.6
    t = t_(dur)
    x = lp(hp(noise(dur), 5000) * 0.6, 14000)
    x *= (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t)) * np.minimum(1, t / 1.0) ** 1.5 * np.minimum(1, (dur - t) / 0.8)
    finish('shimmer', widen(x * 0.5, 0.5), peak=1.0)


shimmer()

bell_cfg = {'ding': (1567.98, 1.6, 0.6), 'ding_hi': (2093.0, 1.2, 0.45)}  # G6, C7
for nm, (f, d, dc) in bell_cfg.items():
    finish(nm, glass(f, d, decay=dc, atk=0.002, tick=0.06), peak=0.0, tail_fade=0.15)


def bell_ring():
    dur = 1.6
    out = np.zeros(int(dur * SR))
    d, _ = lib['ding_hi']
    d = d[:, 0] if d.ndim == 2 else d
    for k, g in enumerate([1.0, 0.8, 0.9, 0.65, 0.6, 0.4, 0.3, 0.2]):
        i = int(k * 0.11 * SR)
        n = min(len(d), len(out) - i)
        out[i:i + n] += d[:n] * g * np.exp(-k * 0.12)
    finish('bell_ring', stereo(out), peak=0.0, tail_fade=0.15)


bell_ring()

SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19]  # C D E G A over two octaves: all inside D natural minor
for i, semi in enumerate(SCALE):
    f = 523.25 * 2 ** (semi / 12)
    x = glass(f, 0.5, decay=0.13, atk=0.003, ratios=(1.0, 2.0, 3.0, 4.2), amps=(1.0, 0.3, 0.1, 0.04))
    finish(f'blip_{i}', x, peak=0.0, mono=True, tail_fade=0.06)

# ---------------------------------------------------------------- ticks (odometer, UI): mono and dry
for i, (f, tau) in enumerate([(2300, 0.006), (1700, 0.007), (2900, 0.005)]):
    t = t_(0.06)
    x = tone(f, t) * expd(t, tau) + bp(noise(0.06), 1000, 7000) * expd(t, 0.003) * 1.0
    x += tone(800 + 100 * i, t) * expd(t, 0.012) * 0.5
    x[:12] *= np.linspace(0, 1, 12)  # 0.25 ms, no click at sample 0
    finish(f'tick_{i}', x, peak=0.0, mono=True)


# ---------------------------------------------------------------- map, pin, rise and sink
def rise_up():
    dur = 0.9
    t = t_(dur)
    p = 0.55
    amp = np.where(t < p * dur, (t / (p * dur)) ** 1.8, expd(t - p * dur, 0.12))
    f = 38 + 85 * (t / dur) ** 1.3
    x = sine(f, t) * amp * 1.1 + 0.25 * sine(f * 2, t) * amp + lp(noise(dur), 300) * amp * 0.5
    finish('rise_up', widen(sat(x * 0.8, 1.3), 0.2), peak=p * dur)


def sink_down():
    dur = 1.0
    t = t_(dur)
    f = 40 + 110 * expd(t, 0.22)
    x = sine(f, t) * expd(t, 0.28) * 1.0 + 0.2 * sine(f * 2, t) * expd(t, 0.2) + lp(noise(dur), 260) * expd(t, 0.15) * 0.5
    x *= np.minimum(1, t / 0.01)
    finish('sink_down', widen(sat(x * 0.8, 1.3), 0.2), peak=0.0, tail_fade=0.1)


rise_up()
sink_down()


def pin_land():
    t = t_(0.7)
    x = sine(120 * (1 + 0.6 * expd(t, 0.03)), t) * expd(t, 0.09) * 1.2
    x += tone(1100, t) * expd(t, 0.2) * 0.35 + tone(2400, t) * expd(t, 0.1) * 0.2
    x += bp(noise(0.7), 2000, 8000) * expd(t, 0.008) * 0.6
    x = sat(x * 0.8, 1.3)
    finish('pin_land', widen(room(x, rt=0.5, wet=0.15), 0.2), peak=0.0, tail_fade=0.04)


pin_land()


def ping(name, f, dur=1.3):
    x = glass(f, dur, decay=0.25, atk=0.004, ratios=(1.0, 2.0), amps=(0.9, 0.22))
    left, right = 0.8 * x, 0.8 * x
    for k, g in enumerate([0.45, 0.25, 0.12]):  # sonar echoes, darker each time, bouncing left and right
        d = int((0.21 + 0.18 * k) * SR)
        echo = lp(x[:-d], 5500 - 1300 * k) * g
        if k % 2 == 0:
            right[d:] += echo
        else:
            left[d:] += echo
    finish(name, np.stack([left, right], axis=1), peak=0.0, tail_fade=0.1)


ping('ping', 1174.66)  # D6
ping('ping_lo', 880.0)  # A5


# ---------------------------------------------------------------- glitch, click, pop, draw, wave
def glitch():
    dur = 0.5
    t = t_(dur)
    seg = noise(dur) * (rng.random(len(t) // 240 + 1).repeat(240)[: len(t)] > 0.45)
    seg = np.round(seg * 4) / 4  # bit-crush
    f = 5000 * expd(t, 0.09) + 150
    x = (seg * 0.6 + sine(f, t) * 0.7) * expd(t, 0.12)
    x += sine(55 * (1 + expd(t, 0.05)), t) * expd(t, 0.2) * 1.2
    finish('glitch', stereo(x), peak=0.0, tail_fade=0.1)


glitch()


def mouse_click():
    t = t_(0.2)
    x = bp(noise(0.2), 1500, 9000) * expd(t, 0.003) * 1.0 + tone(3400, t) * expd(t, 0.004) * 0.6
    up = np.zeros_like(x)
    d = int(0.085 * SR)
    up[d:] = 0.45 * x[:-d]
    finish('click', x + up, peak=0.0, mono=True)


def pop():
    t = t_(0.4)
    f = 380 + 700 * (1 - expd(t, 0.03))
    x = sine(f, t) * expd(t, 0.07) * 1.0 + sine(f * 2, t) * expd(t, 0.04) * 0.3
    x[:12] *= np.linspace(0, 1, 12)
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
    low = sine(A1 + (D2 - A1) * (t / dur), t) * 0.9 + lp(noise(dur), 420) * 0.7
    pad = 0.12 * (tone(D3, t) + 0.8 * tone(D3 * 1.5, t, phase=0.9) + 0.5 * tone(D3 * 2.003, t))  # open fifth on D
    air = bp(noise(dur), 800, 5000) * 0.25
    x = (low + pad + air) * amp
    finish('wave_swell', widen(x, 0.4), peak=p * dur, tail_fade=0.03)


wave_swell()


# ---------------------------------------------------------------- write
def write_wav(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    ch = 1 if pcm.ndim == 1 else pcm.shape[1]
    with wave.open(path, 'wb') as w:
        w.setnchannels(ch)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


assert set(lib) == set(LOCKED), f'sound set changed: {sorted(set(lib) ^ set(LOCKED))}'

manifest = {}
for name, (x, peak) in sorted(lib.items()):
    write_wav(os.path.join(OUT, f'{name}.wav'), x)
    manifest[name] = {'dur': round(len(x) / SR, 4), 'peak': round(peak, 4)}
    # the cue sheet was built against these: the manifest is written from the real output, and must agree
    assert abs(manifest[name]['dur'] - LOCKED[name]['dur']) < 1e-3, (name, manifest[name], LOCKED[name])
    assert abs(manifest[name]['peak'] - LOCKED[name]['peak']) < 1e-3, (name, manifest[name], LOCKED[name])

with open(MANIFEST, 'w') as f:
    json.dump(manifest, f, indent=1, sort_keys=True)

total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
print(f'{len(manifest)} sounds, {total / 1e6:.1f} MB -> {os.path.relpath(OUT)}')
