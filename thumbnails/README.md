# PayRanked thumbnails

Everything for thumbnails lives in three places:

| What | Where |
|---|---|
| Design data (text, which man, which objects, where) | `src/thumbnails/specs.ts` (the only file to edit for a new thumbnail) |
| Template (layout, outline, glow, auto-fit text) | `src/thumbnails/Thumbnail.tsx` |
| Pictures | `public/thumbnails/` |
| Ready-to-upload exports (1080x1920 JPG) | `thumbnails/exports/` |

## Render

```bash
bash thumbnails/render.sh        # all seven -> thumbnails/exports/shortN-thumbnail.jpg
bash thumbnails/render.sh 3      # just Short 3
npm run dev                      # Studio: compositions "Short1-Thumbnail" ... "Short7-Thumbnail"
```

## The cover frame inside every Short

The last `THUMB_END_FRAMES` (12 real frames = 0.2 s) of every Short are the thumbnail. They replace the end of the end card, so
the Short's length and the `TOTAL=` in `.github/workflows/render-short*.yml` do not change. In YouTube Studio drag the cover
slider to the very end of the video; every one of those frames is identical. Shorts 1-7 all do this (`Root.tsx`).
To upload a custom image instead, use the file in `thumbnails/exports/`.

## Picture naming (so future videos plug in without code changes)

- `man-<reaction>.jpg`: same man, flat pure-black background, 9:16. Current: amazed, shocked, thinking, warning, intense, skeptical.
  After adding one, add its head-top fraction to `HEAD_TOP` in `specs.ts` (how far down the picture the top of the head is).
- `obj-<thing>.jpg`: one gold or money object on pure black, 9:16. Current: question, arrow-up, trophy, coins, money-tower.
- `bg-<name>.jpg`: empty 9:16 background, no objects.
- Black backgrounds disappear because layers use `mix-blend-mode: screen`; never use gray or white backgrounds.

## The CTR checklist every thumbnail follows

1. **One idea, three elements at most:** a face, one big number or phrase, a few small words. It must read at 120 px wide.
2. **A face with a clear emotion, eyes to camera.** Different reaction per video so a channel page does not look repetitive.
3. **Curiosity gap:** pose the question, leave the answer for the video ("#26", "$100K?", "WINNER?"). Never reveal the answer.
4. **Specific numbers beat vague words** ($90K, +$20K, #26, #5).
5. **Loss framing:** the struck-through $100K next to $90K shows what you lose, which pulls harder than what you gain.
6. **Contrast and colour code:** gold = rank or status, mint = gain, red = warning or loss. Brightest thing in the frame is the number.
7. **Dark outline on all text** so it survives tiny sizes and bright feeds.
8. **Safe zone:** key content between y 300 and 1500 (the channel grid crops to about 3:4).
9. **Honest:** every claim is the one the Short's hook makes. Clickbait that the video does not pay off lowers retention, and retention is what Shorts are ranked on.
10. **Test:** shrink the PNG to thumbnail size and squint; if the number or the face is not obvious, simplify.
