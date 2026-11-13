# Shorts 2-7: first-second hook + the same end card as Short 1

## What changed
- **Hook line (Shorts 2, 3, 4, 5, 7)**: one line in the headline area (y 180-400, below the Shorts shelf), in at 0.1 s and out at ~2.6 s,
  on a soft dark band so it reads over the 3D map. It names no state and gives no answer; the slam still pays it off.
  Short 6 gets none: it already opens on "So who actually wins?".
- **End card (Shorts 1-7)**: one shared, animated card (`Short1EndCard`): background fades in, "Full ranking + #1" rises word by word from behind a mask, a mint rule draws under it, "on my channel" rises and pulses once, slow scale drift; soft `pop` and `ding_hi` cues. 3.5 s long, added after each of Shorts 2-7 (Short 1 already had its slot, so it now animates too).
  Each Short is therefore 3.5 s longer. The music fades out over the first 1.5 s of the card.
- Render workflows: `TOTAL` frame counts updated for the new lengths (Short 1's `TOTAL` was 2640, the composition is 2652 frames: fixed too).
- Preview workflow: extra stills at 0.8 s / 1.5 s (hook) and at the end card.

## Hooks (each checked against src/data/states.json)
| Short | Hook | Backing data |
|---|---|---|
| 2 | Two states tie. Both beat California by $20K. | Kansas $111,027 and Nebraska $110,984 vs California $90,318: about $20.7K |
| 3 | Texas isn't even top 25. | Texas is #26 |
| 4 | Highest sales tax in the US, and still #5. | Louisiana, 10.11% (fact in states.json), rank 5 |
| 5 | Cheap doesn't mean you'd earn $100K there. | Moved up from the "Prices, not pay" break |
| 7 | Try this with your own salary. | The "your turn" formula appears later in the Short |

Wording lives in `SHORT_HOOKS` (`src/shots/ShortOverlays.tsx`); edit one line to change a hook.

## Needs your eyes (not verified here)
- **Not rendered.** The headless browser can't be downloaded in this environment; `npm run typecheck` passes. Run the
  `Preview vertical Shorts (stills)` workflow and look at the 0.8 s / 1.5 s stills (hook clear of the map and the rank slam?) and the last still of each Short.
- Short 3's hook (Texas) is paid off by the "Not on this list" break that follows #7 inside the Short. Confirm that break is inside the 40 s window.
- Short 1 says California feels like $90,300; the data gives $90,318. Short 3's #8 bar was reported as $90,251, which does not match either: check it.
- Instagram / Facebook: the end line says "on my channel", so keep the matching pinned comment / link on each platform.

## Shorts 6 and 7: dead air removed, cards keep moving
In the long video each profile card is up for 25 s but the voice reads it for about 10 s (card 1: 5.3-16.6 s, card 3: 55.3-65.1 s of Shot 5.5),
so the rest was a still card in silence: about 14 s in Short 6 and 15 s in Short 7. Fixed two ways:
- **Cut the silence.** Short 6 is now 19 s (hook + the remote-worker card while it is read; was 30 s). Short 7 is 22 s (was 45 s): the
  early-career card while it is read (12.5 s), then straight to the formula (9.5 s). `ShortSpec.parts` in `Root.tsx` plays source windows
  back to back; voice-over and music follow each part, with a short fade at the join. Render `TOTAL`s are 1350 (Short 6) and 1530 (Short 7), end card included.
- **Motion while a card is up (vertical only, the 16:9 video is unchanged):** the card drifts slowly toward the viewer, the headline glow
  breathes, and the body text appears one sentence at a time (second sentence 5.5 s after the first).
- Not verified: where exactly each cut lands against the voice (read the stills at 12.5 s and 14 s for Short 7, and listen to the join).

## Animated hooks (Shorts 3 and 4 first): `src/shots/HookKit.tsx`
The hook now shows the claim instead of captioning it. Shared kit: dark scrim, 2-3 frame flash and a short damped shake on impact,
words that land one by one with overshoot and blur, soft sound cues (pop, riser into hit). About 3.4 s. Numbers come from `src/data`.
- **Short 3 (Texas):** a "TEXAS" label, the rank runs #1 -> #26 on the odometer curve (mint to red) while a marker runs a 50-place track
  and stops one place outside the mint "TOP 25" zone. Impact at 1.5 s (flash, shake, hit), then "Texas isn't even top 25."
- **Short 4 (Louisiana):** "LOUISIANA SALES TAX", the tax runs 0 -> 10.11% (parsed from the fact line) up a red meter, a "#5" stamp hits
  at 1.5 s, then the line lands. "HIGHEST IN THE US" tags the meter's end.
- Short 6 keeps its own opening ("So who actually wins?"). Shorts 2, 5 and 7 are below.
- Not rendered. Check the stills at 0.4-3.2 s: the text must clear the 3D map, and the rank slam of the reveal underneath (its top reaches
  about y 600 for the first second) must not fight the hook.

### Shorts 2, 5 and 7 (same kit)
- **Short 2 (tie):** "TIED FOR #10"; KANSAS and NEBRASKA slide in from opposite sides; "$100,000 BUYS" runs up to $111,000 (from the data, both
  states round to the same figure); an amber "=" slams between the names at the impact; line: "Two states tie. Both beat California by $20K."
  (the $20K is the data's gap rounded down to $1K: Nebraska $110,984 vs California $90,318 = $20,666).
- **Short 5 (cheap is not a $100K job):** "CHEAP STATE"; $100,000 runs up in mint; at the impact a red bar strikes it out, the figure greys,
  a red "?" lands; line: "Cheap doesn't mean you'd earn $100K there."
- **Short 7 (own salary):** compact, because the profile card sits from y 400: "YOUR SALARY", a box types "$100,000" with a cursor and tick sounds,
  "÷ (RPP ÷ 100)" slams in below it, line: "Try this with your own salary." The card shows through while it plays, but its entrance
  (first second) is behind the hook: check the 1-3 s stills.

## End card per platform
Every Short now renders in two versions. Only the end line differs; the picture, voice and hook are identical.

| Platform | Composition | End line | How the viewer gets there |
|---|---|---|---|
| YouTube | `ShortN-Vertical` | Full ranking + #1 / **on my channel** | related-video button + pinned comment with the long-video link |
| Instagram, Facebook | `ShortN-Vertical-Social` | Full ranking + #1 / **link in comments** (chevron points down, bobs) | first comment with the long-video link |

Render with the `Render Short N` workflow: new input `variant` (`youtube` default, or `social`). Social renders get `-social` in the
composition id and file name (`short2-vertical-social.mp4`), so the two never overwrite each other.

Posting copy (suggestion): YouTube pinned comment `Full ranking + #1: <link>`. Instagram and Facebook first comment `Full ranking + #1: <link>`,
posted right after the Short goes live, because the card promises it. Check on your phone whether the link is tappable on each platform:
on Instagram, links in comments are, as far as I know, not tappable, so viewers would have to copy it. If that proves true, change the
social line (`CTA_LINE` in `src/shots/Short1.tsx`), for example to "search PayRanked on YouTube".

## Short 1 welcome card and a better end card
- **"Welcome to PayRanked" (Short 1, 27-33.3 s, vertical only; the 16:9 video is unchanged):** it was a caption in the top third of an
  empty frame. It is now a centred title card: "WELCOME TO" label, "Pay" (white) + "Ranked" (mint) letter by letter at 176 px, a mint rule
  that draws under it, then the promise in two lines with "money actually buys" in mint. It drifts slowly and lifts away as the gauge arrives.
- **End card (all Shorts, both variants):** now shows a small preview of the long video: a video-style card with the title
  "Where does $100,000 go the furthest?", the countdown rows #10 to #6 filling one after another (names and dollars from `src/data`), a
  locked amber "#1 ? ? ?" row (the Shorts never give the winner away) and a progress line with a timecode (length from the timeline).
  Under it: "Full ranking + #1", a rule, and the platform line ("on my channel" / "link in comments" with the bobbing chevron).
  It is built from the video's own data and style, not footage. To use real footage, a short clip would have to be rendered from
  `Video1` and dropped into `public/`; say so and I will wire it in.
- Not rendered. Check the Short 1 stills at 27.5-33 s and 41.2-44 s: "PayRanked" must fit inside the frame on one line, and the card must
  clear the Shorts UI (the card ends at about y 880, the line at about y 1300).

## End card v3: kinetic headline and a "Related video" button (YouTube)
- **Headline (both versions):** "Full ranking + #1" now lands word by word with an overshoot; "#1" slams in larger in mint with a flash,
  a hit sound and a glow, then a light sweeps across the line once.
- **YouTube version:** the plain line "on my channel" is replaced by a button that looks like YouTube's "Related video" button (mint pill with a play
  triangle). It rises, a touch point glides in and taps it (press, two expanding rings, click sound), then "tap the button below" with an arrow
  that bobs toward the bottom-left, where I believe the real button sits in the Shorts player. **Check on your phone where the real button
  appears and whether the label says "Related video"**; move the arrow or change `CTA_LINE.youtube` in `src/shots/Short1.tsx` if not.
- **Instagram / Facebook version:** a "link in comments" bubble with a pointer and a bobbing chevron.
- Timing: the tap lands at 2.9 s of the 3.5 s card, so it holds about 0.6 s after. If that is too short, `SHORT1_CTA_SECONDS` can grow
  (the render `TOTAL`s would need the same change).

## End card v4 (YouTube): the real "Related video" button, demonstrated
The YouTube end card is now a demo of the real thing (the bottom of a Short shows the channel row and, under it, a dark pill with a play triangle
and the long video's title). Layout and timing (3.5 s): "Full ranking + #1" lands with the "#1" slam (0-0.9 s); a black panel slides up with
the avatar ("P" mark), `@PayRanked` and a white Subscribe pill, then the dark "Related video" pill with the title (1.0-1.6 s); a touch point
glides in and taps the pill (2.0 s: press, rings, click); the long video's thumbnail opens out of the pill and fills the panel with a play
badge and the video length (2.0-2.7 s); hold to the end. No description line, no "earns commission".
- **Real assets:** `public/profile.png` (the "P" profile, round avatar) and `public/thumbnail.jpg` (the real 1280x720 thumbnail, opened by the tap).
  Title: "Your $100K Is Worth Up to $115K in These 10 States (Ranked)" (`LONG_VIDEO_TITLE`). On a phone the pill cuts a long title with "..."; the
  card does the same with CSS (32 px type in an 800 px pill), so it reads "Your $100K Is Worth Up to $115K in These 10 S…" or close to it.
  Check the cut in the Studio: if it cuts too early or too late, change the font size on the title line in `YouTubeEndCard`.
- The Instagram / Facebook end card is unchanged (countdown preview card + "link in comments" bubble).

## End card v5 (YouTube): cinematic tap, one continuous morph, 4 s card
- **Camera:** pushes in 10% toward the button from 1.7 s, taps at 2.27 s, pulls back as the thumbnail opens, then drifts slowly.
- **Tap:** the touch point has a soft shadow that tightens on the press; the button gets a clear pressed state (lighter grey, scale 0.94), two rings.
- **One continuous move:** the Related video pill IS the thumbnail: on the tap it stretches (height 84 -> 450, corners 42 -> 18) while the
  title fades out and the thumbnail fades in inside it; the channel row fades away. It lands with a small damped bounce, then drifts slowly
  (slight zoom and pan); the play badge pulses gently.
- **Sound (existing library, not heard here):** low thud (`hit_big`) on the "#1" slam, `tap_0` + `click` on the tap, `whoosh_m` as it opens,
  `shimmer` as it lands.
- **Timing:** the end card is now 4 s (`SHORT1_CTA_SECONDS`), every render `TOTAL` is +30 frames (Short 1 2682, 2 3540, 3 2640, 4 3240,
  5 2640, 6 1380, 7 1560). Easing: one `settle` curve with a small overshoot on arrivals in the demo.
- **Loop:** the last 10 frames fade to the navy the Shorts start on, so the loop restarts cleanly. Applies to the Instagram / Facebook card too (it holds 0.5 s longer).
- **Focus:** removed the glow around the panel, quieter glow on "#1"; the Related video button gets a soft white pulse before the tap, so it is the brightest thing.
- Not verified (not rendered): the camera push must not push the headline out of frame, and the morph must not show the title and thumbnail
  at the same time. Check the stills at 2.0, 2.3 s, 2.5 s, 2.8 s, 3.1 s and the last frame of the card.

## Short 1 without the "Welcome to PayRanked" clip
- Short 1 no longer contains the welcome line at all (voice-over clip 005, its title card, its sounds). After the cold open (27 s) the Short
  goes straight to the method opener at the gauge: Shot 3 is entered 6.3 s in (`SHORT1_METHOD_SKIP`), voice clip 006 onward, music and sound
  cues shifted by the same 6.3 s. The long video (Video1) keeps its welcome as before.
- Short 1 is now 38.4 s (was 44.7 s): 27 s cold open + 7.4 s method (ends where it did, at 13.7 s of Shot 3) + 4 s end card. Render `TOTAL`
  for Short 1 is 2304 frames. The vertical-only centred welcome card I built earlier is removed (it was dead code).
- Check: the join at 27 s (cold open to the gauge drawing in) and that the first voice word of clip 006 is not clipped (stills 26, 27.3, 28.5 s).
