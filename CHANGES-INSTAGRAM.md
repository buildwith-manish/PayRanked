# Separate Instagram version of every Short

Every Short now has three versions. Only the end card differs; picture, voice, music and hook are identical.

| Platform | Composition | End line | Where the link goes |
|---|---|---|---|
| YouTube | `ShortN-Vertical` | Related video button demo | Related video button + pinned comment |
| Facebook | `ShortN-Vertical-Social` | tap demo: comment bar -> pinned comment with the link -> long video opens | pinned first comment with the Facebook long-video link |
| Instagram | `ShortN-Vertical-Instagram` | tap demo: profile + bio link -> link page opens and scrolls to the latest video | link in bio (your PayRanked link page); pinned comment says "full video, link in bio" |

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

## Facebook end card: tap demo (`FacebookEndCard`, `src/shots/Short1.tsx`)
Same idea as the YouTube card, for how Facebook really works (no Related video button; the link is in the pinned comment). One dark panel, two taps:
1. page row (avatar, PayRanked, Follow) + a "Write a comment..." bar; a touch point taps the bar (rings, press, click).
2. the comments open: pinned comment "Full ranking + #1:" with the link in blue; a second touch point taps the link.
3. the link stretches into the long video's thumbnail (play button, duration, caption with the title), a small bounce, a slow drift.
Timeline `FB_T` (design frames, 4 s card); sound cues `FB_CUES`; camera pushes in on each tap. `FB_LINK_TEXT` is cosmetic: edit it to match your real comment.
Checked: typecheck, and the card rendered as a frame sequence and looked at stage by stage (bar tap, comments open, link tap, video open, hold).
Not checked: a full render with sound, Shorts 2-7 (same component). Needs the real pinned comment on every Reel, or the demo promises something that is not there.

## Instagram end card: bio link -> link page (`InstagramEndCard`, `src/shots/Short1.tsx`)
Instagram comments are not tappable, so the card shows the real path: the link in the bio.
1. The profile in Instagram dark mode: avatar, `payranked.official`, `PayRanked`, Follow / Message, the bio and the bio link. **No post / follower / following counts.**
2. A touch point taps the bio link (rings, press, click); the link grows into an in-app browser (close button + address bar).
3. It shows your actual link page (`PayRanked_link_page_preview.html`): brand film poster, "Data-backed finance", tagline, mint "Subscribe on YouTube", then a swipe scrolls to "Latest video" with the newest long video (thumbnail, "Newest" tag, title).
- `public/linkpage-poster.jpg` is the page's own poster image, extracted from that file (the og:image).
- `IG_HANDLE`, `IG_NAME`, `IG_BIO`, `IG_LINK_TEXT` are at the top of the Instagram section. **`IG_LINK_TEXT` (`payranked.com/links`) is a placeholder**: set it to the exact link text your bio shows.
- The page lists videos live from your channel; the card can only show the one video it knows (the long video). It never shows invented videos.
- Removed the old static end card (`SocialEndCard`, `CTA_T`, `CTA_CUES`, `PREVIEW_ROWS`, `CTA_LINE`): nothing used it any more.
- Checked: typecheck, and the card rendered as a frame sequence and looked at stage by stage (profile, tap, page opening, scroll, hold). Not checked: a full render with sound; Shorts 2-7 (same component).
