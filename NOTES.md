# PayRanked notes

Video 1 is tagged `video-1` (commit c2dc658). Video 2 is built on the `video-2` branch.

## Lessons from video 1 (do not repeat)
- Voiceover first. Every shot's length = its voiceover + about 0.4 s (scripts/vo_layout.py). No fixed 15/25 s city slots.
- No cards held for reading time; a card stays as long as its words take to say.
- A camera move or animated number every 2 to 3 s; a new picture at least every 20 s; no silence over 0.6 s.
- Check the pace at 2x speed before rendering.
- Headless 3D is slow (300 s frame timeout in remotion.config.ts). Use cheap fake glass, no physical transmission.

## Video 2 status
- src/video2/Video2.tsx and src/timeline2.ts are placeholders; durations come from the recorded clips later.
- src/data/metros.json is filled from the verified data file (14 Nov 2026). Derived fields (wageAfterPrices, rentShareOfWagePct) are our calculations, not official. Atlanta/Chicago and Dallas/Phoenix are near-ties in wage-after-prices (differences of $19 and $7 before rounding): do not make a claim that depends on their order.
- Tax rules re-checked 14 Nov 2026 (PA 3.07%, AZ 2.5%, NY State schedule, CA SDI $550 and NY PFL about $187 are listed separately, not in take-home). Still open: PA rate page is not year-specific; BEA 2025 release is scheduled 10 Dec 2026 and whether it has metro price levels is unconfirmed. Plan: publish video 2 in November on 2024 data; revisit after 10 Dec.
- scripts/vo_*.py, make_music.py, export-timing.mjs, dump-cues.mjs, mix_check.py still point at video 1 paths/timeline and must be adapted before use.

## Video 2: editing and pacing layer (point 4)
- src/video2/camera.tsx: SceneCamera wraps every scene. Whip-in and whip-out with directional blur between scenes, slow drift alternating per scene, punch-ins on rank slams, a slow build (push-in, darker, tighter) at the end of #2 and the rent break, and an impact flash into #1 (mint) and the twist (purple). Configured per scene in Video2.tsx.
- scripts/pace_audit.py [limit_s]: lists shots with long speech. Longest stretches with only one new element: the twist (clips of 15-17 s), takeaway and outro. Add extra beats there next.
- Fixed: the "NEXT" teaser used to overlap the Other services bar; it now sits below the bars.
- Not reviewed as motion: only still frames were rendered. Check the whip speed and blur in npm run dev.
