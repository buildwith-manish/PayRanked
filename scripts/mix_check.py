#!/usr/bin/env python3
"""
Offline model of the video's final mix (voice-over clips + music bed + SFX), using the same levels, ducking and cue
sheet as src/audio/*. Prints how loud each layer is, how far the music and SFX sit under the voice, and whether the
sum clips. Use it after changing src/audio/config.ts or the voice-over.

    node scripts/export-timing.mjs && node scripts/dump-cues.mjs     # refresh scripts/timing.json + scripts/cues.json
    python3 scripts/vo_envelope.py                                    # refresh the duck envelope
    python3 scripts/mix_check.py [--write out.wav]

Mono at 24 kHz: this is a level check, not a master. Needs ffmpeg + numpy.
"""
import json, os, re, subprocess, sys
import numpy as np

SR, FPS = 24000, 30
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
A = os.path.join(R, 'src', 'audio')

cfg_src = open(os.path.join(A, 'config.ts')).read()
cfg = {k: float(v) for k, v in re.findall(r'^\s+(\w+):\s*([\d.]+),', cfg_src, re.M)}
timing = json.load(open(os.path.join(R, 'scripts', 'timing.json')))
cues = json.load(open(os.path.join(R, 'scripts', 'cues.json')))
manifest = json.load(open(os.path.join(A, 'manifest.json')))
vo_manifest = json.load(open(os.path.join(A, 'voiceover-manifest.json')))
env = np.array(json.load(open(os.path.join(A, 'vo-envelope.json')))['frames']) / 100.0
S = {k: v['start'] for k, v in timing['shots'].items()}
S['shot4'] = S['countdown']
TOTAL = timing['total']
N = int((TOTAL + 2) * SR)


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<f4').astype(np.float64)


def put(buf, x, t, g=1.0):
    a = int(round(t * SR))
    if a < 0:
        x, a = x[-a:], 0
        g = g[-int(round(t * SR)):] if isinstance(g, np.ndarray) else g
    b = min(len(buf), a + len(x))
    if b > a:
        buf[a:b] += x[: b - a] * (g[: b - a] if isinstance(g, np.ndarray) else g)


tt = np.arange(N) / SR
def env_at(t):
    return env[np.clip(np.round(t * FPS).astype(int), 0, len(env) - 1)]

# --- voice
vo = np.zeros(N)
for c in vo_manifest:
    put(vo, decode(os.path.join(R, 'public', c['file'])), S[c['shot']] + c['at'] - c['lead'], cfg['voLevel'])

# --- sfx (duck per cue sample, like Sfx.tsx; hero cues are not ducked)
sfx = np.zeros(N)
cache = {}
for c in cues['cues']:
    x = cache.setdefault(c['sfx'], decode(os.path.join(R, 'public', 'sfx', c['sfx'] + '.wav')))
    t0 = c['t'] - manifest[c['sfx']]['peak']
    g = min(1.0, c['gain'] * cfg['sfxLevel'])
    a0 = int(round(t0 * SR))
    tv = (np.arange(len(x)) + a0) / SR
    duck = 1 - (cfg['heroDuck'] if c['hero'] else cfg['sfxDuck']) * env_at(tv)
    put(sfx, x, t0, g * duck)

# --- music (same shape as duck.ts)
shot2_end = S['shot2'] + timing['shots']['shot2']['dur']
fx = [0, 45 / FPS, S['shot2'] - 10 / FPS, S['shot2'] - 2 / FPS, shot2_end, shot2_end + 24 / FPS, S['countdown'] - 1, S['countdown'] + 20 / FPS,
      S['shot5'] - 1, S['shot5'] + 1, S['shot6'] + 1, TOTAL - 5, TOTAL]
