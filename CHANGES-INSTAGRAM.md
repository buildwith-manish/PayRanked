# Separate Instagram version of every Short

Every Short now has three versions. Only the end card differs; picture, voice, music and hook are identical.

| Platform | Composition | End line | Where the link goes |
|---|---|---|---|
| YouTube | `ShortN-Vertical` | Related video button demo | Related video button + pinned comment |
| Facebook | `ShortN-Vertical-Social` | link in comments (chevron down) | pinned first comment with the Facebook long-video link |
| Instagram | `ShortN-Vertical-Instagram` | link in bio (arrow up, "tap my profile") | link in bio; pinned comment says "full video, link in bio" |

- `CtaVariant` is now `'youtube' | 'social' | 'instagram'` (`src/shots/Short1.tsx`). `social` keeps meaning Facebook so existing ids do not change.
- `Render Short N` workflows: the `variant` input has a new `instagram` option; files are named `shortN-vertical-instagram.mp4`.
- `Preview vertical Shorts (stills)`: added Instagram end-card stills for Shorts 1 and 3.
- Checked: `npm run typecheck` passes; the Short 1 end card was rendered for both Instagram and Facebook and compared.
- Not checked: full renders, and Shorts 2-7 end cards (same component, so they should match).

## Render workflow: body once, three end cards, joined

The three versions only differ in the last 4 s (240 frames, ~7-10% of a Short), so `Render Short N` no longer renders everything three times.
It renders the body once (4 parallel chunks) and each end card on its own, then joins body + end card per version: about 1.1x the work of one
full render instead of 3x. Run it from the `feat/short-1-vertical` branch ("Use workflow from"): `main` still has the old workflows.

- `render-short-reusable.yml` does the work; `render-short1.yml` ... `render-short7.yml` are thin wrappers. Input `variants`: `all` (default),
  `youtube`, `social` (Facebook) or `instagram`. Outputs: `shortN-vertical.mp4`, `shortN-vertical-social.mp4`, `shortN-vertical-instagram.mp4`.
- Frame counts come from Remotion (`scripts/short-frames.sh total N`); no hardcoded `TOTAL` to go stale. `END_FRAMES=240` lives in that script.
- **Seam guard (`check` job):** stills at mid-Short and at the last body frame must be byte-identical across the three versions, else the run fails.
  Tested locally on Shorts 2 and 6: identical up to frame TOTAL-241, versions diverge only once the end card animates.
- **Fixed an old bug:** the previous chunked workflow joined AAC chunks. AAC adds ~50 ms of padding per chunk and ffmpeg shifted the next chunk by
  it, so every seam froze the picture for ~50 ms and the Short came out 0.2 s too long (4 seams). Chunks are now MKV with uncompressed PCM
  audio (exact lengths), the video is copied, and audio is encoded to AAC once at the end.
- **Join check:** exact frame count AND video/audio duration within 50 ms of TOTAL/60. Verified: passes the new join, fails the old one.
- Tested locally (Short 6, quarter scale, 2 cores): 4 body chunks + end cards joined to the right frame count, no seam gaps, audio and video 13.5 s for a 3-piece join.
  Not tested: the GitHub Actions run itself (actionlint is clean; the job logic was run step by step on this machine).
