#!/usr/bin/env python3
"""
Level every voice-over clip to the same loudness so no line is louder or quieter than its neighbours.

    python3 scripts/normalize_vo.py            # rewrites public/voiceover/clips_wav/*.wav in place
    python3 scripts/normalize_vo.py --check    # only prints the levels

Target: -15 LUFS integrated per clip, true peak held under -1.5 dBFS by a limiter. Length and sample format are
not changed, so voiceover-manifest.json timings stay valid. Needs ffmpeg. Safe to re-run (it converges on the target).
"""
import glob, os, re, subprocess, sys, tempfile, shutil

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
TARGET = -15.0
CEIL = 10 ** (-1.5 / 20)  # -1.5 dBFS
MAX_GAIN = 20.0


def lufs(path):
    r = subprocess.run(['ffmpeg', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    s = r[r.rfind('Summary'):]
    return float(re.search(r'I:\s+(-?[\d.]+) LUFS', s).group(1))


check = '--check' in sys.argv
for p in sorted(glob.glob(os.path.join(ROOT, 'public', 'voiceover', 'clips_wav', '*.wav'))):
    before = lufs(p)
    if check:
        print(f'{os.path.basename(p):32s} {before:6.1f} LUFS')
        continue
    gain, cur = 0.0, before
    for _ in range(4):  # the limiter eats some loudness on peaky clips, so close the gap in a few passes
        gain = min(MAX_GAIN, gain + (TARGET - cur))
        tmp = tempfile.mktemp(suffix='.wav')
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', p, '-af', f'volume={gain}dB,alimiter=limit={CEIL:.4f}:attack=3:release=60:level=disabled', '-c:a', 'pcm_s16le', tmp], check=True)
        cur = lufs(tmp)
        if abs(cur - TARGET) < 0.4 or gain >= MAX_GAIN:
            break
        os.remove(tmp)
    shutil.move(tmp, p)
    print(f'{os.path.basename(p):32s} {before:6.1f} -> {cur:6.1f} LUFS  (+{gain:.1f} dB)')
