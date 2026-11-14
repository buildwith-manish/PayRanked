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
