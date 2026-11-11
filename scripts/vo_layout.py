#!/usr/bin/env python3
"""
Lay the voice-over out against the picture. The voice never overlaps itself, and a shot is made as long as its narration.

    python3 scripts/vo_words.py            # once per set of clips: word times (scripts/vo-words.json)
    python3 scripts/vo_layout.py           # writes voiceover-manifest.json, vo-layout.json, public/vo.mp3 and prints a report
    python3 scripts/vo_layout.py --check   # report only, writes nothing
    python3 scripts/vo_layout.py --verify  # after `npm run timing`: checks this script and the TypeScript agree on every shot start

Then:  npm run timing && npm run music && npm run vo-envelope

How it works
  * Every clip is placed so its FIRST WORD is heard at  shot start + `at`  (leading silence in the file is subtracted).
  * Clips in a shot follow each other with GAP seconds between them, so nothing can overlap.
  * Each shot's visual beats (Shot3 T, Shot5 T, ...) are cued to the WORD they illustrate, e.g. the housing bars appear on "median".
  * A shot's length = its last spoken word + a short pad (the shot grows to fit its voice, never the other way round).
  * Countdown reveals that have no narration, or whose narration is short, keep the 15 s "fast" pacing; the rest use the full 25 s.
Everything the TypeScript needs is written to src/audio/vo-layout.json.
"""
import csv, json, math, os, subprocess, sys, wave
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CLIPS = os.path.join(ROOT, 'public', 'voiceover', 'clips_wav')
MANIFEST = os.path.join(ROOT, 'src', 'audio', 'voiceover-manifest.json')
LAYOUT = os.path.join(ROOT, 'src', 'audio', 'vo-layout.json')
VO_MP3 = os.path.join(ROOT, 'public', 'vo.mp3')
WORDS = os.path.join(ROOT, 'scripts', 'vo-words.json')
LINES = os.path.join(ROOT, 'scripts', 'lines.csv')
CHECK, VERIFY = '--check' in sys.argv, '--verify' in sys.argv

GAP = 0.60              # silence between two clips in the same shot
AHEAD = 0.25            # a visual beat lands this much BEFORE the word it illustrates
INTRO_SECONDS = 3.5     # real length of public/intro.mp4 (ffprobe)
SHOT55_SECONDS = 110.0  # practical takeaways: 25 s read time per card, the voice fits inside each card
FAST_MAX_END = 13.6     # a reveal may use the 15 s fast pacing only if its voice is finished by then
BREAK_SECONDS = {'notHere': 10.0, 'prices': 10.0}   # 4 bars of the 96 BPM bed each, so the music stays on the grid

# ---------------------------------------------------------------- read clips
text = {}
if os.path.exists(LINES):
    for r in csv.DictReader(open(LINES, newline='', encoding='utf-8')):
        text[r['id']] = r['text']
words = json.load(open(WORDS)) if os.path.exists(WORDS) else {}

def read(path):
    w = wave.open(path); sr = w.getframerate(); ch = w.getnchannels()
    d = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    if ch > 1: d = d.reshape(-1, ch).mean(1)
    return d, sr

C = {}
for f in sorted(os.listdir(CLIPS)):
    if not f.endswith('.wav'): continue
    cid, sfx = f[:-4], f[:-4].split('_', 1)[1]
    d, sr = read(os.path.join(CLIPS, f))
    win = int(sr * 0.01)
    env = np.sqrt(np.convolve(d ** 2, np.ones(win) / win, 'same'))
    idx = np.where(env > 0.02 * max(1e-9, np.abs(d).max()))[0]
    lead, end = idx[0] / sr, idx[-1] / sr
    C[sfx] = dict(id=cid, sfx=sfx, file=f'voiceover/clips_wav/{f}', dur=len(d) / sr, lead=lead, speech=end - lead, data=d, sr=sr)

def wt(sfx, kw, nth=1):
    """Seconds from the clip's first spoken word to the word `kw` (nth occurrence, -1 = last). Falls back to a position estimate."""
    c = C[sfx]
    hits = [t for w, t in words.get(c['id'], []) if w == kw]
    if hits:
        return max(0.0, (hits[nth - 1] if nth > 0 else hits[nth]) - c['lead'])
    t = text.get(sfx, '').lower(); i = t.find(kw)
    if i >= 0: return c['speech'] * i / max(1, len(t))
    raise SystemExit(f'cannot locate "{kw}" in {sfx}: run scripts/vo_words.py or check the clip')

