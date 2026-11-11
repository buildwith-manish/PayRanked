#!/usr/bin/env python3
"""
Word-level timing for every voice-over clip, so scenes can be cued to the exact word instead of to the clip start.

    pip install pocketsphinx numpy      (offline recogniser, no model download)
    python3 scripts/vo_words.py         # writes scripts/vo-words.json:  {clip id: [[word, seconds_from_clip_start], ...]}

Accuracy is a few hundredths to ~0.2 s, which is plenty for cueing a visual beat. Misheard words are fine:
vo_layout.py falls back to a character-position estimate if a cue word is not found.
Re-run after replacing any clip.
"""
import json, os, subprocess, tempfile
from pocketsphinx import Decoder

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CLIPS = os.path.join(ROOT, 'public', 'voiceover', 'clips_wav')
out = {}
tmp = os.path.join(tempfile.gettempdir(), 'vo_words_16k.wav')
for f in sorted(os.listdir(CLIPS)):
    if not f.endswith('.wav'): continue
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(CLIPS, f), '-ar', '16000', '-ac', '1', '-sample_fmt', 's16', tmp], check=True)
    d = Decoder(samprate=16000)
    d.start_utt(); d.process_raw(open(tmp, 'rb').read()[44:], False, True); d.end_utt()
    out[f[:-4]] = [[s.word.split('(')[0], round(s.start_frame / 100, 2)] for s in d.seg()
                   if not s.word.startswith(('<', '[', '+'))]
    print(f, len(out[f[:-4]]), 'words')
json.dump(out, open(os.path.join(ROOT, 'scripts', 'vo-words.json'), 'w'), indent=0)
