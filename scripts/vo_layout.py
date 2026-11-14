#!/usr/bin/env python3
"""
Video 2 layout: the voiceover decides how long everything is. One shot per clip; shot length = its voice + 0.4 s.

    python3 scripts/normalize_vo.py   # once: level every clip to -15 LUFS
    python3 scripts/vo_words.py       # optional: word times (scripts/vo-words.json), used for beat cues
    python3 scripts/vo_layout.py      # writes src/audio/voiceover-manifest.json and src/audio/vo-layout.json
    python3 scripts/vo_layout.py --check   # report only, writes nothing

Rules (from NOTES.md):
  * A shot = ONSET (0.1 s) + the clip's speech + TAIL (0.3 s). So the gap between two spoken lines is 0.4 s, never over 0.6 s.
  * Shot lengths are whole 30 fps design frames, so every cut lands on a frame.
  * Clips never overlap: each starts after the previous shot ends.
  * The brand intro (public/intro.mp4, 3.5 s, has its own sound) sits between the cold open and the method.
  * The last shot gets END_SCREEN seconds of picture with no voice, for the end card (YouTube end screens need 5 s or more).

Outputs
  voiceover-manifest.json  [{id, file, startFrame, duration}]   startFrame = design frame (30 fps) where the clip FILE starts
                           (so that its first word is heard ONSET after the shot starts); duration = file length in seconds
  vo-layout.json           totalSeconds (the render workflows read it), sections [{id,start,seconds}], shots [{id,section,start,seconds,...}]
"""
import csv, json, math, os, sys, wave
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CLIPS = os.path.join(ROOT, 'public', 'voiceover', 'clips_wav')
MANIFEST = os.path.join(ROOT, 'src', 'audio', 'voiceover-manifest.json')
LAYOUT = os.path.join(ROOT, 'src', 'audio', 'vo-layout.json')
WORDS = os.path.join(ROOT, 'scripts', 'vo-words.json')
LINES = os.path.join(ROOT, 'scripts', 'lines.csv')
CHECK = '--check' in sys.argv

FPS = 30
ONSET, TAIL = 0.10, 0.30        # shot = ONSET + speech + TAIL  (= voice + 0.4 s)
INTRO_SECONDS = 3.5             # public/intro.mp4 (ffprobe)
END_SCREEN = 6.0                # silent end-card picture after the last line (decision: change here)
MAX_GAP = 0.6                   # no silence longer than this between spoken lines (the intro and end screen are exceptions)
MAX_SHOT = 20.0                 # a new picture at least every 20 s

SECTION_OF = lambda cid: ('coldOpen' if cid.startswith('s01') else 'method' if cid.startswith('s02') else
                          'twist' if cid.startswith('s04') else 'takeaway' if cid.startswith('s05') else
                          'outro' if cid.startswith('s06') else 'countdown')   # r01..r10 and the s03 rent break
ORDER = ['coldOpen', 'intro', 'method', 'countdown', 'twist', 'takeaway', 'outro']

frames = lambda s: math.ceil(s * FPS - 1e-9) / FPS


def read(path):
    w = wave.open(path); sr, ch = w.getframerate(), w.getnchannels()
    d = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return (d.reshape(-1, ch).mean(1) if ch > 1 else d), sr


rows = list(csv.DictReader(open(LINES, newline='', encoding='utf-8')))
words = json.load(open(WORDS)) if os.path.exists(WORDS) else {}
problems, clips = [], []
for n, r in enumerate(rows, 1):
    f = f"{n:03d}_{r['id']}.wav"
    p = os.path.join(CLIPS, f)
    if not os.path.exists(p):
        problems.append(f'missing clip {f}'); continue
    d, sr = read(p)
    win = int(sr * 0.01)
    env = np.sqrt(np.convolve(d ** 2, np.ones(win) / win, 'same'))
    idx = np.where(env > 0.02 * max(1e-9, np.abs(d).max()))[0]
    lead, end = idx[0] / sr, idx[-1] / sr
    wc = len(r['text'].split())
    wps = wc / (end - lead)
    # a very short line is naturally fast ("Let's start at the bottom." = 5 words in ~1 s), so only flag longer lines or extreme rates
    if (wc >= 8 and wps > 4.5) or wps > 6.5: problems.append(f'{r["id"]}: {wps:.1f} words/s, probably truncated')
    clips.append(dict(n=n, id=r['id'], text=r['text'], file=f'voiceover/clips_wav/{f}', dur=len(d) / sr, lead=lead, speech=end - lead, sec=SECTION_OF(r['id'])))