def chain(order, first_at, gap=GAP):
    at, t = {}, first_at
    for s in order:
        at[s] = t; t += C[s]['speech'] + gap
    return at
end_of = lambda at, s: at[s] + C[s]['speech']
ceil_half = lambda x: math.ceil(x * 2 - 1e-9) / 2
AT = {}      # clip suffix -> (shot, seconds after shot start at which its first word is heard)

# ---------------------------------------------------------------- Shot 1: cold open
a = chain(['v01_cold_open', 'v02_cold_open', 'v03_cold_open', 'v04_cold_open'], 0.6)
AT.update({k: ('shot1', v) for k, v in a.items()})
shot1_len = ceil_half(end_of(a, 'v04_cold_open') + 1.0)
slam = a['v04_cold_open'] + wt('v04_cold_open', 'gap') - 0.1            # the $25K gap slams in on the word "gap"
S1 = dict(
    head2=a['v02_cold_open'] - AHEAD,                                   # "One state does the opposite." on "One lives in Arkansas"
    head2Leave=a['v03_cold_open'] - 0.1,
    bracket=slam - 24 / 30,                                              # the bracket draws 24 design frames before the slam
    rest=slam - 24 / 30 - 0.4,
    rest2=slam + 2.4,
    chips=slam + 3.2,                                                    # NOT TEXAS / NOT FLORIDA / TOP 10, RANKED
)

# ---------------------------------------------------------------- Shot 3: method
a = chain(['v06_method', 'v07_method', 'v08_method', 'v09_method', 'v10_method'], 0.3)
AT.update({k: ('shot3', v) for k, v in a.items()})
S3 = dict(
    avg=a['v07_method'] + wt('v07_method', 'hundred', 1) - AHEAD,        # needle springs to 100 on "A hundred is the national average"
    toCal=a['v07_method'] + wt('v07_method', 'california') - AHEAD,
    formula=a['v08_method'] + 5.0,                                       # tokens fly in on "One hundred thousand divided by ..."
    categories=a['v10_method'] - 0.2,                                    # "This index measures prices across five categories"
    housing=a['v10_method'] + wt('v10_method', 'median') - 0.3,          # "The median U.S. home costs ..."
    honesty=a['v10_method'] + wt('v10_method', 'prices', -1) - AHEAD,    # "Prices, not paychecks."
)
S3['rail'] = max(a['v10_method'] + wt('v10_method', 'okay') - 0.5, S3['honesty'] + 3.0)   # "Okay. Let's count down."
shot3_len = ceil_half(max(end_of(a, 'v10_method') + 1.2, S3['rail'] + 4.0))

# ---------------------------------------------------------------- Shot 4: countdown
REVEALS = [(10, 'v11_reveal_10', 2), (9, 'v12_reveal_9', 1), (8, None, 1), (7, None, 1), ('notHere', 'v13_break', 0),
           (6, 'v14_reveal_6', 1), (5, 'v15_reveal_5', 1), (3, 'v16_reveal_3', 2), ('prices', 'v17_break', 0),
           (2, 'v18_reveal_2', 1), (1, 'v19_reveal_1', 1)]
BREAK_ONSET = {'notHere': 1.2, 'prices': 1.0}     # first word lands so "Texas / Florida" meets the chips, "prices, not paychecks" its line
fast, t4 = [], 0.0
for key, sfx, names in REVEALS:
    if isinstance(key, str):
        dur = BREAK_SECONDS[key]; onset = BREAK_ONSET[key]
        assert onset + C[sfx]['speech'] + 0.8 <= dur, f'{sfx} does not fit its {dur:g}s break'
    else:
        onset = 1.0
        if sfx is None or onset + C[sfx]['speech'] <= FAST_MAX_END:
            fast.append(key); dur = 15.0
        else:
            onset = min(3.0, max(1.0, 17.5 - C[sfx]['speech']))         # long enough voices start with the slam; short ones end on the fact card
            dur = 25.0 + (5.0 if names > 1 else 0.0)
        if sfx: assert onset + C[sfx]['speech'] + 0.5 <= dur, f'{sfx} does not fit its {dur:g}s reveal'
    if sfx: AT[sfx] = ('shot4', t4 + onset)
    t4 += dur