fy = [0, 0.8, 0.8, 0, 0, 0.7, 0.7, 1, 1, 0.8, 0.9, 0.9, 0]
section = np.interp(tt, fx, fy)
beats = [c['t'] for c in cues['cues'] if c['hero'] and c['sfx'] in ('hit_big', 'glitch')]
dip = np.zeros(N)
for b in beats:
    a, z = int((b - cfg['dipPre'] / FPS) * SR), int((b + cfg['dipRelease'] * 4 / FPS) * SR)
    seg = tt[max(a, 0):z]
    v = np.where(seg < b, (seg - (b - cfg['dipPre'] / FPS)) / (cfg['dipPre'] / FPS), np.exp(-(seg - b) * FPS / cfg['dipRelease']))
    dip[max(a, 0):z] = np.maximum(dip[max(a, 0):z], np.clip(v, 0, 1))
mus_raw = decode(os.path.join(R, 'public', 'music.mp3'))
music = np.zeros(N)
m = mus_raw[:N]
gain = np.minimum(1, cfg['musicLevel'] * section[: len(m)] * (1 - cfg['musicDuck'] * env_at(tt[: len(m)])) * (1 - cfg['dipDepth'] * dip[: len(m)]))
music[: len(m)] = m * gain

mix = vo + sfx + music


def lufs(x):
    p = subprocess.run(['ffmpeg', '-nostats', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', 'ebur128=peak=true', '-f', 'null', '-'], input=x.astype('<f4').tobytes(), capture_output=True).stderr.decode()
    s = p[p.rfind('Summary'):]
    return float(re.search(r'I:\s+(-?[\d.]+) LUFS', s).group(1))


def db(x):
    return 20 * np.log10(max(x, 1e-9))


spk = env_at(tt) > 0.8  # voice speaking
win = SR // 2
def rms_db(x, mask):
    return db(np.sqrt(np.mean(x[mask] ** 2) + 1e-12))

print(f"levels: voLevel {cfg['voLevel']}  musicLevel {cfg['musicLevel']}  musicDuck {cfg['musicDuck']}  sfxLevel {cfg['sfxLevel']}  sfxDuck {cfg['sfxDuck']}")
print(f"integrated LUFS   mix {lufs(mix):6.1f} | voice {lufs(vo):6.1f} | music {lufs(music):6.1f} | sfx {lufs(sfx):6.1f}")
print(f"sample peak dBFS  mix {db(np.abs(mix).max()):6.1f} | voice {db(np.abs(vo).max()):6.1f} | music {db(np.abs(music).max()):6.1f} | sfx {db(np.abs(sfx).max()):6.1f}")
print(f"clipped samples (>0 dBFS): {int((np.abs(mix) > 1).sum())}")
print(f"WHILE VOICE SPEAKS (rms): voice {rms_db(vo, spk):.1f} dB | music {rms_db(music, spk):.1f} dB ({rms_db(music, spk) - rms_db(vo, spk):+.1f} vs voice) | sfx {rms_db(sfx, spk):.1f} dB ({rms_db(sfx, spk) - rms_db(vo, spk):+.1f} vs voice)")
print(f"voice rms {rms_db(vo, spk):.1f} dB; sfx peak while speaking {db(np.abs(sfx[spk]).max()):.1f} dBFS vs voice peak {db(np.abs(vo).max()):.1f}")
# loudest 3 s moments of SFX relative to the voice around them
blocks = []
for t in np.arange(0, TOTAL - 3, 3):
    a, b = int(t * SR), int((t + 3) * SR)
    blocks.append((rms_db(sfx[a:b], slice(None)), rms_db(vo[a:b], slice(None)), rms_db(music[a:b], slice(None)), t))
worst = sorted(blocks, key=lambda z: -(z[0] - z[1]) if z[1] > -60 else 99)[:5]
print('SFX closest to the voice (3 s blocks, only where voice speaks):')
for s_, v_, m_, t in worst:
    if v_ > -60:
        print(f'  t={t:6.1f}s  sfx {s_:6.1f}  voice {v_:6.1f}  music {m_:6.1f}  (sfx {s_ - v_:+.1f} dB vs voice)')
if '--write' in sys.argv:
    import wave
    out = sys.argv[sys.argv.index('--write') + 1]
    y = np.clip(mix, -1, 1)
    with wave.open(out, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((y * 32767).astype('<i2').tobytes())