# ---- timeline
t, shots, sections = 0.0, [], {}
prev_sec = None
for c in clips:
    if prev_sec == 'coldOpen' and c['sec'] != 'coldOpen':
        sections['intro'] = dict(id='intro', start=t, seconds=INTRO_SECONDS); t += INTRO_SECONDS
    seconds = frames(ONSET + c['speech'] + TAIL)
    if c is clips[-1]:
        seconds = frames(seconds + END_SCREEN)
    c.update(start=t, seconds=seconds, file_start=t + ONSET - c['lead'])
    if c['file_start'] < 0: problems.append(f"{c['id']}: {c['lead']:.2f}s of leading silence is longer than the shot allows")
    if seconds > MAX_SHOT and c is not clips[-1]: problems.append(f"{c['id']}: shot is {seconds:.1f}s, over {MAX_SHOT:g}s")
    s = sections.setdefault(c['sec'], dict(id=c['sec'], start=t, seconds=0.0))
    s['seconds'] = round(t + seconds - s['start'], 4)
    t += seconds
    prev_sec = c['sec']
total = frames(t)
for s in sections.values(): s['seconds'] = round(s['seconds'], 4)
secs = [sections[k] for k in ORDER if k in sections]

# ---- safety net: no overlap, no long silence between lines
for a, b in zip(clips, clips[1:]):
    gap = (b['start'] + ONSET) - (a['start'] + ONSET + a['speech'])
    if gap > MAX_GAP and not (a['sec'] == 'coldOpen' and b['sec'] != 'coldOpen'): problems.append(f"{a['id']} -> {b['id']}: {gap:.2f}s of silence")
    if b['start'] < a['start'] + a['seconds'] - 1e-6: problems.append(f"{a['id']} overlaps {b['id']}")

# ---- report
mm = lambda x: f'{int(x // 60)}:{x % 60:04.1f}'
print(f"{len(clips)} clips, {len(rows)} lines. total {mm(total)} ({total:.1f} s) = {math.ceil(total * 60)} frames at 60 fps")
for s in secs: print(f"  {s['id']:10} starts {mm(s['start']):>7}  {s['seconds']:7.1f} s")
sh = [c['seconds'] for c in clips]
print(f"shot length: shortest {min(sh):.2f}s ({clips[sh.index(min(sh))]['id']}), longest {max(sh[:-1]):.2f}s ({clips[sh.index(max(sh[:-1]))]['id']}), average {sum(sh) / len(sh):.2f}s")
print('PROBLEMS:\n  ' + '\n  '.join(problems) if problems else 'No overlaps, no silence over 0.6 s between lines, no shot over 20 s, no truncated clip.')
if problems:
    sys.exit(1)
if CHECK:
    sys.exit(0)

# ---- write
man = [dict(id=c['id'], file=c['file'], startFrame=round(c['file_start'] * FPS, 2), duration=round(c['dur'], 3)) for c in clips]
json.dump(man, open(MANIFEST, 'w'), indent=2)
lay = dict(totalSeconds=round(total, 4), introSeconds=INTRO_SECONDS, endScreenSeconds=END_SCREEN, onsetSeconds=ONSET,
           sections=[dict(id=s['id'], start=round(s['start'], 4), seconds=s['seconds']) for s in secs],
           shots=[dict(id=c['id'], section=c['sec'], start=round(c['start'], 4), seconds=round(c['seconds'], 4),
                       speechStart=round(c['start'] + ONSET, 4), speechEnd=round(c['start'] + ONSET + c['speech'], 4), text=c['text'],
                       words=[[w, round(tw - c['lead'], 3)] for w, tw in words.get(c['id'], words.get(f"{c['n']:03d}_{c['id']}", []))])
                  for c in clips])
json.dump(lay, open(LAYOUT, 'w'), indent=1)
print('wrote', os.path.relpath(MANIFEST, ROOT), 'and', os.path.relpath(LAYOUT, ROOT))