countdown_len = t4

# ---------------------------------------------------------------- Shot 5: reality check
a = chain(['v20_reality', 'v21_reality', 'v22_reality', 'v23_reality', 'v24_reality', 'v25_reality', 'v26_reality'], 2.2, 0.7)
AT.update({k: ('shot5', v) for k, v in a.items()})
S5 = dict(rows=max(4.5, a['v20_reality'] + wt('v20_reality', 'california') - 0.3))
S5['bars'] = a['v21_reality'] - 0.2
S5['pct'] = a['v21_reality'] + wt('v21_reality', 'twenty') - 0.1                       # "+27%" slams in on "twenty-seven percent"
S5['interrupt'] = a['v22_reality'] - 0.3
S5['lights'] = max(S5['interrupt'] + 1.5, a['v22_reality'] + wt('v22_reality', 'alaska') - 0.4)
S5['card1'] = a['v22_reality'] + wt('v22_reality', 'only') - 0.5                       # "Only 1 of 9 ... South Dakota" (now the first card)
S5['ring'] = a['v23_reality'] - 0.8                                                    # ring on Washington
S5['card2'] = a['v23_reality'] + 1.3                                                   # Washington: "fifth most expensive, yet no wage tax"
S5['card4'] = a['v24_reality'] + wt('v24_reality', 'three') - 1.0                      # SF $3,500 vs rural Arkansas $800
S5['card3'] = min(a['v24_reality'] - 0.4, S5['card4'] - 2.6)                           # short bridge between Washington and San Francisco
S5['card5'] = a['v25_reality'] + 0.4                                                   # Texas property tax 1.7%
S5['card6'] = a['v26_reality'] - 0.1                                                   # ~30% fewer specialists
S5['card7'] = a['v26_reality'] + wt('v26_reality', 'cheap') - 0.6                      # "Cheap is not better. It's just cheaper."
shot5_len = ceil_half(max(end_of(a, 'v26_reality') + 1.5, S5['card7'] + 3.5))

# ---------------------------------------------------------------- Shot 5.5: practical (voice sits at the start of each 25 s card)
for s, t in [('v27_practical', 0.4), ('v28_practical', 5.3), ('v29_practical', 30.3), ('v30_practical', 55.3), ('v31_practical', 80.3), ('v32_practical', 100.3)]:
    AT[s] = ('shot55', t)
assert end_of({s: AT[s][1] for s in AT if s.endswith('practical')}, 'v32_practical') < SHOT55_SECONDS - 1.0

# ---------------------------------------------------------------- Shot 6: outro (the last 1 s of the shot is the fade to black)
a = chain(['v33_outro', 'v34_outro'], 0.6)
AT.update({k: ('shot6', v) for k, v in a.items()})
shot6_len = ceil_half(end_of(a, 'v34_outro') + 1.0 + 0.3)

# ---------------------------------------------------------------- master clock
START = {'shot1': 0.0}
START['shot2'] = shot1_len
START['shot3'] = START['shot2'] + INTRO_SECONDS
START['shot4'] = START['shot3'] + shot3_len
START['shot5'] = START['shot4'] + countdown_len
START['shot55'] = START['shot5'] + shot5_len
START['shot6'] = START['shot55'] + SHOT55_SECONDS
total = START['shot6'] + shot6_len

# ---------------------------------------------------------------- safety net: no overlap anywhere on the master clock
placed = sorted(((START[AT[s][0]] + AT[s][1], START[AT[s][0]] + AT[s][1] + C[s]['speech'], s) for s in AT))
problems = []
for (s0, e0, n0), (s1, e1, n1) in zip(placed, placed[1:]):
    if s1 < e0 + 0.3: problems.append(f'{n0} ends {e0:.2f}s, {n1} starts {s1:.2f}s')
shot_end = {'shot1': START['shot2'], 'shot3': START['shot4'], 'shot4': START['shot5'], 'shot5': START['shot55'], 'shot55': START['shot6'], 'shot6': total}
for s0, e0, n in placed:
    if e0 > shot_end[AT[n][0]] - (1.0 if AT[n][0] == 'shot6' else 0.2): problems.append(f'{n} ends {e0:.2f}s, after its shot ends ({shot_end[AT[n][0]]:.2f}s)')
