import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Shot1} from './Shot1';
import {Shot3} from './Shot3';
import {C, F, sec} from '../theme';
import {useDesignFrame} from '../clock';
import {MaskLine, MaskWords} from '../components/MaskText';
import {SfxTrack} from '../audio/Sfx';
import {Cue} from '../audio/cues';
import {glide, ramp, snap} from '../motion';

// 13.7 s (was 13.5): clip 006 "...A hundred is the national average." is silent from 7.80 s to 8.12 s (measured on the WAV), and 13.7 s lands the cut
// at 7.82 s into the clip. 13.5 s cut inside "average"; the next beat (needle to California) starts at 13.72 s, so the picture stays clean.
export const SHORT1_METHOD_SECONDS = 13.7;
export const SHORT1_CTA_SECONDS = 3.5;
export const SHORT1_FRAMES = sec(27 + SHORT1_METHOD_SECONDS + SHORT1_CTA_SECONDS);

/**
 * The end card, shared by every Short (1-7), so each one ends the same way. It animates in on the video's own motion language:
 * background fades in, "Full ranking + #1" rises word by word from behind a mask, a mint rule draws under it, then "on my channel"
 * rises and pulses once. Frames are design frames (30 fps) local to the card (SHORT1_CTA_SECONDS = 3.5 s = 105 frames).
 */
const CTA_T = {title: 6, rule: 24, sub: 30, pulse: 52};
// Sound cues are local to the card. The offset is far past the voice-over envelope, so the voice ducking never touches them.
const CTA_CUES: Cue[] = [
  {sfx: 'pop', at: CTA_T.title + 6, gain: 0.35, hero: true},
  {sfx: 'ding_hi', at: CTA_T.sub + 8, gain: 0.3, hero: true},
];

/** Which end line a render carries: 'youtube' = "on my channel" (the related-video button and pinned comment do the linking);
 *  'social' = Instagram and Facebook, where there is no related-video button, so the card says "link in comments" and points down. */
export type CtaVariant = 'youtube' | 'social';
export const CTA_LINE: Record<CtaVariant, string> = {youtube: 'on my channel', social: 'link in comments'};

export const Short1EndCard: React.FC<{variant?: CtaVariant}> = ({variant = 'youtube'}) => {
  const f = useDesignFrame();
  const fade = ramp(f, 0, 10);
  const rule = ramp(f, CTA_T.rule, CTA_T.rule + 16, glide);
  // one soft pulse on the rule and the sub line, so the card keeps moving after everything has landed
  const pulse = Math.sin(Math.PI * ramp(f, CTA_T.pulse, CTA_T.pulse + 24));
  const drift = 1 + 0.025 * ramp(f, 0, 105);
  const pop = snap(ramp(f, CTA_T.sub, CTA_T.sub + 14));
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${C.navy1} 0%, ${C.navy2} 55%, ${C.navy3} 100%)`, opacity: fade}}>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 120, transform: `scale(${drift})`}}>
        <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 104, lineHeight: 1.12, color: C.text}}>
          <MaskWords text="Full ranking + #1" start={CTA_T.title} step={5} dur={18} />
        </div>
        <div style={{marginTop: 30, height: 8, width: 520 * rule, borderRadius: 4, background: C.mint, boxShadow: `0 0 ${24 + 30 * pulse}px ${C.mint}${pulse > 0.2 ? 'aa' : '66'}`}} />
        <div style={{marginTop: 30, fontFamily: F.body, fontWeight: 600, fontSize: 46, color: C.mint, transform: `scale(${1 + 0.06 * pulse})`, opacity: pop > 0 ? 1 : 0}}>
          <MaskLine start={CTA_T.sub} dur={16}>{CTA_LINE[variant]}</MaskLine>
        </div>
        {variant === 'social' && (
          // a chevron that points down toward the comments and bobs, so the card keeps moving until the end
          <div style={{marginTop: 46, width: 40, height: 40, borderRight: `10px solid ${C.mint}`, borderBottom: `10px solid ${C.mint}`, borderRadius: 3, opacity: ramp(f, CTA_T.sub + 14, CTA_T.sub + 26), transform: `translateY(${8 * Math.sin(f / 5)}px) rotate(45deg)`}} />
        )}
      </div>
      <SfxTrack cues={CTA_CUES} offset={10_000_000} />
    </AbsoluteFill>
  );
};
