# PayRanked Intro v10

The channel's 3.0-second intro sting. Rendered once, reused for every video.

## What's here

```
intro/
├── intro-v10.html           ← The animation source (SVG + JS)
├── intro.wav                ← Final audio track (3.0s, 44.1kHz stereo)
├── render-locally.sh        ← One-click render script → intro.mp4
├── fonts/fontshare/         ← Clash Display + Satoshi (self-hosted)
└── README.md                ← This file
```

## How to render the final MP4

The MP4 isn't committed (easy to regenerate). Render it locally:

```bash
cd PayRanked/intro
bash render-locally.sh
```

**Requirements:**
- Google Chrome or Chromium installed
- ffmpeg installed

**Output:** `intro.mp4` (1920×1080, 60fps, 3.0s, H.264 + AAC, ~3-5 MB)

Then copy to your Remotion project's public folder:

```bash
cp intro.mp4 ../public/intro.mp4
git add public/intro.mp4
git commit -m "feat(intro): add rendered v10 intro MP4"
git push origin main
```

## How it works

The HTML is a self-contained SVG animation with:
- **Visual:** "PayRanked" text reveal with motion blur, emerald glow, 3-bar growth chart inside the P
- **Audio:** Your provided `intro.wav` (3.0s, restrained sound design with one hero hit at 1.05s)
- **Frame capture:** The HTML accepts `?frame=N` query param to render any specific frame

`render-locally.sh` captures 180 frames (3.0s @ 60fps) via headless Chrome, then combines them with the WAV using ffmpeg.

## Timeline breakdown

| Time | Phase | What happens |
|------|-------|--------------|
| 0.00s | Build | Rising analog drone, sub climbs an octave, warm taps E·G#·B mark the bars |
| 1.00s | Suck-back | 50ms of near-silence before the hit |
| 1.05s | The hit | Sub drop, drum body, saturated saw boom, E-major wall, E5 bell |
| 1.05s | Cascade | Letters get one rising air sweep |
| 1.40s | Reveal | Light sweep, soft B5, two-note tag (E6, B6), fading air tail |

## Integration with Remotion

`Shot2.tsx` already references this file:

```tsx
import {Video} from 'remotion';
import {staticFile} from 'remotion';

export const Shot2: React.FC = () => (
  <Video src={staticFile('intro.mp4')} />
);
```

Once `public/intro.mp4` exists, the intro plays automatically at 0:30 in every PayRanked video.

## Updating the intro

If you ever change the intro:
1. Edit `intro-v10.html` (or create `intro-v11.html`)
2. Re-run `bash render-locally.sh`
3. Copy the new MP4 to `public/intro.mp4`
4. Commit both the HTML changes and the new MP4

## Why render locally (not in CI)

- Headless Chrome is more stable on local machines
- You can visually verify the MP4 before committing
- Render time: ~30-60 seconds locally vs unreliable in CI
- The MP4 becomes a committed asset — no re-rendering needed for video builds

## File sizes

| File | Size | Purpose |
|------|------|---------|
| `intro-v10.html` | ~29 KB | Source |
| `intro.wav` | ~530 KB | Audio |
| `fonts/` | ~116 KB | Self-hosted fonts |
| `intro.mp4` (output) | ~3-5 MB | Final rendered video |
