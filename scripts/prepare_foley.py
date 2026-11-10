#!/usr/bin/env python3
"""
Prepares raw foley recordings for layering into the SFX library.

Reads:  foley/raw/*.wav          (real recorded foley, any sample rate / bit depth)
Writes: foley/processed/*.wav    (48 kHz mono, normalised to -1 dBFS, trimmed to individual hits)

Each raw file is sliced at transient points (where the signal crosses 15% of peak).
Each slice is 200 ms before the transient (pre-roll for the attack) and 500 ms after
(the body + tail). Slices shorter than 50 ms are discarded. Each slice is normalised
to -1 dBFS peak and faded in/out (2 ms / 10 ms).

    python3 scripts/prepare_foley.py

The output filenames are <raw_name>_<index>.wav, where index is the slice number
(0-based). The layer_map.json in foley/ references these names.
"""
import os
import json
import wave
import struct
import math
import numpy as np
from scipy import signal

SR = 48000
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
RAW_DIR = os.path.join(ROOT, 'foley', 'raw')
OUT_DIR = os.path.join(ROOT, 'foley', 'processed')
os.makedirs(OUT_DIR, exist_ok=True)


def read_wav_any(path):
    """Read a WAV file at any sample rate / bit depth, return mono float64 at the native rate."""
    with wave.open(path, 'rb') as w:
        ch = w.getnchannels()
        fr = w.getframerate()
        nf = w.getnframes()
        sw = w.getsampwidth()
        raw = w.readframes(nf)

    if sw == 2:
        samples = np.frombuffer(raw, dtype='<i2').astype(np.float64) / 32768.0
    elif sw == 3:
        # 24-bit: unpack 3-byte little-endian signed integers
        n = len(raw) // 3
        arr = np.frombuffer(raw, dtype=np.uint8).reshape(n, 3)
        samples = (arr[:, 0].astype(np.int32) |
                   (arr[:, 1].astype(np.int32) << 8) |
                   (arr[:, 2].astype(np.int32) << 16))
        # Sign-extend from 24-bit
        samples = np.where(samples >= (1 << 23), samples - (1 << 24), samples)
        samples = samples.astype(np.float64) / (1 << 23)
    elif sw == 4:
        samples = np.frombuffer(raw, dtype='<i4').astype(np.float64) / 2147483648.0
    else:
        raise ValueError(f"Unsupported sample width: {sw} bytes")

    if ch == 2:
        mono = samples[0::2]
    elif ch > 2:
        mono = samples[0::ch]
    else:
        mono = samples

    return mono, fr


def resample(mono, src_fr, dst_fr):
    """Linear resample (good enough for foley — we're layering at -12dB, not featuring it)."""
    if src_fr == dst_fr:
        return mono
    ratio = dst_fr / src_fr
    n = int(len(mono) * ratio)
    indices = np.arange(n) / ratio
    return np.interp(indices, np.arange(len(mono)), mono)


def find_transients(mono, sr, threshold_frac=0.15, min_silence=0.05):
    """Find transient onset times (seconds) in a mono signal."""
    peak = np.max(np.abs(mono))
    if peak < 1e-6:
        return []
    threshold = threshold_frac * peak
    silence_thresh = threshold * 0.3
    min_silence_samples = int(min_silence * sr)

    transients = []
    in_transient = False
    silence_count = 0
    for i in range(len(mono)):
        if abs(mono[i]) > threshold and not in_transient:
            transients.append(i)
            in_transient = True
            silence_count = 0
        elif abs(mono[i]) < silence_thresh and in_transient:
            silence_count += 1
            if silence_count > min_silence_samples:
                in_transient = False
        else:
            silence_count = 0

    return [t / sr for t in transients]


def slice_and_write(mono, sr, transients, raw_name):
    """Slice the mono signal around each transient, normalise, and write to processed/."""
    pre_roll = int(0.200 * sr)   # 200ms before transient (catch the attack)
    post_roll = int(0.500 * sr)  # 500ms after (body + tail)
    min_len = int(0.050 * sr)    # 50ms minimum

    written = []
    for i, t_sample in enumerate([int(t * sr) for t in transients]):
        start = max(0, t_sample - pre_roll)
        end = min(len(mono), t_sample + post_roll)
        slc = mono[start:end]
        if len(slc) < min_len:
            continue

        # Normalise to -1 dBFS
        peak = np.max(np.abs(slc))
        if peak < 1e-6:
            continue
        slc = slc / peak * 0.89

        # Fade in/out (2ms / 10ms)
        fade_in = int(0.002 * sr)
        fade_out = int(0.010 * sr)
        if fade_in > 0:
            slc[:fade_in] *= np.linspace(0, 1, fade_in)
        if fade_out > 0:
            slc[-fade_out:] *= np.linspace(1, 0, fade_out)

        # Write
        out_name = f"{raw_name}_{i:02d}.wav"
        out_path = os.path.join(OUT_DIR, out_name)
        with wave.open(out_path, 'w') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sr)
            frames = (slc * 32767).astype('<i2').tobytes()
            w.writeframes(frames)

        dur = len(slc) / sr
        rms = 20 * math.log10(np.sqrt(np.mean(slc**2)) + 1e-9)
        written.append({
            'file': out_name,
            'duration': round(dur, 3),
            'rms_db': round(rms, 1),
            'transient_at': round((t_sample - start) / sr, 3),
        })
        print(f"  {out_name}: {dur:.3f}s, rms={rms:.1f}dB, transient at {(t_sample - start) / sr:.3f}s")

    return written


def main():
    if not os.path.isdir(RAW_DIR):
        print(f"No foley/raw/ directory. Create it and drop foley WAVs there.")
        return

    raw_files = [f for f in sorted(os.listdir(RAW_DIR)) if f.endswith('.wav')]
    if not raw_files:
        print(f"No .wav files in foley/raw/. Drop some foley recordings there and re-run.")
        return

    print(f"Processing {len(raw_files)} raw foley file(s)...\n")
    catalog = {}

    for fname in raw_files:
        path = os.path.join(RAW_DIR, fname)
        raw_name = os.path.splitext(fname)[0]
        print(f"--- {fname} ---")
        try:
            mono, src_fr = read_wav_any(path)
            mono = resample(mono, src_fr, SR)
            transients = find_transients(mono, SR)
            if not transients:
                # No transients found — treat the whole file as one slice
                transients = [0.0]
                print(f"  (no transients detected, using whole file)")
            print(f"  {len(transients)} transient(s) found")
            slices = slice_and_write(mono, SR, transients, raw_name)
            catalog[raw_name] = slices
        except Exception as e:
            print(f"  ERROR: {e}")
        print()

    # Write the catalog
    catalog_path = os.path.join(ROOT, 'foley', 'catalog.json')
    with open(catalog_path, 'w') as f:
        json.dump(catalog, f, indent=2)
    print(f"Wrote {catalog_path}")
    total = sum(len(v) for v in catalog.values())
    print(f"Total: {total} processed foley slices in foley/processed/")


if __name__ == '__main__':
    main()
