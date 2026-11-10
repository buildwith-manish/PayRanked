/**
 * Fontshare Premium Fonts — Remotion Loader
 * ==========================================
 * Fonts: Satoshi, Clash Display (Fontshare) + Plus Jakarta Sans, JetBrains Mono (Google)
 * License: 100% free, lifetime commercial use, no subscription lock-in
 *
 * SETUP:
 * 1. npm install @remotion/google-fonts
 * 2. Font files already in: public/fonts/fontshare/{satoshi,clash-display,general-sans,cabinet-grotesk}/
 * 3. Import this file in your root composition:
 *    import "./fontshare/load-fonts";
 * 4. Use in components:
 *    style={{ fontFamily: PAYRANKED_FONTS.body }}
 */

import {staticFile} from "remotion";

// Self-hosted Fontshare fonts loaded via staticFile() so Remotion's webpack doesn't try to resolve the
// absolute /fonts/... URLs in fonts.css at build time. The @font-face rules are injected at runtime instead.
const FONT_BASE = "fonts/fontshare";
const fontFaceCSS = `
@font-face {
  font-family: "Satoshi";
  src: url("${staticFile(`${FONT_BASE}/satoshi/Satoshi-Variable.woff2`)}") format("woff2-variations");
  font-weight: 300 900;
  font-display: swap;
  font-style: normal;
}
@font-face {
  font-family: "Satoshi";
  src: url("${staticFile(`${FONT_BASE}/satoshi/Satoshi-VariableItalic.woff2`)}") format("woff2-variations");
  font-weight: 300 900;
  font-display: swap;
  font-style: italic;
}
@font-face {
  font-family: "Clash Display";
  src: url("${staticFile(`${FONT_BASE}/clash-display/ClashDisplay-Variable.woff2`)}") format("woff2-variations");
  font-weight: 200 700;
  font-display: swap;
  font-style: normal;
}
@font-face {
  font-family: "General Sans";
  src: url("${staticFile(`${FONT_BASE}/general-sans/GeneralSans-Variable.woff2`)}") format("woff2-variations");
  font-weight: 300 700;
  font-display: swap;
  font-style: normal;
}
@font-face {
  font-family: "General Sans";
  src: url("${staticFile(`${FONT_BASE}/general-sans/GeneralSans-VariableItalic.woff2`)}") format("woff2-variations");
  font-weight: 300 700;
  font-display: swap;
  font-style: italic;
}
@font-face {
  font-family: "Cabinet Grotesk";
  src: url("${staticFile(`${FONT_BASE}/cabinet-grotesk/CabinetGrotesk-Variable.woff2`)}") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
  font-style: normal;
}
@font-face {
  font-family: "Cabinet Grotesk Static";
  src: url("${staticFile(`${FONT_BASE}/cabinet-grotesk/CabinetGrotesk-Extrabold.woff2`)}") format("woff2");
  font-weight: 800;
  font-display: swap;
  font-style: normal;
}
@font-face {
  font-family: "Cabinet Grotesk Static";
  src: url("${staticFile(`${FONT_BASE}/cabinet-grotesk/CabinetGrotesk-Black.woff2`)}") format("woff2");
  font-weight: 900;
  font-display: swap;
  font-style: normal;
}
`;
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = fontFaceCSS;
  document.head.appendChild(style);
}

import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

const jakarta = loadJakarta("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
});

const jetbrainsMono = loadJetBrainsMono("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin", "latin-ext"],
});

export const PAYRANKED_FONTS = {
  body: "Satoshi, Plus Jakarta Sans, system-ui, sans-serif",
  numbers: `'JetBrains Mono', 'Courier New', monospace`,
  heading: `'Plus Jakarta Sans', Satoshi, system-ui, sans-serif`,
  display: "'Clash Display', Satoshi, sans-serif",
} as const;

export const QUIZ_FONTS = {
  body: "'General Sans', Plus Jakarta Sans, system-ui, sans-serif",
  heading: "'Cabinet Grotesk', Plus Jakarta Sans, system-ui, sans-serif",
  display: "'Clash Display', General Sans, sans-serif",
  numbers: `'JetBrains Mono', monospace`,
} as const;

export const FONT_SIZES = {
  heroTitle: 96,
  stateName: 64,
  rankingNumber: 120,
  bodyText: 32,
  caption: 24,
  statNumber: 80,
  questionText: 56,
  optionText: 36,
  scoreNumber: 100,
} as const;

export const FONT_WEIGHTS = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const GOOGLE_FONTS = {
  plusJakartaSans: jakarta.fontFamily,
  jetbrainsMono: jetbrainsMono.fontFamily,
};

export const FONTSHARE_FONTS = {
  satoshi: "Satoshi",
  clashDisplay: "Clash Display",
  generalSans: "General Sans",
  cabinetGrotesk: "Cabinet Grotesk",
};