for sfx, c in C.items():
    if sfx in text:
        wps = len(text[sfx].split()) / max(c['speech'], 0.01)
        if wps > 4.5: problems.append(f'{sfx}: {wps:.0f} words/s, the audio is truncated; regenerate it from the quoted lines.csv')
missing = [s for s in C if s not in AT]
if missing: problems.append('clips with no placement: ' + ', '.join(missing))

# ---------------------------------------------------------------- report
mm = lambda t: f'{int(t // 60)}:{t % 60:04.1f}'
print(f"{'shot':10}{'start':>8}{'length':>8}")
for k, ln in [('shot1', shot1_len), ('shot2', INTRO_SECONDS), ('shot3', shot3_len), ('shot4', countdown_len), ('shot5', shot5_len), ('shot55', SHOT55_SECONDS), ('shot6', shot6_len)]:
    print(f'{k:10}{mm(START[k]):>8}{ln:>8g}')
print(f'total {mm(total)}   fast (15 s) reveals: {sorted(fast, reverse=True)}')
w = START['shot3'] + AT['v06_method'][1]
print(f"cold open voice ends {START['shot1'] + end_of({s: AT[s][1] for s in AT if AT[s][0] == 'shot1'}, 'v04_cold_open'):.2f}s | intro {START['shot2']:g}-{START['shot3']:g}s (silent) | 'Welcome to PayRanked' first word {w:.2f}s")
print('PROBLEMS:\n  ' + '\n  '.join(problems) if problems else 'No overlaps, nothing runs past its shot, no truncated clip.')

if VERIFY:
    T = json.load(open(os.path.join(ROOT, 'scripts', 'timing.json')))['shots']
    ts = {'shot1': T['shot1']['start'], 'shot2': T['shot2']['start'], 'shot3': T['shot3']['start'], 'shot4': T['countdown']['start'],
          'shot5': T['shot5']['start'], 'shot55': T['shot55']['start'], 'shot6': T['shot6']['start']}
    bad = {k: (round(START[k], 3), ts[k]) for k in ts if abs(START[k] - ts[k]) > 0.02}
    print('VERIFY: TypeScript timeline matches this layout' if not bad else f'VERIFY FAILED (python, ts): {bad}')
    sys.exit(1 if bad or problems else 0)
if CHECK or problems and '--force' not in sys.argv:
    sys.exit(1 if problems else 0)

# ---------------------------------------------------------------- write
man = [dict(id=c['id'], file=c['file'], shot=AT[s][0], at=round(AT[s][1], 3), lead=round(c['lead'], 3), duration=round(c['dur'], 3)) for s, c in C.items()]
json.dump(man, open(MANIFEST, 'w'), indent=2)
json.dump(dict(introSeconds=INTRO_SECONDS, shot1Seconds=shot1_len, shot3Seconds=shot3_len, shot5Seconds=shot5_len, shot55Seconds=SHOT55_SECONDS,
               shot6Seconds=shot6_len, fastRanks=sorted(fast, reverse=True), breakSeconds=BREAK_SECONDS, totalSeconds=round(total, 2),
               shot1={k: round(v, 3) for k, v in S1.items()}, shot3={k: round(v, 3) for k, v in S3.items()},
               shot5={k: round(v, 3) for k, v in S5.items()}), open(LAYOUT, 'w'), indent=2)
SR = 48000
buf = np.zeros(int((total + 5) * SR), dtype=np.float32)
for s, c in C.items():
    st = max(0, int((START[AT[s][0]] + AT[s][1] - c['lead']) * SR))
    buf[st:st + len(c['data'])] += c['data']
tmp = os.path.join(ROOT, 'vo_mix_tmp.wav')
wv = wave.open(tmp, 'wb'); wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(SR)
wv.writeframes((np.clip(buf, -1, 1) * 32767).astype(np.int16).tobytes()); wv.close()
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-b:a', '128k', VO_MP3], check=True)
os.remove(tmp)
print('wrote', *(os.path.relpath(p, ROOT) for p in (MANIFEST, LAYOUT, VO_MP3)))
