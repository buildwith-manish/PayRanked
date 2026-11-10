import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing} from 'remotion';
import {W, H} from '../theme';

/**
 * PayRanked video watermark.
 *
 * Renders the official channel logo (P + green bars, no concentric circles)
 * in the bottom-right corner of every shot. The full version with circles
 * lives at `public/watermark/payranked-logo-full.png` and is reserved for
 * large-format surfaces (channel profile, banner, intro, thumbnails) where
 * the rings have room to breathe.
 *
 * Behaviour:
 *   - Fades in at frame 150 (5s @ 30fps design clock) so it never competes
 *     with the cold-open hook in Shot 1.
 *   - Sits at 60% opacity through the body.
 *   - Fades out 18s before the end so it never covers the end-screen CTA
 *     in Shot 6.
 *   - Gentle 2% scale drift over a 20-second cycle so it never reads as
 *     a frozen overlay (static elements feel like buffering).
 *
 * Source files (committed to the repo, original PNGs untouched):
 *   - public/watermark/payranked-watermark.png     800×800 RGBA, no circles
 *   - public/watermark/payranked-logo-full.png     800×800 RGBA, with circles
 *
 * Resize happens in the renderer (browser/Puppeteer) at draw time, so the
 * PNG is committed at full resolution and quality is preserved end-to-end.
 */

const FADE_IN_START = 150;            // 5s @ 30fps design clock
const FADE_IN_DUR = 30;               // 1s fade
const FADE_OUT_BEFORE_END = 18 * 30;  // 18s before end @ 30fps
const FADE_OUT_DUR = 30;              // 1s fade

const SIZE_PX = 80;                   // 80×80 on a 1920×1080 frame
const MARGIN_PX = 40;                 // 40px inset from bottom-right
const MAX_OPACITY = 0.6;              // 60% — visible but never distracting
const DRIFT_AMPLITUDE = 0.02;         // 2% scale drift
const DRIFT_PERIOD_FRAMES = 20 * 30;  // 20-second cycle

export const Watermark: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Fade in: 0 -> MAX_OPACITY over FADE_IN_DUR, starting at FADE_IN_START
  const fadeIn = interpolate(frame, [FADE_IN_START, FADE_IN_START + FADE_IN_DUR], [0, MAX_OPACITY], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Fade out: MAX_OPACITY -> 0 over FADE_OUT_DUR, ending FADE_OUT_BEFORE_END before end
  const fadeOutStart = durationInFrames - FADE_OUT_BEFORE_END;
  const fadeOut = interpolate(frame, [fadeOutStart, fadeOutStart + FADE_OUT_DUR], [MAX_OPACITY, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });

  // Combined opacity is the lower of the two (one fades in, the other fades out)
  const opacity = Math.min(fadeIn, fadeOut);

  // Subtle scale drift: 1 -> 1.02 -> 1 over DRIFT_PERIOD_FRAMES
  const scale = 1 + DRIFT_AMPLITUDE * Math.sin((frame / DRIFT_PERIOD_FRAMES) * Math.PI * 2);

  // Don't render anything when fully transparent (saves a paint cycle)
  if (opacity <= 0.001) return null;

  return (
    <AbsoluteFill style={{pointerEvents: 'none', zIndex: 50}}>
      <Img
        src={staticFile('watermark/payranked-watermark.png')}
        style={{
          position: 'absolute',
          bottom: MARGIN_PX,
          right: MARGIN_PX,
          width: SIZE_PX,
          height: SIZE_PX,
          opacity,
          transform: `scale(${scale})`,
          // Soft drop shadow keeps the logo legible on any background
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
        }}
      />
    </AbsoluteFill>
  );
};
