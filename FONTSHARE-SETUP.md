# Fontshare Premium Fonts

**100% free, lifetime commercial rights, no subscription lock-in.**

## Fonts included

| Font | Stack | Use |
|------|-------|-----|
| Clash Display | `PAYRANKED_FONTS.display` | Rank numbers, headings |
| Satoshi | `PAYRANKED_FONTS.body` | Body copy, labels |
| General Sans | `QUIZ_FONTS.body` | Quiz channel body text |
| Cabinet Grotesk | `QUIZ_FONTS.heading` | Quiz channel headings |
| Plus Jakarta Sans | fallback / `GOOGLE_FONTS.plusJakartaSans` | Google Fonts fallback |
| JetBrains Mono | `GOOGLE_FONTS.jetbrainsMono` | Monospaced numbers |

Source: <https://www.fontshare.com> · License: free, lifetime commercial use

---

## Status — already wired up ✓

The fonts are already active. No manual steps are needed to use them:

- **`public/fonts/fontshare/`** — self-hosted `.woff2` files (committed to the repo)
- **`src/fontshare/fonts.css`** — `@font-face` declarations pointing to those files
- **`src/fontshare/load-fonts.ts`** — imports the CSS and runs the `@remotion/google-fonts`
  loaders for Plus Jakarta Sans and JetBrains Mono
- **`src/Root.tsx`** — `import './fontshare/load-fonts'` at the top triggers everything
  before any composition renders
- **`src/theme.ts`** — `F.display` and `F.body` are now sourced from `PAYRANKED_FONTS`

The old Poppins and Inter `loadFont` calls have been removed from `theme.ts`.

---

## Using the font stacks in a component

```tsx
// Preferred: use the tokens already in theme.ts
import { F } from '../theme';
<div style={{ fontFamily: F.display }}>  {/* Clash Display */}
<div style={{ fontFamily: F.body }}>     {/* Satoshi */}

// Or import the stacks directly for a new channel / composition
import { PAYRANKED_FONTS, QUIZ_FONTS } from '../fontshare/load-fonts';
<div style={{ fontFamily: PAYRANKED_FONTS.numbers }}>$78,400</div>
<div style={{ fontFamily: QUIZ_FONTS.heading }}>Question 1</div>
```

---

## Font files

```
public/fonts/fontshare/
├── satoshi/
│   ├── Satoshi-Variable.woff2
│   └── Satoshi-VariableItalic.woff2
├── clash-display/
│   └── ClashDisplay-Variable.woff2
├── general-sans/
│   ├── GeneralSans-Variable.woff2
│   └── GeneralSans-VariableItalic.woff2
└── cabinet-grotesk/
    ├── CabinetGrotesk-Variable.woff2
    ├── CabinetGrotesk-Extrabold.woff2
    └── CabinetGrotesk-Black.woff2
```

`@remotion/google-fonts` is already in `package.json` (installed alongside
the existing Remotion packages) — no extra `npm install` needed.

---

## Why Fontshare, not Adobe Fonts

Adobe Fonts lock you into a $20+/month subscription forever; cancelling means
you can no longer render new videos. Fontshare gives you the same premium
quality with **lifetime rights** — zero subscription risk.
